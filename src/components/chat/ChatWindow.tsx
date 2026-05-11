"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { sendMessage } from "@/app/workspace/chat/actions";
import { Send, Smile, Loader2 } from "lucide-react";

interface Message {
  id: string;
  content: string | null;
  senderId: string;
  createdAt: string | Date;
  type: string;
  sender?: { name: string | null; avatarUrl: string | null } | null;
  _optimistic?: boolean; // local flag — tin nhắn chưa được server xác nhận
}

export default function ChatWindow({ initialMessages, currentUser }: {
  initialMessages: any[];
  currentUser: any;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Auto scroll xuống khi có tin mới
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Supabase Realtime — nhận tin nhắn từ người khác
  useEffect(() => {
    const channel = supabase
      .channel("chat:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message" },
        async (payload) => {
          // Bỏ qua tin nhắn của chính mình (đã được optimistic update rồi)
          if (payload.new.senderId === currentUser.id) return;

          // Fetch thông tin người gửi
          const { data: sender } = await supabase
            .from("User")
            .select("name, avatarUrl")
            .eq("id", payload.new.senderId)
            .single();

          setMessages(prev => [
            ...prev,
            { ...payload.new as any, sender }
          ]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || isSending) return;

    // ── Optimistic update: hiện tin nhắn ngay lập tức ──
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      content,
      senderId: currentUser.id,
      createdAt: new Date().toISOString(),
      type: "TEXT",
      sender: {
        name: currentUser.name || currentUser.email,
        avatarUrl: currentUser.avatarUrl || null,
      },
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setText("");
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("senderId", currentUser.id);
      const result = await sendMessage(formData);

      if (!result.success) {
        // Rollback nếu server thất bại
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        setText(content);
      } else {
        // Xóa flag optimistic khi thành công
        setMessages(prev =>
          prev.map(m => m.id === optimisticMsg.id ? { ...m, _optimistic: false } : m)
        );
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setText(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(e as any);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-white/30 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/40 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden">

      {/* ─── Messages Area ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40 gap-3">
            <div className="text-5xl">💬</div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Chưa có tin nhắn nào</p>
            <p className="text-xs text-slate-400">Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.senderId === currentUser.id;
          const displayName = m.sender?.name || (isMe ? (currentUser.name || 'Bạn') : 'Thành viên');
          const initials = displayName?.substring(0, 2).toUpperCase() || '??';
          const time = new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={m.id} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"} ${m._optimistic ? 'opacity-70' : 'opacity-100'} transition-opacity`}>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white shadow-sm overflow-hidden"
                style={{ background: isMe ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'linear-gradient(135deg, #475569, #64748b)' }}>
                {m.sender?.avatarUrl
                  ? <img src={m.sender.avatarUrl} className="w-full h-full object-cover" alt="" />
                  : initials
                }
              </div>

              {/* Bubble */}
              <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                {/* Sender name (only for others) */}
                {!isMe && (
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{displayName}</span>
                )}

                <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
                }`}>
                  {m.content}
                  {m._optimistic && (
                    <Loader2 size={10} className="inline ml-2 animate-spin opacity-60" />
                  )}
                </div>

                <span className={`text-[9px] mt-1 font-bold text-slate-400 tracking-widest ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Input Area ─── */}
      <div className="p-4 bg-white/50 dark:bg-slate-900/50 border-t border-white/60 dark:border-slate-800/60 backdrop-blur-xl">
        <form onSubmit={onSend} className="flex items-center gap-3">
          {/* Current user avatar */}
          <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white shadow-sm overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            {currentUser.avatarUrl
              ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" alt="" />
              : (currentUser.name || currentUser.email || '?').substring(0, 2).toUpperCase()
            }
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={`Nhắn gì đó, ${currentUser.name?.split(' ').slice(-1)[0] || 'bạn'}...`}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              autoComplete="off"
              className="w-full pl-5 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm font-medium text-slate-800 dark:text-slate-100 transition-all outline-none placeholder:text-slate-400 disabled:opacity-60"
            />
            <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors">
              <Smile size={18} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isSending}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-90 flex items-center justify-center shrink-0"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
