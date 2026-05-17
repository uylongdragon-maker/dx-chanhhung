"use client";

import { useState, useTransition } from "react";
import { Settings, X, UserMinus, UserPlus, Trash2, Shield, Loader2 } from "lucide-react";
import { addUsersToRoom, leaveChatRoom, deleteChatRoom } from "@/app/actions/chat-rooms";
import toast from "react-hot-toast";

interface Props {
  room: any;
  currentUser: any;
  allUsers: any[];
}

export default function RoomSettingsModal({ room, currentUser, allUsers }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const isCreator = room.createdById === currentUser.id;
  const isDefault = room.isDefault;

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) return;
    startTransition(async () => {
      const res = await addUsersToRoom(room.id, selectedUsers);
      if (res.success) {
        toast.success("Đã thêm thành viên!");
        setSelectedUsers([]);
        window.location.reload();
      } else {
        toast.error(res.error || "Có lỗi xảy ra");
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    if (confirm("Xoá thành viên này khỏi phòng?")) {
      startTransition(async () => {
        const res = await leaveChatRoom(room.id, userId);
        if (res.success) {
          toast.success("Đã xoá thành viên!");
          window.location.reload();
        } else {
          toast.error(res.error || "Có lỗi xảy ra");
        }
      });
    }
  };

  const handleDeleteRoom = () => {
    if (confirm("Bạn có chắc chắn muốn xoá phòng này? Toàn bộ tin nhắn sẽ bị mất vĩnh viễn!")) {
      startTransition(async () => {
        const res = await deleteChatRoom(room.id, currentUser.id);
        if (res.success) {
          toast.success("Đã xoá phòng!");
          window.location.href = "/workspace/chat";
        } else {
          toast.error(res.error || "Có lỗi xảy ra");
        }
      });
    }
  };

  const memberIds = room.members.map((m: any) => m.userId);
  const nonMembers = allUsers.filter(u => !memberIds.includes(u.id));

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
        <Settings size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings size={16} className="text-blue-500" /> Cài đặt phòng
              </h3>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X size={14} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {/* Add Members Section */}
              {!isDefault && nonMembers.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><UserPlus size={12} /> Thêm thành viên</h4>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {nonMembers.map((u: any) => (
                      <label key={u.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                        <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={e => {
                          if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                          else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                        }} className="w-4 h-4 rounded text-blue-600" />
                        <span className="text-sm font-bold flex-1">{u.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedUsers.length > 0 && (
                    <button onClick={handleAddMembers} disabled={isPending} className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2">
                      {isPending ? <Loader2 size={14} className="animate-spin" /> : "Thêm vào phòng"}
                    </button>
                  )}
                </div>
              )}

              {/* Member List */}
              <div className="mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thành viên hiện tại ({room.members.length})</h4>
                <div className="flex flex-col gap-2">
                  {room.members.map((m: any) => (
                    <div key={m.userId} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black overflow-hidden">
                          {m.user?.avatarUrl ? <img src={m.user.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.user?.name?.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                            {m.user?.name}
                            {m.userId === room.createdById && (
                              <span title="Trưởng phòng" className="inline-flex">
                                <Shield size={10} className="text-blue-500" />
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Allow Creator to remove others, or let user leave by themselves */}
                      {(!isDefault && (isCreator && m.userId !== currentUser.id)) && (
                        <button onClick={() => handleRemoveMember(m.userId)} disabled={isPending} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                          <UserMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              {!isDefault && isCreator && (
                <div className="pt-4 border-t border-rose-100 dark:border-rose-900/30">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1"><Trash2 size={12} /> Khu vực nguy hiểm</h4>
                  <p className="text-[11px] text-slate-500 mb-3">Hành động này không thể hoàn tác. Toàn bộ dữ liệu tin nhắn sẽ bị xoá khỏi hệ thống.</p>
                  <button onClick={handleDeleteRoom} disabled={isPending} className="w-full py-2 bg-rose-100 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-200 transition-colors rounded-xl text-xs font-black flex justify-center items-center gap-2">
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : "Xoá phòng này"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
