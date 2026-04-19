import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";

/**
 * Socket.IO authentication middleware.
 * Extracts the JWT from the http-only cookie on the WebSocket handshake
 * request and attaches the verified user to the socket before any event
 * handlers run. Unauthenticated sockets are rejected immediately.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Extract the JWT from the incoming HTTP-only cookie header
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];

    if (!token) {
      console.warn("[Socket] Connection rejected: No token provided");
      return next(new Error("Unauthorized - No Token Provided"));
    }

    // verify the token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded) {
      console.warn("[Socket] Connection rejected: Invalid token");
      return next(new Error("Unauthorized - Invalid Token"));
    }

    // look up the user in the database
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.warn("[Socket] Connection rejected: User not found");
      return next(new Error("User not found"));
    }

    // Attach verified user to the socket for downstream handlers
    socket.user = user;
    socket.userId = user._id.toString();

    console.info(`[Socket] Authenticated: ${user.fullName} (${user._id})`);

    next();
  } catch (error) {
    console.error("[Socket] Authentication error:", error.message);
    next(new Error("Unauthorized - Authentication failed"));
  }
};
