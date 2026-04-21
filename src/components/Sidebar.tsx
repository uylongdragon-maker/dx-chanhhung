"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  BookOpen, 
  Video, 
  Image as ImageIcon, 
  MessageSquare, 
  Rocket, 
  Settings, 
  ShieldCheck, 
  LogOut
} from "lucide-react";

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN';

  const navLinks = [
    { href: "/workspace", icon: LayoutDashboard, title: "Tổng quan" },
    { href: "/workspace/kanban", icon: Kanban, title: "Công việc" },
    { href: "/workspace/team", icon: Users, title: "Đội hình" },
    { href: "/workspace/library", icon: BookOpen, title: "Thư viện" },
    { href: "/workspace/meetings", icon: Video, title: "Phòng họp" },
    { href: "/workspace/media", icon: ImageIcon, title: "Media Pool" },
    { href: "/workspace/chat", icon: MessageSquare, title: "Thảo luận" },
    { href: "/workspace/publish", icon: Rocket, title: "Xuất Bản" },
    { href: "/workspace/settings", icon: Settings, title: "Cài đặt" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex h-[calc(100vh-2rem)] w-24 fixed left-4 top-4 border border-white/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl flex-col items-center gap-8 py-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] z-50 transition-all duration-500 hover:w-28 group/sidebar">
        
        {/* Logo / Brand */}
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 group-hover/sidebar:rotate-12 transition-transform duration-500">
          <span className="font-black text-sm tracking-tighter">CH</span>
        </div>

        <div className="flex flex-col gap-5 w-full px-4 flex-grow overflow-y-auto scrollbar-hide py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group relative flex flex-col items-center justify-center"
              >
                <div
                  className={`relative w-12 h-12 flex justify-center items-center rounded-2xl transition-all duration-500 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-2xl shadow-blue-600/40 scale-110"
                      : "text-slate-400 dark:text-slate-600 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-900 shadow-none"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  
                  {/* Active Indicator Pin */}
                  {isActive && (
                    <div className="absolute -left-1 w-1.5 h-6 bg-white rounded-full group-hover/sidebar:left-0 transition-all"></div>
                  )}
                </div>
                
                {/* Tooltip on Expand */}
                <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none whitespace-nowrap z-[60]">
                    {link.title}
                </span>
              </Link>
            );
          })}

          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800 self-center my-2"></div>

          {/* Admin Area */}
          {isAdmin && (
            <Link
              href="/workspace/admin"
              className="group relative flex flex-col items-center justify-center"
            >
              <div
                className={`w-12 h-12 flex justify-center items-center rounded-2xl transition-all duration-500 ${
                  pathname === "/workspace/admin"
                    ? "bg-amber-500 text-white shadow-2xl shadow-amber-500/40 scale-110"
                    : "text-amber-500/40 hover:text-amber-500 hover:bg-amber-500/10"
                }`}
              >
                <ShieldCheck size={20} />
              </div>
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none whitespace-nowrap z-[60]">
                  Admin Gate
              </span>
            </Link>
          )}
        </div>

        {/* User & Logout */}
        <div className="mt-auto flex flex-col items-center gap-6">
          <div className="relative group/avatar">
            <img
              alt="User"
              className={`w-10 h-10 rounded-2xl border-4 ring-4 transition-all duration-500 object-cover ${
                isAdmin 
                ? "border-amber-500 ring-amber-500/10" 
                : "border-white dark:border-slate-800 ring-transparent"
              } group-hover/avatar:scale-110 group-hover/avatar:rounded-xl`}
              src={user?.avatarUrl || "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=6366f1&color=fff"}
            />
            {isAdmin && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></div>}
          </div>

          <form action={signOut}>
            <button 
              type="submit"
              className="w-10 h-10 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all active:scale-90"
            >
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - FIXED: Showing ALL links with horizontal scroll */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-20 bg-white/60 dark:bg-slate-950/60 backdrop-blur-3xl border border-white/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 px-4 overflow-hidden">
        <div className="flex items-center h-full gap-4 overflow-x-auto scrollbar-hide">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 ${
                  isActive ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-110" : "text-slate-400"
                }`}
              >
                <Icon size={20} />
              </Link>
            );
          })}
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>

          {isAdmin && (
            <Link
              href="/workspace/admin"
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 ${
                pathname === "/workspace/admin" ? "bg-amber-500 text-white shadow-xl" : "text-amber-500/40"
              }`}
            >
              <ShieldCheck size={20} />
            </Link>
          )}

          <form action={signOut} className="flex flex-shrink-0">
            <button type="submit" className="w-14 h-14 rounded-2xl text-slate-400 flex items-center justify-center">
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
