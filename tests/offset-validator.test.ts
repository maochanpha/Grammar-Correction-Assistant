import { describe, it, expect } from 'vitest';
import {
  validateAndFixOffsets,
  applySuggestion,
  applyAllSuggestions,
} from '../src/lib/ai/offset-validator';
import { CorrectionSuggestion } from '../src/lib/ai/types';

describe('Offset Validator & Suggestion Engine', () => {
  it('validates and auto-repairs misaligned offsets', () => {
    const text = 'She dont like coffee and he has went to store.';
    
    // Model returned slightly wrong offsets for "has went"
    const rawSuggestions: Partial<CorrectionSuggestion>[] = [
      {
        id: '1',
        category: 'grammar',
        originalPhrase: 'dont',
        replacementPhrase: "doesn't",
        startIndex: 4,
        endIndex: 8, // Correct for "dont"
        explanation: "Use doesn't for third-person singular.",
      },
      {
        id: '2',
        category: 'grammar',
        originalPhrase: 'has went',
        replacementPhrase: 'has gone',
        startIndex: 20, // Intentionally wrong offset (should be 28)
        endIndex: 28,
        explanation: 'Use past participle gone with auxiliary has.',
      },
    ];

    const fixed = validateAndFixOffsets(text, rawSuggestions);
    expect(fixed).toHaveLength(2);
    expect(fixed[0].startIndex).toBe(4);
    expect(fixed[0].endIndex).toBe(8);
    expect(text.substring(fixed[0].startIndex, fixed[0].endIndex)).toBe('dont');

    expect(fixed[1].startIndex).toBe(28);
    expect(fixed[1].endIndex).toBe(36);
    expect(text.substring(fixed[1].startIndex, fixed[1].endIndex)).toBe('has went');
  });

  it('safely applies one suggestion and shifts subsequent suggestion offsets', () => {
    const text = 'She dont like coffee and he has went to store.';
    const suggestions: CorrectionSuggestion[] = [
      {
        id: 's1',
        category: 'grammar',
        originalPhrase: 'dont',
        replacementPhrase: "doesn't", // length: 7 (was 4, delta = +3)
        explanation: "Use doesn't",
        startIndex: 4,
        endIndex: 8,
      },
      {
        id: 's2',
        category: 'grammar',
        originalPhrase: 'has went',
        replacementPhrase: 'has gone',
        explanation: 'Use gone',
        startIndex: 28,
        endIndex: 36,
      },
    ];

    // Apply first suggestion
    const step1 = applySuggestion(text, suggestions[0], suggestions);
    expect(step1.updatedText).toBe("She doesn't like coffee and he has went to store.");
    expect(step1.remainingSuggestions).toHaveLength(1);
    
    // Remaining suggestion s2 should now be shifted by +3
    const s2Shifted = step1.remainingSuggestions[0];
    expect(s2Shifted.startIndex).toBe(31);
    expect(s2Shifted.endIndex).toBe(39);
    expect(step1.updatedText.substring(s2Shifted.startIndex, s2Shifted.endIndex)).toBe('has went');

    // Apply second suggestion
    const step2 = applySuggestion(step1.updatedText, s2Shifted, step1.remainingSuggestions);
    expect(step2.updatedText).toBe("She doesn't like coffee and he has gone to store.");
    expect(step2.remainingSuggestions).toHaveLength(0);
  });

  it('applies all suggestions cleanly from end to beginning', () => {
    const text = 'I has send the report yesterday.';
    const suggestions: CorrectionSuggestion[] = [
      {
        id: '1',
        category: 'grammar',
        originalPhrase: 'has send',
        replacementPhrase: 'sent',
        explanation: 'Past tense',
        startIndex: 2,
        endIndex: 10,
      },
    ];

    const result = applyAllSuggestions(text, suggestions);
    expect(result).toBe('I sent the report yesterday.');
  });
});
