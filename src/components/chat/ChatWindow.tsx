"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendRoomMessage, createTaskFromMessage } from "@/app/actions/chat-rooms";
import { Send, Smile, Loader2, CheckSquare, X, Calendar, User, Flag, Plus, Hash } from "lucide-react";
import toast from "react-hot-toast";

interface Message {
  id: string;
  content: string | null;
  senderId: string;
  createdAt: string | Date;
  type: string;
  taskRef?: string | null;
  sender?: { name: string | null; avatarUrl: string | null } | null;
  _optimistic?: boolean;
}

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentUser: any;
  roomId: string;
  poolId: string;
  users?: any[];
}

// Quick Task Creation Panel
function QuickTaskPanel({
  prefill, users, currentUser, poolId, onClose
}: {
  prefill: string; users: any[]; currentUser: any; poolId: string; onClose: () => void
}) {
  const [title, setTitle] = useState(prefill);
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!title.trim()) { toast.error("Nhập tiêu đề công việc!"); return; }
    startTransition(async () => {
      const res = await createTaskFromMessage(
        title, "", assigneeId || null, dueDate || null, poolId
      );
      if (res.success) {
        toast.success("✅ Đã tạo việc và cập nhật vào Kanban!");
        onClose();
      } else {
        toast.error("Có lỗi khi tạo việc");
      }
    });
  };

  const PRIOS = [
    { v: "URGENT", l: "Khẩn", c: "bg-rose-500 text-white" },
    { v: "HIGH",   l: "Cao",  c: "bg-orange-500 text-white" },
    { v: "MEDIUM", l: "TB",   c: "bg-blue-500 text-white" },
    { v: "LOW",    l: "Thấp", c: "bg-slate-200 text-slate-600" },
  ];

  return (
    <div className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] shadow-2xl p-4 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
          <CheckSquare size={13} className="text-blue-500" /> Giao việc từ phòng này
        </p>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <X size={12} className="text-slate-400" />
        </button>
      </div>

      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Tên công việc..."
        className="w-full px-3 py-2 mb-3 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" />

      <div className="flex gap-2 mb-3 flex-wrap">
        {PRIOS.map(p => (
          <button key={p.v} onClick={() => setPriority(p.v)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${priority === p.v ? p.c + " scale-105" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            {p.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
          className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none">
          <option value="">Người thực hiện...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
      </div>

      <button onClick={handleCreate} disabled={isPending || !title.trim()}
        className="w-full py-2.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        Tạo việc → Kanban
      </button>
    </div>
  );
}

export default function RoomChatWindow({ messages, setMessages, currentUser, roomId, poolId, users = [] }: Props) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Supabase Realtime – scoped to this room
  useEffect(() => {
    const channel = supabase
      .channel(`chat:room:${roomId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "Message" },
        (payload) => {
          if (payload.new.roomId !== roomId) return;
          if (payload.new.senderId === currentUser.id) return;
          const senderUser = users?.find(u => u.id === payload.new.senderId);
          const sender = senderUser ? { name: senderUser.name, avatarUrl: senderUser.avatarUrl } : null;
          setMessages(prev => [...prev, { ...payload.new as any, sender }]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, currentUser.id, users, setMessages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || isSending) return;

    const optimisticMsg: Message = {
      id: `opt-${Date.now()}`,
      content,
      senderId: currentUser.id,
      createdAt: new Date().toISOString(),
      type: "TEXT",
      sender: { name: currentUser.name || currentUser.email, avatarUrl: currentUser.avatarUrl || null },
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setText("");
    setIsSending(true);

    try {
      const res = await sendRoomMessage(content, currentUser.id, roomId, poolId);
      if (!res.success) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        setText(content);
        toast.error("Không gửi được tin nhắn");
      } else {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, _optimistic: false } : m));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setText(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-white/30 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/40 dark:border-slate-800/50 rounded-[2rem] shadow-2xl overflow-hidden">

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 gap-3">
            <div className="text-4xl">💬</div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Chưa có tin nhắn nào</p>
            <p className="text-xs text-slate-400">Hãy bắt đầu cuộc trò chuyện trong phòng này!</p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === currentUser.id;
          const displayName = m.sender?.name || (isMe ? currentUser.name || "Bạn" : "Thành viên");
          const initials = displayName?.substring(0, 2).toUpperCase() || "??";
          const time = new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          const isTaskRef = m.type === "TASK_REF";

          return (
            <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${m._optimistic ? "opacity-60" : "opacity-100"} transition-opacity`}>
              <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white overflow-hidden"
                style={{ background: isMe ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "linear-gradient(135deg,#475569,#64748b)" }}>
                {m.sender?.avatarUrl ? <img src={m.sender.avatarUrl} className="w-full h-full object-cover" alt="" /> : initials}
              </div>

              <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{displayName}</span>}

                {isTaskRef ? (
                  <div className="px-3 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <CheckSquare size={13} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{m.content}</span>
                  </div>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
                  }`}>
                    {m.content}
                    {m._optimistic && <Loader2 size={9} className="inline ml-2 animate-spin opacity-60" />}
                  </div>
                )}

                <span className={`text-[9px] mt-0.5 font-bold text-slate-400 tracking-widest ${isMe ? "mr-1" : "ml-1"}`}>{time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-3 bg-white/50 dark:bg-slate-900/50 border-t border-white/60 dark:border-slate-800/60 backdrop-blur-xl">
        <div className="relative">
          {showTaskPanel && (
            <QuickTaskPanel
              prefill=""
              users={users}
              currentUser={currentUser}
              poolId={poolId}
              onClose={() => setShowTaskPanel(false)}
            />
          )}

          <form onSubmit={onSend} className="flex items-center gap-2">
            {/* Task button */}
            <button
              type="button"
              onClick={() => setShowTaskPanel(v => !v)}
              title="Giao việc từ phòng này"
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                showTaskPanel ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
            >
              <CheckSquare size={16} />
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Nhắn trong phòng...`}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(e as any); }}}
                disabled={isSending}
                autoComplete="off"
                className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm font-medium text-slate-800 dark:text-slate-100 transition-all outline-none placeholder:text-slate-400 disabled:opacity-60"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors">
                <Smile size={16} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!text.trim() || isSending}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-90 flex items-center justify-center shrink-0"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
