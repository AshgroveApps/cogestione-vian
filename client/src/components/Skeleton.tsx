export function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-night-900/10 px-5 pt-5 pb-4">
        <div className="skeleton h-5 w-24" />
        <div className="skeleton mt-3 h-6 w-4/5" />
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-5/6" />
        <div className="skeleton h-3.5 w-2/3" />
      </div>
      <div className="border-t border-night-900/10 px-5 py-3.5">
        <div className="skeleton h-8 w-36" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonLines({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-4 w-full" />
      ))}
    </div>
  );
}
