import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail, sendOtpEmail } from "../emails/emailHandlers.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
import { asyncHandler } from "../lib/asyncHandler.js";

// ── OTP helpers ───────────────────────────────────────────────────────────────

/** Generate a cryptographically random 6-digit integer OTP */
const generateOtp = () => crypto.randomInt(100_000, 999_999).toString();

/** Hash the plain OTP with bcrypt before storing */
const hashOtp = (plain) => bcrypt.hash(plain, 10);

/** OTP validity window: 10 minutes */
const OTP_EXPIRES_MS = 10 * 60 * 1000;

/** Minimum gap before a user can request a new OTP: 60 seconds */
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

// ── SIGNUP ────────────────────────────────────────────────────────────────────

export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    // If user exists but is unverified, allow them to re-enter the OTP flow
    if (!existingUser.isVerified) {
      const plain = generateOtp();
      existingUser.otp = await hashOtp(plain);
      existingUser.otpExpires = new Date(Date.now() + OTP_EXPIRES_MS);
      await existingUser.save();

      sendOtpEmail(existingUser.email, existingUser.fullName, plain).catch((err) =>
        console.error("[Email] Failed to re-send OTP:", err)
      );

      return res.status(200).json({
        requiresVerification: true,
        email: existingUser.email,
        message: "Account exists but is not verified. A new OTP has been sent.",
      });
    }
    return res.status(400).json({ message: "Email already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const plain = generateOtp();
  const hashedOtp = await hashOtp(plain);

  const newUser = new User({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    isVerified: false,
    otp: hashedOtp,
    otpExpires: new Date(Date.now() + OTP_EXPIRES_MS),
  });

  await newUser.save();

  // Send OTP — fire and forget (non-blocking). JWT is NOT issued yet.
  sendOtpEmail(newUser.email, newUser.fullName, plain).catch((err) =>
    console.error("[Email] Failed to send OTP:", err)
  );

  res.status(201).json({
    requiresVerification: true,
    email: newUser.email,
    message: "Account created. Please check your email for the verification code.",
  });
});

// ── VERIFY OTP ────────────────────────────────────────────────────────────────

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Account is already verified" });
  }

  if (!user.otp || !user.otpExpires) {
    return res.status(400).json({ message: "No OTP found. Please request a new one." });
  }

  if (user.otpExpires < new Date()) {
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  const isOtpValid = await bcrypt.compare(String(otp), user.otp);
  if (!isOtpValid) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Mark user as verified and clear OTP fields
  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  // ← JWT is issued HERE, only after successful OTP verification
  generateToken(user._id, res);

  res.status(200).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    isVerified: user.isVerified,
  });

  // Fire-and-forget welcome email after response is sent
  sendWelcomeEmail(user.email, user.fullName, ENV.CLIENT_URL).catch((err) =>
    console.error("[Email] Failed to send welcome email:", err)
  );
});

// ── RESEND OTP ────────────────────────────────────────────────────────────────

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Account is already verified" });
  }

  // Enforce resend cooldown to prevent abuse
  if (user.otpExpires) {
    const timeLeft = user.otpExpires.getTime() - (OTP_EXPIRES_MS - OTP_RESEND_COOLDOWN_MS);
    if (Date.now() < timeLeft) {
      return res.status(429).json({ message: "Please wait before requesting a new code." });
    }
  }

  const plain = generateOtp();
  user.otp = await hashOtp(plain);
  user.otpExpires = new Date(Date.now() + OTP_EXPIRES_MS);
  await user.save();

  sendOtpEmail(user.email, user.fullName, plain).catch((err) =>
    console.error("[Email] Failed to resend OTP:", err)
  );

  res.status(200).json({ message: "A new verification code has been sent to your email." });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  // Social-only users have no password
  if (!user.password) {
    return res.status(400).json({ message: "Please sign in with Google instead." });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

  // If account exists but OTP was never verified, kick off OTP flow
  if (!user.isVerified) {
    const plain = generateOtp();
    user.otp = await hashOtp(plain);
    user.otpExpires = new Date(Date.now() + OTP_EXPIRES_MS);
    await user.save();

    sendOtpEmail(user.email, user.fullName, plain).catch((err) =>
      console.error("[Email] Failed to send OTP on login:", err)
    );

    return res.status(200).json({
      requiresVerification: true,
      email: user.email,
      message: "Please verify your email. A new code has been sent.",
    });
  }

  // ← JWT issued only for fully-verified users
  generateToken(user._id, res);

  res.status(200).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    isVerified: user.isVerified,
  });
});

// ── LOGOUT ────────────────────────────────────────────────────────────────────

export const logout = (_, res) => {
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: ENV.NODE_ENV !== "development",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// ── GOOGLE OAUTH CALLBACK ─────────────────────────────────────────────────────

/**
 * Called by the auth.route.js Google callback chain AFTER Passport has
 * populated req.user. Issues the JWT cookie then redirects to the client.
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.redirect(`${ENV.CLIENT_URL}/login?error=oauth_failed`);
  }

  generateToken(user._id, res);

  // Redirect to client — checkAuth() will fire on load and hydrate the store
  res.redirect(ENV.CLIENT_URL);
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req, res) => {
  const { profilePic } = req.body;
  if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

  // Validate that profilePic is a base64 data URI for an image
  if (!profilePic.startsWith("data:image/")) {
    return res.status(400).json({ message: "Invalid image format. Only images are allowed." });
  }

  // Check approximate file size (base64 is ~33% larger than binary)
  const base64Size = Buffer.byteLength(profilePic, "utf8");
  if (base64Size > 5 * 1024 * 1024) {
    return res.status(400).json({ message: "Image size must be less than 5MB" });
  }

  const userId = req.user._id;

  const uploadResponse = await cloudinary.uploader.upload(profilePic);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profilePic: uploadResponse.secure_url },
    { new: true }
  ).select("-password");

  res.status(200).json(updatedUser);
});
