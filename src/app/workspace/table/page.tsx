import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import CreateTaskForm from "@/components/CreateTaskForm";
import TablePageWrapper from "@/components/kanban/TablePageWrapper";

export default async function TablePage() {
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

  return (
    <div className="flex flex-col h-full min-h-screen animate-in fade-in duration-300">
      
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Workspace Overview</p>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Bảng Theo Dõi Công Việc</h1>
        </div>
        <CreateTaskForm />
      </div>

      {/* ─── Dedicated Spreadsheet View ─── */}
      <div className="flex-grow min-h-0">
        <TablePageWrapper tasks={tasks} users={users} currentUser={dbUser || authUser} />
      </div>
    </div>
  );
}
