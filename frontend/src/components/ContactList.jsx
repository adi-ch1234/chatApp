import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

/**
 * ContactList — renders all app contacts.
 * `onSelectUser` is called after a contact is picked (e.g., closes mobile sidebar).
 */
function ContactList({ onSelectUser }) {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading, selectedUser, searchQuery } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const handleSelect = (contact) => {
    setSelectedUser(contact);
    onSelectUser?.();
  };

  const filteredContacts = searchQuery
    ? allContacts.filter((c) => c.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    : allContacts;

  return (
    <>
      {filteredContacts.map((contact) => {
        const isOnline = onlineUsers.includes(contact._id);
        const isSelected = selectedUser?._id === contact._id;

        return (
          <div
            key={contact._id}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
              isSelected
                ? "bg-primary-action/10"
                : "hover:bg-surface-high/40 active:scale-[0.98]"
            }`}
            onClick={() => handleSelect(contact)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleSelect(contact)}
          >
            {/* Avatar with online indicator */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={contact.profilePic || "/avatar.png"}
                  alt={contact.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-[2.5px] ring-surface-low" />
              )}
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <h4 className="text-on-surface font-semibold text-[14px] truncate">{contact.fullName}</h4>
              <p className="text-[13px] text-on-surface-variant/70 truncate mt-0.5 leading-snug">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
}
export default ContactList;
