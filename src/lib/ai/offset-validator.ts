import { CorrectionSuggestion, ErrorCategory } from './types';

interface CandidateOccurrence {
  start: number;
  end: number;
  exactCasing: boolean;
  wordBoundary: boolean;
}

/**
 * Finds candidate occurrences of phrase in sourceText with
 * ranking metrics (word boundary, exact casing).
 */
function findCandidateOccurrences(sourceText: string, phrase: string): CandidateOccurrence[] {
  const candidates: CandidateOccurrence[] = [];
  const clean = phrase.trim();
  if (!clean) return candidates;

  const isWord = /^[a-zA-Z0-9]/.test(clean) && /[a-zA-Z0-9]$/.test(clean);
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. Exact case-sensitive match with word boundaries
  if (isWord) {
    try {
      const regex = new RegExp(`\\b${escaped}\\b`, 'gu');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(sourceText)) !== null) {
        candidates.push({
          start: m.index,
          end: m.index + m[0].length,
          exactCasing: true,
          wordBoundary: true,
        });
      }
    } catch {
      // Fallback
    }
  }

  // 2. Exact match substring
  let pos = 0;
  while ((pos = sourceText.indexOf(clean, pos)) !== -1) {
    const end = pos + clean.length;
    if (!candidates.some((c) => c.start === pos && c.end === end)) {
      candidates.push({
        start: pos,
        end,
        exactCasing: true,
        wordBoundary: false,
      });
    }
    pos += 1;
  }

  // 3. Case-insensitive with word boundaries
  if (isWord) {
    try {
      const ciRegex = new RegExp(`\\b${escaped}\\b`, 'giu');
      let m: RegExpExecArray | null;
      while ((m = ciRegex.exec(sourceText)) !== null) {
        if (!candidates.some((c) => c.start === m!.index && c.end === m!.index + m![0].length)) {
          candidates.push({
            start: m.index,
            end: m.index + m[0].length,
            exactCasing: false,
            wordBoundary: true,
          });
        }
      }
    } catch {
      // Fallback
    }
  }

  // 4. Case-insensitive substring
  const lowerSource = sourceText.toLowerCase();
  const lowerPhrase = clean.toLowerCase();
  let lpos = 0;
  while ((lpos = lowerSource.indexOf(lowerPhrase, lpos)) !== -1) {
    const end = lpos + clean.length;
    if (!candidates.some((c) => c.start === lpos && c.end === end)) {
      candidates.push({
        start: lpos,
        end,
        exactCasing: false,
        wordBoundary: false,
      });
    }
    lpos += 1;
  }

  return candidates;
}

/**
 * Checks whether [start, end] has overlap with any range in occupiedRanges.
 */
function rangesOverlap(start: number, end: number, occupied: [number, number][]): boolean {
  return occupied.some(([s, e]) => Math.max(start, s) < Math.min(end, e));
}

/**
 * Verifies and repairs character offsets returned by AI models or rules.
 * Handles duplicate phrases, word boundaries, casing differences,
 * and overlapping ranges safely without losing valid suggestions.
 */
