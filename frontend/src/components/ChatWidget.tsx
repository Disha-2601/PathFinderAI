import React, { useMemo, useState } from 'react';
import { Bot, MessageSquare, Send, X } from 'lucide-react';
import { goalsApi } from '../services/api';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';

const nowIso = () => new Date().toISOString();

export const ChatWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ask me about your roadmap progress, assessment scores, or the next best course node.',
      timestamp: nowIso(),
    },
  ]);

  const contextLabel = useMemo(() => user?.target_role || 'your target role', [user]);

  if (!isAuthenticated) return null;

  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: nowIso(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await goalsApi.chat({
        message: trimmed,
        context: {
          user_id: user?.id,
          target_role: contextLabel,
        },
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          timestamp: nowIso(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `I could not reach the assistant service, but based on your ${contextLabel} roadmap, the best next step is to continue the first in-progress node and complete its assessment before advancing.`,
          timestamp: nowIso(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] h-[30rem] max-h-[calc(100vh-7rem)] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">PathFinder Assistant</p>
                <p className="text-[11px] text-slate-400">Roadmap progress and next steps</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="text-xs text-slate-500 px-3 py-2">Thinking through your roadmap...</div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask for next steps..."
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center disabled:opacity-50"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-2xl shadow-cyan-500/30 border border-cyan-300/30 flex items-center justify-center hover:scale-105 transition-transform"
        title="Open PathFinder assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};
