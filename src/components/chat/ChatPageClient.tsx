"use client";

import { useState, useEffect, useTransition } from "react";
import { MessageSquare, Hash, Users, Plus, Zap, Search, ChevronRight, LogIn, Settings } from "lucide-react";
import RoomChatWindow from "./ChatWindow";
import CreateRoomModal from "./CreateRoomModal";
import RoomSettingsModal from "./RoomSettingsModal";
import { joinChatRoom } from "@/app/actions/chat-rooms";
import { prisma } from "@/utils/prisma";
import toast from "react-hot-toast";

interface Room {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string | null;
  isDefault: boolean;
  createdById: string;
  members: any[];
  messages: any[];
}

interface Props {
  currentUser: any;
  initialRooms: Room[];
  initialMessages: any[];
  defaultRoomId: string | null;
  poolId: string;
  allUsers: any[];
}

export default function ChatPageClient({
  currentUser, initialRooms, initialMessages, defaultRoomId, poolId, allUsers
}: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(defaultRoomId);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Client-side message caching to eliminate loading spinners on revisit
  const [messageCache, setMessageCache] = useState<Record<string, any[]>>({
    [defaultRoomId || ""]: initialMessages
  });

  const activeRoom = rooms.find(r => r.id === activeRoomId) || null;
  const isMember = (room: Room) => room.members.some(m => m.userId === currentUser.id);

  // Derive messages from messageCache based on activeRoomId
  const messages = activeRoomId ? (messageCache[activeRoomId] || []) : [];

  // setMessages acts as a wrapper that updates the activeRoomId entry in messageCache state directly!
  const setMessages = (val: any[] | ((prev: any[]) => any[])) => {
    if (!activeRoomId) return;
    setMessageCache(prev => {
      const current = prev[activeRoomId] || [];
      const updated = typeof val === "function" ? val(current) : val;
      return { ...prev, [activeRoomId]: updated };
    });
  };

  const switchRoom = async (roomId: string) => {
    if (roomId === activeRoomId) return;

    setActiveRoomId(roomId);

    if (messageCache[roomId]) {
      // Background silent refetch to refresh any missed messages under-the-hood
      try {
        const res = await fetch(`/api/chat/messages?roomId=${roomId}`);
        const data = await res.json();
        const latestMsgs = data.messages || [];
        setMessageCache(prev => ({ ...prev, [roomId]: latestMsgs }));
      } catch {}
    } else {
      // Slow block-spinner path only for unvisited rooms
      setLoadingRoom(true);
      try {
        const res = await fetch(`/api/chat/messages?roomId=${roomId}`);
        const data = await res.json();
        const latestMsgs = data.messages || [];
        setMessageCache(prev => ({ ...prev, [roomId]: latestMsgs }));
      } catch {
        setMessageCache(prev => ({ ...prev, [roomId]: [] }));
      }
      setLoadingRoom(false);
    }
  };

  const handleJoin = (roomId: string) => {
    startTransition(async () => {
      const res = await joinChatRoom(roomId, currentUser.id);
      if (res.success) {
        toast.success("Đã tham gia phòng!");
        // Reload rooms
        window.location.reload();
      } else {
        toast.error("Có lỗi khi tham gia");
      }
    });
  };

  const handleRoomCreated = (roomId: string) => {
    // Reload page to get new room in list
    window.location.href = `/workspace/chat`;
  };

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );
  const myRooms = filteredRooms.filter(r => isMember(r));
  const otherRooms = filteredRooms.filter(r => !isMember(r));

  const lastMsg = (room: Room) => {
    const m = room.messages?.[0];
    if (!m) return null;
    return {
      text: m.content?.substring(0, 40) || "...",
      sender: m.sender?.name?.split(" ").slice(-1)[0] || "",
      time: new Date(m.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-0 animate-in fade-in duration-500">
      {/* Page Header - Mobile only */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-600" /> Chat
        </h1>
      </div>

      <div className="flex flex-grow gap-4 min-h-0 relative">
        {/* ── Room Sidebar ── */}
        <div className={`${activeRoomId ? 'hidden sm:flex' : 'flex w-full sm:w-64 lg:w-72'} flex-col shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 rounded-[2rem] shadow-lg overflow-hidden`}>
          {/* Sidebar header */}
          <div className="p-4 border-b border-slate-100/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare size={13} className="text-[#7360f2]" /> Kênh Chat
              </h2>
              <CreateRoomModal userId={currentUser.id} allUsers={allUsers} onCreated={handleRoomCreated} />
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm phòng..."
                className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-white/60 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40 rounded-xl outline-none focus:ring-2 focus:ring-[#7360f2]/20"
              />
            </div>
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {/* My Rooms */}
            {myRooms.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1.5">Kênh của tôi</p>
                {myRooms.map(room => {
                  const last = lastMsg(room);
                  const isActive = room.id === activeRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => switchRoom(room.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-3 rounded-xl text-left transition-all mb-1 ${
                        isActive
                          ? "bg-[#7360f2] text-white shadow-md shadow-[#7360f2]/20"
                          : "hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"}`}
                        style={!isActive ? { backgroundColor: room.color + "20" } : {}}>
                        {room.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black truncate ${isActive ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>{room.name}</p>
                        {last && (
                          <p className={`text-[9px] truncate mt-0.5 ${isActive ? "text-white/70" : "text-slate-400"}`}>
                            {last.sender}: {last.text}
                          </p>
                        )}
                      </div>
                      {last && (
                        <span className={`text-[8px] font-bold shrink-0 ${isActive ? "text-white/60" : "text-slate-400"}`}>
                          {last.time}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Other rooms to join */}
            {otherRooms.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1.5">Khám phá kênh</p>
                {otherRooms.map(room => (
                  <div key={room.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 mb-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 bg-slate-50 dark:bg-slate-800"
                      style={{ backgroundColor: room.color + "15" }}>
                      {room.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{room.name}</p>
                      <p className="text-[9px] text-slate-400">{room.members.length} thành viên</p>
                    </div>
                    <button
                      onClick={() => handleJoin(room.id)}
                      disabled={isPending}
                      className="px-2 py-1 bg-[#7360f2]/10 dark:bg-[#7360f2]/20 text-[#7360f2] text-[9px] font-black rounded-lg hover:bg-[#7360f2]/20 transition-colors flex items-center gap-1"
                    >
                      <LogIn size={10} /> Tham gia
                    </button>
                  </div>
                ))}
              </div>
            )}

            {filteredRooms.length === 0 && (
              <div className="flex flex-col items-center py-8 opacity-40 text-center">
                <Hash size={24} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Không tìm thấy phòng</p>
              </div>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="p-3 border-t border-slate-100/40 dark:border-slate-800/40 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#7360f2] to-[#9b8bf7] flex items-center justify-center text-[10px] text-white font-black shrink-0">
              {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" alt="" /> : currentUser.name?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-[9px] text-slate-400 font-bold">{currentUser.role}</p>
            </div>
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={`${activeRoomId ? 'flex' : 'hidden sm:flex'} flex-1 flex-col min-w-0`}>
          {activeRoom ? (
            <>
              {/* Room header */}
              <div className="flex items-center gap-3 mb-3 px-1">
                {/* Back button on mobile */}
                <button
                  onClick={() => setActiveRoomId(null)}
                  className="sm:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center shrink-0"
                >
                  <ChevronRight className="rotate-180" size={16} strokeWidth={2.5} />
                </button>

                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: activeRoom.color + "20" }}>
                  {activeRoom.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-slate-800 dark:text-slate-100 truncate">{activeRoom.name}</h2>
                  <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Users size={9} /> {activeRoom.members.length} thành viên
                    {activeRoom.description && <> · <span className="truncate">{activeRoom.description}</span></>}
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-1">
                  {activeRoom.members.slice(0, 4).map((m: any, i: number) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-gradient-to-tr from-[#7360f2] to-[#9b8bf7] flex items-center justify-center text-[9px] text-white font-black -ml-1 first:ml-0 overflow-hidden"
                      title={m.user?.name || ""}>
                      {m.user?.avatarUrl ? <img src={m.user.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.user?.name?.substring(0,2).toUpperCase()}
                    </div>
                  ))}
                  {activeRoom.members.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] text-slate-500 font-black -ml-1">
                      +{activeRoom.members.length - 4}
                    </div>
                  )}
                </div>
                <RoomSettingsModal room={activeRoom} currentUser={currentUser} allUsers={allUsers} />
              </div>

              {loadingRoom ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="flex-1">
                  <RoomChatWindow
                    key={activeRoom.id}
                    messages={messages}
                    setMessages={setMessages}
                    currentUser={currentUser}
                    roomId={activeRoom.id}
                    poolId={poolId}
                    users={allUsers}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-60">
              <div className="w-20 h-20 rounded-full bg-[#7360f2]/10 dark:bg-[#7360f2]/20 flex items-center justify-center text-4xl">
                💬
              </div>
              <div>
                <p className="font-black text-slate-500 uppercase tracking-widest text-sm">Chọn một phòng để bắt đầu</p>
                <p className="text-xs text-slate-400 mt-1">hoặc tạo phòng mới để cộng tác theo nhóm</p>
              </div>
              <CreateRoomModal userId={currentUser.id} allUsers={allUsers} onCreated={handleRoomCreated} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
