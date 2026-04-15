function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <Pulse className="mb-3 h-3 w-24" />
          <Pulse className="h-7 w-32" />
        </div>
      ))}
    </div>
  );
}

export function CategorySectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl bg-white p-5 shadow-card lg:col-span-2">
        <Pulse className="mb-4 h-4 w-32" />
        <div className="flex items-center justify-center py-8">
          <Pulse className="h-48 w-48 rounded-full" />
        </div>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <Pulse className="mb-4 h-4 w-20" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Pulse key={i} className="h-14" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HistorySectionSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <Pulse className="mb-4 h-4 w-36" />
      <div className="flex items-end gap-3 px-2 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full animate-pulse rounded-xl bg-slate-100"
              style={{ height: '60px' }}
            />
            <Pulse className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BottomSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <Pulse className="mb-4 h-4 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_item, j) => (
              <div key={j} className="flex items-center gap-3">
                <Pulse className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Pulse className="h-3 w-3/4" />
                  <Pulse className="h-2.5 w-1/2" />
                </div>
                <Pulse className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
