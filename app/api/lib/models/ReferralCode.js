import mongoose from "mongoose";

const ReferralCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 5,
      maxlength: 5,
      match: [/^[A-Z]{5}$/, "Referral code must be 5 uppercase letters"],
      index: true,
    },
    owner_label: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    discount_percent: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
      max: 100,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    total_redemptions: {
      type: Number,
      default: 0,
      min: 0,
    },
    created_by_email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    collection: "rferralcodes",
  }
);

export default mongoose.models.ReferralCode ||
  mongoose.model("ReferralCode", ReferralCodeSchema);
