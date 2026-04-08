import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { ENV } from "./env.js";

/**
 * Google OAuth2 Strategy
 *
 * Flow:
 *  1. User clicks "Sign in with Google" → GET /api/auth/google
 *  2. Google redirects back → GET /api/auth/google/callback
 *  3. Passport calls this verify callback with the Google profile
 *  4. We find-or-create the user in MongoDB and mark isVerified: true
 *  5. The route handler (googleCallback in auth.controller.js) issues the JWT
 *
 * Sessions are disabled (session: false). JWT httpOnly cookies handle all
 * persistent auth — express-session is only needed for the transient OAuth
 * state parameter verification during the two-step redirect.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      callbackURL: `${ENV.CLIENT_URL.replace("5173", "3000")}/api/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        // Try to find by googleId first (returning user)
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Maybe they signed up with email/password before — link the account
          user = await User.findOne({ email: email.toLowerCase() });

          if (user) {
            // Link Google to existing account
            user.googleId = profile.id;
            user.isVerified = true;
            if (!user.profilePic && profile.photos?.[0]?.value) {
              user.profilePic = profile.photos[0].value;
            }
            await user.save();
          } else {
            // Brand-new user via Google
            user = await User.create({
              googleId: profile.id,
              email: email.toLowerCase(),
              fullName: profile.displayName || email.split("@")[0],
              profilePic: profile.photos?.[0]?.value || "",
              password: null,
              isVerified: true,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// We use JWT cookies — no session serialization needed
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
