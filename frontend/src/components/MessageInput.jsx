import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { PlusCircleIcon, SendIcon, XIcon, FileIcon, SmileIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [fileData, setFileData] = useState(null);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !filePreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    const payload = {
      text: text.trim(),
    };

    if (fileData) {
      if (fileData.type.startsWith("image/")) {
        payload.image = filePreview;
      } else {
        payload.file = filePreview;
        payload.fileType = fileData.type;
        payload.fileName = fileData.name;
      }
    }

    sendMessage(payload);
    setText("");
    setFilePreview(null);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result);
      setFileData({ name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setFilePreview(null);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="px-4 sm:px-6 py-3 bg-surface border-t border-outline-variant/10">
      {/* File / image preview */}
      {filePreview && (
        <div className="mb-3 flex items-center">
          <div className="relative">
            {fileData?.type.startsWith("image/") ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-2xl border border-outline-variant/30"
              />
            ) : (
              <div className="w-20 h-20 flex flex-col items-center justify-center bg-el-1 rounded-2xl border border-outline-variant/30 px-2 overflow-hidden">
                <FileIcon className="w-8 h-8 text-primary-action mb-1 flex-shrink-0" />
                <span className="text-[10px] text-on-surface-variant truncate w-full text-center" title={fileData?.name}>
                  {fileData?.name}
                </span>
              </div>
            )}
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-high flex items-center justify-center text-on-surface hover:bg-el-2 shadow-md transition-colors"
              type="button"
              aria-label="Remove file"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-surface-high/60 ${
            filePreview ? "text-primary-action" : "text-on-surface-variant/70 hover:text-on-surface"
          }`}
          aria-label="Attach file"
        >
          <PlusCircleIcon className="w-5 h-5" />
        </button>

        <input
          type="file"
          accept="*/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Pill-shaped input container */}
        <div className="flex-1 min-w-0 flex items-center bg-el-1 rounded-pill px-4 py-0.5 focus-within:ring-1 focus-within:ring-primary-action/25 transition-all border border-outline-variant/8">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              isSoundEnabled && playRandomKeyStrokeSound();
            }}
            className="flex-1 min-w-0 bg-transparent py-2.5 text-on-surface placeholder-outline/40 text-[14.5px] focus:outline-none"
            placeholder="Type your message..."
          />

          {/* Emoji icon inside pill */}
          <button
            type="button"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface-variant transition-colors rounded-full"
            aria-label="Emoji picker"
          >
            <SmileIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() && !filePreview}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary-action text-white rounded-full hover:bg-primary-dark transition-all disabled:opacity-20 disabled:cursor-not-allowed glow-blue disabled:shadow-none"
          aria-label="Send message"
        >
          <SendIcon className="w-[18px] h-[18px]" />
        </button>
      </form>
    </div>
  );
}
export default MessageInput;
