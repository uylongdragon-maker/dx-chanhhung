import { prisma } from "@/utils/prisma";
import Link from "next/link";
import CreateTaskForm from "@/components/CreateTaskForm";
import AIChatBox from "@/components/AIChatBox";
import KanbanBoard from "@/components/KanbanBoard";

export default async function WorkspaceDashboard() {
  // Bơm dữ liệu từ Database theo yêu cầu định vị hệ thống
  const [totalTasks, doingTasks, membersCount, allTasks, users] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "DOING" } }),
    prisma.user.count(),
    prisma.task.findMany({ include: { assignee: true }, orderBy: { id: "desc" } }),
    prisma.user.findMany()
  ]);
  
  // Lấy tóm tắt từ cuộc họp gần nhất
  const latestMeeting = await prisma.meeting.findFirst({
    orderBy: { startTime: "desc" },
    where: { NOT: { summary: null } }
  });

  return (
    <>
      {/* Current Pool Banner & Quick Add */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-primary text-sm font-medium tracking-wide">
          <span className="material-symbols-outlined text-lg">group_work</span>
          <span>Pool Chung: Ban Truyền thông Chánh Hưng</span>
        </div>
        
        <CreateTaskForm />
      </div>

      {/* Stats and Meeting Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
         {/* Thống kê Tổng quan */}
          <div className="md:col-span-4 glass-panel rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden group border-t-4 border-primary shadow-lg h-full">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500"></div>
            <div className="flex justify-between items-start z-10">
              <h2 className="text-xl font-semibold text-on-surface">Tổng quan</h2>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-full">
                monitoring
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 z-10">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary">{totalTasks}</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Tổng việc</span>
              </div>
              <div className="flex flex-col border-l border-slate-200 pl-4">
                <span className="text-2xl font-bold text-amber-500">{doingTasks}</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Đang làm</span>
              </div>
              <div className="flex flex-col border-l border-slate-200 pl-4">
                <span className="text-2xl font-bold text-emerald-500">{membersCount}</span>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Đội ngũ</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 flex flex-col gap-3 shadow-md bg-gradient-to-br from-white to-blue-50/50 h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 uppercase tracking-widest text-slate-500">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
                Hợp Thông Minh (AI Summary)
              </h2>
              <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">
                 System Ready
              </span>
            </div>
            <div className="p-3 bg-white/40 rounded-2xl border border-white/60 shadow-inner flex-1">
               <p className="text-[13px] text-on-surface-variant line-clamp-3 leading-relaxed italic">
                "{latestMeeting?.summary || "Hiện chưa có tóm tắt cuộc họp mới nào. Hãy bắt đầu một cuộc họp Jitsi để AI ghi nhận dữ liệu."}"
              </p>
            </div>
          </div>
      </div>

      {/* Main Central Hub: Kanban + AI Chat */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* CỘT TRÁI: BẢNG KANBAN (Chiếm 2/3 chiều rộng) */}
        <div className="flex-[2] flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
               <span className="w-1.5 h-6 bg-primary rounded-full"></span>
               Bảng Điều Phối Luồng Việc
            </h3>
            <Link 
              href="/workspace/kanban" 
              className="text-primary text-xs font-bold hover:underline py-1 px-3 bg-primary/5 rounded-full"
            >
              Xem toàn cảnh →
            </Link>
          </div>
          <div className="glass-panel rounded-[2.5rem] p-4 shadow-xl border border-white/80 bg-white/20">
            <KanbanBoard tasks={allTasks} users={users} />
          </div>
        </div>

        {/* CỘT PHẢI: AI CHAT (Chiếm 1/3 chiều rộng) */}
        <div className="flex-1 flex flex-col gap-4">
           <div className="flex items-center px-2">
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Thảo luận AI</h3>
           </div>
           <AIChatBox />
        </div>
      </div>

      {/* Extra: Publishing Bridge Quick Status */}
      <div className="mt-12 flex flex-col gap-6">
        <div className="glass-panel rounded-3xl p-5 flex items-center justify-between border-l-8 border-l-[#10b981] shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981] shadow-inner">
              <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Publishing Bridge</h3>
              <p className="text-xs text-on-surface-variant font-medium">Sẵn sàng đẩy bài viết & Media qua Hệ sinh thái Firebase 🚀</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Connected</span>
          </div>
        </div>
      </div>
    </>
  );
}
