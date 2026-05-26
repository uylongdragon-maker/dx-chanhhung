import { Loader2 } from "lucide-react";

export default function WorkspaceLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-end items-center overflow-hidden font-sans animate-in fade-in duration-300">
      {/* Background Image - Dynamic Splash */}
      <div 
        className="absolute inset-0 bg-[url('/mobile-splash.png')] bg-cover bg-center"
        style={{ backgroundSize: "cover", backgroundPosition: "center" }}
      />

      {/* Glassmorphic Loading Overlay */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-xs flex flex-col items-center gap-3.5 mb-[24vh]">
        
        {/* Animated Spining Ring */}
        <div className="relative w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
          <Loader2 className="animate-spin text-white" size={24} strokeWidth={2.5} />
          <div className="absolute w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
        </div>

        {/* Loading details */}
        <div className="flex flex-col items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/75">
          <span className="animate-pulse">Đang tải dữ liệu hệ thống...</span>
        </div>

      </div>
    </div>
  );
}
