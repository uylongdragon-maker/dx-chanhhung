import { login } from "@/app/login/actions";

export default function LoginPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col relative overflow-hidden font-body text-on-background">
      {/* Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary-container/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-tertiary-container/20 rounded-full blur-[120px]"></div>
        <img
          alt="Background texture"
          className="w-full h-full object-cover opacity-[0.03]"
          data-alt="abstract architectural glass structures reflecting blue light"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPpphQW83totf9zVTrjWINzLcYkBehvAyuQN9THvr3HaNNQyjmGQ0drtXFaECrR9S1HXwDpVeHBVqtmSRIBSxkROdCOMLgbP9ogyaWvd_UIDH2wvQc8A6rJX1433pV-D4WU9li6WQDq7yJ4ZdYGedKw6Mrd4JcbHIMEw6Na3542vER6IhjI-HNKO9bwIVNzn4rJv8wNi17upQU_J7HEOc6A3Gn7glrhRibrbd7mr19CfS75HxzT3WqAGjb146N1ykk_V8EW8U3gAg"
        />
      </div>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center relative z-10 px-4 py-12 md:py-24">
        {/* Glassmorphism Login Card */}
        <div className="w-full max-w-md">
          {/* Brand Logo Space Above Card */}
          <div className="text-center mb-8">
            <span
              className="material-symbols-outlined text-4xl text-primary mb-2"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              hub
            </span>
            <h1 className="text-xl font-black tracking-widest text-primary uppercase">
              BAN TRUYỀN THÔNG CĐS
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">Chánh Hưng Workspace</p>
          </div>

          <div className="bg-surface/80 backdrop-blur-xl border border-white/20 rounded-xl p-8 shadow-[0_32px_64px_-16px_rgba(44,47,49,0.06)] relative overflow-hidden">
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none rounded-xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-on-surface mb-6 tracking-tight">
                Đăng nhập hệ thống
              </h2>
              
              <form action={login} className="space-y-6">
                {/* Username Input */}
                <div className="space-y-2">
                  <label
                    className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                    htmlFor="email"
                  >
                    Tên đăng nhập / Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      person
                    </span>
                    <input
                      className="w-full bg-surface-container-highest/50 border border-white/40 rounded-lg py-3 pl-11 pr-4 text-on-surface focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary-fixed-dim/20 transition-all shadow-sm backdrop-blur-md"
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
                    <label
                      className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                      htmlFor="password"
                    >
                      Mật khẩu
                    </label>
                    <a
                      className="text-xs text-primary hover:text-primary-dim font-medium transition-colors"
                      href="#"
                    >
                      Quên mật khẩu?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      lock
                    </span>
                    <input
                      className="w-full bg-surface-container-highest/50 border border-white/40 rounded-lg py-3 pl-11 pr-4 text-on-surface focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary-fixed-dim/20 transition-all shadow-sm backdrop-blur-md"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type="password"
                      required
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">visibility_off</span>
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-white rounded-full py-4 font-semibold text-sm tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  type="submit"
                >
                  ĐĂNG NHẬP
                </button>
              </form>

              {/* Divider */}
              <div className="mt-8 mb-6 flex items-center justify-center space-x-4">
                <div className="h-px bg-outline-variant/30 flex-grow"></div>
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">
                  Hoặc
                </span>
                <div className="h-px bg-outline-variant/30 flex-grow"></div>
              </div>

              {/* Alternate Login Options */}
              <div className="space-y-3">
                <button
                  className="w-full bg-white/40 backdrop-blur-md border border-white/50 rounded-full py-3 px-4 flex items-center justify-center space-x-3 hover:bg-white/60 transition-colors shadow-sm"
                  type="button"
                >
                  <img
                    alt="Google"
                    className="w-5 h-5"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4l_G1tq7tHHvNmX_ArdQehQ4ORa8u3YpMVAX1Tay960rTKvAZV2yMCMHsu9-JG5CUEITFxyrWB2zFikVQHunci21PYzf9OI8VZyuDfr6qRmTjZBwJX5PAxyexGJ6NrPl9w5fiZ1JGiaCR0AgY1_2Q0lqy1HC9fAC66C4_cveYnKKGCXfVOWgvKyFq7T9PD7nNOAcvVUFSoDQ2j16Rki6xlSDC_e52wcDRyEkMp3548UPUR-HP9IheFiBPagaE4pE0vt37HnkKbio"
                  />
                  <span className="text-sm font-medium text-on-surface">Đăng nhập với Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-transparent w-full py-8 mt-auto flex flex-col md:flex-row justify-between items-center px-8 gap-4 relative z-10">
        <div className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
          © 2024 Ban Truyền thông CĐS Chánh Hưng. All rights reserved.
        </div>
        <div className="flex flex-wrap gap-6 justify-center">
          <a
            className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-300 underline-offset-4 hover:underline transition-opacity duration-300"
            href="#"
          >
            Quy định bảo mật
          </a>
          <a
            className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-300 underline-offset-4 hover:underline transition-opacity duration-300"
            href="#"
          >
            Hỗ trợ kỹ thuật
          </a>
          <a
            className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-300 underline-offset-4 hover:underline transition-opacity duration-300"
            href="#"
          >
            Điều khoản
          </a>
        </div>
      </footer>
    </div>
  );
}
