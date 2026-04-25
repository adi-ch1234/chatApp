import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import { registerWebRTCSignaling } from "./webrtcSignaling.js";

/**
 * socket.js — Socket.IO server setup.
 *
 * Responsibilities:
 *   1. Create the shared Express app + HTTP server (exported for server.js)
 *   2. Initialise and configure the Socket.IO server
 *   3. Track connected users via userSocketMap for targeted event delivery
 *   4. Register WebRTC signaling relay handlers (additive, no chat logic touched)
 */
const app = express();
const server = http.createServer(app);

const clientOrigin = ENV.CLIENT_URL?.replace(/\/$/, "") || "";

const io = new Server(server, {
  cors: {
    origin: [clientOrigin],
    credentials: true,
  },
});

const onlineUsers = new Set();

export function getReceiverSocketId(userId) {
  // We strongly encourage routing via io.to(userId).
  // This fallback returns an arbitrary socket connected to that userId
  // to satisfy the strictly isolated WebRTC signaling module.
  const room = io.sockets.adapter.rooms.get(userId);
  if (room && room.size > 0) {
    return Array.from(room)[0];
  }
  return undefined;
}

// Apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// Register WebRTC signaling relay
registerWebRTCSignaling(io, getReceiverSocketId);

io.on("connection", (socket) => {
  console.info(`[Socket] Connected: ${socket.user.fullName} (${socket.userId})`);

  // Join a personal room to route events to ALL tabs for this user naturally
  socket.join(socket.userId);

  // Register the user as online
  onlineUsers.add(socket.userId);
  io.emit("getOnlineUsers", Array.from(onlineUsers));

  socket.on("disconnect", () => {
    console.info(`[Socket] Disconnected: ${socket.user.fullName} (${socket.userId})`);
    
    // The user's room will automatically decrease in size. Check if the room is now completely empty.
    const room = io.sockets.adapter.rooms.get(socket.userId);
    if (!room || room.size === 0) {
      onlineUsers.delete(socket.userId);
      io.emit("getOnlineUsers", Array.from(onlineUsers));
    }
  });
});

export { io, app, server };
