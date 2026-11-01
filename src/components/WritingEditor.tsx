'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Check,
  Copy,
  RotateCcw,
  RotateCw,
  Trash2,
  Clipboard,
  Save,
  MessageSquare,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCheck,
  ArrowRightLeft,
  Sparkles,
  SlidersHorizontal,
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
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

interface WritingEditorProps {
  initialText?: string;
  initialTitle?: string;
  documentId?: string;
}

const SAMPLE_TEXT =
  "I has send the report yesterday but he not reply me yet. She don't like coffee because it is to bitter for her. We could of finished the project more better if we had more time.";

export const MODE_ACTION_LABELS: Record<WritingMode, string> = {
  grammar_fix: 'Check Grammar',
  improve_writing: 'Improve Writing',
  professional: 'Apply Professional Tone',
  casual: 'Apply Casual Tone',
  formal: 'Apply Formal Tone',
  academic: 'Apply Academic Tone',
  friendly: 'Apply Friendly Tone',
  simplify: 'Simplify Text',
  shorten: 'Shorten Text',
  expand: 'Expand Text',
};

export function getActionLabel(selectedMode: WritingMode): string {
  return MODE_ACTION_LABELS[selectedMode] || 'Check Grammar';
}

export default function WritingEditor({
  initialText = '',
  initialTitle = 'Untitled Writing',
  documentId: propDocId,
}: WritingEditorProps) {
  const { user } = useAuth();

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

  const [rightTab, setRightTab] = useState<'corrected' | 'suggestions' | 'diff' | 'insights'>('corrected');
  const [mobileTab, setMobileTab] = useState<'editor' | 'result'>('editor');

  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [selectedForRewrite, setSelectedForRewrite] = useState('');
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const words = getWords(text);
  const sentences = getSentences(text);
  const wordCount = words.length;
  const charCount = text.length;
  const sentenceCount = sentences.length;

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
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        updateTextWithHistory(clipText);
      }
    } catch {
      textareaRef.current?.focus();
    }
  };

  const handleCopyText = () => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLoadSample = () => {
    updateTextWithHistory(SAMPLE_TEXT);
  };

  const handleCorrect = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCorrect();
    }
  };

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
    const fullyCorrected =
      remainingSuggestions.length > 0
        ? applyAllSuggestions(updatedText, remainingSuggestions)
        : updatedText;

    setResult({
      ...result,
      correctedText: fullyCorrected,
      suggestions: remainingSuggestions,
      qualityInsights: newInsights,
    });
  };

  const handleDismissSuggestion = (suggestion: CorrectionSuggestion) => {
    if (!result) return;
    const remaining = result.suggestions.filter((s) => s.id !== suggestion.id);
    const grammarCount = remaining.filter(
      (s) => s.category === 'grammar' || s.category === 'spelling'
    ).length;
    const clarityCount = remaining.filter((s) => s.category === 'clarity').length;
    const styleCount = remaining.filter(
      (s) => s.category === 'style' || s.category === 'punctuation'
    ).length;

    const newInsights = analyzeWritingQuality(text, grammarCount, clarityCount, styleCount);
    setResult({
      ...result,
      suggestions: remaining,
      qualityInsights: newInsights,
    });
  };

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
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplaceOriginal = () => {
    if (!result) return;
    updateTextWithHistory(result.correctedText);
    const newInsights = analyzeWritingQuality(result.correctedText, 0, 0, 0);
    setResult({
      ...result,
      suggestions: [],
      qualityInsights: newInsights,
    });
    setMobileTab('editor');
  };

  const handleTriggerRewrite = () => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    let selectedText = text.substring(start, end).trim();

    if (!selectedText) {
      selectedText = sentences[0] || text.trim();
    }

    if (!selectedText) {
      alert('Please enter or select a sentence to rewrite.');
      return;
    }

    setSelectedForRewrite(selectedText);
    setRewriteModalOpen(true);
  };

  const handleApplyRewrite = (newSentence: string) => {
    if (!selectedForRewrite) return;
    const updated = text.replace(selectedForRewrite, newSentence);
    updateTextWithHistory(updated);
  };

  const handleSaveDocument = useCallback(async () => {
    if (!user) {
      alert('Please sign in or create an account to save documents to your history.');
      return;
    }

    setSaveStatus('saving');
    try {
      if (docId) {
        const res = await fetch(`/api/documents/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || 'Untitled Writing',
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
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || 'Untitled Writing',
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

  // Optional auto-save debounce
  useEffect(() => {
    if (!user || user.preferences?.autoSave === false) return;
    if (saveStatus !== 'unsaved' || !text.trim() || !docId) return;

    const timer = setTimeout(() => {
      handleSaveDocument();
    }, 2500);

    return () => clearTimeout(timer);
  }, [saveStatus, text, docId, user, handleSaveDocument]);

  const handleModeChange = (newMode: WritingMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    // A result generated under the previous mode no longer matches the
    // newly selected mode's style — invalidate it rather than keep
    // displaying (and mislabeling) stale output. Does not trigger a new
    // AI request; the user must press "Check Grammar" again.
    setResult(null);
  };

  const modeInfo = WRITING_MODES[mode];

  return (
    <div className="space-y-5">
      {/* A. Document Toolbar */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Editable Title & Status Indicator */}
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('unsaved');
            }}
            placeholder="Untitled Writing"
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3647C8] rounded-lg px-2.5 py-1 transition-colors w-48 sm:w-72 truncate"
          />

          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-slate-300 dark:text-slate-600">•</span>
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-3 h-3 animate-spin text-[#3647C8]" />
                Saving…
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* Right: Language, Explanation & Manual Save */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageVariant)}
            className="h-8.5 text-xs rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#3647C8] transition-colors"
          >
            <option value="en-US">American English</option>
            <option value="en-GB">British English</option>
          </select>

          <select
            value={explanationLevel}
            onChange={(e) => setExplanationLevel(e.target.value as ExplanationLevel)}
            className="h-8.5 text-xs rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#3647C8] transition-colors"
          >
            <option value="simple">Simple Explanations</option>
            <option value="detailed">Detailed Explanations</option>
          </select>

          <Button
            onClick={handleSaveDocument}
            variant="outline"
            size="sm"
            disabled={loading}
            className="h-8.5 text-xs shadow-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Save
          </Button>
        </div>
      </div>

      {/* B. Writing Modes Selector */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs p-3 sm:p-3.5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Writing Mode
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline-block">
            {modeInfo.name}: {modeInfo.shortDescription}
          </span>
        </div>

        {/* 10 Modes Pill Selector (No redundant uppercase badges) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {Object.values(WRITING_MODES).map((m) => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isSelected
                    ? 'bg-[#3647C8] text-white shadow-xs font-semibold'
                    : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-750'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 sm:hidden">
          {modeInfo.detailedDescription}
        </p>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-xs font-medium">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            mobileTab === 'editor'
              ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Your Writing ({wordCount} words)
        </button>
        <button
          onClick={() => setMobileTab('result')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            mobileTab === 'result'
              ? 'bg-white dark:bg-[#131722] text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Suggestions {result ? `(${result.suggestions.length})` : ''}
        </button>
      </div>

      {/* C. Main Editor Layout: Two Balanced 50/50 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-[580px]">
        {/* LEFT PANEL: Your Writing */}
        <div
          className={`rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs flex flex-col min-h-[580px] ${
            mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Header & Editing Toolbar */}
          <div className="h-13 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 rounded-t-xl shrink-0">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Writing
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo"
                aria-label="Undo"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
                aria-label="Redo"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyText}
                title="Copy writing"
                aria-label="Copy writing"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handlePaste}
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <Clipboard className="w-4 h-4" />
              </button>
              <button
                onClick={handleTriggerRewrite}
                title="Rewrite selected sentence"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#3647C8] dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors ml-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rewrite</span>
              </button>
              <button
                onClick={handleClear}
                title="Clear all text"
                aria-label="Clear all text"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors ml-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Text Input Area & Empty State */}
          <div className="relative flex-1 p-5 flex flex-col min-h-[420px]">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => updateTextWithHistory(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start writing or paste your text here to check grammar, spelling, tone, and readability…"
              className="flex-1 w-full border-none bg-transparent resize-none focus:outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed"
            />

            {text.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start writing or paste your text
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                  Your writing suggestions will appear after you check your text.
                </p>
                <div className="pointer-events-auto">
                  <Button
                    onClick={handleLoadSample}
                    variant="outline"
                    size="sm"
                    className="shadow-xs"
                  >
                    Try an Example
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Toolbar with Metrics and Primary Check Grammar Button */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 rounded-b-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{wordCount}</span>{' '}
              words
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{charCount}</span>{' '}
              characters
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sentenceCount}
              </span>{' '}
              sentences
            </div>

            <Button
              onClick={handleCorrect}
              disabled={!text.trim() || loading}
              className="w-full sm:w-auto shadow-xs"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                  Checking…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  {getActionLabel(mode)}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL: Writing Suggestions */}
        <div
          className={`rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131722] shadow-xs flex flex-col min-h-[580px] ${
            mobileTab === 'result' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Header & Suggestion Actions */}
          <div className="h-13 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 rounded-t-xl shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Writing Suggestions
              </span>
              {result && (
                <span className="text-xs font-semibold text-[#3647C8] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                  {result.suggestions.length}
                </span>
              )}
            </div>

            {result && (
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleCopyResult}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReplaceOriginal}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                  Replace
                </Button>
                {result.suggestions.length > 0 && (
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="h-8 text-xs shadow-xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Accept All
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Clean Tab Navigation Bar */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131722] px-3 shrink-0">
            {[
              { id: 'corrected', label: 'Improved Text', icon: Check },
              { id: 'suggestions', label: 'Suggestions', icon: AlertCircle },
              { id: 'diff', label: 'Diff View', icon: ArrowRightLeft },
              { id: 'insights', label: 'Insights', icon: Activity },
            ].map((tab) => {
              const active = rightTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setRightTab(tab.id as 'corrected' | 'suggestions' | 'diff' | 'insights')
                  }
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0 ${
                    active
                      ? 'border-[#3647C8] text-[#3647C8] dark:border-indigo-400 dark:text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.id === 'suggestions' && result && (
                    <span className="text-[11px] font-semibold text-slate-400">
                      ({result.suggestions.length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Body */}
          <div className="flex-1 p-5 overflow-y-auto">
            {loading ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center gap-2.5 text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin text-[#3647C8]" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  AI is reviewing your writing…
                </p>
                <p className="text-xs text-slate-400">
                  Checking grammar, syntax, flow, and clarity.
                </p>
              </div>
            ) : !result ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-400 flex items-center justify-center mb-3">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Ready to review your writing
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Check your text to see corrections, suggestions, and writing insights.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rightTab === 'corrected' && (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                        Editorial Summary ({modeInfo.name})
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {result.summary}
                      </p>
                    </div>

                    {/* Improved Text Surface */}
                    <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text">
                      {result.correctedText}
                    </div>

                    {/* Key Corrections list */}
                    {result.suggestions.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Key Corrections ({result.suggestions.length})
                          </span>
                          {result.suggestions.length > 3 && (
                            <button
                              onClick={() => setRightTab('suggestions')}
                              className="text-xs font-semibold text-[#3647C8] dark:text-indigo-400 hover:underline"
                            >
                              View all {result.suggestions.length} →
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {result.suggestions.slice(0, 3).map((sug) => (
                            <SuggestionCard
                              key={sug.id}
                              suggestion={sug}
                              onAccept={handleAcceptSuggestion}
                              onDismiss={handleDismissSuggestion}
                              explanationLevel={explanationLevel}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {rightTab === 'suggestions' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        All Suggestions ({result.suggestions.length})
                      </span>
                      {result.suggestions.length > 0 && (
                        <Button
                          onClick={handleAcceptAll}
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <CheckCheck className="w-3.5 h-3.5 mr-1" />
                          Accept All
                        </Button>
                      )}
                    </div>

                    {result.suggestions.length === 0 ? (
                      <div className="py-14 text-center">
                        <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          All suggestions addressed
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Your text is grammatically clean and consistent.
                        </p>
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

                {rightTab === 'diff' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>Removed / Modified</span>
                      <span>Added / Corrected</span>
                    </div>
                    <DiffViewer original={text} corrected={result.correctedText} />
                  </div>
                )}

                {rightTab === 'insights' && (
                  <WritingInsightsPanel insights={result.qualityInsights} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Ask AI Button (Fixed bottom right, unobtrusive) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setChatDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#3647C8] hover:bg-[#2b39a8] text-white font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-150 active:scale-95"
          aria-label="Open Ask AI Assistant chat drawer"
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

      {/* Ask AI Assistant Side Drawer */}
      <AskAIChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        currentDocumentText={text}
      />
    </div>
  );
}
