import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Users, ShieldCheck } from "lucide-react";
import MemberTable from "./MemberTable";
import OrgChart from "@/components/OrgChart";
import SystemSettings from "./SystemSettings";
import AdminSecurityTab from "@/components/AdminSecurityTab";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  if (!supabaseUser) return redirect("/login");

  // 1. Kiểm tra quyền Admin tối cao
  const currentUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id }
  });

  if (currentUser?.role !== "ADMIN") {
    return redirect("/workspace"); // Không phải Admin thì mời ra ngoài
  }

  // 2. Lấy danh sách toàn bộ 11 thành viên
  const allUsers = await prisma.user.findMany({
    orderBy: { name: "asc" }
  });

  // 3. Lấy cấu hình hệ thống (Gemini Key)
  const geminiConfig = await prisma.systemConfig.findUnique({
    where: { key: "GEMINI_API_KEY" }
  });

  // Tính toán thống kê
  const totalUsers = allUsers.length;
  const adminCount = allUsers.filter(u => u.role === "ADMIN").length;
  const editorCount = allUsers.filter(u => u.role === "EDITOR").length;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tighter">
            <ShieldCheck className="text-amber-500" size={32} /> 
            Quản trị Hệ thống
          </h2>
          <p className="text-slate-500 mt-1 font-medium italic">Khu vực điều hành nòng cốt cho 11 chiến hữu.</p>
        </div>
      </div>

      {/* Sơ đồ Chiến thuật - Visual Hierarchy */}
      <OrgChart users={allUsers} />

      {/* Bảng danh sách thành viên - Client Component */}
      <MemberTable users={allUsers} currentAdminId={currentUser.id} />

      {/* 3. KHU VỰC CÀI ĐẶT HỆ THỐNG - Client Component */}
      <SystemSettings 
        currentGeminiKey={geminiConfig?.value || process.env.GEMINI_API_KEY || ""} 
        adminId={currentUser.id}
      />

      {/* Khối thống kê nhanh - Cuối trang */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2.5rem] flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
            <Users size={32} />
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Thành viên</p>
            <p className="text-slate-800 dark:text-slate-100 font-black text-3xl tracking-tighter">{totalUsers} / 11</p>
          </div>
        </div>

        <div className="p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2.5rem] flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Quản trị viên</p>
            <p className="text-slate-800 dark:text-slate-100 font-black text-3xl tracking-tighter">{adminCount}</p>
          </div>
        </div>

        <div className="p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2.5rem] flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Users size={32} />
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Biên tập viên</p>
            <p className="text-slate-800 dark:text-slate-100 font-black text-3xl tracking-tighter">{editorCount}</p>
          </div>
        </div>
      </div>

      {/* 4. TAB BẢO MẬT & RESET MẬT KHẨU (GOD MODE) */}
      <AdminSecurityTab users={allUsers} currentAdminId={currentUser.id} />
    </div>
  );
}
