import { prisma } from "@/utils/prisma";
import KanbanBoard from "@/components/KanbanBoard";
import { createClient } from "@/utils/supabase/server";

export default async function KanbanPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Fetch tasks and users from the database concurrently
  const [tasks, users] = await Promise.all([
    prisma.task.findMany({ 
      include: { 
        assignee: true,
        checklists: { include: { items: true } },
        activities: { include: { user: true }, orderBy: { createdAt: 'desc' } }
      },
      orderBy: { order: 'asc' }
    }),
    prisma.user.findMany()
  ]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter uppercase mb-2">Bảng Kanban Team</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Tiến độ dự án & Quản lý thẻ việc thông minh</p>
        </div>
      </div>

      <KanbanBoard tasks={tasks} users={users} currentUser={authUser} />
    </div>
  );
}
