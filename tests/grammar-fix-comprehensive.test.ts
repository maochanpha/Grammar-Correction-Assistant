import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../src/lib/ai/mock-provider';
import { GeminiAIProvider, extractAndParseJSON } from '../src/lib/ai/gemini-provider';
import {
  validateAndFixOffsets,
  applySuggestion,
  applyAllSuggestions,
  reconcileDiffSuggestions,
} from '../src/lib/ai/offset-validator';
import { WRITING_MODES, WritingMode, CorrectionSuggestion } from '../src/lib/ai/types';
import { buildCorrectionPrompt } from '../src/lib/ai/prompts';

const TEST_PARAGRAPH =
  "Yesterday i goes to the office very early because my manager ask me to finished an important report. When I arrive, nobody were there and I dont know what should I do. I try to contact my coworker but they doesn't answer my messages. After waiting for almost two hour, my manager finally call me and said the meeting was cancel because some clients is not available. I was very confuse because nobody inform me about this changes before. Also, I have send the report last night but my manager haven't check it yet. I think the company need to improve their communications because this kind of problem happen too many times and it make everyone wasting their times.";

describe('Comprehensive Grammar Fix Engine', () => {
  it('detects multiple distinct grammatical errors in the problem paragraph (far more than 1)', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(TEST_PARAGRAPH, 'grammar_fix', 'en-US', 'simple');

    // Must return far more than just 1 apostrophe error
    expect(result.suggestions.length).toBeGreaterThanOrEqual(10);

    // Verify presence of various error categories
    const categories = new Set(result.suggestions.map((s) => s.category));
    expect(categories.has('grammar')).toBe(true);
    expect(categories.has('punctuation')).toBe(true);

    // Verify rules cover capitalization, agreement, tenses, count nouns, etc.
    const rules = result.suggestions.map((s) => s.rule);
    expect(rules.some((r) => r?.toLowerCase().includes('capitalization'))).toBe(true);
    expect(rules.some((r) => r?.toLowerCase().includes('agreement'))).toBe(true);
    expect(rules.some((r) => r?.toLowerCase().includes('tense'))).toBe(true);
    expect(rules.some((r) => r?.toLowerCase().includes('plural') || r?.toLowerCase().includes('count'))).toBe(true);

    // Verify Improved Text is actually corrected, not identical to original
    expect(result.correctedText).not.toBe(TEST_PARAGRAPH);
    expect(result.correctedText).toContain('Yesterday I went');
    expect(result.correctedText).toContain('finish an important report');
    expect(result.correctedText).toContain('nobody was there');
    expect(result.correctedText).toContain('two hours');
    expect(result.correctedText).toContain('was canceled');
    expect(result.correctedText).toContain('very confused');
    expect(result.correctedText).toContain('these changes');
    expect(result.correctedText).toContain('company needs');
    expect(result.correctedText).toContain('waste their time');

    // Verify each suggestion has valid source range
    for (const sug of result.suggestions) {
      expect(sug.startIndex).toBeGreaterThanOrEqual(0);
      expect(sug.endIndex).toBeLessThanOrEqual(TEST_PARAGRAPH.length);
      expect(sug.startIndex).toBeLessThan(sug.endIndex);
      expect(TEST_PARAGRAPH.substring(sug.startIndex, sug.endIndex)).toBe(sug.originalPhrase);
    }
  });

  it('ensures Accept All cleanly transforms the text without corruption', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(TEST_PARAGRAPH, 'grammar_fix', 'en-US', 'simple');

    const acceptAllResult = applyAllSuggestions(TEST_PARAGRAPH, result.suggestions);
    expect(acceptAllResult).toBe(result.correctedText);
    expect(acceptAllResult).toContain('Yesterday I went');
    expect(acceptAllResult).not.toContain('i goes');
    expect(acceptAllResult).not.toMatch(/\btwo hour\b/);
    expect(acceptAllResult).toContain('two hours');
    expect(acceptAllResult).not.toContain('nobody were');
    expect(acceptAllResult).toContain('waste their time');
  });

  it('ensures individual Accept shifts remaining suggestions without offset corruption', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(TEST_PARAGRAPH, 'grammar_fix', 'en-US', 'simple');

    let currentText = TEST_PARAGRAPH;
    let suggestions = [...result.suggestions];

    // Accept first 3 suggestions one by one
    for (let step = 0; step < 3 && suggestions.length > 0; step++) {
      const target = suggestions[0];
      const applied = applySuggestion(currentText, target, suggestions);
      currentText = applied.updatedText;
      suggestions = applied.remainingSuggestions;

      // Verify that every remaining suggestion's offset is accurate in currentText
      for (const remaining of suggestions) {
        expect(
          currentText.substring(remaining.startIndex, remaining.endIndex)
        ).toBe(remaining.originalPhrase);
      }
    }
  });

  it('supports all 10 writing modes without regressions', async () => {
    const provider = new MockAIProvider();
    const modes: WritingMode[] = [
      'grammar_fix',
      'improve_writing',
      'professional',
      'casual',
      'formal',
      'simplify',
      'shorten',
      'expand',
      'academic',
      'friendly',
    ];

    for (const mode of modes) {
      const res = await provider.correctGrammar(
        'Thanks for the email. Due to the fact that we were late, i goes home.',
        mode,
        'en-US',
        'simple'
      );
      expect(res.mode).toBe(mode);
      expect(res.correctedText.length).toBeGreaterThan(0);
      expect(res.qualityInsights).toBeDefined();
      expect(res.qualityInsights.overallQualityScore).toBeGreaterThanOrEqual(0);
      expect(res.qualityInsights.overallQualityScore).toBeLessThanOrEqual(100);
    }
  });

  it('extractAndParseJSON parses markdown, preamble, and quirky JSON cleanly', () => {
    const rawMarkdown = `Here is your review:
\`\`\`json
{
  "correctedText": "Hello world.",
  "summary": "Fixed greeting.",
  "suggestions": [
    {
      "category": "grammar",
      "originalPhrase": "hello",
      "replacementPhrase": "Hello",
      "explanation": "Capitalize first word."
    },
  ]
}
\`\`\`
Hope this helps!`;

    const parsed = extractAndParseJSON<{
      correctedText: string;
      summary: string;
      suggestions: unknown[];
    }>(rawMarkdown);

    expect(parsed.correctedText).toBe('Hello world.');
    expect(parsed.summary).toBe('Fixed greeting.');
    expect(parsed.suggestions).toHaveLength(1);
  });

  it('reconcileDiffSuggestions detects corrections in correctedText missing from suggestions', () => {
    const source = 'Yesterday i went to store and bought two apple.';
    const corrected = 'Yesterday I went to store and bought two apples.';

    // Suppose AI only reported the "i" -> "I" suggestion and missed "two apple" -> "two apples"
    const partialSuggestions: CorrectionSuggestion[] = [
      {
        id: 's1',
        category: 'grammar',
        originalPhrase: 'i',
        replacementPhrase: 'I',
        explanation: 'Capitalize I',
        startIndex: 10,
        endIndex: 11,
      },
    ];

    const reconciled = reconcileDiffSuggestions(source, corrected, partialSuggestions);
    expect(reconciled.length).toBeGreaterThanOrEqual(2);

    // Applying reconciled suggestions must yield the exact correctedText
    const applied = applyAllSuggestions(source, reconciled);
    expect(applied).toBe(corrected);
  });

  it('buildCorrectionPrompt includes comprehensive rules for grammar_fix', () => {
    const prompt = buildCorrectionPrompt(TEST_PARAGRAPH, 'grammar_fix', 'en-US', 'detailed');
    expect(prompt).toContain('Comprehensive Proofreading');
    expect(prompt).toContain('Verb tenses');
    expect(prompt).toContain('Subject-verb agreement');
    expect(prompt).toContain('Singular and plural nouns');
    expect(prompt).toContain('Capitalization');
    expect(prompt).toContain('NO ONE-SUGGESTION LIMIT');
  });
});
