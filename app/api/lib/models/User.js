import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    tier: {
      type: String,
      enum: ["free", "growth", "creator", "agency"],
      default: "free",
    },
    stripe_customer_id: {
      type: String,
      default: "",
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    password: {
      type: String,
      // Not required for OAuth users
    },
    image: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
