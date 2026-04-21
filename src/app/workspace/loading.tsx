export default function WorkspaceLoading() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      {/* Vòng xoay mượt mà */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-white/40 shadow-inner"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        {/* Chấm sáng chớp tắt ở giữa */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
      </div>
      
      <p className="text-slate-500 font-semibold text-sm animate-pulse tracking-wide">
        Đang đồng bộ trạm hành dinh...
      </p>
    </div>
  )
}
