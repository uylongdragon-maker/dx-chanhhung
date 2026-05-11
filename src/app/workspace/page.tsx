import { prisma } from "@/utils/prisma";
import Link from "next/link";
import CreateTaskForm from "@/components/CreateTaskForm";
import KanbanBoard from "@/components/KanbanBoard";
import MeetingPoll from "@/components/MeetingPoll";
import { createClient } from "@/utils/supabase/server";
import PoolReminderPanel from "@/components/kanban/PoolReminderPanel";


export default async function WorkspaceDashboard() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const [totalTasks, doingTasks, doneTasks, membersCount, allTasks, users, latestPoll] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "DOING" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.user.count(),
    prisma.task.findMany({
      include: {
        assignee: true,
        checklists: { include: { items: true } },
        activities: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        labels: true,
        watchers: { include: { user: true } },
      },
      orderBy: { order: "asc" }
    }),
    prisma.user.findMany(),
    prisma.poll.findFirst({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { votes: true }
    })
  ]);

  const todoTasks = totalTasks - doingTasks - doneTasks;
  const overdueCount = allTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
  ).length;

  return (
    <>
      {/* Header row */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest mb-1">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Pool Chung · Ban Truyền thông Chánh Hưng
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Tổng quan Workspace</h1>
        </div>
        <CreateTaskForm />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng việc',   value: totalTasks,   color: 'text-slate-700',  bg: 'bg-slate-100' },
          { label: 'Đang làm',    value: doingTasks,   color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Hoàn thành',  value: doneTasks,    color: 'text-emerald-600',bg: 'bg-emerald-50' },
          { label: 'Quá hạn',     value: overdueCount, color: 'text-rose-600',   bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex flex-col gap-1`}>
            <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Kanban - 2/3 */}
        <div className="flex-[2] flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full" />
              Bảng Điều Phối
            </h2>
            <Link href="/workspace/kanban" className="text-blue-600 text-xs font-bold hover:underline px-3 py-1 bg-blue-50 rounded-full">
              Xem toàn cảnh →
            </Link>
          </div>
          <div className="glass-panel rounded-[2.5rem] p-4 shadow-lg border border-white/80 bg-white/20">
            <KanbanBoard tasks={allTasks} users={users} currentUser={authUser} />
          </div>
        </div>

        {/* Right sidebar - 1/3 */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Pool Nhắc Nhở */}
          <div className="glass-panel rounded-[2rem] p-5 border border-white/80 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                📌 Pool Nhắc Nhở
              </h3>
              <Link href="/workspace/kanban" className="text-[10px] font-black text-blue-500 hover:underline">Xem tất cả</Link>
            </div>
            <PoolReminderPanel tasks={allTasks} compact />
          </div>

          {/* Biểu quyết */}
          <MeetingPoll poll={latestPoll} userId={authUser?.id || ""} allUsers={users} />
        </div>
      </div>

      {/* Publishing Bridge */}
      <div className="mt-10">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border-l-4 border-l-emerald-500 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              🚀
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Publishing Bridge</h3>
              <p className="text-xs text-slate-500">Sẵn sàng đẩy bài viết & Media qua Firebase</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Connected</span>
          </div>
        </div>
      </div>
    </>
  );
}
