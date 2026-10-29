'use client';

import React from 'react';
import {
  Activity,
  BookOpen,
  Clock,
  FileText,
  AlertCircle,
  Sparkles,
  Palette,
  Lightbulb,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { WritingQualityInsights } from '@/lib/ai/types';

interface WritingInsightsPanelProps {
  insights: WritingQualityInsights;
  className?: string;
}

export default function WritingInsightsPanel({
  insights,
  className = '',
}: WritingInsightsPanelProps) {
  // Score color calculation
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400 stroke-emerald-500';
    if (score >= 70) return 'text-indigo-600 dark:text-indigo-400 stroke-indigo-500';
    if (score >= 55) return 'text-amber-600 dark:text-amber-400 stroke-amber-500';
    return 'text-red-600 dark:text-red-400 stroke-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900';
    if (score >= 70) return 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900';
    if (score >= 55) return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
    return 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900';
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-6 ${className}`}
    >
      {/* Panel Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Writing Quality & Insights
          </h3>
        </div>
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Heuristic Analysis
        </span>
      </div>

      {/* Main Score & Quality Gauge */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${getScoreBg(
          insights.overallQualityScore
        )}`}
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Overall Quality Score
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              className={`text-3xl font-black tracking-tight ${getScoreColor(
                insights.overallQualityScore
              )}`}
            >
              {insights.overallQualityScore}
            </span>
            <span className="text-xs font-bold text-slate-400">/ 100</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {insights.qualityVerdict}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Calculated based on error density, readability score, and sentence complexity.
          </p>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={getScoreColor(insights.overallQualityScore)}
              strokeDasharray={`${insights.overallQualityScore}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-xs font-bold text-slate-700 dark:text-slate-200">
            {insights.overallQualityScore}%
          </span>
        </div>
      </div>

      {/* Real-Time Statistics Grid */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Text Statistics
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Words</span>
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {insights.wordCount}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Sentences</span>
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {insights.sentenceCount}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Reading Time</span>
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              ~{insights.readingTimeMinutes}m
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Characters</span>
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {insights.characterCount}
            </span>
          </div>
        </div>
      </div>

      {/* Readability & Grade Level */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Flesch Readability Score
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-slate-800 dark:text-white">
              {insights.readingEaseScore}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              {insights.readingGradeLevel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Benchmark</span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            60-70 = Standard
          </span>
        </div>
      </div>

      {/* Issue Breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Issues Detected
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
            <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              Grammar
            </div>
            <span className="text-lg font-black text-red-700 dark:text-red-300 block mt-1">
              {insights.grammarIssuesCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
            <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Clarity
            </div>
            <span className="text-lg font-black text-purple-700 dark:text-purple-300 block mt-1">
              {insights.clarityIssuesCount}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <Palette className="w-3.5 h-3.5" />
              Style
            </div>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 block mt-1">
              {insights.styleIssuesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Contextual Guidance Tips */}
      {insights.guidanceTips && insights.guidanceTips.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Editorial Guidance
          </h4>
          <div className="space-y-1.5">
            {insights.guidanceTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
