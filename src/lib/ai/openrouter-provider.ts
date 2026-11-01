import { z } from 'zod';
import {
  GrammarCorrectionResult,
  WritingMode,
  LanguageVariant,
  ExplanationLevel,
  CorrectionSuggestion,
  SentenceRewriteResult,
  RewriteTone,
  WritingChatResult,
  WritingChatMessage,
} from './types';
import {
  buildCorrectionPrompt,
  buildRewritePrompt,
  buildWritingChatSystemPrompt,
} from './prompts';
import {
  validateAndFixOffsets,
  reconcileDiffSuggestions,
  applyAllSuggestions,
} from './offset-validator';
import { analyzeWritingQuality } from './text-analysis';
import { extractAndParseJSON } from './gemini-provider';

const SuggestionSchema = z.object({
  category: z.enum(['grammar', 'spelling', 'punctuation', 'clarity', 'style']).default('grammar'),
  originalPhrase: z.string(),
  replacementPhrase: z.string(),
  explanation: z.string().default(''),
  detailedExplanation: z.string().optional(),
  rule: z.string().optional(),
  startIndex: z.number().default(-1),
  endIndex: z.number().default(-1),
});

const AIResponseSchema = z.object({
  correctedText: z.string(),
  summary: z.string().default('Text reviewed and corrected.'),
  suggestions: z.array(SuggestionSchema).default([]),
});

const RewriteResponseSchema = z.object({
  alternatives: z.array(z.string()).min(1).max(5),
});

// High-speed in-memory LRU cache to eliminate duplicate network calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
const MAX_CACHE_ENTRIES = 120;

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Derives the active model hierarchy with automatic fallbacks
 */
function getModelFallbacks(configuredModel: string): string[] {
  // If the model is the known discontinued qwen free slug, substitute immediately
  const primary =
    configuredModel === 'qwen/qwen3.8-27b:free' || !configuredModel
      ? 'openrouter/free'
      : configuredModel;

  const fallbacks = [primary, 'openrouter/free', 'openrouter/auto'];
  return Array.from(new Set(fallbacks));
}

export class OpenRouterAIProvider {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName?: string) {
    this.apiKey = apiKey;
    this.modelName = modelName || process.env.OPENROUTER_MODEL || 'openrouter/free';
  }

  async correctGrammar(
    text: string,
    mode: WritingMode = 'grammar_fix',
    language: LanguageVariant = 'en-US',
    explanationLevel: ExplanationLevel = 'simple',
    explanationLanguage: 'en' | 'km' = 'en'
  ): Promise<GrammarCorrectionResult> {
    const cacheKey = `correct:${text.trim()}:${mode}:${language}:${explanationLevel}:${explanationLanguage}`;
    const cached = getCached<GrammarCorrectionResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = buildCorrectionPrompt(
      text,
      mode,
      language,
      explanationLevel,
      explanationLanguage
    );

    const models = getModelFallbacks(this.modelName);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PorPor AGC',
      },
      body: JSON.stringify({
        models,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        reasoning: { max_tokens: 0 },
        max_tokens: 2200,
      }),
      signal: AbortSignal.timeout(18000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsedData = extractAndParseJSON<unknown>(content);
    const validated = AIResponseSchema.parse(parsedData);

    let verifiedSuggestions: CorrectionSuggestion[] = validateAndFixOffsets(
      text,
      validated.suggestions
    );

    verifiedSuggestions = reconcileDiffSuggestions(
      text,
      validated.correctedText,
      verifiedSuggestions
    );

    let fullyCorrected = validated.correctedText?.trim()
      ? validated.correctedText
      : applyAllSuggestions(text, verifiedSuggestions);

    if (verifiedSuggestions.length > 0 && fullyCorrected === text) {
      fullyCorrected = applyAllSuggestions(text, verifiedSuggestions);
    }

    const grammarIssuesCount = verifiedSuggestions.filter(
      (s) => s.category === 'grammar' || s.category === 'spelling'
    ).length;
    const clarityIssuesCount = verifiedSuggestions.filter(
      (s) => s.category === 'clarity'
    ).length;
    const styleIssuesCount = verifiedSuggestions.filter(
      (s) => s.category === 'style' || s.category === 'punctuation'
    ).length;

    const qualityInsights = analyzeWritingQuality(
      fullyCorrected,
      grammarIssuesCount,
      clarityIssuesCount,
      styleIssuesCount
    );

    const summary =
      validated.summary && validated.summary.length > 10
        ? validated.summary
        : verifiedSuggestions.length > 0
        ? `Identified and corrected ${verifiedSuggestions.length} grammatical issue${
            verifiedSuggestions.length > 1 ? 's' : ''
          }.`
        : 'Your text is grammatically clean and well-structured for this mode.';

    const result: GrammarCorrectionResult = {
      originalText: text,
      correctedText: fullyCorrected,
      mode,
      language,
      explanationLevel,
      suggestions: verifiedSuggestions,
      summary,
      qualityInsights,
      modelUsed: `OpenRouter (${data.model || this.modelName})`,
    };

    setCached(cacheKey, result);
    return result;
  }

  async rewriteSentence(sentence: string, tone: RewriteTone): Promise<SentenceRewriteResult> {
    const cacheKey = `rewrite:${sentence.trim()}:${tone}`;
    const cached = getCached<SentenceRewriteResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = buildRewritePrompt(sentence, tone);
    const models = getModelFallbacks(this.modelName);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PorPor AGC',
      },
      body: JSON.stringify({
        models,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
        reasoning: { max_tokens: 0 },
        max_tokens: 450,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter rewrite error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = extractAndParseJSON<unknown>(content);
    const validated = RewriteResponseSchema.parse(parsed);

    const result: SentenceRewriteResult = {
      originalSentence: sentence,
      tone,
      alternatives: validated.alternatives.slice(0, 3),
    };

    setCached(cacheKey, result);
    return result;
  }

  async chatWritingAssistant(
    messages: WritingChatMessage[],
    documentContext?: string
  ): Promise<WritingChatResult> {
    const systemPrompt = buildWritingChatSystemPrompt(documentContext);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const models = getModelFallbacks(this.modelName);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PorPor AGC',
      },
      body: JSON.stringify({
        models,
        messages: apiMessages,
        temperature: 0.5,
        reasoning: { max_tokens: 0 },
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(18000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter chat error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return { reply };
  }
}
