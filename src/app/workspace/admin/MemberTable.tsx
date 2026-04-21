"use client";

import { useTransition } from "react";
import { Mail, Trash2, ShieldCheck, Star, Loader2, KeyRound, ChevronRight, Hash, ShieldAlert } from "lucide-react";
import { deleteMember, updateMemberRole, changeUserPassword } from "@/app/actions/admin";

interface MemberTableProps {
  users: any[];
  currentAdminId: string;
}

export default function MemberTable({ users, currentAdminId }: MemberTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Xác nhận đổi quyền của thành viên này thành ${newRole}?`)) return;

    startTransition(async () => {
      const result = await updateMemberRole(currentAdminId, userId, newRole);
      if (!result.success) {
        alert("Lỗi khi cập nhật quyền: " + (result as any).message || "Đã có lỗi xảy ra");
      }
    });
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    const newPassword = prompt(`Nhập mật khẩu mới cho ${userName || "thành viên này"}:`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    startTransition(async () => {
      const result = await changeUserPassword(currentAdminId, userId, newPassword);
      if (result.success) {
        alert("Đã đổi mật khẩu thành công!");
      } else {
        alert("Lỗi: " + result.message);
      }
    });
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentAdminId) {
      alert("Bạn không thể tự xóa chính mình!");
      return;
    }

    if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa thành viên này khỏi hệ thống? Thao tác này không thể hoàn tác.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteMember(currentAdminId, userId);
      if (!result.success) {
        alert(result.message);
      }
    });
  };

  return (
    <div className="bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-8">
      {isPending && (
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/80 dark:bg-slate-800/80 p-6 rounded-[2rem] shadow-2xl border border-white dark:border-slate-700 flex items-center gap-4 animate-in zoom-in-95">
            <Loader2 className="animate-spin text-blue-600" size={28} />
            <span className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-widest">Đang thực thi lệnh Admin</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50">
              <th className="p-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Hồ sơ thành viên</th>
              <th className="p-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Liên lạc</th>
              <th className="p-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">Quyền hạn</th>
              <th className="p-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] text-right">Lệnh điều khiển</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all group">
                <td className="p-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shadow-xl text-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
                      u.role === "ADMIN" ? "bg-gradient-to-br from-amber-500 to-orange-400 shadow-amber-500/20" : "bg-gradient-to-br from-blue-600 to-indigo-500 shadow-blue-500/20"
                    }`}>
                      {u.name?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-800 dark:text-slate-100 text-base tracking-tight leading-tight flex items-center gap-2">
                        {u.name || "Offline Member"}
                        {u.id === currentAdminId && (
                           <span className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                             <Star size={8} className="fill-current" />
                             Cáp Chính
                           </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600">
                        <Hash size={10} />
                        <p className="text-[10px] font-bold tracking-tighter uppercase">{u.id.substring(0, 18)}...</p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-8">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 font-bold group-hover:text-blue-600 transition-colors">
                      <Mail size={16} className="opacity-50" />
                      <span className="text-xs tracking-tight">{u.email}</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-6">Verified Member</p>
                  </div>
                </td>
                <td className="p-8">
                  <div className="relative">
                    <select
                      value={u.role || ""}
                      disabled={u.id === currentAdminId}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className={`appearance-none px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all cursor-pointer shadow-sm ${
                        u.role === "ADMIN" 
                        ? "bg-amber-500 text-white border-amber-600" 
                        : u.role === "EDITOR"
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      } ${u.id === currentAdminId ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </td>
                <td className="p-8 text-right">
                  <div className="flex justify-end gap-3 translate-x-0 transition-all duration-500 opacity-100">
                    <button 
                      onClick={() => handleResetPassword(u.id, u.name)}
                      className="p-3 bg-white dark:bg-slate-800 hover:bg-amber-500 dark:hover:bg-amber-600 hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-90 flex items-center justify-center"
                      title="Đổi mật khẩu"
                    >
                      <KeyRound size={16} />
                    </button>
                    {u.id !== currentAdminId && (
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-3 bg-white dark:bg-slate-800 hover:bg-rose-500 dark:hover:bg-rose-600 hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-90 flex items-center justify-center"
                        title="Xóa thành viên"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent flex items-center justify-center gap-4 border-t border-slate-200/50 dark:border-slate-800/50">
           <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
               <ShieldCheck size={16} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Các lệnh Admin được bảo vệ bởi giao thức Supabase Auth Service Role.</p>
      </div>
    </div>
  );
}
