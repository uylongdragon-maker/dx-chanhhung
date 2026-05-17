"use client";

import { useState, useTransition } from "react";
import { Plus, X, Hash, Loader2 } from "lucide-react";
import { createChatRoom } from "@/app/actions/chat-rooms";
import toast from "react-hot-toast";

const ROOM_ICONS = ["💬","🚀","🎨","📋","📢","🎯","💡","🔥","⚡","🌟","📊","🎉"];
const ROOM_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"
];

export default function CreateRoomModal({ userId, allUsers, onCreated }: { userId: string; allUsers: any[]; onCreated: (roomId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("💬");
  const [color, setColor] = useState("#3b82f6");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Vui lòng nhập tên phòng!"); return; }
    startTransition(async () => {
      const res = await createChatRoom(name.trim(), desc.trim(), icon, color, userId, selectedMembers);
      if (res.success && res.roomId) {
        toast.success(`Đã tạo phòng "${name}" 🎉`);
        setOpen(false);
        setName(""); setDesc(""); setSelectedMembers([]);
        onCreated(res.roomId);
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
      >
        <Plus size={12} /> Tạo phòng
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-white dark:bg-slate-900 w-full sm:max-w-sm rounded-[2.5rem] shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Hash size={16} className="text-blue-500" /> Tạo phòng chat mới
                </h3>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={14} className="text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Icon picker */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Icon phòng</label>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_ICONS.map(ic => (
                      <button key={ic} onClick={() => setIcon(ic)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110 ${icon === ic ? "ring-2 ring-blue-500 scale-110 bg-blue-50 dark:bg-blue-900/30" : "bg-slate-50 dark:bg-slate-800"}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Màu phòng</label>
                  <div className="flex gap-2">
                    {ROOM_COLORS.map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-lg transition-all hover:scale-110 ${color === c ? "scale-125 ring-2 ring-offset-2 ring-slate-400" : ""}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tên phòng *</label>
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    placeholder="VD: Dự án Tết 2026, Thiết kế website..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Mô tả (tuỳ chọn)</label>
                  <input
                    value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder="Phòng này dành cho..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Member selection */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center justify-between">
                    <span>Thành viên (Tuỳ chọn)</span>
                    <span className="text-blue-500">{selectedMembers.length} đã chọn</span>
                  </label>
                  <div className="max-h-32 overflow-y-auto pr-1 flex flex-col gap-1 scrollbar-hide">
                    {allUsers.filter((u: any) => u.id !== userId).map((u: any) => (
                      <label key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <input type="checkbox" className="w-4 h-4 rounded text-blue-600" 
                          checked={selectedMembers.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedMembers([...selectedMembers, u.id]);
                            else setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                          }} />
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-[8px] text-white font-black overflow-hidden shrink-0">
                          {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" /> : u.name?.substring(0,2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: color + "20" }}>
                    {icon}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{name || "Tên phòng..."}</p>
                    <p className="text-[10px] text-slate-400">{desc || "Mô tả phòng..."}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button onClick={() => setOpen(false)} className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-sm hover:bg-slate-200 transition-colors">
                    Huỷ
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isPending || !name.trim()}
                    className="py-3 rounded-xl font-black text-sm text-white shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: color }}
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : icon}
                    Tạo phòng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
