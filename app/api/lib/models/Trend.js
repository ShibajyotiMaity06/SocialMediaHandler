import mongoose from "mongoose";

const TrendSchema = new mongoose.Schema(
  {
    niche: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      default: "multi",
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      default: "",
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    type: {
      type: String,
      enum: ["manual", "youtube"],
      default: "manual",
      index: true,
    },
    source_video_id: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    source_url: {
      type: String,
      default: "",
      trim: true,
    },
    trend_score: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    examples: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    detected_at: {
      type: Date,
      default: Date.now,
    },
    published_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TrendSchema.index({ niche: "text", topic: "text", tags: "text" });
TrendSchema.index({ niche: 1, type: 1, detected_at: -1 });
TrendSchema.index({ detected_at: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.models.Trend || mongoose.model("Trend", TrendSchema);
