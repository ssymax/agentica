export function LoadingSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-b border-border-light px-4 py-3 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3.5 w-48 rounded bg-muted" />
            <div className="h-4 w-16 rounded-full bg-muted" />
          </div>
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
