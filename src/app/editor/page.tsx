'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import InternalLayout from '@/components/InternalLayout';
import WritingEditor from '@/components/WritingEditor';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, Lock } from 'lucide-react';

function EditorContent() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('docId') || undefined;
  const [loading, setLoading] = useState(Boolean(docId));
  const [initialText, setInitialText] = useState('');
  const [initialTitle, setInitialTitle] = useState('Untitled Writing');

  useEffect(() => {
    if (docId) {
      fetch(`/api/documents/${docId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.document) {
            setInitialText(data.document.currentText || data.document.originalText || '');
            setInitialTitle(data.document.title || 'Untitled Writing');
          }
        })
        .catch((err) => console.error('Failed to load document:', err))
        .finally(() => setLoading(false));
    }
  }, [docId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">Loading document…</p>
      </div>
    );
  }

  return (
    <WritingEditor
      key={docId || 'new'}
      documentId={docId}
      initialText={initialText}
      initialTitle={initialTitle}
    />
  );
}

export default function EditorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?redirect=/editor');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <InternalLayout title="Writing Editor">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-slate-500">
          <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">Verifying session…</p>
        </div>
      </InternalLayout>
    );
  }

  if (!user) {
    return (
      <InternalLayout title="Writing Editor">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#3647C8] dark:text-indigo-400 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Sign In to Use Writing Editor
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Please sign in or create an account to access the AI writing assistant and grammar correction features.
          </p>
          <Button asChild>
            <Link href="/auth/login?redirect=/editor">Sign In</Link>
          </Button>
        </div>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout title="Writing Editor">
      <Suspense
        fallback={
          <div className="min-h-[400px] flex items-center justify-center p-12 text-slate-500">
            <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
          </div>
        }
      >
        <EditorContent />
      </Suspense>
    </InternalLayout>
  );
}
