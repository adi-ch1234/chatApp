import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { FileIcon } from "lucide-react";

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

function ChatContainer() {
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

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-6 overflow-y-auto py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              >
                <div
                  className={`chat-bubble relative ${
                    msg.senderId === authUser._id
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Shared image"
                      className="rounded-lg max-h-48 object-cover mb-2"
                      loading="lazy"
                    />
                  )}
                  {msg.fileUrl && isSafeFileUrl(msg.fileUrl) && (
                    <a
                      href={msg.fileUrl.includes("cloudinary.com") ? msg.fileUrl.replace("/upload/", "/upload/fl_attachment/") : msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={msg.fileName || "attachment"}
                      className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors mb-2"
                    >
                      <FileIcon className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                      <span className="text-sm underline break-all hover:text-cyan-200">
                        {msg.fileName || "Download Attachment"}
                      </span>
                    </a>
                  )}
                  {msg.text && <p>{msg.text}</p>}
                  <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
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
