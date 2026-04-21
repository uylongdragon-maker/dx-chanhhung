"use client";

import { updateTaskStatus } from "@/app/workspace/kanban/actions";
import { MoreHorizontal, Plus, CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

export default function KanbanBoard({ 
  tasks: inputTasks = [],
  users = []
}: { 
  tasks?: any[],
  users?: any[] 
}) {
  const [tasks, setTasks] = useState(inputTasks);
  const [isPending, startTransition] = useTransition();

  const columns = [
    { title: 'Cần làm', status: 'TODO', icon: <Circle size={18} className="text-slate-400" />, color: 'slate' },
    { title: 'Đang làm', status: 'DOING', icon: <Clock size={18} className="text-blue-500" />, color: 'blue' },
    { title: 'Hoàn thành', status: 'DONE', icon: <CheckCircle2 size={18} className="text-emerald-500" />, color: 'emerald' },
  ];

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const oldTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    startTransition(async () => {
      const res = await updateTaskStatus(taskId, newStatus);
      if (!res.success) {
        setTasks(oldTasks);
        alert("Lỗi khi cập nhật trạng thái: " + res.error);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pb-10">
      {columns.map((col) => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-6 group/column">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-800/60 shadow-sm`}>
                  {col.icon}
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-slate-800 dark:text-slate-100 uppercase text-[10px] tracking-widest leading-none mb-1">{col.title}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {colTasks.length} Nhiệm vụ
                  </span>
                </div>
              </div>
            </div>

            {/* Column Body */}
            <div className="flex flex-col gap-4 min-h-[350px] p-4 rounded-[2.5rem] bg-slate-100/20 dark:bg-slate-950/20 border border-dashed border-slate-300/30 dark:border-slate-700/30">
              {colTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center italic text-slate-400 text-[10px] font-medium uppercase tracking-widest opacity-40">
                  Trống
                </div>
              )}
              {colTasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 p-5 rounded-[2rem] shadow-sm hover:shadow-2xl hover:translate-y-[-2px] transition-all group/card animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`font-black text-slate-800 dark:text-slate-100 text-[13px] leading-tight transition-all tracking-tight ${task.status === 'DONE' ? 'opacity-40 italic line-through' : ''}`}>
                      {task.title}
                    </h4>
                    <button className="text-slate-300 hover:text-slate-500 transition-colors">
                      <MoreHorizontal size={16}/>
                    </button>
                  </div>
                  
                  {task.description && (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed italic">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 border border-white/40 shadow-inner flex items-center justify-center text-[10px] text-white font-black overflow-hidden shadow-lg shadow-blue-500/20">
                        {task.assignee?.avatarUrl ? (
                          <img src={task.assignee.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          task.assignee?.name?.substring(0,2).toUpperCase() || '??'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                            Assignee
                        </span>
                        <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tighter">
                            {task.assignee?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative group/select">
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="appearance-none text-[9px] font-black bg-white/50 dark:bg-slate-800 border-none rounded-full px-4 py-1.5 text-slate-500 dark:text-slate-400 cursor-pointer focus:ring-4 focus:ring-blue-500/10 shadow-sm hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest border border-white/40 transition-all active:scale-95"
                      >
                        <option value="TODO">TODO</option>
                        <option value="DOING">DOING</option>
                        <option value="DONE">DONE</option>
                      </select>
                      {isPending && (
                        <div className="absolute -top-1 -right-1">
                             <Loader2 size={12} className="animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
