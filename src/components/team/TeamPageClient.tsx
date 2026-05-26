"use client";

import { useState, useTransition } from "react";
import { 
  Users, Mail, Award, Globe, Edit2, Shield, 
  Phone, UserCheck, Star, Briefcase, FileText, CheckCircle2,
  Sliders, MessageSquare, Search, Sparkles, X, ChevronRight,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { updateUserProfile, adminCreateMember } from "@/app/workspace/team/actions";

interface Task {
  id: string;
  title: string;
  priority: string;
  completedAt: Date | null;
  evaluationNotes: string | null;
}

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  unit: string | null;
  role: string;
  phone: string | null;
  position: string | null;
  roles: string | null;
  scoreQuickness: number;
  scoreFlexibility: number;
  scoreExpertise: number;
  scoreProblemSolving: number;
  scoreCreativity: number;
  scoreResponsibility: number;
  leaderEvaluation: string | null;
  tasks: Task[];
}

interface TeamPageClientProps {
  initialMembers: TeamMember[];
  currentUser: any;
}

// Custom SVG Hexagon Radar Strength Chart Component
const RadarChart = ({ scores }: { scores: {
  scoreQuickness: number;
  scoreFlexibility: number;
  scoreExpertise: number;
  scoreProblemSolving: number;
  scoreCreativity: number;
  scoreResponsibility: number;
}}) => {
  const R = 90; // Radar outer radius
  const cx = 140; // Center coordinates
  const cy = 140;

  const labels = [
    { text: "Nhanh nhạy", score: scores.scoreQuickness },
    { text: "Linh hoạt", score: scores.scoreFlexibility },
    { text: "Chuyên môn", score: scores.scoreExpertise },
    { text: "Xử lý tình huống", score: scores.scoreProblemSolving },
    { text: "Sáng tạo", score: scores.scoreCreativity },
    { text: "Trách nhiệm", score: scores.scoreResponsibility },
  ];

  const gridLevels = [0.25, 0.5, 0.75, 1];

  const getHexagonPoints = (scale: number) => {
    return Array.from({ length: 6 }).map((_, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const x = cx + R * scale * Math.cos(angle);
      const y = cy + R * scale * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  };

  const scorePoints = labels.map((item, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    const scale = item.score / 100;
    const x = cx + R * scale * Math.cos(angle);
    const y = cy + R * scale * Math.sin(angle);
    return { x, y };
  });

  const scorePath = scorePoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/80">
      <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Sliders size={10} className="text-blue-500" />
        Biểu đồ lục giác thế mạnh
      </h5>
      
      <svg viewBox="0 0 280 280" className="w-full max-w-[240px] h-auto">
        {/* Hexagon Grid Lines */}
        {gridLevels.map((lvl, idx) => (
          <polygon
            key={idx}
            points={getHexagonPoints(lvl)}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Diagonal Axes */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = -Math.PI / 2 + (i * Math.PI) / 3;
          const x2 = cx + R * Math.cos(angle);
          const y2 = cy + R * Math.sin(angle);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />
          );
        })}

        {/* Value Polygon Area */}
        <polygon
          points={scorePath}
          fill="rgba(59, 130, 246, 0.22)"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data Vertices */}
        {scorePoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        ))}

        {/* Text Labels */}
        {labels.map((item, i) => {
          const angle = -Math.PI / 2 + (i * Math.PI) / 3;
          const offset = 20;
          const tx = cx + (R + offset) * Math.cos(angle);
          const ty = cy + (R + offset) * Math.sin(angle);

          let textAnchor: "start" | "end" | "middle" = "middle";
          if (Math.cos(angle) > 0.1) textAnchor = "start";
          else if (Math.cos(angle) < -0.1) textAnchor = "end";

          let dy = "0.33em";
          if (Math.sin(angle) < -0.9) dy = "-0.2em";
          else if (Math.sin(angle) > 0.9) dy = "0.8em";

          return (
            <g key={i}>
              <text
                x={tx}
                y={ty}
                textAnchor={textAnchor}
                dy={dy}
                className="text-[9px] font-extrabold fill-slate-700 dark:fill-slate-300 tracking-tight"
              >
                {item.text}
              </text>
              <text
                x={tx}
                y={ty + (Math.sin(angle) > 0.9 ? 10 : 9)}
                textAnchor={textAnchor}
                dy={dy}
                className="text-[8px] font-black fill-blue-600 dark:fill-blue-400"
              >
                {item.score}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default function TeamPageClient({ initialMembers = [], currentUser }: TeamPageClientProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"admin-table" | "cards">(
    currentUser?.role === "ADMIN" ? "admin-table" : "cards"
  );
  
  // Modal state
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "chanhhung123", // Default password
    unit: "",
    phone: "",
    position: "Thành viên",
    roles: "",
  });
  
  const [isPending, startTransition] = useTransition();

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!");
      return;
    }

    startTransition(async () => {
      const res = await adminCreateMember(newMember);
      if (res.success) {
        toast.success(`Đã thêm thành viên ${newMember.name} thành công!`);
        setIsAddingMember(false);
        
        // Optimistic update to reflect instantly in the client
        const tempId = `new-${Date.now()}`;
        const newObj: TeamMember = {
          id: tempId,
          email: newMember.email,
          name: newMember.name,
          avatarUrl: null,
          unit: newMember.unit || null,
          role: "MEMBER",
          phone: newMember.phone || null,
          position: newMember.position,
          roles: newMember.roles || null,
          scoreQuickness: 80,
          scoreFlexibility: 80,
          scoreExpertise: 80,
          scoreProblemSolving: 80,
          scoreCreativity: 80,
          scoreResponsibility: 80,
          leaderEvaluation: null,
          tasks: [],
        };
        
        setMembers(prev => [...prev, newObj]);
        setNewMember({
          name: "",
          email: "",
          password: "chanhhung123",
          unit: "",
          phone: "",
          position: "Thành viên",
          roles: "",
        });
      } else {
        toast.error("Lỗi tạo thành viên: " + res.error);
      }
    });
  };

  const isAdmin = currentUser?.role === "ADMIN";

  // Filter members list
  const filteredMembers = members.filter(m => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(lower) ||
      m.email.toLowerCase().includes(lower) ||
      m.unit?.toLowerCase().includes(lower) ||
      m.position?.toLowerCase().includes(lower) ||
      m.roles?.toLowerCase().includes(lower)
    );
  });

  // Strengths save handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    startTransition(async () => {
      const res = await updateUserProfile(editingMember.id, {
        unit: editingMember.unit,
        phone: editingMember.phone,
        position: editingMember.position,
        roles: editingMember.roles,
        scoreQuickness: editingMember.scoreQuickness,
        scoreFlexibility: editingMember.scoreFlexibility,
        scoreExpertise: editingMember.scoreExpertise,
        scoreProblemSolving: editingMember.scoreProblemSolving,
        scoreCreativity: editingMember.scoreCreativity,
        scoreResponsibility: editingMember.scoreResponsibility,
        leaderEvaluation: editingMember.leaderEvaluation,
      });

      if (res.success) {
        toast.success(`Đã cập nhật hồ sơ của ${editingMember.name}!`);
        // Sync local states
        setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
        setEditingMember(null);
      } else {
        toast.error("Lỗi: " + res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3 tracking-tighter">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Users size={24} />
            </div>
            Đội hình Ban Truyền thông
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Nơi ghi nhận hồ sơ thế mạnh, năng lực và đóng góp của các chiến hữu Chánh Hưng.
          </p>
        </div>

        {/* Tab Toggle for Admins */}
        {isAdmin && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
            <button
              onClick={() => setActiveTab("admin-table")}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "admin-table"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Shield size={12} />
              Bảng Quản Lý
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "cards"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Globe size={12} />
              Đội Hình Danh Thiếp
            </button>
          </div>
        )}
      </div>

      {/* ─── Search & Actions Toolbar ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px] max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, đơn vị, chức vụ, vai trò..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-medium"
          />
        </div>
        {isPending && <span className="text-xs text-blue-600 animate-pulse font-medium">Đang lưu thay đổi...</span>}
        
        {isAdmin && (
          <button
            onClick={() => setIsAddingMember(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/15 ml-auto"
          >
            <Plus size={13} />
            Thêm Thành Viên
          </button>
        )}
      </div>

      {/* ─── Tab CONTENT 1: Admin Table View ─── */}
      {isAdmin && activeTab === "admin-table" && (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-lg">
          <table className="w-full border-collapse text-left text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4 w-12 text-center">STT</th>
                <th className="py-4 px-6 w-[200px]">Họ và Tên</th>
                <th className="py-4 px-6 w-[240px]">Đơn vị</th>
                <th className="py-4 px-4 w-[130px]">SĐT</th>
                <th className="py-4 px-4 w-[140px]">Chức vụ</th>
                <th className="py-4 px-6 w-[260px]">Vai trò</th>
                <th className="py-4 px-4 text-center w-[120px]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic font-bold">
                    Không tìm thấy thành viên phù hợp.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr 
                    key={member.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* STT */}
                    <td className="py-3 px-4 text-center font-bold text-slate-400">{index + 1}</td>
                    
                    {/* Hồ sơ & Họ tên */}
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white text-[11px] font-black shadow shadow-blue-500/20 shrink-0">
                          {member.name?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                          <button 
                            onClick={() => setSelectedMember(member)}
                            className="font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline text-left leading-tight"
                          >
                            {member.name}
                          </button>
                          <div className="text-[10px] text-slate-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Đơn vị */}
                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300 font-medium">{member.unit || "Chưa cập nhật"}</td>
                    
                    {/* SĐT */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{member.phone || "—"}</td>
                    
                    {/* Chức vụ */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${
                        member.position === "Chủ nhiệm"
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                          : member.position === "Phó Chủ nhiệm"
                          ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                          : member.position === "CTV"
                          ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                      }`}>
                        {member.position || "Thành viên"}
                      </span>
                    </td>
                    
                    {/* Vai trò */}
                    <td className="py-3 px-6">
                      <div className="flex flex-wrap gap-1">
                        {member.roles ? (
                          member.roles.split(",").map((r, i) => (
                            <span 
                              key={i}
                              className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded text-[9px] font-bold text-slate-600 dark:text-slate-300"
                            >
                              {r.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa phân vai</span>
                        )}
                      </div>
                    </td>

                    {/* Sửa / Xem */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingMember(member)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="Sửa thế mạnh và thông tin"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                          title="Xem trang cá nhân LinkedIn"
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Tab CONTENT 2: LinkedIn Cards View ─── */}
      {(!isAdmin || activeTab === "cards") && (
        <div className="flex flex-col gap-10">
          {/* Highlight current user's profile card if NOT admin */}
          {!isAdmin && currentUser && (
            <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent p-6 rounded-3xl border border-blue-500/20 dark:border-blue-500/10">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                Trang cá nhân của bạn
              </span>
              <div className="mt-4 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-20 h-20 rounded-[30%] bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shrink-0">
                  {currentUser.name?.substring(0, 2).toUpperCase() || "??"}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{currentUser.name}</h3>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{currentUser.position || "Thành viên Chánh Hưng"} • {currentUser.unit}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{currentUser.email}</p>
                  <button 
                    onClick={() => {
                      const completeMemberObj = members.find(m => m.id === currentUser.id);
                      if (completeMemberObj) setSelectedMember(completeMemberObj);
                      else toast.error("Đang tải dữ liệu hồ sơ...");
                    }}
                    className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20"
                  >
                    Xem Chi Tiết Hồ Sơ & Đánh Giá
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regular Roster Cards Grid */}
          <div>
            <h4 className="text-base font-black text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Star size={16} className="text-blue-500" />
              Tất cả thành viên ({filteredMembers.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-500/20 dark:hover:border-blue-400/20 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
                >
                  {/* Decorative card gradient header */}
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-100 to-slate-50/50 dark:from-slate-800/40 dark:to-slate-800/10 border-b border-slate-100 dark:border-slate-800/50"></div>
                  
                  {/* Avatar */}
                  <div className="relative mt-4 mb-4">
                    <div className="w-16 h-16 rounded-[28%] bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:rotate-3 transition-transform duration-300">
                      {member.name?.substring(0, 2).toUpperCase() || "??"}
                    </div>
                  </div>

                  {/* Member Name */}
                  <h4 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                    {member.name}
                  </h4>
                  
                  {/* Unit / SĐT */}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 line-clamp-1">
                    {member.unit || "Ban truyền thông"}
                  </p>
                  
                  {/* Position Badge */}
                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                      member.position === "Chủ nhiệm"
                        ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                        : member.position === "Phó Chủ nhiệm"
                        ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                        : member.position === "CTV"
                        ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                    }`}>
                      {member.position || "Thành viên"}
                    </span>
                  </div>

                  {/* Media roles list */}
                  <div className="mt-4 flex flex-wrap justify-center gap-1 min-h-[36px]">
                    {member.roles ? (
                      member.roles.split(",").slice(0, 2).map((r, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-md text-[8px] font-extrabold text-slate-500 dark:text-slate-400"
                        >
                          {r.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-[8px] text-slate-400 italic">Chưa phân vai</span>
                    )}
                    {member.roles && member.roles.split(",").length > 2 && (
                      <span className="text-[8px] text-slate-400 font-bold self-center px-1">+{member.roles.split(",").length - 2}</span>
                    )}
                  </div>

                  {/* Footer button */}
                  <button 
                    onClick={() => setSelectedMember(member)}
                    className="w-full mt-5 py-2 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-slate-800 rounded-2xl text-[9px] font-black text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-widest transition-all"
                  >
                    Xem Trang LinkedIn
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: LinkedIn Style Profile ─── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-900 overflow-hidden my-8 relative flex flex-col max-h-[85vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/10 hover:bg-slate-900/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-full transition-all"
            >
              <X size={16} />
            </button>

            {/* Premium Header Banner */}
            <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 shrink-0 relative">
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-[30%] bg-gradient-to-br from-indigo-500 to-cyan-400 border-4 border-white dark:border-slate-950 flex items-center justify-center text-white text-2xl font-black shadow-xl">
                  {selectedMember.name?.substring(0,2).toUpperCase() || "??"}
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 pt-12 space-y-8 scrollbar-thin">
              
              {/* Profile Bio */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
                    {selectedMember.name}
                    {selectedMember.role === "ADMIN" && (
                      <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black rounded-md uppercase tracking-wider">Admin</span>
                    )}
                  </h3>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedMember.position || "Thành viên"} • {selectedMember.unit}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      <span>{selectedMember.email}</span>
                    </div>
                    {selectedMember.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span className="font-mono font-bold">{selectedMember.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media role tags list */}
                <div className="flex flex-wrap gap-1.5 max-w-sm justify-end">
                  {selectedMember.roles ? (
                    selectedMember.roles.split(",").map((r, i) => (
                      <span 
                        key={i}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                      >
                        {r.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Chưa cập nhật vai trò</span>
                  )}
                </div>
              </div>

              {/* Grid: Strengths radar + Ban chủ nhiệm Evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Radar chart */}
                <RadarChart 
                  scores={{
                    scoreQuickness: selectedMember.scoreQuickness,
                    scoreFlexibility: selectedMember.scoreFlexibility,
                    scoreExpertise: selectedMember.scoreExpertise,
                    scoreProblemSolving: selectedMember.scoreProblemSolving,
                    scoreCreativity: selectedMember.scoreCreativity,
                    scoreResponsibility: selectedMember.scoreResponsibility
                  }} 
                />

                {/* Leader Evaluation Card */}
                <div className="flex flex-col bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 justify-between">
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <Award size={12} className="text-amber-500" />
                      Đánh giá từ Ban chủ nhiệm (Ban kiểm tra)
                    </h5>
                    
                    {selectedMember.leaderEvaluation ? (
                      <blockquote className="text-sm font-semibold text-slate-700 dark:text-slate-300 italic border-l-4 border-blue-500 pl-4 py-1 leading-relaxed">
                        “ {selectedMember.leaderEvaluation} ”
                      </blockquote>
                    ) : (
                      <p className="text-xs text-slate-400 italic pl-4 border-l-4 border-slate-200/50">
                        Chưa có đánh giá tổng quát được lưu trữ cho học kỳ này.
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/30 flex items-center gap-2 text-[10px] text-slate-400">
                    <UserCheck size={11} className="text-blue-500" />
                    <span>Hệ thống đánh giá định kỳ 2026</span>
                  </div>
                </div>
              </div>

              {/* Completed Tasks Log (Lưu nhiệm vụ hoàn thành kèm đánh giá) */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  Nhiệm vụ đã hoàn thành ({selectedMember.tasks.length})
                </h4>

                {selectedMember.tasks.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50/30 dark:bg-slate-900/30 border border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-slate-400 text-xs italic font-bold">
                    Chưa ghi nhận nhiệm vụ hoàn thành hoặc đã duyệt.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                    {selectedMember.tasks.map((task) => (
                      <div 
                        key={task.id}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col gap-2 hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                              <CheckCircle2 size={12} />
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">{task.title}</span>
                          </div>
                          
                          {task.completedAt && (
                            <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">
                              Xong: {format(new Date(task.completedAt), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>

                        {/* Task specific evaluation notes */}
                        {task.evaluationNotes ? (
                          <div className="mt-1.5 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl">
                            <div className="text-[8px] uppercase tracking-wider font-extrabold text-blue-500 mb-1 flex items-center gap-1">
                              <MessageSquare size={8} />
                              Nhận xét nhiệm vụ:
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                              {task.evaluationNotes}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">Nhiệm vụ đã duyệt (Chưa ghi chú nhận xét chi tiết)</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL: Admin Profile & Strength Slider Editor ─── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-900 overflow-hidden my-8 relative flex flex-col max-h-[85vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setEditingMember(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-all"
            >
              <X size={16} />
            </button>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="flex flex-col min-h-0 flex-grow overflow-hidden">
              
              {/* Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sliders size={18} className="text-blue-500" />
                  Cấu hình Năng lực & Đánh giá: {editingMember.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Cập nhật thông tin chi tiết, điểm kỹ năng lục giác và nhận xét từ Ban chủ nhiệm.</p>
              </div>

              {/* Scrollable inputs */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                
                {/* 1. Basic Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Đơn vị</label>
                    <input 
                      type="text" 
                      value={editingMember.unit || ""} 
                      onChange={e => setEditingMember(prev => prev ? { ...prev, unit: e.target.value } : null)}
                      placeholder="Bí thư chi đoàn..."
                      className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">SĐT liên hệ</label>
                    <input 
                      type="text" 
                      value={editingMember.phone || ""} 
                      onChange={e => setEditingMember(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      placeholder="Nhập SĐT..."
                      className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Chức vụ</label>
                    <select 
                      value={editingMember.position || "Thành viên"} 
                      onChange={e => setEditingMember(prev => prev ? { ...prev, position: e.target.value } : null)}
                      className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-bold"
                    >
                      <option value="Chủ nhiệm">Chủ nhiệm</option>
                      <option value="Phó Chủ nhiệm">Phó Chủ nhiệm</option>
                      <option value="Thành viên">Thành viên</option>
                      <option value="CTV">CTV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Vai trò truyền thông</label>
                    <input 
                      type="text" 
                      value={editingMember.roles || ""} 
                      onChange={e => setEditingMember(prev => prev ? { ...prev, roles: e.target.value } : null)}
                      placeholder="Sự kiện, Nội dung, Kỹ thuật..."
                      className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-bold"
                    />
                  </div>
                </div>

                {/* 2. Strengths Hexagon Ratings (Sliders) */}
                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-blue-500" />
                    Chỉ số năng lực lục giác (0 - 100)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nhanh nhạy */}
                    <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        <span>Nhanh nhạy</span>
                        <span className="text-blue-600 dark:text-blue-400">{editingMember.scoreQuickness}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={editingMember.scoreQuickness}
                        onChange={e => setEditingMember(prev => prev ? { ...prev, scoreQuickness: parseInt(e.target.value) } : null)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Linh hoạt */}
                    <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        <span>Linh Hoạt</span>
                        <span className="text-blue-600 dark:text-blue-400">{editingMember.scoreFlexibility}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={editingMember.scoreFlexibility}
                        onChange={e => setEditingMember(prev => prev ? { ...prev, scoreFlexibility: parseInt(e.target.value) } : null)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Chuyên môn */}
                    <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        <span>Chuyên môn</span>
                        <span className="text-blue-600 dark:text-blue-400">{editingMember.scoreExpertise}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={editingMember.scoreExpertise}
                        onChange={e => setEditingMember(prev => prev ? { ...prev, scoreExpertise: parseInt(e.target.value) } : null)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Xử lý tình huống */}
                    <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        <span>Xử lý tình huống</span>
                        <span className="text-blue-600 dark:text-blue-400">{editingMember.scoreProblemSolving}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={editingMember.scoreProblemSolving}
                        onChange={e => setEditingMember(prev => prev ? { ...prev, scoreProblemSolving: parseInt(e.target.value) } : null)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Sáng tạo */}
                    <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        <span>Sáng tạo</span>
                        <span className="text-blue-600 dark:text-blue-400">{editingMember.scoreCreativity}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={editingMember.scoreCreativity}
                        onChange={e => setEditingMember(prev => prev ? { ...prev, scoreCreativity: parseInt(e.target.value) } : null)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Trách nhiệm */}
                    <div className="bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                        <span>Trách nhiệm</span>
                        <span className="text-blue-600 dark:text-blue-400">{editingMember.scoreResponsibility}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={editingMember.scoreResponsibility}
                        onChange={e => setEditingMember(prev => prev ? { ...prev, scoreResponsibility: parseInt(e.target.value) } : null)}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Leader Evaluation Text area */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Award size={12} className="text-amber-500" />
                    Nhận xét chung từ Ban chủ nhiệm (Ban kiểm tra)
                  </label>
                  <textarea
                    rows={4}
                    value={editingMember.leaderEvaluation || ""}
                    onChange={e => setEditingMember(prev => prev ? { ...prev, leaderEvaluation: e.target.value } : null)}
                    placeholder="Nhập nhận xét tổng hợp năng lực, thái độ, kỷ luật của thành viên trong học kỳ..."
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium leading-relaxed resize-y"
                  />
                </div>

              </div>

              {/* Form Actions Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all"
                >
                  Huỷ bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
                >
                  Lưu thay đổi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* ─── MODAL: Admin Add Member Form ─── */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-900 overflow-hidden my-8 relative flex flex-col max-h-[85vh]">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-all"
            >
              <X size={16} />
            </button>

            {/* Form */}
            <form onSubmit={handleCreateMember} className="flex flex-col min-h-0 flex-grow overflow-hidden">
              
              {/* Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Plus size={18} className="text-blue-500" />
                  Thêm thành viên mới
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Đăng ký tài khoản xác thực mới và điền thông tin hồ sơ Chánh Hưng.</p>
              </div>

              {/* Scrollable inputs */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Họ và Tên *</label>
                  <input 
                    type="text" 
                    required
                    value={newMember.name} 
                    onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập họ tên đầy đủ..."
                    className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-bold"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Địa chỉ Email *</label>
                  <input 
                    type="email" 
                    required
                    value={newMember.email} 
                    onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono font-bold"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Mật khẩu đăng nhập *</label>
                  <input 
                    type="text" 
                    required
                    value={newMember.password} 
                    onChange={e => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mật khẩu ít nhất 6 ký tự..."
                    className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono font-bold"
                  />
                </div>

                {/* Grid: Unit + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Đơn vị công tác</label>
                    <input 
                      type="text" 
                      value={newMember.unit} 
                      onChange={e => setNewMember(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="Bí thư chi đoàn..."
                      className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Số điện thoại</label>
                    <input 
                      type="text" 
                      value={newMember.phone} 
                      onChange={e => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập SĐT..."
                      className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Grid: Position + Roles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Chức vụ trong ban</label>
                    <select 
                      value={newMember.position} 
                      onChange={e => setNewMember(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-bold"
                    >
                      <option value="Chủ nhiệm">Chủ nhiệm</option>
                      <option value="Phó Chủ nhiệm">Phó Chủ nhiệm</option>
                      <option value="Thành viên">Thành viên</option>
                      <option value="CTV">CTV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Vai trò truyền thông</label>
                    <input 
                      type="text" 
                      value={newMember.roles} 
                      onChange={e => setNewMember(prev => ({ ...prev, roles: e.target.value }))}
                      placeholder="Sự kiện, Kỹ thuật..."
                      className="w-full px-3 py-2.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-bold"
                    />
                  </div>
                </div>

              </div>

              {/* Form Actions Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all"
                >
                  Huỷ bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
                >
                  Đăng ký thành viên
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
