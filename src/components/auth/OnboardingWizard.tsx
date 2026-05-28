"use client";

import { useState, useEffect } from "react";
import { completeOnboarding } from "@/app/workspace/settings/actions";
import { createClient } from "@/utils/supabase/client";
import { 
  User, Phone, MapPin, Sparkles, Award, Camera, 
  Loader2, ChevronRight, CheckCircle2, ShieldCheck, HelpCircle, Briefcase, Compass
} from "lucide-react";

export default function OnboardingWizard({ user }: { user: any }) {
  const [step, setStep] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  // Step 1: Profile
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Step 2: Contact
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  // Step 3: Work
  const [unit, setUnit] = useState(user?.unit || "");
  const [position, setPosition] = useState(user?.position || "Thành viên");

  // Step 4: Welcome & Init simulation states
  const [initStage, setInitStage] = useState(0);

  const presets = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Gizmo"
  ];

  // Simulation loading steps for Step 4
  useEffect(() => {
    if (step === 4) {
      const timer1 = setTimeout(() => setInitStage(1), 1200);
      const timer2 = setTimeout(() => setInitStage(2), 2600);
      const timer3 = setTimeout(() => setInitStage(3), 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [step]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setMessage("⏳ Đang tải ảnh đại diện...");

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
      setMessage("✅ Tải ảnh đại diện thành công!");
    } catch (err: any) {
      setMessage(`❌ Tải ảnh thất bại: ${err.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !name.trim()) {
      setMessage("❌ Vui lòng nhập họ và tên của bạn!");
      return;
    }
    if (step === 2 && (!phone.trim() || !address.trim())) {
      setMessage("❌ Vui lòng điền số điện thoại và địa chỉ!");
      return;
    }
    if (step === 3 && !unit.trim()) {
      setMessage("❌ Vui lòng nhập đơn vị hoặc chi đoàn!");
      return;
    }

    setMessage("");
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setMessage("");
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsPending(true);
    setMessage("⏳ Đang lưu trữ thông tin khởi tạo...");

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("name", name);
      formData.append("avatarUrl", avatarUrl);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("unit", unit);
      formData.append("position", position);

      const result = await completeOnboarding(formData);
      
      if (result.success) {
        // Reload layout to enter the system
        window.location.reload();
      } else {
        setIsPending(false);
        setMessage(`❌ Lỗi: ${result.error}`);
      }
    } catch (err: any) {
      setIsPending(false);
      setMessage(`❌ Sự cố: ${err.message}`);
    }
  };

  const renderProgressBar = () => {
    const progressPercent = (step / 4) * 100;
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-10 relative">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-inner"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Container Card */}
      <div className="w-full max-w-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/80 dark:border-slate-800/80 p-8 sm:p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[550px]">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black text-[9px] uppercase tracking-widest leading-none mb-4">
              <Sparkles size={10} className="fill-current" />
              Khởi tạo hồ sơ
            </span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              CHX <span className="text-indigo-600">Workspace</span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-2">
              Chỉ vài bước nhỏ để bắt đầu không gian làm việc nòng cốt.
            </p>
          </div>

          {/* Progress Indicator */}
          {renderProgressBar()}

          {/* STEP 1: Full Name & Avatar */}
          {step === 1 && (
            <div className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col items-center gap-6 mb-4">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg relative bg-indigo-50 dark:bg-slate-800 flex items-center justify-center">
                    <img 
                      src={avatarUrl || `https://ui-avatars.com/api/?name=${name || "User"}&background=7360f2&color=fff`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                        <Loader2 size={20} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-md active:scale-95 transition-all">
                    <Camera size={12} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                </div>

                {/* Presets */}
                <div className="w-full text-center space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Chọn nhanh Preset 3D:</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {presets.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all active:scale-90 bg-slate-50 dark:bg-slate-800 ${
                          avatarUrl === preset ? "border-indigo-600 ring-2 ring-indigo-500/10" : "border-transparent"
                        }`}
                      >
                        <img src={preset} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên của bạn</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Nhập họ và tên..."
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Phone & Address */}
          {step === 2 && (
            <div className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="07xxxxxxxx hoặc 09xxxxxxxx"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ thường trú</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Số nhà, Tên đường, Phường/Xã..."
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Unit & Position */}
          {step === 3 && (
            <div className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị / Chi đoàn sinh hoạt</label>
                <div className="relative">
                  <Compass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    value={unit} 
                    onChange={e => setUnit(e.target.value)} 
                    placeholder="Ví dụ: Bí thư chi đoàn KP23"
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold placeholder:text-slate-300 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chức danh hành chính</label>
                <div className="relative group/sel">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={position} 
                    onChange={e => setPosition(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm font-bold dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="Chủ nhiệm">Chủ nhiệm</option>
                    <option value="Phó Chủ nhiệm">Phó Chủ nhiệm</option>
                    <option value="Thành viên">Thành viên</option>
                    <option value="CTV">CTV</option>
                  </select>
                  <ChevronRight size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success, Init & Welcome */}
          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 animate-in zoom-in-95 duration-500">
              
              {/* Spinning/pulsing initialisation card */}
              <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-600/10 dark:border-indigo-600/5"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 animate-spin"></div>
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-pulse">
                  <ShieldCheck size={36} />
                </div>
              </div>

              {/* Steps simulation list */}
              <div className="w-full space-y-4 max-w-xs text-left mb-6 font-bold text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-slate-600 dark:text-slate-300">Đã lưu trữ dữ liệu cá nhân</span>
                </div>

                <div className="flex items-center gap-3">
                  {initStage >= 1 ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 animate-in zoom-in duration-300">
                      <CheckCircle2 size={12} />
                    </div>
                  ) : (
                    <Loader2 size={14} className="animate-spin text-indigo-500 ml-1 shrink-0" />
                  )}
                  <span className={initStage >= 1 ? "text-slate-600 dark:text-slate-300" : "text-slate-400 italic"}>
                    Đang thiết lập không gian làm việc...
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {initStage >= 2 ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 animate-in zoom-in duration-300">
                      <CheckCircle2 size={12} />
                    </div>
                  ) : (
                    <Loader2 size={14} className="animate-spin text-indigo-500 ml-1 shrink-0" />
                  )}
                  <span className={initStage >= 2 ? "text-slate-600 dark:text-slate-300" : "text-slate-400 italic"}>
                    Đồng bộ hóa với dữ liệu Ban Truyền thông...
                  </span>
                </div>

                {initStage >= 3 && (
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="text-emerald-600 font-extrabold">Hệ thống đã sẵn sàng hoạt động!</span>
                  </div>
                )}
              </div>

              {initStage >= 3 && (
                <div className="text-center animate-in zoom-in duration-500">
                  <h4 className="text-xl font-black text-slate-800 dark:text-slate-100">Chào mừng đến hệ thống! 🎉</h4>
                  <p className="text-xs text-slate-500 mt-2 font-medium max-w-xs mx-auto">Tài khoản của bạn đã được thiết lập thành công. Hãy bấm nút dưới đây để khám phá không gian làm việc.</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Messages */}
          {message && !isPending && (
            <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-3 mb-6 animate-in fade-in zoom-in-95 border-2 ${
              message.includes("❌") 
              ? "bg-red-500/5 text-red-600 border-red-500/10" 
              : "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Buttons Controls Footer */}
        <div className="relative z-10 flex gap-4 mt-6">
          {step > 1 && step < 4 && (
            <button
              onClick={handlePrevStep}
              disabled={isPending}
              className="px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-95"
            >
              Quay lại
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNextStep}
              className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Tiếp tục
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isPending || initStage < 3}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Bắt đầu làm việc
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
