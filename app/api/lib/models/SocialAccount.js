import mongoose from "mongoose";

const SocialAccountSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["x"],
      required: true,
      index: true,
    },
    access_token_enc: {
      type: String,
      required: true,
      trim: true,
    },
    refresh_token_enc: {
      type: String,
      required: true,
      trim: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    token_type: {
      type: String,
      default: "bearer",
      trim: true,
    },
    scopes: {
      type: [String],
      default: [],
    },
    account_id: {
      type: String,
      default: "",
      trim: true,
    },
    username: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

SocialAccountSchema.index({ user_id: 1, platform: 1 }, { unique: true });

export default mongoose.models.SocialAccount ||
  mongoose.model("SocialAccount", SocialAccountSchema);