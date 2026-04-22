import { MessageCircleIcon, MenuIcon } from "lucide-react";

/**
 * NoConversationPlaceholder — shown when no chat is selected.
 * `onOpenSidebar` triggers the mobile sidebar on narrow viewports.
 */
const NoConversationPlaceholder = ({ onOpenSidebar }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="size-20 bg-primary-action/10 rounded-full flex items-center justify-center mb-6">
        <MessageCircleIcon className="size-10 text-primary-action" />
      </div>
      <h3 className="text-xl font-semibold text-on-surface mb-2">Select a conversation</h3>
      <p className="text-on-surface-variant max-w-md text-sm sm:text-base">
        Choose a contact from the sidebar to start chatting or continue a previous conversation.
      </p>

      {/* Visible only on mobile — nudges the user to open the contact list */}
      <button
        onClick={onOpenSidebar}
        className="md:hidden mt-6 flex items-center gap-2 px-5 py-3 rounded-pill bg-primary-action/10 hover:bg-primary-action/20 text-primary-action font-medium transition-colors min-h-[44px]"
        aria-label="Open contacts"
      >
        <MenuIcon className="w-4 h-4" />
        Open Contacts
      </button>
    </div>
  );
};

export default NoConversationPlaceholder;
