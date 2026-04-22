import { MessageCircleIcon } from "lucide-react";

const NoChatHistoryPlaceholder = ({ name }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 bg-gradient-to-br from-primary-action/15 to-primary-action/5 rounded-full flex items-center justify-center mb-5">
        <MessageCircleIcon className="size-8 text-primary-action" />
      </div>
      <h3 className="text-lg font-medium text-on-surface mb-3">
        Start your conversation with {name}
      </h3>
      <div className="flex flex-col space-y-3 max-w-md mb-5">
        <p className="text-on-surface-variant text-sm">
          This is the beginning of your conversation. Send a message to start chatting!
        </p>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary-action/20 to-transparent mx-auto"></div>
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