export function validateAndFixOffsets(
  sourceText: string,
  rawSuggestions: Partial<CorrectionSuggestion>[]
): CorrectionSuggestion[] {
  if (!sourceText || !rawSuggestions || rawSuggestions.length === 0) {
    return [];
  }

  const verified: CorrectionSuggestion[] = [];
  const occupiedRanges: [number, number][] = [];
  let chronologicalCursor = 0;

  for (let i = 0; i < rawSuggestions.length; i++) {
    const raw = rawSuggestions[i];
    const originalPhrase = (raw.originalPhrase || '').trim();
    const replacementPhrase = raw.replacementPhrase !== undefined ? raw.replacementPhrase : '';

    if (!originalPhrase) continue;

    let startIndex = typeof raw.startIndex === 'number' ? raw.startIndex : -1;
    let endIndex = typeof raw.endIndex === 'number' ? raw.endIndex : -1;

    // Check if reported offsets are exact and un-occupied
    const exactSliceMatch =
      startIndex >= 0 &&
      endIndex <= sourceText.length &&
      startIndex < endIndex &&
      sourceText.substring(startIndex, endIndex) === originalPhrase &&
      !rangesOverlap(startIndex, endIndex, occupiedRanges);

    if (exactSliceMatch) {
      occupiedRanges.push([startIndex, endIndex]);
      chronologicalCursor = endIndex;
      verified.push({
        id: raw.id || `sug-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        category: (raw.category as ErrorCategory) || 'grammar',
        originalPhrase: sourceText.substring(startIndex, endIndex),
        replacementPhrase,
        explanation: raw.explanation || 'Suggested grammatical improvement.',
        detailedExplanation: raw.detailedExplanation,
        startIndex,
        endIndex,
        rule: raw.rule,
        status: 'pending',
      });
      continue;
    }

    // Find all candidate occurrences in sourceText
    const candidates = findCandidateOccurrences(sourceText, originalPhrase);

    // Filter out candidates that overlap already occupied ranges
    const availableCandidates = candidates.filter(
      (c) => !rangesOverlap(c.start, c.end, occupiedRanges)
    );

    if (availableCandidates.length === 0) {
      continue;
    }

    // Rank candidates:
    // Prefer word boundaries > exact casing > proximity to target offset
    const targetOffset = startIndex >= 0 ? startIndex : chronologicalCursor;

    availableCandidates.sort((a, b) => {
      // Prioritize word boundary match
      if (a.wordBoundary !== b.wordBoundary) {
        return a.wordBoundary ? -1 : 1;
      }
      // Prioritize exact casing match
      if (a.exactCasing !== b.exactCasing) {
        return a.exactCasing ? -1 : 1;
      }
      // Prioritize proximity to target offset
      const distA = Math.abs(a.start - targetOffset);
      const distB = Math.abs(b.start - targetOffset);
      return distA - distB;
    });

    const best = availableCandidates[0];
    startIndex = best.start;
    endIndex = best.end;

    occupiedRanges.push([startIndex, endIndex]);
    chronologicalCursor = endIndex;

    verified.push({
      id: raw.id || `sug-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      category: (raw.category as ErrorCategory) || 'grammar',
      originalPhrase: sourceText.substring(startIndex, endIndex),
      replacementPhrase,
      explanation: raw.explanation || 'Suggested grammatical improvement.',
      detailedExplanation: raw.detailedExplanation,
      startIndex,
      endIndex,
      rule: raw.rule,
      status: 'pending',
    });
  }

  // Sort chronologically by startIndex ascending
  return verified.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Infers error category from original and replacement spans.
 */
function inferCategory(orig: string, repl: string): ErrorCategory {
  const o = orig.trim();
  const r = repl.trim();

  // Punctuation check
  const isPunctuationOnly = /^[^a-zA-Z0-9]+$/.test(o) || /^[^a-zA-Z0-9]+$/.test(r);
  if (isPunctuationOnly) return 'punctuation';

  // Capitalization / single letter
  if (o.toLowerCase() === r.toLowerCase()) {
    return 'spelling';
  }

  // Short typo check (Levenshtein distance <= 2)
  if (o.length > 3 && r.length > 3 && Math.abs(o.length - r.length) <= 2) {
    let diffs = 0;
    const minLen = Math.min(o.length, r.length);
    for (let k = 0; k < minLen; k++) {
      if (o[k] !== r[k]) diffs++;
    }
    if (diffs <= 2) return 'spelling';
  }

  return 'grammar';
}

/**
 * Reconciles suggestions with correctedText.
 * If correctedText contains improvements that were omitted from suggestions,
 * extracts them as actionable suggestions so that suggestions and correctedText
 * never contradict each other.
 */
export function reconcileDiffSuggestions(
  sourceText: string,
  correctedText: string,
  existingSuggestions: CorrectionSuggestion[]
): CorrectionSuggestion[] {
  if (!sourceText || !correctedText || sourceText === correctedText) {
    return existingSuggestions;
  }

  const currentReconstructed = applyAllSuggestions(sourceText, existingSuggestions);
  if (currentReconstructed === correctedText) {
    return existingSuggestions;
  }

  const reconciled = [...existingSuggestions];
  const occupiedRanges: [number, number][] = reconciled.map((s) => [s.startIndex, s.endIndex]);

  // Tokenize source and corrected by words and whitespace
  const srcWords = sourceText.split(/(\s+)/);
  const corrWords = correctedText.split(/(\s+)/);

  let i = 0;
  let j = 0;
  let currentSrcOffset = 0;

  while (i < srcWords.length && j < corrWords.length) {
    if (srcWords[i] === corrWords[j]) {
      currentSrcOffset += srcWords[i].length;
      i++;
      j++;
    } else {
      // Find length of mismatched region in words
      let lookaheadSrc = -1;
      let lookaheadCorr = -1;

      for (let look = 1; look <= 6; look++) {
        if (j + look < corrWords.length && srcWords[i] === corrWords[j + look]) {
          lookaheadCorr = look;
          break;
        }
        if (i + look < srcWords.length && srcWords[i + look] === corrWords[j]) {
          lookaheadSrc = look;
          break;
        }
      }

      let origSpan = '';
      let replSpan = '';

      if (lookaheadCorr !== -1) {
        for (let k = 0; k < lookaheadCorr; k++) {
          replSpan += corrWords[j++];
        }
      } else if (lookaheadSrc !== -1) {
        for (let k = 0; k < lookaheadSrc; k++) {
          origSpan += srcWords[i++];
        }
      } else {
        origSpan = srcWords[i++];
        replSpan = corrWords[j++];
      }

      const start = currentSrcOffset;
      const end = currentSrcOffset + origSpan.length;
      currentSrcOffset = end;

      if (origSpan.trim().length > 0) {
        const hasOverlap = rangesOverlap(start, end, occupiedRanges);
        if (!hasOverlap) {
          occupiedRanges.push([start, end]);
          reconciled.push({
            id: `diff-${Date.now()}-${reconciled.length}`,
            category: inferCategory(origSpan, replSpan),
            originalPhrase: sourceText.substring(start, end),
            replacementPhrase: replSpan,
            explanation: `Corrected "${origSpan.trim()}" to "${replSpan.trim()}" for grammatical accuracy.`,
            startIndex: start,
            endIndex: end,
            rule: 'Grammar & Usage',
            status: 'pending',
          });
        }
      }
    }
  }

  return reconciled.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Safely applies an individual suggestion to text and updates
 * offsets of all remaining suggestions without desyncing.
 */
export function applySuggestion(
  currentText: string,
  targetSuggestion: CorrectionSuggestion,
  allSuggestions: CorrectionSuggestion[]
): { updatedText: string; remainingSuggestions: CorrectionSuggestion[] } {
  const { startIndex, endIndex, replacementPhrase } = targetSuggestion;

  // Validate bounds
  if (startIndex < 0 || endIndex > currentText.length || startIndex > endIndex) {
    return {
      updatedText: currentText,
      remainingSuggestions: allSuggestions.filter((s) => s.id !== targetSuggestion.id),
    };
  }

  const before = currentText.substring(0, startIndex);
  const after = currentText.substring(endIndex);
  const updatedText = before + replacementPhrase + after;

  const delta = replacementPhrase.length - (endIndex - startIndex);

  // Shift remaining suggestions
  const remainingSuggestions: CorrectionSuggestion[] = [];

  for (const s of allSuggestions) {
    if (s.id === targetSuggestion.id) continue;

    // Check if suggestion overlaps the replaced range
    if (Math.max(startIndex, s.startIndex) < Math.min(endIndex, s.endIndex)) {
      // Conflicted suggestion is removed
      continue;
    }

    if (s.startIndex >= endIndex) {
      // Suggestion occurs after the edit, shift by delta
      remainingSuggestions.push({
        ...s,
        startIndex: s.startIndex + delta,
        endIndex: s.endIndex + delta,
      });
    } else {
      // Suggestion occurs before the edit, keep unchanged
      remainingSuggestions.push({ ...s });
    }
  }

  return {
    updatedText,
    remainingSuggestions,
  };
}

/**
 * Applies all remaining suggestions to text at once,
 * working in reverse order to preserve earlier offsets.
 */
export function applyAllSuggestions(
  initialText: string,
  suggestions: CorrectionSuggestion[]
): string {
  // Sort suggestions in reverse order (from end of text to beginning)
  const sorted = [...suggestions].sort((a, b) => b.startIndex - a.startIndex);
  let text = initialText;

  for (const s of sorted) {
    if (s.startIndex >= 0 && s.endIndex <= text.length && s.startIndex <= s.endIndex) {
      text = text.substring(0, s.startIndex) + s.replacementPhrase + text.substring(s.endIndex);
    }
  }

  return text;
}
