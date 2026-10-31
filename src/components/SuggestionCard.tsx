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
  SpellCheck,
  Type,
  Palette,
  Sparkles,
} from 'lucide-react';
import { CorrectionSuggestion, ErrorCategory } from '@/lib/ai/types';
import { Button } from '@/components/ui/Button';

interface SuggestionCardProps {
  suggestion: CorrectionSuggestion;
  onAccept: (suggestion: CorrectionSuggestion) => void;
  onDismiss: (suggestion: CorrectionSuggestion) => void;
  onClose?: () => void;
  explanationLevel?: 'simple' | 'detailed';
}

const CATEGORY_CONFIG: Record<
  ErrorCategory,
  {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
    borderLeftClass: string;
  }
> = {
  grammar: {
    label: 'Grammar',
    icon: AlertCircle,
    badgeClass: 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/60',
    borderLeftClass: 'border-l-red-500',
  },
  spelling: {
    label: 'Spelling',
    icon: SpellCheck,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/60',
    borderLeftClass: 'border-l-amber-500',
  },
  punctuation: {
    label: 'Punctuation',
    icon: Type,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/60',
    borderLeftClass: 'border-l-blue-500',
  },
  clarity: {
    label: 'Clarity',
    icon: Sparkles,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/60',
    borderLeftClass: 'border-l-purple-500',
  },
  style: {
    label: 'Style',
    icon: Palette,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60',
    borderLeftClass: 'border-l-emerald-500',
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
  const meta = CATEGORY_CONFIG[suggestion.category] || CATEGORY_CONFIG.grammar;
  const CategoryIcon = meta.icon;

  return (
    <div
      className={`w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs p-4 transition-all duration-150 border-l-[3px] ${meta.borderLeftClass} hover:border-slate-300 dark:hover:border-slate-700`}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${meta.badgeClass}`}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
            {meta.label}
          </span>
          {suggestion.rule && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {suggestion.rule}
            </span>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close suggestion"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Difference Comparison */}
      <div className="space-y-1.5 mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-18 shrink-0">
            Original
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400 line-through decoration-red-400">
            {suggestion.originalPhrase}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-[#3647C8] dark:text-indigo-400 uppercase tracking-wider w-18 shrink-0">
            Suggestion
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {suggestion.replacementPhrase || '(remove phrase)'}
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
        <div className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p>{suggestion.explanation}</p>
        </div>

        {suggestion.detailedExplanation && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => setShowDetailed(!showDetailed)}
              className="flex items-center gap-1 text-[11px] font-medium text-[#3647C8] dark:text-indigo-400 hover:underline"
            >
              <BookOpen className="w-3 h-3" />
              {showDetailed ? 'Hide detailed explanation' : 'Show detailed explanation'}
              {showDetailed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDetailed && (
              <div className="mt-1.5 p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {suggestion.detailedExplanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button
          onClick={() => onDismiss(suggestion)}
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Dismiss
        </Button>

        <Button
          onClick={() => onAccept(suggestion)}
          size="sm"
          className="text-xs"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Accept
        </Button>
      </div>
    </div>
  );
}
