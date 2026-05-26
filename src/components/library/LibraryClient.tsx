"use client";

import { useState, useTransition, useRef } from "react";
import { 
  FolderOpen, FileText, Download, Search, Plus, Trash2, Edit3, X, 
  Sparkles, Upload, Loader2, Play, Lock, Eye, Check, AlertTriangle, Video, ExternalLink
} from "lucide-react";
import { saveLibraryItem, deleteLibraryItem, renderDocxToHtml } from "@/app/actions/library";
import toast from "react-hot-toast";

interface LibraryItem {
  id?: string;
  title: string;
  category: string;
  content: string;
  fileUrl?: string | null;
  embedUrl?: string | null;
  password?: string | null;
  createdAt?: string | Date;
}

interface Props {
  initialItems: LibraryItem[];
  currentUser: any;
}

const CATEGORIES = [
  "Văn bản kế hoạch",
  "Thông báo",
  "Nội dung tập huấn",
  "Tài liệu chuyên môn",
  "Tài liệu hướng dẫn"
];

// Helper to extract YouTube ID
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper to detect if a file is PDF or DOCX
function getFileType(url: string | null | undefined) {
  if (!url) return "OTHER";
  if (url.startsWith("data:application/pdf") || url.toLowerCase().includes(".pdf")) return "PDF";
  if (url.startsWith("data:application/vnd.openxmlformats-officedocument") || url.toLowerCase().includes(".docx") || url.toLowerCase().includes(".doc")) return "DOCX";
  return "OTHER";
}

