import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import getRazorpay from "../../lib/razorpay";
import getDodo from "../../lib/dodo";
import { resolvePaymentContext } from "../../lib/payment-context";
import { ADDON_PACKS, PLAN_PRICES } from "../../lib/helpers";
import {
  findActiveReferralCode,
  normalizeReferralCode,
  isValidReferralCodeFormat,
  isPaidSubscriptionTier,
  applyPercentDiscount,
} from "../../lib/referrals";

function getPaidDodoProductIds() {
  const paidTiers = ["growth", "creator", "pro", "agency"];
  return paidTiers
    .map((tier) => PLAN_PRICES[tier]?.dodoProductEnvKey)
    .filter(Boolean)
    .map((envKey) => process.env[envKey])
    .filter(Boolean);
}

async function ensureDodoReferralDiscountCode(code, discountPercent) {
  const dodo = getDodo();

  try {
    await dodo.discounts.retrieveByCode(code);
    return;
  } catch (error) {
    const status = error?.status || error?.statusCode;
    if (status !== 404) {
      throw error;
    }
  }

  const restrictedProductIds = getPaidDodoProductIds();
  await dodo.discounts.create({
    code,
    type: "percentage",
    amount: Math.round(discountPercent * 100),
    name: `Referral ${code}`,
    ...(restrictedProductIds.length
      ? { restricted_to: restrictedProductIds }
      : {}),
  });
}

// POST: Create a Razorpay order for the selected tier
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      tier,
      kind = "subscription",
      addonKey,
      currencyPreference,
      referralCode,
    } = await request.json();

    const paymentContext = resolvePaymentContext(request);
    const preferredCurrency =
      currencyPreference === "INR" || currencyPreference === "USD"
        ? currencyPreference
        : paymentContext.recommendedCurrency;
    const provider = preferredCurrency === "INR" ? "razorpay" : "dodo";

    if (kind === "subscription") {
      if (!tier || !PLAN_PRICES[tier]) {
        return NextResponse.json(
          { error: "Invalid plan selected" },
          { status: 400 }
        );
      }

      if (tier === "agency") {
        return NextResponse.json(
          { error: "Agency tier is coming soon and currently locked." },
          { status: 400 }
        );
      }
    } else if (kind === "addon") {
      if (!addonKey || !ADDON_PACKS[addonKey]) {
        return NextResponse.json(
          { error: "Invalid add-on selected" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid purchase kind" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({
      email: session.user.email.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const item = kind === "addon" ? ADDON_PACKS[addonKey] : PLAN_PRICES[tier];
    const normalizedReferralCode = normalizeReferralCode(referralCode);
    let referral = null;

    if (normalizedReferralCode) {
      if (!isValidReferralCodeFormat(normalizedReferralCode)) {
        return NextResponse.json(
          {
            error: "Referral code must be exactly 5 uppercase letters.",
          },
          { status: 400 }
        );
      }

      if (kind !== "subscription" || !isPaidSubscriptionTier(tier)) {
        return NextResponse.json(
          {
            error: "Referral codes are valid only for paid subscriptions.",
          },
          { status: 400 }
        );
      }

      referral = await findActiveReferralCode(normalizedReferralCode);
      if (!referral) {
        return NextResponse.json(
          {
            error: "Referral code is not present.",
          },
          { status: 400 }
        );
      }
    }

    const discountPercent = referral?.discount_percent || 0;
    const discountedAmountInPaise = referral
      ? applyPercentDiscount(item.amountInPaise, discountPercent)
      : item.amountInPaise;
    const discountedAmountInCents = referral
      ? applyPercentDiscount(item.amountInCents, discountPercent)
      : item.amountInCents;

    if (provider === "dodo") {
      const dodoProductId = process.env[item.dodoProductEnvKey || ""];
      if (!dodoProductId) {
        return NextResponse.json(
          {
            error: `Missing ${item.dodoProductEnvKey}. Set product IDs in environment for Dodo checkout.`,
          },
          { status: 500 }
        );
      }

      const proto = request.headers.get("x-forwarded-proto") || "https";
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
      const baseUrl = host ? `${proto}://${host}` : "https://www.vyralpro.xyz";
      const successType = kind === "addon" ? "addon_success" : "success";
      const returnUrl = `${baseUrl}/dashboard?payment=${successType}&provider=dodo`;

      if (referral) {
        await ensureDodoReferralDiscountCode(referral.code, discountPercent);
      }

      const checkoutPayload = {
        product_cart: [{ product_id: dodoProductId, quantity: 1 }],
        customer: {
          email: user.email,
          name: user.name || user.email,
        },
        billing_currency: "USD",
        return_url: returnUrl,
        metadata: {
          user_id: user._id.toString(),
          user_email: user.email,
          kind,
          tier: tier || "",
          addon_key: addonKey || "",
          addon_credits: String(item.credits || ""),
          referral_code: referral?.code || "",
          referral_discount_percent: String(discountPercent || ""),
          original_amount_cents: String(item.amountInCents || ""),
          charged_amount_cents: String(discountedAmountInCents || ""),
        },
      };

      if (referral) {
        checkoutPayload.discount_code = referral.code;
      }

      const checkoutSession = await getDodo().checkoutSessions.create(checkoutPayload);

      return NextResponse.json({
        provider: "dodo",
        currency: "USD",
        amount: discountedAmountInCents,
        original_amount: item.amountInCents,
        discount_percent: discountPercent || 0,
        referral_code: referral?.code || null,
        session_id: checkoutSession.session_id,
        checkout_url: checkoutSession.checkout_url,
        kind,
        tier: tier || null,
        addon_key: addonKey || null,
        addon_credits: item.credits || null,
        plan_name: item.label,
      });
    }

    // Razorpay receipt has a 40-char max length.
    const receipt = `rcpt_${String(user._id).slice(-8)}_${Date.now()
      .toString()
      .slice(-10)}`;

    // Create Razorpay order
    const order = await getRazorpay().orders.create({
      amount: discountedAmountInPaise,
      currency: "INR",
      receipt,
      notes: {
        user_id: user._id.toString(),
        user_email: user.email,
        kind,
        tier: tier || "",
        addon_key: addonKey || "",
        addon_credits: String(item.credits || ""),
        referral_code: referral?.code || "",
        referral_discount_percent: String(discountPercent || ""),
        original_amount_paise: String(item.amountInPaise || ""),
      },
    });

    return NextResponse.json({
      provider: "razorpay",
      order_id: order.id,
      amount: order.amount,
      original_amount: item.amountInPaise,
      discount_percent: discountPercent || 0,
      referral_code: referral?.code || null,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      kind,
      tier: tier || null,
      addon_key: addonKey || null,
      addon_credits: item.credits || null,
      plan_name: item.label,
    });
  } catch (error) {
    console.error("[CREATE ORDER ERROR]", error);
    const message =
      error?.error?.description || error?.message || "Failed to create order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
