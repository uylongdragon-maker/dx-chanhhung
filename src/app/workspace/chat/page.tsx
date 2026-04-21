import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageSquare, Zap, Users } from "lucide-react";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Lấy 50 tin nhắn gần nhất
  const messages = await prisma.message.findMany({
    take: 50,
    orderBy: { createdAt: "asc" },
    include: { sender: true },
    where: { poolId: "pool-cdsch" },
  });

  return (
    <div className="flex flex-col h-full relative max-w-5xl mx-auto w-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-4 tracking-tighter leading-none">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
              <MessageSquare size={30} />
            </div>
            Thảo Luận Chung
          </h2>
          <p className="text-slate-500 mt-3 font-medium italic text-lg ml-1 flex items-center gap-2">
            Không gian trao đổi tức thời & kết nối nòng cốt. <Zap size={16} className="text-amber-500" />
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 px-4 py-2 rounded-2xl shadow-sm">
            <Users size={16} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">11 Thành viên</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ChatWindow initialMessages={messages} currentUser={user} />
      </div>
    </div>
  );
}
