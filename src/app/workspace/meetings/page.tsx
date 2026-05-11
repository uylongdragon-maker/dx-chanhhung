import { prisma } from '@/utils/prisma'
import { createClient } from '@/utils/supabase/server'
import { Calendar, Clock, CheckCircle2, XCircle, MapPin, PlusCircle, ChevronRight, Info, Users } from 'lucide-react'
import { bookMeetingRoom, manualApprove } from '@/app/actions/meeting'
import { redirect } from 'next/navigation'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  if (!supabaseUser) return redirect("/login")

  const currentUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } })
  const isAdmin = currentUser?.role === 'ADMIN'

  const allRequests = await prisma.meetingRequest.findMany({
    include: { user: true },
    orderBy: { startTime: 'desc' },
    take: 30
  })

  const pending = allRequests.filter(r => r.status === 'PENDING').length

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest mb-1">
            <Calendar size={14} /> Lịch họp
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Phòng Họp Vật Lý</h1>
          <p className="text-slate-500 text-xs font-bold mt-1">Đặt lịch & quản lý không gian họp mặt</p>
        </div>
        {pending > 0 && isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-amber-600">{pending} yêu cầu chờ duyệt</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Request list */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <h2 className="font-black text-slate-800 dark:text-slate-100 text-base uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-blue-500" size={18} /> Lịch sử đặt phòng
          </h2>

          {allRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 text-3xl">📅</div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Chưa có yêu cầu nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allRequests.map(req => (
                <div key={req.id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 p-5 rounded-[2rem] flex flex-col gap-4 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{req.roomName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{new Date(req.startTime).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      req.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                      req.status === 'REJECTED' ? 'bg-rose-500 text-white' :
                      'bg-amber-500 text-white'
                    }`}>{req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl">"{req.purpose}"</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white font-black">
                        {req.user.name?.substring(0,1)}
                      </div>
                      <span className="text-[10px] font-black text-slate-500">{req.user.name}</span>
                    </div>

                    {isAdmin && req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <form action={async () => { 'use server'; await manualApprove(req.id, 'APPROVED') }}>
                          <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg hover:bg-emerald-600 active:scale-95 transition-all">
                            <CheckCircle2 size={11} /> Duyệt
                          </button>
                        </form>
                        <form action={async () => { 'use server'; await manualApprove(req.id, 'REJECTED') }}>
                          <button type="submit" className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-lg hover:bg-rose-100 active:scale-95 transition-all border border-rose-200">
                            <XCircle size={11} className="inline mr-1" />Từ chối
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking form */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 bg-white/40 dark:bg-slate-950/30 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 p-8 rounded-[2.5rem] shadow-xl">
            <h3 className="font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                <PlusCircle size={18} />
              </div>
              Đăng ký Phòng họp
            </h3>

            <form action={async (formData) => {
              'use server'
              const room = formData.get('room') as string;
              const purpose = formData.get('purpose') as string;
              const startTime = formData.get('startTime') as string;
              const endTime = formData.get('endTime') as string;
              await bookMeetingRoom(
                currentUser!.id, room, purpose,
                startTime ? new Date(startTime) : new Date(),
                endTime ? new Date(endTime) : new Date(Date.now() + 3600000)
              );
            }} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng họp</label>
                <select name="room" className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="Phòng Thu Âm">📻 Phòng Thu Âm (Studio)</option>
                  <option value="Phòng Họp Lớn">🏛️ Phòng Họp Lớn</option>
                  <option value="Khu Vực Bàn Tròn">🔵 Khu Vực Bàn Tròn</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bắt đầu</label>
                  <input type="datetime-local" name="startTime" className="w-full px-3 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kết thúc</label>
                  <input type="datetime-local" name="endTime" className="w-full px-3 py-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mục đích</label>
                <textarea name="purpose" placeholder="Mô tả nội dung buổi họp..." required rows={3} className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 resize-none placeholder:text-slate-300" />
              </div>

              <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 flex gap-2">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-600/80 font-bold leading-relaxed">Admin sẽ duyệt yêu cầu của bạn. Bạn sẽ nhận thông báo sau khi được xét duyệt.</p>
              </div>

              <button type="submit" className="bg-blue-600 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                Gửi Yêu Cầu <ChevronRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
