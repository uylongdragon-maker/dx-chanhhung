"use client";

import { useState, useEffect, useTransition } from "react";
import { login, registerUser } from "@/app/login/actions";
import { Eye, EyeOff, Lock, User, Mail, ShieldAlert, Award, Star, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPageClient({ searchParams }: { searchParams: { error?: string } }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Register fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (searchParams?.error) {
      setErrorMsg(decodeURIComponent(searchParams.error));
    }
  }, [searchParams]);

  const handleForgotPassword = (e: any) => {
    e.preventDefault();
    toast.success("Đã gửi request đến admin, kiểm tra email để nhận lại mk", {
       duration: 5000,
       icon: "✉️"
    });
    setSuccessMsg("Đã gửi request đến admin, kiểm tra email để nhận lại mk");
    setErrorMsg("");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password || !name) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("name", name);
      formData.append("unit", unit);

      const res = await registerUser(null, formData);
      if (res.success) {
        setSuccessMsg("Đăng ký thành công! Tài khoản của bạn đang chờ Admin phê duyệt trước khi có thể hoạt động.");
        toast.success("Đăng ký thành công! Vui lòng chờ Admin phê duyệt.");
        // Reset form
        setEmail(""); setPassword(""); setConfirmPassword(""); setName(""); setUnit("");
        setIsRegister(false);
      } else {
        setErrorMsg(res.error || "Đăng ký thất bại!");
        toast.error(res.error || "Đăng ký thất bại!");
      }
    });
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col relative overflow-hidden font-body text-slate-100 dark">
      {/* Ambient Background & Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      </div>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center relative z-10 px-4 py-12 md:py-24">
        {/* Glassmorphism Login Card */}
        <div className="w-full max-w-md">
          {/* Brand Logo Space Above Card */}
          <div className="text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-3 hover:rotate-12 transition-transform duration-500">
              <span className="material-symbols-outlined text-3xl font-bold">hub</span>
            </div>
            <h1 className="text-xl font-black tracking-widest text-blue-400 uppercase leading-none">
              BAN TRUYỀN THÔNG CĐS
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Chánh Hưng Workspace</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] relative overflow-hidden transition-all duration-500">
            {/* Inner glow effect */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8 border-b border-slate-800/80 pb-4">
                <h2 className="text-xl font-black text-slate-100 tracking-tight uppercase">
                  {isRegister ? "Đăng ký thành viên" : "Đăng nhập hệ thống"}
                </h2>
                <button 
                  onClick={() => { setIsRegister(!isRegister); setErrorMsg(""); setSuccessMsg(""); }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors uppercase tracking-widest"
                >
                  {isRegister ? "Đăng nhập" : "Đăng ký"}
                </button>
              </div>

              {/* Status Alert Messages */}
              {errorMsg && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in zoom-in-95">
                  <ShieldAlert className="shrink-0 mt-0.5" size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in zoom-in-95">
                  <Star className="shrink-0 mt-0.5 fill-current" size={14} />
                  <span>{successMsg}</span>
                </div>
              )}
              
              {!isRegister ? (
                /* LOGIN FORM */
                <form action={login} className="space-y-5">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="email">
                      Tên đăng nhập / Email
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                        <Mail size={16} />
                      </span>
                      <input
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner placeholder:text-slate-600"
                        id="email"
                        name="email"
                        placeholder="admin@chanhhung.vn"
                        type="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="password">
                        Mật khẩu
                      </label>
                      <a
                        onClick={handleForgotPassword}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-black uppercase tracking-widest cursor-pointer transition-colors"
                      >
                        Quên mật khẩu?
                      </a>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                        <Lock size={16} />
                      </span>
                      <input
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-12 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner placeholder:text-slate-600"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        required
                      />
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    className="w-full mt-2 bg-gradient-to-br from-blue-600 to-indigo-500 text-white rounded-xl py-4 font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:shadow-blue-500/20 active:scale-98 transition-all duration-300 flex items-center justify-center gap-2"
                    type="submit"
                  >
                    <Send size={14} /> ĐĂNG NHẬP HỆ THỐNG
                  </button>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Họ và Tên *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                        <User size={16} />
                      </span>
                      <input
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                        placeholder="Nguyễn Văn A"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Email đăng ký *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                        <Mail size={16} />
                      </span>
                      <input
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                        placeholder="name@chanhhung.vn"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Unit */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Đơn vị / Chức vụ
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                        <Award size={16} />
                      </span>
                      <input
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                        placeholder="VD: Bí thư Chi đoàn KP29"
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Mật khẩu (Tối thiểu 6 ký tự) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                        <Lock size={16} />
                      </span>
                      <input
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-12 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-800"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Xác nhận mật khẩu *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                        <Lock size={16} />
                      </span>
                      <input
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-600"
                        placeholder="••••••••"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Register Button */}
                  <button
                    className="w-full mt-4 bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-xl py-4 font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                    type="submit"
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="animate-spin" size={14} /> : <Star size={14} />}
                    {isPending ? "ĐANG GỬI THÔNG TIN..." : "ĐĂNG KÝ PHÊ DUYỆT"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-transparent w-full py-8 mt-auto flex flex-col md:flex-row justify-between items-center px-8 gap-4 relative z-10">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          © 2026 Ban Truyền thông CĐS Chánh Hưng. All rights reserved.
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          <a className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors" href="#">
            Quy định bảo mật
          </a>
          <a className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors" href="#">
            Hỗ trợ kỹ thuật
          </a>
          <a className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors" href="#">
            Điều khoản
          </a>
        </div>
      </footer>
    </div>
  );
}
