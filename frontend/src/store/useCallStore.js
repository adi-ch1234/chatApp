import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

/**
 * Global singleton for the incoming call ringtone.
 * Kept outside the state to prevent unnecessary re-renders and React lifecycle memory leaks.
 */
const ringtoneAudio = typeof Audio !== "undefined" ? new Audio("/sounds/ringtone.mp3") : null;
if (ringtoneAudio) {
  ringtoneAudio.loop = true;
}

const stopRingtone = () => {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
  }
};

/** 
 * Free public STUN servers — no sign-up required.
 * Note for Production/Interviews: STUN alone will fail if users are behind Symmetric NATs 
 * (common in corporate/mobile networks). A TURN server is strictly required for reliable P2P relay.
 */
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.stunprotocol.org:3478" },
  ],
};

/**
 * useCallStore — Zustand store that owns all WebRTC call state and logic.
 *
 * callState machine:
 *   'idle' → 'calling' (outbound) → 'in-call'
 *   'idle' → 'ringing' (inbound)  → 'in-call'
 *   'in-call' / 'calling' / 'ringing' → 'idle' (end/reject)
 */
export const useCallStore = create((set, get) => ({
  // ─── State ─────────────────────────────────────────────────────────────────
  callState: "idle", // 'idle' | 'calling' | 'ringing' | 'in-call'
  localStream: null,
  remoteStream: null,
  peerConnection: null,

  /** { socketId, id (userId), name, profilePic } of the other participant */
  callPartner: null,

  isMuted: false,
  isVideoOff: false,
  callError: null,

  // Internal: store the callee's socket ID once they accept (used by caller to send offer)
  _calleeSocketId: null,
  // Internal: store the caller's socket ID (used by callee to send answer)
  _callerSocketId: null,
  // Internal: target user's MongoDB _id (needed to cancel an unanswered outbound call)
  _targetUserId: null,

  // Internal: buffer incoming ICE candidates while waiting for getUserMedia / setRemoteDescription
  _iceCandidateQueue: [],

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Resets all call state back to idle. Stops local media tracks and closes
   * the RTCPeerConnection to release camera/mic hardware immediately.
   *
   * @param {object} [overrides={}] - Optional fields to merge AFTER the reset,
   *   e.g. `{ callError: 'message' }` preserves an error across the clear.
   */
  _resetState: (overrides = {}) => {
    const { peerConnection, localStream } = get();

    if (peerConnection) {
      peerConnection.close();
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    // Ensure ringtone stops playback fully when cleaning up a call
    stopRingtone();

    set({
      callState: "idle",
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      callPartner: null,
      isMuted: false,
      isVideoOff: false,
      callError: null,
      _calleeSocketId: null,
      _callerSocketId: null,
      _targetUserId: null,
      _iceCandidateQueue: [],
      ...overrides, // Merge after clearing so callers can persist specific fields
    });
  },

  /**
   * Flushes the ICE candidate queue once the remote description is successfully set.
   */
  _flushIceCandidateQueue: async () => {
    const { peerConnection, _iceCandidateQueue } = get();
    if (!peerConnection || !peerConnection.remoteDescription) return;

    for (const candidate of _iceCandidateQueue) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[WebRTC] addIceCandidate failed during flush:", err);
      }
    }
    set({ _iceCandidateQueue: [] });
  },

  /**
   * Requests camera + mic. Falls back to audio-only if video is unavailable.
   * @returns {Promise<MediaStream>}
   */
  _getUserMedia: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (videoErr) {
      if (videoErr.name === "NotFoundError" || videoErr.name === "OverconstrainedError") {
        // Fallback: audio only
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return stream;
      }
      throw videoErr; // Re-throw NotAllowedError and others
    }
  },

  /**
   * Creates a new RTCPeerConnection, attaches ICE / track handlers.
   * @param {string} targetSocketId - The socket ID to relay ICE candidates to
   * @returns {RTCPeerConnection}
   */
  _createPeerConnection: (targetSocketId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const socket = useAuthStore.getState().socket;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit("webrtc:ice-candidate", { to: targetSocketId, candidate });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (streams && streams[0]) {
        set({ remoteStream: streams[0] });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE connection state:", pc.iceConnectionState);
        get().endCall();
      }
    };

    return pc;
  },

  // ─── Outbound call ─────────────────────────────────────────────────────────

  /**
   * Start a call to a given user. Emits `webrtc:call-request` (no offer yet —
   * the offer is sent after the callee accepts, matching the plan's state machine).
   *
   * @param {{ _id: string, fullName: string, profilePic: string }} targetUser
   */
  initiateCall: async (targetUser) => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    if (!socket || !authUser) return;

    set({
      callState: "calling",
      callPartner: {
        id: targetUser._id,
        name: targetUser.fullName,
        profilePic: targetUser.profilePic,
        socketId: null, // filled in when they accept
      },
      callError: null,
      _targetUserId: targetUser._id, // retained so cancel can reach an unanswered callee
    });

    // Notify the target user of the incoming call request
    socket.emit("webrtc:call-request", {
      to: targetUser._id, // server resolves userId → socketId
      from: {
        id: authUser._id,
        name: authUser.fullName,
        profilePic: authUser.profilePic,
      },
    });
  },

  /**
   * Called on the caller's side when the callee accepts.
   * Gets media, creates PC, creates + sends SDP offer.
   *
   * @param {string} calleeSocketId - The callee's socket.id
   */
  _sendOffer: async (calleeSocketId) => {
    const socket = useAuthStore.getState().socket;
    try {
      const stream = await get()._getUserMedia();
      set({ localStream: stream });

      const pc = get()._createPeerConnection(calleeSocketId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      set({ peerConnection: pc, _calleeSocketId: calleeSocketId });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc:call-offer", { to: calleeSocketId, offer });
      set({ callState: "in-call" });
    } catch (err) {
      console.error("[WebRTC] _sendOffer error:", err);
      get()._handleMediaError(err);
    }
  },

  // ─── Inbound call ──────────────────────────────────────────────────────────

  /**
   * Accept the incoming call. Notifies the caller, gets media, then waits for
   * the SDP offer that the caller will send after receiving our acceptance.
   * The actual peer connection is set up in the `webrtc:call-offer` listener.
   */
  acceptCall: async () => {
    const { _callerSocketId } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket || !_callerSocketId) return;

    // Stop ringtone immediately upon interaction before SDP flow starts
    stopRingtone();

    // Tell the caller we accepted — they will now send us the SDP offer
    socket.emit("webrtc:call-accepted", { to: _callerSocketId });
    // callState stays 'ringing' until we receive the offer and go 'in-call'
  },

  /**
   * Reject the incoming call.
   */
  rejectCall: () => {
    const socket = useAuthStore.getState().socket;
    const { _callerSocketId } = get();

    if (socket && _callerSocketId) {
      socket.emit("webrtc:call-rejected", { to: _callerSocketId });
    }
    get()._resetState();
  },

  /**
   * End an active or pending call from either side.
   *
   * State-specific behaviour:
   *   'calling'  → outbound, unanswered: emit webrtc:call-cancelled (server
   *                resolves userId → socketId, same as call-request)
   *   'ringing'  → inbound, not yet accepted: emit webrtc:call-rejected
   *   'in-call'  → live call: emit webrtc:call-ended to the other peer's socketId
   */
  endCall: () => {
    const socket = useAuthStore.getState().socket;
    const { _calleeSocketId, _callerSocketId, _targetUserId, callState } = get();

    if (socket) {
      if (callState === "calling") {
        // Callee socketId not known yet — server must resolve by userId
        if (_targetUserId) {
          socket.emit("webrtc:call-cancelled", { to: _targetUserId });
        }
      } else if (callState === "ringing") {
        // We are the callee rejecting via hang-up shortcut
        if (_callerSocketId) {
          socket.emit("webrtc:call-rejected", { to: _callerSocketId });
        }
      } else if (callState === "in-call") {
        // Notify the other peer — could be callee or caller depending on who hung up
        const targetSocketId = _calleeSocketId || _callerSocketId;
        if (targetSocketId) {
          socket.emit("webrtc:call-ended", { to: targetSocketId });
        }
      }
    }

    get()._resetState();
  },

  // ─── In-call controls ──────────────────────────────────────────────────────

  /** Toggle local audio mute. */
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = isMuted; // flip
    });
    set({ isMuted: !isMuted });
  },

  /** Toggle local video. */
  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = isVideoOff; // flip
    });
    set({ isVideoOff: !isVideoOff });
  },

  // ─── Error handling ────────────────────────────────────────────────────────

  /**
   * Translates a getUserMedia error into a user-friendly message, resets all
   * call state, and preserves the error so the UI can display it.
   */
  _handleMediaError: (err) => {
    let message = "Could not access camera/microphone.";
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      message = "Camera/microphone access was denied. Please allow access and try again.";
    } else if (err.name === "NotFoundError") {
      message = "No camera or microphone found on this device.";
    }
    
    // Explicitly end the call before resetting to broadcast the tear-down to peers
    get().endCall();
    
    // Single clean reset — the overrides object preserves callError after clearing
    get()._resetState({ callError: message });
  },

  // ─── Socket event subscription ─────────────────────────────────────────────

  /**
   * Register all `webrtc:*` socket listeners. Called after socket connects.
   * @param {import('socket.io-client').Socket} socket
   */
  subscribeToCallEvents: (socket) => {
    if (!socket) return;

    // ── Inbound: someone is calling us ──
    socket.on("webrtc:call-request", async ({ from, callerSocketId }) => {
      if (get().callState !== "idle") return; // busy — ignore
      set({
        callState: "ringing",
        callPartner: {
          id: from.id,
          name: from.name,
          profilePic: from.profilePic,
          socketId: callerSocketId,
        },
        _callerSocketId: callerSocketId,
      });

      if (ringtoneAudio) {
        try {
          ringtoneAudio.currentTime = 0;
          await ringtoneAudio.play();
        } catch (err) {
          // Browser autoplay policy block (NotAllowedError)
          console.warn("[WebRTC] Ringtone autoplay blocked by browser:", err);
          // It gracefully degrades to visual ringing (state is already 'ringing')
        }
      }
    });

    // ── Inbound: callee accepted → we are the caller, send the SDP offer now ──
    socket.on("webrtc:call-accepted", ({ calleeSocketId }) => {
      set({ _calleeSocketId: calleeSocketId });
      get()._sendOffer(calleeSocketId);
    });

    // ── Inbound: callee rejected our call ──
    socket.on("webrtc:call-rejected", () => {
      get()._resetState();
    });

    // ── Inbound: caller cancelled before we answered (or their tab closed) ──
    socket.on("webrtc:call-cancelled", () => {
      get()._resetState();
    });

    // ── Inbound: caller sent us the SDP offer (we are callee) ──
    socket.on("webrtc:call-offer", async ({ offer, callerSocketId }) => {
      // Received the offer — now get media, create PC, create answer
      const socket = useAuthStore.getState().socket;
      try {
        const stream = await get()._getUserMedia();
        set({ localStream: stream });

        const pc = get()._createPeerConnection(callerSocketId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        set({ peerConnection: pc, _callerSocketId: callerSocketId });

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        get()._flushIceCandidateQueue();
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc:call-answer", { to: callerSocketId, answer });
        set({ callState: "in-call" });
      } catch (err) {
        console.error("[WebRTC] webrtc:call-offer handler error:", err);
        get()._handleMediaError(err);
      }
    });

    // ── Inbound: callee sent us the SDP answer (we are caller) ──
    socket.on("webrtc:call-answer", async ({ answer }) => {
      const { peerConnection } = get();
      if (peerConnection && answer) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          get()._flushIceCandidateQueue();
        } catch (err) {
          console.error("[WebRTC] setRemoteDescription (answer) failed:", err);
        }
      }
    });

    // ── Inbound: ICE candidate from the other peer ──
    socket.on("webrtc:ice-candidate", async ({ candidate }) => {
      const { peerConnection, _iceCandidateQueue } = get();
      if (candidate) {
        if (!peerConnection || !peerConnection.remoteDescription) {
          // peerConnection not ready or remote description missing - queue it!
          set({ _iceCandidateQueue: [..._iceCandidateQueue, candidate] });
        } else {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("[WebRTC] addIceCandidate failed:", err);
          }
        }
      }
    });

    // ── Inbound: other peer ended / hung up ──
    socket.on("webrtc:call-ended", () => {
      get()._resetState();
    });
  },

  /**
   * Remove all `webrtc:*` socket listeners. Called before socket disconnects.
   * @param {import('socket.io-client').Socket} socket
   */
  unsubscribeFromCallEvents: (socket) => {
    if (!socket) return;
    const events = [
      "webrtc:call-request",
      "webrtc:call-accepted",
      "webrtc:call-rejected",
      "webrtc:call-cancelled",
      "webrtc:call-offer",
      "webrtc:call-answer",
      "webrtc:ice-candidate",
      "webrtc:call-ended",
    ];
    events.forEach((e) => socket.off(e));
  },
}));
