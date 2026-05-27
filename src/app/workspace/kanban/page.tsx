import { prisma } from "@/utils/prisma";
import KanbanFullBoard from "@/components/KanbanFullBoard";
import { createClient } from "@/utils/supabase/server";
import CreateTaskForm from "@/components/CreateTaskForm";
import PoolReminderPanel from "@/components/kanban/PoolReminderPanel";
import { Pin } from "lucide-react";

export default async function KanbanPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const dbUser = authUser ? await prisma.user.findUnique({ where: { id: authUser.id } }) : null;

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignee: true,
        assignees: true,
        creator: true,
        checklists: { include: { items: true } },
        activities: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        labels: true,
        watchers: { include: { user: true } },
      },
      orderBy: { order: 'asc' }
    }),
    prisma.user.findMany()
  ]);

  const todoCount  = tasks.filter(t => t.status === 'TODO').length;
  const doingCount = tasks.filter(t => t.status === 'DOING').length;
  const doneCount  = tasks.filter(t => t.status === 'DONE').length;
  const overdueCount = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
  ).length;
  const poolCount = tasks.filter(t => t.isPoolItem && t.status !== 'DONE').length;

  return (
    <div className="flex flex-col h-full min-h-screen">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Kanban Board</p>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Chi Tiết Công Việc & Hoạt Động</h1>
        </div>
        <CreateTaskForm />
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { label: 'Cần làm',   value: todoCount,   color: 'text-slate-600',   bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'Đang làm',  value: doingCount,  color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Xong',      value: doneCount,   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Quá hạn',   value: overdueCount,color: 'text-rose-600',    bg: overdueCount > 0 ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-slate-50 dark:bg-slate-800' },
          { label: 'Pool',      value: poolCount,   color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shrink-0`}>
            <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ─── Two-column layout: Board + Pool sidebar ─── */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* Board — takes remaining width */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <KanbanFullBoard tasks={tasks} users={users} currentUser={dbUser || authUser} />
        </div>

        {/* Pool Reminder Sidebar — fixed width, hidden on small screens */}
        {poolCount > 0 && (
          <div className="hidden xl:flex flex-col w-72 shrink-0">
            <div className="sticky top-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-700/60 rounded-[1.75rem] p-4 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <Pin size={13} className="text-blue-500" /> Pool Nhắc Nhở
                </h3>
                <span className="text-[9px] font-black px-2 py-0.5 bg-blue-600 text-white rounded-full">{poolCount}</span>
              </div>
              <PoolReminderPanel tasks={tasks} compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
