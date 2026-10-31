'use client';

import React, { useState, useCallback } from 'react';
import { MessageSquare, X, Send, RefreshCw, FileText, User, Bot, Trash2 } from 'lucide-react';
import { WritingChatMessage } from '@/lib/ai/types';

interface AskAIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocumentText: string;
}

const QUICK_PROMPTS = [
  'Why is this sentence incorrect?',
  'Make this suitable for an email to my manager.',
  'Can you make this sound more professional?',
  'Is this sentence polite enough?',
  'Explain the grammar rule behind this change.',
];

export default function AskAIChatDrawer({
  isOpen,
  onClose,
  currentDocumentText,
}: AskAIChatDrawerProps) {
  const [messages, setMessages] = useState<WritingChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Writing Assistant. Ask me about grammar rules, tone adjustments, vocabulary, or how to polish your writing.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);

  const handleSend = useCallback(
    async (messageText = input) => {
      const textToSend = messageText.trim();
      if (!textToSend || loading) return;

      const newMessages: WritingChatMessage[] = [
        ...messages,
        { role: 'user', content: textToSend },
      ];
      setMessages(newMessages);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            documentContext: includeContext ? currentDocumentText : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.error || 'Sorry, I encountered an issue processing your query.',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.data.reply,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Network connection issue. Please check your connection and try again.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, includeContext, currentDocumentText]
  );

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Hello! I am your AI Writing Assistant. Ask me about grammar rules, tone adjustments, vocabulary, or how to polish your writing.',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full sm:w-[440px] h-full border-l border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-[#3647C8] dark:text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ask AI Assistant
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Grammar inquiries &amp; tone suggestions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Clear chat"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close Ask AI Drawer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context Attachment Toggle */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#131722] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Include document context</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#3647C8]"></div>
          </label>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0 text-[#3647C8] dark:text-indigo-400 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#3647C8] text-white rounded-tr-xs shadow-xs font-normal'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                  }`}
                >
                  {m.content}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2 items-center text-xs text-slate-400 p-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3647C8]" />
              <span>AI assistant is thinking…</span>
            </div>
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 overflow-x-auto flex gap-1.5 no-scrollbar">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                loading
                  ? 'opacity-50 pointer-events-none'
                  : 'border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#3647C8] hover:text-[#3647C8] dark:hover:text-indigo-300'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131722] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your writing…"
            disabled={loading}
            className="flex-1 h-9.5 px-3 py-2 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="w-9.5 h-9.5 rounded-lg bg-[#3647C8] text-white flex items-center justify-center hover:bg-[#2b39a8] disabled:opacity-40 disabled:pointer-events-none transition-colors shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
