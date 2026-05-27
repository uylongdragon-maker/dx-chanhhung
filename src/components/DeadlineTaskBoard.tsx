"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Clock, Flame, TrendingUp, User, ChevronRight, X, Calendar } from "lucide-react";
import { updateTaskStatus } from "@/app/workspace/kanban/actions";
import toast from "react-hot-toast";

// ──── Priority scoring algorithm ────
function urgencyScore(task: any): number {
  const priorityWeight: Record<string, number> = { URGENT: 100, HIGH: 50, MEDIUM: 20, LOW: 5 };
  let score = priorityWeight[task.priority] || 20;
  
  if (task.dueDate) {
    const now = new Date();
    const due = new Date(task.dueDate);
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 0) score += 200;          // Overdue
    else if (hoursLeft < 24) score += 150;     // Due today
    else if (hoursLeft < 72) score += 80;      // Due in 3 days
    else if (hoursLeft < 168) score += 30;     // Due in 7 days
  }
  return score;
}

function getDeadlineBadge(task: any) {
  if (!task.dueDate) return null;
  const now = new Date();
  const due = new Date(task.dueDate);
  const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysLeft = Math.floor(hoursLeft / 24);

  if (hoursLeft < 0) return { label: "Quá hạn", cls: "bg-rose-500 text-white", urgent: true };
  if (hoursLeft < 24) return { label: "Hôm nay", cls: "bg-orange-500 text-white", urgent: true };
  if (hoursLeft < 48) return { label: "Ngày mai", cls: "bg-amber-400 text-white", urgent: false };
  if (daysLeft < 7) return { label: `${daysLeft} ngày`, cls: "bg-blue-500/20 text-blue-600 border border-blue-200", urgent: false };
  return { label: due.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), cls: "bg-slate-100 text-slate-500", urgent: false };
}

function CountdownTimer({ dueDate }: { dueDate: string }) {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(dueDate).getTime() - Date.now();
      if (diff <= 0) { setTimeStr("Quá hạn!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h < 24) setTimeStr(`${h}g ${m}p`);
      else setTimeStr(`${Math.floor(h / 24)}d ${h % 24}g`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [dueDate]);

  return <span className="font-mono text-[10px] font-black">{timeStr}</span>;
}

const PRIORITY_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  URGENT: { label: "Khẩn", cls: "bg-rose-500 text-white", icon: Flame },
  HIGH:   { label: "Cao",  cls: "bg-orange-500 text-white", icon: TrendingUp },
  MEDIUM: { label: "TB",   cls: "bg-blue-500 text-white", icon: Clock },
  LOW:    { label: "Thấp", cls: "bg-slate-200 text-slate-600", icon: Clock },
};

interface Props {
  tasks: any[];
  users: any[];
  currentUser: any;
  compact?: boolean;
}

export default function DeadlineTaskBoard({ tasks, users, currentUser, compact = false }: Props) {
  const [completing, setCompleting] = useState<string | null>(null);

  const activeTasks = tasks
    .filter((t) => t.status !== "DONE")
    .map((t) => ({ ...t, _score: urgencyScore(t) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, compact ? 5 : 20);

  const handleComplete = useCallback(async (taskId: string) => {
    setCompleting(taskId);
    const res = await updateTaskStatus(taskId, "DONE");
    if (res.success) toast.success("Hoàn thành! 🎉");
    else toast.error("Có lỗi xảy ra");
    setCompleting(null);
  }, []);

  if (activeTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
        <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Tất cả việc hoàn thành!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {activeTasks.map((task) => {
        const deadline = getDeadlineBadge(task);
        const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
        const PIcon = pCfg.icon;
        const isOverdue = deadline?.label === "Quá hạn";

        return (
          <div
            key={task.id}
            className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 hover:shadow-md ${
              isOverdue
                ? "bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
                : "bg-white/60 border-white/80 dark:bg-slate-900/50 dark:border-slate-800/60 hover:bg-white dark:hover:bg-slate-900"
            }`}
          >
            {/* Complete button */}
            <button
              onClick={() => handleComplete(task.id)}
              disabled={completing === task.id}
              className="shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all hover:bg-emerald-500 hover:border-emerald-500 hover:text-white group/btn border-slate-300 dark:border-slate-600"
            >
              {completing === task.id ? (
                <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              ) : (
                <CheckCircle2 size={14} className="text-slate-300 group-hover/btn:text-white transition-colors" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.assignees && task.assignees.length > 0 ? (
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <User size={9} />
                    {task.assignees.map((u: any) => u.name?.split(" ").slice(-1)[0]).join(", ")}
                  </span>
                ) : task.assignee ? (
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <User size={9} />
                    {task.assignee.name?.split(" ").slice(-1)[0]}
                  </span>
                ) : null}
                {task.dueDate && (
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Clock size={9} />
                    <CountdownTimer dueDate={task.dueDate} />
                  </span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${pCfg.cls}`}>
                <PIcon size={9} />
                {pCfg.label}
              </span>
              {deadline && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${deadline.cls} ${deadline.urgent ? "animate-pulse" : ""}`}>
                  {deadline.label}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
