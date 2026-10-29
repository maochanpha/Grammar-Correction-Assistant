'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  X,
  Briefcase,
  Heart,
  Zap,
  Coffee,
  Scissors,
  Lightbulb,
  Building2,
  Smile,
} from 'lucide-react';
import { RewriteTone } from '@/lib/ai/types';

interface SentenceRewriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentence: string;
  onReplace: (replacement: string) => void;
}

const TONES: { id: RewriteTone; label: string; icon: React.ElementType }[] = [
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'polite', label: 'Polite', icon: Heart },
  { id: 'confident', label: 'Confident', icon: Zap },
  { id: 'natural', label: 'Natural', icon: Coffee },
  { id: 'shorter', label: 'Shorter', icon: Scissors },
  { id: 'clearer', label: 'Clearer', icon: Lightbulb },
  { id: 'friendly', label: 'Friendly', icon: Smile },
  { id: 'formal', label: 'Formal', icon: Building2 },
];

export default function SentenceRewriterModal({
  isOpen,
  onClose,
  sentence,
  onReplace,
}: SentenceRewriterModalProps) {
  const [selectedTone, setSelectedTone] = useState<RewriteTone>('professional');
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRewrites = async (toneToUse = selectedTone) => {
    if (!sentence.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, tone: toneToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to rewrite sentence.');
      } else {
        setAlternatives(data.data.alternatives || []);
      }
    } catch {
      setError('Network error while generating rewrites.');
    } finally {
      setLoading(false);
    }
  };

  const handleToneChange = (tone: RewriteTone) => {
    setSelectedTone(tone);
    fetchRewrites(tone);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Sentence Rewriting Assistant
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore alternative ways to express your thought with tailored tone adjustments.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Original Sentence Display */}
        <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Original Selected Sentence:
          </span>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
            &ldquo;{sentence}&rdquo;
          </p>
        </div>

        {/* Tone Selector Pills */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
            Select Desired Writing Tone:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONES.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleToneChange(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25'
                      : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alternatives Section */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs font-medium">Generating tone-adapted variations...</p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Click any tone above or generate alternatives for this sentence.
              </p>
              <button
                onClick={() => fetchRewrites(selectedTone)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Generate Rewrites
              </button>
            </div>
          ) : (
            alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                    {alt}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    onClick={() => handleCopy(alt, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    onClick={() => {
                      onReplace(alt);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Replace in Editor
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Regenerate Button */}
        {alternatives.length > 0 && (
          <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Generated 3 alternative formulations.
            </span>
            <button
              onClick={() => fetchRewrites(selectedTone)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
