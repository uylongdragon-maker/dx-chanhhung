// Instant skeleton shown while kanban data loads
export default function KanbanLoading() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>

      {/* Stats bar skeleton */}
      <div className="flex gap-2 mb-5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-10 w-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>

      {/* Board columns skeleton */}
      <div className="flex gap-4 flex-1">
        {[1,2,3].map(col => (
          <div key={col} className="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2rem] p-4 space-y-3">
            <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-700" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
