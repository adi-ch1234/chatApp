import { useEffect, useRef } from "react";
import {
  PhoneOffIcon,
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneCallIcon,
  PhoneIncomingIcon,
} from "lucide-react";
import { useCallStore } from "../store/useCallStore";

/**
 * CallOverlay — Full-screen modal that manages the 3 call UI states:
 *  • 'calling'  → outbound ringing (waiting for callee to accept)
 *  • 'ringing'  → inbound call (Accept / Reject buttons)
 *  • 'in-call'  → live video call with controls
 */
function CallOverlay() {
  const {
    callState,
    callPartner,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callError,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Wire local stream → local <video>
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Wire remote stream → remote <video>
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Nothing to render when idle (and no error)
  if (callState === "idle" && !callError) return null;

  return (
    <div
      id="call-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm call-overlay-enter p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Video call"
    >
      {/* ── Error state ─────────────────────────────────────────────────── */}
      {callError && (
        <div className="bg-surface-container rounded-2xl p-8 max-w-sm w-full mx-4 text-center border border-ds-error/30 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-ds-error/15 flex items-center justify-center mx-auto mb-4">
            <PhoneOffIcon className="w-8 h-8 text-ds-error" />
          </div>
          <h2 className="text-on-surface font-semibold text-lg mb-2">Call Failed</h2>
          <p className="text-on-surface-variant text-sm mb-6">{callError}</p>
          <button
            id="call-error-dismiss"
            onClick={() => useCallStore.setState({ callError: null })}
            className="px-6 py-2 bg-surface-high hover:bg-el-2 text-on-surface rounded-xl transition-colors text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Calling state (outbound — waiting for pick-up) ──────────────── */}
      {!callError && callState === "calling" && callPartner && (
        <div className="bg-surface-container/95 backdrop-blur-md rounded-2xl p-8 sm:p-10 max-w-sm w-full mx-4 text-center border border-outline-variant/30 shadow-2xl">
          <div className="relative flex items-center justify-center mx-auto mb-6">
            {/* Ripple rings */}
            <span className="absolute w-28 h-28 rounded-full bg-primary-action/15 ring-pulse-1" />
            <span className="absolute w-24 h-24 rounded-full bg-primary-action/15 ring-pulse-2" />
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary-action/50 z-10">
              <img
                src={callPartner.profilePic || "/avatar.png"}
                alt={callPartner.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h2 className="text-on-surface font-semibold text-xl mb-1">{callPartner.name}</h2>
          <p className="text-on-surface-variant text-sm mb-8 flex items-center justify-center gap-2">
            <PhoneCallIcon className="w-4 h-4 text-primary-action animate-pulse" />
            Calling…
          </p>

          <button
            id="call-cancel-btn"
            onClick={endCall}
            className="mx-auto w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg"
            aria-label="Cancel call"
          >
            <PhoneOffIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* ── Ringing state (inbound — Accept / Reject) ───────────────────── */}
      {!callError && callState === "ringing" && callPartner && (
        <div className="bg-surface-container/95 backdrop-blur-md rounded-2xl p-8 sm:p-10 max-w-sm w-full mx-4 text-center border border-outline-variant/30 shadow-2xl">
          <div className="relative flex items-center justify-center mx-auto mb-6">
            <span className="absolute w-28 h-28 rounded-full bg-green-500/15 ring-pulse-1" />
            <span className="absolute w-24 h-24 rounded-full bg-green-500/15 ring-pulse-2" />
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-green-400/50 z-10">
              <img
                src={callPartner.profilePic || "/avatar.png"}
                alt={callPartner.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <h2 className="text-on-surface font-semibold text-xl mb-1">{callPartner.name}</h2>
          <p className="text-on-surface-variant text-sm mb-8 flex items-center justify-center gap-2">
            <PhoneIncomingIcon className="w-4 h-4 text-green-400 animate-bounce" />
            Incoming video call
          </p>

          <div className="flex gap-8 justify-center">
            {/* Reject */}
            <div className="flex flex-col items-center gap-2">
              <button
                id="call-reject-btn"
                onClick={rejectCall}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg"
                aria-label="Reject call"
              >
                <PhoneOffIcon className="w-6 h-6 text-white" />
              </button>
              <span className="text-on-surface-variant text-xs">Decline</span>
            </div>
            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                id="call-accept-btn"
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center shadow-lg"
                aria-label="Accept call"
              >
                <VideoIcon className="w-6 h-6 text-white" />
              </button>
              <span className="text-on-surface-variant text-xs">Accept</span>
            </div>
          </div>
        </div>
      )}

      {/* ── In-call state (live video) ───────────────────────────────────── */}
      {!callError && callState === "in-call" && (
        <div className="relative w-full max-w-4xl h-[85svh] sm:h-[90vh] mx-auto rounded-2xl overflow-hidden bg-el-0 border border-outline-variant/30 shadow-2xl flex flex-col">
          {/* Remote video — fills the container; aspect-ratio prevents distortion */}
          <div className="flex-1 relative bg-el-0 overflow-hidden">
            <video
              ref={remoteVideoRef}
              id="remote-video"
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Partner name badge */}
            {callPartner && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1.5 rounded-pill bg-black/50 text-on-surface text-sm font-medium backdrop-blur-sm flex items-center gap-2">
                <img
                  src={callPartner.profilePic || "/avatar.png"}
                  alt={callPartner.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{callPartner.name}</span>
              </div>
            )}

            {/* Local video PiP — scales down on mobile */}
            <div className="absolute bottom-20 right-3 sm:right-4 w-20 h-14 sm:w-32 sm:h-20 md:w-36 md:h-24 rounded-xl overflow-hidden border-2 border-outline-variant/40 shadow-xl z-10 bg-surface-container">
              <video
                ref={localVideoRef}
                id="local-video"
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
                  <VideoOffIcon className="w-5 h-5 sm:w-6 sm:h-6 text-outline" />
                </div>
              )}
            </div>
          </div>

          {/* Controls bar */}
          <div
            id="call-controls"
            className="flex items-center justify-center gap-4 sm:gap-6 py-3 sm:py-4 px-4 sm:px-6 bg-surface-container/90 backdrop-blur-sm border-t border-outline-variant/20"
          >
            {/* Mute */}
            <button
              id="call-mute-btn"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              className={`min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-colors shadow ${
                isMuted
                  ? "bg-red-500/80 hover:bg-red-500"
                  : "bg-surface-high hover:bg-el-2"
              }`}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isMuted ? (
                <MicOffIcon className="w-5 h-5 text-white" />
              ) : (
                <MicIcon className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Hang up */}
            <button
              id="call-hangup-btn"
              onClick={endCall}
              title="End call"
              className="min-w-[56px] min-h-[56px] rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg"
              aria-label="End call"
            >
              <PhoneOffIcon className="w-6 h-6 text-white" />
            </button>

            {/* Video toggle */}
            <button
              id="call-video-btn"
              onClick={toggleVideo}
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              className={`min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center transition-colors shadow ${
                isVideoOff
                  ? "bg-red-500/80 hover:bg-red-500"
                  : "bg-surface-high hover:bg-el-2"
              }`}
              aria-label={isVideoOff ? "Enable video" : "Disable video"}
            >
              {isVideoOff ? (
                <VideoOffIcon className="w-5 h-5 text-white" />
              ) : (
                <VideoIcon className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CallOverlay;
