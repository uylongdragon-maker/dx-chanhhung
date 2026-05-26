import { prisma } from '@/utils/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MeetingDashboardClient from '@/components/meetings/MeetingDashboardClient'
import { Calendar } from 'lucide-react'

export const revalidate = 10; // fast cache revalidation

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  if (!supabaseUser) return redirect("/login")

  const currentUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } })
  if (!currentUser) return redirect("/login")

  const isAdmin = currentUser?.role === 'ADMIN'

  // Fetch meeting requests (schedules)
  const allRequests = await prisma.meetingRequest.findMany({
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true }
      }
    },
    orderBy: { startTime: 'desc' },
    take: 60
  });

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7360f2] text-xs font-black uppercase tracking-widest mb-1">
            <Calendar size={14} /> Lịch Họp & Sự Kiện
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Danh Sách Lịch Họp</h1>
          <p className="text-slate-500 text-xs font-bold mt-1">
            Theo dõi danh sách lịch họp của Ban. Bạn có thể đăng ký lịch họp mới để ban quản trị phê duyệt.
          </p>
        </div>
      </div>

      {/* Main dashboard client */}
      <MeetingDashboardClient
        requests={allRequests as any}
        currentUser={currentUser}
        isAdmin={isAdmin}
      />
    </div>
  );
}
