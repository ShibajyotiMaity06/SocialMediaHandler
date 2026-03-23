import { NextResponse } from "next/server";
import getDodo from "../../lib/dodo";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Subscription from "../../lib/models/Subscription";
import Usage from "../../lib/models/Usage";
import { ADDON_PACKS, getCurrentMonth, TIER_LIMITS } from "../../lib/helpers";
import {
  normalizeReferralCode,
  isValidReferralCodeFormat,
  recordReferralRedemption,
} from "../../lib/referrals";

function resolveWebhookMetadata(payload) {
  const data = payload?.data || {};
  return {
    eventType: payload?.type || "",
    paymentId: data.payment_id || data.id || "",
    orderId: data.checkout_id || data.checkout_session_id || "",
    userEmail: data.metadata?.user_email || data.customer?.email || "",
    tier: data.metadata?.tier || "",
    kind: data.metadata?.kind || "subscription",
    addonKey: data.metadata?.addon_key || "",
    referralCode: data.metadata?.referral_code || "",
    referralDiscountPercent: data.metadata?.referral_discount_percent || "",
    originalAmountCents: data.metadata?.original_amount_cents || "",
    chargedAmountCents: data.metadata?.charged_amount_cents || "",
  };
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const event = getDodo().webhooks.unwrap(rawBody, {
      headers: request.headers,
      key: process.env.DODO_WEBHOOK_SECRET,
    });

    const metadata = resolveWebhookMetadata(event);
    await dbConnect();

    if (
      metadata.eventType === "payment.succeeded" &&
      metadata.userEmail &&
      metadata.kind === "subscription" &&
      metadata.tier
    ) {
      const user = await User.findOne({ email: metadata.userEmail.toLowerCase() });
      if (user) {
        const referralCode = normalizeReferralCode(metadata.referralCode);
        const hasReferralCode = isValidReferralCodeFormat(referralCode);

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await Subscription.findOneAndUpdate(
          { user_id: user._id },
          {
            user_id: user._id,
            tier: metadata.tier,
            status: "active",
            current_period_start: now,
            current_period_end: periodEnd,
            payment_provider: "dodo",
            currency: "USD",
            dodo_payment_id: metadata.paymentId,
            dodo_checkout_session_id: metadata.orderId,
            referral_code: hasReferralCode ? referralCode : null,
          },
          { upsert: true }
        );

        user.tier = metadata.tier;
        await user.save();

        const month = getCurrentMonth();
        const limits = TIER_LIMITS[metadata.tier] || TIER_LIMITS.free;
        await Usage.findOneAndUpdate(
          { user_id: user._id, month },
          {
            user_id: user._id,
            month,
            videos_limit: limits.videos,
            images_limit: limits.images,
          },
          { upsert: true }
        );

        if (hasReferralCode && metadata.paymentId) {
          await recordReferralRedemption({
            referralCode,
            purchaserUserId: user._id,
            tier: metadata.tier,
            paymentProvider: "dodo",
            paymentReference: metadata.paymentId,
            currency: "USD",
            amountOriginal: Number(metadata.originalAmountCents || 0),
            amountCharged: Number(metadata.chargedAmountCents || 0),
            discountPercent: Number(metadata.referralDiscountPercent || 10),
          });
        }
      }
    }

    if (
      metadata.eventType === "payment.succeeded" &&
      metadata.userEmail &&
      metadata.kind === "addon" &&
      metadata.addonKey &&
      ADDON_PACKS[metadata.addonKey]
    ) {
      const user = await User.findOne({ email: metadata.userEmail.toLowerCase() });
      if (user) {
        const addon = ADDON_PACKS[metadata.addonKey];
        const month = getCurrentMonth();
        const limits = TIER_LIMITS[user.tier] || TIER_LIMITS.free;

        await Usage.findOneAndUpdate(
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
          { upsert: true }
        );
      }
    }

    if (
      ["payment.failed", "payment.cancelled"].includes(metadata.eventType) &&
      metadata.userEmail
    ) {
      const user = await User.findOne({ email: metadata.userEmail.toLowerCase() });
      if (user) {
        await Subscription.findOneAndUpdate(
          { user_id: user._id },
          {
            status: "past_due",
            payment_provider: "dodo",
            dodo_payment_id: metadata.paymentId,
            dodo_checkout_session_id: metadata.orderId,
          }
        );
      }
    }

    if (metadata.eventType === "payment.processing" && metadata.userEmail) {
      const user = await User.findOne({ email: metadata.userEmail.toLowerCase() });
      if (user) {
        await Subscription.findOneAndUpdate(
          { user_id: user._id },
          {
            payment_provider: "dodo",
            dodo_payment_id: metadata.paymentId,
            dodo_checkout_session_id: metadata.orderId,
          }
        );
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[DODO WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
