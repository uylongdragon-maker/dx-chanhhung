"use client";

import { useRef, useTransition } from "react";
import { createTask } from "@/app/workspace/kanban/actions";
import { Plus, Loader2 } from "lucide-react";

export default function CreateTaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form 
      ref={formRef}
      action={async (formData) => {
        startTransition(async () => {
          const res = await createTask(formData);
          if (res.success) {
            formRef.current?.reset();
          } else {
            alert("Lỗi: " + res.error);
          }
        });
      }} 
      className="flex gap-3 w-full max-w-xl animate-in slide-in-from-right-4 duration-500"
    >
      <div className="relative flex-1 group">
         <input 
          type="text" 
          name="title" 
          placeholder="Bạn đang dự định làm gì tiếp theo?" 
          required
          disabled={isPending}
          className="w-full pl-6 pr-4 py-4 rounded-[1.5rem] bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/60 focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-on-surface placeholder:text-slate-400 dark:text-slate-100 transition-all backdrop-blur-2xl shadow-inner disabled:opacity-50 group-hover:bg-white/60 dark:group-hover:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 text-sm font-medium"
        />
      </div>
      <button 
        type="submit" 
        disabled={isPending}
        className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all active:scale-95 flex items-center gap-2 min-w-fit disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Plus size={16} />
        )}
        Thêm việc
      </button>
    </form>
  );
}
