"use client";

import { useState, useTransition } from "react";
import { 
  CheckCircle2, Circle, Clock, Loader2, Paperclip, 
  Plus, AlertTriangle, User, Calendar, Trash2, 
  Check, X, FileText, Video as VideoIcon, Image as ImageIcon,
  ChevronDown, Search, Filter, ShieldAlert, Sparkles, Upload
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

// Actions
import { 
  updateTaskStatus, 
  deleteTask 
} from "@/app/workspace/kanban/actions";
import { 
  updateTaskDescription, 
  addChecklist, 
  addChecklistItem, 
  toggleChecklistItem, 
  updateTaskDueDate, 
  updateTaskAssignment, 
  updateTaskPriority, 
  addTaskAttachment,
  deleteChecklistItem,
  toggleChecklistItemAssignee,
  toggleTaskAssignee
} from "@/app/workspace/kanban/card_actions";
import { 
  updateTaskCreator, 
  updateTaskEvaluation, 
  updateTaskEvaluationNotes,
  updateTaskProductType,
  updateTaskTitle
} from "@/app/workspace/kanban/card_actions";

// Configuration presets
const EVALUATION_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  REVIEWING: { label: "Đang xem xét", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  APPROVED:  { label: "Duyệt",        bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  REJECTED:  { label: "Không Duyệt",  bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" },
  POSTPONED: { label: "Hoãn",        bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  TODO:  { label: "Chưa nhận việc", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200" },
  DOING: { label: "Đang làm",      bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  DONE:  { label: "Hoàn thành",    bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
};

const PRODUCT_TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ALL:      { label: "Tất cả / Khác", bg: "bg-slate-100 dark:bg-slate-800/80", text: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" },
  IMAGE:    { label: "Hình ảnh",      bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  VIDEO:    { label: "Video",         bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  DOCUMENT: { label: "Docx / pdf",    bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
};

interface TaskTableViewProps {
  tasks: any[];
  users: any[];
  currentUser: any;
  onSelectTask: (task: any) => void;
}

export default function TaskTableView({ tasks = [], users = [], currentUser, onSelectTask }: TaskTableViewProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterEvaluation, setFilterEvaluation] = useState("");
  
  // Local state to manage upload loaders for each task specifically
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  // Local state for inline checklist additions
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  // Local state to track active assignee picker dropdown
  const [activeAssigneePickerTaskId, setActiveAssigneePickerTaskId] = useState<string | null>(null);

  // Local state for checklist item assignee picker dropdown
  const [activeItemDropdownId, setActiveItemDropdownId] = useState<string | null>(null);

  // Local state to track active creator picker dropdown
  const [activeCreatorPickerTaskId, setActiveCreatorPickerTaskId] = useState<string | null>(null);

  // Helper function to classify attachment URLs into Images, Videos, and Docs
  const classifyAttachments = (attachments: string[] = []) => {
    const images: string[] = [];
    const videos: string[] = [];
    const docs: string[] = [];

    attachments.forEach(url => {
      const lower = url.toLowerCase();
      const isImage = lower.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) != null || url.includes("drive.google.com/uc") || url.includes("lh3.googleusercontent.com");
      const isVideo = lower.match(/\.(mp4|mov|avi|mkv|webm|3gp|flv)/i) != null;

      if (isImage) images.push(url);
      else if (isVideo) videos.push(url);
      else docs.push(url);
    });

    return { images, videos, docs };
  };

  const handleRun = (fn: () => Promise<any>, successMsg?: string) => {
    startTransition(async () => {
      const res = await fn();
      if (res?.success === false) {
        toast.error(res.error || "Có lỗi xảy ra");
      } else if (successMsg) {
        toast.success(successMsg);
      }
    });
  };

  // Multiple files sequential upload handler
  const handleFilesUpload = async (taskId: string, filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);
    
    setUploadingTaskId(taskId);
    
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const toastId = toast.loading(`[${index + 1}/${files.length}] Đang tải tệp: ${file.name} lên Google Drive...`);

      try {
        // 1. Convert File to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const str = (reader.result as string).split(",")[1];
            resolve(str);
          };
          reader.onerror = (err) => reject(err);
        });

        // 2. Upload Base64 to Google Drive via script Web App
        const response = await fetch("https://script.google.com/macros/s/AKfycbx45EPzrRFbxNBMZ59_aN5m8aYRgvYZG5vBKrlKa6_RfxfM3AU_uv7cc6ipTAw3K8DZ/exec", {
          method: "POST",
          body: JSON.stringify({
            base64: base64,
            fileName: file.name,
            mimeType: file.type,
            taskName: tasks.find(t => t.id === taskId)?.title || "Công việc không tên"
          })
        });

        const resData = await response.json();
        if (!resData.success) {
          throw new Error(resData.error || "Tải lên Google Drive thất bại");
        }

        // Ghép tên tệp vào làm tham số query để hiển thị chính xác tên gốc sau này
        const separator = resData.url.includes("?") ? "&" : "?";
        const finalUrl = `${resData.url}${separator}name=${encodeURIComponent(file.name)}`;

        // 3. Attach file URL in Task
        const res = await addTaskAttachment(taskId, finalUrl);
        if (res.success) {
          toast.success(`Đã lưu tệp ${file.name}!`, { id: toastId });
        } else {
          throw new Error(res.error || "Lưu đường dẫn sản phẩm thất bại");
        }
      } catch (err: any) {
        toast.error(`Lỗi tải tệp ${file.name}: ` + err.message, { id: toastId });
      }
    }
    
    setUploadingTaskId(null);
  };

  // Trích xuất tên tệp tin từ tham số URL đính kèm
  const getFileName = (url: string, index: number, fallbackLabel: string) => {
    try {
      const urlObj = new URL(url);
      const name = urlObj.searchParams.get("name");
      if (name) return name;
    } catch (e) {}
    return `${fallbackLabel} ${index + 1}`;
  };

  const handleAddInlineChecklistItem = (task: any, text: string) => {
    if (!text.trim()) return;
    
    let checklistId = task.checklists?.[0]?.id;
    
    startTransition(async () => {
      // If task does not have a checklist, create one first
      if (!checklistId) {
        const clRes = await addChecklist(task.id, "Đầu việc checklist");
        if (clRes.success && clRes.data) {
          checklistId = clRes.data.id;
        } else {
          toast.error("Không thể tạo nhóm checklist");
          return;
        }
      }

      const res = await addChecklistItem(checklistId, text);
      if (res.success) {
        setNewItemText(prev => ({ ...prev, [task.id]: "" }));
        toast.success("Đã thêm đầu việc");
      } else {
        toast.error("Lỗi: " + res.error);
      }
    });
  };

  // Filter tasks based on Search, Assignee and Evaluation status
  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAssignee && t.assigneeId !== filterAssignee) return false;
    if (filterEvaluation && t.evaluation !== filterEvaluation) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Search & Toolbar ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên công việc, mô tả..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400" />
          <select 
            value={filterAssignee} 
            onChange={e => setFilterAssignee(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">Tất cả người nhận</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-slate-400" />
          <select 
            value={filterEvaluation} 
            onChange={e => setFilterEvaluation(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">Mọi trạng thái Đánh giá</option>
            <option value="REVIEWING">⏳ Đang xem xét</option>
            <option value="APPROVED">✅ Đã duyệt</option>
            <option value="REJECTED">❌ Không duyệt</option>
            <option value="POSTPONED">⏸️ Hoãn lại</option>
          </select>
        </div>

        {isPending && <Loader2 size={16} className="animate-spin text-blue-600 ml-2" />}
      </div>

      {/* ─── Premium Spreadsheet Table ─── */}
      <div className="w-full overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg scrollbar-thin">
        <table className="w-full border-collapse text-left text-xs min-w-[1550px]">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider backdrop-blur-2xl">
              <th className="py-4 px-3 w-12 text-center">STT</th>
              <th className="py-4 px-4 w-[240px]">Hạng mục công việc</th>
              <th className="py-4 px-4 w-[220px]">Mô tả chi tiết</th>
              <th className="py-4 px-4 w-[260px]">Checklist hoàn thành</th>
              <th className="py-4 px-3 w-[110px]">Người giao</th>
              <th className="py-4 px-3 w-[110px]">Người nhận</th>
              <th className="py-4 px-3 w-[110px]">Trạng thái</th>
              <th className="py-4 px-3 w-[110px]">Deadline</th>
              <th className="py-4 px-3 border-l border-slate-200 dark:border-slate-700/60 w-[120px]">Loại sản phẩm</th>
              <th className="py-4 px-4 border-r border-slate-200 dark:border-slate-700/60 w-[280px]">Sản phẩm nộp (Tải lên)</th>
              <th className="py-4 px-4 w-[110px]">Thời gian nộp</th>
              <th className="py-4 px-3 w-[110px]">Đánh giá</th>
              <th className="py-4 px-4 w-[160px]">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400 font-bold italic">
                  Không tìm thấy công việc nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task, index) => {
                const { images, videos, docs } = classifyAttachments(task.attachments || []);
                const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "DONE";
                const isDueToday = task.dueDate && isToday(new Date(task.dueDate)) && task.status !== "DONE";

                // Map status label
                let taskStatusLabel = STATUS_CONFIG[task.status]?.label || task.status;
                let statusCls = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
                if (isOverdue) {
                  taskStatusLabel = "Trễ deadline";
                  statusCls = { label: "Trễ deadline", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" };
                }

                const evalCfg = EVALUATION_CONFIG[task.evaluation] || EVALUATION_CONFIG.REVIEWING;
                const pTypeCfg = PRODUCT_TYPE_CONFIG[task.productType || "ALL"] || PRODUCT_TYPE_CONFIG.ALL;

                return (
                  <tr 
                    key={task.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group/row"
                  >
                    {/* 1. STT */}
                    <td className="py-3.5 pl-5 pr-3 text-center font-bold text-slate-400 align-top">
                      {index + 1}
                    </td>

                    {/* 2. Tên công việc */}
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100 align-top">
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          defaultValue={task.title}
                          onBlur={e => {
                            if (e.target.value.trim() && e.target.value !== task.title) {
                              handleRun(() => updateTaskTitle(task.id, e.target.value.trim()), "Đã cập nhật tiêu đề");
                            }
                          }}
                          className="w-full bg-slate-50/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 outline-none resize-y px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-400 rounded-md font-bold text-slate-800 dark:text-slate-100 text-xs transition-all"
                          rows={3}
                        />
                        <button 
                          onClick={() => onSelectTask(task)} 
                          className="text-[10px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 w-max opacity-0 group-hover/row:opacity-100 transition-opacity"
                        >
                          Chi tiết <Sparkles size={9} />
                        </button>
                      </div>
                    </td>

                    {/* 3. Mô tả chi tiết */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 align-top">
                      <textarea
                        defaultValue={task.description || ""}
                        placeholder="Nhập mô tả..."
                        onBlur={e => {
                          if (e.target.value !== (task.description || "")) {
                            handleRun(() => updateTaskDescription(task.id, e.target.value), "Đã cập nhật mô tả");
                          }
                        }}
                        className="w-full bg-slate-50/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 outline-none resize-y px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-400 rounded-md text-slate-600 dark:text-slate-400 text-xs font-medium transition-all"
                        rows={4}
                      />
                    </td>

                    {/* 4. Checklist hoàn thành */}
                    <td className="py-3.5 px-4 align-top text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col gap-2">
                        {/* List checklist items */}
                        {task.checklists?.map((cl: any) => (
                          <div key={cl.id} className="flex flex-col gap-1.5">
                            {cl.items?.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-2 group/item justify-between w-full">
                                <div className="flex items-start gap-2 flex-grow min-w-0">
                                  <input 
                                    type="checkbox" 
                                    checked={item.isCompleted} 
                                    onChange={e => {
                                      handleRun(() => toggleChecklistItem(item.id, e.target.checked));
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer mt-0.5 shrink-0" 
                                  />
                                  <span className={`text-[11px] leading-tight font-medium break-words ${item.isCompleted ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-300"}`}>
                                    {item.text}
                                  </span>
                                </div>

                                {/* Checklist item assignee select & avatar circle - Google Chip Capsule */}
                                <div className="shrink-0 relative">
                                  {item.assignees && item.assignees.length > 0 ? (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveItemDropdownId(activeItemDropdownId === item.id ? null : item.id);
                                      }}
                                      className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 dark:border-blue-400 text-blue-600 dark:text-blue-400 text-[9px] font-black transition-all select-none"
                                      title={item.assignees.map((u: any) => u.name).join(", ")}
                                    >
                                      <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-white dark:border-slate-800 shadow-sm bg-slate-100">
                                        <img 
                                          src={item.assignees[0].avatarUrl || `https://ui-avatars.com/api/?name=${item.assignees[0].name || "User"}&background=3b82f6&color=fff`} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <span className="truncate max-w-[50px]">
                                        {item.assignees[0].name?.split(" ").pop()}
                                      </span>
                                      {item.assignees.length > 1 && (
                                        <span className="text-[7px] font-black opacity-80">
                                          +{item.assignees.length - 1}
                                        </span>
                                      )}
                                      <span className="text-[7px] opacity-75 ml-0.5">▼</span>
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveItemDropdownId(activeItemDropdownId === item.id ? null : item.id);
                                      }}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-slate-350 dark:border-slate-700 hover:border-blue-400 hover:text-blue-500 text-[8px] font-bold text-slate-400 transition-colors"
                                    >
                                      <Plus size={8} />
                                      <span>Giao việc</span>
                                    </button>
                                  )}

                                  {activeItemDropdownId === item.id && (
                                    <>
                                      <div className="fixed inset-0 z-[60]" onClick={() => setActiveItemDropdownId(null)}></div>
                                      <div 
                                        className="absolute right-0 top-full mt-1 w-48 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[70] p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
                                        onClick={e => e.stopPropagation()}
                                      >
                                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-0.5 border-b border-slate-100 dark:border-slate-800 mb-1">Giao việc cho:</p>
                                        {users.map((u: any) => {
                                          const isAssigned = item.assignees?.some((a: any) => a.id === u.id) || false;
                                          return (
                                            <button
                                              key={u.id}
                                              type="button"
                                              onClick={() => {
                                                handleRun(
                                                  () => toggleChecklistItemAssignee(item.id, u.id, !isAssigned),
                                                  isAssigned ? `Đã gỡ ${u.name}` : `Đã giao cho ${u.name}`
                                                );
                                              }}
                                              className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left w-full"
                                            >
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                                  <img 
                                                    src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || "User"}&background=7360f2&color=fff`} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                  />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
                                              </div>
                                              <input
                                                type="checkbox"
                                                checked={isAssigned}
                                                readOnly
                                                className="w-3 h-3 text-blue-600 rounded border-slate-350 pointer-events-none focus:ring-0 shrink-0"
                                              />
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}

                                  <button 
                                    onClick={() => handleRun(() => deleteChecklistItem(item.id), "Đã xoá đầu việc")}
                                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-opacity font-bold ml-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}

                        {/* Add inline item form */}
                        <div className="flex gap-1.5 mt-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                          <input
                            value={newItemText[task.id] || ""}
                            onChange={e => setNewItemText(prev => ({ ...prev, [task.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                handleAddInlineChecklistItem(task, newItemText[task.id] || "");
                              }
                            }}
                            placeholder="+ Thêm mục checklist..."
                            className="flex-1 bg-transparent border-none outline-none text-[11px] placeholder:text-slate-400 text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-blue-500/20 rounded px-1.5"
                          />
                          {(newItemText[task.id] || "").trim() && (
                            <button
                              onClick={() => handleAddInlineChecklistItem(task, newItemText[task.id] || "")}
                              className="p-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              <Check size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 5. Người giao */}
                    <td className="py-3.5 px-3 align-top relative">
                      {(() => {
                        const selectedCreator = users.find(u => u.id === task.creatorId);
                        return (
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveCreatorPickerTaskId(activeCreatorPickerTaskId === task.id ? null : task.id)}
                              className="w-full text-left bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-full px-2.5 py-1 flex items-center justify-between gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-350 min-h-[28px]"
                            >
                              {selectedCreator ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm bg-slate-100">
                                    <img 
                                      src={selectedCreator.avatarUrl || `https://ui-avatars.com/api/?name=${selectedCreator.name || "User"}&background=7360f2&color=fff`} 
                                      alt="" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="truncate max-w-[65px] text-[10px] text-slate-800 dark:text-slate-200">{selectedCreator.name}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium italic">Chưa chọn</span>
                              )}
                              <ChevronDown size={10} className="text-slate-400 shrink-0" />
                            </button>

                            {/* Dropdown Menu Popover */}
                            {activeCreatorPickerTaskId === task.id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setActiveCreatorPickerTaskId(null)}></div>
                                <div className="absolute top-full mt-1 left-2 right-2 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      handleRun(() => updateTaskCreator(task.id, null), "Đã bỏ người giao");
                                      setActiveCreatorPickerTaskId(null);
                                    }}
                                    className="flex items-center px-2 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-[10px] font-bold text-slate-400"
                                  >
                                    -- Chưa chọn --
                                  </button>
                                  {users.map((u: any) => (
                                    <button
                                      key={u.id}
                                      onClick={() => {
                                        handleRun(() => updateTaskCreator(task.id, u.id), "Đã đổi người giao");
                                        setActiveCreatorPickerTaskId(null);
                                      }}
                                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-left w-full"
                                    >
                                      <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm bg-slate-100">
                                        <img 
                                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || "User"}&background=7360f2&color=fff`} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 6. Người nhận (Hỗ trợ chọn nhiều thành viên) */}
                    <td className="py-3.5 px-3 align-top relative">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveAssigneePickerTaskId(activeAssigneePickerTaskId === task.id ? null : task.id)}
                          className="w-full text-left bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-350 min-h-[36px]"
                        >
                          <div className="flex -space-x-1.5 overflow-hidden items-center max-w-[130px]">
                            {task.assignees && task.assignees.length > 0 ? (
                              <>
                                {task.assignees.slice(0, 3).map((assignee: any) => (
                                  <div key={assignee.id} className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-700" title={assignee.name || ""}>
                                    <img 
                                      src={assignee.avatarUrl || `https://ui-avatars.com/api/?name=${assignee.name || "User"}&background=3b82f6&color=fff`} 
                                      alt="" 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                                {task.assignees.length > 3 && (
                                  <div className="w-5 h-5 rounded-full border border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0 shadow-sm z-10" title={task.assignees.slice(3).map((u: any) => u.name).join(", ")}>
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-medium">Chưa giao</span>
                            )}
                          </div>
                          <ChevronDown size={12} className="text-slate-400 shrink-0" />
                        </button>

                        {/* Multi-Assignee Dropdown Popover */}
                        {activeAssigneePickerTaskId === task.id && (
                          <>
                            {/* Backdrop overlay to click outside to close */}
                            <div className="fixed inset-0 z-25" onClick={() => setActiveAssigneePickerTaskId(null)}></div>
                            
                            <div className="absolute top-full mt-1 left-3 right-3 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">Giao việc ({task.assignees?.length || 0})</p>
                              {users.map((u: any) => {
                                const isAssigned = task.assignees?.some((a: any) => a.id === u.id);
                                return (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                      handleRun(
                                        () => toggleTaskAssignee(task.id, u.id, !isAssigned),
                                        isAssigned ? `Đã gỡ ${u.name}` : `Đã giao cho ${u.name}`
                                      );
                                    }}
                                    className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left w-full"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                        <img 
                                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name || "User"}&background=7360f2&color=fff`} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isAssigned || false}
                                      readOnly
                                      className="w-3 h-3 text-blue-600 rounded border-slate-350 pointer-events-none shrink-0"
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 7. Trạng thái */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="flex flex-col gap-1.5">
                        <select 
                          value={task.status} 
                          onChange={e => {
                            handleRun(() => updateTaskStatus(task.id, e.target.value), "Đã lưu trạng thái");
                          }}
                          className={`w-full border ${statusCls.border} ${statusCls.bg} ${statusCls.text} rounded-md px-2 py-1 outline-none cursor-pointer text-[10px] font-black uppercase tracking-wider`}
                        >
                          <option value="TODO">Chưa nhận</option>
                          <option value="DOING">Đang làm</option>
                          <option value="DONE">Hoàn thành</option>
                        </select>

                        {(isOverdue || isDueToday) && (
                          <span className={`text-[8px] font-black uppercase tracking-widest text-center px-1 py-0.5 rounded-md ${isOverdue ? "bg-rose-500/10 text-rose-600 animate-pulse" : "bg-amber-500/10 text-amber-600"}`}>
                            {isOverdue ? "Quá hạn" : "Hạn hôm nay"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 8. Deadline */}
                    <td className="py-3.5 px-3 align-top">
                      <input 
                        type="datetime-local" 
                        defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ""}
                        onChange={e => {
                          handleRun(() => updateTaskDueDate(task.id, e.target.value || null), "Đã cập nhật hạn chót");
                        }}
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded p-0.5 text-[10px] font-bold outline-none text-slate-700 dark:text-slate-300"
                      />
                    </td>

                    {/* 9. Loại sản phẩm */}
                    <td className="py-3.5 px-3 align-top border-l border-slate-200 dark:border-slate-700/60">
                      <select 
                        value={task.productType || "ALL"} 
                        onChange={e => {
                          handleRun(() => updateTaskProductType(task.id, e.target.value), "Đã đổi Loại sản phẩm");
                        }}
                        className={`w-full border ${pTypeCfg.border} ${pTypeCfg.bg} ${pTypeCfg.text} rounded-md px-2 py-1 outline-none cursor-pointer text-[10px] font-black uppercase tracking-wider`}
                      >
                        <option value="ALL">Tất cả / Khác</option>
                        <option value="IMAGE">Hình ảnh</option>
                        <option value="VIDEO">Video</option>
                        <option value="DOCUMENT">Docx / pdf</option>
                      </select>
                    </td>

                    {/* 10. Sản phẩm nộp (Tải lên nhiều tệp) */}
                    <td className="py-3.5 px-4 align-top border-r border-slate-200 dark:border-slate-700/60">
                      <div className="flex flex-col gap-3">
                        {/* Display categorized files in a unified compact text/icon list */}
                        {task.attachments?.length > 0 ? (
                          <div className="flex flex-col gap-1.5 max-w-full">
                            {/* Images */}
                            {images.map((url, i) => (
                              <a 
                                key={`img-${i}`} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-start gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold hover:underline break-all"
                                title={getFileName(url, i, "Hình ảnh")}
                              >
                                <ImageIcon size={12} className="shrink-0 text-blue-500 mt-0.5" />
                                <span>{getFileName(url, i, "Hình ảnh")}</span>
                              </a>
                            ))}

                            {/* Videos */}
                            {videos.map((url, i) => (
                              <a 
                                key={`vid-${i}`} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-start gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold hover:underline break-all"
                                title={getFileName(url, i, "Video")}
                              >
                                <VideoIcon size={12} className="shrink-0 text-purple-500 mt-0.5" />
                                <span>{getFileName(url, i, "Video")}</span>
                              </a>
                            ))}

                            {/* Documents */}
                            {docs.map((url, i) => (
                              <a 
                                key={`doc-${i}`} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold hover:underline break-all"
                                title={getFileName(url, i, "Tài liệu")}
                              >
                                <FileText size={12} className="shrink-0 text-emerald-500 mt-0.5" />
                                <span>{getFileName(url, i, "Tài liệu")}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa nộp sản phẩm</span>
                        )}

                        {/* Premium Multi-File Uploader Button */}
                        <div className="w-full">
                          <button 
                            onClick={() => document.getElementById(`upload-multi-${task.id}`)?.click()}
                            disabled={uploadingTaskId === task.id}
                            className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-slate-50 hover:bg-blue-50 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 rounded-xl text-[10px] font-black text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all disabled:opacity-50"
                            title="Tải lên một hoặc nhiều tệp"
                          >
                            {uploadingTaskId === task.id ? (
                              <>
                                <Loader2 size={11} className="animate-spin text-blue-500" />
                                <span>Đang nộp...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={11} />
                                <span>Nộp sản phẩm (Tải lên)</span>
                              </>
                            )}
                          </button>
                          <input 
                            type="file" 
                            id={`upload-multi-${task.id}`} 
                            multiple={true} // Support multiple file selection!
                            className="hidden" 
                            onChange={e => handleFilesUpload(task.id, e.target.files)} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* 11. Thời gian nộp */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 align-top">
                      {task.completedAt ? (
                        <div className="flex flex-col">
                          <span>{format(new Date(task.completedAt), "HH:mm")}</span>
                          <span className="text-[10px] text-slate-400">{format(new Date(task.completedAt), "dd/MM/yyyy")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* 12. Đánh giá */}
                    <td className="py-3.5 px-3 align-top">
                      <select 
                        value={task.evaluation} 
                        onChange={e => {
                          handleRun(() => updateTaskEvaluation(task.id, e.target.value), "Đã lưu đánh giá");
                        }}
                        className={`w-full border ${evalCfg.border} ${evalCfg.bg} ${evalCfg.text} rounded-md px-2.5 py-1 outline-none cursor-pointer text-[10px] font-black uppercase tracking-wider`}
                      >
                        <option value="REVIEWING">Xem xét</option>
                        <option value="APPROVED">Duyệt</option>
                        <option value="REJECTED">Không duyệt</option>
                        <option value="POSTPONED">Hoãn</option>
                      </select>
                    </td>

                    {/* 13. Ghi chú */}
                    <td className="py-3.5 pl-4 pr-5 align-top">
                     <textarea
                        defaultValue={task.evaluationNotes || ""}
                        placeholder="Nhập ghi chú lý do..."
                        onBlur={e => {
                          if (e.target.value !== (task.evaluationNotes || "")) {
                            handleRun(() => updateTaskEvaluationNotes(task.id, e.target.value || null), "Đã lưu ghi chú");
                          }
                        }}
                        className="w-full bg-slate-50/40 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 outline-none resize-y px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-400 rounded-md text-slate-600 dark:text-slate-400 text-xs font-medium transition-all"
                        rows={3}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
