"use client";

import { useState, useTransition } from "react";
import { Calendar, Clock, MapPin, Send, Loader2, CheckCircle2, XCircle, PlusCircle } from "lucide-react";
import { bookMeetingRoom } from "@/app/actions/meeting";

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
      }
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8 pb-20">
      {/* Form Đăng ký */}
      <div className="xl:col-span-4 bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 rounded-[3rem] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
            <PlusCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 block">Registration</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">Đăng ký Mượn phòng</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vị trí phòng</label>
            <select value={formData.roomName} onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
              className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-800 dark:text-slate-100">
              <option>Phòng Họp 1 (Lớn)</option>
              <option>Phòng Họp 2 (Vừa)</option>
              <option>Studio Truyền thông</option>
              <option>Phòng Truyền thống</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mục đích sử dụng</label>
            <input type="text" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="VD: Họp triển khai bản tin quý 2..."
              className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-800 dark:text-slate-100 placeholder:text-slate-300" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bắt đầu</label>
              <input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-800 dark:text-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kết thúc</label>
              <input type="datetime-local" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-white/60 dark:bg-slate-900/60 border border-white dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-800 dark:text-slate-100" />
            </div>
          </div>

          <button type="submit" disabled={isPending}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Gửi lệnh đăng ký
          </button>
        </form>
      </div>

      {/* Danh sách yêu cầu */}
      <div className="xl:col-span-8 bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 rounded-[3rem] p-8 shadow-2xl">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tighter uppercase mb-8">
          <Clock className="text-indigo-600" size={24} /> Dòng thời gian mượn phòng
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto max-h-[600px]">
          {requests.length > 0 ? requests.map((req) => (
            <div key={req.id} className="bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-800/40 p-6 rounded-3xl hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">{req.roomName}</h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{req.status}</p>
                  </div>
                </div>
                <div className={`p-1.5 rounded-full ${req.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-600" : req.status === "REJECTED" ? "bg-rose-500/20 text-rose-600" : "bg-blue-500/20 text-blue-600"}`}>
                  {req.status === "APPROVED" ? <CheckCircle2 size={16} /> : req.status === "REJECTED" ? <XCircle size={16} /> : <Clock size={16} />}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl mb-4">"{req.purpose}"</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-500">
                    {req.user?.name?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <span className="text-[11px] font-black text-slate-500">{req.user?.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={11} />
                  <span className="text-[10px] font-black">{new Date(req.startTime).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Calendar size={48} className="text-slate-400 mb-4" />
              <p className="text-lg font-black text-slate-600 dark:text-slate-400 tracking-tighter uppercase">Chưa có lịch mượn phòng</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
