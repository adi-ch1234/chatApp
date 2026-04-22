function UsersLoadingSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-3 px-3 py-3 rounded-xl animate-pulse">
          <div className="w-12 h-12 bg-surface-high rounded-full flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-surface-high rounded-lg w-3/4 mb-2"></div>
            <div className="h-3 bg-surface-high/60 rounded-lg w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default UsersLoadingSkeleton;
