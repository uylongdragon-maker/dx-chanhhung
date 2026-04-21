"use client";

import { updateTaskStatusAndOrder } from "@/app/workspace/kanban/actions";
import { MoreHorizontal, Plus, CheckCircle2, Circle, Clock, Loader2, GripVertical, CheckSquare, Paperclip, MessageSquare } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import InlineCreateCard from "./InlineCreateCard";
import TaskDetailModal from "./kanban/TaskDetailModal";

export default function KanbanBoard({ 
  tasks: inputTasks = [],
  users = [],
  currentUser
}: { 
  tasks?: any[],
  users?: any[],
  currentUser: any
}) {
  const [tasks, setTasks] = useState(inputTasks);
  const [isPending, startTransition] = useTransition();
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const columns = [
    { title: 'Cần làm', status: 'TODO', icon: <Circle size={18} className="text-slate-400" />, color: 'slate' },
    { title: 'Đang làm', status: 'DOING', icon: <Clock size={18} className="text-blue-500" />, color: 'blue' },
    { title: 'Hoàn thành', status: 'DONE', icon: <CheckCircle2 size={18} className="text-emerald-500" />, color: 'emerald' },
  ];

  // Đồng bộ state khi props thay đổi
  useEffect(() => {
    setTasks(inputTasks);
  }, [inputTasks]);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const oldTasks = [...tasks];
    setMovingTaskId(draggableId);
    
    const movedTask = tasks.find(t => t.id === draggableId);
    if (!movedTask) {
        setMovingTaskId(null);
        return;
    }

    const newStatus = destination.droppableId;
    const newIndex = destination.index;

    const updatedTasks = tasks.filter(t => t.id !== draggableId);
    const destinationTasks = updatedTasks.filter(t => t.status === newStatus).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    destinationTasks.splice(newIndex, 0, { ...movedTask, status: newStatus });
    
    const finalTasks = [
        ...updatedTasks.filter(t => t.status !== newStatus),
        ...destinationTasks.map((t, idx) => ({ ...t, order: idx }))
    ];

    setTasks(finalTasks);

    startTransition(async () => {
      const res = await updateTaskStatusAndOrder(draggableId, newStatus, newIndex);
      if (!res.success) {
        setTasks(oldTasks);
        alert("Lỗi khi cập nhật vị trí: " + res.error);
      }
      setMovingTaskId(null);
    });
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start pb-10">
          {columns.map((col) => {
            const colTasks = tasks
              .filter(t => t.status === col.status)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <div key={col.status} className="flex flex-col gap-6 group/column">
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

                <Droppable droppableId={col.status}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex flex-col gap-4 min-h-[450px] p-4 rounded-[2.5rem] transition-colors duration-200 ${
                        snapshot.isDraggingOver 
                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                        : 'bg-slate-100/20 dark:bg-slate-950/20 border-slate-300/30 dark:border-slate-700/30'
                      } border border-dashed`}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex-1 flex items-center justify-center italic text-slate-400 text-[10px] font-medium uppercase tracking-widest opacity-40">
                          Trống
                        </div>
                      )}
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/60 p-5 rounded-[2rem] shadow-sm transition-all group/card cursor-pointer ${
                                snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500/20 rotate-2' : 'hover:shadow-lg hover:translate-y-[-2px]'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                    <GripVertical size={14} />
                                  </div>
                                  <h4 className={`font-black text-slate-800 dark:text-slate-100 text-[13px] leading-tight transition-all tracking-tight ${task.status === 'DONE' ? 'opacity-40 italic line-through' : ''}`}>
                                    {task.title}
                                  </h4>
                                </div>
                                <button className="text-slate-300 hover:text-slate-500 transition-colors">
                                  <MoreHorizontal size={16}/>
                                </button>
                              </div>
                              
                              {task.description && (
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed italic ml-5">
                                  {task.description}
                                </p>
                              )}

                              {/* Card Metadata Badges */}
                              <div className="ml-5 mb-4 flex flex-wrap gap-2">
                                 {task.checklists?.length > 0 && (
                                   <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                      <CheckSquare size={10} />
                                      <span>{task.checklists.reduce((acc: number, cl: any) => acc + (cl.items?.filter((i:any) => i.isCompleted).length || 0), 0)} / {task.checklists.reduce((acc: number, cl: any) => acc + (cl.items?.length || 0), 0)}</span>
                                   </div>
                                 )}
                                 {task.attachments?.length > 0 && (
                                   <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                      <Paperclip size={10} />
                                      <span>{task.attachments.length}</span>
                                   </div>
                                 )}
                                 {task.activities?.length > 0 && (
                                   <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                      <MessageSquare size={10} />
                                      <span>{task.activities.filter((a:any) => a.type === 'COMMENT').length}</span>
                                   </div>
                                 )}
                                 {task.dueDate && (
                                   <div className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                                      <Clock size={10} />
                                      <span>{new Date(task.dueDate).toLocaleDateString('vi-VN')}</span>
                                   </div>
                                 )}
                              </div>

                              <div className="flex items-center justify-between mt-auto ml-5">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 border border-white/40 shadow-inner flex items-center justify-center text-[10px] text-white font-black overflow-hidden shadow-lg shadow-blue-500/20">
                                    {task.assignee?.avatarUrl ? (
                                      <img src={task.assignee.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                                    ) : (
                                      task.assignee?.name?.substring(0,2).toUpperCase() || '??'
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tighter">
                                        {task.assignee?.name || "???"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {isPending && task.id === movingTaskId && (
                                     <Loader2 size={12} className="animate-spin text-blue-500" />
                                  )}
                                  <div className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                                    task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-600' :
                                    task.status === 'DOING' ? 'bg-blue-500/10 text-blue-600' :
                                    'bg-slate-500/10 text-slate-500'
                                  }`}>
                                    {task.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
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
