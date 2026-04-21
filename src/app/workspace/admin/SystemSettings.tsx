"use client";

import { useState, useTransition } from "react";
import { Loader2, Fingerprint, Bell, Sparkles, Key, Eye, EyeOff, ShieldCheck, Zap } from "lucide-react";
import { updateGeminiKey } from "@/app/actions/admin";

interface SystemSettingsProps {
  currentGeminiKey: string;
  adminId: string;
}

export default function SystemSettings({ currentGeminiKey, adminId }: SystemSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [geminiKey, setGeminiKey] = useState(currentGeminiKey);
  const [showKey, setShowKey] = useState(false);
  
  // UX Simulation
  const [biometrics, setBiometrics] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const handleUpdateKey = async () => {
    if (!geminiKey) return;
    
    startTransition(async () => {
      const result = await updateGeminiKey(adminId, geminiKey);
      if (result.success) {
        alert("Đã cập nhật Gemini API Key mới!");
      } else {
        alert("Lỗi khi cập nhật Key.");
      }
    });
  };

  return (
    <div className="mt-16 space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
      <div className="flex flex-col gap-2 px-2">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                <ShieldCheck size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Infrastructure</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
          Cấu hình Hệ thống
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Gemini API Key Management */}
        <div className="lg:col-span-7 bg-white/40 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 p-10 rounded-[3.5rem] shadow-2xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} className="text-blue-500" />
          </div>
          
          <div className="relative z-10">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-xl tracking-tight flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 rounded-xl text-white">
                        <Key size={18} />
                    </div>
                    Neural Engine Key
                </h4>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold italic max-w-md">Duy trì hoạt động cho Trợ lý ảo AI và các tính năng phân tích dữ liệu tự động của Ban Truyền thông.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600">
                <Zap size={10} className="fill-current" />
                <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors">
                    <ShieldCheck size={18} />
                </div>
                <input
                  type={showKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Nhập Gemini API Key mới..."
                  className="w-full bg-white/60 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm font-black rounded-3xl pl-16 pr-16 py-5 focus:outline-none focus:ring-8 focus:ring-blue-500/5 transition-all font-mono"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-500 transition-all"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              <button 
                onClick={handleUpdateKey}
                disabled={isPending || geminiKey === currentGeminiKey}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 group/btn"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} className="fill-current group-hover:scale-125 transition-transform" />}
                Xác thực & Cập nhật Key
              </button>
            </div>
          </div>
        </div>

        {/* Global Access Controls */}
        <div className="lg:col-span-5 space-y-8">
            <div className="bg-white/40 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 p-8 rounded-[3.5rem] shadow-xl space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 mb-4">Cấu hình bảo mật</h4>
                
                {/* Sinh trắc học */}
                <button 
                  onClick={() => setBiometrics(!biometrics)}
                  className="w-full flex justify-between items-center p-6 rounded-[2rem] border border-white/40 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all text-left shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 shadow-inner">
                            <Fingerprint size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs tracking-tight">Xác thực 2 lớp</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-bold">Biometric Passkey</p>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full relative transition-colors duration-500 shadow-inner ${biometrics ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-500 shadow-md ${biometrics ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </button>

                {/* Thông báo đẩy */}
                <button 
                  onClick={() => setPushNotif(!pushNotif)}
                  className="w-full flex justify-between items-center p-6 rounded-[2rem] border border-white/40 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all text-left shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs tracking-tight">Thông báo Global</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-bold italic">Push notifications</p>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full relative transition-colors duration-500 shadow-inner ${pushNotif ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-500 shadow-md ${pushNotif ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </button>
            </div>

            {/* Warning Card */}
            <div className="p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-[3rem] shadow-inner">
                <div className="flex gap-4">
                    <div className="p-3 bg-amber-500 rounded-2xl text-white h-fit shadow-lg shadow-amber-500/20">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h5 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-2 tracking-tight">Quyền hạn tối cao</h5>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-bold italic uppercase tracking-wider">Mọi thay đổi tại đây sẽ ảnh hưởng trực tiếp đến tất cả 11 thành viên và hiệu suất của Gemini AI.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
