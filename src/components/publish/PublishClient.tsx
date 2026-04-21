"use client";

import { useState, useTransition } from "react";
import TiptapEditor from "./TiptapEditor";
import { savePost, publishToBridge, optimizePostWithAI } from "@/app/workspace/publish/actions";

export default function PublishClient({
  initialPosts,
  authorId,
}: {
  initialPosts: any[];
  authorId: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [isPending, startTransition] = useTransition();

  const handleCreateNew = () => {
    setCurrentPost(null);
    setTitle("");
    setContent("<p>Bắt đầu soạn thảo...</p>");
    setIsEditing(true);
  };

  const handleEdit = (post: any) => {
    setCurrentPost(post);
    setTitle(post.title);
    setContent(post.content || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("authorId", authorId);
    if (currentPost) {
      formData.append("postId", currentPost.id);
    }

    startTransition(async () => {
      const res = await savePost(formData);
      if (res.success) {
        setIsEditing(false);
        // Page will revalidate via Server Action
      } else {
        alert("Lỗi: " + res.error);
      }
    });
  };

  const handleAIOptimize = async () => {
    startTransition(async () => {
      const res = await optimizePostWithAI(title, content);
      if (res.success) {
        setTitle(res.optimizedTitle || title);
        setContent(res.optimizedContent || content);
        alert("AI Gợi ý: " + res.suggestion);
      } else {
        alert("Lỗi AI: " + res.error);
      }
    });
  };

  const handlePublish = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn Duyệt và Đẩy bài viết này lên Tuổi Trẻ Số (Firebase)?")) {
      return;
    }

    startTransition(async () => {
      const res = await publishToBridge(postId);
      if (res.success) {
         alert(res.message);
      } else {
         alert("Lỗi Bridge: " + res.error);
      }
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setIsEditing(false)}
            className="text-on-surface-variant hover:text-primary flex items-center gap-2 font-medium"
          >
            <span className="material-symbols-outlined">arrow_back</span> Quay lại
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleAIOptimize}
              disabled={isPending}
              className="px-6 py-2.5 rounded-full bg-surface-container-high text-primary font-bold hover:bg-surface-variant transition-all border border-primary/20 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px] animate-pulse">auto_awesome</span>
              AI Hỗ trợ
            </button>
             <button 
              onClick={handleSave}
              disabled={isPending}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-medium hover:bg-primary-dim transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Đang lưu..." : "Lưu bản nháp"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Tiêu đề bài viết..."
            className="text-3xl font-bold bg-transparent border-none outline-none text-on-surface focus:placeholder:opacity-30"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="w-full h-px bg-outline-variant/20"></div>
          
          <TiptapEditor content={content} onChange={setContent} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Trạm Xuất Bản</h2>
          <p className="text-on-surface-variant">Soạn thảo và điều phối nội dung sang Cổng Tuổi Trẻ Số</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-primary to-primary-container text-white rounded-full px-6 py-2.5 flex items-center gap-2 font-medium hover:shadow-lg transition-all shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Soạn bài mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {posts.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-outline-variant rounded-3xl flex flex-col items-center gap-4">
             <span className="material-symbols-outlined text-5xl opacity-20">post_add</span>
             <p className="text-on-surface-variant font-medium">Chưa có bài viết nào trong hàng đợi.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-md transition-all border border-white/40">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                    post.status === "PUBLISHED" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                  }`}>
                    {post.status}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Cập nhật: {new Date(post.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">
                  Bởi: {post.author.name} • {post.content?.replace(/<[^>]*>/g, "").substring(0, 100)}...
                </p>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleEdit(post)}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Sửa
                </button>
                <button 
                  onClick={() => handlePublish(post.id)}
                  disabled={post.status === "PUBLISHED" || isPending}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    post.status === "PUBLISHED" 
                    ? "bg-secondary/10 text-secondary cursor-default" 
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md active:scale-95 disabled:opacity-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">rocket_launch</span> 
                  {post.status === "PUBLISHED" ? "Đã xuất bản" : "Duyệt & Đảy bài"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
