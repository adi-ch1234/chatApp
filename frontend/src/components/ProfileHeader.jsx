import { useState, useRef } from "react";
import { VolumeOffIcon, Volume2Icon, XIcon, SearchIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

/** Lazy singleton — Audio object is created on first user interaction, not at import time. */
let _mouseClickSound = null;
function getMouseClickSound() {
  if (!_mouseClickSound) _mouseClickSound = new Audio("/sounds/mouse-click.mp3");
  return _mouseClickSound;
}

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * ProfileHeader — sidebar header with logo, avatar, search bar, and action buttons.
 * `onClose` prop is called on mobile to collapse the sidebar.
 */
function ProfileHeader({ onClose }) {
  const { authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound, setSearchQuery } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [localSearch, setLocalSearch] = useState("");

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    setSearchQuery(value);
  };

  const clearSearch = () => {
    setLocalSearch("");
    setSearchQuery("");
  };

  return (
    <div className="px-4 pt-5 pb-3">
      {/* Top row: Logo + avatar + actions */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* App icon (matching icon rail logo) */}
          <div className="w-8 h-8 rounded-lg bg-primary-action flex items-center justify-center flex-shrink-0 glow-blue">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          {/* Brand name */}
          <h1 className="text-lg font-bold text-on-surface tracking-tight">LOQUI</h1>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-0.5 items-center flex-shrink-0">
          {/* AVATAR — clickable to change profile pic */}
          <button
            type="button"
            className="w-8 h-8 rounded-full overflow-hidden relative group flex-shrink-0"
            onClick={() => fileInputRef.current.click()}
            aria-label="Change profile picture"
          >
            <img
              src={selectedImg || authUser.profilePic || "/avatar.png"}
              alt="User profile"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-[8px]">Edit</span>
            </div>
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* SOUND TOGGLE BTN */}
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface transition-colors hover:bg-surface-high/50"
            onClick={() => {
              const sound = getMouseClickSound();
              sound.currentTime = 0;
              sound.play().catch((error) => console.warn("Audio play failed:", error));
              toggleSound();
            }}
            aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="w-4 h-4" />
            ) : (
              <VolumeOffIcon className="w-4 h-4" />
            )}
          </button>

          {/* CLOSE SIDEBAR BTN — mobile only */}
          {onClose && (
            <button
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface transition-colors hover:bg-surface-high/50"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search bar — pill shape, now functional */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder="Search conversations..."
          className="w-full bg-surface-container rounded-xl py-2.5 pl-10 pr-9 text-sm text-on-surface placeholder-outline/60 focus:outline-none focus:ring-1 focus:ring-primary-action/30 transition-all border border-outline-variant/10"
        />
        {localSearch && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-outline hover:text-on-surface transition-colors"
            aria-label="Clear search"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
export default ProfileHeader;
