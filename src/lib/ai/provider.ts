import { GeminiAIProvider } from './gemini-provider';
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
  private getProvider(): AIProviderInterface {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey && apiKey !== 'your-gemini-api-key-here' && apiKey.length > 5) {
      return new GeminiAIProvider(apiKey);
    }

    return new MockAIProvider() as unknown as AIProviderInterface;
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
