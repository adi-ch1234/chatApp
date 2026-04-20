import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { FileIcon, CheckCheckIcon } from "lucide-react";

/**
 * Validates that a URL is safe to render (only allow Cloudinary or HTTPS URLs).
 */
function isSafeFileUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && (parsed.hostname.endsWith("cloudinary.com") || parsed.hostname.endsWith("res.cloudinary.com"));
  } catch {
    return false;
  }
}

/** Helper: inserts "TODAY", "Yesterday", or date headers between messages. */
function getDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today - msgDate) / 86400000;

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * ChatContainer — the main chat pane.
 * `onOpenSidebar` is threaded down to ChatHeader for the mobile hamburger button.
 */
function ChatContainer({ onOpenSidebar }) {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Build date-grouped messages for rendering date dividers
  let lastDateLabel = null;
  let lastSenderId = null;

  return (
    <>
      <ChatHeader onOpenSidebar={onOpenSidebar} />

      {/* Messages scroll area */}
      <div className="flex-1 px-4 sm:px-6 overflow-y-auto py-4 chat-scroll bg-surface">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="space-y-1">
            {messages.map((msg, idx) => {
              const isSent = msg.senderId === authUser._id;
              const dateLabel = getDateLabel(msg.createdAt);
              let showDateDivider = false;

              if (dateLabel !== lastDateLabel) {
                showDateDivider = true;
                lastDateLabel = dateLabel;
              }

              // Detect if sender changed, to add extra spacing between different speakers
              const senderChanged = lastSenderId !== null && lastSenderId !== msg.senderId;
              lastSenderId = msg.senderId;

              // Detect if this is the last message from the same sender in a group
              const nextMsg = messages[idx + 1];
              const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

              return (
                <div key={msg._id}>
                  {/* ── Date divider ──────────────────────────────── */}
                  {showDateDivider && (
                    <div className="flex items-center gap-4 my-5">
                      <div className="flex-1 h-px bg-outline-variant/15" />
                      <span className="text-[11px] font-medium text-outline/80 tracking-wider bg-surface-container/60 px-3 py-1 rounded-full">
                        {dateLabel}
                      </span>
                      <div className="flex-1 h-px bg-outline-variant/15" />
                    </div>
                  )}

                  {/* ── Message row ────────────────────────────────── */}
                  <div
                    className={`flex items-end gap-2.5 ${isSent ? "justify-end" : "justify-start"} ${
                      senderChanged && !showDateDivider ? "mt-4" : "mt-1.5"
                    }`}
                  >
                    {/* Received: show sender avatar only on last message in group */}
                    {!isSent && (
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full overflow-hidden ${isLastInGroup ? "" : "invisible"}`}>
                        <img
                          src={selectedUser.profilePic || "/avatar.png"}
                          alt={selectedUser.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div
                      className={`relative max-w-[75%] sm:max-w-[60%] px-3.5 py-2.5 ${
                        isSent ? "bubble-sent" : "bubble-received"
                      }`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Shared image"
                          className="rounded-xl max-h-72 max-w-full object-cover mb-2"
                          loading="lazy"
                        />
                      )}
                      {msg.fileUrl && isSafeFileUrl(msg.fileUrl) && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 hover:bg-black/30 transition-colors mb-2"
                        >
                          <FileIcon className="w-5 h-5 text-primary-action flex-shrink-0" />
                          <span className="text-sm underline break-all hover:text-primary">
                            {msg.fileName || "Download Attachment"}
                          </span>
                        </a>
                      )}
                      {/* overflow-wrap:anywhere forces breaks on unbreakable strings */}
                      {msg.text && (
                        <p className="[overflow-wrap:anywhere] whitespace-pre-wrap text-[14.5px] leading-[1.55]">{msg.text}</p>
                      )}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isSent ? "text-white/45" : "text-outline/60"}`}>
                        <span className="text-[10.5px] font-normal tabular-nums">
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {/* Double checkmark for sent messages */}
                        {isSent && (
                          <CheckCheckIcon className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />
    </>
  );
}

export default ChatContainer;
