"use client";

import { updateTaskStatusAndOrder } from "@/app/workspace/kanban/actions";
import { MoreHorizontal, CheckCircle2, Circle, Clock, Loader2, GripVertical, CheckSquare, Paperclip, MessageSquare, Pin, AlertTriangle, Search, Filter } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { isPast, isToday } from "date-fns";
import InlineCreateCard from "./InlineCreateCard";
import TaskDetailModal from "./kanban/TaskDetailModal";
import PoolReminderPanel from "./kanban/PoolReminderPanel";

const COLUMNS = [
  { title: 'Cần làm',   status: 'TODO',  icon: <Circle size={16} className="text-slate-400" />,       accent: 'border-slate-300' },
  { title: 'Đang làm',  status: 'DOING', icon: <Clock size={16} className="text-blue-500" />,          accent: 'border-blue-400' },
  { title: 'Hoàn thành',status: 'DONE',  icon: <CheckCircle2 size={16} className="text-emerald-500" />, accent: 'border-emerald-400' },
];

const PRIORITY_DOT: Record<string, string> = {
  URGENT: 'bg-rose-500', HIGH: 'bg-orange-500', MEDIUM: 'bg-blue-400', LOW: 'bg-slate-300',
};

export default function KanbanBoard({ tasks: inputTasks = [], users = [], currentUser }: { tasks?: any[]; users?: any[]; currentUser: any }) {
  const [tasks, setTasks] = useState(inputTasks);
  const [isPending, startTransition] = useTransition();
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'pool'>('board');
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => { 
    setTasks(inputTasks); 
    if (selectedTask) {
      const updated = inputTasks.find((t: any) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [inputTasks]);

  const poolCount = tasks.filter(t => t.isPoolItem && t.status !== 'DONE').length;
  const overdueCount = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'DONE').length;

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAssignee && t.assigneeId !== filterAssignee) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const oldTasks = [...tasks];
    setMovingTaskId(draggableId);
    const movedTask = tasks.find(t => t.id === draggableId);
    if (!movedTask) { setMovingTaskId(null); return; }

    const newStatus = destination.droppableId;
    const updated = tasks.filter(t => t.id !== draggableId);
    const destCol = updated.filter(t => t.status === newStatus).sort((a, b) => (a.order || 0) - (b.order || 0));
    destCol.splice(destination.index, 0, { ...movedTask, status: newStatus });
    setTasks([...updated.filter(t => t.status !== newStatus), ...destCol.map((t, i) => ({ ...t, order: i }))]);

    startTransition(async () => {
      const res = await updateTaskStatusAndOrder(draggableId, newStatus, destination.index);
      if (!res.success) { setTasks(oldTasks); }
      setMovingTaskId(null);
    });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1 shrink-0">
          <button onClick={() => setActiveTab('board')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'board' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <CheckSquare size={14} /> Bảng việc
          </button>
          <button onClick={() => setActiveTab('pool')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'pool' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Pin size={14} /> Pool nhắc nhở
            {poolCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] font-black rounded-full flex items-center justify-center">{poolCount}</span>}
          </button>
        </div>

        {/* Search & Filters - board tab only */}
        {activeTab === 'board' && (
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm việc..." className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-600 dark:text-slate-300">
              <option value="">Tất cả thành viên</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-600 dark:text-slate-300">
              <option value="">Mọi độ ưu tiên</option>
              <option value="URGENT">Khẩn cấp</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
          </div>
        )}

        {/* Overdue alert */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg shrink-0">
            <AlertTriangle size={13} className="text-rose-500" />
            <span className="text-[10px] font-black text-rose-600">{overdueCount} quá hạn</span>
          </div>
        )}
      </div>

      {activeTab === 'pool' ? (
        <div className="max-w-2xl">
          <PoolReminderPanel tasks={tasks} />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-10">
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col.status).sort((a, b) => (a.order || 0) - (b.order || 0));
              return (
                <div key={col.status} className="flex flex-col gap-4">
                  <div className={`flex items-center justify-between px-1 pb-2 border-b-2 ${col.accent}`}>
                    <div className="flex items-center gap-2">
                      {col.icon}
                      <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{col.title}</span>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>
                  </div>

                  <Droppable droppableId={col.status}>
                    {(provided, snapshot) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}
                        className={`flex flex-col gap-3 min-h-[400px] p-3 rounded-lg transition-colors duration-150 ${snapshot.isDraggingOver ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'bg-slate-100/30 dark:bg-slate-950/20'} border-2 border-dashed ${snapshot.isDraggingOver ? 'border-blue-300' : 'border-slate-200/60 dark:border-slate-700/40'}`}>

                        {colTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex-1 flex items-center justify-center text-slate-300 dark:text-slate-700 text-[10px] font-black uppercase tracking-widest">Trống</div>
                        )}

                        {colTasks.map((task, index) => {
                          const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'DONE';
                          const checkTotal = task.checklists?.reduce((a: number, cl: any) => a + (cl.items?.length || 0), 0) || 0;
                          const checkDone  = task.checklists?.reduce((a: number, cl: any) => a + (cl.items?.filter((i: any) => i.isCompleted).length || 0), 0) || 0;

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps}
                                  onClick={() => setSelectedTask(task)}
                                  className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border rounded-lg p-4 cursor-pointer transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500/30 rotate-1 border-blue-200' : 'hover:shadow-lg hover:-translate-y-0.5 border-white/80 dark:border-slate-800/60'} ${isOverdue ? 'border-l-4 border-l-rose-500' : ''}`}>

                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0" onClick={e => e.stopPropagation()}>
                                        <GripVertical size={13} />
                                      </div>
                                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-slate-300'}`} />
                                      <h4 className={`font-bold text-slate-800 dark:text-slate-100 text-[13px] leading-snug break-words ${task.status === 'DONE' ? 'line-through opacity-40' : ''}`}>{task.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {task.isPoolItem && <Pin size={11} className="text-blue-500" />}
                                      {isOverdue && <AlertTriangle size={11} className="text-rose-500" />}
                                      {isPending && task.id === movingTaskId && <Loader2 size={11} className="animate-spin text-blue-500" />}
                                    </div>
                                  </div>

                                  {task.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 ml-5 italic">{task.description}</p>
                                  )}

                                  {/* Labels */}
                                  {task.labels?.length > 0 && (
                                    <div className="ml-5 mb-2 flex flex-wrap gap-1">
                                      {task.labels.map((l: any) => (
                                        <span key={l.id} className="px-2 py-0.5 rounded-full text-[8px] font-black text-white" style={{ backgroundColor: l.color }}>{l.name}</span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Meta badges */}
                                  <div className="ml-5 flex flex-wrap gap-1.5 mb-3">
                                    {checkTotal > 0 && (
                                      <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md ${checkDone === checkTotal ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <CheckSquare size={9} />{checkDone}/{checkTotal}
                                      </div>
                                    )}
                                    {task.attachments?.length > 0 && (
                                      <div className="flex items-center gap-1 text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                                        <Paperclip size={9} />{task.attachments.length}
                                      </div>
                                    )}
                                    {task.activities?.filter((a: any) => a.type === 'COMMENT').length > 0 && (
                                      <div className="flex items-center gap-1 text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                                        <MessageSquare size={9} />{task.activities.filter((a: any) => a.type === 'COMMENT').length}
                                      </div>
                                    )}
                                    {task.dueDate && (
                                      <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md ${isOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <Clock size={9} />{new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                      </div>
                                    )}
                                  </div>

                                  {/* Assignee + watchers */}
                                  <div className="ml-5 flex items-center gap-2">
                                    {task.assignee ? (
                                      <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-400 border-2 border-white/60 shadow-sm flex items-center justify-center text-[9px] text-white font-black overflow-hidden">
                                        {task.assignee.avatarUrl ? <img src={task.assignee.avatarUrl} className="w-full h-full object-cover" alt="" /> : task.assignee.name?.substring(0,2).toUpperCase()}
                                      </div>
                                    ) : (
                                      <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                                        <span className="text-[8px] text-slate-400">??</span>
                                      </div>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-500 truncate">{task.assignee?.name || 'Chưa phân công'}</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        <InlineCreateCard status={col.status} />
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {selectedTask && (
        <TaskDetailModal task={selectedTask} users={users} currentUser={currentUser} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
}
