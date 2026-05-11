'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Kanban, MessageSquare, Calendar, Settings } from 'lucide-react'

export default function BottomNav({ user }: { user: any }) {
  const pathname = usePathname();
  const navItems = [
    { href: '/workspace',          icon: LayoutDashboard, label: 'Tổng quan' },
    { href: '/workspace/kanban',   icon: Kanban,           label: 'Công việc' },
    { href: '/workspace/chat',     icon: MessageSquare,    label: 'Chat' },
    { href: '/workspace/meetings', icon: Calendar,         label: 'Lịch họp' },
    { href: '/workspace/settings', icon: Settings,         label: 'Cài đặt' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-t border-white/60 dark:border-slate-800/60 shadow-[0_-20px_60px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center px-2 pt-2 pb-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 flex-1 py-1 active:scale-90 transition-transform duration-150 min-w-0">
                <div className={`relative flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className={`transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
