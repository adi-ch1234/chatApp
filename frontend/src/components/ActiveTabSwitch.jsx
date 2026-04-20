import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  const chips = [
    { key: "chats", label: "All Chats" },
    { key: "contacts", label: "All Contacts" },
  ];

  return (
    <div className="flex gap-2 px-4 pb-3 pt-1">
      {chips.map((chip) => {
        const isActive = activeTab === chip.key;

        return (
          <button
            key={chip.key}
            onClick={() => setActiveTab(chip.key)}
            className={`px-4 py-1.5 rounded-pill text-xs font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary-action/15 text-primary-action border border-primary-action/25"
                : "text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-high/30 border border-transparent"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
export default ActiveTabSwitch;
