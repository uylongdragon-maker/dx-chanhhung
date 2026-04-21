import { prisma } from "@/utils/prisma";
import KanbanBoard from "@/components/KanbanBoard";

export default async function KanbanPage() {
  // Fetch tasks and users from the database concurrently
  const [tasks, users] = await Promise.all([
    prisma.task.findMany({ include: { assignee: true } }),
    prisma.user.findMany()
  ]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Kanban Board</h2>
          <p className="text-on-surface-variant">Quản lý tiến độ dự án truyền thông</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-low glass-panel rounded-full px-6 py-2 flex items-center gap-2 text-on-surface font-medium hover:bg-surface-container transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Lọc
          </button>
        </div>
      </div>

      <KanbanBoard tasks={tasks} users={users} />
    </div>
  );
}
