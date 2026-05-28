import { prisma } from "@/utils/prisma";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import DeadlineTaskBoard from "@/components/DeadlineTaskBoard";
import CreateTaskForm from "@/components/CreateTaskForm";
import MeetingPoll from "@/components/MeetingPoll";
import { Calendar, CheckSquare, Clock, AlertTriangle, Users, ChevronRight, Zap, TrendingUp, Target, MapPin } from "lucide-react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

export const revalidate = 30; // Cache for 30s — fast navigation, fresh enough data

export default async function WorkspaceDashboard() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const dbUser = authUser ? await prisma.user.findUnique({ where: { id: authUser.id } }) : null;

  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);

  // Parallel data fetching for performance
  const [
    totalTasks, doingTasks, doneTasks, membersCount,
    allTasks, users, latestPoll, upcomingEvents
  ] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "DOING" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.user.count(),
    prisma.task.findMany({
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        assignees: { select: { id: true, name: true, avatarUrl: true } },
        checklists: { include: { items: { include: { assignees: true } } } },
        labels: true,
        activities: { include: { user: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
        watchers: { include: { user: { select: { name: true } } } },
      },
      orderBy: { order: "asc" }
    }),
    prisma.user.findMany({ select: { id: true, name: true, avatarUrl: true, role: true } }),
    prisma.poll.findFirst({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { votes: true }
    }),
    prisma.meetingEvent.findMany({
      where: { startTime: { gte: now, lte: weekEnd } },
      include: {
        createdBy: { select: { name: true, avatarUrl: true } },
        attendees: { include: { user: { select: { name: true, avatarUrl: true } } } }
      },
      orderBy: { startTime: "asc" },
      take: 5
    })
  ]);

  const overdueCount = allTasks.filter(t =>
    t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "DONE"
  ).length;
  const dueTodayCount = allTasks.filter(t =>
    t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "DONE"
  ).length;
  const todoTasks = totalTasks - doingTasks - doneTasks;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest mb-1">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Ban Truyền thông · {format(now, "EEEE, dd/MM/yyyy", { locale: vi })}
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Tổng quan Workspace</h1>
        </div>
        <CreateTaskForm />
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tổng việc",   value: totalTasks,      color: "text-slate-700",    bg: "bg-white/70",        border: "border-slate-200/60",    icon: CheckSquare, iconCls: "text-slate-400" },
          { label: "Đang làm",    value: doingTasks,      color: "text-blue-600",     bg: "bg-blue-50/80",      border: "border-blue-200/60",     icon: Clock,       iconCls: "text-blue-400" },
          { label: "Quá hạn",     value: overdueCount,    color: "text-rose-600",     bg: "bg-rose-50/80",      border: "border-rose-200/60",     icon: AlertTriangle, iconCls: "text-rose-400" },
          { label: "Hoàn thành",  value: `${completionRate}%`, color: "text-emerald-600", bg: "bg-emerald-50/80", border: "border-emerald-200/60", icon: Target,     iconCls: "text-emerald-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0`}>
                <Icon size={18} className={s.iconCls} />
              </div>
              <div>
                <p className={`text-2xl font-black ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Alert Banners ── */}
      {(overdueCount > 0 || dueTodayCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {overdueCount > 0 && (
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/20">
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-sm font-black">{overdueCount} công việc đã quá hạn – Cần xử lý ngay!</p>
              <Link href="/workspace/kanban" className="ml-auto text-[10px] font-black bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors whitespace-nowrap">
                Xem ngay
              </Link>
            </div>
          )}
          {dueTodayCount > 0 && (
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/20">
              <Clock size={16} className="shrink-0" />
              <p className="text-sm font-black">{dueTodayCount} việc đến hạn hôm nay</p>
              <Link href="/workspace/kanban" className="ml-auto text-[10px] font-black bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors whitespace-nowrap">
                Xử lý
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Main 2-column grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left: Priority Task Board (2/3) */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base uppercase tracking-tight">
              <span className="w-1.5 h-5 bg-rose-500 rounded-full" />
              <Zap size={16} className="text-rose-500" />
              Việc cần làm · Ưu tiên theo deadline
            </h2>
            <Link href="/workspace/kanban" className="text-blue-600 text-xs font-bold hover:underline px-3 py-1 bg-blue-50 rounded-full flex items-center gap-1">
              Kanban đầy đủ <ChevronRight size={12} />
            </Link>
          </div>
          
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-4 border border-white/80 dark:border-slate-800/60 shadow-md">
            <DeadlineTaskBoard tasks={allTasks} users={users} currentUser={dbUser || authUser} compact={false} />
          </div>
        </div>

        {/* Right sidebar (1/3) */}
        <div className="flex flex-col gap-5">
          
          {/* Upcoming Meetings */}
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-5 border border-white/80 dark:border-slate-800/60 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                Lịch họp sắp tới
              </h3>
              <Link href="/workspace/meetings" className="text-[10px] font-black text-blue-500 hover:underline">Xem tất cả</Link>
            </div>
            
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                <Calendar size={24} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Không có lịch họp</p>
                <Link href="/workspace/meetings" className="mt-2 text-[10px] text-blue-500 font-bold hover:underline">+ Tạo lịch họp</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingEvents.map(ev => {
                  const evDate = new Date(ev.startTime);
                  const isEvToday = isToday(evDate);
                  const isEvTomorrow = isTomorrow(evDate);
                  const dayLabel = isEvToday ? "Hôm nay" : isEvTomorrow ? "Ngày mai" : format(evDate, "dd/MM");
                  
                  return (
                    <div key={ev.id} className={`flex gap-3 p-3 rounded-2xl border ${isEvToday ? "bg-blue-50 border-blue-200" : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"}`}>
                      <div className={`shrink-0 w-10 text-center rounded-xl py-1 ${isEvToday ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"}`}>
                        <div className="text-[9px] font-black uppercase">{dayLabel}</div>
                        <div className="text-sm font-black">{format(evDate, "HH:mm")}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{ev.title}</p>
                        {ev.location && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={9} /> {ev.location}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {ev.attendees.length} người tham dự
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Team Stats */}
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-5 border border-white/80 dark:border-slate-800/60 shadow-md">
            <h3 className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={14} className="text-indigo-500" />
              Đội hình · {membersCount} thành viên
            </h3>
            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1">
                <span>Tiến độ hoàn thành</span>
                <span className="text-emerald-600">{completionRate}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2">
                <p className="text-base font-black text-slate-700 dark:text-slate-200">{todoTasks}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Chờ</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2">
                <p className="text-base font-black text-blue-600">{doingTasks}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Làm</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2">
                <p className="text-base font-black text-emerald-600">{doneTasks}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Xong</p>
              </div>
            </div>
          </div>

          {/* Poll */}
          {latestPoll && (
            <MeetingPoll poll={latestPoll} userId={authUser?.id || ""} allUsers={users} />
          )}
        </div>
      </div>
    </div>
  );
}
