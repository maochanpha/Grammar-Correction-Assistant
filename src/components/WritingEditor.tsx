'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Check,
  Copy,
  RotateCcw,
  Trash2,
  Clipboard,
  FileCheck,
  Save,
  MessageSquare,
  Activity,
  Layers,
  ArrowRightLeft,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCheck,
  BookOpen,
} from 'lucide-react';
import {
  WritingMode,
  LanguageVariant,
  ExplanationLevel,
  CorrectionSuggestion,
  GrammarCorrectionResult,
  WRITING_MODES,
} from '@/lib/ai/types';
import { applySuggestion, applyAllSuggestions } from '@/lib/ai/offset-validator';
import { analyzeWritingQuality, getWords, getSentences } from '@/lib/ai/text-analysis';
import SuggestionCard from './SuggestionCard';
import SentenceRewriterModal from './SentenceRewriterModal';
import WritingInsightsPanel from './WritingInsightsPanel';
import AskAIChatDrawer from './AskAIChatDrawer';
import DiffViewer from './DiffViewer';
import { useAuth } from '@/context/AuthContext';

interface WritingEditorProps {
  initialText?: string;
  initialTitle?: string;
  documentId?: string;
}

const SAMPLE_TEXT =
  "I has send the report yesterday but he not reply me yet. She don't like coffee because it is to bitter for her. We could of finished the project more better if we had more time.";

