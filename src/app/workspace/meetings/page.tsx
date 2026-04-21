import { prisma } from '@/utils/prisma'
import { createClient } from '@/utils/supabase/server'
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  MapPin, 
  PlusCircle, 
  ShieldCheck, 
  BrainCircuit,
  ChevronRight,
  Info
} from 'lucide-react'
import { bookMeetingRoom, manualApprove, aiAutoApprove } from '@/app/actions/meeting'
import JitsiMeetingComponent from "@/components/meetings/JitsiMeetingComponent"
import { redirect } from 'next/navigation'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  
  if (!supabaseUser) return redirect("/login")

  const currentUser = await prisma.user.findUnique({ 
    where: { id: supabaseUser.id } 
  })

  const isAdmin = currentUser?.role === 'ADMIN'

  const allRequests = await prisma.meetingRequest.findMany({
    include: { user: true },
    orderBy: { startTime: 'desc' },
    take: 20
  })

  return (
    <div className="flex flex-col gap-10 pb-24 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Calendar size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Resource Control</span>
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
            Trung tâm Hội nghị
          </h2>
          <p className="text-slate-500 text-xs font-bold italic">
            Hệ thống điều phối không gian và Trợ lý AI nòng cốt.
          </p>
        </div>

        {isAdmin && (
          <form action={aiAutoApprove}>
            <button type="submit" className="group relative overflow-hidden flex items-center gap-3 bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <BrainCircuit size={16} className="relative z-10" /> 
              <span className="relative z-10">Kích hoạt AI Quét Đơn</span>
              <Sparkles size={14} className="relative z-10 text-yellow-300 animate-pulse" />
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Live Meeting & Info */}
        <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Jitsi Integrated Frame */}
            <div className="rounded-[3.5rem] overflow-hidden bg-slate-950 border-4 border-white/10 relative shadow-[0_40px_100px_rgba(0,0,0,0.4)] group aspect-video lg:aspect-auto lg:h-[500px]">
                <div className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Encrypted Stream</span>
                </div>
                <JitsiMeetingComponent 
                    userName={currentUser?.name || "Member"} 
                    userEmail={currentUser?.email || ""} 
                />
            </div>

            {/* Request List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg uppercase tracking-tight flex items-center gap-3">
                        <Clock className="text-indigo-500" size={20} />
                        Dòng thời gian mượn phòng
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {allRequests.map(req => (
                        <div key={req.id} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 p-6 rounded-[2.5rem] flex flex-col justify-between gap-6 hover:shadow-xl transition-all group">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                            <MapPin size={18} />
                                        </div>
                                        <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{req.roomName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {req.isAIApproved && <Sparkles size={14} className="text-purple-500 animate-pulse" />}
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            req.status === 'APPROVED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                                            req.status === 'REJECTED' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                                            'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/50 dark:bg-slate-950/40 rounded-2xl border border-white/50 dark:border-slate-800/40">
                                    <p className="text-xs text-slate-600 dark:text-slate-300 font-bold italic">"{req.purpose}"</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black">
                                        {req.user.name?.substring(0, 1)}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500">{req.user.name}</span>
                                </div>

                                {isAdmin && req.status === 'PENDING' ? (
                                    <div className="flex gap-2">
                                        <form action={async () => { 'use server'; await manualApprove(req.id, 'APPROVED') }}>
                                            <button type="submit" className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95">Duyệt</button>
                                        </form>
                                        <form action={async () => { 'use server'; await manualApprove(req.id, 'REJECTED') }}>
                                            <button type="submit" className="px-3 py-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-rose-200">Hủy</button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Clock size={12} />
                                        <span className="text-[10px] font-black">{new Date(req.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT: Booking Form */}
        <div className="lg:col-span-4">
            <div className="sticky top-6 bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl"></div>
                
                <h3 className="font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                        <PlusCircle size={20} />
                    </div>
                    Đăng ký Phòng họp
                </h3>

                <form action={async (formData) => {
                    'use server'
                    const room = formData.get('room') as string;
                    const purpose = formData.get('purpose') as string;
                    // Tạm fix cứng thời gian demo 1 tiếng
                    await bookMeetingRoom(currentUser!.id, room, purpose, new Date(), new Date(Date.now() + 3600000));
                }} className="flex flex-col gap-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vị trí phòng</label>
                        <select name="room" className="w-full px-6 py-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700 focus:ring-8 focus:ring-blue-500/5 transition-all text-slate-800 dark:text-slate-100 text-sm font-bold outline-none">
                            <option value="Phòng Thu Âm">Phòng Thu Âm (Studio)</option>
                            <option value="Phòng Họp Lớn">Phòng Họp Lớn</option>
                            <option value="Khu Vực Bàn Tròn">Khu Vực Bàn Tròn</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mục đích sử dụng</label>
                        <textarea 
                            name="purpose" 
                            placeholder="Mô tả công việc (VD: Quay kịch bản tiktok cho cư dân...)" 
                            required 
                            rows={4} 
                            className="w-full px-6 py-4 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700 focus:ring-8 focus:ring-blue-500/5 transition-all text-slate-800 dark:text-slate-100 text-sm font-bold outline-none resize-none placeholder:text-slate-300" 
                        />
                    </div>

                    <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3 italic">
                        <Info size={16} className="text-blue-500 shrink-0" />
                        <p className="text-[10px] text-blue-600/80 font-bold leading-relaxed">
                            Yêu cầu sẽ được Thư ký AI xét duyệt tự động nếu mục đích phù hợp với nhiệm vụ của Ban.
                        </p>
                    </div>

                    <button type="submit" className="bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2">
                        Gửi Yêu Cầu Đặt Phòng
                        <ChevronRight size={14} />
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  )
}
