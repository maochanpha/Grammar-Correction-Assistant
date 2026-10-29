'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import WritingEditor from '@/components/WritingEditor';
import { RefreshCw } from 'lucide-react';

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
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading document...</p>
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
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 py-4">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          }
        >
          <EditorContent />
        </Suspense>
      </main>
    </div>
  );
}
