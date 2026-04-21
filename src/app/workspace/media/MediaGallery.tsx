"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { saveMedia } from "./actions";
import { 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  MoreVertical, 
  Download, 
  Trash2, 
  Eye, 
  Loader2,
  Filter,
  LayoutGrid
} from "lucide-react";

type MediaTypeFilter = "all" | "IMAGE" | "VIDEO" | "DOCUMENT";

export default function MediaPoolGallery({ initialMedia }: { initialMedia: any[] }) {
  const [filter, setFilter] = useState<MediaTypeFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, startTransition] = useTransition();

  const supabase = createClient();

  const filteredMedia = initialMedia.filter((item) => {
    const matchesType = filter === "all" || item.type === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (error) {
        alert("Upload error: " + error.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      const type = file.type.startsWith("image") ? "IMAGE" : file.type.startsWith("video") ? "VIDEO" : "DOCUMENT";
      const size = (file.size / (1024 * 1024)).toFixed(1) + " MB";

      const formData = new FormData();
      formData.append("name", file.name);
      formData.append("url", publicUrl);
      formData.append("type", type);
      formData.append("size", size);
      formData.append("tag", "General");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) formData.append("uploaderId", user.id);

      await saveMedia(formData);
    });
  };

  const categories = [
    { label: "Tất cả", value: "all", icon: <Filter size={14} /> },
    { label: "Hình ảnh", value: "IMAGE", icon: <ImageIcon size={14} /> },
    { label: "Video", value: "VIDEO", icon: <Video size={14} /> },
    { label: "Tài liệu", value: "DOCUMENT", icon: <FileText size={14} /> },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* 1. CONTROLS BAR: CATEGORIES & SEARCH */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full xl:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value as MediaTypeFilter)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${
                filter === cat.value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                  : "bg-white/40 dark:bg-slate-900/40 text-slate-500 border-white/60 dark:border-slate-800/60 hover:bg-white/60"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full xl:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm tài nguyên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
          />
        </div>
      </div>

      {/* 2. MEDIA GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        
        {/* UPLOAD CARD: INTERACTIVE DROPZONE */}
        <label className="aspect-[4/3] rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 hover:border-indigo-400/50 transition-all group overflow-hidden relative">
          <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
          {isUploading ? (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <Loader2 className="text-indigo-600 animate-spin" size={40} />
                <span className="text-[10px] font-black text-indigo-600 mt-4 uppercase tracking-[0.2em]">Đang đẩy dữ liệu...</span>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                <Plus size={32} />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  Thêm Tài nguyên
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Bấm hoặc kéo thả tại đây</span>
              </div>
            </>
          )}
        </label>

        {/* MEDIA TILES */}
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-2"
          >
            {/* Preview Image / Placeholder */}
            {item.type === "IMAGE" ? (
                <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
            ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
                    {item.type === "VIDEO" ? <Video size={64} /> : <FileText size={64} />}
                </div>
            )}
            
            {/* TOP BADGE: TYPE */}
            <div className="absolute top-4 right-4 z-20">
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 text-slate-600 dark:text-slate-300 shadow-sm">
                    {item.type === "IMAGE" ? <ImageIcon size={14} /> : item.type === "VIDEO" ? <Video size={14} /> : <FileText size={14} />}
                </div>
            </div>

            {/* HOVER OVERLAY: DETAILED INFO */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 back to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-6 flex flex-col justify-end gap-4 translate-y-4 group-hover:translate-y-0">
                <div className="space-y-1">
                    <p className="text-white text-sm font-black truncate leading-tight">{item.name}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{item.size}</span>
                        <span className="text-[8px] text-white/40 text-xs font-medium">•</span>
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{item.tag}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                    <Eye size={12} /> Xem
                  </button>
                  <button className="p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-colors">
                    <Download size={14} />
                  </button>
                  <button className="p-2.5 bg-red-500/20 backdrop-blur-md text-red-400 rounded-xl hover:bg-red-500/40 transition-colors border border-red-500/20">
                    <Trash2 size={14} />
                  </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMedia.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center text-slate-400 animate-in fade-in duration-500">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
            <LayoutGrid size={48} className="opacity-20" />
          </div>
          <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">Kho tài nguyên trống</h4>
          <p className="text-sm font-medium mt-2 max-w-xs text-center leading-relaxed">Hãy tải lên các nội dung nòng cốt đầu tiên để bắt đầu xây dựng thư viện của Ban.</p>
        </div>
      )}
    </div>
  );
}
