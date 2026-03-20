import mongoose from "mongoose";

const AdaptationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    video_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    video_title: {
      type: String,
      required: true,
      trim: true,
    },
    extracted_content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    platforms: {
      type: [String],
      default: [],
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Adaptation ||
  mongoose.model("Adaptation", AdaptationSchema);
