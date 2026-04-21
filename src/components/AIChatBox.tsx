'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Paperclip, Smile, Loader2, Bot, User } from 'lucide-react'

export default function AIChatBox() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'ai', text: 'Chào Uy Long, trạm hành dinh đã sẵn sàng. Có ý tưởng truyền thông nào mới không?' }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input || isLoading) return;
    
    const userMsg = input;
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/analyze-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();

      setMessages([...newMessages, { role: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'ai', text: "Lỗi kết nối rồi bạn ơi! Check lại mạng nha." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[500px] bg-white/30 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/60 dark:border-slate-800/60 rounded-[2.5rem] shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/40 dark:border-slate-800/60 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 shadow-inner">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-sm">Trợ lý AI</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Neural Hub Active</span>
            </div>
          </div>
        </div>
        <button className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
          Lịch sử quét
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 scrollbar-hide py-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-white/50 ${
                msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-blue-600 text-white'
            }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${
              msg.role === 'user' 
                ? 'bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 self-end rounded-tr-none border border-white/60 dark:border-slate-800/60' 
                : 'bg-blue-600 text-white self-start rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-blue-600/50 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-white" />
            </div>
            <div className="bg-blue-600/10 text-blue-600 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[12px] font-bold">AI đang phân tích...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 p-2 rounded-2xl border border-white/80 dark:border-slate-800/80 shadow-inner group focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
        <button className="p-2.5 text-slate-400 hover:text-blue-600 transition-colors"><Paperclip size={18}/></button>
        <input 
          type="text" 
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isLoading ? "Neural network processing..." : "Nhập yêu cầu phân tích..."} 
          className="flex-1 bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-100 text-sm font-bold placeholder:text-slate-400 disabled:opacity-50"
        />
        <button 
          onClick={handleSend} 
          disabled={!input || isLoading}
          className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
