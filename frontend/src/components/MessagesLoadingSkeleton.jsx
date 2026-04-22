function MessagesLoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((id, index) => (
        <div
          key={id}
          className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"} animate-pulse`}
        >
          <div className={`h-12 rounded-bubble ${index % 2 === 0 ? "w-48 bg-el-2" : "w-40 bg-primary-action/20"}`}></div>
        </div>
      ))}
    </div>
  );
}
export default MessagesLoadingSkeleton;
