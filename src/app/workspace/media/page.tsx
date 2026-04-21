import { prisma } from "@/utils/prisma";
import MediaPoolGallery from "./MediaGallery";
import { Image as ImageIcon, Video, FileText, Download, LayoutGrid } from "lucide-react";

export default async function MediaPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploader: true },
  });

  return (
    <div className="flex flex-col h-full relative gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-4 tracking-tighter">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
              <LayoutGrid size={32} />
            </div>
            Media Pool
          </h2>
          <p className="text-slate-500 mt-2 font-medium italic text-lg ml-1">
            Kho tài nguyên nội dung tập quy tụ tinh hoa truyền thông của Ban.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl px-6 py-3 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-white/60 transition-all shadow-sm active:scale-95">
            <Download size={18} className="text-indigo-500" />
            Tải về tất cả
          </button>
        </div>
      </div>

      <MediaPoolGallery initialMedia={media} />
    </div>
  );
}
