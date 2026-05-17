import { Loader2 } from "lucide-react";

export default function WorkspaceLoading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-8 animate-in fade-in duration-300">
      {/* Premium Glassmorphic Loader Card */}
      <div className="relative p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full text-center">
        {/* Pulsing glow background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-[3rem] blur-2xl opacity-10 animate-pulse"></div>
        
        {/* Animated Spining Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={48} strokeWidth={2.5} />
          {/* Inner brand dot pulsing */}
          <div className="absolute w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping"></div>
        </div>

        <div className="space-y-1.5 mt-2 relative z-10">
          <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-widest uppercase">
            Đang tải dữ liệu...
          </h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] leading-none">
            Chánh Hưng Workspace
          </p>
        </div>
      </div>

      {/* Skeletons simulating components loading */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 mt-6 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="h-6 bg-slate-300 dark:bg-slate-800 rounded-lg w-2/3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-slate-300 dark:bg-slate-800 rounded-md w-full animate-pulse" />
              <div className="h-4 bg-slate-300 dark:bg-slate-800 rounded-md w-5/6 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
