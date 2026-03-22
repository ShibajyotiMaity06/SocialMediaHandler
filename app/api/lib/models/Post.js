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
      enum: ["draft", "scheduled", "publishing", "published", "failed"],
      default: "scheduled",
      required: true,
      index: true,
    },
    queue_job_id: {
      type: String,
      default: "",
      trim: true,
    },
    external_post_id: {
      type: String,
      default: "",
      trim: true,
    },
    last_error: {
      type: String,
      default: "",
      trim: true,
    },
    publish_attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