export default function LibraryClient({ initialItems, currentUser }: Props) {
  const [items, setItems] = useState<LibraryItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Admin states
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "EDITOR";
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);

  // Form states for creating/editing LibraryItem
  const [formState, setFormState] = useState<LibraryItem>({
    title: "",
    category: "Văn bản kế hoạch",
    content: "",
    fileUrl: "",
    embedUrl: "",
    password: ""
  });

  // Modal / Interaction states
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; type: string; title: string } | null>(null);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [loadingDocx, setLoadingDocx] = useState(false);
  
  // Password prompt states
  const [passwordPrompt, setPasswordPrompt] = useState<{
    item: LibraryItem;
    action: "VIEW" | "DOWNLOAD";
    onSuccess: () => void;
  } | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");

  const resetForm = () => {
    setFormState({
      title: "",
      category: "Văn bản kế hoạch",
      content: "",
      fileUrl: "",
      embedUrl: "",
      password: ""
    });
    setEditingItem(null);
  };

  // Handle local file read to base64 for easy database storage
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormState(prev => ({
        ...prev,
        fileUrl: event.target?.result as string
      }));
      toast.success(`Đã chuẩn bị tệp: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Save document
  const handleSave = () => {
    if (!formState.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu!");
      return;
    }

    startTransition(async () => {
      const res = await saveLibraryItem({
        ...formState,
        id: editingItem?.id
      });

      if (res.success && res.data) {
        toast.success(editingItem ? "Đã cập nhật tài liệu!" : "Đã thêm tài liệu mới!");
        
        setItems(prev => {
          if (editingItem) {
            return prev.map(item => item.id === editingItem.id ? (res.data as any) : item);
          } else {
            return [res.data as any, ...prev];
          }
        });

        setIsEditing(false);
        resetForm();
      } else {
        toast.error(res.error || "Gặp lỗi khi lưu tài liệu.");
      }
    });
  };

  // Delete document
  const handleDelete = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này khỏi thư viện?")) return;

    startTransition(async () => {
      const res = await deleteLibraryItem(id);
      if (res.success) {
        toast.success("Đã xóa tài liệu!");
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error(res.error || "Không thể xóa tài liệu.");
      }
    });
  };

  const handleStartEdit = (item: LibraryItem) => {
    setEditingItem(item);
    setFormState({
      title: item.title,
      category: item.category,
      content: item.content,
      fileUrl: item.fileUrl || "",
      embedUrl: item.embedUrl || "",
      password: item.password || ""
    });
    setIsEditing(true);
  };

  // Password Verification Logic
  const handleAccessCheck = (item: LibraryItem, action: "VIEW" | "DOWNLOAD", onSuccess: () => void) => {
    if (item.password && item.password.trim().length > 0) {
      setPasswordPrompt({ item, action, onSuccess });
      setEnteredPassword("");
    } else {
      onSuccess();
    }
  };

  const verifyPassword = () => {
    if (!passwordPrompt) return;
    if (enteredPassword === passwordPrompt.item.password) {
      toast.success("Xác thực thành công!");
      const successCb = passwordPrompt.onSuccess;
      setPasswordPrompt(null);
      successCb();
    } else {
      toast.error("Sai mật khẩu truy cập tài liệu!");
    }
  };

  // Viewing files using specialized view links
  const triggerViewDoc = async (item: LibraryItem) => {
    const fileUrl = item.fileUrl;
    if (!fileUrl) return;

    const fileType = getFileType(fileUrl);
    
    setViewingDoc({
      url: fileUrl,
      type: fileType,
      title: item.title
    });

    if (fileType === "DOCX" && fileUrl.startsWith("data:")) {
      setLoadingDocx(true);
      setDocxHtml(null);
      try {
        const res = await renderDocxToHtml(fileUrl);
        if (res.success && res.html) {
          setDocxHtml(res.html);
        } else {
          toast.error(res.error || "Không thể hiển thị tài liệu Word trực tuyến.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Gặp lỗi khi xử lý tài liệu.");
      } finally {
        setLoadingDocx(false);
      }
    }
  };

  const triggerDownloadDoc = (item: LibraryItem) => {
    const fileUrl = item.fileUrl;
    if (!fileUrl) return;

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = item.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đang bắt đầu tải xuống tài liệu!");
  };

  // Filters
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "Tất cả" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── SECTION A: HEADER & ACTION PANEL ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-800/10 p-6 md:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-[#7360f2]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[#7360f2] text-xs font-black uppercase tracking-widest mb-1.5">
            <FolderOpen size={14} /> Tàng Kinh Các Điện Tử
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Thư Viện Tri Thức</h1>
          <p className="text-slate-500 text-xs font-bold mt-1 max-w-xl">
            Lưu trữ kịch bản, kế hoạch, nội dung tập huấn, tài liệu chuyên môn và hướng dẫn trực quan của Đội ngũ CHX.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {isAdmin && (
            <button 
              onClick={() => { resetForm(); setIsEditing(true); }}
              className="flex items-center justify-center gap-1.5 px-4.5 py-3 text-xs font-black uppercase tracking-wider text-white bg-[#7360f2] hover:bg-[#5f4de0] rounded-xl shadow-lg shadow-[#7360f2]/10 active:scale-95 transition-all w-full sm:w-auto"
            >
              <Plus size={14} /> Thêm tài liệu
            </button>
          )}
        </div>
      </div>

      {/* ── SECTION B: FILTERS & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto w-full pb-1.5 scrollbar-hide shrink-0 md:w-auto">
          {["Tất cả", ...CATEGORIES].map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  isActive 
                    ? "bg-[#7360f2] text-white shadow-md shadow-[#7360f2]/20" 
                    : "bg-white/40 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800/10 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text"
            placeholder="Tìm tài liệu, quy trình..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 text-xs font-bold rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* ── SECTION C: ADMIN DOCUMENT CREATOR/EDITOR PANEL ── */}
      {isEditing && (
        <div className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-800/10 p-6 md:p-8 rounded-[2.5rem] flex flex-col gap-5 animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-[#7360f2] uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} /> {editingItem ? "Hiệu chỉnh Tài liệu" : "Đăng tài liệu mới vào Thư viện"}
            </h3>
            <button 
              onClick={() => { setIsEditing(false); resetForm(); }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tiêu đề tài liệu</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tài liệu hướng dẫn sử dụng OBS Studio"
                  value={formState.title}
                  onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Phân loại danh mục</label>
                  <select 
                    value={formState.category}
                    onChange={e => setFormState(prev => ({ ...prev, category: e.target.value }))}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Mật khẩu tải xuống (Tùy chọn)</label>
                  <input 
                    type="text" 
                    placeholder="Không khóa nếu để trống"
                    value={formState.password || ""}
                    onChange={e => setFormState(prev => ({ ...prev, password: e.target.value }))}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none text-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Đường dẫn nhúng Video (YouTube / TikTok)</label>
                <input 
                  type="text" 
                  placeholder="Dành cho Tài liệu hướng dẫn trực quan bằng video"
                  value={formState.embedUrl || ""}
                  onChange={e => setFormState(prev => ({ ...prev, embedUrl: e.target.value }))}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Mô tả tóm tắt nội dung</label>
                <textarea 
                  rows={4} 
                  placeholder="Ghi chú tóm tắt nội dung chính của tài liệu..."
                  value={formState.content}
                  onChange={e => setFormState(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none resize-none flex-1 leading-relaxed"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Đính kèm tài liệu (PDF / Word)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="URL tài liệu hoặc tải lên tệp trực tiếp"
                    value={formState.fileUrl || ""}
                    onChange={e => setFormState(prev => ({ ...prev, fileUrl: e.target.value }))}
                    className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 outline-none"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                      className="hidden" 
                      id="lib-file-uploader"
                    />
                    <label 
                      htmlFor="lib-file-uploader"
                      className="flex items-center justify-center p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer text-slate-600 dark:text-slate-300 transition-colors"
                      title="Tải tệp từ máy tính"
                    >
                      <Upload size={16} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); resetForm(); }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase rounded-xl transition-all"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-5 py-2.5 bg-[#7360f2] hover:bg-[#5f4de0] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : "Lưu tài liệu"}
            </button>
          </div>
        </div>
      )}

      {/* ── SECTION D: DOCUMENTS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const hasVideo = item.embedUrl && item.embedUrl.trim().length > 0;
            const ytId = hasVideo ? getYouTubeId(item.embedUrl!) : null;
            const hasFile = item.fileUrl && item.fileUrl.trim().length > 0;
            const isLocked = item.password && item.password.trim().length > 0;
            const fileType = hasFile ? getFileType(item.fileUrl) : "OTHER";

            return (
              <div 
                key={item.id}
                className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-800/10 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-4 hover:shadow-[0_8px_30px_rgba(115,96,242,0.06)] hover:-translate-y-0.5 transition-all group duration-300 relative overflow-hidden"
              >
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7360f2]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7360f2]/10 transition-all duration-300" />
                
                {/* Header */}
                <div className="flex justify-between items-start z-10">
                  <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border border-white/20 bg-slate-100/60 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400`}>
                    {item.category}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {isLocked && (
                      <span className="text-amber-500 p-1 bg-amber-500/10 rounded-lg" title="Tài liệu được bảo vệ bằng mật khẩu">
                        <Lock size={12} />
                      </span>
                    )}
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => handleStartEdit(item)}
                          className="text-slate-400 hover:text-[#7360f2] p-1.5 rounded-lg hover:bg-[#7360f2]/5 transition-all z-10"
                          title="Sửa tài liệu"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id!)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all z-10"
                          title="Xóa tài liệu"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Main Video Thumbnail embed (if YouTube) */}
                {ytId ? (
                  <div 
                    onClick={() => handleAccessCheck(item, "VIEW", () => setActiveVideo(ytId))}
                    className="relative w-full h-36 rounded-2xl overflow-hidden cursor-pointer group/video border border-slate-200/10 shadow-inner shrink-0"
                  >
                    <img 
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover/video:bg-black/45 transition-colors">
                      <div className="w-11 h-11 bg-white/95 text-[#7360f2] rounded-full flex items-center justify-center shadow-lg group-hover/video:scale-110 active:scale-95 transition-transform duration-300">
                        <Play size={18} fill="currentColor" className="translate-x-0.5" />
                      </div>
                    </div>
                    {/* Visual Video Badge */}
                    <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-[8px] font-black text-white px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1.5">
                      <Video size={8} /> Video hướng dẫn
                    </span>
                  </div>
                ) : hasVideo ? (
                  /* Custom video embed link (generic player button) */
                  <div 
                    onClick={() => handleAccessCheck(item, "VIEW", () => window.open(item.embedUrl!, "_blank"))}
                    className="relative w-full h-24 rounded-2xl overflow-hidden cursor-pointer border border-dashed border-[#7360f2]/20 bg-[#7360f2]/5 hover:bg-[#7360f2]/10 transition-colors flex flex-col items-center justify-center gap-1.5 shrink-0"
                  >
                    <Play size={20} className="text-[#7360f2]" />
                    <span className="text-[9px] font-black text-[#7360f2] uppercase tracking-wider flex items-center gap-1">
                      Xem video đính kèm <ExternalLink size={9} />
                    </span>
                  </div>
                ) : null}

                {/* Title */}
                <div className="flex-grow flex flex-col gap-1.5 z-10">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs md:text-sm uppercase tracking-tight group-hover:text-[#7360f2] transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal line-clamp-3">
                    {item.content}
                  </p>
                </div>

                {/* Footer Controls */}
                {hasFile && (
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center z-10">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${
                        fileType === "PDF" ? "bg-rose-50 text-rose-500 border border-rose-200/20" :
                        fileType === "DOCX" ? "bg-blue-50 text-blue-500 border border-blue-200/20" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {fileType}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleAccessCheck(item, "VIEW", () => triggerViewDoc(item))}
                        className="flex items-center gap-1 px-3 py-2 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all"
                      >
                        Đọc trực tuyến
                      </button>
                      <button 
                        onClick={() => handleAccessCheck(item, "DOWNLOAD", () => triggerDownloadDoc(item))}
                        className="p-2 bg-[#7360f2] text-white hover:bg-[#5f4de0] rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md shadow-[#7360f2]/10"
                        title="Tải tài liệu về máy"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/20 dark:bg-slate-900/10 rounded-[2.5rem] border border-white/10 dark:border-slate-800/10 backdrop-blur-md">
            <FolderOpen size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Chưa có tài liệu nào thuộc danh mục này</p>
          </div>
        )}
      </div>

      {/* ── SECTION E: LIGHTBOX VIDEO PLAYER MODAL ── */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl aspect-video rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X size={18} />
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* ── SECTION F: SPECIALIZED DOCUMENT VIEWER MODAL ── */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="text-[#7360f2]" size={20} />
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-xs md:text-sm uppercase tracking-tight line-clamp-1">{viewingDoc.title}</h3>
              </div>
              <button 
                onClick={() => {
                  setViewingDoc(null);
                  setDocxHtml(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Viewer Iframe container */}
            <div className="flex-grow bg-slate-100 dark:bg-slate-950 p-2 relative overflow-hidden min-h-0">
              {viewingDoc.type === "PDF" ? (
                /* PDF specialized displayer */
                <iframe 
                  src={viewingDoc.url}
                  className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-2xl border-none bg-white dark:bg-slate-900"
                  title="PDF Viewer"
                />
              ) : viewingDoc.type === "DOCX" ? (
                /* DOCX Specialized Displayer. If it's a base64 string, render parsed HTML, otherwise use Office View Link */
                viewingDoc.url.startsWith("data:") ? (
                  <div className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/10 p-6 md:p-8 scrollbar-thin">
                    {loadingDocx ? (
                      <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                        <Loader2 className="animate-spin text-[#7360f2] mb-3" size={32} />
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Đang tải tài liệu Word...</p>
                      </div>
                    ) : docxHtml ? (
                      <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-medium leading-relaxed docx-preview-content">
                        <style jsx global>{`
                          .docx-preview-content h1 { font-size: 1.5rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #7360f2; text-transform: uppercase; }
                          .docx-preview-content h2 { font-size: 1.25rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; border-left: 3px solid #7360f2; padding-left: 8px; }
                          .docx-preview-content h3 { font-size: 1.1rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
                          .docx-preview-content p { font-size: 0.85rem; margin-bottom: 0.75rem; line-height: 1.6; text-align: justify; }
                          .docx-preview-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; font-size: 0.85rem; }
                          .docx-preview-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; font-size: 0.85rem; }
                          .docx-preview-content li { margin-bottom: 0.25rem; }
                          .docx-preview-content table { width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1rem; font-size: 0.8rem; }
                          .docx-preview-content th, .docx-preview-content td { border: 1px solid rgba(148, 163, 184, 0.2); padding: 8px 12px; text-align: left; }
                          .docx-preview-content th { background-color: rgba(115, 96, 242, 0.05); font-weight: 750; }
                          .docx-preview-content strong { font-weight: 750; }
                        `}</style>
                        <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center min-h-[300px]">
                        <p className="text-xs text-rose-500 font-bold mb-4">Lỗi khi trích xuất tài liệu Word trực tuyến.</p>
                        <button 
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = viewingDoc.url;
                            link.download = viewingDoc.title;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-6 py-3 bg-[#7360f2] hover:bg-[#5f4de0] text-white text-xs font-black uppercase rounded-2xl shadow-lg transition-transform active:scale-95"
                        >
                          Tải tệp xuống để đọc
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <iframe 
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewingDoc.url)}`}
                    className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-2xl border-none"
                    title="Office Docx Viewer"
                  />
                )
              ) : (
                /* Falling back to plain visual or download option */
                <div className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/10 p-6 text-center">
                  <FileText size={48} className="text-slate-300 mb-3" />
                  <h4 className="font-black text-slate-700 dark:text-slate-300 text-xs uppercase mb-2">Định dạng không được hỗ trợ đọc trực tiếp</h4>
                  <p className="text-[11px] text-slate-400 font-bold max-w-sm mb-4 leading-normal">
                    Hệ thống không thể tải bản xem trước trực tuyến cho tệp tin này. Hãy bấm tải xuống để đọc.
                  </p>
                  <button 
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = viewingDoc.url;
                      link.download = viewingDoc.title;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-6 py-3 bg-[#7360f2] hover:bg-[#5f4de0] text-white text-xs font-black uppercase rounded-2xl transition-transform active:scale-95"
                  >
                    Tải tệp xuống
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
              <button 
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = viewingDoc.url;
                  link.download = viewingDoc.title;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("Đang bắt đầu tải xuống tài liệu!");
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase rounded-xl transition-all"
              >
                <Download size={13} /> Tải xuống
              </button>
              <button 
                onClick={() => {
                  setViewingDoc(null);
                  setDocxHtml(null);
                }}
                className="px-5 py-2.5 bg-[#7360f2] hover:bg-[#5f4de0] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#7360f2]/10"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION G: PASSWORD PROMPT POPUP MODAL ── */}
      {passwordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 md:p-8 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                <Lock size={20} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase leading-tight">Yêu cầu bảo mật</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tài liệu đã được bảo mật</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Tài liệu <strong>{passwordPrompt.item.title}</strong> được khóa bảo vệ. Vui lòng nhập mật khẩu được cấp bởi Admin để tiếp tục.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu truy cập</label>
              <input 
                type="password"
                placeholder="Nhập mã bảo mật..."
                value={enteredPassword}
                onChange={e => setEnteredPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') verifyPassword(); }}
                className="px-4 py-2.5 text-xs font-black tracking-widest text-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-1.5">
              <button 
                onClick={() => setPasswordPrompt(null)}
                className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase rounded-xl transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={verifyPassword}
                className="px-5 py-2.5 bg-[#7360f2] hover:bg-[#5f4de0] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
              >
                Xác thực
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
