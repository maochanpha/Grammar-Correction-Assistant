export type WritingMode =
  | 'grammar_fix'
  | 'improve_writing'
  | 'professional'
  | 'casual'
  | 'formal'
  | 'simplify'
  | 'shorten'
  | 'expand'
  | 'academic'
  | 'friendly';

export type LanguageVariant = 'en-US' | 'en-GB';

export type ExplanationLevel = 'simple' | 'detailed';

export type ErrorCategory =
  | 'grammar'
  | 'spelling'
  | 'punctuation'
  | 'clarity'
  | 'style';

export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed';

export interface CorrectionSuggestion {
  id: string;
  category: ErrorCategory;
  originalPhrase: string;
  replacementPhrase: string;
  explanation: string;
  detailedExplanation?: string;
  startIndex: number;
  endIndex: number;
  rule?: string;
  status?: SuggestionStatus;
}

export interface WritingQualityInsights {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  readingTimeMinutes: number;
  readingEaseScore: number; // 0 - 100
  readingGradeLevel: string; // e.g. "8th - 9th Grade (Easy)"
  grammarIssuesCount: number;
  clarityIssuesCount: number;
  styleIssuesCount: number;
  overallQualityScore: number; // 0 - 100
  qualityVerdict: string; // e.g. "Excellent", "Good", "Needs Review"
  guidanceTips: string[];
}

export interface GrammarCorrectionResult {
  originalText: string;
  correctedText: string;
  mode: WritingMode;
  language: LanguageVariant;
  explanationLevel: ExplanationLevel;
  suggestions: CorrectionSuggestion[];
  summary: string;
  qualityInsights: WritingQualityInsights;
  modelUsed?: string;
}

export type RewriteTone =
  | 'professional'
  | 'polite'
  | 'confident'
  | 'natural'
  | 'shorter'
  | 'clearer'
  | 'friendly'
  | 'formal';

export interface SentenceRewriteResult {
  originalSentence: string;
  tone: RewriteTone;
  alternatives: string[];
}

export interface WritingChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface WritingChatResult {
  reply: string;
}

export interface ModeInfo {
  id: WritingMode;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  badge: string;
  iconName: string;
}

export const WRITING_MODES: Record<WritingMode, ModeInfo> = {
  grammar_fix: {
    id: 'grammar_fix',
    name: 'Grammar Fix',
    shortDescription: 'Fix grammar, spelling, & punctuation with minimal changes.',
    detailedDescription: 'Corrects grammatical errors, typos, spelling, and punctuation while strictly preserving your exact phrasing and sentence structure.',
    badge: 'Precision',
    iconName: 'CheckCircle2',
  },
  improve_writing: {
    id: 'improve_writing',
    name: 'Improve Writing',
    shortDescription: 'Enhance clarity, sentence flow, and overall readability.',
    detailedDescription: 'Restructures awkward sentences, removes clunky wording, and improves cadence while preserving your core voice.',
    badge: 'Popular',
    iconName: 'Sparkles',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    shortDescription: 'Polished, authoritative, and workplace-appropriate language.',
    detailedDescription: 'Elevates your writing for business emails, executive summaries, client proposals, and team communications.',
    badge: 'Work',
    iconName: 'Briefcase',
  },
  casual: {
    id: 'casual',
    name: 'Casual',
    shortDescription: 'Relaxed, conversational, and natural everyday English.',
    detailedDescription: 'Makes writing feel friendly, relatable, and easygoing, perfect for blogs, social posts, or informal notes.',
    badge: 'Relaxed',
    iconName: 'Coffee',
  },
  formal: {
    id: 'formal',
    name: 'Formal',
    shortDescription: 'Sophisticated register for official and executive documents.',
    detailedDescription: 'Uses dignified vocabulary and formal syntax without slang, ideal for diplomatic, legal, and institutional writing.',
    badge: 'Official',
    iconName: 'Building2',
  },
  simplify: {
    id: 'simplify',
    name: 'Simplify',
    shortDescription: 'Make complex sentences easy to understand at a glance.',
    detailedDescription: 'Breaks long convoluted thoughts into clear, plain English sentences suitable for broad audiences.',
    badge: 'Clear',
    iconName: 'Lightbulb',
  },
  shorten: {
    id: 'shorten',
    name: 'Shorten',
    shortDescription: 'Trim filler words and redundancy while keeping key points.',
    detailedDescription: 'Cuts verbosity, tautologies, and fluff to create punchy, high-impact statements.',
    badge: 'Concise',
    iconName: 'Scissors',
  },
  expand: {
    id: 'expand',
    name: 'Expand',
    shortDescription: 'Add descriptive clarity and smooth transitional depth.',
    detailedDescription: 'Fleshes out brief points with descriptive precision and coherent transitions without fabricating new facts.',
    badge: 'Detailed',
    iconName: 'Maximize2',
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    shortDescription: 'Scholarly precision, objective tone, and analytical phrasing.',
    detailedDescription: 'Tailored for research papers, essays, and journals with rigorous sentence structure and scholarly terminology.',
    badge: 'Scholarly',
    iconName: 'GraduationCap',
  },
  friendly: {
    id: 'friendly',
    name: 'Friendly',
    shortDescription: 'Warm, polite, empathetic, and approachable communication.',
    detailedDescription: 'Infuses warmth, kindness, and pleasant courtesy into messages, ideal for greetings, invites, and supportive notes.',
    badge: 'Warm',
    iconName: 'HeartHandshake',
  },
};
