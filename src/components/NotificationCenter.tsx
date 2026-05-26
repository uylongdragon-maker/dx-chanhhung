"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, MessageSquare, CheckSquare, Calendar, AlertCircle, Check } from "lucide-react";

interface Notification {
  id: string;
  type: "message" | "task" | "meeting" | "reminder";
  title: string;
  body: string;
  href: string;
  createdAt: number; // timestamp ms
  read: boolean;
}

const STORAGE_KEY = "ch_notifications";
const SEEN_KEY = "ch_seen_items";

function getStoredNotifs(): Notification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function getSeenItems(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
}

export default function NotificationCenter({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => !n.read).length;

  const lastCheckRef = useRef<number>(Date.now() - 120_000); // init to 2 mins ago
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Init from localStorage
  useEffect(() => {
    setNotifs(getStoredNotifs());
    seenRef.current = getSeenItems();

    // Unlock AudioContext on first user interaction to bypass browser autoplay blocks
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });
    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  const saveNotifs = (n: Notification[]) => {
    setNotifs(n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(n.slice(-50))); // keep last 50
  };

  const playNotificationSound = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // ignore audio errors
    }
  };

  const addNotif = useCallback((notif: Omit<Notification, "id" | "createdAt" | "read">) => {
    const id = `${notif.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newNotif: Notification = { ...notif, id, createdAt: Date.now(), read: false };
    setNotifs(prev => {
      const updated = [newNotif, ...prev].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Browser push notification if tab not focused
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      new Notification(notif.title, { body: notif.body, icon: "/icon-192.png" });
    }
  }, []);

  // Request browser notification permission once
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Poll for new messages, tasks, meetings
  useEffect(() => {
    if (!userId) return;

    const poll = async () => {
      if (document.hidden) return; // Skip polling if tab is inactive
      try {
        const since = new Date(lastCheckRef.current).toISOString();
        const res = await fetch(`/api/notifications?userId=${userId}&since=${encodeURIComponent(since)}`);
        
        if (!res.ok) return;
        lastCheckRef.current = Date.now(); // update check time ONLY on success
        
        const data = await res.json();
        let added = false;

        // New messages
        for (const msg of data.newMessages || []) {
          const key = `msg-${msg.id}`;
          if (seenRef.current.has(key)) continue;
          seenRef.current.add(key);
          added = true;
          addNotif({
            type: "message",
            title: `💬 Tin nhắn mới trong ${msg.roomName}`,
            body: `${msg.senderName}: ${msg.content?.substring(0, 60)}`,
            href: "/workspace/chat",
          });
        }

        // New tasks assigned to me
        for (const task of data.newTasks || []) {
          const key = `task-${task.id}`;
          if (seenRef.current.has(key)) continue;
          seenRef.current.add(key);
          added = true;
          addNotif({
            type: "task",
            title: `✅ Nhiệm vụ mới được giao`,
            body: task.title,
            href: "/workspace/kanban",
          });
        }

        // Upcoming meetings (within 30 min)
        for (const meeting of data.upcomingMeetings || []) {
          const key = `meet-${meeting.id}`;
          if (seenRef.current.has(key)) continue;
          seenRef.current.add(key);
          added = true;
          addNotif({
            type: "meeting",
            title: `📅 Cuộc họp sắp bắt đầu`,
            body: `${meeting.topic} — ${meeting.startTime}`,
            href: "/workspace/meetings",
          });
        }

        // Overdue tasks reminder
        for (const task of data.overdueTasks || []) {
          const key = `overdue-${task.id}-${new Date().toDateString()}`;
          if (seenRef.current.has(key)) continue;
          seenRef.current.add(key);
          added = true;
          addNotif({
            type: "reminder",
            title: `⚠️ Công việc quá hạn`,
            body: task.title,
            href: "/workspace/kanban",
          });
        }

        if (added) {
           playNotificationSound();
        }

        // Persist seenItems
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seenRef.current].slice(-500)));
      } catch { /* silent */ }
    };

    poll(); // immediate first run
    const interval = setInterval(poll, 30_000); // every 30s instead of 10s

    const handleVisibility = () => {
      if (!document.hidden) {
        poll(); // Immediate check when returning to this tab
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, addNotif]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = () => {
    saveNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    saveNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAll = () => { saveNotifs([]); };

  const iconFor = (type: Notification["type"]) => {
    const c: Record<string, any> = {
      message: <MessageSquare size={13} className="text-blue-500" />,
      task: <CheckSquare size={13} className="text-emerald-500" />,
      meeting: <Calendar size={13} className="text-purple-500" />,
      reminder: <AlertCircle size={13} className="text-rose-500" />,
    };
    return c[type];
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return "Vừa xong";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
    return `${Math.floor(diff / 86_400_000)} ngày trước`;
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Bell size={16} className="text-slate-600 dark:text-slate-300" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-[-1rem] sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] shadow-2xl z-[300] overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Bell size={14} className="text-blue-500" />
              Thông báo
              {unread > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {notifs.length > 0 && (
                <button onClick={clearAll} className="p-1 text-slate-400 hover:text-rose-500 transition-colors" title="Xóa tất cả">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2 opacity-40">
                <Bell size={28} className="text-slate-300" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chưa có thông báo</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifs.map(n => (
                  <a
                    key={n.id}
                    href={n.href}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${n.read ? "opacity-60" : ""}`}
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {iconFor(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{n.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
