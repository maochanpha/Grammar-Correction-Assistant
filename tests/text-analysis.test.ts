import { describe, it, expect } from 'vitest';
import {
  calculateFleschReadingEase,
  getGradeLevel,
  analyzeWritingQuality,
  countSyllables,
  getWords,
  getSentences,
} from '../src/lib/ai/text-analysis';

describe('Text Analysis & Readability', () => {
  it('correctly counts words and sentences', () => {
    const text = 'This is the first sentence. Here is the second sentence! Is this third?';
    const words = getWords(text);
    const sentences = getSentences(text);

    expect(words.length).toBe(13);
    expect(sentences.length).toBe(3);
  });

  it('accurately counts syllables for common words', () => {
    expect(countSyllables('the')).toBe(1);
    expect(countSyllables('writing')).toBe(2);
    expect(countSyllables('assistant')).toBe(3);
    expect(countSyllables('communication')).toBe(5);
  });

  it('calculates Flesch Reading Ease score within reasonable bounds', () => {
    const simpleText = 'The cat sat on the mat. The sun was hot and the sky was blue.';
    const words = getWords(simpleText);
    const sentences = getSentences(simpleText);
    const score = calculateFleschReadingEase(words, sentences);

    expect(score).toBeGreaterThan(80);
    expect(getGradeLevel(score)).toContain('Grade');
  });

  it('calculates complete writing quality insights with deductions', () => {
    const text = 'I has send the report yesterday but he not reply me yet.';
    const insights = analyzeWritingQuality(text, 2, 1, 0);

    expect(insights.wordCount).toBe(12);
    expect(insights.sentenceCount).toBe(1);
    expect(insights.grammarIssuesCount).toBe(2);
    expect(insights.clarityIssuesCount).toBe(1);
    expect(insights.overallQualityScore).toBeLessThan(90);
    expect(insights.guidanceTips.length).toBeGreaterThan(0);
  });
});
