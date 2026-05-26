"use client";

import { useState, useTransition } from "react";
import { Calendar, Clock, MapPin, Plus, Check, X, Loader2, Info, User, Video, VideoOff, AlertCircle } from "lucide-react";
import { bookMeetingRoom, manualApprove } from "@/app/actions/meeting";
import toast from "react-hot-toast";

interface MeetingRequest {
  id: string;
  roomName: string; // Will store "Title (Location)"
  purpose: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  requestedBy: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface Props {
  requests: MeetingRequest[];
  currentUser: any;
  isAdmin: boolean;
}

export default function MeetingDashboardClient({ requests, currentUser, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");

  const [formData, setFormData] = useState({
    title: "",
    location: "Trực tuyến (Google Meet)",
    purpose: "",
    startTime: "",
    endTime: "",
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.purpose || !formData.startTime || !formData.endTime) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (end <= start) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu!");
      return;
    }

    startTransition(async () => {
      const roomNameMerged = `${formData.title.trim()} (${formData.location.trim()})`;
      const res = await bookMeetingRoom(
        currentUser.id,
        roomNameMerged,
        formData.purpose.trim(),
        start,
        end
      );
      if (res.success) {
        toast.success("Đăng ký lịch họp thành công! Chờ Admin duyệt.");
        setFormData({
          title: "",
          location: "Trực tuyến (Google Meet)",
          purpose: "",
          startTime: "",
          endTime: "",
        });
        setModalOpen(false);
      } else {
        toast.error(res.error || "Gặp lỗi khi đăng ký lịch họp");
      }
    });
  };

  const handleApproveStatus = (id: string, status: "APPROVED" | "REJECTED") => {
    startTransition(async () => {
      const res = await manualApprove(id, status);
      if (res.success) {
        toast.success(status === "APPROVED" ? "Đã duyệt lịch họp!" : "Đã từ chối lịch họp!");
      } else {
        toast.error("Không thể cập nhật trạng thái lịch họp");
      }
    });
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  const getStatusBadge = (status: string, start: Date | string, end: Date | string) => {
    if (status === "PENDING") {
      return (
        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10">
          Chờ duyệt
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10">
          Đã từ chối
        </span>
      );
    }

    const now = new Date();
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (now < startTime) {
      return (
        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
          Sắp diễn ra
        </span>
      );
    } else if (now > endTime) {
      return (
        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/10">
          Đã kết thúc
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse">
          Đang họp
        </span>
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Filters Grid */}
        <div className="flex bg-slate-100/50 dark:bg-slate-900/40 p-1 rounded-2xl border border-slate-200/20 backdrop-blur-md">
          {[
            { v: "ALL", l: "Tất cả" },
            { v: "APPROVED", l: "Đã duyệt" },
            { v: "PENDING", l: "Chờ duyệt" },
            { v: "REJECTED", l: "Từ chối" },
          ].map((tab) => (
            <button
              key={tab.v}
              onClick={() => setFilter(tab.v as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all uppercase ${
                filter === tab.v
                  ? "bg-[#7360f2] text-white shadow-md shadow-[#7360f2]/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
              }`}
            >
              {tab.l}
            </button>
          ))}
        </div>

        {/* Register Button */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-[#7360f2] hover:bg-[#5f4de0] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#7360f2]/10 w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Đăng ký lịch họp
        </button>
      </div>

      {/* Meetings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => {
            const isOnline = req.roomName.toLowerCase().includes("online") || req.roomName.toLowerCase().includes("trực tuyến");
            // Extract title and location from merged roomName e.g., "Title (Location)"
            const nameMatch = req.roomName.match(/^(.*?)\s*\((.*?)\)$/);
            const title = nameMatch ? nameMatch[1] : req.roomName;
            const location = nameMatch ? nameMatch[2] : "Không xác định";

            return (
              <div
                key={req.id}
                className="bg-white/40 dark:bg-slate-900/20 backdrop-blur-2xl border border-white/20 dark:border-slate-800/10 p-5 rounded-[2rem] flex flex-col gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(115,96,242,0.06)] transition-all group duration-300 relative overflow-hidden"
              >
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7360f2]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#7360f2]/10 transition-colors" />

                {/* Card Header */}
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOnline ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                      {isOnline ? <Video size={16} /> : <VideoOff size={16} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Lịch họp</span>
                      <span className="text-[9px] font-bold text-slate-500 truncate max-w-[130px] mt-1">{location}</span>
                    </div>
                  </div>
                  {getStatusBadge(req.status, req.startTime, req.endTime)}
                </div>

                {/* Title & Purpose */}
                <div className="flex-1 flex flex-col gap-2 z-10">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight line-clamp-2 uppercase group-hover:text-[#7360f2] transition-colors">
                    {title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic bg-slate-50/50 dark:bg-slate-800/40 px-3.5 py-2.5 rounded-2xl">
                    "{req.purpose}"
                  </p>
                </div>

                {/* Time & Duration */}
                <div className="flex flex-col gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider z-10">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-[#7360f2]" />
                    <span>{new Date(req.startTime).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-[#7360f2]" />
                    <span>
                      {new Date(req.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} -{" "}
                      {new Date(req.endTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-slate-800/60 w-full" />

                {/* Footer / Meta & Admin Actions */}
                <div className="flex justify-between items-center z-10">
                  {/* User Profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black text-[#7360f2]">
                      {req.user?.avatarUrl ? (
                        <img src={req.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        req.user?.name?.substring(0, 2).toUpperCase() || "??"
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{req.user?.name || "Thành viên"}</span>
                  </div>

                  {/* Actions for Admin */}
                  {isAdmin && req.status === "PENDING" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApproveStatus(req.id, "APPROVED")}
                        disabled={isPending}
                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 active:scale-90 transition-all"
                        title="Duyệt lịch họp"
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => handleApproveStatus(req.id, "REJECTED")}
                        disabled={isPending}
                        className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:scale-90 transition-all"
                        title="Từ chối"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white/20 dark:bg-slate-900/10 rounded-[2.5rem] border border-white/10 dark:border-slate-800/10 backdrop-blur-md">
            <AlertCircle size={40} className="text-slate-400 mb-3" />
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Không tìm thấy lịch họp nào
            </p>
          </div>
        )}
      </div>

      {/* Simplified Registration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl p-6 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] font-black text-[#7360f2] uppercase tracking-[0.2em] block">Schedules</span>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Đăng ký lịch họp</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Info Banner */}
            <div className="p-3 bg-[#7360f2]/5 rounded-xl border border-[#7360f2]/10 flex gap-2">
              <Info size={14} className="text-[#7360f2] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#7360f2] font-black leading-normal uppercase tracking-wide">
                Lịch họp đăng ký sẽ được hiển thị sau khi được quản trị viên duyệt.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* Meeting Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề cuộc họp</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Họp Chi đoàn KP29 hàng tháng..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="px-4 py-3 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/20 focus:outline-none focus:ring-2 focus:ring-[#7360f2]/20"
                />
              </div>

              {/* Location/Type */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hình thức & Địa điểm</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="px-4 py-3 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/20 focus:outline-none focus:ring-2 focus:ring-[#7360f2]/20"
                >
                  <option value="Trực tuyến (Google Meet)">💻 Trực tuyến (Google Meet)</option>
                  <option value="Trực tuyến (Zoom)">📹 Trực tuyến (Zoom)</option>
                  <option value="Trực tiếp tại Văn phòng">🏢 Trực tiếp tại Văn phòng</option>
                  <option value="Trực tiếp tại Nhà Văn Hóa">🏛️ Trực tiếp tại Nhà Văn Hóa</option>
                  <option value="Hình thức khác">⚙️ Hình thức khác / Bên ngoài</option>
                </select>
              </div>

              {/* Purpose */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mục đích & Nội dung chính</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mô tả tóm tắt nội dung cuộc họp..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="px-4 py-3 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/20 focus:outline-none focus:ring-2 focus:ring-[#7360f2]/20 resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bắt đầu</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="px-3 py-2.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/20 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kết thúc</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="px-3 py-2.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 bg-[#7360f2] hover:bg-[#5f4de0] disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-[#7360f2]/10 flex items-center justify-center gap-2 transition-all active:scale-95 mt-2"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Gửi yêu cầu duyệt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
