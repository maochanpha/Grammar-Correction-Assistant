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
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 70) return 'text-indigo-600 dark:text-indigo-400';
    if (score >= 55) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-50/50 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-900/50';
    if (score >= 70) return 'bg-indigo-50/50 border-indigo-200/80 dark:bg-indigo-950/20 dark:border-indigo-900/50';
    if (score >= 55) return 'bg-amber-50/50 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/50';
    return 'bg-red-50/50 border-red-200/80 dark:bg-red-950/20 dark:border-red-900/50';
  };

  return (
    <div
      className={`rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs p-5 space-y-5 ${className}`}
    >
      {/* Panel Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-[#3647C8] dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Writing Quality &amp; Insights
          </h3>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          Automated Analysis
        </span>
      </div>

      {/* Main Score & Quality Gauge */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${getScoreBg(
          insights.overallQualityScore
        )}`}
      >
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Overall Quality Score
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-3xl font-bold tracking-tight ${getScoreColor(
              insights.overallQualityScore
            )}`}>
              {insights.overallQualityScore}
            </span>
            <span className="text-xs font-medium text-slate-400">/ 100</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ml-1">
              {insights.qualityVerdict}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Based on error density, readability score, and sentence complexity.
          </p>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
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
          <span className="absolute text-xs font-bold text-slate-700 dark:text-slate-300">
            {insights.overallQualityScore}%
          </span>
        </div>
      </div>

      {/* Real-Time Statistics Grid */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
          Text Statistics
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="text-xs">Words</span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {insights.wordCount}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-xs">Sentences</span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {insights.sentenceCount}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">Reading Time</span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ~{insights.readingTimeMinutes}m
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-xs">Characters</span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {insights.characterCount}
            </span>
          </div>
        </div>
      </div>

      {/* Readability & Grade Level */}
      <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Flesch Readability Score
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {insights.readingEaseScore}
            </span>
            <span className="text-xs font-medium text-[#3647C8] dark:text-indigo-400">
              {insights.readingGradeLevel}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Benchmark</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            60–70 = Standard
          </span>
        </div>
      </div>

      {/* Issue Breakdown */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
          Issues Detected
        </h4>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl border border-red-200/70 text-red-700 dark:border-red-900/50 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              Grammar
            </div>
            <span className="text-lg font-bold block mt-1">
              {insights.grammarIssuesCount}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-purple-200/70 text-purple-700 dark:border-purple-900/50 dark:text-purple-400 bg-purple-50/40 dark:bg-purple-950/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Clarity
            </div>
            <span className="text-lg font-bold block mt-1">
              {insights.clarityIssuesCount}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-emerald-200/70 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Palette className="w-3.5 h-3.5" />
              Style
            </div>
            <span className="text-lg font-bold block mt-1">
              {insights.styleIssuesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Contextual Guidance Tips */}
      {insights.guidanceTips && insights.guidanceTips.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
            Editorial Guidance
          </h4>
          <div className="space-y-1.5">
            {insights.guidanceTips.map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#3647C8] dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
