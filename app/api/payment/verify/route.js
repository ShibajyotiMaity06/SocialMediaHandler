import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Subscription from "../../lib/models/Subscription";
import Usage from "../../lib/models/Usage";
import getRazorpay from "../../lib/razorpay";
import {
  normalizeReferralCode,
  isValidReferralCodeFormat,
  recordReferralRedemption,
} from "../../lib/referrals";
import {
  ADDON_PACKS,
  getCurrentMonth,
  TIER_LIMITS,
  PLAN_PRICES,
} from "../../lib/helpers";

// POST: Verify Razorpay payment signature and activate subscription
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      tier,
      kind = "subscription",
      addonKey,
    } = await request.json();

    // Validate required fields
    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    if (kind === "subscription") {
      if (!tier || !PLAN_PRICES[tier]) {
        return NextResponse.json(
          { error: "Invalid plan selected" },
          { status: 400 }
        );
      }
    }

    if (kind === "addon") {
      if (!addonKey || !ADDON_PACKS[addonKey]) {
        return NextResponse.json(
          { error: "Invalid add-on selected" },
          { status: 400 }
        );
      }
    }

    // Step 5: Verify signature — hmac_sha256(order_id + "|" + payment_id, secret)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[PAYMENT VERIFY] Signature mismatch — possible tampering");
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    let razorpayOrder = null;
    try {
      razorpayOrder = await getRazorpay().orders.fetch(razorpay_order_id);
    } catch (orderFetchError) {
      console.error("[PAYMENT VERIFY] Failed to fetch Razorpay order", orderFetchError);
    }

    const referralCode = normalizeReferralCode(
      razorpayOrder?.notes?.referral_code || ""
    );
    const hasReferralCode = isValidReferralCodeFormat(referralCode);

    // Signature verified — payment is legit
    await dbConnect();

    const user = await User.findOne({
      email: session.user.email.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle image credit add-ons
    if (kind === "addon") {
      const addon = ADDON_PACKS[addonKey];
      const month = getCurrentMonth();
      const limits = TIER_LIMITS[user.tier] || TIER_LIMITS.free;

      const usage = await Usage.findOneAndUpdate(
        { user_id: user._id, month },
        {
          $setOnInsert: {
            user_id: user._id,
            month,
            videos_used: 0,
            videos_limit: limits.videos,
            images_used: 0,
            images_limit: limits.images,
          },
          $inc: { images_limit: addon.credits },
        },
        { upsert: true, returnDocument: "after" }
      );

      return NextResponse.json({
        success: true,
        message: `${addon.label} added successfully`,
        kind,
        addon_key: addonKey,
        added_credits: addon.credits,
        images_limit: usage.images_limit,
        images_used: usage.images_used,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    }

    // Handle ₹1 test checkout without changing live subscription tier.
    if (tier === "test") {
      return NextResponse.json({
        success: true,
        message: "Test payment verified",
        kind,
        tier,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    }

    // Step 6: Update/Create subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

    // Upsert subscription
    await Subscription.findOneAndUpdate(
      { user_id: user._id },
      {
        user_id: user._id,
        tier: tier,
        status: "active",
        current_period_start: now,
        current_period_end: periodEnd,
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        referral_code: hasReferralCode ? referralCode : null,
      },
      { upsert: true, returnDocument: "after" }
    );

    // Update user tier
    user.tier = tier;
    await user.save();

    // Reset usage limits for new tier
    const month = getCurrentMonth();
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    await Usage.findOneAndUpdate(
      { user_id: user._id, month },
      {
        user_id: user._id,
        month,
        videos_limit: limits.videos,
        images_limit: limits.images,
      },
      { upsert: true, returnDocument: "after" }
    );

    if (hasReferralCode) {
      const discountPercent = Number(
        razorpayOrder?.notes?.referral_discount_percent || 10
      );
      const originalAmountPaise = Number(
        razorpayOrder?.notes?.original_amount_paise || razorpayOrder?.amount || 0
      );
      const chargedAmountPaise = Number(razorpayOrder?.amount || 0);

      await recordReferralRedemption({
        referralCode,
        purchaserUserId: user._id,
        tier,
        paymentProvider: "razorpay",
        paymentReference: razorpay_payment_id,
        currency: "INR",
        amountOriginal: originalAmountPaise,
        amountCharged: chargedAmountPaise,
        discountPercent,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      tier: tier,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error("[PAYMENT VERIFY ERROR]", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
