import mongoose from "mongoose";
// models/userModel.js (add these fields to your existing schema)
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ['admin', 'guest','user'],
      default: 'user'
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Date,
      default: Date.now,
    },
    verificationToken: {
      type: String,
      default: "",
    },
    // Add these new fields for password reset
    passwordResetToken: {
      type: String,
      default: "",
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("DKUser", userSchema);
