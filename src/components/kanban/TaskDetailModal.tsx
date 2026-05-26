'use client'

import { useState, useTransition, useEffect } from "react";
import { X, AlignLeft, CheckSquare, Paperclip, Clock, Trash2, Plus, MessageSquare, Send, Calendar, Loader2, Pin, User, Flag, Tag, Eye, Pencil } from "lucide-react";
import { updateTaskDescription, addChecklist, addChecklistItem, toggleChecklistItem, addTaskActivity, updateTaskDueDate, updateTaskAssignment, updateTaskPriority, addTaskAttachment, addTaskLabel, removeTaskLabel, deleteChecklistItem, deleteChecklist, updateChecklistTitle } from "@/app/workspace/kanban/card_actions";
import { deleteTask, togglePoolItem } from "@/app/workspace/kanban/actions";
import { createClient } from "@/utils/supabase/client";
import toast from "react-hot-toast";

const PRIORITIES = [
  { value: 'LOW',    label: 'Thấp',  cls: 'bg-slate-100 text-slate-600' },
  { value: 'MEDIUM', label: 'TB',    cls: 'bg-blue-500 text-white' },
  { value: 'HIGH',   label: 'Cao',   cls: 'bg-orange-500 text-white' },
  { value: 'URGENT', label: 'Khẩn', cls: 'bg-rose-500 text-white' },
];

const LABEL_PRESETS = [
  { name: 'Khẩn cấp', color: '#ef4444' },
  { name: 'Thiết kế', color: '#8b5cf6' },
  { name: 'Nội dung', color: '#3b82f6' },
  { name: 'Kỹ thuật', color: '#10b981' },
  { name: 'Sự kiện',  color: '#f59e0b' },
  { name: 'Review',   color: '#ec4899' },
];

const STATUS_LABELS: Record<string, string> = { TODO: 'Cần làm', DOING: 'Đang làm', DONE: 'Hoàn thành' };

