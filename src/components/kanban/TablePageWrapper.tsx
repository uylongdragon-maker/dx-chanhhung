"use client";

import { useState } from "react";
import { Table, Pin, AlertTriangle, Clock } from "lucide-react";
import TaskTableView from "./TaskTableView";
import TaskDetailModal from "@/components/kanban/TaskDetailModal";

interface TablePageWrapperProps {
  tasks: any[];
  users: any[];
  currentUser: any;
}

export default function TablePageWrapper({ tasks = [], users = [], currentUser }: TablePageWrapperProps) {
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Calculate stats dynamically for the table dashboard view
  const todoCount = tasks.filter(t => t.status === "TODO").length;
  const doingCount = tasks.filter(t => t.status === "DOING").length;
  const doneCount = tasks.filter(t => t.status === "DONE").length;
  const overdueCount = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;
  const poolCount = tasks.filter(t => t.isPoolItem && t.status !== "DONE").length;

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* ─── Stats Bar ─── */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { label: "Cần làm",   value: todoCount,   color: "text-slate-600",   bg: "bg-slate-100 dark:bg-slate-800" },
            { label: "Đang làm",  value: doingCount,  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "Xong",      value: doneCount,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Quá hạn",   value: overdueCount,color: "text-rose-600",    bg: overdueCount > 0 ? "bg-rose-50 dark:bg-rose-950/40" : "bg-slate-50 dark:bg-slate-800" },
            { label: "Pool",      value: poolCount,   color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shrink-0`}>
              <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Table View ─── */}
      <div className="flex-grow min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <TaskTableView 
          tasks={tasks} 
          users={users} 
          currentUser={currentUser} 
          onSelectTask={(task) => setSelectedTask(task)}
        />
      </div>

      {/* Detail Modal Support */}
      {selectedTask && (
        <div className="relative z-[9999]">
          <TaskDetailModal
            task={selectedTask}
            users={users}
            currentUser={currentUser}
            onClose={() => setSelectedTask(null)}
          />
        </div>
      )}
    </div>
  );
}
