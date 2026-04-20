import { useState, useRef, useCallback, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

import {
  MessageSquareIcon,
  UsersIcon,
  LogOutIcon,
} from "lucide-react";

/** Clamp a value between min and max. */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const SIDEBAR_MIN = 260;
const SIDEBAR_DEFAULT = 340;
/** Max sidebar width = 50% of viewport (minus icon rail ~52px) */
const getSidebarMax = () => Math.floor((window.innerWidth - 52) / 2);

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const { logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* ── Resizable sidebar state ──────────────────────────────────── */
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("chatify_sidebar_w");
    return saved ? clamp(Number(saved), SIDEBAR_MIN, getSidebarMax()) : SIDEBAR_DEFAULT;
  });
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(SIDEBAR_DEFAULT);

  const onPointerDown = useCallback((e) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [sidebarWidth]);

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!isDragging.current) return;
      const newW = clamp(startW.current + (e.clientX - startX.current), SIDEBAR_MIN, getSidebarMax());
      setSidebarWidth(newW);
    };
    const onPointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      localStorage.setItem("chatify_sidebar_w", String(sidebarWidth));
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [sidebarWidth]);

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar  = () => setIsSidebarOpen(true);

  return (
    <div className="flex h-dvh w-full overflow-hidden">

      {/* ── ZONE 1: Icon Rail (hidden on mobile) ────────────────────── */}
      <nav
        className="hidden md:flex flex-col items-center w-[52px] bg-surface-lowest py-4 flex-shrink-0 border-r border-outline-variant/30"
        aria-label="Main navigation"
      >
        {/* App logo */}
        <div className="mb-8 flex items-center justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary-action flex items-center justify-center glow-blue">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </div>

        {/* Nav icons — only essential items */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <NavRailButton icon={<MessageSquareIcon className="w-5 h-5" />} label="Chats" isActive />
          <NavRailButton icon={<UsersIcon className="w-5 h-5" />} label="Contacts" />
        </div>

        {/* Bottom — logout only */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-outline hover:text-ds-error hover:bg-ds-error/10 transition-colors"
            aria-label="Log out"
          >
            <LogOutIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* ── Mobile backdrop overlay ───────────────────────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── ZONE 2: Conversation Sidebar ─────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30
          w-72 sm:w-80
          bg-surface-low
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0
          md:border-r md:border-outline-variant/20
          flex-shrink-0
        `}
        style={{ width: typeof window !== "undefined" && window.innerWidth >= 768 ? sidebarWidth : undefined }}
        aria-label="Contacts sidebar"
      >
        <ProfileHeader onClose={closeSidebar} />
        <ActiveTabSwitch />

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 sidebar-scroll">
          {activeTab === "chats" ? (
            <ChatsList onSelectUser={closeSidebar} />
          ) : (
            <ContactList onSelectUser={closeSidebar} />
          )}
        </div>
      </aside>

      {/* ── Panel Resizer Handle (desktop only) ──────────────────── */}
      <div
        className="hidden md:flex items-center justify-center w-[5px] flex-shrink-0 cursor-col-resize group hover:bg-primary-action/20 active:bg-primary-action/30 transition-colors select-none"
        onPointerDown={onPointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      >
        <div className="w-[2px] h-8 rounded-full bg-outline-variant/30 group-hover:bg-primary-action/60 group-active:bg-primary-action transition-colors" />
      </div>

      {/* ── ZONE 3: Primary Chat Workspace ───────────────────────── */}
      <div className="flex-1 flex flex-col bg-surface min-w-0">
        {selectedUser ? (
          <ChatContainer onOpenSidebar={openSidebar} />
        ) : (
          <NoConversationPlaceholder onOpenSidebar={openSidebar} />
        )}
      </div>

    </div>
  );
}

/** Small helper for the icon-rail nav buttons */
function NavRailButton({ icon, label, isActive = false }) {
  return (
    <button
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
        isActive
          ? "bg-primary-action/15 text-primary-action"
          : "text-outline hover:text-on-surface hover:bg-surface-high/60"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export default ChatPage;

