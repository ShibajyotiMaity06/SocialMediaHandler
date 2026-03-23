import ReferralCode from "./models/ReferralCode";
import ReferralRedemption from "./models/ReferralRedemption";
import mongoose from "mongoose";

export const REFERRAL_CODE_REGEX = /^[A-Z]{5}$/;
export const REFERRAL_DISCOUNT_PERCENT = 10;

export function normalizeReferralCode(value) {
  return String(value || "").trim().toUpperCase();
}

export function isValidReferralCodeFormat(value) {
  return REFERRAL_CODE_REGEX.test(normalizeReferralCode(value));
}

export function isPaidSubscriptionTier(tier) {
  return ["growth", "creator", "pro", "agency"].includes(String(tier || ""));
}

export function applyPercentDiscount(amount, discountPercent) {
  const safeAmount = Number(amount || 0);
  const safeDiscount = Number(discountPercent || 0);
  if (!Number.isFinite(safeAmount) || safeAmount <= 0) return 0;
  if (!Number.isFinite(safeDiscount) || safeDiscount <= 0) return Math.round(safeAmount);
  const discounted = safeAmount * (1 - safeDiscount / 100);
  return Math.max(0, Math.round(discounted));
}

async function findReferralCodeAcrossCollections(code, { activeOnly = false } = {}) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCodeFormat(normalized)) return null;

  const modelResult = await ReferralCode.findOne({
    code: normalized,
    ...(activeOnly ? { is_active: true } : {}),
  }).lean();

  if (modelResult) {
    return {
      ...modelResult,
      source_collection: "model",
    };
  }

  const db = mongoose.connection?.db;
  if (!db) return null;

  const collections = ["rferralcodes", "referralcodes"];

  for (const collectionName of collections) {
    const raw = await db.collection(collectionName).findOne({
      code: normalized,
      ...(activeOnly ? { is_active: true } : {}),
    });

    if (raw) {
      return {
        ...raw,
        source_collection: collectionName,
      };
    }
  }

  return null;
}

export async function findActiveReferralCode(code) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCodeFormat(normalized)) return null;

  return findReferralCodeAcrossCollections(normalized, { activeOnly: true });
}

export async function recordReferralRedemption({
  referralCode,
  purchaserUserId,
  tier,
  paymentProvider,
  paymentReference,
  currency,
  amountOriginal,
  amountCharged,
  discountPercent = REFERRAL_DISCOUNT_PERCENT,
}) {
  const normalized = normalizeReferralCode(referralCode);
  if (!isValidReferralCodeFormat(normalized)) {
    return { recorded: false, reason: "invalid_code_format" };
  }

  if (!purchaserUserId || !paymentProvider || !paymentReference) {
    return { recorded: false, reason: "missing_context" };
  }

  const referral = await findReferralCodeAcrossCollections(normalized);
  if (!referral) {
    return { recorded: false, reason: "referral_not_found" };
  }

  try {
    await ReferralRedemption.create({
      referral_code_id: referral._id,
      referral_code: normalized,
      purchaser_user_id: purchaserUserId,
      tier,
      payment_provider: paymentProvider,
      payment_reference: paymentReference,
      currency,
      amount_original: Number(amountOriginal || 0),
      amount_charged: Number(amountCharged || 0),
      discount_percent: Number(discountPercent || referral.discount_percent || REFERRAL_DISCOUNT_PERCENT),
    });

    if (referral.source_collection === "rferralcodes" || referral.source_collection === "referralcodes") {
      await mongoose.connection.db
        .collection(referral.source_collection)
        .updateOne({ _id: referral._id }, { $inc: { total_redemptions: 1 } });
    } else {
      await ReferralCode.updateOne(
        { _id: referral._id },
        { $inc: { total_redemptions: 1 } }
      );
    }

    return { recorded: true };
  } catch (error) {
    if (error?.code === 11000) {
      return { recorded: false, reason: "duplicate_payment_reference" };
    }

    throw error;
  }
}
