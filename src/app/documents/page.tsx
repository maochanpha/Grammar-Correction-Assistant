'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Plus,
  Calendar,
  FileText,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  X,
  Lock,
} from 'lucide-react';
import InternalLayout from '@/components/InternalLayout';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';

interface DocumentItem {
  id: string;
  title: string;
  originalText: string;
  currentText: string;
  language: string;
  mode?: string;
  createdAt: string;
  updatedAt: string;
}

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Date Created' },
  { value: 'title', label: 'Title' },
];

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({ search, sortBy, order }).toString();
      const res = await fetch(`/api/documents?${query}`);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, [user, search, sortBy, order]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDocuments();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchDocuments]);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setSaving(deleteId);
    try {
      const res = await fetch(`/api/documents/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteId));
        setMessage({ type: 'success', text: 'Document deleted successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete document.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while deleting document.' });
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
      setSaving(null);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  const handleStartRename = (doc: DocumentItem) => {
    setRenameDoc(doc);
    setRenameTitle(doc.title);
    setRenameOpen(true);
  };

  const handleSaveRename = async () => {
    if (!renameDoc || !renameTitle.trim()) return;
    setSaving(renameDoc.id);
    try {
      const res = await fetch(`/api/documents/${renameDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameTitle.trim() }),
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === renameDoc.id ? { ...d, title: renameTitle.trim() } : d))
        );
        setMessage({ type: 'success', text: 'Document renamed.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to rename document.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error while renaming.' });
    } finally {
      setRenameOpen(false);
      setRenameDoc(null);
      setSaving(null);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  if (authLoading) {
    return (
      <InternalLayout title="My Documents">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-slate-500">
          <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">
            Loading documents…
          </p>
        </div>
      </InternalLayout>
    );
  }

  if (!user) {
    return (
      <InternalLayout title="My Documents">
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#3647C8] dark:text-indigo-400 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Sign In to Access Your Documents
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Document history is private and tied securely to your account.
          </p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </InternalLayout>
    );
  }

  const filtered = documents
    .slice()
    .sort((a, b) => {
      const av = String(a[sortBy as keyof DocumentItem] ?? '');
      const bv = String(b[sortBy as keyof DocumentItem] ?? '');
      if (av < bv) return order === 'asc' ? -1 : 1;
      if (av > bv) return order === 'asc' ? 1 : -1;
      return 0;
    })
    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <InternalLayout title="My Documents">
      <div className="space-y-6">
        {/* A. Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              My Documents
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organize and continue your saved writing.
            </p>
          </div>
          <Button asChild className="shrink-0 shadow-xs">
            <Link href="/editor">
              <Plus className="w-4 h-4 mr-1.5" />
              New Document
            </Link>
          </Button>
        </div>

        {/* Toast Feedback */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60'
                : 'bg-red-50 text-red-800 border border-red-200/80 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/60'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* B. Search & Sorting Toolbar */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title…"
              className="w-full h-9.5 pl-9.5 pr-8 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sorting Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9.5 text-xs rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3647C8] transition-colors"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
              className="h-9.5 text-xs rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3647C8] transition-colors"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* C. Documents List (Content-Driven Height) */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Retrieving saved writings…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          /* E. Empty State */
          <div className="py-16 px-6 text-center rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#3647C8] dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {search ? 'No documents match your search' : 'Your writing starts here'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {search
                ? 'Try a different search query or clear the filter.'
                : 'Create your first document to begin improving your writing.'}
            </p>
            <Button asChild size="sm" className="mt-4 shadow-xs">
              <Link href="/editor">
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Document
              </Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3 text-center">Last Modified</th>
                    <th className="px-5 py-3 text-center">Words</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((doc) => {
                    const wordCount = doc.currentText || doc.originalText
                      ? (doc.currentText || doc.originalText).split(/\s+/).filter(Boolean).length
                      : 0;
                    const dateFormatted = new Date(doc.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Title & Language */}
                        <td className="px-5 py-4">
                          <Link
                            href={`/editor?docId=${doc.id}`}
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-[#3647C8] dark:hover:text-indigo-400 transition-colors block truncate max-w-sm"
                          >
                            {doc.title || 'Untitled Writing'}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {doc.language}
                            </span>
                            {doc.mode && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                                  {doc.mode.replace('_', ' ')}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Last Modified */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {dateFormatted}
                          </span>
                        </td>

                        {/* Words */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {wordCount.toLocaleString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/editor?docId=${doc.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3647C8] dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Open in Editor"
                            >
                              <BookOpen className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleStartRename(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Rename Document"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(doc.id);
                                setDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* F. Mobile Cards View */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((doc) => {
                const wordCount = doc.currentText || doc.originalText
                  ? (doc.currentText || doc.originalText).split(/\s+/).filter(Boolean).length
                  : 0;
                const dateFormatted = new Date(doc.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={doc.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/editor?docId=${doc.id}`}
                          className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-[#3647C8] transition-colors truncate block"
                        >
                          {doc.title || 'Untitled Writing'}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {dateFormatted} • {wordCount} words
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/editor?docId=${doc.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#3647C8] hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <BookOpen className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleStartRename(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(doc.id);
                            setDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Modal
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename Document"
        description={renameDoc ? `Change title for "${renameDoc.title}".` : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              New Title
            </label>
            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              autoFocus
              className="w-full h-9.5 px-3 py-2 text-sm rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#3647C8] focus:ring-1 focus:ring-[#3647C8]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameOpen(false)}
              disabled={saving !== null}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRename}
              disabled={saving !== null || !renameTitle.trim()}
            >
              {saving ? 'Renaming…' : 'Rename Document'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Document"
        description="This will permanently delete this document from your library. This action cannot be undone."
      >
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(false)}
            disabled={saving !== null}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirmDelete}
            disabled={saving !== null}
          >
            {saving ? 'Deleting…' : 'Delete Document'}
          </Button>
        </div>
      </Modal>
    </InternalLayout>
  );
}
