'use client'

import { useState, useTransition } from 'react'
import { Users, CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react'
import { castVote } from '@/app/actions/poll'

export default function MeetingPoll({ poll, userId, allUsers = [] }: { poll: any, userId: string, allUsers?: any[] }) {
  const [isPending, startTransition] = useTransition();
  
  if (!poll) return null;
  const options = poll.options as string[];
  const totalVotes = poll.votes?.length || 0;
  const userVoteIdx = poll.votes?.find((v: any) => v.userId === userId)?.optionIdx;
  
  // Lấy danh sách những người đã vote
  const votedUserIds = new Set(poll.votes?.map((v: any) => v.userId) || []);
  const remainingUsers = allUsers.filter(u => !votedUserIds.has(u.id));

  const handleVote = (idx: number) => {
    if (idx === userVoteIdx) return;
    
    startTransition(async () => {
      const res = await castVote(poll.id, userId, idx);
      if (!res.success) {
        alert("Lỗi khi biểu quyết: " + res.error);
      }
    });
  };

  const isExpired = poll.dueDate && new Date(poll.dueDate) < new Date();

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 p-8 rounded-[3rem] shadow-sm relative overflow-hidden">
      {isPending && (
        <div className="absolute top-6 right-6 animate-spin text-blue-500">
          <Loader2 size={20} />
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Biểu quyết chiến lược</h3>
            <div className="flex items-center gap-2 mt-1">
               <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${poll.status === 'OPEN' && !isExpired ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                  {isExpired ? 'Hết hạn' : poll.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
               </span>
               {poll.dueDate && (
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    {new Date(poll.dueDate).toLocaleDateString('vi-VN')}
                 </div>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ</span>
            <span className="text-xl font-black text-indigo-600 tracking-tighter">{totalVotes} / {allUsers.length || '??'} Phản hồi</span>
        </div>
      </div>
      
      <p className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-8 leading-tight">{poll.question}</p>

      <div className="flex flex-col gap-4">
        {options.map((opt, idx) => {
          const voteCount = poll.votes?.filter((v: any) => v.optionIdx === idx).length || 0;
          const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isSelected = userVoteIdx === idx;

          return (
            <button 
              key={idx}
              disabled={isPending || poll.status === 'CLOSED' || isExpired}
              onClick={() => handleVote(idx)}
              className={`relative w-full text-left p-4 rounded-2xl border transition-all overflow-hidden group ${
                isSelected 
                ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10' 
                : 'border-white/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700'
              } disabled:opacity-80`}
            >
              <div 
                className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                  isSelected ? 'bg-blue-500/20' : 'bg-blue-500/10'
                }`} 
                style={{ width: `${percent}%` }}
              />
              
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'} text-sm sm:text-base`}>
                    {opt}
                  </span>
                  {isSelected && <CheckCircle2 size={18} className="text-blue-500" />}
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-black ${isSelected ? 'text-blue-600' : 'text-slate-400'} uppercase tracking-widest`}>
                    {voteCount} Phiếu
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{Math.round(percent)}%</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {remainingUsers.length > 0 && poll.status === 'OPEN' && !isExpired && (
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={14} className="text-amber-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang chờ phản hồi ({remainingUsers.length})</span>
           </div>
           <div className="flex flex-wrap gap-2">
              {remainingUsers.map(u => (
                <div key={u.id} className="group relative">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-white/40 shadow-sm flex items-center justify-center text-[10px] text-slate-500 font-bold overflow-hidden">
                    {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.name?.substring(0,2).toUpperCase()}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {u.name}
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  )
}
