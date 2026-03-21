import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adaptation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Adaptation",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
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
      default: "scheduled",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
