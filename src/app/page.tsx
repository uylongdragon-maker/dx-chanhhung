"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Đang kết nối cơ sở dữ liệu...");

  useEffect(() => {
    // Stage status text changes
    const statusStages = [
      { threshold: 0, text: "Đang khởi tạo ứng dụng..." },
      { threshold: 25, text: "Đang kết nối máy chủ nòng cốt..." },
      { threshold: 50, text: "Đang tải cấu hình CHX Workspace..." },
      { threshold: 75, text: "Đang đồng bộ hóa luồng dữ liệu..." },
      { threshold: 90, text: "Hoàn tất! Đang chuyển hướng..." },
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        
        // Random incremental steps for realistic loader
        const increment = Math.floor(Math.random() * 8) + 4;
        const nextProgress = Math.min(prev + increment, 100);

        // Update status text
        const matchedStage = [...statusStages]
          .reverse()
          .find((stage) => nextProgress >= stage.threshold);
        if (matchedStage) {
          setStatusText(matchedStage.text);
        }

        return nextProgress;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const redirectTimer = setTimeout(() => {
        router.push("/workspace");
      }, 500);
      return () => clearTimeout(redirectTimer);
    }
  }, [progress, router]);

  return (
    <div className="h-screen w-full relative bg-slate-950 flex flex-col justify-end items-center overflow-hidden font-sans">
      
      {/* Background Image - Dynamic Splash with Vector graphics */}
      <div 
        className="absolute inset-0 bg-[url('/mobile-splash.png')] bg-cover bg-center transition-transform duration-10000 scale-105"
        style={{ backgroundSize: "cover", backgroundPosition: "center" }}
      />

      {/* Glassmorphic Loading Overlay in empty vertical space */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-xs flex flex-col items-center gap-3.5 mb-[24vh] animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Progress Bar Container */}
        <div className="w-full h-1.5 rounded-full bg-white/20 backdrop-blur-md overflow-hidden border border-white/10 shadow-inner">
          <div 
            className="h-full bg-white rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading details */}
        <div className="flex justify-between w-full text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
          <span className="animate-pulse">{statusText}</span>
          <span className="font-mono text-white">{progress}%</span>
        </div>

      </div>
    </div>
  );
}
