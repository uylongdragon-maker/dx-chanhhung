'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { createInlineTask } from '@/app/workspace/kanban/actions'

export default function InlineCreateCard({ status }: { status: string }) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isAdding) inputRef.current?.focus()
  }, [isAdding])

  const handleSave = async () => {
    if (!title.trim()) { setIsAdding(false); return; }
    setIsSaving(true)
    await createInlineTask(title, status)
    setTitle('')
    setIsAdding(false)
    setIsSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setIsAdding(false); setTitle(''); }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 mt-1 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all text-sm font-semibold group"
      >
        <Plus size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
        Thêm thẻ
      </button>
    )
  }

  return (
    <div className="mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-3 rounded-2xl shadow-lg">
      <textarea
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tiêu đề thẻ việc..."
        className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
        rows={2}
        disabled={isSaving}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 disabled:opacity-40"
        >
          {isSaving ? 'Đang thêm...' : 'Thêm thẻ'}
        </button>
        <button
          onClick={() => { setIsAdding(false); setTitle(''); }}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
