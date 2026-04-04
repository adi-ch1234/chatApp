import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";

// Import passport config (registers the Google strategy as a side effect)
import "./lib/passport.js";
import passport from "passport";

const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

// Security headers
app.use(helmet());

// Body parsers
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: false, limit: "15mb" }));

// CORS
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));

// Cookie parser
app.use(cookieParser());

// express-session — required for Passport's OAuth state cookie during the
// Google redirect handshake. NOT used for persistent auth (that's JWT).
app.use(
  session({
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: ENV.NODE_ENV !== "development",
      httpOnly: true,
      maxAge: 5 * 60 * 1000, // 5 min — just long enough for the OAuth roundtrip
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// Global error handler — catches unhandled errors from middleware/routes
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Connect to DB before accepting requests
const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.info(`[Server] Running on port ${PORT} (${ENV.NODE_ENV})`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();
