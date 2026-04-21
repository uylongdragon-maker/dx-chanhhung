"use client";

import { useState } from "react";
import { changeOwnPassword } from "@/app/actions/user";
import { Settings, Lock, Smartphone, Bell, Fingerprint, ShieldCheck, Loader2, ChevronRight, Zap, CheckCircle2 } from "lucide-react";

export default function MemberSettingsPage() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  
  // States for UX simulation
  const [faceId, setFaceId] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  
  const handleRegisterFaceID = async () => {
    try {
      setMessage('⏳ Đang yêu cầu quét sinh trắc học...');
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32), // Mã ngẫu nhiên bảo mật
          rp: { name: "DX Chanh Hung", id: typeof window !== 'undefined' ? window.location.hostname : 'localhost' },
          user: {
            id: new Uint8Array(16),
            name: "Member",
            displayName: "Thành viên Ban Truyền thông"
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          authenticatorSelection: { userVerification: "required" },
          timeout: 60000,
        }
      });

      if (credential) {
        setMessage('✅ Kích hoạt FaceID/Vân tay thành công!');
        setFaceId(true);
      }
    } catch (err) {
      console.error("WebAuthn Error:", err);
      setMessage('❌ Đã hủy hoặc thiết bị không hỗ trợ sinh trắc học.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setMessage("❌ Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPass.length < 6) {
      setMessage("❌ Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    
    setIsPending(true);
    setMessage("⏳ Đang xử lý...");
    
    const result = await changeOwnPassword(oldPass, newPass);
    
    setIsPending(false);
    setMessage(result.message);
    
    if (result.success) {
      setOldPass(""); 
      setNewPass(""); 
      setConfirmPass("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 font-black text-[10px] uppercase tracking-widest leading-none">
            <Zap size={12} className="fill-current" />
            System Preferences
          </div>
          <h2 className="text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">
            Cài đặt <span className="text-blue-600">Hệ thống</span>
          </h2>
          <p className="text-slate-500 font-semibold italic text-lg max-w-xl leading-relaxed">
            Tinh chỉnh trải nghiệm làm việc và bảo mật tài khoản nòng cốt của bạn.
          </p>
        </div>
        <div className="hidden md:block">
            <div className="p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/60 dark:border-slate-800/60 shadow-xl">
                 <Settings size={40} className="text-slate-300 dark:text-slate-700 animate-[spin_10s_linear_infinite]" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: Security (7 Columns) */}
        <div className="lg:col-span-7 space-y-10">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/80 dark:border-slate-800/80 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group transition-all hover:bg-white/50 dark:hover:bg-slate-900/50">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transition-all duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-4 tracking-tight uppercase leading-none">
                  <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/40">
                    <Lock size={20} />
                  </div>
                  Đổi mật khẩu
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Bảo mật cao</span>
              </div>
              
              <form onSubmit={handlePasswordChange} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    value={oldPass} 
                    onChange={e => setOldPass(e.target.value)} 
                    placeholder="••••••••"
                    required
                    className="w-full px-8 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      value={newPass} 
                      onChange={e => setNewPass(e.target.value)} 
                      placeholder="Min 6 characters"
                      required
                      className="w-full px-8 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận lại</label>
                    <input 
                      type="password" 
                      value={confirmPass} 
                      onChange={e => setConfirmPass(e.target.value)} 
                      placeholder="••••••••"
                      required
                      className="w-full px-8 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                    />
                  </div>
                </div>

                {message && (
                  <div className={`p-5 rounded-3xl text-sm font-black flex items-center gap-4 animate-in fade-in zoom-in-95 border-2 ${
                    message.includes("❌") 
                    ? "bg-red-500/5 text-red-600 border-red-500/10" 
                    : message.includes("✅")
                    ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                    : "bg-blue-500/5 text-blue-600 border-blue-500/10"
                  }`}>
                    {message.includes("⏳") && <Loader2 size={18} className="animate-spin" />}
                    {message}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_60px_rgba(37,99,235,0.4)] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-4 disabled:opacity-50 group/save"
                >
                  {isPending ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} className="group-hover/save:rotate-12 transition-transform" />}
                  Lưu thay đổi bảo mật
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: App & Comfort (5 Columns) */}
        <div className="lg:col-span-5 space-y-10">
          {/* App Settings Card */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/80 dark:border-slate-800/80 p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-4 mb-10 uppercase tracking-tight leading-none">
              <div className="p-3 bg-indigo-600/10 rounded-2xl text-indigo-600">
                <Smartphone size={20} />
              </div>
              Trải nghiệm PWA
            </h3>
            
            <div className="space-y-4">
                {/* Switch FaceID */}
                <div className="w-full flex justify-between items-center p-6 rounded-[2rem] border border-white/40 bg-white/20 dark:bg-slate-800/20 hover:bg-white/40 transition-all text-left">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-600 shadow-inner">
                        <Fingerprint size={24} />
                    </div>
                    <div>
                        <p className="font-black text-sm text-slate-800 dark:text-slate-100 tracking-tight leading-none">Sinh trắc học</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">FaceID / TouchID</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRegisterFaceID}
                    disabled={faceId}
                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      faceId 
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                      : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95"
                    }`}
                  >
                    {faceId ? (
                        <span className="flex items-center gap-2">
                           <CheckCircle2 size={12} /> Đã bật
                        </span>
                    ) : "Cài đặt ngay"}
                  </button>
                </div>

                {/* Switch Notifications */}
                <button 
                  onClick={() => setPushNotif(!pushNotif)}
                  className="w-full flex justify-between items-center p-6 rounded-[2rem] border border-white/40 bg-white/20 dark:bg-slate-800/20 hover:bg-white/40 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600 shadow-inner">
                        <Bell size={24} />
                    </div>
                    <div>
                        <p className="font-black text-sm text-slate-800 dark:text-slate-100 tracking-tight leading-none">Thông báo đẩy</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest italic">Rung khi có việc mới</p>
                    </div>
                  </div>
                  <div className={`w-14 h-8 rounded-full relative transition-colors duration-500 shadow-inner ${pushNotif ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-500 shadow-md ${pushNotif ? 'left-7' : 'left-1'}`}></div>
                  </div>
                </button>
            </div>

            {/* Notification Sound */}
            <div className="mt-10 pt-4 border-t border-white/20">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4 block">Âm thanh hệ thống</label>
              <div className="relative group/sel">
                <select className="w-full bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-black rounded-2xl px-6 py-5 focus:outline-none focus:ring-8 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer">
                  <option>Tiếng Ting (Tinh tế)</option>
                  <option>Chuông ngân (Mặc định)</option>
                  <option>Epic Horn (Hào hùng)</option>
                  <option>Pop Kính (Glassmorphism)</option>
                </select>
                <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>
          
          {/* Support/Footer Card */}
          <div className="p-10 bg-slate-900 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-1000">
                <ShieldCheck size={120} />
             </div>
             <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-blue-500">Trạm hỗ trợ</p>
               <h4 className="text-xl font-black tracking-tight mb-6 leading-tight max-w-[200px]">Bạn gặp sự cố tài khoản?</h4>
               <button className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl">
                  Gửi tín hiệu SOS
                  <ChevronRight size={14} />
               </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
