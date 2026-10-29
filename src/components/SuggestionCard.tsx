'use client';

import React, { useState } from 'react';
import {
  Check,
  X,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  SpellCheck,
  Type,
  Palette,
} from 'lucide-react';
import { CorrectionSuggestion, ErrorCategory } from '@/lib/ai/types';

interface SuggestionCardProps {
  suggestion: CorrectionSuggestion;
  onAccept: (suggestion: CorrectionSuggestion) => void;
  onDismiss: (suggestion: CorrectionSuggestion) => void;
  onClose?: () => void;
  explanationLevel?: 'simple' | 'detailed';
}

const CATEGORY_META: Record<
  ErrorCategory,
  { label: string; icon: React.ElementType; colorClass: string; bgClass: string }
> = {
  grammar: {
    label: 'Grammar',
    icon: AlertCircle,
    colorClass: 'text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
    bgClass: 'bg-red-50 dark:bg-red-950/50',
  },
  spelling: {
    label: 'Spelling',
    icon: SpellCheck,
    colorClass: 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    bgClass: 'bg-amber-50 dark:bg-amber-950/50',
  },
  punctuation: {
    label: 'Punctuation',
    icon: Type,
    colorClass: 'text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    bgClass: 'bg-sky-50 dark:bg-sky-950/50',
  },
  clarity: {
    label: 'Clarity',
    icon: Sparkles,
    colorClass: 'text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    bgClass: 'bg-purple-50 dark:bg-purple-950/50',
  },
  style: {
    label: 'Style',
    icon: Palette,
    colorClass: 'text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
};

export default function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  onClose,
  explanationLevel = 'simple',
}: SuggestionCardProps) {
  const [showDetailed, setShowDetailed] = useState(explanationLevel === 'detailed');
  const meta = CATEGORY_META[suggestion.category] || CATEGORY_META.grammar;
  const CategoryIcon = meta.icon;

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 transition-all animate-in fade-in zoom-in-95 duration-150">
      {/* Header: Category Badge and Dismiss close */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.colorClass} ${meta.bgClass}`}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
            {meta.label}
          </span>
          {suggestion.rule && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              • {suggestion.rule}
            </span>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close suggestion card"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comparison: Original vs Suggested Replacement */}
      <div className="space-y-2 mb-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 w-16 shrink-0">
            Original:
          </span>
          <span className="text-sm font-medium text-red-600 dark:text-red-400 line-through decoration-red-400/80">
            {suggestion.originalPhrase}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase font-bold text-indigo-600 dark:text-indigo-400 w-16 shrink-0">
            Suggestion:
          </span>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {suggestion.replacementPhrase || '(remove phrase)'}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="text-xs text-slate-600 dark:text-slate-300 mb-3 space-y-1.5">
        <div className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{suggestion.explanation}</p>
        </div>

        {suggestion.detailedExplanation && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowDetailed(!showDetailed)}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <BookOpen className="w-3 h-3" />
              {showDetailed ? 'Hide Grammar Rule' : 'Show Detailed Rule & Explanation'}
              {showDetailed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDetailed && (
              <div className="mt-1.5 p-2.5 rounded bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-700 dark:text-slate-200 text-xs leading-relaxed border border-indigo-100 dark:border-indigo-900/60">
                {suggestion.detailedExplanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons: Accept & Dismiss */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onDismiss(suggestion)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Dismiss
        </button>

        <button
          onClick={() => onAccept(suggestion)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.02]"
        >
          <Check className="w-3.5 h-3.5" />
          Accept Correction
        </button>
      </div>
    </div>
  );
}
