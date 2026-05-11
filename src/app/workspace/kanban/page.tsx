import { prisma } from "@/utils/prisma";
import KanbanBoard from "@/components/KanbanBoard";
import { createClient } from "@/utils/supabase/server";
import CreateTaskForm from "@/components/CreateTaskForm";

export default async function KanbanPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      include: {
        assignee: true,
        checklists: { include: { items: true } },
        activities: { include: { user: true }, orderBy: { createdAt: 'desc' } },
        labels: true,
        watchers: { include: { user: true } },
      },
      orderBy: { order: 'asc' }
    }),
    prisma.user.findMany()
  ]);

  const totalTasks = tasks.length;
  const doingTasks = tasks.filter(t => t.status === 'DOING').length;
  const doneTasks  = tasks.filter(t => t.status === 'DONE').length;
  const overdue    = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length;
  const poolPinned = tasks.filter(t => t.isPoolItem && t.status !== 'DONE').length;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Bảng Kanban</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Quản lý & điều phối luồng công việc</p>
        </div>
        <CreateTaskForm />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Tổng',        value: totalTasks,  color: 'text-slate-700',   bg: 'bg-slate-100/80' },
          { label: 'Đang làm',    value: doingTasks,  color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Hoàn thành',  value: doneTasks,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Quá hạn',     value: overdue,     color: 'text-rose-600',    bg: 'bg-rose-50' },
          { label: 'Pool',        value: poolPinned,  color: 'text-indigo-600',  bg: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 flex flex-col gap-0.5`}>
            <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
          </div>
        ))}
      </div>

      <KanbanBoard tasks={tasks} users={users} currentUser={authUser} />
    </div>
  );
}