export default function TaskDetailModal({ task, users, currentUser, onClose }: { task: any; users: any[]; currentUser: any; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState(task.description || "");
  const [isEditDesc, setIsEditDesc] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklistId, setAddingChecklistId] = useState<string | null>(null);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [localTask, setLocalTask] = useState(task);
  const supabase = createClient();

  // Sync localTask when task prop changes from server
  useEffect(() => { setLocalTask(task); }, [task]);

  const run = (fn: () => Promise<any>, successMsg?: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res?.success === false) toast.error(res.error || "Có lỗi xảy ra");
      else if (successMsg) toast.success(successMsg);
    });
  };

  const handleSaveDesc = () => run(async () => { const r = await updateTaskDescription(task.id, description); setIsEditDesc(false); return r; }, "Đã lưu mô tả");

  const handleAddChecklist = () => {
    if (!newChecklistTitle.trim()) return;
    run(async () => { const r = await addChecklist(task.id, newChecklistTitle); setNewChecklistTitle(""); return r; }, "Đã thêm checklist");
  };

  const handleAddItem = (checklistId: string) => {
    if (!newItemText.trim()) return;

    // Optimistic update
    const textToAdd = newItemText;
    setLocalTask((prev: any) => ({
      ...prev,
      checklists: prev.checklists.map((cl: any) =>
        cl.id === checklistId ? { ...cl, items: [...(cl.items || []), { id: `temp-${Date.now()}`, text: textToAdd, isCompleted: false }] } : cl
      )
    }));

    run(async () => { 
      const r = await addChecklistItem(checklistId, textToAdd); 
      setNewItemText(""); 
      setAddingChecklistId(null); 
      return r; 
    }, "Đã thêm mục");
  };

  const handleDeleteChecklist = (id: string) => {
    toast.loading("Đang xóa checklist...");
    run(async () => {
      const r = await deleteChecklist(id);
      toast.dismiss();
      return r;
    }, "Đã xóa checklist");
  };

  const handleUpdateChecklistTitle = (id: string) => {
    if (!editingChecklistTitle.trim()) return;
    run(async () => {
      const r = await updateChecklistTitle(id, editingChecklistTitle);
      setEditingChecklistId(null);
      return r;
    }, "Đã cập nhật tên");
  };

  const handleToggleItem = (clId: string, itemId: string, isCompleted: boolean) => {
    // Optimistic update
    setLocalTask((prev: any) => ({
      ...prev,
      checklists: prev.checklists.map((cl: any) => 
        cl.id === clId ? {
          ...cl,
          items: cl.items.map((i: any) => i.id === itemId ? { ...i, isCompleted } : i)
        } : cl
      )
    }));
    run(() => toggleChecklistItem(itemId, isCompleted));
  };

  const handleComment = () => {
    if (!newComment.trim() || !currentUser?.id) return;
    const text = newComment;
    setNewComment("");
    run(() => addTaskActivity(task.id, currentUser.id, 'COMMENT', text));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try {
      // 1. Chuyển đổi File sang Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const str = (reader.result as string).split(",")[1];
          resolve(str);
        };
        reader.onerror = (err) => reject(err);
      });

      // 2. Gửi yêu cầu tải lên Google Drive qua Apps Script Web App
      const response = await fetch("https://script.google.com/macros/s/AKfycbx45EPzrRFbxNBMZ59_aN5m8aYRgvYZG5vBKrlKa6_RfxfM3AU_uv7cc6ipTAw3K8DZ/exec", {
        method: "POST",
        body: JSON.stringify({
          base64: base64,
          fileName: file.name,
          mimeType: file.type,
          taskName: localTask.title || task.title || "Công việc không tên" // An toàn hơn khi lấy từ state
        })
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || "Tải lên Google Drive thất bại");
      }

      // 3. Đính kèm liên kết kết quả vào Thẻ việc
      run(() => addTaskAttachment(task.id, resData.url), "Đã báo cáo tệp lên Google Drive");
    } catch (err: any) { 
      toast.error("Lỗi tải lên Drive: " + err.message); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleDelete = () => {
    toast.loading("Đang xoá...");
    run(async () => { 
      const r = await deleteTask(task.id); 
      if (r.success) {
        toast.dismiss();
        onClose(); 
      }
      return r; 
    }, "Đã xoá thẻ việc");
  };

  const handleTogglePool = () => {
    const next = !localTask.isPoolItem;
    setLocalTask((p: any) => ({ ...p, isPoolItem: next }));
    run(() => togglePoolItem(task.id, next), next ? "Đã ghim vào Pool chung" : "Đã bỏ ghim");
  };

  const handleLabel = (preset: { name: string; color: string }) => {
    run(() => addTaskLabel(task.id, preset.name, preset.color), `Đã thêm label "${preset.name}"`);
    setShowLabelPicker(false);
  };

  const pDef = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
  const checkTotal = localTask.checklists?.reduce((a: number, cl: any) => a + (cl.items?.length || 0), 0) || 0;
  const checkDone  = localTask.checklists?.reduce((a: number, cl: any) => a + (cl.items?.filter((i: any) => i.isCompleted).length || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-lg sm:rounded-lg shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4 shrink-0">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="p-2.5 bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 shrink-0">
              <CheckSquare size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">{task.title}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                {STATUS_LABELS[task.status] || task.status}
                {localTask.isPoolItem && <span className="ml-2 text-blue-500">· Đã ghim Pool</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Content */}
          <div className="md:col-span-8 flex flex-col gap-8">

            {/* Labels */}
            {localTask.labels?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {localTask.labels.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[10px] font-black" style={{ backgroundColor: l.color }}>
                    <Tag size={10} />
                    {l.name}
                    <button onClick={() => run(() => removeTaskLabel(l.id))} className="hover:opacity-70 ml-1">×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlignLeft size={16} className="text-slate-500" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Mô tả chi tiết</h3>
              </div>
              {isEditDesc ? (
                <div className="ml-6">
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" placeholder="Mô tả chi tiết..." />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveDesc} disabled={isPending} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">Lưu</button>
                    <button onClick={() => setIsEditDesc(false)} className="px-4 py-1.5 text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Hủy</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => setIsEditDesc(true)} className="ml-6 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-sm text-slate-600 dark:text-slate-400 min-h-[80px] break-words whitespace-pre-wrap">
                  {description || <span className="italic text-slate-400">Chưa có mô tả. Nhấn để thêm...</span>}
                </div>
              )}
            </section>

            {/* Checklists */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={16} className="text-slate-500" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Checklist</h3>
                {checkTotal > 0 && (
                  <span className="ml-auto text-[10px] font-black text-slate-400">{checkDone}/{checkTotal}</span>
                )}
              </div>

              {checkTotal > 0 && (
                <div className="ml-6 mb-4">
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${checkDone === checkTotal ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${(checkDone / checkTotal) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="ml-6 flex flex-col gap-4">
                {localTask.checklists?.map((cl: any) => (
                  <div key={cl.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3 group/cl">
                      {editingChecklistId === cl.id ? (
                        <div className="flex gap-2 flex-1">
                          <input autoFocus value={editingChecklistTitle} onChange={e => setEditingChecklistTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdateChecklistTitle(cl.id)} className="flex-1 px-2 py-1 text-sm font-bold text-blue-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:ring-2 focus:ring-blue-500/20" />
                          <button onClick={() => handleUpdateChecklistTitle(cl.id)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><CheckSquare size={14}/></button>
                          <button onClick={() => setEditingChecklistId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X size={14}/></button>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-sm text-blue-600 break-words flex-1">{cl.title}</h4>
                          <div className="opacity-0 group-hover/cl:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                            <button onClick={() => { setEditingChecklistId(cl.id); setEditingChecklistTitle(cl.title); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors"><Pencil size={12} /></button>
                            <button onClick={() => handleDeleteChecklist(cl.id)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 rounded transition-colors"><Trash2 size={12} /></button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {cl.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 group">
                          <input type="checkbox" checked={item.isCompleted} onChange={e => handleToggleItem(cl.id, item.id, e.target.checked)} className="w-4 h-4 rounded border-2 border-slate-300 text-blue-600 cursor-pointer" />
                          <span className={`text-sm flex-1 ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{item.text}</span>
                          <button onClick={() => run(() => deleteChecklistItem(item.id))} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {addingChecklistId === cl.id ? (
                      <div className="mt-3 flex gap-2">
                        <input autoFocus value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem(cl.id)} className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Tên công việc..." />
                        <button onClick={() => handleAddItem(cl.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">Thêm</button>
                        <button onClick={() => setAddingChecklistId(null)} className="px-3 py-1.5 text-slate-500 text-xs font-bold hover:bg-slate-100 rounded-lg">Hủy</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingChecklistId(cl.id)} className="mt-2 text-[10px] font-black text-slate-400 hover:text-blue-500 transition-colors">+ Thêm mục</button>
                    )}
                  </div>
                ))}

                <div className="flex gap-2">
                  <input value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChecklist()} className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-400 transition-colors" placeholder="+ Thêm checklist mới..." />
                  {newChecklistTitle && <button onClick={handleAddChecklist} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Tạo</button>}
                </div>
              </div>
            </section>

            {/* Activity */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={16} className="text-slate-500" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Hoạt động</h3>
              </div>
              <div className="ml-6 flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    {currentUser?.name?.substring(0,2).toUpperCase() || 'ME'}
                  </div>
                  <div className="flex-1 relative">
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); }}} placeholder="Viết bình luận... (Enter để gửi)" className="w-full p-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" rows={2} />
                    <button onClick={handleComment} disabled={!newComment.trim() || isPending} className="absolute right-2.5 bottom-2.5 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
                {localTask.activities?.map((act: any) => (
                  <div key={act.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 overflow-hidden shrink-0">
                      {act.user?.avatarUrl ? <img src={act.user.avatarUrl} className="w-full h-full object-cover" alt="" /> : act.user?.name?.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-black text-slate-800 dark:text-slate-100 mr-2">{act.user?.name}</span>
                        {act.type === 'COMMENT'
                          ? <span className="text-slate-700 dark:text-slate-300">{act.text}</span>
                          : <span className="text-slate-400 italic">{act.text}</span>}
                      </p>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(act.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Sidebar */}
          <div className="md:col-span-4 flex flex-col gap-5">

            {/* Priority */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Flag size={10} /> Độ ưu tiên</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => run(() => updateTaskPriority(task.id, p.value))} className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${task.priority === p.value ? p.cls + ' scale-[1.03] shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:scale-[1.02]'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><User size={10} /> Người phụ trách</p>
              <select value={localTask.assigneeId || ""} onChange={e => {
                const newAssigneeId = e.target.value || null;
                setLocalTask((prev: any) => ({ ...prev, assigneeId: newAssigneeId }));
                run(() => updateTaskAssignment(localTask.id, newAssigneeId), "Đã cập nhật người phụ trách");
              }} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none">
                <option value="">-- Chưa phân công --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>

              {localTask.assigneeId !== currentUser?.id && (
                <button onClick={() => {
                  setLocalTask((prev: any) => ({ ...prev, assigneeId: currentUser.id }));
                  run(() => updateTaskAssignment(localTask.id, currentUser.id), "Đã nhận việc");
                }} className="w-full mt-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  Nhận việc này
                </button>
              )}
            </div>

            {/* Due Date */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Calendar size={10} /> Hạn chót</p>
              <input type="datetime-local" defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0,16) : ''} onChange={e => run(() => updateTaskDueDate(task.id, e.target.value || null), "Đã cập nhật hạn chót")} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none" />
            </div>

            {/* Labels */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Tag size={10} /> Labels</p>
              <div className="relative">
                <button onClick={() => setShowLabelPicker(!showLabelPicker)} className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-400 transition-colors">
                  <Plus size={12} /> Thêm label
                </button>
                {showLabelPicker && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-10 p-2 flex flex-col gap-1">
                    {LABEL_PRESETS.map(preset => (
                      <button key={preset.name} onClick={() => handleLabel(preset)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left">
                        <div className="w-5 h-5 rounded-md shrink-0" style={{ backgroundColor: preset.color }} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pin to Pool */}
            <button onClick={handleTogglePool} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all border ${localTask.isPoolItem ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
              <Pin size={14} className={localTask.isPoolItem ? 'rotate-45' : ''} />
              {localTask.isPoolItem ? 'Đã ghim vào Pool chung' : 'Ghim vào Pool chung'}
            </button>

            {/* Attachment */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Paperclip size={10} /> Đính kèm</p>
              <button onClick={() => document.getElementById('fileUpload-modal')?.click()} disabled={isUploading} className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-400 transition-colors disabled:opacity-50">
                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                {isUploading ? 'Đang tải...' : 'Tải tệp lên'}
              </button>
              <input type="file" id="fileUpload-modal" className="hidden" onChange={handleFileUpload} />

              {localTask.attachments?.length > 0 && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {localTask.attachments.map((url: string, i: number) => {
                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null || url.includes("drive.google.com/uc");
                    return (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1.5 p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md transition-all group overflow-hidden">
                        {isImage ? (
                          <div className="relative w-full h-28 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shrink-0">
                            <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Hình ảnh báo cáo" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-1">
                            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                              <Paperclip size={14} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">Tài liệu {i+1}</span>
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delete */}
            <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-200 mt-auto">
              <Trash2 size={14} /> Xoá thẻ việc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
