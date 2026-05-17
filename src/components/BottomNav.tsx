'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from "@/app/login/actions"
import { 
  LayoutDashboard, 
  Kanban, 
  MessageSquare, 
  Calendar, 
  Settings, 
  Menu, 
  X, 
  Users, 
  BookOpen, 
  Image as ImageIcon, 
  ShieldCheck, 
  LogOut, 
  Award,
  ChevronRight
} from 'lucide-react'

export default function BottomNav({ user }: { user: any }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  // Bottom primary navigation items (4 + 1 Menu trigger)
  const primaryItems = [
    { href: '/workspace',          icon: LayoutDashboard, label: 'Tổng quan' },
    { href: '/workspace/kanban',   icon: Kanban,           label: 'Công việc' },
    { href: '/workspace/chat',     icon: MessageSquare,    label: 'Chat' },
    { href: '/workspace/meetings', icon: Calendar,         label: 'Lịch họp' },
  ];

  // Drawer menu items (Remaining routes)
  const drawerItems = [
    { href: '/workspace/team',     icon: Users,            label: 'Đội hình', color: 'text-blue-500 bg-blue-500/10' },
    { href: '/workspace/library',  icon: BookOpen,         label: 'Thư viện', color: 'text-emerald-500 bg-emerald-500/10' },
    { href: '/workspace/media',    icon: ImageIcon,        label: 'Media Pool', color: 'text-purple-500 bg-purple-500/10' },
    { href: '/workspace/approval', icon: ShieldCheck,      label: 'Duyệt Content', color: 'text-rose-500 bg-rose-500/10' },
    { href: '/workspace/settings', icon: Settings,         label: 'Cài đặt', color: 'text-slate-500 bg-slate-500/10' },
  ];

  return (
    <>
      {/* 1. BACKDROP OVERLAY FOR SLIDE MENU */}
      {menuOpen && (
        <div 
          onClick={() => setMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40 animate-in fade-in duration-300"
        />
      )}

      {/* 2. PREMIUM SLIDE-UP GLASSMORPHIC DRAWER MENU */}
      <div 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) pb-24 ${
          menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        {/* Drawer Puller Tab Accent */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full mx-auto my-4 shrink-0" />

        <div className="px-6 space-y-6 max-h-[70vh] overflow-y-auto pb-6">
          {/* User Profile Summary Card */}
          <div className="flex items-center gap-4 p-5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/20 dark:border-slate-800/20 rounded-3xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
            <div className="relative shrink-0">
              <img 
                alt="User" 
                className={`w-12 h-12 rounded-2xl object-cover ${isAdmin ? 'border-2 border-amber-500' : ''}`}
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=3b82f6&color=fff`} 
              />
              {isAdmin && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-950" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm truncate leading-tight flex items-center gap-1.5">
                {user?.name || 'Thành viên'}
                {user?.unit && (
                  <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-blue-500/10">
                    {user.unit}
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                {user?.role || 'MEMBER'}
              </p>
            </div>
          </div>

          {/* Quick Menu Grid */}
          <div className="grid grid-cols-2 gap-4">
            {drawerItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 active:scale-95 ${
                    isActive 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-white/20 text-white' : item.color}`}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-xs font-black tracking-tight uppercase text-ellipsis overflow-hidden whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Admin gate inside drawer */}
          {isAdmin && (
            <Link 
              href="/workspace/admin"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 active:scale-98 ${
                pathname === '/workspace/admin'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-amber-500/5 dark:bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 text-amber-600 dark:text-amber-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="shrink-0" />
                <span className="text-xs font-black tracking-widest uppercase">Admin Gate</span>
              </div>
              <ChevronRight size={16} />
            </Link>
          )}

          {/* Logout Action Inside Menu */}
          <form action={signOut} className="pt-2">
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 p-5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm shadow-rose-500/5"
            >
              <LogOut size={16} />
              ĐĂNG XUẤT HỆ THỐNG
            </button>
          </form>
        </div>
      </div>

      {/* 3. CORE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-t border-slate-200/50 dark:border-slate-800/60 shadow-[0_-20px_60px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex justify-around items-center px-2 pt-2 pb-3 relative">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href && !menuOpen;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1 flex-1 py-1 active:scale-90 transition-transform duration-150 min-w-0"
                >
                  <div className={`relative flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : ''}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} className={`transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest transition-all duration-300 truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Menu Trigger Trigger */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex flex-col items-center gap-1 flex-1 py-1 active:scale-90 transition-transform duration-150 min-w-0"
            >
              <div className={`relative flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-300 ${menuOpen ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200/20'}`}>
                {menuOpen ? (
                  <X size={18} strokeWidth={2.5} className="text-white scale-110 transition-all duration-300" />
                ) : (
                  <Menu size={18} strokeWidth={1.8} className="text-slate-500 dark:text-slate-400 transition-all duration-300" />
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all duration-300 truncate ${menuOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                Thêm
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
