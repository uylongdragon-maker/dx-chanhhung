"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendMessage } from "@/app/workspace/chat/actions";
import { Send, Hash, Info, User, Smile } from "lucide-react";

export default function ChatWindow({ initialMessages, currentUser }: any) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Message" }, async (payload) => {
        const { data: sender } = await supabase
            .from("User")
            .select("*")
            .eq("id", payload.new.senderId)
            .single();
        
        setMessages((prev) => [...prev, { ...payload.new, sender }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const formData = new FormData();
    formData.append("content", text);
    formData.append("senderId", currentUser.id);
    setText("");
    await sendMessage(formData);
  };

  return (
    <div className="flex flex-col h-[700px] bg-white/30 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/40 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
        {messages.map((m) => {
          const isMe = m.senderId === currentUser.id;
          return (
            <div key={m.id} className={`flex items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm border border-white/50">
                {m.sender?.name?.substring(0, 2).toUpperCase() || <Info size={14}/>}
              </div>
              
              <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                <div className={`px-5 py-3.5 rounded-3xl text-sm font-medium shadow-sm transition-all hover:shadow-md ${
                  isMe 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-white/50 dark:border-slate-800 rounded-bl-none"
                }`}>
                  {m.content}
                </div>
                <span className="text-[10px] mt-1.5 text-slate-400 font-bold uppercase tracking-widest opacity-60">
                   {isMe ? "Bạn" : m.sender?.name} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/40 dark:bg-slate-900/40 border-t border-white/60 dark:border-slate-800/60 backdrop-blur-xl">
        <form onSubmit={onSend} className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nhập nội dung trao đổi..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full pl-6 pr-14 py-4 bg-white/80 dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/20 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400"
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors">
                <Smile size={20} />
            </button>
          </div>
          
          <button
            type="submit"
            className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-90 flex items-center justify-center"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
