'use client'

import { useState, useTransition, useEffect } from "react";
import { 
  X, AlignLeft, CheckSquare, Paperclip, Clock, User as UserIcon, 
  Trash2, Plus, MessageSquare, Send, Calendar, AlertCircle, Loader2
} from "lucide-react";
import { 
  updateTaskDescription, addChecklist, addChecklistItem, 
  toggleChecklistItem, addTaskActivity, updateTaskDueDate, 
  updateTaskAssignment, addTaskAttachment, updateTaskPriority 
} from "@/app/workspace/kanban/card_actions";
import { createClient } from "@/utils/supabase/client";

interface TaskDetailModalProps {
  task: any;
  users: any[];
  currentUser: any;
  onClose: () => void;
}

export default function TaskDetailModal({ task, users, currentUser, onClose }: TaskDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState(task.description || "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleSaveDescription = () => {
    startTransition(async () => {
      await updateTaskDescription(task.id, description);
      setIsEditingDescription(false);
    });
  };

  const handleAddChecklist = () => {
    const title = prompt("Nhập tên danh sách công việc:");
    if (title) {
      startTransition(async () => {
        await addChecklist(task.id, title);
      });
    }
  };

  const handleAddChecklistItem = (checklistId: string) => {
    const text = prompt("Nhập công việc cần làm:");
    if (text) {
      startTransition(async () => {
        await addChecklistItem(checklistId, text);
      });
    }
  };

  const handleToggleItem = (itemId: string, isCompleted: boolean) => {
    startTransition(async () => {
      await toggleChecklistItem(itemId, isCompleted);
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addTaskActivity(task.id, currentUser.id, 'COMMENT', newComment);
      setNewComment("");
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `tasks/${task.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media') // Giả định dùng bucket 'media' đã có
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      startTransition(async () => {
        await addTaskAttachment(task.id, publicUrl);
      });
    } catch (error: any) {
      alert("Lỗi tải lên: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
               <CheckSquare size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{task.title}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Trong cột <span className="text-blue-500 underline decoration-2">{task.status}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="md:col-span-8 flex flex-col gap-10">
            
            {/* Description */}
            <section>
              <div className="flex items-center gap-3 mb-4 text-slate-800 dark:text-slate-200">
                <AlignLeft size={20} />
                <h3 className="font-bold">Mô tả chi tiết</h3>
              </div>
              {isEditingDescription ? (
                <div className="ml-8">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/20 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all text-sm min-h-[150px]"
                    placeholder="Thêm mô tả chi tiết cho công việc này..."
                  />
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={handleSaveDescription}
                      disabled={isPending}
                      className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      {isPending ? 'Đang lưu...' : 'Lưu lại'}
                    </button>
                    <button 
                      onClick={() => setIsEditingDescription(false)}
                      className="px-6 py-2 text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingDescription(true)}
                  className="ml-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm text-slate-600 dark:text-slate-400 min-h-[100px]"
                >
                  {description || "Chưa có mô tả chi tiết. Bấm vào đây để thêm..."}
                </div>
              )}
            </section>

            {/* Checklists */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                  <CheckSquare size={20} />
                  <h3 className="font-bold">Checklist / Danh sách việc</h3>
                </div>
              </div>
              <div className="ml-8 flex flex-col gap-6">
                {task.checklists?.map((cl: any) => (
                  <div key={cl.id} className="bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-sm text-blue-600">{cl.title}</h4>
                      <button 
                        onClick={() => handleAddChecklistItem(cl.id)}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-500 transition-colors"
                      >
                         + Thêm mục
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                       {cl.items?.map((item: any) => (
                         <div key={item.id} className="flex items-center gap-3 group">
                            <input 
                              type="checkbox" 
                              checked={item.isCompleted}
                              onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                              className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-0 transition-all cursor-pointer"
                            />
                            <span className={`text-sm ${item.isCompleted ? 'line-through text-slate-400 italic' : 'text-slate-700 dark:text-slate-300'}`}>
                              {item.text}
                            </span>
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
                <button 
                  onClick={handleAddChecklist}
                  className="w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all"
                >
                  + Tạo danh sách công việc mới
                </button>
              </div>
            </section>

            {/* Activity */}
            <section>
              <div className="flex items-center gap-3 mb-6 text-slate-800 dark:text-slate-200">
                <MessageSquare size={20} />
                <h3 className="font-bold">Hoạt động & Bình luận</h3>
              </div>
              <div className="ml-8 flex flex-col gap-6">
                {/* Input */}
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                      {currentUser?.name?.substring(0,2).toUpperCase() || '??'}
                   </div>
                   <div className="flex-1 relative">
                      <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết bình luận..."
                        className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20"
                        rows={1}
                      />
                      <button 
                        onClick={handleAddComment}
                        disabled={isPending || !newComment.trim()}
                        className="absolute right-3 top-3 p-1.5 bg-blue-600 text-white rounded-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                      >
                         <Send size={14} />
                      </button>
                   </div>
                </div>

                {/* Timeline */}
                <div className="flex flex-col gap-6">
                   {task.activities?.map((act: any) => (
                     <div key={act.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 overflow-hidden">
                           {act.user?.avatarUrl ? <img src={act.user.avatarUrl} className="w-full h-full object-cover" /> : act.user?.name?.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                           <p className="text-sm">
                             <span className="font-black text-slate-800 dark:text-slate-100 mr-2">{act.user?.name}</span>
                             {act.type === 'COMMENT' ? (
                               <span className="text-slate-700 dark:text-slate-300">{act.text}</span>
                             ) : (
                               <span className="text-slate-400 italic">{act.text}</span>
                             )}
                           </p>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
                             {new Date(act.createdAt).toLocaleString('vi-VN')}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-4 flex flex-col gap-6">
             {/* Action group */}
             <div className="flex flex-col gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Thêm vào thẻ</span>
               
               <button 
                onClick={() => document.getElementById('fileUpload')?.click()}
                disabled={isUploading}
                className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all text-xs font-bold text-slate-700 dark:text-slate-300"
               >
                 {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                 Tệp đính kèm
               </button>
               <input type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} />

               <button className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all text-xs font-bold text-slate-700 dark:text-slate-300">
                 <Clock size={16} />
                 Ngày hết hạn
               </button>
             </div>

             {/* Meta data */}
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] flex flex-col gap-4">
                <div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Người phụ trách</span>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                        {task.assignee?.name?.substring(0,2).toUpperCase() || '??'}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{task.assignee?.name || "Chưa phân công"}</span>
                   </div>
                </div>
                <div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Độ ưu tiên</span>
                   <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm inline-block ${
                      task.priority === 'URGENT' ? 'bg-rose-500 text-white' :
                      task.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                      task.priority === 'MEDIUM' ? 'bg-blue-500 text-white' :
                      'bg-slate-100 text-slate-500'
                   }`}>
                      {task.priority}
                   </span>
                </div>
                {task.dueDate && (
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hạn chót</span>
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                       <Calendar size={14} />
                       {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                )}
             </div>

             {/* Attachments List */}
             {task.attachments?.length > 0 && (
               <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Các tệp đính kèm</span>
                  <div className="flex flex-col gap-2">
                     {task.attachments.map((url: string, i: number) => (
                       <a key={i} href={url} target="_blank" className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3 hover:shadow-md transition-all">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-blue-500">
                             <Paperclip size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">Tài liệu {i+1}</p>
                             <span className="text-[9px] text-slate-400 uppercase font-black">Nhấn để xem</span>
                          </div>
                       </a>
                     ))}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
