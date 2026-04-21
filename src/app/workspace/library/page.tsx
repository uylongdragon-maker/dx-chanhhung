import { FolderOpen, FileText, Download, Search, Plus, Filter, MoreVertical, FileCode, FileImage, FileType } from 'lucide-react'

export default function LibraryPage() {
  const documents = [
    { id: 1, title: 'Form Kịch Bản Quay Tiktok Chuẩn', category: 'Kịch bản', date: '21/04/2026', type: 'DOCX', size: '1.2MB' },
    { id: 2, title: 'Quy trình Set-up Ánh Sáng Studio', category: 'Kỹ thuật', date: '20/04/2026', type: 'PDF', size: '4.5MB' },
    { id: 3, title: 'Brand Guidelines - Ban Truyền Thông', category: 'Thiết kế', date: '15/04/2026', type: 'PDF', size: '12.8MB' },
    { id: 4, title: 'Checklist Kiểm tra Thiết bị trước khi đi Quay', category: 'Quy trình', date: '12/04/2026', type: 'EXCEL', size: '850KB' },
    { id: 5, title: 'Mẫu Hợp đồng CTV Sản xuất Nội dung', category: 'Pháp lý', date: '10/04/2026', type: 'DOCX', size: '2.1MB' },
    { id: 6, title: 'Bộ Preset Màu Lightroom - Chánh Hưng Sắc', category: 'Hậu kỳ', date: '08/04/2026', type: 'ZIP', size: '45MB' },
  ];

  return (
    <div className="flex flex-col gap-10 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000 px-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <FolderOpen size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Knowledge Base</span>
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">
            Thư viện Tri thức
          </h2>
          <p className="text-slate-500 text-xs font-bold italic">
            "Tàng kinh các" lưu trữ kịch bản, quy trình và tài liệu nòng cốt của Đội.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-100 font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <Search size={16} /> Tìm kiếm
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-blue-600 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                <Plus size={16} /> Tải lên
            </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['Tất cả', 'Kịch bản', 'Kỹ thuật', 'Thiết kế', 'Quy trình', 'Hậu kỳ'].map((cat, idx) => (
            <button key={cat} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                idx === 0 
                ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20" 
                : "bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/60 text-slate-500 hover:bg-white dark:hover:bg-slate-800"
            }`}>
                {cat}
            </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white/30 dark:bg-slate-950/20 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 p-8 rounded-[3rem] shadow-2xl hover:shadow-blue-500/5 transition-all group flex flex-col relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                  doc.type === 'PDF' ? "bg-rose-100 text-rose-600" :
                  doc.type === 'EXCEL' ? "bg-emerald-100 text-emerald-600" :
                  doc.type === 'ZIP' ? "bg-amber-100 text-amber-600" :
                  "bg-blue-100 text-blue-600"
              }`}>
                {doc.type === 'PDF' ? <FileType size={28} /> : 
                 doc.type === 'EXCEL' ? <FileCode size={28} /> :
                 doc.type === 'ZIP' ? <FolderOpen size={28} /> :
                 <FileText size={28} />}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/50 dark:border-slate-800/50">
                    {doc.category}
                </span>
                <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter italic">{doc.size}</span>
              </div>
            </div>

            <div className="relative z-10">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-xl leading-tight tracking-tight mb-4 group-hover:text-blue-600 transition-colors">
                    {doc.title}
                </h3>
                
                <div className="h-1 w-12 bg-slate-100 dark:bg-slate-800 rounded-full mb-8 group-hover:w-24 transition-all duration-500"></div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Cập nhật: {doc.date}
                  </span>
              </div>
              
              <button className="relative w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/10 hover:bg-blue-600 transition-all hover:scale-110 active:scale-95 group/btn">
                <Download size={18} className="group-hover/btn:animate-bounce" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State / Bottom Info */}
      <div className="mt-10 p-10 bg-blue-600/5 border border-dashed border-blue-600/20 rounded-[3rem] text-center">
         <p className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Tàng kinh các điện tử</p>
         <p className="text-xs text-slate-500 font-bold italic">Nếu không tìm thấy tài liệu, hãy liên hệ Admin để được cấp quyền hoặc kiểm tra lại bộ lọc.</p>
      </div>
    </div>
  )
}
