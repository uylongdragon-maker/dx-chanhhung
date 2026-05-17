// Instant skeleton shown while chat data loads
export default function ChatLoading() {
  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] animate-in fade-in duration-200">
      {/* Sidebar skeleton */}
      <div className="hidden sm:flex flex-col w-64 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2rem] overflow-hidden p-4 gap-3">
        <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        {[1,2,3,4].map(i => (
          <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2rem] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100/60 dark:border-slate-800/60">
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
              <div className={`h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse ${i % 2 === 0 ? "w-48 bg-blue-100 dark:bg-blue-900/30" : "w-64"}`} />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100/60 dark:border-slate-800/60">
          <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
