import mongoose from "mongoose";

const ReferralRedemptionSchema = new mongoose.Schema(
  {
    referral_code_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReferralCode",
      required: true,
      index: true,
    },
    referral_code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 5,
      maxlength: 5,
      index: true,
    },
    purchaser_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["free", "test", "growth", "creator", "pro", "agency"],
      required: true,
    },
    payment_provider: {
      type: String,
      enum: ["razorpay", "dodo"],
      required: true,
      index: true,
    },
    payment_reference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      required: true,
    },
    amount_original: {
      type: Number,
      default: 0,
      min: 0,
    },
    amount_charged: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount_percent: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

ReferralRedemptionSchema.index(
  { payment_provider: 1, payment_reference: 1 },
  { unique: true }
);

export default mongoose.models.ReferralRedemption ||
  mongoose.model("ReferralRedemption", ReferralRedemptionSchema);
