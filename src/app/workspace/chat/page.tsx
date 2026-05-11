import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageSquare, Zap, Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return redirect("/login");

  // Lấy Prisma user đầy đủ (có name, avatarUrl)
  const currentUser = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  if (!currentUser) return redirect("/login");

  const messages = await prisma.message.findMany({
    take: 50,
    orderBy: { createdAt: "asc" },
    include: { sender: true },
    where: { poolId: "pool-cdsch" },
  });

  return (
    <div className="flex flex-col h-full relative max-w-5xl mx-auto w-full gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tighter">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
              <MessageSquare size={22} />
            </div>
            Thảo Luận Chung
          </h1>
          <p className="text-slate-500 mt-2 font-medium italic text-sm ml-1 flex items-center gap-2">
            Không gian trao đổi tức thời & kết nối nòng cốt. <Zap size={14} className="text-amber-500" />
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 px-4 py-2 rounded-2xl shadow-sm">
          <Users size={16} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pool · Chánh Hưng</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {/* Pass currentUser đầy đủ (Prisma User có name) */}
        <ChatWindow initialMessages={messages} currentUser={currentUser} />
      </div>
    </div>
  );
}
