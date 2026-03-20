import mongoose from "mongoose";

const UsageSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    videos_used: {
      type: Number,
      default: 0,
      min: 0,
    },
    videos_limit: {
      type: Number,
      default: 0,
      min: 0,
    },
    images_used: {
      type: Number,
      default: 0,
      min: 0,
    },
    images_limit: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

UsageSchema.index({ user_id: 1, month: 1 }, { unique: true });

export default mongoose.models.Usage || mongoose.model("Usage", UsageSchema);
