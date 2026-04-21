'use client'

import { useState, useTransition } from 'react'
import { Users, CheckCircle2, Loader2 } from 'lucide-react'
import { castVote } from '@/app/actions/poll'

export default function MeetingPoll({ poll, userId }: { poll: any, userId: string }) {
  const [isPending, startTransition] = useTransition();
  
  if (!poll) return null;
  const options = poll.options as string[];
  const totalVotes = poll.votes?.length || 0;
  const userVoteIdx = poll.votes?.find((v: any) => v.userId === userId)?.optionIdx;

  const handleVote = (idx: number) => {
    if (idx === userVoteIdx) return; // Đã vote rồi thì thôi (hoặc có thể bỏ qua check nếu muốn cho phép click lại)
    
    startTransition(async () => {
      const res = await castVote(poll.id, userId, idx);
      if (!res.success) {
        alert("Lỗi khi biểu quyết: " + res.error);
      }
    });
  };

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 p-6 rounded-[2rem] shadow-sm relative overflow-hidden">
      {isPending && (
        <div className="absolute top-4 right-4 animate-spin text-blue-500">
          <Loader2 size={16} />
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20">
          <Users size={18} />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Biểu quyết chờ quyết định</h3>
      </div>
      
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{poll.question}</p>

      <div className="flex flex-col gap-3">
        {options.map((opt, idx) => {
          const voteCount = poll.votes?.filter((v: any) => v.optionIdx === idx).length || 0;
          const percent = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isSelected = userVoteIdx === idx;

          return (
            <button 
              key={idx}
              disabled={isPending}
              onClick={() => handleVote(idx)}
              className={`relative w-full text-left p-3 rounded-xl border transition-all overflow-hidden group ${
                isSelected 
                ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10' 
                : 'border-white/80 dark:border-slate-700/80 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              {/* Thanh tiến độ chạy ngầm phía sau */}
              <div 
                className={`absolute inset-0 transition-all duration-1000 ${
                  isSelected ? 'bg-blue-500/15' : 'bg-blue-500/5'
                }`} 
                style={{ width: `${percent}%` }}
              />
              
              <div className="relative z-10 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                    {opt}
                  </span>
                  {isSelected && <CheckCircle2 size={14} className="text-blue-500" />}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isSelected 
                  ? 'bg-blue-600 text-white' 
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40'
                }`}>
                  {voteCount} phiếu ({Math.round(percent)}%)
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
