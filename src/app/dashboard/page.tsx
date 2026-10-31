'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  BookOpen,
  ArrowRight,
  Plus,
  RefreshCw,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import InternalLayout from '@/components/InternalLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

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

const STAT_CARDS = [
  {
    label: 'Total Documents',
    getValue: (d: DashboardData) => d.stats.totalDocuments,
    icon: FileText,
    iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
  },
  {
    label: 'Words Corrected',
    getValue: (d: DashboardData) => d.stats.totalWordsCorrected,
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    label: 'Correction Sessions',
    getValue: (d: DashboardData) => d.stats.totalSessions,
    icon: Sparkles,
    iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40',
  },
  {
    label: 'Writing Activity',
    getValue: (d: DashboardData) => d.recentActivity.length,
    icon: Calendar,
    iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
  },
];

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
      <InternalLayout title="Dashboard">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-slate-500">
          <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">
            Loading dashboard…
          </p>
        </div>
      </InternalLayout>
    );
  }

  if (!user) {
    return (
      <InternalLayout title="Dashboard">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#3647C8] dark:text-indigo-400 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Sign In to View Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Track your writing metrics, documents, and historical activity in your private workspace.
          </p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </InternalLayout>
    );
  }

  const firstName = user.name?.trim() ? user.name.trim().split(' ')[0] : 'Writer';
  const recentDocuments = data?.recentDocuments || [];

  return (
    <InternalLayout title="Dashboard">
      <div className="space-y-6">
        {/* A. Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Here&apos;s an overview of your writing workspace.
            </p>
          </div>
          <Button asChild className="shrink-0 shadow-xs">
            <Link href="/editor">
              <Plus className="w-4 h-4 mr-1.5" />
              New Document
            </Link>
          </Button>
        </div>

        {/* B. Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, getValue, icon: Icon, iconColor }) => {
            const val = data ? getValue(data) : 0;
            return (
              <div
                key={label}
                className="p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
                    {val.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* C & D. Main Content Grid: Recent Documents (2 cols) & Quick Actions (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* C. Recent Documents */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent Documents
                </h2>
              </div>
              <Link
                href="/documents"
                className="text-xs font-semibold text-[#3647C8] hover:text-[#2b39a8] dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentDocuments.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No documents yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Create your first document to start polishing your writing with AI.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/editor">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create Document
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentDocuments.slice(0, 5).map((doc) => {
                  const dateFormatted = new Date(doc.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });
                  return (
                    <div
                      key={doc.id}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <Link
                          href={`/editor?docId=${doc.id}`}
                          className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-[#3647C8] dark:hover:text-indigo-400 transition-colors truncate block"
                        >
                          {doc.title || 'Untitled Writing'}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>{doc.wordCount} words</span>
                          <span>•</span>
                          <span className="uppercase text-[10px] tracking-wider font-medium text-slate-400 dark:text-slate-500">
                            {doc.language}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline-block">
                          {dateFormatted}
                        </span>
                        <Link
                          href={`/editor?docId=${doc.id}`}
                          className="text-xs font-semibold text-slate-600 hover:text-[#3647C8] dark:text-slate-400 dark:hover:text-indigo-400 px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Open
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* D. Quick Actions */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              <Link
                href="/editor"
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-[#3647C8]/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all duration-150 group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-[#3647C8] dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-[#3647C8] dark:group-hover:text-indigo-400 transition-colors">
                    Start Writing
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    New blank document
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#3647C8] dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              <Link
                href="/editor"
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all duration-150 group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Check Grammar
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste &amp; correct text
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              <Link
                href="/documents"
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all duration-150 group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Open Documents
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage saved writings
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </InternalLayout>
  );
}
