import mongoose from "mongoose";

const TrendSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    trend_score: {
      type: Number,
      required: true,
      min: 0,
    },
    examples: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    detected_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Trend || mongoose.model("Trend", TrendSchema);