export default function WritingEditor({
  initialText = '',
  initialTitle = 'Untitled Writing',
  documentId: propDocId,
}: WritingEditorProps) {
  const { user } = useAuth();

  // State
  const [docId, setDocId] = useState<string | undefined>(propDocId);
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [history, setHistory] = useState<string[]>([initialText]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [mode, setMode] = useState<WritingMode>('grammar_fix');
  const [language, setLanguage] = useState<LanguageVariant>('en-US');
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('simple');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrammarCorrectionResult | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<CorrectionSuggestion | null>(null);

  const [rightTab, setRightTab] = useState<'corrected' | 'suggestions' | 'diff' | 'insights'>('corrected');
  const [mobileTab, setMobileTab] = useState<'editor' | 'result'>('editor');

  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Modals & Drawers
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [selectedForRewrite, setSelectedForRewrite] = useState('');
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync user preferences if loaded
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.preferredWritingMode) {
        setMode(user.preferences.preferredWritingMode as WritingMode);
      }
      if (user.preferences.preferredEnglishVariant) {
        setLanguage(user.preferences.preferredEnglishVariant);
      }
      if (user.preferences.explanationLevel) {
        setExplanationLevel(user.preferences.explanationLevel);
      }
    }
  }, [user]);

  // Real-time quick stats on input
  const words = getWords(text);
  const sentences = getSentences(text);
  const wordCount = words.length;
  const charCount = text.length;
  const sentenceCount = sentences.length;

  // History tracking for undo/redo
  const updateTextWithHistory = (newText: string) => {
    setText(newText);
    setSaveStatus('unsaved');
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setText(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setText(history[historyIndex + 1]);
    }
  };

  const handleClear = () => {
    updateTextWithHistory('');
    setResult(null);
    setActiveSuggestion(null);
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        updateTextWithHistory(clipText);
      }
    } catch {
      // Fallback
      textareaRef.current?.focus();
    }
  };

  const handleLoadSample = () => {
    updateTextWithHistory(SAMPLE_TEXT);
  };

  // Run Grammar Correction API
  const handleCorrect = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setActiveSuggestion(null);

    try {
      const res = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          language,
          explanationLevel,
          documentId: docId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to correct grammar.');
      } else {
        setResult(data.data);
        setRightTab('corrected');
        setMobileTab('result');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while correcting grammar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCorrect();
    }
  };

  // Accept Individual Suggestion
  const handleAcceptSuggestion = (suggestion: CorrectionSuggestion) => {
    if (!result) return;
    const { updatedText, remainingSuggestions } = applySuggestion(
      text,
      suggestion,
      result.suggestions
    );

    updateTextWithHistory(updatedText);

    const grammarCount = remainingSuggestions.filter(
      (s) => s.category === 'grammar' || s.category === 'spelling'
    ).length;
    const clarityCount = remainingSuggestions.filter((s) => s.category === 'clarity').length;
    const styleCount = remainingSuggestions.filter(
      (s) => s.category === 'style' || s.category === 'punctuation'
    ).length;

    const newInsights = analyzeWritingQuality(updatedText, grammarCount, clarityCount, styleCount);

    setResult({
      ...result,
      correctedText: updatedText,
      suggestions: remainingSuggestions,
      qualityInsights: newInsights,
    });

    setActiveSuggestion(null);
  };

  // Dismiss Individual Suggestion
  const handleDismissSuggestion = (suggestion: CorrectionSuggestion) => {
    if (!result) return;
    const remaining = result.suggestions.filter((s) => s.id !== suggestion.id);
    setResult({
      ...result,
      suggestions: remaining,
    });
    setActiveSuggestion(null);
  };

  // Accept All Suggestions
  const handleAcceptAll = () => {
    if (!result || result.suggestions.length === 0) return;
    const fullyUpdatedText = applyAllSuggestions(text, result.suggestions);
    updateTextWithHistory(fullyUpdatedText);

    const newInsights = analyzeWritingQuality(fullyUpdatedText, 0, 0, 0);

    setResult({
      ...result,
      correctedText: fullyUpdatedText,
      suggestions: [],
      qualityInsights: newInsights,
    });
    setActiveSuggestion(null);
  };

  // Copy Corrected Text
  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Replace Original with Corrected
  const handleReplaceOriginal = () => {
    if (!result) return;
    updateTextWithHistory(result.correctedText);
    setMobileTab('editor');
  };

  // Sentence Rewriter Trigger
  const handleTriggerRewrite = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    let selectedText = text.substring(start, end).trim();

    if (!selectedText) {
      // If nothing selected, pick the first sentence or full text
      selectedText = sentences[0] || text.trim();
    }

    if (!selectedText) {
      alert('Please enter or select a sentence to rewrite.');
      return;
    }

    setSelectedForRewrite(selectedText);
    setRewriteModalOpen(true);
  };

  // Replace rewritten sentence in text
  const handleApplyRewrite = (newSentence: string) => {
    if (!selectedForRewrite) return;
    const updated = text.replace(selectedForRewrite, newSentence);
    updateTextWithHistory(updated);
  };

  // Save Document to database (if authenticated)
  const handleSaveDocument = useCallback(async () => {
    if (!user) {
      alert('Please sign in or create a free account to save documents to your history.');
      return;
    }

    setSaveStatus('saving');
    try {
      if (docId) {
        // Update existing
        const res = await fetch(`/api/documents/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            currentText: result?.correctedText || text,
            originalText: text,
            language,
          }),
        });
        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('unsaved');
        }
      } else {
        // Create new
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            currentText: result?.correctedText || text,
            originalText: text,
            language,
          }),
        });
        const data = await res.json();
        if (res.ok && data.document) {
          setDocId(data.document.id);
          setSaveStatus('saved');
        } else {
          setSaveStatus('unsaved');
        }
      }
    } catch {
      setSaveStatus('unsaved');
    }
  }, [user, docId, title, result, text, language]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Document Header & Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('unsaved');
            }}
            placeholder="Document Title..."
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors w-full max-w-md"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Language Variant Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageVariant)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="en-US">American English (en-US)</option>
            <option value="en-GB">British English (en-GB)</option>
          </select>

          {/* Explanation Level Selector */}
          <select
            value={explanationLevel}
            onChange={(e) => setExplanationLevel(e.target.value as ExplanationLevel)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="simple">Simple Explanations</option>
            <option value="detailed">Detailed Grammar Rules</option>
          </select>

          {/* Save Button */}
          <button
            onClick={handleSaveDocument}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              saveStatus === 'saved'
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? 'Saved'
                : 'Save Document'}
            </span>
          </button>
        </div>
      </div>

      {/* Writing Mode Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Writing Mode:
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {WRITING_MODES[mode].detailedDescription}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {Object.values(WRITING_MODES).map((m) => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{m.name}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    isSelected
                      ? 'bg-indigo-700/60 text-indigo-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            mobileTab === 'editor'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Original Editor ({wordCount} words)
        </button>
        <button
          onClick={() => setMobileTab('result')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            mobileTab === 'result'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          AI Results & Suggestions {result ? `(${result.suggestions.length})` : ''}
        </button>
      </div>

      {/* Main Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT PANEL: Original Text Editor */}
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[540px] overflow-hidden ${
            mobileTab === 'editor' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Editor Header Toolbar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Original Text
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handlePaste}
                title="Paste from clipboard"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Clipboard className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleTriggerRewrite}
                title="Rewrite Selected Sentence"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-950/60 border border-purple-200 dark:border-purple-900 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                Rewrite
              </button>

              <button
                onClick={handleClear}
                title="Clear all text"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative flex-1 p-4">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => updateTextWithHistory(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste or type any English text here to detect and correct grammar, spelling, and sentence flow issues..."
              className="w-full h-full min-h-[360px] bg-transparent resize-none text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed focus:outline-none placeholder:text-slate-400 font-normal"
            />

            {text.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Start writing or try our example
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Check grammar, spelling, tone, and readability with instant AI explanations.
                </p>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Load Example Sentence
                </button>
              </div>
            )}
          </div>

          {/* Editor Footer: Stats & Correct Button */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                <strong>{wordCount}</strong> words
              </span>
              <span>•</span>
              <span>
                <strong>{charCount}</strong> characters
              </span>
              <span>•</span>
              <span>
                <strong>{sentenceCount}</strong> sentences
              </span>
            </div>

            <button
              onClick={handleCorrect}
              disabled={!text.trim() || loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Writing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Correct Grammar</span>
                  <span className="text-[10px] opacity-75 font-mono ml-1 hidden sm:inline">
                    (Ctrl+Enter)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Corrected Text, Suggestions, Diff & Insights */}
        <div
          className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[540px] overflow-hidden ${
            mobileTab === 'result' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Right Panel Tabs */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightTab('corrected')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  rightTab === 'corrected'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Corrected Text
              </button>

              <button
                onClick={() => setRightTab('suggestions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  rightTab === 'suggestions'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Suggestions {result ? `(${result.suggestions.length})` : ''}
              </button>

              <button
                onClick={() => setRightTab('diff')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  rightTab === 'diff'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Diff View
              </button>

              <button
                onClick={() => setRightTab('insights')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  rightTab === 'insights'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Insights
              </button>
            </div>

            {/* Quick Actions for Results */}
            {result && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyResult}
                  title="Copy corrected text"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleReplaceOriginal}
                  title="Replace original text with corrected"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Replace</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 p-5 overflow-y-auto">
            {loading ? (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  AI is analyzing grammar and syntax...
                </p>
                <p className="text-xs text-slate-400">
                  Checking verb agreement, spelling, punctuation, and flow.
                </p>
              </div>
            ) : !result ? (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ready to Polish Your Writing
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Enter your text on the left and click &ldquo;Correct Grammar&rdquo; to receive
                  actionable corrections, tone enhancements, and detailed grammar explanations.
                </p>
              </div>
            ) : (
              <div>
                {/* TAB 1: Corrected Content */}
                {rightTab === 'corrected' && (
                  <div className="space-y-4">
                    {/* Summary Banner */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                          Editorial Summary ({result.mode.replace('_', ' ')})
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {result.summary}
                        </p>
                      </div>

                      {result.suggestions.length > 0 && (
                        <button
                          onClick={handleAcceptAll}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Accept All ({result.suggestions.length})
                        </button>
                      )}
                    </div>

                    {/* Corrected Text Box */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-base leading-relaxed whitespace-pre-wrap select-text">
                      {result.correctedText}
                    </div>

                    {/* Quick suggestion cards snippet */}
                    {result.suggestions.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Key Corrections ({result.suggestions.length}):
                        </span>
                        <div className="space-y-2">
                          {result.suggestions.slice(0, 3).map((sug) => (
                            <SuggestionCard
                              key={sug.id}
                              suggestion={sug}
                              onAccept={handleAcceptSuggestion}
                              onDismiss={handleDismissSuggestion}
                              explanationLevel={explanationLevel}
                            />
                          ))}
                          {result.suggestions.length > 3 && (
                            <button
                              onClick={() => setRightTab('suggestions')}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1 block"
                            >
                              View all {result.suggestions.length} suggestions →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Suggestions List */}
                {rightTab === 'suggestions' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        All Suggestions ({result.suggestions.length})
                      </span>
                      {result.suggestions.length > 0 && (
                        <button
                          onClick={handleAcceptAll}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Accept All
                        </button>
                      )}
                    </div>

                    {result.suggestions.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          All suggestions addressed!
                        </p>
                        <p className="text-xs">Your text is grammatically clean and consistent.</p>
                      </div>
                    ) : (
                      result.suggestions.map((sug) => (
                        <SuggestionCard
                          key={sug.id}
                          suggestion={sug}
                          onAccept={handleAcceptSuggestion}
                          onDismiss={handleDismissSuggestion}
                          explanationLevel={explanationLevel}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* TAB 3: Diff View */}
                {rightTab === 'diff' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Red = Removed/Modified</span>
                      <span>Green = Added/Corrected</span>
                    </div>
                    <DiffViewer original={text} corrected={result.correctedText} />
                  </div>
                )}

                {/* TAB 4: Writing Insights */}
                {rightTab === 'insights' && (
                  <WritingInsightsPanel insights={result.qualityInsights} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Ask AI Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setChatDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 transition-all hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {/* Sentence Rewriter Modal */}
      <SentenceRewriterModal
        isOpen={rewriteModalOpen}
        onClose={() => setRewriteModalOpen(false)}
        sentence={selectedForRewrite}
        onReplace={handleApplyRewrite}
      />

      {/* Ask AI Chat Drawer */}
      <AskAIChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        currentDocumentText={text}
      />
    </div>
  );
}
