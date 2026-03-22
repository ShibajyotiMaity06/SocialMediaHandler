import mongoose from "mongoose";

const OAuthStateSchema = new mongoose.Schema(
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
    state: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    code_verifier: {
      type: String,
      required: true,
      trim: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

OAuthStateSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OAuthState ||
  mongoose.model("OAuthState", OAuthStateSchema);