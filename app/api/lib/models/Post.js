import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    adaptation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Adaptation",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    selected_hook: {
      type: String,
      default: "",
      trim: true,
    },
    hashtags: {
      type: [String],
      default: [],
    },
    image_url: {
      type: String,
      default: "",
      trim: true,
    },
    scheduled_at: {
      type: Date,
      default: null,
      index: true,
    },
    published_at: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      default: "draft",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
