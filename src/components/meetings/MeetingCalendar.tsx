"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, Users, X, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { createMeetingEvent, registerForMeetingEvent, unregisterFromMeetingEvent } from "@/app/actions/meeting-events";
import toast from "react-hot-toast";

const EVENT_COLORS = [
  { value: "#3b82f6", label: "Xanh dương" },
  { value: "#10b981", label: "Xanh lá" },
  { value: "#f59e0b", label: "Vàng" },
  { value: "#ef4444", label: "Đỏ" },
  { value: "#8b5cf6", label: "Tím" },
  { value: "#ec4899", label: "Hồng" },
];

interface MeetingEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  color: string;
  attendees: { user: { name: string | null; avatarUrl: string | null } }[];
  createdBy: { name: string | null; avatarUrl: string | null };
}

interface Props {
  initialEvents: MeetingEvent[];
  currentUser: any;
  poolId: string;
}

export default function MeetingCalendar({ initialEvents, currentUser, poolId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<MeetingEvent[]>(initialEvents);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MeetingEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formColor, setFormColor] = useState("#3b82f6");
  const [formMax, setFormMax] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events.filter(ev => isSameDay(new Date(ev.startTime), day));

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const openCreateForDay = (day: Date) => {
    const base = format(day, "yyyy-MM-dd");
    setFormStart(`${base}T09:00`);
    setFormEnd(`${base}T10:00`);
    setSelectedDay(day);
    setShowCreateForm(true);
    setSelectedEvent(null);
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formStart || !formEnd) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    startTransition(async () => {
      const res = await createMeetingEvent(
        formTitle, formDesc, formLocation,
        formStart, formEnd, formColor, formMax,
        currentUser.id
      );
      if (res.success) {
        toast.success("Đã tạo lịch họp! 📅");
        setShowCreateForm(false);
        setFormTitle(""); setFormDesc(""); setFormLocation(""); setFormMax("");
        // Optimistic update (re-fetch will happen via revalidate)
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  };

  const isAttending = (ev: MeetingEvent) =>
    ev.attendees.some((a: any) => a.userId === currentUser.id || a.user?.id === currentUser.id);

  const handleRegister = (ev: MeetingEvent) => {
    const attending = isAttending(ev);
    startTransition(async () => {
      const res = attending
        ? await unregisterFromMeetingEvent(ev.id, currentUser.id)
        : await registerForMeetingEvent(ev.id, currentUser.id);
      if (res.success) toast.success(attending ? "Đã huỷ đăng ký" : "Đã đăng ký tham dự! 🎉");
      else toast.error("Có lỗi xảy ra");
    });
  };

  const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="flex flex-col gap-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: vi })}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight size={18} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setSelectedEvent(null); setSelectedDay(new Date()); const b = format(new Date(), "yyyy-MM-dd"); setFormStart(`${b}T09:00`); setFormEnd(`${b}T10:00`); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Plus size={14} /> Tạo lịch họp
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-white/80 dark:border-slate-800/60 shadow-md overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const inMonth = isSameMonth(day, currentDate);
            const todayDay = isToday(day);
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <div
                key={idx}
                onClick={() => openCreateForDay(day)}
                className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-b border-r border-slate-100/60 dark:border-slate-800/40 cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10 relative
                  ${!inMonth ? "opacity-30" : ""}
                  ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                `}
              >
                <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  todayDay ? "bg-blue-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400"
                }`}>
                  {format(day, "d")}
                </span>

                {/* Events on this day */}
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 2).map(ev => (
                    <button
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); setSelectedEvent(ev); setShowCreateForm(false); }}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[9px] font-black text-white truncate hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: ev.color }}
                    >
                      {format(new Date(ev.startTime), "HH:mm")} {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] font-black text-slate-400 pl-1">+{dayEvents.length - 2} nữa</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events list */}
      <div>
        <h3 className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
          <Calendar size={14} className="text-blue-500" />
          Sự kiện sắp tới
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {events
            .filter(ev => new Date(ev.endTime) >= new Date())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 6)
            .map(ev => (
              <button
                key={ev.id}
                onClick={() => { setSelectedEvent(ev); setShowCreateForm(false); }}
                className="text-left p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-800/60 rounded-2xl hover:shadow-md transition-all flex gap-3 group"
              >
                <div className="w-1.5 rounded-full shrink-0 self-stretch" style={{ backgroundColor: ev.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{ev.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock size={9} />
                    {format(new Date(ev.startTime), "dd/MM · HH:mm", { locale: vi })}
                  </p>
                  {ev.location && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={9} /> {ev.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] font-black text-slate-400 flex items-center gap-1">
                      <Users size={9} /> {ev.attendees.length} tham dự
                    </span>
                  </div>
                </div>
              </button>
            ))}
          {events.filter(ev => new Date(ev.endTime) >= new Date()).length === 0 && (
            <div className="col-span-full flex flex-col items-center py-8 text-center opacity-50">
              <Calendar size={32} className="text-slate-300 mb-2" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chưa có sự kiện nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Event detail panel */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div
            className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-[2.5rem] shadow-2xl p-6 border border-white/20 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: selectedEvent.color + "20" }}>
                  <Calendar size={18} style={{ color: selectedEvent.color }} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100">{selectedEvent.title}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {format(new Date(selectedEvent.startTime), "EEEE, dd/MM/yyyy · HH:mm", { locale: vi })} – {format(new Date(selectedEvent.endTime), "HH:mm")}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {selectedEvent.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4">{selectedEvent.description}</p>
            )}

            {selectedEvent.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                <MapPin size={14} className="text-blue-500" />
                {selectedEvent.location}
              </div>
            )}

            <div className="mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {selectedEvent.attendees.length} người tham dự
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.attendees.slice(0, 6).map((a, i) => (
                  <div key={i} className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-black">
                    {a.user.name?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                ))}
                {selectedEvent.attendees.length > 6 && (
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-black">
                    +{selectedEvent.attendees.length - 6}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleRegister(selectedEvent)}
              disabled={isPending}
              className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isAttending(selectedEvent)
                  ? "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                  : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              }`}
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              {isAttending(selectedEvent) ? "Huỷ tham dự" : "Đăng ký tham dự"}
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateForm(false)}>
          <div
            className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Plus size={18} className="text-blue-500" />
                  Tạo lịch họp mới
                </h3>
                <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tiêu đề *</label>
                  <input
                    value={formTitle} onChange={e => setFormTitle(e.target.value)}
                    placeholder="VD: Họp tổng kết tháng 5..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Bắt đầu *</label>
                    <input type="datetime-local" value={formStart} onChange={e => setFormStart(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Kết thúc *</label>
                    <input type="datetime-local" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Địa điểm / Link</label>
                  <input value={formLocation} onChange={e => setFormLocation(e.target.value)}
                    placeholder="VD: Phòng họp A / meet.google.com/..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Ghi chú</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2}
                    placeholder="Nội dung cuộc họp..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Màu sự kiện</label>
                  <div className="flex gap-2 flex-wrap">
                    {EVENT_COLORS.map(c => (
                      <button key={c.value} onClick={() => setFormColor(c.value)}
                        className={`w-8 h-8 rounded-xl transition-all ${formColor === c.value ? "scale-125 ring-2 ring-offset-2 ring-slate-400" : "hover:scale-110"}`}
                        style={{ backgroundColor: c.value }} title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowCreateForm(false)} className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-sm hover:bg-slate-200 transition-colors">
                    Huỷ
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isPending || !formTitle.trim()}
                    className="py-3 rounded-xl bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Tạo lịch họp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
