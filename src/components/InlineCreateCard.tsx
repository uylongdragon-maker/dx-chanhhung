'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { createInlineTask } from '@/app/workspace/kanban/actions'

export default function InlineCreateCard({ status }: { status: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Tự động focus vào ô nhập khi bấm "+ Thêm thẻ"
  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const handleSave = async () => {
    if (!title.trim()) {
      setIsAdding(false);
      return;
    }
    
    setIsSaving(true);
    await createInlineTask(title, status);
    setTitle('');
    setIsAdding(false);
    setIsSaving(false);
  }

  // Lắng nghe phím Enter để lưu
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setTitle('');
    }
  }

  if (!isAdding) {
    return (
      <button 
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center gap-2 p-3 mt-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/50 transition-colors text-sm font-semibold group"
      >
        <Plus size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
        Thêm thẻ...
      </button>
    )
  }

  return (
    <div className="mt-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/80 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm">
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tiêu đề công việc..."
        className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 p-0"
        rows={2}
        disabled={isSaving}
      />
      <div className="flex items-center gap-2 mt-3">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Đang thêm...' : 'Thêm thẻ'}
        </button>
        <button 
          onClick={() => { setIsAdding(false); setTitle(''); }}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
