'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, FolderOpen, Settings, Kanban, MessageSquare, Image as ImageIcon, Rocket, Users } from 'lucide-react'

export default function BottomNav({ user }: { user: any }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/workspace', icon: LayoutDashboard, label: 'Tổng quan' },
    { href: '/workspace/kanban', icon: Kanban, label: 'Công việc' },
    { href: '/workspace/meetings', icon: Calendar, label: 'Phòng họp' },
    { href: '/workspace/library', icon: FolderOpen, label: 'Thư viện' },
    { href: '/workspace/settings', icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphic background */}
      <div className="bg-white/75 dark:bg-slate-950/75 backdrop-blur-3xl border-t border-white/60 dark:border-slate-800/60 shadow-[0_-20px_60px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center px-2 pt-3 pb-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1.5 flex-1 py-1 active:scale-90 transition-transform duration-150"
              >
                {/* Icon Container */}
                <div className={`relative flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-300 ${
                  isActive 
                  ? 'bg-blue-600 shadow-lg shadow-blue-500/30' 
                  : ''
                }`}>
                  <Icon 
                    size={20} 
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={`transition-all duration-300 ${
                      isActive 
                      ? 'text-white scale-110' 
                      : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                </div>

                {/* Label */}
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-400 dark:text-slate-600'
                }`}>
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
