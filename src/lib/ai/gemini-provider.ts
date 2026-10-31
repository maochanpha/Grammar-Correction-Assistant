import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Structured Zod schema for AI correction response
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

/**
 * Robust JSON extractor that handles markdown code blocks,
 * stray preamble/postamble, and basic formatting quirks.
 */
export function extractAndParseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    cleaned = markdownMatch[1].trim();
  }

  // Find the outermost JSON object or array bounds
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endChar = '}';

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endChar = '}';
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endChar = ']';
    }

    if (startIdx !== -1) {
      const lastIdx = cleaned.lastIndexOf(endChar);
      if (lastIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, lastIdx + 1);
      }
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Repair common JSON syntax issues: trailing commas before } or ]
    const repaired = cleaned
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    return JSON.parse(repaired);
  }
}

export class GeminiAIProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;

  // gemini-2.0-flash, gemini-2.5-flash, and gemini-1.5-flash have all been
  // retired by Google (404 Not Found / "no longer available"). gemini-3.8-flash
  // is the current stable model as of this writing; gemini-flash-latest is
  // kept as a secondary fallback alias in case the pinned version is retired.
  private static readonly RETIRED_MODELS = new Set([
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.0-pro',
  ]);
  private static readonly DEFAULT_MODEL = 'gemini-3.8-flash';
  private static readonly FALLBACK_MODELS = [
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
  ];

  constructor(apiKey: string, modelName?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    let model = modelName || process.env.GEMINI_MODEL || GeminiAIProvider.DEFAULT_MODEL;
    if (GeminiAIProvider.RETIRED_MODELS.has(model)) {
      model = GeminiAIProvider.DEFAULT_MODEL;
    }
    this.modelName = model;
  }

  /**
   * Dispatches model call with automatic fallback to stable Gemini models
   * if the primary model returns 404 Not Found or unsupported.
   */
  private async generateWithFallback(
    prompt: string,
    systemInstruction?: string,
    isJson: boolean = true
  ): Promise<string> {
    const candidateModels = [this.modelName, ...GeminiAIProvider.FALLBACK_MODELS];
    const tried = new Set<string>();
    let lastError: unknown = null;

    for (const mName of candidateModels) {
      if (tried.has(mName)) continue;
      tried.add(mName);

      try {
        const model = this.client.getGenerativeModel({
          model: mName,
          ...(systemInstruction ? { systemInstruction } : {}),
          generationConfig: {
            ...(isJson ? { responseMimeType: 'application/json' } : {}),
            temperature: 0.15,
            maxOutputTokens: 8192,
          },
        });

        const response = await model.generateContent(prompt);
        const text = response.response.text();
        if (text && text.trim().length > 0) {
          this.modelName = mName;
          return text;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(`[Gemini Provider] Model ${mName} attempt failed, trying fallback:`, err);
      }
    }

    throw lastError || new Error('No response returned from Gemini API models');
  }

  async correctGrammar(
    text: string,
    mode: WritingMode = 'grammar_fix',
    language: LanguageVariant = 'en-US',
    explanationLevel: ExplanationLevel = 'simple',
    explanationLanguage: 'en' | 'km' = 'en'
  ): Promise<GrammarCorrectionResult> {
    const prompt = buildCorrectionPrompt(
      text,
      mode,
      language,
      explanationLevel,
      explanationLanguage
    );

    const responseText = await this.generateWithFallback(prompt, undefined, true);
    const parsedData = extractAndParseJSON<unknown>(responseText);
    const validated = AIResponseSchema.parse(parsedData);

    // 1. Verify and repair offsets against original sourceText
    let verifiedSuggestions: CorrectionSuggestion[] = validateAndFixOffsets(
      text,
      validated.suggestions
    );

    // 2. Reconcile with correctedText: If correctedText contains improvements
    // not present in verifiedSuggestions, extract them so nothing is lost.
    verifiedSuggestions = reconcileDiffSuggestions(
      text,
      validated.correctedText,
      verifiedSuggestions
    );

    // 3. Ensure correctedText is fully populated and reflects all corrections
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

    return {
      originalText: text,
      correctedText: fullyCorrected,
      mode,
      language,
      explanationLevel,
      suggestions: verifiedSuggestions,
      summary,
      qualityInsights,
      modelUsed: `Gemini (${this.modelName})`,
    };
  }

  async rewriteSentence(sentence: string, tone: RewriteTone): Promise<SentenceRewriteResult> {
    const prompt = buildRewritePrompt(sentence, tone);
    const responseText = await this.generateWithFallback(prompt, undefined, true);
    const parsed = extractAndParseJSON<unknown>(responseText);
    const validated = RewriteResponseSchema.parse(parsed);

    return {
      originalSentence: sentence,
      tone,
      alternatives: validated.alternatives.slice(0, 3),
    };
  }

  async chatWritingAssistant(
    messages: WritingChatMessage[],
    documentContext?: string
  ): Promise<WritingChatResult> {
    const systemPrompt = buildWritingChatSystemPrompt(documentContext);
    const candidateModels = [this.modelName, ...GeminiAIProvider.FALLBACK_MODELS];
    const tried = new Set<string>();
    let lastError: unknown = null;

    const userMessage = messages[messages.length - 1]?.content || '';
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    for (const mName of candidateModels) {
      if (tried.has(mName)) continue;
      tried.add(mName);

      try {
        const model = this.client.getGenerativeModel({
          model: mName,
          systemInstruction: systemPrompt,
          generationConfig: {
            temperature: 0.5,
          },
        });

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(userMessage);
        return {
          reply: result.response.text(),
        };
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Chat] Model ${mName} failed, trying fallback:`, err);
      }
    }

    throw lastError || new Error('No response from Gemini Chat');
  }
}
