import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Optional: null for social (Google) users
    password: {
      type: String,
      default: null,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          // Allow empty strings (default) or valid HTTPS URLs
          return v === "" || /^https:\/\/.+/.test(v);
        },
        message: "Profile picture must be an HTTPS URL",
      },
    },

    // ── Verification ─────────────────────────────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Bcrypt-hashed OTP — never stored in plain text
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },

    // ── OAuth ─────────────────────────────────────────────────────────────────
    googleId: {
      type: String,
      default: null,
      sparse: true, // allows multiple null values in unique index
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
