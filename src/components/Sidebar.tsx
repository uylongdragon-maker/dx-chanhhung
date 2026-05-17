"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { LayoutDashboard, Kanban, Users, BookOpen, Calendar, Image as ImageIcon, MessageSquare, Rocket, Settings, ShieldCheck, LogOut, Pin } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN';

  const navLinks = [
    { href: "/workspace",          icon: LayoutDashboard, title: "Tổng quan" },
    { href: "/workspace/kanban",   icon: Kanban,           title: "Công việc" },
    { href: "/workspace/team",     icon: Users,            title: "Đội hình" },
    { href: "/workspace/library",  icon: BookOpen,         title: "Thư viện" },
    { href: "/workspace/meetings", icon: Calendar,         title: "Lịch họp" },
    { href: "/workspace/media",    icon: ImageIcon,        title: "Media Pool" },
    { href: "/workspace/chat",     icon: MessageSquare,    title: "Phòng Chat" },
    { href: "/workspace/approval", icon: ShieldCheck,      title: "Duyệt Content" },
    { href: "/workspace/settings", icon: Settings,         title: "Cài đặt" },
  ];

  return (
    <nav className="hidden md:flex h-[calc(100vh-2rem)] w-64 shrink-0 m-4 border border-white/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl flex-col gap-6 py-6 px-4 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 shrink-0">
          <span className="font-black text-sm tracking-tighter">CH</span>
        </div>
        <div className="flex flex-col">
          <span className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Workspace</span>
          <span className="text-[10px] font-bold text-blue-600">Chánh Hưng</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full flex-grow overflow-y-auto scrollbar-hide py-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-900"}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              <span className={`text-sm font-black tracking-tight ${isActive ? "" : "group-hover:translate-x-1 transition-transform"}`}>{link.title}</span>
            </Link>
          );
        })}

        <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-2" />

        {isAdmin && (
          <Link href="/workspace/admin" className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${pathname === "/workspace/admin" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "text-amber-600 hover:bg-amber-50"}`}>
            <ShieldCheck size={20} className="shrink-0" />
            <span className={`text-sm font-black tracking-tight ${pathname === "/workspace/admin" ? "" : "group-hover:translate-x-1 transition-transform"}`}>Admin Gate</span>
          </Link>
        )}
      </div>

      {/* User & Logout */}
      <div className="mt-auto flex items-center gap-3 px-2 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="relative shrink-0">
          <img alt="User" className={`w-10 h-10 rounded-xl object-cover ${isAdmin ? "border-2 border-amber-500" : ""}`}
            src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=6366f1&color=fff`} />
          {isAdmin && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-950" />}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Thành viên'}</span>
          <span className="text-[10px] text-slate-400 font-bold truncate">{user?.role || 'MEMBER'}</span>
        </div>
        <NotificationCenter userId={user?.id || ""} />
        <form action={signOut}>
          <button type="submit" className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </nav>
  );
}
