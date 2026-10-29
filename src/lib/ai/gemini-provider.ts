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
import { validateAndFixOffsets } from './offset-validator';
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

export class GeminiAIProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  /**
   * Helper to clean markdown json blocks
   */
  private cleanJsonResponse(raw: string): string {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
  }

  async correctGrammar(
    text: string,
    mode: WritingMode = 'grammar_fix',
    language: LanguageVariant = 'en-US',
    explanationLevel: ExplanationLevel = 'simple',
    explanationLanguage: 'en' | 'km' = 'en'
  ): Promise<GrammarCorrectionResult> {
    const prompt = buildCorrectionPrompt(text, mode, language, explanationLevel, explanationLanguage);

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Low temperature for consistent, accurate grammar corrections
      },
    });

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();

    const cleanedJson = this.cleanJsonResponse(responseText);
    const parsedData = JSON.parse(cleanedJson);
    const validated = AIResponseSchema.parse(parsedData);

    // Verify and repair offsets against original sourceText
    const verifiedSuggestions: CorrectionSuggestion[] = validateAndFixOffsets(
      text,
      validated.suggestions
    );

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
      validated.correctedText,
      grammarIssuesCount,
      clarityIssuesCount,
      styleIssuesCount
    );

    return {
      originalText: text,
      correctedText: validated.correctedText,
      mode,
      language,
      explanationLevel,
      suggestions: verifiedSuggestions,
      summary: validated.summary,
      qualityInsights,
      modelUsed: `Gemini (${this.modelName})`,
    };
  }

  async rewriteSentence(sentence: string, tone: RewriteTone): Promise<SentenceRewriteResult> {
    const prompt = buildRewritePrompt(sentence, tone);

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    const cleanedJson = this.cleanJsonResponse(responseText);
    const parsed = JSON.parse(cleanedJson);
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

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.5,
      },
    });

    // Convert messages to Gemini contents format
    // Last message is the current prompt
    const userMessage = messages[messages.length - 1]?.content || '';
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);

    return {
      reply: result.response.text(),
    };
  }
}
