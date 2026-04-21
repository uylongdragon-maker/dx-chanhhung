"use client";

import { useState, useTransition } from "react";
import { Calendar, Clock, MapPin, Send, Loader2, CheckCircle2, XCircle, Bot, Sparkles, ChevronRight, PlusCircle } from "lucide-react";
import { bookMeetingRoom, aiAutoApprove } from "@/app/actions/meeting";

interface MeetingRequestPanelProps {
  requests: any[];
  userId: string;
}

export default function MeetingRequestPanel({ requests, userId }: MeetingRequestPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    roomName: "Phòng Họp 1 (Lớn)",
    purpose: "",
    startTime: "",
    endTime: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purpose || !formData.startTime || !formData.endTime) return;

    startTransition(async () => {
      const result = await bookMeetingRoom(
        userId, 
        formData.roomName, 
        formData.purpose, 
        new Date(formData.startTime), 
        new Date(formData.endTime)
      );
      if (result.success) {
        setFormData({ ...formData, purpose: "", startTime: "", endTime: "" });
        alert("Đã gửi yêu cầu mượn phòng!");
      } else {
        alert("Lỗi: " + result.error);
      }
    });
  };

  const handleAIReview = async () => {
    startTransition(async () => {
      const result = await aiAutoApprove();
      if (result.count !== undefined) {
        alert(`Thư ký AI đã hoàn thành! Đã xử lý ${result.count} yêu cầu dựa trên mục đích công việc.`);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 pb-20">
      
      {/* 1. Form Đăng ký - Left Column */}
      <div className="xl:col-span-4 bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl text-blue-500"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                    <PlusCircle size={20} />
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 block">Registration</span>
                   <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
                     Đăng ký Mượn phòng
                   </h3>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vị trí:</label>
                  <select 
                    value={formData.roomName}
                    onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                    className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-blue-500/5 transition-all text-slate-800 dark:text-slate-100"
                  >
                    <option>Phòng Họp 1 (Lớn)</option>
                    <option>Phòng Họp 2 (Vừa)</option>
                    <option>Studio Truyền thông</option>
                    <option>Phòng Truyền thống</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục đích sử dụng:</label>
                  <input 
                    type="text" 
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="VD: Họp triển khai bản tin quý 2..."
                    className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-blue-500/5 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian bắt đầu:</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="datetime-local" 
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-blue-500/5 transition-all text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian kết thúc:</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="datetime-local" 
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:outline-none focus:ring-8 focus:ring-blue-500/5 transition-all text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Gửi lệnh đăng ký
              </button>
            </form>
        </div>
      </div>

      {/* 2. Danh sách yêu cầu & AI Auto-Review - Right Column */}
      <div className="xl:col-span-8 bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 rounded-[3rem] p-8 shadow-2xl flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Bot size={150} className="text-indigo-600" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative z-10 px-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tighter uppercase">
              <Clock className="text-indigo-600" size={24} /> 
              Dòng thời gian mượn phòng
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Live status updates</p>
          </div>
          <button 
            onClick={handleAIReview}
            disabled={isPending}
            className="group relative overflow-hidden px-8 py-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-indigo-500/30 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Bot size={16} className="relative z-10" />
            <span className="relative z-10">Kích hoạt Thư ký AI</span>
            <Sparkles size={14} className="relative z-10 animate-pulse text-yellow-300" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-2 relative z-10 overflow-y-auto max-h-[600px] scrollbar-hide">
          {requests.length > 0 ? (
            requests.map((req) => (
              <div key={req.id} className="bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-800/40 p-6 rounded-3xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all group shadow-sm hover:shadow-xl border-l-4 border-l-transparent data-[status=APPROVED]:border-l-emerald-500 data-[status=REJECTED]:border-l-rose-500 data-[status=PENDING]:border-l-blue-500" data-status={req.status}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                      <MapPin size={22} className="group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-base leading-tight tracking-tight">{req.roomName}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Status: {req.status}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                      {req.isAIApproved && (
                        <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full border border-indigo-500/10">
                            <Bot size={10} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">AI Reviewed</span>
                        </div>
                      )}
                      <div className={`p-1.5 rounded-full ${
                        req.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-600" : req.status === "REJECTED" ? "bg-rose-500/20 text-rose-600" : "bg-blue-500/20 text-blue-600"
                      }`}>
                         {req.status === "APPROVED" ? <CheckCircle2 size={16}/> : req.status === "REJECTED" ? <XCircle size={16}/> : <Clock size={16}/>}
                      </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed line-clamp-2 italic">"{req.purpose}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 border border-white dark:border-slate-700">
                                {req.user?.name?.substring(0, 2).toUpperCase() || "??"}
                            </div>
                            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400">{req.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={12} />
                            <span className="text-[10px] font-black">
                                {new Date(req.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Calendar size={48} className="text-slate-400" />
              </div>
              <p className="text-lg font-black text-slate-600 dark:text-slate-400 tracking-tighter uppercase">Chưa có lệnh mượn phòng</p>
              <p className="text-xs font-bold text-slate-500 mt-2">Dòng thời gian đang trống.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
