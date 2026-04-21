"use client";

import { ShieldCheck, Users, Zap, Star } from "lucide-react";

export default function OrgChart({ users }: { users: any[] }) {
  const admins = users.filter((u) => u.role === "ADMIN");
  const members = users.filter((u) => u.role !== "ADMIN");

  return (
    <div className="bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 p-10 rounded-[3.5rem] mb-12 shadow-2xl animate-in fade-in zoom-in-95 duration-1000 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <Zap size={150} />
      </div>

      <div className="flex flex-col gap-2 mb-12 px-2">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Users size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Mô hình vận hành</span>
        </div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
          Sơ đồ Chiến thuật Nhân sự
        </h3>
      </div>
      
      <div className="flex flex-col items-center gap-16 relative mt-10">
        {/* Adimins Layer */}
        <div className="flex flex-wrap justify-center gap-8 relative z-10">
          {admins.map((admin) => (
            <div key={admin.id} className="relative group/card">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 rounded-[2rem] blur opacity-20 group-hover/card:opacity-40 transition duration-1000 group-hover/card:duration-200"></div>
              <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl px-10 py-6 rounded-[2rem] flex items-center gap-5 shadow-2xl border border-white dark:border-slate-800 group-hover/card:translate-y-[-4px] transition-all duration-500">
                <div className="relative">
                    <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl text-amber-600 shadow-inner">
                        <ShieldCheck size={32} />
                    </div>
                </div>
                <div>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight leading-tight">{admin.name || "System Admin"}</p>
                  <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                    <Star size={10} className="fill-current" />
                    Tổng Chỉ Huy
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Connectors */}
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 flex flex-col items-center w-full max-w-5xl opacity-30 pointer-events-none">
            <div className="w-px h-16 bg-gradient-to-b from-amber-500 to-blue-500" />
            <div className="w-[85%] h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
        </div>

        {/* Members Layer */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full mt-4">
          {members.map((member) => (
            <div 
              key={member.id} 
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/80 dark:border-slate-800 px-6 py-5 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center gap-4 hover:-translate-y-3 transition-all hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)] hover:bg-white/80 dark:hover:bg-slate-800/80 group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-xl transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-110 ${
                member.role === 'EDITOR' ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/20' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
              }`}>
                {member.name?.substring(0, 2).toUpperCase() || "??"}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">{member.name}</p>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
