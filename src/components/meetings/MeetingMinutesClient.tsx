"use client";

import { useState, useTransition, useRef } from "react";
import { 
  FileText, Upload, Trash2, Eye, Edit3, Plus, Trash, Check, X, Calendar, Clock, 
  MapPin, User, Users, Info, ChevronRight, Layers, ArrowLeft, Save, Sparkles, AlertTriangle, Loader2
} from "lucide-react";
import { parseMeetingMinutesDocx, saveMeetingMinutes, deleteMeetingMinutes } from "@/app/actions/meeting-minutes";
import toast from "react-hot-toast";

interface TaskItem {
  name: string;
  assignee: string;
  deadline: string;
  status: string;
  priority: string;
}

interface MinutesData {
  id?: string;
  meetingId: string;
  title: string;
  timeLocation: string;
  attendees: {
    host: string;
    secretary: string;
    participants: string[];
  };
  goal: string;
  summary: string;
  actionItems: TaskItem[];
  issuesDecisions: {
    decisions: string[];
    issues: string[];
  };
  ideasInsights: {
    ideas: string[];
  };
  createdAt?: string | Date;
}

interface Props {
  initialMinutes: MinutesData[];
  currentUser: any;
}

export default function MeetingMinutesClient({ initialMinutes, currentUser }: Props) {
  const [minutesList, setMinutesList] = useState<MinutesData[]>(initialMinutes);
  const [activeMinutes, setActiveMinutes] = useState<MinutesData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Form states for editing
  const [formState, setFormState] = useState<MinutesData>({
    meetingId: "",
    title: "",
    timeLocation: "",
    attendees: { host: "", secretary: "", participants: [] },
    goal: "",
    summary: "",
    actionItems: [],
    issuesDecisions: { decisions: [], issues: [] },
    ideasInsights: { ideas: [] }
  });

  const [newParticipant, setNewParticipant] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [newIdea, setNewIdea] = useState("");

  const resetForm = () => {
    setFormState({
      meetingId: "",
      title: "",
      timeLocation: "",
      attendees: { host: "", secretary: "", participants: [] },
      goal: "",
      summary: "",
      actionItems: [],
      issuesDecisions: { decisions: [], issues: [] },
      ideasInsights: { ideas: [] }
    });
    setNewParticipant("");
    setNewDecision("");
    setNewIssue("");
    setNewIdea("");
  };

  // Upload and parse DOCX file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      toast.error("Vui lòng tải lên tệp tin Word định dạng .docx!");
      return;
    }

    setLoading(true);
    toast.loading("Đang giải nén văn bản & phân tích dữ liệu cuộc họp...", { id: "parse-docx" });

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        const res = await parseMeetingMinutesDocx(base64);
        if (res.success && res.data) {
          setFormState(res.data as MinutesData);
          setIsEditing(true);
          setActiveMinutes(null);
          toast.success("Trích xuất biên bản thành công! Vui lòng kiểm tra lại trước khi lưu.", { id: "parse-docx" });
        } else {
          toast.error(res.error || "Không thể trích xuất dữ liệu từ tệp tin.", { id: "parse-docx" });
        }
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi đọc tệp tin.", { id: "parse-docx" });
      setLoading(false);
    }
  };

  // Save the record
  const handleSave = () => {
    if (!formState.meetingId.trim() || !formState.title.trim()) {
      toast.error("Vui lòng điền mã cuộc họp và tiêu đề!");
      return;
    }

    startTransition(async () => {
      const res = await saveMeetingMinutes(formState as any);
      if (res.success && res.data) {
        toast.success(res.isNew ? "Đã lưu biên bản họp mới!" : "Đã cập nhật biên bản họp!");
        
        // Update list state
        setMinutesList(prev => {
          const list = prev.filter(m => m.meetingId !== formState.meetingId);
          return [res.data as unknown as MinutesData, ...list];
        });
        
        setIsEditing(false);
        resetForm();
      } else {
        toast.error(res.error || "Gặp lỗi khi lưu biên bản họp.");
      }
    });
  };

  // Delete record
  const handleDelete = (meetingId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn biên bản họp này?")) return;

    startTransition(async () => {
      const res = await deleteMeetingMinutes(meetingId);
      if (res.success) {
        toast.success("Đã xóa biên bản họp!");
        setMinutesList(prev => prev.filter(m => m.meetingId !== meetingId));
        if (activeMinutes?.meetingId === meetingId) {
          setIsViewerOpen(false);
          setActiveMinutes(null);
        }
      } else {
        toast.error(res.error || "Gặp lỗi khi xóa biên bản.");
      }
    });
  };

  // Edit details of a saved minutes
  const startEditingSaved = (minutes: MinutesData) => {
    setFormState(JSON.parse(JSON.stringify(minutes))); // deep copy
    setIsEditing(true);
    setIsViewerOpen(false);
    setActiveMinutes(null);
  };

  // Actions for editing list inputs
  const addParticipant = () => {
    if (!newParticipant.trim()) return;
    setFormState(prev => ({
      ...prev,
      attendees: {
        ...prev.attendees,
        participants: [...prev.attendees.participants, newParticipant.trim()]
      }
    }));
    setNewParticipant("");
  };

  const removeParticipant = (idx: number) => {
    setFormState(prev => ({
      ...prev,
      attendees: {
        ...prev.attendees,
        participants: prev.attendees.participants.filter((_, i) => i !== idx)
      }
    }));
  };

  const addTask = () => {
    const newTask: TaskItem = {
      name: "Nhiệm vụ mới",
      assignee: "Chưa giao",
      deadline: new Date(Date.now() + 86400000 * 3).toLocaleDateString("vi-VN"),
      status: "TODO",
      priority: "MEDIUM"
    };
    setFormState(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, newTask]
    }));
  };

  const updateTask = (idx: number, field: keyof TaskItem, value: string) => {
    setFormState(prev => {
      const tasks = [...prev.actionItems];
      tasks[idx] = { ...tasks[idx], [field]: value };
      return { ...prev, actionItems: tasks };
    });
  };

  const removeTask = (idx: number) => {
    setFormState(prev => ({
      ...prev,
      actionItems: prev.actionItems.filter((_, i) => i !== idx)
    }));
  };

  const addDecision = () => {
    if (!newDecision.trim()) return;
    setFormState(prev => ({
      ...prev,
      issuesDecisions: {
        ...prev.issuesDecisions,
        decisions: [...prev.issuesDecisions.decisions, newDecision.trim()]
      }
    }));
    setNewDecision("");
  };

  const removeDecision = (idx: number) => {
    setFormState(prev => ({
      ...prev,
      issuesDecisions: {
        ...prev.issuesDecisions,
        decisions: prev.issuesDecisions.decisions.filter((_, i) => i !== idx)
      }
    }));
  };

  const addIssue = () => {
    if (!newIssue.trim()) return;
    setFormState(prev => ({
      ...prev,
      issuesDecisions: {
        ...prev.issuesDecisions,
        issues: [...prev.issuesDecisions.issues, newIssue.trim()]
      }
    }));
    setNewIssue("");
  };

  const removeIssue = (idx: number) => {
    setFormState(prev => ({
      ...prev,
      issuesDecisions: {
        ...prev.issuesDecisions,
        issues: prev.issuesDecisions.issues.filter((_, i) => i !== idx)
      }
    }));
  };

  const addIdea = () => {
    if (!newIdea.trim()) return;
    setFormState(prev => ({
      ...prev,
      ideasInsights: {
        ideas: [...prev.ideasInsights.ideas, newIdea.trim()]
      }
    }));
    setNewIdea("");
  };

  const removeIdea = (idx: number) => {
    setFormState(prev => ({
      ...prev,
      ideasInsights: {
        ideas: prev.ideasInsights.ideas.filter((_, i) => i !== idx)
      }
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── SECTION A: UPLOADER & EDITING SECTION ── */}
      {isEditing ? (
        <div className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-800/10 p-6 md:p-8 rounded-[2.5rem] flex flex-col gap-6 animate-in slide-in-from-bottom-6 duration-300">
          {/* Editor Header */}
          <div className="flex justify-between items-center">
            <button 
              onClick={() => { setIsEditing(false); resetForm(); }}
              className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/30 px-4.5 py-2.5 rounded-2xl"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
            <button 
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-widest bg-[#7360f2] hover:bg-[#5f4de0] px-5 py-3 rounded-2xl shadow-lg shadow-[#7360f2]/10 active:scale-95 transition-all"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu biên bản
            </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800/60 w-full" />

          {/* Editor Form Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Block: Meta & Summary (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Box 1: Thông tin chung */}
              <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-900/30 p-5 rounded-[2rem] border border-white/10">
                <h3 className="text-xs font-black text-[#7360f2] uppercase tracking-widest flex items-center gap-1.5">
                  <Layers size={13} /> 1. Thông Tin Chung
                </h3>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Mã cuộc họp</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MEET_YYYYMMDD_NAME"
                      value={formState.meetingId}
                      onChange={e => setFormState(prev => ({ ...prev, meetingId: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                      className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tiêu đề cuộc họp</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Họp triển khai..."
                      value={formState.title}
                      onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))}
                      className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Thời gian & Địa điểm</label>
                    <input 
                      type="text" 
                      placeholder="Ngày, Giờ, hình thức Online/Offline..."
                      value={formState.timeLocation}
                      onChange={e => setFormState(prev => ({ ...prev, timeLocation: e.target.value }))}
                      className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Chủ trì</label>
                      <input 
                        type="text" 
                        value={formState.attendees.host}
                        onChange={e => setFormState(prev => ({ ...prev, attendees: { ...prev.attendees, host: e.target.value } }))}
                        className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Thư ký</label>
                      <input 
                        type="text" 
                        value={formState.attendees.secretary}
                        onChange={e => setFormState(prev => ({ ...prev, attendees: { ...prev.attendees, secretary: e.target.value } }))}
                        className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none"
                      />
                    </div>
                  </div>

                  {/* Participants editor */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Thành phần tham dự</label>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        placeholder="Tên nhân sự..."
                        value={newParticipant}
                        onChange={e => setNewParticipant(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }}
                        className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={addParticipant}
                        className="px-3 bg-[#7360f2] hover:bg-[#5f4de0] text-white rounded-xl text-xs font-black"
                      >
                        Thêm
                      </button>
                    </div>
                    {/* List */}
                    <div className="flex flex-wrap gap-1 mt-1 max-h-[80px] overflow-y-auto">
                      {formState.attendees.participants.map((p, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-600 dark:text-slate-300">
                          {p}
                          <button type="button" onClick={() => removeParticipant(idx)} className="text-slate-400 hover:text-rose-500">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Tóm lược nội dung */}
              <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-900/30 p-5 rounded-[2rem] border border-white/10">
                <h3 className="text-xs font-black text-[#7360f2] uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500 animate-pulse" /> 2. Tóm Lược Nội Dung
                </h3>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Mục tiêu cuộc họp</label>
                    <textarea 
                      rows={2} 
                      value={formState.goal}
                      onChange={e => setFormState(prev => ({ ...prev, goal: e.target.value }))}
                      className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tóm tắt cốt lõi (3-5 dòng)</label>
                    <textarea 
                      rows={4} 
                      value={formState.summary}
                      onChange={e => setFormState(prev => ({ ...prev, summary: e.target.value }))}
                      className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 focus:ring-2 focus:ring-[#7360f2]/20 outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Block: Tasks, Decisions & Ideas (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Box 3: Nhiệm vụ (Action Items) */}
              <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-900/30 p-5 rounded-[2rem] border border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-[#7360f2] uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={13} /> 3. Chỉ Số Tiến Độ & Nhiệm Vụ
                  </h3>
                  <button 
                    type="button" 
                    onClick={addTask}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#7360f2]/10 text-[#7360f2] text-[10px] font-black uppercase rounded-lg hover:bg-[#7360f2]/20 transition-all"
                  >
                    <Plus size={11} /> Thêm việc
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {formState.actionItems.length > 0 ? (
                    formState.actionItems.map((task, idx) => (
                      <div key={idx} className="bg-white/80 dark:bg-slate-800/40 p-4.5 rounded-2xl border border-slate-200/10 flex flex-col gap-3 relative group">
                        <button 
                          type="button" 
                          onClick={() => removeTask(idx)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={14} />
                        </button>
                        
                        <div className="flex flex-col gap-1.5 pr-6">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Tên đầu việc</label>
                          <input 
                            type="text" 
                            value={task.name}
                            onChange={e => updateTask(idx, "name", e.target.value)}
                            className="w-full bg-transparent font-black text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-[#7360f2]/30 outline-none pb-0.5 border-b border-dashed border-slate-200 dark:border-slate-700"
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Người làm</label>
                            <input 
                              type="text" 
                              value={task.assignee}
                              onChange={e => updateTask(idx, "assignee", e.target.value)}
                              className="w-full bg-slate-100/50 dark:bg-slate-900/40 px-2 py-1 rounded-md text-[10px] font-bold"
                            />
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Hạn chót</label>
                            <input 
                              type="text" 
                              value={task.deadline}
                              onChange={e => updateTask(idx, "deadline", e.target.value)}
                              className="w-full bg-slate-100/50 dark:bg-slate-900/40 px-2 py-1 rounded-md text-[10px] font-bold"
                            />
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Độ ưu tiên</label>
                            <select 
                              value={task.priority}
                              onChange={e => updateTask(idx, "priority", e.target.value)}
                              className="w-full bg-slate-100/50 dark:bg-slate-900/40 px-1.5 py-1 rounded-md text-[10px] font-bold"
                            >
                              <option value="LOW">Thấp</option>
                              <option value="MEDIUM">Trung bình</option>
                              <option value="HIGH">Cao</option>
                              <option value="URGENT">Khẩn cấp</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Trạng thái</label>
                            <select 
                              value={task.status}
                              onChange={e => updateTask(idx, "status", e.target.value)}
                              className="w-full bg-slate-100/50 dark:bg-slate-900/40 px-1.5 py-1 rounded-md text-[10px] font-bold"
                            >
                              <option value="TODO">Mới (To Do)</option>
                              <option value="DOING">Đang làm</option>
                              <option value="DONE">Hoàn thành</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200/50 dark:border-slate-800/50 rounded-2xl opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-wider">Chưa có nhiệm vụ nào</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 4: Quyết định & Vấn đề */}
              <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-900/30 p-5 rounded-[2rem] border border-white/10">
                <h3 className="text-xs font-black text-[#7360f2] uppercase tracking-widest flex items-center gap-1.5">
                  <Check size={13} /> 4. Vấn Đề & Quyết Định
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Decisions */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Quyết định đã chốt</label>
                    <div className="flex gap-1.5 mb-1">
                      <input 
                        type="text" 
                        placeholder="Thêm quyết định..."
                        value={newDecision}
                        onChange={e => setNewDecision(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDecision(); } }}
                        className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 outline-none"
                      />
                      <button type="button" onClick={addDecision} className="px-2.5 bg-[#7360f2] text-white rounded-xl text-xs font-black">+</button>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {formState.issuesDecisions.decisions.map((d, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-2 bg-white/40 dark:bg-slate-800/30 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex-1 leading-normal">✓ {d}</span>
                          <button type="button" onClick={() => removeDecision(idx)} className="text-slate-400 hover:text-rose-500 shrink-0">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Vấn đề tồn đọng / Rủi ro</label>
                    <div className="flex gap-1.5 mb-1">
                      <input 
                        type="text" 
                        placeholder="Thêm vấn đề..."
                        value={newIssue}
                        onChange={e => setNewIssue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIssue(); } }}
                        className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 outline-none"
                      />
                      <button type="button" onClick={addIssue} className="px-2.5 bg-[#7360f2] text-white rounded-xl text-xs font-black">+</button>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {formState.issuesDecisions.issues.map((i, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-2 bg-white/40 dark:bg-slate-800/30 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex-1 leading-normal">⚠ {i}</span>
                          <button type="button" onClick={() => removeIssue(idx)} className="text-slate-400 hover:text-rose-500 shrink-0">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 5: Ý tưởng đóng góp */}
              <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-900/30 p-5 rounded-[2rem] border border-white/10">
                <h3 className="text-xs font-black text-[#7360f2] uppercase tracking-widest flex items-center gap-1.5">
                  <User size={13} /> 5. Ý Tưởng & Đóng Góp Nổi Bật
                </h3>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5 mb-1">
                    <input 
                      type="text" 
                      placeholder="Thêm đề xuất, ý tưởng mới phát sinh..."
                      value={newIdea}
                      onChange={e => setNewIdea(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIdea(); } }}
                      className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200/20 outline-none"
                    />
                    <button type="button" onClick={addIdea} className="px-3 bg-[#7360f2] text-white rounded-xl text-xs font-black">+</button>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto">
                    {formState.ideasInsights.ideas.map((id, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2 bg-white/40 dark:bg-slate-800/30 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex-1 leading-normal">💡 {id}</span>
                        <button type="button" onClick={() => removeIdea(idx)} className="text-slate-400 hover:text-rose-500 shrink-0">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* ── DEFAULT DASHBOARD VIEW: UPLOADER & GRID ── */
        <div className="flex flex-col gap-6">
          
          {/* Box A1: Drag & Drop Word Document Uploader */}
          <div className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-800/10 p-6 md:p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
            
            {/* Soft background decor */}
            <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-[#7360f2]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#7360f2]/10 transition-all duration-500" />
            
            {/* Upload Zone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full md:w-1/2 border border-dashed border-[#7360f2]/30 hover:border-[#7360f2] bg-white/40 dark:bg-slate-900/30 py-8 px-4 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-lg hover:shadow-[#7360f2]/5 active:scale-98 transition-all duration-300 text-center"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".docx" 
                className="hidden" 
              />
              <div className="w-12 h-12 bg-[#7360f2]/10 text-[#7360f2] rounded-2xl flex items-center justify-center shadow-inner">
                {loading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Tải lên Biên bản cuộc họp</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Định dạng tệp hỗ trợ: Microsoft Word (.docx)</p>
              </div>
            </div>

            {/* Instruction / Features */}
            <div className="w-full md:w-1/2 flex flex-col gap-4 justify-center">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase leading-none">
                Số hóa Biên Bản cuộc họp
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Hệ thống hỗ trợ trích xuất dữ liệu thông minh từ văn bản thô của biên bản họp. Chỉ số tiến độ, các đầu việc phát sinh, quyết định chốt, và rủi ro sẽ được cấu trúc và quản lý tập trung.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-wider">Tự động phân loại</span>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-wider">Tạo Task Kanban</span>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-wider">Lưu trữ vĩnh viễn</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-[#7360f2] hover:bg-[#5f4de0] rounded-xl shadow-md shadow-[#7360f2]/10 active:scale-95 transition-all self-start mt-1"
              >
                <FileText size={13} /> Hướng Dẫn & Biên Bản Mẫu
              </button>
            </div>

          </div>

          {/* Grid Header */}
          <div className="flex items-center gap-2 mt-4 pl-1">
            <span className="w-1.5 h-4 bg-[#7360f2] rounded-full" />
            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider leading-none">
              Kho lưu trữ biên bản cuộc họp ({minutesList.length})
            </h2>
          </div>

          {/* Grid Layout of Saved Minutes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {minutesList.length > 0 ? (
              minutesList.map((item) => {
                const totalTasks = item.actionItems?.length || 0;
                const totalDecisions = item.issuesDecisions?.decisions?.length || 0;
                const totalIdeas = item.ideasInsights?.ideas?.length || 0;
                
                return (
                  <div 
                    key={item.meetingId}
                    className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-800/10 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-4 hover:shadow-[0_8px_30px_rgba(115,96,242,0.06)] hover:-translate-y-0.5 transition-all group duration-300 relative overflow-hidden"
                  >
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#7360f2]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7360f2]/10 transition-all duration-300" />
                    
                    {/* Header */}
                    <div className="flex justify-between items-start z-10">
                      <div className="flex items-center gap-2 bg-slate-100/60 dark:bg-slate-800/50 px-3 py-1 rounded-xl">
                        <FileText size={12} className="text-[#7360f2]" />
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.meetingId}</span>
                      </div>
                      
                      {/* Delete option */}
                      <button 
                        onClick={() => handleDelete(item.meetingId)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all z-10"
                        title="Xóa biên bản"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Title */}
                    <div className="flex-1 flex flex-col gap-1.5 z-10">
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs md:text-sm uppercase tracking-tight group-hover:text-[#7360f2] transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <MapPin size={9} /> {item.timeLocation}
                      </p>
                    </div>

                    {/* Summary snippet */}
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-3 italic z-10 px-3 py-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl">
                      "{item.summary}"
                    </p>

                    {/* Stats counts */}
                    <div className="grid grid-cols-3 gap-2 text-center z-10 py-1 bg-slate-100/30 dark:bg-slate-800/10 rounded-2xl border border-slate-100/20">
                      <div>
                        <p className="text-xs font-black text-[#7360f2]">{totalTasks}</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Nhiệm vụ</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-500">{totalDecisions}</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Quyết định</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-500">{totalIdeas}</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Đóng góp</p>
                      </div>
                    </div>

                    {/* Footer - Attendees & Actions */}
                    <div className="flex justify-between items-center z-10 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Users size={11} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                          {item.attendees.participants.length + (item.attendees.host ? 1 : 0)} Nhân sự
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <button 
                          onClick={() => { setActiveMinutes(item); setIsViewerOpen(true); }}
                          className="flex items-center gap-1 px-3 py-2 bg-[#7360f2]/10 hover:bg-[#7360f2]/20 text-[#7360f2] text-[9px] font-black uppercase tracking-wider rounded-xl transition-all"
                        >
                          <Eye size={10} /> Xem chi tiết
                        </button>
                        <button 
                          onClick={() => startEditingSaved(item)}
                          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={11} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/20 dark:bg-slate-900/10 rounded-[2.5rem] border border-white/10 dark:border-slate-800/10 backdrop-blur-md">
                <FileText size={40} className="text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Kho lưu trữ biên bản trống
                </p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
                  Tải lên tệp tin Word đầu tiên của bạn để phân tích và lưu trữ các kết quả cuộc họp.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── SECTION C: DETAIL MINUTES VIEWER MODAL ── */}
      {isViewerOpen && activeMinutes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Viewer Header */}
            <div className="flex justify-between items-start shrink-0">
              <div className="flex flex-col gap-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#7360f2]/10 text-[#7360f2] text-[9px] font-black rounded-lg uppercase tracking-wider">
                    {activeMinutes.meetingId}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Tạo lúc: {activeMinutes.createdAt ? new Date(activeMinutes.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-snug mt-1">
                  {activeMinutes.title}
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin size={10} className="text-[#7360f2]" /> {activeMinutes.timeLocation}
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => startEditingSaved(activeMinutes)}
                  className="p-2.5 text-[#7360f2] bg-[#7360f2]/10 hover:bg-[#7360f2]/20 rounded-xl transition-all"
                  title="Chỉnh sửa biên bản"
                >
                  <Edit3 size={15} />
                </button>
                <button 
                  onClick={() => setIsViewerOpen(false)}
                  className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800/60 w-full shrink-0" />

            {/* Viewer Document Body */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 scrollbar-hide text-slate-800 dark:text-slate-200 text-xs md:text-sm font-medium leading-relaxed">
              
              {/* Row 1: Host & Secretary info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4.5 rounded-2xl border border-slate-100/20">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Người chủ trì</span>
                  <span className="font-black text-slate-700 dark:text-slate-300">{activeMinutes.attendees.host || "Không có thông tin"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Thư ký ghi chép</span>
                  <span className="font-black text-slate-700 dark:text-slate-300">{activeMinutes.attendees.secretary || "Không có thông tin"}</span>
                </div>
              </div>

              {/* Members participating */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Users size={11} /> Thành phần nhân sự tham dự</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeMinutes.attendees.participants.length > 0 ? (
                    activeMinutes.attendees.participants.map((p, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-lg text-slate-600 dark:text-slate-400">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[10px]">Không ghi nhận danh sách chi tiết</span>
                  )}
                </div>
              </div>

              {/* Box 1: Executive Summary */}
              <div className="flex flex-col gap-3.5 bg-slate-50/30 dark:bg-slate-800/10 p-5 rounded-[2rem] border border-slate-100/10">
                <h4 className="text-xs font-black text-[#7360f2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Info size={13} /> 2. Tóm Lược Nội Dung (Executive Summary)
                </h4>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Mục tiêu cuộc họp</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{activeMinutes.goal}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Tóm tắt diễn biến cốt lõi</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100/30">
                      "{activeMinutes.summary}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2: Tasks & Action Items */}
              <div className="flex flex-col gap-3.5">
                <h4 className="text-xs font-black text-[#7360f2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Calendar size={13} /> 3. Nhiệm Vụ Phát Sinh (Action Items)
                </h4>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {activeMinutes.actionItems.length > 0 ? (
                    activeMinutes.actionItems.map((task, idx) => {
                      const getPrioColor = (p: string) => {
                        if (p === "URGENT") return "bg-rose-500 text-white";
                        if (p === "HIGH") return "bg-orange-500 text-white";
                        if (p === "LOW") return "bg-slate-100 dark:bg-slate-800 text-slate-500";
                        return "bg-blue-500 text-white";
                      };
                      const getPrioLabel = (p: string) => {
                        if (p === "URGENT") return "Khẩn cấp";
                        if (p === "HIGH") return "Cao";
                        if (p === "LOW") return "Thấp";
                        return "Trung bình";
                      };

                      return (
                        <div key={idx} className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-xs text-slate-700 dark:text-slate-300 uppercase leading-snug">{task.name}</span>
                            <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400 font-bold mt-1">
                              <span className="flex items-center gap-1"><User size={10} /> Phụ trách: <strong>{task.assignee}</strong></span>
                              <span>•</span>
                              <span>Hạn chót: <strong>{task.deadline}</strong></span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${getPrioColor(task.priority)}`}>
                              {getPrioLabel(task.priority)}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-500`}>
                              {task.status === "DONE" ? "Hoàn thành" : task.status === "DOING" ? "Đang làm" : "Mới (To Do)"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      Không phát sinh đầu việc mới.
                    </p>
                  )}
                </div>
              </div>

              {/* Box 3: Decisions & Issues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/10 dark:bg-slate-800/10 p-5 rounded-[2rem] border border-slate-100/10">
                
                {/* Decisions */}
                <div className="flex flex-col gap-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <Check size={11} className="text-emerald-500" /> Quyết định cốt lõi đã chốt
                  </h5>
                  <ul className="flex flex-col gap-2">
                    {activeMinutes.issuesDecisions.decisions.length > 0 ? (
                      activeMinutes.issuesDecisions.decisions.map((dec, idx) => (
                        <li key={idx} className="flex gap-2 text-slate-700 dark:text-slate-300 font-bold leading-relaxed bg-white dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100/50">
                          <span className="text-emerald-500 shrink-0 font-black">✓</span>
                          <span className="text-[11px]">{dec}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[10px] text-slate-400 italic">Không ghi nhận quyết định đặc biệt.</li>
                    )}
                  </ul>
                </div>

                {/* Issues/Risks */}
                <div className="flex flex-col gap-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <AlertTriangle size={11} className="text-amber-500" /> Vấn đề tồn đọng / Rủi ro
                  </h5>
                  <ul className="flex flex-col gap-2">
                    {activeMinutes.issuesDecisions.issues.length > 0 ? (
                      activeMinutes.issuesDecisions.issues.map((iss, idx) => (
                        <li key={idx} className="flex gap-2 text-slate-700 dark:text-slate-300 font-bold leading-relaxed bg-white dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100/50">
                          <span className="text-amber-500 shrink-0 font-black">⚠</span>
                          <span className="text-[11px]">{iss}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[10px] text-slate-400 italic">Không ghi nhận rủi ro lớn.</li>
                    )}
                  </ul>
                </div>

              </div>

              {/* Box 4: Ideas & Suggestions */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-black text-[#7360f2] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Sparkles size={13} className="text-amber-500" /> 5. Ý Tưởng & Đóng Góp Nổi Bật
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {activeMinutes.ideasInsights.ideas.length > 0 ? (
                    activeMinutes.ideasInsights.ideas.map((idea, idx) => (
                      <div key={idx} className="flex gap-2 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100/20 items-center">
                        <span className="text-lg shrink-0">💡</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{idea}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      Không ghi nhận ý tưởng/đóng góp mới.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── SECTION C: SECRETARY TEMPLATE MODAL ── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="text-[#7360f2]" size={20} />
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base uppercase tracking-tight">Khung Biên Bản Họp Chuẩn</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tài liệu tham khảo cho Thư ký ghi chép</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 leading-relaxed">
              <div className="bg-[#7360f2]/5 p-4.5 rounded-2xl border border-[#7360f2]/10 flex gap-3 text-slate-600 dark:text-slate-300">
                <span className="text-xl">💡</span>
                <p className="text-[11px] font-semibold leading-relaxed">
                  Để hệ thống trích xuất dữ liệu hoàn toàn tự động, thư ký chỉ cần soạn biên bản theo <strong className="text-[#7360f2]">đúng cấu trúc từ khóa bên dưới</strong> trong phần mềm Word (Microsoft Word), lưu tệp ở định dạng <strong className="text-[#7360f2]">.docx</strong> và tải lên hệ thống.
                </p>
              </div>

              {/* Template Preview Section */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung mẫu biên bản chuẩn</span>
                  <button 
                    onClick={() => {
                      const templateText = `MÃ CUỘC HỌP: MEET_20260526_CONG_TY_CHANH_HUNG
TIÊU ĐỀ: Họp Triển Khai Giao Diện Mới Dự Án Chánh Hưng
THỜI GIAN & ĐỊA ĐIỂM: 14:00 - 15:30, Ngày 26/05/2026 - Trực tiếp tại Văn phòng Công ty
CHỦ TRÌ: Nguyễn Văn A
THƯ KÝ: Trần Thị B
THÀNH PHẦN THAM DỰ: Nguyễn Văn A, Trần Thị B, Phạm Văn C, Lê Thị D

TÓM LƯỢC NỘI DUNG & MỤC TIÊU
- Mục tiêu: Thống nhất giao diện tinh chỉnh Glassmorphism và sơ đồ tính năng nhắn tin Viber clone cho Mobile.
- Tóm tắt cốt lõi: Các thành viên đã xem xét bản thiết kế UI tinh giản đường viền, thảo luận phương án bỏ qua duyệt nội dung và media để tập trung cho chat. Biểu mẫu đăng ký lịch họp mới sẽ do Admin phê duyệt trực tiếp.

NHIỆM VỤ & CHỈ SỐ TIẾN ĐỘ
STT | Đầu việc | Người làm | Hạn chót | Độ ưu tiên
1 | Tinh chỉnh CSS globals và border hệ thống | Nguyễn Văn A | 28/05/2026 | Cao
2 | Cài đặt thư viện mammoth và viết parser | Trần Thị B | 30/05/2026 | Khẩn cấp
3 | Thiết kế màn hình Biên bản cuộc họp | Lê Thị D | 02/06/2026 | Trung bình

VẤN ĐỀ & QUYẾT ĐỊNH
- Quyết định đã chốt:
✓ Thống nhất bỏ toàn bộ phần Media Pool và Duyệt Content để tối ưu tài nguyên.
✓ Toàn bộ lịch họp sẽ hiển thị dạng thông báo nhanh, đăng ký cần Admin duyệt.

- Vấn đề tồn đọng / Rủi ro:
⚠ Tệp Word upload nếu có định dạng bảng quá phức tạp có thể làm giảm độ chính xác của parser. Thư ký cần tuân thủ đúng cấu trúc.

Ý TƯỞNG & ĐÓNG GÓP NỔI BẬT
- Tích hợp thêm tính năng Tải file mẫu trực tiếp từ giao diện để Thư ký dễ thao tác.
- Tự động đồng bộ các action items (nhiệm vụ) sang bảng Kanban tiến độ.`;
                      navigator.clipboard.writeText(templateText);
                      toast.success("Đã sao chép văn bản mẫu chuẩn vào clipboard!");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7360f2]/10 hover:bg-[#7360f2]/20 text-[#7360f2] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    Sao chép bản mẫu
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80 font-mono text-[10.5px] text-slate-700 dark:text-slate-300 overflow-x-auto max-h-[350px] overflow-y-auto leading-normal whitespace-pre">
{`MÃ CUỘC HỌP: MEET_20260526_CONG_TY_CHANH_HUNG
TIÊU ĐỀ: Họp Triển Khai Giao Diện Mới Dự Án Chánh Hưng
THỜI GIAN & ĐỊA ĐIỂM: 14:00 - 15:30, Ngày 26/05/2026 - Trực tiếp tại Văn phòng Công ty
CHỦ TRÌ: Nguyễn Văn A
THƯ KÝ: Trần Thị B
THÀNH PHẦN THAM DỰ: Nguyễn Văn A, Trần Thị B, Phạm Văn C, Lê Thị D

TÓM LƯỢC NỘI DUNG & MỤC TIÊU
- Mục tiêu: Thống nhất giao diện tinh chỉnh Glassmorphism và sơ đồ tính năng nhắn tin Viber clone cho Mobile.
- Tóm tắt cốt lõi: Các thành viên đã xem xét bản thiết kế UI tinh giản đường viền, thảo luận phương án bỏ qua duyệt nội dung và media để tập trung cho chat. Biểu mẫu đăng ký lịch họp mới sẽ do Admin phê duyệt trực tiếp.

NHIỆM VỤ & CHỈ SỐ TIẾN ĐỘ
STT | Đầu việc | Người làm | Hạn chót | Độ ưu tiên
1 | Tinh chỉnh CSS globals và border hệ thống | Nguyễn Văn A | 28/05/2026 | Cao
2 | Cài đặt thư viện mammoth và viết parser | Trần Thị B | 30/05/2026 | Khẩn cấp
3 | Thiết kế màn hình Biên bản cuộc họp | Lê Thị D | 02/06/2026 | Trung bình

VẤN ĐỀ & QUYẾT ĐỊNH
- Quyết định đã chốt:
✓ Thống nhất bỏ toàn bộ phần Media Pool và Duyệt Content để tối ưu tài nguyên.
✓ Toàn bộ lịch họp sẽ hiển thị dạng thông báo nhanh, đăng ký cần Admin duyệt.

- Vấn đề tồn đọng / Rủi ro:
⚠ Tệp Word upload nếu có định dạng bảng quá phức tạp có thể làm giảm độ chính xác của parser. Thư ký cần tuân thủ đúng cấu trúc.

Ý TƯỞNG & ĐÓNG GÓP NỔI BẬT
- Tích hợp thêm tính năng Tải file mẫu trực tiếp từ giao diện để Thư ký dễ thao tác.
- Tự động đồng bộ các action items (nhiệm vụ) sang bảng Kanban tiến độ.`}
                </div>
              </div>

              {/* Requirements Note */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Những lưu ý quan trọng để trích xuất chính xác</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex gap-2 items-start">
                    <span className="text-[#7360f2] font-black">•</span>
                    <p><strong>Mã cuộc họp:</strong> Bắt buộc theo đúng cấu pháp <strong className="font-mono">MEET_YYYYMMDD_NAME</strong> (Ví dụ: MEET_20260526_KAI_TIEN_UI) để lọc và định danh vĩnh viễn.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex gap-2 items-start">
                    <span className="text-[#7360f2] font-black">•</span>
                    <p><strong>Tên cột Nhiệm vụ:</strong> Các cột trong bảng phải phân tách bằng ký tự đứng <strong className="font-mono">|</strong> và có tên cột tương ứng: <strong className="font-mono">Đầu việc</strong>, <strong className="font-mono">Người làm</strong>, <strong className="font-mono">Hạn chót</strong>, <strong className="font-mono">Độ ưu tiên</strong>.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex gap-2 items-start">
                    <span className="text-[#7360f2] font-black">•</span>
                    <p><strong>Các từ khóa tiêu đề:</strong> Giữ nguyên các từ khóa danh mục: <strong className="text-slate-700 dark:text-slate-200">TÓM LƯỢC NỘI DUNG & MỤC TIÊU</strong>, <strong className="text-slate-700 dark:text-slate-200">NHIỆM VỤ & CHỈ SỐ TIẾN ĐỘ</strong>, <strong className="text-slate-700 dark:text-slate-200">VẤN ĐỀ & QUYẾT ĐỊNH</strong>, <strong className="text-slate-700 dark:text-slate-200">Ý TƯỞNG & ĐÓNG GÓP NỔI BẬT</strong>.</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl flex gap-2 items-start">
                    <span className="text-[#7360f2] font-black">•</span>
                    <p><strong>Đánh dấu bullet:</strong> Sử dụng biểu tượng <strong className="font-mono">✓</strong> cho Quyết định đã chốt, biểu tượng <strong className="font-mono">⚠</strong> cho Vấn đề/Rủi ro, và biểu tượng <strong className="font-mono">-</strong> cho Mục tiêu và Ý tưởng đóng góp.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/40">
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
