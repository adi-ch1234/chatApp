/**
 * webrtcSignaling.js
 *
 * Pure WebRTC signaling relay module. Registers point-to-point socket event
 * listeners for WebRTC call negotiation without touching any existing chat logic.
 *
 * All events use socket.to(targetId).emit() — unicast only, never broadcast.
 * Every handler validates payload.to before emitting (defence-in-depth).
 *
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 * @param {(userId: string) => string | undefined} getReceiverSocketId
 *   Resolves a user's MongoDB _id to their current socket.id
 */
export function registerWebRTCSignaling(io, getReceiverSocketId) {
  /**
   * Server-side bidirectional call pair tracking.
   * Maps callerSocketId <-> calleeSocketId while a call is pending (ringing) or active.
   * Enables O(1) instantaneous lookup when either peer disconnects mid-ring.
   * Entries are cleaned up on call-accepted, call-rejected, call-cancelled, call-ended,
   * and socket disconnect.
   */
  const callerToCallee = new Map();
  const calleeToCaller = new Map();

  io.on("connection", (socket) => {
    /**
     * Relay a payload to a specific target socket ID.
     * Validates targetId before emitting — silently drops if invalid or not connected.
     *
     * @param {string} eventName - The socket event name to emit on the target
     * @param {string} targetId  - socket.id of the intended recipient
     * @param {object} payload   - Data to forward verbatim
     */
    function relay(eventName, targetId, payload) {
      if (!targetId || typeof targetId !== "string") {
        console.warn(`[WebRTC] relay: invalid targetId for event "${eventName}"`);
        return;
      }
      socket.to(targetId).emit(eventName, payload);
    }

    // ─── Incoming call notification ────────────────────────────────────────────
    // Direction : Caller → Server → Callee
    // Payload   : { to: userId (MongoDB _id), from: { id, name, profilePic } }
    // Note      : `to` is a userId — the server resolves it to a socketId.
    //             This is the only event that uses a userId; all others use socketIds.
    socket.on("webrtc:call-request", ({ to, from }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:call-request: missing 'to' field");
        return;
      }
      const targetSocketId = getReceiverSocketId(to);
      if (!targetSocketId) {
        // Target user is offline — bounce a rejection back to the caller immediately
        socket.emit("webrtc:call-rejected", { reason: "User is offline" });
        return;
      }
      // Track the pending call pair so we can clean up on disconnect
      callerToCallee.set(socket.id, targetSocketId);
      calleeToCaller.set(targetSocketId, socket.id);
      relay("webrtc:call-request", targetSocketId, { from, callerSocketId: socket.id });
    });

    // ─── Caller cancels an unanswered call ─────────────────────────────────────
    // Direction : Caller → Server → Callee
    // Payload   : { to: userId (MongoDB _id) }
    // Note      : `to` is a userId (callee's socketId is unknown to caller at this stage).
    socket.on("webrtc:call-cancelled", ({ to }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:call-cancelled: missing 'to' field");
        return;
      }
      const targetSocketId = getReceiverSocketId(to);
      callerToCallee.delete(socket.id);
      if (targetSocketId) {
        calleeToCaller.delete(targetSocketId);
        relay("webrtc:call-cancelled", targetSocketId, {});
      }
    });

    // ─── Call accepted ─────────────────────────────────────────────────────────
    // Direction : Callee → Server → Caller
    // Payload   : { to: socketId (caller's socket.id) }
    // Note      : The server appends calleeSocketId so the caller knows where to
    //             send the SDP offer.
    socket.on("webrtc:call-accepted", ({ to }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:call-accepted: missing 'to' field");
        return;
      }
      // Move the pair to an active call — no longer just "pending"
      const oldCalleeSocketId = callerToCallee.get(to);
      if (oldCalleeSocketId) calleeToCaller.delete(oldCalleeSocketId); // Clean stale map if they accepted from another tab
      
      callerToCallee.set(to, socket.id);
      calleeToCaller.set(socket.id, to);
      relay("webrtc:call-accepted", to, { calleeSocketId: socket.id });
    });

    // ─── Call rejected ─────────────────────────────────────────────────────────
    // Direction : Callee → Server → Caller
    // Payload   : { to: socketId (caller's socket.id) }
    socket.on("webrtc:call-rejected", ({ to }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:call-rejected: missing 'to' field");
        return;
      }
      const targetSocketId = callerToCallee.get(to);
      callerToCallee.delete(to); // caller's id is the map key
      if (targetSocketId) calleeToCaller.delete(targetSocketId);
      relay("webrtc:call-rejected", to, {});
    });

    // ─── SDP Offer ─────────────────────────────────────────────────────────────
    // Direction : Caller → Server → Callee
    // Payload   : { to: socketId (callee's socket.id), offer: RTCSessionDescriptionInit }
    // Note      : callerSocketId is appended so the callee can route the SDP answer back.
    socket.on("webrtc:call-offer", ({ to, offer }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:call-offer: missing 'to' field");
        return;
      }
      relay("webrtc:call-offer", to, { offer, callerSocketId: socket.id });
    });

    // ─── SDP Answer ────────────────────────────────────────────────────────────
    // Direction : Callee → Server → Caller
    // Payload   : { to: socketId (caller's socket.id), answer: RTCSessionDescriptionInit }
    // Note      : Completes the offer/answer exchange so both peers enter ICE negotiation.
    socket.on("webrtc:call-answer", ({ to, answer }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:call-answer: missing 'to' field");
        return;
      }
      relay("webrtc:call-answer", to, { answer });
    });

    // ─── ICE Candidates ────────────────────────────────────────────────────────
    // Direction : Either peer → Server → Other peer
    // Payload   : { to: socketId, candidate: RTCIceCandidateInit }
    // Note      : ICE trickle — candidates arrive continuously and must be forwarded
    //             as fast as possible to minimise connection setup latency.
    socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:ice-candidate: missing 'to' field");
        return;
      }
      relay("webrtc:ice-candidate", to, { candidate });
    });

    // ─── Call ended ────────────────────────────────────────────────────────────
    // Direction : Either peer → Server → Other peer
    // Payload   : { to: socketId }
    // Note      : Sent by whichever peer clicks "Hang up" during an active call.
    socket.on("webrtc:call-ended", ({ to }) => {
      if (!to) {
        console.warn("[WebRTC] webrtc:call-ended: missing 'to' field");
        return;
      }
      // Remove whichever direction is stored
      callerToCallee.delete(socket.id);
      callerToCallee.delete(to);
      calleeToCaller.delete(socket.id);
      calleeToCaller.delete(to);
      relay("webrtc:call-ended", to, {});
    });

    // ─── Caller OR Callee disconnects abruptly ────────────
    socket.on("disconnect", () => {
      // 1. Are they the caller?
      const calleeSocketId = callerToCallee.get(socket.id);
      if (calleeSocketId) {
        // They were the caller; notify the callee that the call is cancelled/ended
        socket.to(calleeSocketId).emit("webrtc:call-cancelled", {});
        callerToCallee.delete(socket.id);
        calleeToCaller.delete(calleeSocketId);
        return;
      }

      // 2. Are they the callee?
      const callerSocketId = calleeToCaller.get(socket.id);
      if (callerSocketId) {
        // They were the callee; notify the caller that the call dropped
        socket.to(callerSocketId).emit("webrtc:call-ended", {});
        calleeToCaller.delete(socket.id);
        callerToCallee.delete(callerSocketId);
      }
    });
  });
}
