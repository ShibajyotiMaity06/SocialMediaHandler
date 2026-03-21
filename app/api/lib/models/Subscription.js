import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    user_id: {
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
    status: {
      type: String,
      enum: ["active", "canceled", "past_due"],
      required: true,
      default: "active",
      index: true,
    },
    current_period_start: {
      type: Date,
      required: true,
    },
    current_period_end: {
      type: Date,
      required: true,
    },
    razorpay_subscription_id: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    razorpay_order_id: {
      type: String,
      default: "",
      trim: true,
    },
    razorpay_payment_id: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema);
