import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
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
      {/* Thêm pb-24 để chừa không gian ở đáy cho BottomNav không đè lên text */}
      <main className="flex-1 h-full overflow-y-auto pb-24 md:pb-8 p-4 md:p-8">
        {children}
      </main>

      {/* 4. BOTTOM NAV: Component này đã tự có lệnh 'md:hidden' bên trong để ẩn trên PC */}
      <BottomNav user={currentUser || supabaseUser} />
      
    </div>
  );
}
