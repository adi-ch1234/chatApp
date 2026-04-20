import { XIcon, VideoIcon, MenuIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

/**
 * ChatHeader — top bar of the active conversation.
 * `onOpenSidebar` is called on mobile to reveal the off-canvas contact list.
 */
function ChatHeader({ onOpenSidebar }) {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall, callState } = useCallStore();
  const isOnline = onlineUsers.includes(selectedUser._id);
  const isBusy = callState !== "idle";

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="flex justify-between items-center bg-surface-low/80 backdrop-blur-sm border-b border-outline-variant/12 px-4 sm:px-6 py-2.5 min-h-[60px]">
      <div className="flex items-center gap-3 min-w-0">
        {/* HAMBURGER — mobile only; reopens the contact sidebar */}
        <button
          className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-outline hover:text-on-surface transition-colors rounded-xl hover:bg-surface-high/50 flex-shrink-0"
          onClick={onOpenSidebar}
          aria-label="Open contacts sidebar"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        {/* Avatar with online dot */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-outline-variant/15">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full ring-[2px] ring-surface-low" />
          )}
        </div>

        {/* Name + status */}
        <div className="min-w-0">
          <h3 className="text-on-surface font-semibold text-[14.5px] truncate max-w-[200px] sm:max-w-[320px] md:max-w-[400px] leading-tight">
            {selectedUser.fullName}
          </h3>
          <p className={`text-[10.5px] font-medium tracking-wide mt-0.5 ${isOnline ? "text-green-400" : "text-outline/60"}`}>
            {isOnline ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Action icons — only video call (functional) */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {/* Video call button */}
        <button
          id="start-video-call-btn"
          onClick={() => initiateCall(selectedUser)}
          disabled={isBusy}
          title={isBusy ? "Already in a call" : `Video call ${selectedUser.fullName}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant/70 hover:text-primary-action hover:bg-primary-action/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={`Start video call with ${selectedUser.fullName}`}
        >
          <VideoIcon className="w-[17px] h-[17px]" />
        </button>

        {/* Close chat button */}
        <button
          onClick={() => setSelectedUser(null)}
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-high/50 transition-colors"
          aria-label="Close conversation"
          title="Close (Esc)"
        >
          <XIcon className="w-[17px] h-[17px]" />
        </button>
      </div>
    </div>
  );
}
export default ChatHeader;
