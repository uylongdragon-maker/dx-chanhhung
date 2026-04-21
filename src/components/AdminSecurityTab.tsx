"use client";

import { useState } from "react";
import { forceChangePassword, updateSystemKey } from "@/app/actions/admin";
import { ShieldAlert, Key, CheckCircle2, XCircle, Loader2, User, Mail, ChevronRight, Zap } from "lucide-react";

export default function AdminSecurityTab({ users, currentAdminId }: { users: any[], currentAdminId: string }) {
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, { type: "success" | "error" | "loading", msg: string }>>({});
  const [apiKey, setApiKey] = useState("");

  const handleResetPassword = async (targetId: string, userName: string) => {
    const newPass = passwords[targetId];
    if (!newPass || newPass.length < 6) {
      setStatus({ ...status, [targetId]: { type: "error", msg: "Mật khẩu phải từ 6 ký tự!" } });
      return;
    }

    setStatus({ ...status, [targetId]: { type: "loading", msg: "Đang xử lý..." } });
    const res = await forceChangePassword(currentAdminId, targetId, newPass);
    
    setStatus({ 
      ...status, 
      [targetId]: { type: res.success ? "success" : "error", msg: res.message } 
    });
    
    if (res.success) {
      setPasswords({ ...passwords, [targetId]: "" }); // Xóa trắng ô nhập sau khi xong
    }
  };

  return (
    <div className="flex flex-col gap-12 mt-16 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
      {/* 1. KHU VỰC ĐỔI MẬT KHẨU THÀNH VIÊN */}
      <div className="bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
        {/* Decorative background glow */}
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all duration-1000 group-hover:scale-125"></div>
        
        <div className="flex flex-col gap-2 mb-10 px-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Key size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Security Access</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase leading-none">
              Quản lý Mật khẩu Nòng cốt
            </h3>
        </div>
        
        <div className="grid grid-cols-1 gap-6 relative z-10">
          {users.map(user => (
            <div key={user.id} className="flex flex-col xl:flex-row xl:items-center justify-between p-8 bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/60 rounded-[2.5rem] gap-8 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all group/item shadow-sm">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center text-slate-600 dark:text-slate-400 text-sm font-black shadow-inner border border-white dark:border-slate-800">
                    {user.name?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  {status[user.id]?.type === "success" && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg border-2 border-white dark:border-slate-800 animate-bounce">
                        <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-lg tracking-tight leading-tight">{user.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Mail size={12} className="text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-bold tracking-tight">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 flex-1 xl:max-w-2xl">
                <div className="relative flex-1 w-full group/input">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-amber-500 transition-colors">
                        <Key size={16} />
                    </div>
                    <input 
                    type="text" 
                    placeholder="Mật khẩu thép mới..."
                    value={passwords[user.id] || ""}
                    onChange={(e) => setPasswords({ ...passwords, [user.id]: e.target.value })}
                    className="w-full pl-14 pr-8 py-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] focus:ring-8 focus:ring-amber-500/5 focus:border-amber-500 text-sm font-black text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-300"
                    />
                </div>
                <button 
                  onClick={() => handleResetPassword(user.id, user.name)}
                  className="w-full md:w-auto px-12 py-5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {status[user.id]?.type === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Reset"}
                  <ChevronRight size={14} />
                </button>
              </div>
              
              {/* Status Message Overlay-ish */}
              {status[user.id] && status[user.id].type !== "loading" && (
                <div className={`px-6 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-right-4 md:min-w-[180px] ${
                    status[user.id].type === "success" 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }`}>
                  {status[user.id].type === "success" ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                  {status[user.id].msg}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. DANGER ZONE: EMERGENCY API RESET */}
      <div className="bg-gradient-to-br from-red-600 to-rose-700 p-12 rounded-[4rem] shadow-[0_30px_60px_rgba(225,29,72,0.3)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
            <ShieldAlert size={180} className="text-white" />
        </div>

        <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest leading-none">
                     <ShieldAlert size={12} />
                     Emergency Port
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight">Cấu hình API<br/>Khẩn cấp</h3>
                  <p className="text-sm text-white/70 font-semibold italic max-w-sm">Chỉ sử dụng khi Neural Engine bị treo hoặc API Key cũ không còn hiệu lực.</p>
               </div>
               
               <div className="flex flex-col md:flex-row items-center gap-4 flex-1 max-w-2xl">
                <div className="relative w-full group/input">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-white transition-colors">
                        <Zap size={20} className="fill-current" />
                    </div>
                    <input 
                        type="password" 
                        placeholder="Dán AIzaSy... Master Key mới"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white/10 dark:bg-transparent border border-white/20 rounded-[2rem] focus:ring-8 focus:ring-white/10 focus:border-white outline-none text-sm text-white font-mono tracking-tighter placeholder:text-white/30"
                    />
                </div>
                <button 
                    onClick={async () => {
                    if(!apiKey) return;
                    const res = await updateSystemKey(currentAdminId, apiKey);
                    if(res.success) {
                        setApiKey("");
                        alert("Đã cập nhật MASTER API Key thành công!");
                    }
                    }}
                    className="w-full md:w-auto px-12 py-5 bg-white text-rose-600 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl hover:bg-rose-50 flex items-center justify-center gap-3"
                >
                    Update Key
                    <ChevronRight size={18} />
                </button>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
