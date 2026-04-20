import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Returns a relative time label like "12:43 PM", "Yesterday", "Tuesday", etc.
 */
function getRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today - msgDate) / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * ChatsList — renders the user's recent chat partners.
 * `onSelectUser` is called after a user is picked (e.g., closes mobile sidebar).
 */
function ChatsList({ onSelectUser }) {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, selectedUser, searchQuery } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  const handleSelect = (chat) => {
    setSelectedUser(chat);
    onSelectUser?.();
  };

  const filteredChats = searchQuery
    ? chats.filter((c) => c.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  return (
    <>
      {filteredChats.map((chat) => {
        const isOnline = onlineUsers.includes(chat._id);
        const isSelected = selectedUser?._id === chat._id;
        // Use lastMessage if available from chat data, otherwise show status
        const preview = chat.lastMessage?.text || (isOnline ? "Online" : "Tap to chat");
        const timeLabel = chat.lastMessage?.createdAt
          ? getRelativeTime(chat.lastMessage.createdAt)
          : (isOnline ? "" : "");

        return (
          <div
            key={chat._id}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
              isSelected
                ? "bg-primary-action/10"
                : "hover:bg-surface-high/40 active:scale-[0.98]"
            }`}
            onClick={() => handleSelect(chat)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleSelect(chat)}
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={chat.profilePic || "/avatar.png"}
                  alt={chat.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-[2.5px] ring-surface-low" />
              )}
            </div>

            {/* Name + last message + timestamp */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-on-surface font-semibold text-[14px] truncate">{chat.fullName}</h4>
                <span className="text-[11px] text-outline flex-shrink-0 whitespace-nowrap">
                  {timeLabel}
                </span>
              </div>
              <p className="text-[13px] text-on-surface-variant/70 truncate mt-0.5 leading-snug">
                {preview}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
export default ChatsList;
