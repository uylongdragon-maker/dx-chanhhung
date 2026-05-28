"use client";

import { useState, useEffect } from "react";
import { changeOwnPassword } from "@/app/actions/user";
import { updateProfile } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { 
  Settings, Lock, Smartphone, Bell, Fingerprint, ShieldCheck, 
  Loader2, ChevronRight, Zap, CheckCircle2, Download, HelpCircle,
  User, Phone, MapPin, Sparkles, Award, Camera, Briefcase
} from "lucide-react";

export default function SettingsClient({ user }: { user: any }) {
  // Profile States
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [unit, setUnit] = useState(user?.unit || "");
  const [position, setPosition] = useState(user?.position || "Thành viên");
  const [roles, setRoles] = useState(user?.roles || "");

  const [isPendingProfile, setIsPendingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Security States
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isPendingSec, setIsPendingSec] = useState(false);
  const [secMessage, setSecMessage] = useState("");
  
  // States for UX simulation
  const [faceId, setFaceId] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);

  // PWA installation states & hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const presets = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Gizmo"
  ];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // Fallback/iOS tutorial if no prompt available
      setShowInstallGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Prompt Outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };
  
  const handleRegisterFaceID = async () => {
    try {
      setSecMessage('⏳ Đang yêu cầu quét sinh trắc học...');
      
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
        setSecMessage('✅ Kích hoạt FaceID/Vân tay thành công!');
        setFaceId(true);
      }
    } catch (err) {
      console.error("WebAuthn Error:", err);
      setSecMessage('❌ Đã hủy hoặc thiết bị không hỗ trợ sinh trắc học.');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPendingProfile(true);
    setProfileMessage("⏳ Đang xử lý cập nhật hồ sơ...");

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("name", name);
      formData.append("avatarUrl", avatarUrl);
      formData.append("phone", phone);
      formData.append("unit", unit);
      formData.append("position", position);
      formData.append("roles", roles);

      const result = await updateProfile(formData);
      setIsPendingProfile(false);
      
      if (result.success) {
        setProfileMessage("✅ Cập nhật thông tin hồ sơ thành công! 🎉");
      } else {
        setProfileMessage(`❌ Lỗi: ${result.error}`);
      }
    } catch (err: any) {
      setIsPendingProfile(false);
      setProfileMessage(`❌ Hệ thống gặp sự cố: ${err.message}`);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setProfileMessage("⏳ Đang tải ảnh đại diện lên máy chủ...");

    try {
      const supabase = createClient();
      const fileName = `avatars/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (error) {
        throw new Error(error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      setProfileMessage("✅ Tải ảnh đại diện lên thành công! Nhớ bấm 'Cập nhật thông tin hồ sơ' để lưu.");
    } catch (err: any) {
      setProfileMessage(`❌ Tải ảnh thất bại: ${err.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setSecMessage("❌ Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPass.length < 6) {
      setSecMessage("❌ Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    
    setIsPendingSec(true);
    setSecMessage("⏳ Đang xử lý...");
    
    const result = await changeOwnPassword(oldPass, newPass);
    
    setIsPendingSec(false);
    setSecMessage(result.message);
    
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
            Tinh chỉnh hồ sơ cá nhân, đổi mật khẩu bảo mật và trải nghiệm ứng dụng.
          </p>
        </div>
        <div className="hidden md:block">
            <div className="p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/60 dark:border-slate-800/60 shadow-xl">
                 <Settings size={40} className="text-slate-300 dark:text-slate-700 animate-[spin_10s_linear_infinite]" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: Profile & Security (7 Columns) */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* PROFILE CARD */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/80 dark:border-slate-800/80 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group transition-all hover:bg-white/50 dark:hover:bg-slate-900/50">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl transition-all duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-4 tracking-tight uppercase leading-none">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/40">
                    <User size={20} />
                  </div>
                  Thông tin cá nhân
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Hồ sơ</span>
              </div>

              {/* Avatar Uploader Section */}
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-10 pb-8 border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative bg-indigo-50 dark:bg-slate-800 flex items-center justify-center">
                    <img 
                      src={avatarUrl || `https://ui-avatars.com/api/?name=${name || "User"}&background=7360f2&color=fff`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white rounded-full">
                        <Loader2 size={24} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-lg shadow-indigo-600/30 active:scale-95 transition-all">
                    <Camera size={14} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar || isPendingProfile}
                    />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Ảnh đại diện của bạn</h4>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Tải ảnh chụp cá nhân của bạn lên hệ thống hoặc chọn nhanh preset 3D dưới đây.</p>
                  </div>
                  
                  {/* Presets */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">Preset đẹp mắt:</span>
                    <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                      {presets.map((preset, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setAvatarUrl(preset)}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all active:scale-90 hover:scale-105 bg-slate-50 dark:bg-slate-800 ${
                            avatarUrl === preset ? "border-indigo-600 ring-2 ring-indigo-500/20" : "border-transparent"
                          }`}
                        >
                          <img src={preset} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Inputs */}
              <form onSubmit={handleProfileSave} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="Nguyễn Văn A"
                      required
                      className="w-full pl-14 pr-8 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="07xxxxxxxx"
                        className="w-full pl-14 pr-8 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị / Chi đoàn</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={unit} 
                        onChange={e => setUnit(e.target.value)} 
                        placeholder="Bí thư chi đoàn KP23..."
                        className="w-full pl-14 pr-8 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chức vụ</label>
                    <div className="relative group/sel">
                      <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        value={position} 
                        onChange={e => setPosition(e.target.value)}
                        className="w-full pl-14 pr-12 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="Chủ nhiệm">Chủ nhiệm</option>
                        <option value="Phó Chủ nhiệm">Phó Chủ nhiệm</option>
                        <option value="Thành viên">Thành viên</option>
                        <option value="CTV">CTV</option>
                      </select>
                      <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vai trò truyền thông</label>
                    <div className="relative">
                      <Award className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={roles} 
                        onChange={e => setRoles(e.target.value)} 
                        placeholder="Kỹ thuật truyền thông, Sự kiện..."
                        className="w-full pl-14 pr-8 py-5 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white dark:border-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {profileMessage && (
                  <div className={`p-5 rounded-3xl text-sm font-black flex items-center gap-4 animate-in fade-in zoom-in-95 border-2 ${
                    profileMessage.includes("❌") 
                    ? "bg-red-500/5 text-red-600 border-red-500/10" 
                    : profileMessage.includes("✅")
                    ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                    : "bg-indigo-500/5 text-indigo-600 border-indigo-500/10"
                  }`}>
                    {profileMessage.includes("⏳") && <Loader2 size={18} className="animate-spin" />}
                    {profileMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isPendingProfile}
                  className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:shadow-[0_25px_60px_rgba(79,70,229,0.4)] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-4 disabled:opacity-50 group/save"
                >
                  {isPendingProfile ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover/save:rotate-12 transition-transform" />}
                  Cập nhật thông tin hồ sơ
                </button>
              </form>
            </div>
          </div>

          {/* CHANGE PASSWORD CARD */}
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
                      placeholder="Tối thiểu 6 ký tự"
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

                {secMessage && (
                  <div className={`p-5 rounded-3xl text-sm font-black flex items-center gap-4 animate-in fade-in zoom-in-95 border-2 ${
                    secMessage.includes("❌") 
                    ? "bg-red-500/5 text-red-600 border-red-500/10" 
                    : secMessage.includes("✅")
                    ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                    : "bg-blue-500/5 text-blue-600 border-blue-500/10"
                  }`}>
                    {secMessage.includes("⏳") && <Loader2 size={18} className="animate-spin" />}
                    {secMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isPendingSec}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:shadow-[0_25px_60px_rgba(37,99,235,0.4)] active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-4 disabled:opacity-50 group/save"
                >
                  {isPendingSec ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} className="group-hover/save:rotate-12 transition-transform" />}
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

                {/* PWA Installation Button */}
                <div className="w-full flex justify-between items-center p-6 rounded-[2rem] border border-white/40 bg-white/20 dark:bg-slate-800/20 hover:bg-white/40 transition-all text-left">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#7360f2]/10 rounded-xl text-[#7360f2] shadow-inner">
                        <Download size={24} />
                    </div>
                    <div>
                        <p className="font-black text-sm text-slate-800 dark:text-slate-100 tracking-tight leading-none">Cài đặt Ứng dụng</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest leading-normal">Cài CHX Workspace lên màn hình điện thoại</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleInstallApp}
                    className="px-5 py-2.5 bg-[#7360f2] text-white hover:bg-[#5f4de0] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-[#7360f2]/20 active:scale-95 whitespace-nowrap"
                  >
                    Cài đặt
                  </button>
                </div>
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

      {/* ── SECTION H: PWA MANUAL INSTALLATION GUIDE MODAL ── */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7360f2]/10 text-[#7360f2] rounded-xl flex items-center justify-center shadow-inner shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase leading-tight">Cài đặt trên điện thoại</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Hướng dẫn thêm PWA màn hình chính</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Nếu trình duyệt của bạn không hỗ trợ cài đặt tự động (ví dụ như Safari trên iPhone hoặc Chrome trên iOS), bạn hãy làm theo các bước đơn giản sau:
            </p>

            <div className="flex flex-col gap-3.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#7360f2] text-white flex items-center justify-center text-[10px] shrink-0">1</span>
                <p>Mở ứng dụng bằng trình duyệt gốc của thiết bị (ví dụ: <strong className="text-[#7360f2]">Safari</strong> trên iPhone).</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#7360f2] text-white flex items-center justify-center text-[10px] shrink-0">2</span>
                <p>Bấm vào biểu tượng nút <strong className="text-[#7360f2]">Chia sẻ (Share)</strong> ở góc dưới thanh công cụ của trình duyệt.</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex gap-3 items-center">
                <span className="w-6 h-6 rounded-full bg-[#7360f2] text-white flex items-center justify-center text-[10px] shrink-0">3</span>
                <p>Cuộn xuống dưới và chọn tùy chọn <strong className="text-[#7360f2]">Thêm vào màn hình chính (Add to Home Screen)</strong>.</p>
              </div>
            </div>

            <div className="flex justify-end pt-1.5">
              <button 
                onClick={() => setShowInstallGuide(false)}
                className="w-full px-5 py-3 bg-[#7360f2] hover:bg-[#5f4de0] text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all active:scale-95 shadow-md text-center"
              >
                Đã hiểu, đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
