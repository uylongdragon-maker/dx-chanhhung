'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Calendar, Bell, Pin, Clock, User, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow, isPast, isToday, isTomorrow, format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface PoolReminderPanelProps {
  tasks: any[]
  compact?: boolean
}

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  URGENT: { label: 'Khẩn', cls: 'bg-rose-500 text-white' },
  HIGH:   { label: 'Cao',   cls: 'bg-orange-500 text-white' },
  MEDIUM: { label: 'TB',    cls: 'bg-blue-500 text-white' },
  LOW:    { label: 'Thấp',  cls: 'bg-slate-200 text-slate-600' },
}

function getDueBadge(dueDate: Date) {
  if (isPast(dueDate) && !isToday(dueDate)) return { label: 'Quá hạn', cls: 'bg-rose-500/10 text-rose-600 border border-rose-500/20' }
  if (isToday(dueDate)) return { label: 'Hôm nay!', cls: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' }
  if (isTomorrow(dueDate)) return { label: 'Ngày mai', cls: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' }
  return { label: formatDistanceToNow(dueDate, { addSuffix: true, locale: vi }), cls: 'bg-slate-100 text-slate-500 border border-slate-200' }
}

export default function PoolReminderPanel({ tasks, compact = false }: PoolReminderPanelProps) {
  const poolTasks = tasks
    .filter(t => t.isPoolItem && t.status !== 'DONE')
    .sort((a, b) => {
      // Quá hạn lên đầu, rồi theo dueDate gần nhất
      const aOverdue = a.dueDate && isPast(new Date(a.dueDate))
      const bOverdue = b.dueDate && isPast(new Date(b.dueDate))
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      return 0
    })

  const overdueCount = poolTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length

  if (poolTasks.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-10 text-center ${compact ? 'py-6' : ''}`}>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <CheckSquare size={22} className="text-emerald-500" />
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Không có việc nào cần nhắc nhở</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header badges */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 rounded-2xl border border-rose-500/20 mb-1">
          <AlertTriangle size={14} className="text-rose-500 shrink-0" />
          <span className="text-[11px] font-black text-rose-600">{overdueCount} việc đã quá hạn!</span>
        </div>
      )}

      {poolTasks.slice(0, compact ? 5 : 20).map(task => {
        const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
        const checkTotal = task.checklists?.reduce((a: number, cl: any) => a + (cl.items?.length || 0), 0) || 0
        const checkDone  = task.checklists?.reduce((a: number, cl: any) => a + (cl.items?.filter((i: any) => i.isCompleted).length || 0), 0) || 0
        const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : null

        return (
          <div key={task.id} className="group bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/80 dark:border-slate-800/60 rounded-[1.5rem] p-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Pin size={12} className="text-blue-500 shrink-0" />
                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-snug truncate">{task.title}</p>
              </div>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0 ${priority.cls}`}>
                {priority.label}
              </span>
            </div>

            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center gap-1.5 mb-2 ml-4">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white font-black overflow-hidden">
                  {task.assignee.avatarUrl
                    ? <img src={task.assignee.avatarUrl} className="w-full h-full object-cover" alt="" />
                    : task.assignee.name?.substring(0, 1)
                  }
                </div>
                <span className="text-[10px] font-bold text-slate-500">{task.assignee.name}</span>
              </div>
            )}

            {/* Progress bar */}
            {checkPct !== null && (
              <div className="ml-4 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Tiến độ</span>
                  <span className="text-[9px] font-black text-slate-500">{checkDone}/{checkTotal}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${checkPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${checkPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Due date */}
            {task.dueDate && (() => {
              const due = new Date(task.dueDate)
              const badge = getDueBadge(due)
              return (
                <div className="ml-4 flex items-center gap-1.5">
                  <Clock size={10} className="text-slate-400 shrink-0" />
                  <span className="text-[9px] text-slate-400 font-bold">
                    {format(due, 'dd/MM/yyyy')}
                  </span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })()}
          </div>
        )
      })}

      {compact && poolTasks.length > 5 && (
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          +{poolTasks.length - 5} việc khác...
        </p>
      )}
    </div>
  )
}
