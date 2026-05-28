"use client";

import { updateTaskStatusAndOrder, deleteTask, togglePoolItem } from "@/app/workspace/kanban/actions";
import {
  CheckCircle2, Circle, Clock, Loader2, GripVertical, CheckSquare,
  Paperclip, MessageSquare, Plus, AlertTriangle, Pin, Search, Filter,
  SlidersHorizontal, MoreHorizontal, User
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { isPast, isToday, format } from "date-fns";
import { vi } from "date-fns/locale";
import InlineCreateCard from "./InlineCreateCard";
import TaskDetailModal from "./kanban/TaskDetailModal";

const COLUMNS = [
  { title: 'Cần làm',    status: 'TODO',  icon: Circle,       color: 'bg-slate-400',   header: 'bg-slate-50 dark:bg-slate-900',    border: 'border-slate-200 dark:border-slate-700' },
  { title: 'Đang làm',   status: 'DOING', icon: Clock,        color: 'bg-blue-500',    header: 'bg-blue-50 dark:bg-blue-950/40',   border: 'border-blue-200 dark:border-blue-800' },
  { title: 'Hoàn thành', status: 'DONE',  icon: CheckCircle2, color: 'bg-emerald-500', header: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' },
];

const PRIORITY_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  URGENT: { dot: 'bg-rose-500',   badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20',     label: '🔴 Khẩn' },
  HIGH:   { dot: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: '🟠 Cao' },
  MEDIUM: { dot: 'bg-blue-500',   badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',      label: '🔵 TB' },
  LOW:    { dot: 'bg-slate-300',  badge: 'bg-slate-100 text-slate-500 border-slate-200',          label: '⚪ Thấp' },
};

export default function KanbanFullBoard({
  tasks: inputTasks = [],
  users = [],
  currentUser,
}: {
  tasks?: any[];
  users?: any[];
  currentUser: any;
}) {
  const [tasks, setTasks] = useState(inputTasks);
  const [isPending, startTransition] = useTransition();
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { setTasks(inputTasks); }, [inputTasks]);

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAssignee) {
      const hasAssignee = t.assigneeId === filterAssignee || (t.assignees && t.assignees.some((u: any) => u.id === filterAssignee));
      if (!hasAssignee) return false;
    }
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
      if (!res.success) setTasks(oldTasks);
      setMovingTaskId(null);
    });
  };

  const activeFilters = [filterAssignee, filterPriority].filter(Boolean).length;

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm công việc..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 border active:scale-95 ${showFilters || activeFilters > 0
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 hover:bg-blue-700'
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <SlidersHorizontal size={14} />
          Lọc
          {activeFilters > 0 && (
            <span className="w-5 h-5 bg-white/20 rounded-full text-[10px] font-black flex items-center justify-center">{activeFilters}</span>
          )}
        </button>

        {/* Member avatars */}
        <div className="flex items-center gap-1 ml-auto">
          {users.slice(0, 6).map(u => (
            <button
              key={u.id}
              onClick={() => setFilterAssignee(filterAssignee === u.id ? '' : u.id)}
              title={u.name}
              className={`w-8 h-8 rounded-xl border-2 overflow-hidden transition-all ${filterAssignee === u.id ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-white dark:border-slate-700 hover:scale-105 hover:border-blue-300'}`}
            >
              {u.avatarUrl
                ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt={u.name} />
                : <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-[9px] text-white font-black">{u.name?.substring(0, 2).toUpperCase()}</div>
              }
            </button>
          ))}
          {users.length > 6 && (
            <div className="w-8 h-8 rounded-xl border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-500">
              +{users.length - 6}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex gap-3 mb-4 p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap">
          <div className="flex items-center gap-2">
            <User size={13} className="text-slate-400" />
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
              className="text-xs font-bold bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 cursor-pointer">
              <option value="">Tất cả thành viên</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="text-xs font-bold bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 cursor-pointer">
              <option value="">Mọi độ ưu tiên</option>
              <option value="URGENT">🔴 Khẩn cấp</option>
              <option value="HIGH">🟠 Cao</option>
              <option value="MEDIUM">🔵 Trung bình</option>
              <option value="LOW">⚪ Thấp</option>
            </select>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterAssignee(''); setFilterPriority(''); }}
              className="ml-auto text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest">
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Kanban Board — horizontal scroll */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 overflow-x-auto pb-6 items-start min-h-[500px]">
          {COLUMNS.map(col => {
            const Icon = col.icon;
            const colTasks = filtered.filter(t => t.status === col.status).sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <div key={col.status} className="flex flex-col gap-0 shrink-0 w-[300px] sm:w-[320px] transition-all">
                {/* Column Header */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border border-b-0 ${col.header} ${col.border}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{col.title}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${col.color} text-white`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-lg p-1 -mr-1 active:scale-90">
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Column Body */}
                <Droppable droppableId={col.status}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex flex-col gap-2.5 p-3 rounded-b-2xl border transition-all duration-200 ${col.border} ${snapshot.isDraggingOver
                        ? 'bg-blue-50/80 dark:bg-blue-900/20 ring-2 ring-blue-400/30 ring-inset'
                        : 'bg-slate-50/80 dark:bg-slate-900/60'
                      } backdrop-blur-sm`}
                      style={{ minHeight: colTasks.length === 0 ? '160px' : undefined }}
                    >
                      {colTasks.length === 0 && (
                        <div className={`flex flex-col items-center justify-center py-10 transition-all duration-300 ${snapshot.isDraggingOver ? 'opacity-40 scale-95' : 'opacity-100'} text-slate-300 dark:text-slate-600`}>
                          <Icon size={32} strokeWidth={1} className="mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Trống</p>
                          <p className="text-[9px] text-slate-200 dark:text-slate-700 mt-0.5">Kéo thẻ vào đây</p>
                        </div>
                      )}

                      {colTasks.map((task, index) => {
                        const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                        const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'DONE';
                        const isDueToday = task.dueDate && isToday(new Date(task.dueDate)) && task.status !== 'DONE';
                        const checkTotal = task.checklists?.reduce((a: number, cl: any) => a + (cl.items?.length || 0), 0) || 0;
                        const checkDone  = task.checklists?.reduce((a: number, cl: any) => a + (cl.items?.filter((i: any) => i.isCompleted).length || 0), 0) || 0;

                        return (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                onClick={() => setSelectedTask(task)}
                                className={`bg-white dark:bg-slate-800 border rounded-2xl p-4 cursor-pointer transition-all group select-none ${
                                  snapshot.isDragging
                                    ? 'shadow-2xl ring-2 ring-blue-500/30 rotate-1 border-blue-200 dark:border-blue-700 scale-[1.02]'
                                    : isOverdue
                                      ? 'border-rose-200 dark:border-rose-900 hover:shadow-lg hover:border-rose-300'
                                      : 'border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-slate-600 hover:-translate-y-0.5'
                                }`}
                              >
                                {/* Overdue/Today banner */}
                                {(isOverdue || isDueToday) && (
                                  <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-2.5 px-2 py-1 rounded-lg ${isOverdue ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                    <AlertTriangle size={10} />
                                    {isOverdue ? 'Đã quá hạn' : 'Hạn hôm nay'}
                                  </div>
                                )}

                                {/* Labels */}
                                {task.labels?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2.5">
                                    {task.labels.map((l: any) => (
                                      <span key={l.id} className="h-2 px-3 rounded-full text-[0px]" style={{ backgroundColor: l.color }} title={l.name} />
                                    ))}
                                  </div>
                                )}

                                {/* Title */}
                                <div className="flex items-start gap-2 mb-3">
                                  <div {...provided.dragHandleProps} onClick={e => e.stopPropagation()} className="mt-0.5 text-slate-200 hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0 transition-colors">
                                    <GripVertical size={14} />
                                  </div>
                                  <h4 className={`font-bold text-slate-800 dark:text-slate-100 text-[13px] leading-snug flex-1 ${task.status === 'DONE' ? 'line-through opacity-40' : ''}`}>
                                    {task.title}
                                  </h4>
                                </div>

                                {/* Description preview */}
                                {task.description && (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 mb-3 ml-5 leading-relaxed">
                                    {task.description}
                                  </p>
                                )}

                                {/* Checklist progress */}
                                {checkTotal > 0 && (
                                  <div className="ml-5 mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {checkDone}/{checkTotal} việc
                                      </span>
                                      <span className="text-[9px] font-black text-slate-400">
                                        {Math.round((checkDone / checkTotal) * 100)}%
                                      </span>
                                    </div>
                                    <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${checkDone === checkTotal ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                        style={{ width: `${(checkDone / checkTotal) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between ml-5 mt-1">
                                  {/* Meta icons */}
                                  <div className="flex items-center gap-2">
                                    {task.dueDate && (
                                      <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                        <Clock size={9} />
                                        {format(new Date(task.dueDate), 'dd/MM', { locale: vi })}
                                      </div>
                                    )}
                                    {checkTotal > 0 && (
                                      <div className={`flex items-center gap-1 text-[9px] font-bold ${checkDone === checkTotal ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        <CheckSquare size={9} />
                                        {checkDone}/{checkTotal}
                                      </div>
                                    )}
                                    {task.attachments?.length > 0 && (
                                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                        <Paperclip size={9} />
                                        {task.attachments.length}
                                      </div>
                                    )}
                                    {task.activities?.filter((a: any) => a.type === 'COMMENT').length > 0 && (
                                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                        <MessageSquare size={9} />
                                        {task.activities.filter((a: any) => a.type === 'COMMENT').length}
                                      </div>
                                    )}
                                    {task.isPoolItem && <Pin size={10} className="text-blue-500" />}
                                    {isPending && task.id === movingTaskId && <Loader2 size={10} className="animate-spin text-blue-500" />}
                                  </div>

                                  {/* Assignee + priority */}
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} title={p.label} />
                                    <div className="flex -space-x-1.5 overflow-hidden hover:space-x-0.5 transition-all duration-300 items-center">
                                      {task.assignees && task.assignees.length > 0 ? (
                                        <>
                                          {task.assignees.slice(0, 3).map((assignee: any) => (
                                            <div key={assignee.id} className="w-6 h-6 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-700 shrink-0 animate-in fade-in duration-200" title={assignee.name}>
                                              {assignee.avatarUrl ? (
                                                <img src={assignee.avatarUrl} className="w-full h-full object-cover" alt="" />
                                              ) : (
                                                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-[8px] text-white font-black">
                                                  {assignee.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {task.assignees.length > 3 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-black text-slate-500 shrink-0 shadow-sm z-10" title={task.assignees.slice(3).map((u: any) => u.name).join(", ")}>
                                              +{task.assignees.length - 3}
                                            </div>
                                          )}
                                        </>
                                      ) : task.assignee ? (
                                        <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white dark:border-slate-850 shadow-sm bg-slate-100 dark:bg-slate-700 shrink-0" title={task.assignee.name}>
                                          {task.assignee.avatarUrl ? (
                                            <img src={task.assignee.avatarUrl} className="w-full h-full object-cover" alt="" />
                                          ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-[8px] text-white font-black">
                                              {task.assignee.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-600 shrink-0">
                                          <User size={8} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {/* Add card button */}
                <InlineCreateCard status={col.status} />
              </div>
            );
          })}

          {/* Spacer for comfortable scroll end */}
          <div className="shrink-0 w-4" />
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
