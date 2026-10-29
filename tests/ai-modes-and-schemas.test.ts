import { describe, it, expect } from 'vitest';
import { WRITING_MODES, WritingMode } from '../src/lib/ai/types';
import { buildCorrectionPrompt, buildRewritePrompt } from '../src/lib/ai/prompts';
import { MockAIProvider } from '../src/lib/ai/mock-provider';

describe('AI Modes, Schemas & Prompts', () => {
  it('defines all 10 required writing modes with metadata', () => {
    const requiredModes: WritingMode[] = [
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

    for (const m of requiredModes) {
      expect(WRITING_MODES[m]).toBeDefined();
      expect(WRITING_MODES[m].name.length).toBeGreaterThan(0);
      expect(WRITING_MODES[m].badge.length).toBeGreaterThan(0);
      expect(WRITING_MODES[m].shortDescription.length).toBeGreaterThan(0);
    }
  });

  it('builds system prompts for American and British English variants', () => {
    const usPrompt = buildCorrectionPrompt('Test text', 'grammar_fix', 'en-US', 'simple');
    expect(usPrompt).toContain('American English');
    expect(usPrompt).toContain('color');

    const gbPrompt = buildCorrectionPrompt('Test text', 'grammar_fix', 'en-GB', 'detailed');
    expect(gbPrompt).toContain('British English');
    expect(gbPrompt).toContain('colour');
    expect(gbPrompt).toContain('DETAILED explanations');
  });

  it('builds sentence rewrite prompts for all tones', () => {
    const prompt = buildRewritePrompt('The report was sent.', 'professional');
    expect(prompt).toContain('professional');
    expect(prompt).toContain('alternatives');
  });

  it('mock provider accurately corrects grammar mistakes with verified offsets', async () => {
    const mock = new MockAIProvider();
    const text = 'I has send the report yesterday but he not reply me yet.';
    const result = await mock.correctGrammar(text, 'grammar_fix', 'en-US', 'simple');

    expect(result.originalText).toBe(text);
    expect(result.correctedText).toContain('sent');
    expect(result.suggestions.length).toBeGreaterThan(0);

    for (const sug of result.suggestions) {
      expect(text.substring(sug.startIndex, sug.endIndex)).toBe(sug.originalPhrase);
    }
  });

  it('handles clean text without inventing unnecessary modifications', async () => {
    const mock = new MockAIProvider();
    const cleanText = 'The team finalized the quarterly financial report on time.';
    const result = await mock.correctGrammar(cleanText, 'grammar_fix', 'en-US', 'simple');

    expect(result.suggestions.length).toBe(0);
    expect(result.correctedText).toBe(cleanText);
  });
});
