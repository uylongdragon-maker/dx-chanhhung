import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import NotificationCenter from "@/components/NotificationCenter";
import { createClient } from "@/utils/supabase/server";
import { syncUser } from "@/utils/sync-user";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) return redirect("/login");

  // Kích hoạt đồng bộ hóa: Đảm bảo user này có trong PostgreSQL
  const currentUser = await syncUser(supabaseUser);

  if (currentUser && currentUser.status === "PENDING") {
    await supabase.auth.signOut();
    return redirect("/login?error=Tài khoản của bạn đang chờ Admin phê duyệt!");
  }

  if (currentUser && currentUser.status === "REJECTED") {
    await supabase.auth.signOut();
    return redirect("/login?error=Tài khoản của bạn đã bị từ chối phê duyệt.");
  }

  return (
    // 1. VỎ BAO NGOÀI CÙNG: Khóa cứng chiều cao bằng màn hình
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* 2. SIDEBAR DESKTOP */}
      <Sidebar user={currentUser || supabaseUser} />

      {/* 3. KHU VỰC NỘI DUNG CHÍNH (MAIN) */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* MOBILE HEADER - Top Nav for Notification Bell */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/60 sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
              <span className="font-black text-[10px] tracking-tighter">CH</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-tight leading-none">Workspace</span>
              <span className="text-[9px] font-bold text-blue-600">Chánh Hưng</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter userId={currentUser?.id || supabaseUser.id} />
          </div>
        </header>

        {/* Thêm pb-24 để chừa không gian ở đáy cho BottomNav không đè lên text */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* 4. BOTTOM NAV: Component này đã tự có lệnh 'md:hidden' bên trong để ẩn trên PC */}
      <BottomNav user={currentUser || supabaseUser} />
      
    </div>
  );
}
