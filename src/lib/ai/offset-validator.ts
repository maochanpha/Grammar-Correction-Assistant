import { CorrectionSuggestion } from './types';

/**
 * Verifies and repairs character offsets returned by AI models.
 * If offsets don't match or are shifted, searches for the exact phrase
 * near the reported position.
 */
export function validateAndFixOffsets(
  sourceText: string,
  rawSuggestions: Partial<CorrectionSuggestion>[]
): CorrectionSuggestion[] {
  const verified: CorrectionSuggestion[] = [];
  const occupiedRanges: [number, number][] = [];

  for (let i = 0; i < rawSuggestions.length; i++) {
    const raw = rawSuggestions[i];
    const originalPhrase = (raw.originalPhrase || '').trim();
    const replacementPhrase = raw.replacementPhrase !== undefined ? raw.replacementPhrase : '';
    
    if (!originalPhrase) continue;

    let startIndex = typeof raw.startIndex === 'number' ? raw.startIndex : -1;
    let endIndex = typeof raw.endIndex === 'number' ? raw.endIndex : -1;

    let isMatch =
      startIndex >= 0 &&
      endIndex <= sourceText.length &&
      startIndex < endIndex &&
      sourceText.substring(startIndex, endIndex) === originalPhrase;

    if (!isMatch) {
      // Find all occurrences of originalPhrase in sourceText
      const occurrences: number[] = [];
      let pos = 0;
      while ((pos = sourceText.indexOf(originalPhrase, pos)) !== -1) {
        occurrences.push(pos);
        pos += 1;
      }

      // If not found with exact casing, try case-insensitive
      if (occurrences.length === 0) {
        const lowerSource = sourceText.toLowerCase();
        const lowerPhrase = originalPhrase.toLowerCase();
        let lpos = 0;
        while ((lpos = lowerSource.indexOf(lowerPhrase, lpos)) !== -1) {
          occurrences.push(lpos);
          lpos += 1;
        }
      }

      if (occurrences.length > 0) {
        // Pick the occurrence closest to the original startIndex (or first unused occurrence)
        const target = startIndex >= 0 ? startIndex : 0;
        let bestPos = occurrences[0];
        let minDiff = Math.abs(bestPos - target);

        for (const occ of occurrences) {
          const diff = Math.abs(occ - target);
          if (diff < minDiff) {
            minDiff = diff;
            bestPos = occ;
          }
        }

        startIndex = bestPos;
        endIndex = bestPos + originalPhrase.length;
        isMatch = true;
      }
    }

    if (!isMatch) {
      // Skip invalid suggestion that cannot be mapped into sourceText
      continue;
    }

    // Check for overlap with already accepted suggestions
    const hasOverlap = occupiedRanges.some(
      ([start, end]) =>
        (startIndex >= start && startIndex < end) ||
        (endIndex > start && endIndex <= end) ||
        (startIndex <= start && endIndex >= end)
    );

    if (hasOverlap) {
      continue;
    }

    occupiedRanges.push([startIndex, endIndex]);

    verified.push({
      id: raw.id || `sug-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      category: raw.category || 'grammar',
      originalPhrase: sourceText.substring(startIndex, endIndex),
      replacementPhrase,
      explanation: raw.explanation || 'Suggested improvement.',
      detailedExplanation: raw.detailedExplanation,
      startIndex,
      endIndex,
      rule: raw.rule,
      status: 'pending',
    });
  }

  // Sort chronologically by start index
  return verified.sort((a, b) => a.startIndex - b.startIndex);
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
    if (
      (s.startIndex >= startIndex && s.startIndex < endIndex) ||
      (s.endIndex > startIndex && s.endIndex <= endIndex)
    ) {
      // Conflicted suggestion is removed
      continue;
    }

    if (s.startIndex >= endIndex) {
      // Suggestion occurs after the edit, shift forward or backward by delta
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
 * Applies all remaining suggestions to text at once
 */
export function applyAllSuggestions(
  initialText: string,
  suggestions: CorrectionSuggestion[]
): string {
  // Sort suggestions in reverse order (from end of text to beginning)
  // so earlier offsets remain unaffected as we replace later segments
  const sorted = [...suggestions].sort((a, b) => b.startIndex - a.startIndex);
  let text = initialText;

  for (const s of sorted) {
    if (s.startIndex >= 0 && s.endIndex <= text.length && s.startIndex <= s.endIndex) {
      text = text.substring(0, s.startIndex) + s.replacementPhrase + text.substring(s.endIndex);
    }
  }

  return text;
}
