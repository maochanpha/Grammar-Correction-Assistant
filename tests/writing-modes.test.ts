import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../src/lib/ai/mock-provider';
import { applyAllSuggestions } from '../src/lib/ai/offset-validator';
import { WritingMode } from '../src/lib/ai/types';
import { getActionLabel } from '../src/components/WritingEditor';

const ALL_MODES: WritingMode[] = [
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

describe('Writing Mode distinctiveness and correctness (mock/offline engine)', () => {
  it('produces a different correctedText for most modes on the same mixed input', async () => {
    const provider = new MockAIProvider();
    const input =
      'Hey, I would like to inform you that the implementation of the methodology was delayed due to the fact that stuff happened. Can you send me an update?';

    const results = await Promise.all(
      ALL_MODES.map((mode) => provider.correctGrammar(input, mode, 'en-US', 'simple'))
    );

    const distinctOutputs = new Set(results.map((r) => r.correctedText));
    // At minimum, more than half the modes must diverge from each other —
    // proves mode selection actually changes processing behavior.
    expect(distinctOutputs.size).toBeGreaterThan(ALL_MODES.length / 2);

    // Every result must be tagged with the mode that produced it.
    results.forEach((r, i) => expect(r.mode).toBe(ALL_MODES[i]));
  });

  it('Grammar Fix corrects errors but avoids unnecessary stylistic rewriting', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      "She don't knows why he go yesterday.",
      'grammar_fix',
      'en-US',
      'simple'
    );
    expect(result.correctedText).not.toBe("She don't knows why he go yesterday.");
    // Should not apply tone/style suggestions in grammar_fix mode.
    expect(result.suggestions.every((s) => s.category !== 'style')).toBe(true);
  });

  it('Improve Writing fixes grammar and improves flow/wordiness', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      'We need to finish this report due to the fact that the deadline is near.',
      'improve_writing',
      'en-US',
      'simple'
    );
    expect(result.correctedText).toContain('because');
    expect(result.correctedText).not.toContain('due to the fact that');
  });

  it('Professional mode elevates casual/slang language', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      'Hey boss, I need you to send me that stuff ASAP. Thanks!',
      'professional',
      'en-US',
      'simple'
    );
    expect(result.correctedText).toContain('Hello');
    expect(result.correctedText).toContain('materials');
    expect(result.correctedText.toLowerCase()).toContain('as soon as possible');
    expect(result.correctedText).not.toMatch(/\bstuff\b/);
  });

  it('Casual mode relaxes formal phrasing into contractions', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      'I would like to inform you that I am unable to attend the event.',
      'casual',
      'en-US',
      'simple'
    );
    expect(result.correctedText).toContain("Just wanted to let you know");
    expect(result.correctedText).toContain("can't");
  });

  it('Formal mode expands contractions and removes casual openers', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      "Hey, can you tell me what's going on with my request?",
      'formal',
      'en-US',
      'simple'
    );
    expect(result.correctedText).toContain('Greetings');
    expect(result.correctedText).not.toMatch(/\bwhat's\b/i);
    expect(result.correctedText.toLowerCase()).toContain('could you kindly');
  });

  it('Simplify mode replaces jargon with plain-English equivalents', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      'The implementation of the proposed methodology necessitates substantial organizational restructuring.',
      'simplify',
      'en-US',
      'simple'
    );
    expect(result.correctedText).not.toContain('methodology');
    expect(result.correctedText).not.toContain('necessitates');
    expect(result.correctedText).toContain('method');
    expect(result.correctedText).toContain('requires');
  });

  it('Shorten mode removes wordy filler without losing key facts', async () => {
    const provider = new MockAIProvider();
    const input =
      'Due to the fact that we are currently experiencing a shortage of available resources, we are unable to proceed at this point in time.';
    const result = await provider.correctGrammar(input, 'shorten', 'en-US', 'simple');
    expect(result.correctedText).not.toContain('due to the fact that'.replace(/^./, (c) => c.toUpperCase()));
    expect(result.correctedText.length).toBeLessThan(input.length);
    expect(result.correctedText).toContain('because');
  });

  it('Expand mode adds clarifying detail to a short sentence without inventing facts', async () => {
    const provider = new MockAIProvider();
    const input = 'The project was delayed.';
    const result = await provider.correctGrammar(input, 'expand', 'en-US', 'simple');
    expect(result.correctedText.length).toBeGreaterThan(input.length);
    expect(result.correctedText).toContain('was delayed');
    // Must not invent specific causes, dates, or named people.
    expect(result.correctedText).not.toMatch(/\b(January|February|March|because of|John|Smith)\b/i);
  });

  it('Academic mode uses scholarly, objective vocabulary', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      "Lots of students don't do good because they don't sleep enough.",
      'academic',
      'en-US',
      'simple'
    );
    expect(result.correctedText).toContain('numerous');
    expect(result.correctedText).toContain('perform well');
  });

  it('Friendly mode adds warmth and politeness to directives', async () => {
    const provider = new MockAIProvider();
    const result = await provider.correctGrammar(
      'Submit your documents before Friday.',
      'friendly',
      'en-US',
      'simple'
    );
    expect(result.correctedText).toContain('Please submit');
    expect(result.correctedText).toContain('Thanks!');
  });

  it('leaves already-correct text unchanged under Grammar Fix and Professional', async () => {
    const provider = new MockAIProvider();
    const clean = 'I submitted the completed report yesterday.';

    const grammarResult = await provider.correctGrammar(clean, 'grammar_fix', 'en-US', 'simple');
    expect(grammarResult.correctedText).toBe(clean);

    const professionalResult = await provider.correctGrammar(clean, 'professional', 'en-US', 'simple');
    expect(professionalResult.correctedText).toBe(clean);
  });

  it('handles empty text gracefully for every mode', async () => {
    const provider = new MockAIProvider();
    for (const mode of ALL_MODES) {
      const result = await provider.correctGrammar('', mode, 'en-US', 'simple');
      expect(result.correctedText).toBe('');
      expect(result.suggestions).toEqual([]);
    }
  });

  it('handles unicode, quotes, numbers, and names without corruption', async () => {
    const provider = new MockAIProvider();
    const input = 'José said, "I\'ll send the €500 invoice by March 3rd." — François agreed.';
    for (const mode of ALL_MODES) {
      const result = await provider.correctGrammar(input, mode, 'en-US', 'simple');
      expect(result.correctedText).toContain('José');
      expect(result.correctedText).toContain('François');
      expect(result.correctedText).toContain('€500');
    }
  });

  it('Accept All reproduces correctedText exactly for every mode (no corruption)', async () => {
    const provider = new MockAIProvider();
    const input =
      'Hey dude, I would like to inform you that the implementation of the methodology was delayed due to the fact that stuff happened.';
    for (const mode of ALL_MODES) {
      const result = await provider.correctGrammar(input, mode, 'en-US', 'simple');
      const applied = applyAllSuggestions(input, result.suggestions);
      expect(applied).toBe(result.correctedText);
    }
  });

  it('respects British vs American English spelling across modes', async () => {
    const provider = new MockAIProvider();
    const input = 'We need to organize and color the center of the room.';
    const gb = await provider.correctGrammar(input, 'improve_writing', 'en-GB', 'simple');
    const us = await provider.correctGrammar(input, 'improve_writing', 'en-US', 'simple');
    expect(gb.correctedText).toContain('organise');
    expect(gb.correctedText).toContain('colour');
    expect(gb.correctedText).toContain('centre');
    expect(us.correctedText).toBe(input);
  });

  it('maps writing modes dynamically to their corresponding action button labels', () => {
    expect(getActionLabel('grammar_fix')).toBe('Check Grammar');
    expect(getActionLabel('improve_writing')).toBe('Improve Writing');
    expect(getActionLabel('professional')).toBe('Apply Professional Tone');
    expect(getActionLabel('casual')).toBe('Apply Casual Tone');
    expect(getActionLabel('formal')).toBe('Apply Formal Tone');
    expect(getActionLabel('academic')).toBe('Apply Academic Tone');
    expect(getActionLabel('friendly')).toBe('Apply Friendly Tone');
    expect(getActionLabel('simplify')).toBe('Simplify Text');
    expect(getActionLabel('shorten')).toBe('Shorten Text');
    expect(getActionLabel('expand')).toBe('Expand Text');
  });
});
