"use client";

import { useState } from "react";
import { Table, Kanban, Pin, AlertTriangle, Clock } from "lucide-react";
import KanbanFullBoard from "@/components/KanbanFullBoard";
import PoolReminderPanel from "./PoolReminderPanel";
import TaskTableView from "./TaskTableView";
import TaskDetailModal from "@/components/kanban/TaskDetailModal";

interface KanbanPageWrapperProps {
  tasks: any[];
  users: any[];
  currentUser: any;
}

export default function KanbanPageWrapper({ tasks = [], users = [], currentUser }: KanbanPageWrapperProps) {
  const [activeTab, setActiveTab] = useState<"table" | "kanban">("table"); // Default to Table (Spreadsheet) as requested!
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Recalculate stats dynamically based on current task list
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

        {/* ─── Premium Tab Switcher ─── */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shrink-0 shadow-inner border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab("table")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "table"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Table size={13} />
            Bảng Theo Dõi
          </button>
          <button
            onClick={() => setActiveTab("kanban")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "kanban"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-100"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Kanban size={13} />
            Kanban & Hoạt Động
          </button>
        </div>
      </div>

      {/* ─── Active View Render ─── */}
      <div className="flex-grow min-h-0">
        {activeTab === "table" ? (
          /* Spreadsheet style Table View */
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TaskTableView 
              tasks={tasks} 
              users={users} 
              currentUser={currentUser} 
              onSelectTask={(task) => {
                // To display detailed modal even from table view!
                setSelectedTask(task);
              }}
            />
          </div>
        ) : (
          /* Kanban Board and sidebar */
          <div className="flex gap-6 h-full flex-grow min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Board — takes remaining width */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <KanbanFullBoard tasks={tasks} users={users} currentUser={currentUser} />
            </div>

            {/* Pool Reminder Sidebar — fixed width, hidden on small screens */}
            {poolCount > 0 && (
              <div className="hidden xl:flex flex-col w-72 shrink-0">
                <div className="sticky top-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-700/60 rounded-[1.75rem] p-4 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                      <Pin size={13} className="text-blue-500" /> Pool Nhắc Nhở
                    </h3>
                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-600 text-white rounded-full">{poolCount}</span>
                  </div>
                  <PoolReminderPanel tasks={tasks} compact />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal support from Table View */}
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
