'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import InternalLayout from '@/components/InternalLayout';
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
