import express from "express";
import passport from "../lib/passport.js";
import {
  signup,
  login,
  logout,
  updateProfile,
  verifyOtp,
  resendOtp,
  googleCallback,
  getSocketToken,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { sanitizeBody } from "../middleware/validation.middleware.js";

const router = express.Router();

// ── Google OAuth routes ───────────────────────────────────────────────────────
// These must be BEFORE arcjetProtection because they use browser redirects,
// not JSON bodies, and Arcjet bot-detection would block the Google crawler.

// Initial redirect — session must be ACTIVE here so Passport can store the
// OAuth state parameter for CSRF protection between the two redirects.
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback — session:false so Passport does NOT serialize the user to the
// session after success. JWT cookie (issued in googleCallback) handles auth.
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
    session: false,
  }),
  googleCallback
);

// ── Standard auth routes (Arcjet-protected) ───────────────────────────────────
router.use(arcjetProtection);

router.post("/signup", sanitizeBody, signup);
router.post("/login", sanitizeBody, login);
router.post("/logout", logout);
router.post("/verify-otp", sanitizeBody, verifyOtp);
router.post("/resend-otp", sanitizeBody, resendOtp);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/socket-token", protectRoute, getSocketToken);
router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
