"use client";

import { useState, useTransition } from "react";
import { summarizeAndAssign } from "@/app/actions/meeting";
import { Sparkles, History, Bot, BookOpen, ChevronRight, Loader2, BrainCircuit, Activity } from "lucide-react";

export default function AISummaryPanel({ initialMeetings }: { initialMeetings: any[] }) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"assistant" | "log">("assistant");

  const handleAIAction = async () => {
    startTransition(async () => {
      const topic = prompt("Chủ đề cuộc họp:", "Họp triển khai chiến dịch Tuổi Trẻ Số");
      if (!topic) return;

      const res = await summarizeAndAssign(topic, "Nội dung họp thu thập từ Jitsi system...");
      if (res.success) {
        alert(res.message);
      } else {
        alert("Lỗi AI: " + res.error);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 rounded-[3rem] overflow-hidden shadow-2xl flex-1">
      {/* Tabs */}
      <div className="flex p-2 gap-2 bg-slate-500/5 backdrop-blur-md">
        <button
          onClick={() => setActiveTab("assistant")}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "assistant" 
            ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-lg shadow-black/5" 
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <Bot size={14} />
          Trợ lý AI
        </button>
        <button
          onClick={() => setActiveTab("log")}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "log" 
            ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-lg shadow-black/5" 
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <History size={14} />
          Sổ tay họp
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 scrollbar-hide">
        {activeTab === "assistant" ? (
          <>
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl animate-pulse ring-8 ring-indigo-500/10">
                    <BrainCircuit size={40} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                    <Activity size={12} className="text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">AI Thư ký Đang nghe</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed px-2">
                  Kích hoạt AI để tóm tắt biên bản và tự động tạo danh sách công việc trên bảng Kanban.
                </p>
              </div>
            </div>

            <button
              onClick={handleAIAction}
              disabled={isPending}
              className="group relative w-full py-5 rounded-[2rem] bg-indigo-600 overflow-hidden text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {isPending ? <Loader2 className="animate-spin" /> : <Sparkles size={16} className="relative z-10" />}
              <span className="relative z-10">{isPending ? "Đang phân tích..." : "Phân tích & Phân việc"}</span>
            </button>

            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex gap-4">
               <div className="text-indigo-500 shrink-0">
                  <BookOpen size={20} />
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed font-bold italic">
                  Hệ thống sử dụng Gemini Pro 1.5 để bóc tách ý chính và tự động gán việc cho từng thành viên dựa trên vai trò.
               </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-6">
            {meetings.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <History size={48} className="text-slate-400 mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Trống dữ liệu</p>
               </div>
            ) : (
              meetings.map((m) => (
                <div key={m.id} className="p-6 rounded-[2rem] bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-800/40 hover:shadow-lg transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 truncate pr-2 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{m.topic}</h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                           <Calendar size={10} />
                           {new Date(m.startTime).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                   </div>
                   <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold line-clamp-3">
                        {m.summary || "Bản tóm tắt đang được xử lý..."}
                    </p>
                   </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
