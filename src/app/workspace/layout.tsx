import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/utils/supabase/server";
import { syncUser } from "@/utils/sync-user";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // Kích hoạt đồng bộ hóa: Đảm bảo user này có trong PostgreSQL
  const currentUser = await syncUser(supabaseUser);

  return (
    <div className="bg-background text-on-surface h-screen w-screen overflow-hidden flex font-body">
      <Sidebar user={currentUser || supabaseUser} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-20 w-full h-full relative">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-5rem)] h-16 border-b border-white/20 dark:border-slate-800/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex justify-between items-center px-8 z-40 tonal-shift">
          {/* Leading */}
          <div className="flex items-center gap-4 cursor-pointer transition-all active:opacity-70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full p-2 -ml-2 text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined text-2xl">menu_open</span>
          </div>

          {/* Headline / Breadcrumb */}
          <div className="flex-1 flex items-center justify-center font-semibold text-lg tracking-tight">
            <span className="text-slate-500 dark:text-slate-400 text-sm mr-2 hidden sm:inline">
              Chào, {currentUser?.name || "Thành viên"}
            </span>
          </div>

          {/* Trailing */}
          <div className="flex items-center gap-4 text-blue-600 dark:text-blue-400">
            <button className="cursor-pointer transition-all active:opacity-70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full p-2 hidden sm:flex items-center gap-2">
              <span className="material-symbols-outlined">search</span>
              <span className="text-sm font-medium">Search</span>
            </button>
            <button className="cursor-pointer transition-all active:opacity-70 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full p-2 sm:hidden">
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Canvas — extra bottom padding on mobile for BottomNav */}
        <div className="flex-1 overflow-y-auto pt-24 pb-28 md:pb-8 px-4 sm:px-8 lg:px-12 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav user={currentUser || supabaseUser} />
    </div>
  );
}
