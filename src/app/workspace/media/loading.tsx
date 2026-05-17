// Generic skeleton for meetings/team/settings/library/media pages
export default function GenericPageLoading() {
  return (
    <div className="animate-in fade-in duration-200 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-40 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
