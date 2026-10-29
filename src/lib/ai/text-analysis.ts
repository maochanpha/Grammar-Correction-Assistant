import { WritingQualityInsights } from './types';

/**
 * Counts syllables in an English word using standard phonetic heuristics
 */
export function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevIsVowel = false;

  for (let i = 0; i < clean.length; i++) {
    const isVowel = vowels.includes(clean[i]);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }

  // Handle trailing silent 'e'
  if (clean.endsWith('e') && !clean.endsWith('le') && count > 1) {
    count--;
  }

  // Handle 'ed' endings that aren't syllables
  if (clean.endsWith('ed') && count > 1 && !clean.endsWith('ted') && !clean.endsWith('ded')) {
    count--;
  }

  return Math.max(1, count);
}

/**
 * Splits text into words
 */
export function getWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Splits text into sentences
 */
export function getSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * Computes Flesch Reading Ease score
 * Formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
 */
export function calculateFleschReadingEase(words: string[], sentences: string[]): number {
  if (words.length === 0 || sentences.length === 0) return 100;

  const totalWords = words.length;
  const totalSentences = sentences.length;
  const totalSyllables = words.reduce((acc, word) => acc + countSyllables(word), 0);

  const asw = totalSyllables / totalWords;
  const asl = totalWords / totalSentences;

  const score = 206.835 - 1.015 * asl - 84.6 * asw;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Maps Flesch Reading Ease score to Grade Level description
 */
export function getGradeLevel(score: number): string {
  if (score >= 90) return '5th Grade (Very Easy)';
  if (score >= 80) return '6th Grade (Easy)';
  if (score >= 70) return '7th Grade (Fairly Easy)';
  if (score >= 60) return '8th - 9th Grade (Standard)';
  if (score >= 50) return '10th - 12th Grade (Fairly Difficult)';
  if (score >= 30) return 'College Level (Difficult)';
  return 'Graduate Level (Very Difficult)';
}

/**
 * Generates actionable writing guidance tips
 */
export function generateGuidanceTips(
  text: string,
  words: string[],
  sentences: string[],
  fleschScore: number,
  grammarIssues: number,
  clarityIssues: number
): string[] {
  const tips: string[] = [];

  if (words.length === 0) {
    return ['Paste or type text into the editor to receive instant writing insights.'];
  }

  // Sentence length check
  const longSentences = sentences.filter((s) => getWords(s).length > 25);
  if (longSentences.length > 0) {
    tips.push(
      `${longSentences.length} sentence${longSentences.length > 1 ? 's are' : ' is'} over 25 words. Consider breaking them up for easier reading.`
    );
  }

  // Readability feedback
  if (fleschScore < 45) {
    tips.push('The reading level is quite dense. Try shorter phrases or simpler vocabulary for broader clarity.');
  } else if (fleschScore >= 70) {
    tips.push('Excellent readability! Your sentences are accessible and flow naturally.');
  }

  // Grammar & clarity issues feedback
  if (grammarIssues === 0 && clarityIssues === 0) {
    tips.push('No obvious grammatical or structural errors detected. Your text is clean.');
  } else {
    if (grammarIssues > 0) {
      tips.push(`${grammarIssues} grammar/spelling correction${grammarIssues > 1 ? 's' : ''} recommended.`);
    }
    if (clarityIssues > 0) {
      tips.push(`${clarityIssues} clarity or style improvement${clarityIssues > 1 ? 's' : ''} available.`);
    }
  }

  // Vocabulary variety
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))).size;
  const lexicalDensity = Math.round((uniqueWords / words.length) * 100);
  if (words.length >= 40 && lexicalDensity > 60) {
    tips.push('Great vocabulary variety with minimal repetitive word choices.');
  }

  return tips.slice(0, 4);
}

/**
 * Calculates complete writing quality insights
 */
export function analyzeWritingQuality(
  text: string,
  grammarIssuesCount = 0,
  clarityIssuesCount = 0,
  styleIssuesCount = 0
): WritingQualityInsights {
  const words = getWords(text);
  const sentences = getSentences(text);
  const characterCount = text.length;
  const wordCount = words.length;
  const sentenceCount = sentences.length;

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.max(0.1, Number((wordCount / 200).toFixed(1)));

  const readingEaseScore = calculateFleschReadingEase(words, sentences);
  const readingGradeLevel = getGradeLevel(readingEaseScore);

  // Overall Quality Calculation (Documented heuristic):
  // Starts at 100
  // Deducts 3 points per grammar/spelling error
  // Deducts 1.5 points per clarity/style suggestion
  // Normalized by word count density (per 100 words)
  let overallScore = 100;
  if (wordCount > 0) {
    const totalIssues = grammarIssuesCount * 3 + (clarityIssuesCount + styleIssuesCount) * 1.5;
    const issuePenalty = (totalIssues / Math.max(1, wordCount / 50)) * 5;
    
    // Readability balance adjustment: extremes (too complex <30) deduct a small factor
    const readabilityPenalty = readingEaseScore < 35 ? 10 : readingEaseScore < 50 ? 5 : 0;
    
    overallScore = Math.max(15, Math.min(100, Math.round(100 - issuePenalty - readabilityPenalty)));
  }

  let qualityVerdict = 'Excellent';
  if (overallScore < 55) {
    qualityVerdict = 'Needs Revision';
  } else if (overallScore < 75) {
    qualityVerdict = 'Fair';
  } else if (overallScore < 90) {
    qualityVerdict = 'Good';
  }

  const guidanceTips = generateGuidanceTips(
    text,
    words,
    sentences,
    readingEaseScore,
    grammarIssuesCount,
    clarityIssuesCount
  );

  return {
    wordCount,
    characterCount,
    sentenceCount,
    readingTimeMinutes,
    readingEaseScore,
    readingGradeLevel,
    grammarIssuesCount,
    clarityIssuesCount,
    styleIssuesCount,
    overallQualityScore: overallScore,
    qualityVerdict,
    guidanceTips,
  };
}
