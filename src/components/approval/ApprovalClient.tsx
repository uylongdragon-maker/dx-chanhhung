"use client";

import { useState, useTransition } from "react";
import { FileText, UploadCloud, CheckCircle, XCircle, AlertCircle, RefreshCw, Send, X, Paperclip, Clock, Trash2, Edit3, MessageSquare, Loader2, ShieldCheck } from "lucide-react";
import { submitContent, updateApprovalStatus, deleteApprovalRequest } from "@/app/actions/approval";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

const STATUS_COLORS: any = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  REVISION: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const STATUS_LABELS: any = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Không duyệt",
  REVISION: "Yêu cầu sửa",
};

export default function ApprovalClient({
  initialPosts,
  currentUser,
}: {
  initialPosts: any[];
  currentUser: any;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingPost, setViewingPost] = useState<any>(null);
  
  // Create form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // Link/Description
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Review form
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const canApprove = ["ADMIN", "MANAGER", "TRƯỞNG BAN", "EDITOR"].includes(currentUser.role.toUpperCase());

  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn! Vui lòng tải file dưới 10MB");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`approval_${fileName}`, file);

    if (error) {
      toast.error("Lỗi tải file: " + error.message);
    } else if (data) {
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path);
      setMediaUrls([...mediaUrls, publicUrl]);
      toast.success("Tải file thành công!");
    }
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề!");
      return;
    }

    startTransition(async () => {
      const res = await submitContent(title, content, mediaUrls, currentUser.id);
      if (res.success) {
        toast.success("Đã gửi yêu cầu duyệt!");
        setIsCreating(false);
        setTitle(""); setContent(""); setMediaUrls([]);
        window.location.reload();
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  };

  const handleReview = (status: string) => {
    if (["REJECTED", "REVISION"].includes(status) && !feedback.trim()) {
      toast.error("Vui lòng nhập nhận xét/lý do!");
      return;
    }

    startTransition(async () => {
      const res = await updateApprovalStatus(viewingPost.id, status, feedback);
      if (res.success) {
        toast.success("Đã lưu kết quả duyệt!");
        setViewingPost(null);
        setFeedback("");
        window.location.reload();
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn huỷ/xoá yêu cầu này?")) {
      startTransition(async () => {
        const res = await deleteApprovalRequest(id, currentUser.id);
        if (res.success) {
          toast.success("Đã xoá yêu cầu!");
          window.location.reload();
        } else {
          toast.error(res.error || "Có lỗi xảy ra");
        }
      });
    }
  };

  if (isCreating) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Trình duyệt văn bản</h2>
            <p className="text-sm text-slate-500 font-bold mt-1">Gửi nội dung hoặc file đính kèm để cấp trên xét duyệt</p>
          </div>
          <button onClick={() => setIsCreating(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-5 max-w-3xl">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tiêu đề *</label>
            <input 
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="VD: Kế hoạch tổ chức Hội trại 2026..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mô tả hoặc Link Google Docs</label>
            <textarea 
              value={content} onChange={e => setContent(e.target.value)}
              placeholder="Dán link bài viết hoặc nhập mô tả tóm tắt nội dung..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Đính kèm File (Word, PDF, Excel... Tối đa 10MB)</label>
            <div className="flex flex-wrap gap-3">
              {mediaUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors">
                  <Paperclip size={14} /> File đính kèm {i + 1}
                </a>
              ))}
              <label className="px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                {isUploading ? "Đang tải lên..." : "Tải file lên"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-2">
            <button 
              onClick={handleSubmit} disabled={isPending || !title.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Gửi yêu cầu duyệt
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewingPost) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 ${STATUS_COLORS[viewingPost.status]}`}>
                {viewingPost.status === "PENDING" && <Clock size={12} />}
                {viewingPost.status === "APPROVED" && <CheckCircle size={12} />}
                {viewingPost.status === "REJECTED" && <XCircle size={12} />}
                {viewingPost.status === "REVISION" && <RefreshCw size={12} />}
                {STATUS_LABELS[viewingPost.status]}
              </span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{viewingPost.title}</h2>
              <p className="text-sm text-slate-500 font-bold mt-2">Gửi bởi: {viewingPost.author?.name} • {new Date(viewingPost.createdAt).toLocaleString("vi-VN")}</p>
            </div>
            <button onClick={() => setViewingPost(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nội dung / Mô tả</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {viewingPost.content || "Không có nội dung mô tả."}
              </div>
            </div>

            {viewingPost.mediaUrls?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">File đính kèm</h4>
                <div className="flex flex-col gap-2">
                  {viewingPost.mediaUrls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-blue-600 font-bold text-sm flex items-center gap-3 hover:bg-blue-100 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <FileText size={16} />
                      </div>
                      Xem file đính kèm {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {viewingPost.feedback && (
              <div className="mt-8 p-4 border-2 border-dashed border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 rounded-2xl">
                <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MessageSquare size={12} /> Phản hồi từ Sếp</h4>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200 whitespace-pre-wrap">{viewingPost.feedback}</p>
              </div>
            )}
          </div>
        </div>

        {/* Boss Review Panel */}
        {canApprove && viewingPost.status === "PENDING" && (
          <div className="lg:w-80 shrink-0 bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" /> Khu vực Duyệt
            </h3>
            
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nhận xét / Yêu cầu sửa</label>
            <textarea 
              value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Nhập phản hồi cho nhân viên (bắt buộc nếu Không duyệt hoặc Sửa lại)..."
              className="w-full px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px] mb-6"
            />

            <div className="flex flex-col gap-3 mt-auto">
              <button 
                onClick={() => handleReview("APPROVED")} disabled={isPending}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> Duyệt bài
              </button>
              
              <button 
                onClick={() => handleReview("REVISION")} disabled={isPending}
                className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Yêu cầu sửa lại
              </button>

              <button 
                onClick={() => handleReview("REJECTED")} disabled={isPending}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Không duyệt
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2">Duyệt Content</h2>
          <p className="text-sm font-bold text-slate-500">Trình ký và phê duyệt các văn bản, bài viết, ấn phẩm</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 font-black text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Edit3 size={16} /> Trình duyệt nội dung mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-4">
             <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
               <FileText size={24} />
             </div>
             <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Chưa có yêu cầu duyệt nào.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} onClick={() => setViewingPost(post)} className="bg-white dark:bg-slate-900 p-5 rounded-2xl flex flex-col gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 dark:border-slate-800 group">
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 ${STATUS_COLORS[post.status]}`}>
                  {post.status === "PENDING" && <Clock size={10} />}
                  {post.status === "APPROVED" && <CheckCircle size={10} />}
                  {post.status === "REJECTED" && <XCircle size={10} />}
                  {post.status === "REVISION" && <RefreshCw size={10} />}
                  {STATUS_LABELS[post.status]}
                </span>
                
                {post.authorId === currentUser.id && post.status === "PENDING" && (
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold mt-1 line-clamp-1">
                  Trình bởi: {post.author.name}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-400">
                <span className="flex items-center gap-1">
                  <Paperclip size={12} /> {post.mediaUrls?.length || 0} file đính kèm
                </span>
                <span>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
