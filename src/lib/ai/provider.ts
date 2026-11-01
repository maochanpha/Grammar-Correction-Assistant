import { GeminiAIProvider } from './gemini-provider';
import { OpenRouterAIProvider } from './openrouter-provider';
import { MockAIProvider } from './mock-provider';
import {
  GrammarCorrectionResult,
  WritingMode,
  LanguageVariant,
  ExplanationLevel,
  SentenceRewriteResult,
  RewriteTone,
  WritingChatResult,
  WritingChatMessage,
} from './types';

export interface AIProviderInterface {
  correctGrammar(
    text: string,
    mode?: WritingMode,
    language?: LanguageVariant,
    explanationLevel?: ExplanationLevel,
    explanationLanguage?: 'en' | 'km'
  ): Promise<GrammarCorrectionResult>;

  rewriteSentence(sentence: string, tone: RewriteTone): Promise<SentenceRewriteResult>;

  chatWritingAssistant(
    messages: WritingChatMessage[],
    documentContext?: string
  ): Promise<WritingChatResult>;
}

class UnifiedAIService implements AIProviderInterface {
  private cachedProvider: AIProviderInterface | null = null;
  private lastKeySignature: string = '';

  private getProvider(): AIProviderInterface {
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim() || '';
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim() || '';
    const model = process.env.OPENROUTER_MODEL || '';
    const sig = `${openRouterKey}:${geminiKey}:${model}`;

    if (this.cachedProvider && this.lastKeySignature === sig) {
      return this.cachedProvider;
    }

    this.lastKeySignature = sig;
    if (openRouterKey && openRouterKey !== 'your-openrouter-api-key-here' && openRouterKey.length > 5) {
      this.cachedProvider = new OpenRouterAIProvider(openRouterKey, model);
      return this.cachedProvider;
    }

    if (geminiKey && geminiKey !== 'your-gemini-api-key-here' && geminiKey.length > 5) {
      this.cachedProvider = new GeminiAIProvider(geminiKey);
      return this.cachedProvider;
    }

    this.cachedProvider = new MockAIProvider() as unknown as AIProviderInterface;
    return this.cachedProvider;
  }

  async correctGrammar(
    text: string,
    mode: WritingMode = 'grammar_fix',
    language: LanguageVariant = 'en-US',
    explanationLevel: ExplanationLevel = 'simple',
    explanationLanguage: 'en' | 'km' = 'en'
  ): Promise<GrammarCorrectionResult> {
    const provider = this.getProvider();
    try {
      return await provider.correctGrammar(
        text,
        mode,
        language,
        explanationLevel,
        explanationLanguage
      );
    } catch (err: unknown) {
      console.error('[AI Provider Error] Falling back to intelligent mock provider:', err);
      // Fallback to mock provider on network or API failure
      const mock = new MockAIProvider();
      return await mock.correctGrammar(text, mode, language, explanationLevel);
    }
  }

  async rewriteSentence(sentence: string, tone: RewriteTone): Promise<SentenceRewriteResult> {
    const provider = this.getProvider();
    try {
      return await provider.rewriteSentence(sentence, tone);
    } catch (err: unknown) {
      console.error('[AI Provider Rewrite Error] Falling back:', err);
      const mock = new MockAIProvider();
      return await mock.rewriteSentence(sentence, tone);
    }
  }

  async chatWritingAssistant(
    messages: WritingChatMessage[],
    documentContext?: string
  ): Promise<WritingChatResult> {
    const provider = this.getProvider();
    try {
      return await provider.chatWritingAssistant(messages, documentContext);
    } catch (err: unknown) {
      console.error('[AI Provider Chat Error] Falling back:', err);
      const mock = new MockAIProvider();
      const lastMsg = messages[messages.length - 1]?.content || '';
      return await mock.chatWritingAssistant(lastMsg, documentContext);
    }
  }
}

export const aiService = new UnifiedAIService();
