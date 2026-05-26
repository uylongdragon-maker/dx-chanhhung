"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendRoomMessage, createTaskFromMessage } from "@/app/actions/chat-rooms";
import { Send, Smile, Loader2, CheckSquare, X, Plus } from "lucide-react";
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
  setMessages: (val: Message[] | ((prev: Message[]) => Message[])) => void;
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
      const res = await createTaskFromMessage(title, "", assigneeId || null, dueDate || null, poolId);
      if (res.success) { toast.success("✅ Đã tạo việc vào Kanban!"); onClose(); }
      else toast.error("Có lỗi khi tạo việc");
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
          <CheckSquare size={13} className="text-[#7360f2]" /> Giao việc từ phòng
        </p>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <X size={12} className="text-slate-400" />
        </button>
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên công việc..."
        className="w-full px-3 py-2 mb-3 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-xl outline-none focus:ring-2 focus:ring-[#7360f2]/20" />
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
          className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-xl outline-none">
          <option value="">Người thực hiện...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-xl outline-none" />
      </div>
      <button onClick={handleCreate} disabled={isPending || !title.trim()}
        className="w-full py-2.5 bg-[#7360f2] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#5f4de0] disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-[#7360f2]/20">
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

  // Always hold latest setMessages in a ref to avoid stale closure in async callbacks
  const setMessagesRef = useRef(setMessages);
  useEffect(() => { setMessagesRef.current = setMessages; }, [setMessages]);

  // Track IDs already in the list to prevent duplicates
  const seenIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    // Reset seen IDs when switching rooms
    seenIdsRef.current = new Set(
      messages.filter(m => !m._optimistic).map(m => m.id)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Supabase Realtime ──────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room-messages-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message" },
        (payload) => {
          const row = payload.new as any;
          if (row.roomId !== roomId) return;
          // SKIP own messages — they are handled by optimistic UI + polling reconciliation
          // This prevents the race-condition duplicate where realtime fires before sendRoomMessage returns
          if (row.senderId === currentUser.id) return;
          if (seenIdsRef.current.has(row.id)) return;
          seenIdsRef.current.add(row.id);
          const senderUser = users?.find(u => u.id === row.senderId);
          const sender = senderUser
            ? { name: senderUser.name, avatarUrl: senderUser.avatarUrl }
            : null;
          setMessagesRef.current(prev => [...prev, { ...row, sender }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, users, currentUser.id]);

  // ── Polling Fallback: silently sync new messages ──────────
  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return; // Skip polling if tab is inactive
      try {
        const res = await fetch(`/api/chat/messages?roomId=${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        const fetched: Message[] = data.messages || [];
        const newOnes = fetched.filter(m => !seenIdsRef.current.has(m.id));
        if (newOnes.length === 0) return;
        newOnes.forEach(m => seenIdsRef.current.add(m.id));
        setMessagesRef.current(prev => {
          // Remove orphan optimistic messages, add new real ones, sort by time
          const realPrev = prev.filter(m => !m._optimistic);
          const allIds = new Set(realPrev.map(m => m.id));
          const unique = newOnes.filter(m => !allIds.has(m.id));
          if (unique.length === 0) return prev;
          return [...realPrev, ...unique].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      } catch { /* silently ignore */ }
    };

    const interval = setInterval(poll, 20_000); // 20s instead of 3s (WebSockets handle realtime)

    const handleVisibility = () => {
      if (!document.hidden) {
        poll(); // Immediate check on tab focus
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [roomId]);

  // ── Send message ───────────────────────────────────────────────────
  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || isSending) return;

    const optId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optId,
      content,
      senderId: currentUser.id,
      createdAt: new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })).toISOString(),
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
        setMessages(prev => prev.filter(m => m.id !== optId));
        setText(content);
        toast.error("Không gửi được tin nhắn");
      } else {
        // Replace optimistic with real record; add real ID to seenIds
        const realId = (res as any).messageId || optId;
        seenIdsRef.current.add(realId);
        setMessages(prev => prev.map(m =>
          m.id === optId ? { ...m, id: realId, _optimistic: false } : m
        ));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optId));
      setText(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-[#f4f3f9] dark:bg-[#0d0b18] border border-[#7360f2]/10 dark:border-slate-800/40 rounded-[2rem] shadow-xl overflow-hidden">

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 gap-3">
            <div className="text-4xl">💬</div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Chưa có tin nhắn nào</p>
            <p className="text-xs text-slate-400">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === currentUser.id;
          const displayName = m.sender?.name || (isMe ? currentUser.name || "Bạn" : "Thành viên");
          const initials = displayName?.substring(0, 2).toUpperCase() || "??";
          const time = new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
          const isTaskRef = m.type === "TASK_REF";

          return (
            <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${m._optimistic ? "opacity-70" : "opacity-100"} transition-opacity`}>
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white overflow-hidden"
                style={{ background: isMe ? "linear-gradient(135deg,#7360f2,#9b8bf7)" : "linear-gradient(135deg,#475569,#64748b)" }}>
                {m.sender?.avatarUrl ? <img src={m.sender.avatarUrl} className="w-full h-full object-cover" alt="" /> : initials}
              </div>

              <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{displayName}</span>}

                {isTaskRef ? (
                  <div className="px-3 py-2 rounded-2xl bg-[#7360f2]/10 dark:bg-[#7360f2]/20 border border-[#7360f2]/20 flex items-center gap-2">
                    <CheckSquare size={13} className="text-[#7360f2] shrink-0" />
                    <span className="text-xs font-bold text-[#7360f2] dark:text-[#a094f7]">{m.content}</span>
                  </div>
                ) : (
                  <div className={`px-4 py-2.5 rounded-[1.25rem] text-sm font-medium shadow-sm leading-relaxed ${
                    isMe
                      ? "bg-[#7360f2] text-white rounded-br-[0.25rem]"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-[0.25rem] border border-slate-100/50 dark:border-slate-800/40"
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
      <div className="p-3 bg-white/60 dark:bg-slate-900/60 border-t border-slate-200/20 dark:border-slate-800/30 backdrop-blur-xl">
        <div className="relative">
          {showTaskPanel && (
            <QuickTaskPanel prefill="" users={users} currentUser={currentUser} poolId={poolId} onClose={() => setShowTaskPanel(false)} />
          )}

          <form onSubmit={onSend} className="flex items-center gap-2">
            <button type="button" onClick={() => setShowTaskPanel(v => !v)} title="Giao việc"
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                showTaskPanel ? "bg-[#7360f2] text-white shadow-lg shadow-[#7360f2]/20" : "text-slate-400 hover:text-[#7360f2] hover:bg-[#7360f2]/10 dark:hover:bg-[#7360f2]/20"
              }`}>
              <CheckSquare size={16} />
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef} type="text" placeholder="Nhắn trong phòng..."
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(e as any); } }}
                disabled={isSending} autoComplete="off"
                className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl focus:ring-2 focus:ring-[#7360f2]/20 focus:border-[#7360f2]/40 text-sm font-medium text-slate-800 dark:text-slate-100 transition-all outline-none placeholder:text-slate-400 disabled:opacity-60"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors">
                <Smile size={16} />
              </button>
            </div>

            <button type="submit" disabled={!text.trim() || isSending}
              className="w-10 h-10 bg-[#7360f2] hover:bg-[#5f4de0] disabled:opacity-40 text-white rounded-xl shadow-lg shadow-[#7360f2]/20 transition-all active:scale-90 flex items-center justify-center shrink-0">
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
