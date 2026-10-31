'use client';

import React, { useState } from 'react';
import {
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
import { Button } from '@/components/ui/Button';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#131722] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Sentence Rewriting Assistant
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore alternative formulations adapted to your desired tone.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original Sentence Display */}
        <div className="my-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
            Original Sentence
          </span>
          <p className="text-sm text-slate-800 dark:text-slate-200 italic">
            &ldquo;{sentence}&rdquo;
          </p>
        </div>

        {/* Tone Selector Pills */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Target Tone
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleToneChange(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[#3647C8] text-white border-[#3647C8] shadow-xs'
                      : 'bg-white dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alternatives Section */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
          {error && (
            <div className="p-3 rounded-lg text-xs text-red-600 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center gap-2.5 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#3647C8]" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Generating tailored variations…
              </p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              <p className="text-xs mb-3">
                Select a tone to generate tailored sentence variations.
              </p>
              <Button onClick={() => fetchRewrites(selectedTone)} size="sm">
                Generate Variations
              </Button>
            </div>
          ) : (
            alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-[#3647C8]/40 transition-colors"
              >
                <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed mb-3">
                  {alt}
                </p>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleCopy(alt, idx)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedIndex === idx ? 'Copied' : 'Copy'}
                  </button>

                  <Button
                    onClick={() => {
                      onReplace(alt);
                      onClose();
                    }}
                    size="sm"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Replace Selection
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {alternatives.length > 0 && (
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>{alternatives.length} alternatives generated</span>
            <button
              onClick={() => fetchRewrites(selectedTone)}
              disabled={loading}
              className="flex items-center gap-1 text-xs font-medium text-[#3647C8] dark:text-indigo-400 hover:underline disabled:opacity-50"
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
