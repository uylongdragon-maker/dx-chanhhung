import { prisma } from "@/utils/prisma";
import { Users, Mail, Award, Globe } from "lucide-react";

export default async function TeamRosterPage() {
  // Lấy danh sách user, NHƯNG LỌC BỎ ADMIN để bảo mật và tập trung vào đội hình vinh danh
  const teamMembers = await prisma.user.findMany({
    where: { 
      role: { 
        not: "ADMIN" 
      } 
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-4 tracking-tighter">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
              <Users size={32} />
            </div>
            Đội hình Nòng cốt
          </h2>
          <p className="text-slate-500 mt-2 font-medium italic text-lg">
            11 chiến hữu tiên phong trong công cuộc Chuyển đổi số Ban Truyền thông Chánh Hưng.
          </p>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {teamMembers.map((member) => (
          <div 
            key={member.id} 
            className="group bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 p-8 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all hover:-translate-y-2 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Decorative background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
            
            {/* Avatar Block */}
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-[30%] bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-500/30 group-hover:rotate-6 transition-transform duration-500">
                    {member.name?.substring(0, 2).toUpperCase() || "??"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-slate-800 rounded-full border-4 border-blue-50 flex items-center justify-center text-blue-600 shadow-lg">
                    <Globe size={14} className="animate-spin-slow" />
                </div>
            </div>

            {/* Info Block */}
            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
                {member.name}
            </h4>
            
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-mono mb-6">
                <Mail size={12} />
                <span>{member.email}</span>
            </div>

            {/* Role Badge */}
            <div className="flex flex-col items-center gap-3 w-full">
                <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                    member.role === "EDITOR" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20" 
                    : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/5 dark:text-blue-400 dark:border-blue-500/20"
                }`}>
                    {member.role === "EDITOR" ? "Biên tập viên" : "Thành viên"}
                </span>
                
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                    <Award size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nòng cốt Chánh Hưng</span>
                </div>
            </div>
          </div>
        ))}

        {/* Empty State / Slots */}
        {Array.from({ length: Math.max(0, 4 - teamMembers.length) }).map((_, i) => (
          <div 
            key={`placeholder-${i}`}
            className="border-4 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[3rem] p-8 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 opacity-50"
          >
            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Users size={24} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest leading-none">Slot trống</p>
          </div>
        ))}
      </div>
    </div>
  );
}
