'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Layers,
  Plus,
  RefreshCw,
  Lock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { WRITING_MODES } from '@/lib/ai/types';

interface DashboardData {
  stats: {
    totalDocuments: number;
    totalWordsCorrected: number;
    totalSessions: number;
    modeCounts: Record<string, number>;
  };
  recentDocuments: {
    id: string;
    title: string;
    currentText: string;
    language: string;
    wordCount: number;
    updatedAt: string;
  }[];
  recentActivity: {
    id: string;
    requestType: string;
    wordCount: number;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch('/api/dashboard')
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            setData(resData);
          }
        })
        .catch((err) => console.error('Dashboard error:', err))
        .finally(() => setLoading(false));
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Sign In to View Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Track real writing metrics, documents, and historical activity.
          </p>
          <Link
            href="/auth/login"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="text-xs uppercase tracking-widest font-bold text-indigo-300">
              Workspace Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user.name || 'Writer'}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-lg leading-relaxed">
              Your grammar assistant is ready. You have corrected{' '}
              <strong>{data?.stats.totalWordsCorrected || 0} words</strong> across{' '}
              <strong>{data?.stats.totalDocuments || 0} documents</strong>.
            </p>
          </div>

          <Link
            href="/editor"
            className="relative z-10 shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-indigo-950 font-bold text-sm hover:bg-indigo-50 shadow-md transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Start New Writing</span>
          </Link>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Saved Documents
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {data?.stats.totalDocuments || 0}
              </p>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Words Corrected
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {data?.stats.totalWordsCorrected.toLocaleString() || 0}
              </p>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Correction Sessions
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {data?.stats.totalSessions || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Documents & Quick Modes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Documents (2 Cols) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Recent Documents
              </h2>
              <Link
                href="/documents"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!data?.recentDocuments || data.recentDocuments.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-sm font-medium mb-2">No documents created yet.</p>
                <Link
                  href="/editor"
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Create your first document →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/editor?docId=${doc.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
                  >
                    <div className="min-w-0 pr-3">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {doc.currentText || '(Empty)'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                        {doc.wordCount} words
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Mode Access Presets (1 Col) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-4 h-4 text-purple-500" />
              Quick Mode Start
            </h2>

            <div className="space-y-2.5">
              {['grammar_fix', 'professional', 'simplify', 'academic', 'friendly'].map((mKey) => {
                const m = WRITING_MODES[mKey as keyof typeof WRITING_MODES];
                return (
                  <Link
                    key={m.id}
                    href={`/editor`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {m.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {m.shortDescription}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
