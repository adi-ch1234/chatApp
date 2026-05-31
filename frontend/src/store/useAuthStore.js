import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useCallStore } from "./useCallStore";

// In development, point directly to the backend process.
// In production, Socket.IO is served from the same origin as the frontend.
const SOCKET_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://chatapp-backend-g4ys.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isVerifyingOtp: false,
  isResendingOtp: false,

  /** Holds the email address awaiting OTP verification */
  pendingVerificationEmail: null,

  socket: null,
  onlineUsers: [],

  // ── Auth ────────────────────────────────────────────────────────────────────

  /** Verify the stored session cookie on app load. */
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      // A 401 here is expected on first load (no session) — not an error
      console.warn("[Auth] Session check failed:", error.message);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);

      if (res.data.requiresVerification) {
        // Store email so the OTP page knows who to verify
        set({ pendingVerificationEmail: res.data.email });
        toast.success("Check your email for a 6-digit verification code!");
        // Navigation is handled by the component, not here
        return { requiresVerification: true };
      }

      // Fallback: if backend ever skips OTP (shouldn't happen)
      set({ authUser: res.data });
      toast.success("Account created successfully!");
      get().connectSocket();
      return { requiresVerification: false };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to sign up");
      return { requiresVerification: false };
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);

      if (res.data.requiresVerification) {
        set({ pendingVerificationEmail: res.data.email });
        toast("Email not verified — a new code has been sent.", { icon: "📧" });
        return { requiresVerification: true };
      }

      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      return { requiresVerification: false };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log in");
      return { requiresVerification: false };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  /**
   * Verify the OTP the user received by email.
   * On success, the backend issues the JWT cookie and returns the user object.
   */
  verifyOtp: async (otp) => {
    const email = get().pendingVerificationEmail;
    if (!email) {
      toast.error("No email pending verification. Please sign up again.");
      return false;
    }

    set({ isVerifyingOtp: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
      set({ authUser: res.data, pendingVerificationEmail: null });
      toast.success("Email verified! Welcome to Loqui 🎉");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
      return false;
    } finally {
      set({ isVerifyingOtp: false });
    }
  },

  /** Request a fresh OTP for the pending email */
  resendOtp: async () => {
    const email = get().pendingVerificationEmail;
    if (!email) return;

    set({ isResendingOtp: true });
    try {
      await axiosInstance.post("/auth/resend-otp", { email });
      toast.success("A new verification code has been sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend code");
    } finally {
      set({ isResendingOtp: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
      console.error("[Auth] Logout error:", error);
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("[Auth] Update profile error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  },

  // ── Socket ──────────────────────────────────────────────────────────────────

  /**
   * Creates + connects the Socket.IO client. Sets up all listeners BEFORE
   * calling .connect() to guarantee no events are missed on connection.
   * WebRTC call listeners are registered via the useCallStore singleton —
   * a direct call (no dynamic import) because Zustand stores are initialized
   * lazily inside action bodies, so mutual imports between stores are safe.
   */
  connectSocket: () => {
    const { authUser, socket: existingSocket } = get();
    if (!authUser) return;

    // Tear down the old socket first to prevent duplicate connections
    if (existingSocket?.connected) {
      existingSocket.disconnect();
    }

    // 1. Create socket with autoConnect disabled so we wire listeners first
   const token = document.cookie.split("; ").find(row => row.startsWith("jwt="))?.split("=")[1];
const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  query: { userId: authUser._id },
  auth: { token },
});

    // 2. Register chat-level listeners
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // 3. Register WebRTC call listeners (direct call — no dynamic import needed)
    useCallStore.getState().subscribeToCallEvents(socket);

    // 4. Now connect — all handlers are ready
    socket.connect();

    set({ socket });
  },

  /**
   * Cleanly removes all socket listeners and disconnects.
   * Always clears onlineUsers so the UI never shows stale presence data.
   */
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      // Remove WebRTC listeners before tearing down the connection
      useCallStore.getState().unsubscribeFromCallEvents(socket);
      socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));
