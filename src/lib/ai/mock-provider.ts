import {
  GrammarCorrectionResult,
  WritingMode,
  LanguageVariant,
  ExplanationLevel,
  CorrectionSuggestion,
  SentenceRewriteResult,
  RewriteTone,
  WritingChatResult,
} from './types';
import { validateAndFixOffsets, applyAllSuggestions } from './offset-validator';
import { analyzeWritingQuality } from './text-analysis';

interface RuleMatch {
  pattern: RegExp;
  category: 'grammar' | 'spelling' | 'punctuation' | 'clarity' | 'style';
  replacement: string | ((match: string) => string);
  explanation: string;
  detailedExplanation: string;
  rule: string;
}

const COMMON_RULES: RuleMatch[] = [
  {
    pattern: /\bI has send\b/gi,
    category: 'grammar',
    replacement: 'I sent',
    explanation: "Use simple past 'sent' with yesterday, or 'have sent'.",
    detailedExplanation:
      "When specifying a completed past time like 'yesterday', use simple past tense 'sent' rather than present perfect with incorrect auxiliary 'has'.",
    rule: 'Verb Tense & Agreement',
  },
  {
    pattern: /\bhe not reply me\b/gi,
    category: 'grammar',
    replacement: "he hasn't replied to me",
    explanation: "Use auxiliary 'hasn't replied' and preposition 'to me'.",
    detailedExplanation:
      "Negative statements in third-person singular require an auxiliary verb ('has not' / 'did not'), and 'reply' requires the preposition 'to' before an indirect object pronoun.",
    rule: 'Auxiliary Verb & Preposition',
  },
  {
    pattern: /\bShe don't\b/g,
    category: 'grammar',
    replacement: "She doesn't",
    explanation: "Use 'doesn't' with third-person singular subject 'she'.",
    detailedExplanation:
      "Subject-verb agreement requires the third-person singular auxiliary verb 'doesn't' (does not) when the subject is 'he', 'she', or 'it'.",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\bHe don't\b/g,
    category: 'grammar',
    replacement: "He doesn't",
    explanation: "Use 'doesn't' with third-person singular subject 'he'.",
    detailedExplanation:
      "Third-person singular pronouns ('he', 'she', 'it') take 'does not' or 'doesn't' instead of 'do not'.",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\bhas went\b/gi,
    category: 'grammar',
    replacement: 'has gone',
    explanation: "Use past participle 'gone' after auxiliary 'has'.",
    detailedExplanation:
      "The present perfect tense is formed by 'has/have' followed by the past participle ('gone'), not the simple past ('went').",
    rule: 'Past Participle Form',
  },
  {
    pattern: /\bcould of\b/gi,
    category: 'grammar',
    replacement: 'could have',
    explanation: "Use 'could have' instead of 'could of'.",
    detailedExplanation:
      "The phrase 'could of' is an incorrect phonetic transcription of 'could've'. The correct modal auxiliary phrase is 'could have'.",
    rule: 'Modal Auxiliary Phrasing',
  },
  {
    pattern: /\bshould of\b/gi,
    category: 'grammar',
    replacement: 'should have',
    explanation: "Use 'should have' instead of 'should of'.",
    detailedExplanation:
      "The contraction 'should've' sounds like 'should of', but grammatically it is always 'should have'.",
    rule: 'Modal Auxiliary Phrasing',
  },
  {
    pattern: /\bmore better\b/gi,
    category: 'clarity',
    replacement: 'better',
    explanation: "Avoid double comparative; 'better' is already comparative.",
    detailedExplanation:
      "'Better' is the comparative form of 'good'. Adding 'more' creates a redundant double comparative.",
    rule: 'Double Comparative',
  },
  {
    pattern: /\bteh\b/gi,
    category: 'spelling',
    replacement: 'the',
    explanation: "Typo: spelled as 'teh'. Corrected to 'the'.",
    detailedExplanation: "Common typing transposition error.",
    rule: 'Spelling Correction',
  },
  {
    pattern: /\brecieve\b/gi,
    category: 'spelling',
    replacement: 'receive',
    explanation: "Spelling error: 'i before e except after c'.",
    detailedExplanation:
      "In English orthography, the letter 'e' precedes 'i' when following the letter 'c' with a long /ee/ sound.",
    rule: 'Spelling Rule',
  },
  {
    pattern: /\balot\b/gi,
    category: 'spelling',
    replacement: 'a lot',
    explanation: "'a lot' is written as two separate words.",
    detailedExplanation: "The noun phrase 'a lot' is always two words in standard English.",
    rule: 'Word Division',
  },
  {
    pattern: /\bdefinately\b/gi,
    category: 'spelling',
    replacement: 'definitely',
    explanation: "Spelling error: corrected to 'definitely'.",
    detailedExplanation:
      "The root is 'definite' (from Latin definitus). Adding the suffix -ly forms 'definitely'.",
    rule: 'Spelling Correction',
  },
  {
    pattern: /\bseperate\b/gi,
    category: 'spelling',
    replacement: 'separate',
    explanation: "Spelling error: contains 'a' in the middle: 'separate'.",
    detailedExplanation: "Mnemonic: there is 'a rat' in 'sep-a-rate'.",
    rule: 'Spelling Correction',
  },
  {
    pattern: /\bdont\b/g,
    category: 'punctuation',
    replacement: "don't",
    explanation: "Missing apostrophe in contraction 'don't'.",
    detailedExplanation:
      "Contractions that abbreviate words require an apostrophe to indicate omitted letters.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bcant\b/g,
    category: 'punctuation',
    replacement: "can't",
    explanation: "Missing apostrophe in contraction 'can't'.",
    detailedExplanation: "Requires apostrophe to mark omission of letters 'n' and 'o'.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bwont\b/g,
    category: 'punctuation',
    replacement: "won't",
    explanation: "Missing apostrophe in contraction 'won't'.",
    detailedExplanation: "Requires apostrophe to distinguish from the noun 'wont'.",
    rule: 'Contraction Apostrophe',
  },
];

export class MockAIProvider {
  async correctGrammar(
    text: string,
    mode: WritingMode = 'grammar_fix',
    language: LanguageVariant = 'en-US',
    explanationLevel: ExplanationLevel = 'simple'
  ): Promise<GrammarCorrectionResult> {
    const rawSuggestions: Partial<CorrectionSuggestion>[] = [];

    // Run rules to detect errors
    for (const rule of COMMON_RULES) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const originalPhrase = match[0];
        const replacement =
          typeof rule.replacement === 'function' ? rule.replacement(originalPhrase) : rule.replacement;
        
        rawSuggestions.push({
          category: rule.category,
          originalPhrase,
          replacementPhrase: replacement,
          explanation: rule.explanation,
          detailedExplanation: rule.detailedExplanation,
          rule: rule.rule,
          startIndex: match.index,
          endIndex: match.index + originalPhrase.length,
        });
      }
    }

    // Language variant spelling adjustments
    if (language === 'en-GB') {
      const gbPairs = [
        [/\bcolor\b/gi, 'colour'],
        [/\borganize\b/gi, 'organise'],
        [/\bcenter\b/gi, 'centre'],
        [/\btraveled\b/gi, 'travelled'],
      ] as const;

      for (const [pattern, repl] of gbPairs) {
        let match: RegExpExecArray | null;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(text)) !== null) {
          rawSuggestions.push({
            category: 'spelling',
            originalPhrase: match[0],
            replacementPhrase: repl,
            explanation: `Adapted to British English spelling (${repl}).`,
            detailedExplanation: 'British English standard orthography.',
            rule: 'British English Conventions',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
        }
      }
    } else if (language === 'en-US') {
      const usPairs = [
        [/\bcolour\b/gi, 'color'],
        [/\borganise\b/gi, 'organize'],
        [/\bcentre\b/gi, 'center'],
      ] as const;

      for (const [pattern, repl] of usPairs) {
        let match: RegExpExecArray | null;
        const regex = new RegExp(pattern.source, pattern.flags);
        while ((match = regex.exec(text)) !== null) {
          rawSuggestions.push({
            category: 'spelling',
            originalPhrase: match[0],
            replacementPhrase: repl,
            explanation: `Adapted to American English spelling (${repl}).`,
            detailedExplanation: 'American English standard orthography.',
            rule: 'American English Conventions',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
        }
      }
    }

    const verifiedSuggestions = validateAndFixOffsets(text, rawSuggestions);
    let correctedText = applyAllSuggestions(text, verifiedSuggestions);

    // If no grammatical errors found and a rewrite mode is requested, provide simulated mode rewrite
    if (verifiedSuggestions.length === 0 && mode !== 'grammar_fix' && text.trim().length > 0) {
      if (mode === 'professional') {
        correctedText = text.replace(/thanks/gi, 'thank you').replace(/let you know/gi, 'inform you');
      } else if (mode === 'shorten') {
        correctedText = text.replace(/in order to/gi, 'to').replace(/due to the fact that/gi, 'because');
      }
    }

    const grammarIssuesCount = verifiedSuggestions.filter((s) => s.category === 'grammar' || s.category === 'spelling').length;
    const clarityIssuesCount = verifiedSuggestions.filter((s) => s.category === 'clarity').length;
    const styleIssuesCount = verifiedSuggestions.filter((s) => s.category === 'style' || s.category === 'punctuation').length;

    const qualityInsights = analyzeWritingQuality(
      correctedText,
      grammarIssuesCount,
      clarityIssuesCount,
      styleIssuesCount
    );

    const summary =
      verifiedSuggestions.length > 0
        ? `Identified and corrected ${verifiedSuggestions.length} issue${verifiedSuggestions.length > 1 ? 's' : ''} for improved clarity and grammatical accuracy.`
        : 'Your text is grammatically clean and well-structured for this mode.';

    return {
      originalText: text,
      correctedText,
      mode,
      language,
      explanationLevel,
      suggestions: verifiedSuggestions,
      summary,
      qualityInsights,
      modelUsed: 'Demo Engine (Local Heuristic Fallback)',
    };
  }

  async rewriteSentence(sentence: string, tone: RewriteTone): Promise<SentenceRewriteResult> {
    const clean = sentence.trim();
    const alternativesMap: Record<RewriteTone, string[]> = {
      professional: [
        `Please be advised that ${clean.toLowerCase().replace(/^[a-z]/, (c) => c.toLowerCase())}`,
        `We would like to confirm that ${clean.toLowerCase()}`,
        `For your information, ${clean.toLowerCase()}`,
      ],
      polite: [
        `Could you kindly note that ${clean.toLowerCase()}`,
        `I would truly appreciate it if ${clean.toLowerCase()}`,
        `Would you mind considering that ${clean.toLowerCase()}`,
      ],
      confident: [
        `It is clear that ${clean.toLowerCase()}`,
        `We are confident that ${clean.toLowerCase()}`,
        `The results definitively show that ${clean.toLowerCase()}`,
      ],
      natural: [
        clean.replace(/\bdo not\b/gi, "don't").replace(/\bcannot\b/gi, "can't"),
        `Simply put, ${clean.toLowerCase()}`,
        `Basically, ${clean.toLowerCase()}`,
      ],
      shorter: [
        clean.replace(/\bin order to\b/gi, 'to').replace(/\bdue to the fact that\b/gi, 'since'),
        clean.split(',')[0] + '.',
        clean.replace(/\bvery\b|\breally\b/gi, '').trim(),
      ],
      clearer: [
        `To clarify, ${clean.toLowerCase()}`,
        `In plain terms, ${clean.toLowerCase()}`,
        `Specifically, ${clean.toLowerCase()}`,
      ],
      friendly: [
        `Hope you're having a great day! Just wanted to share that ${clean.toLowerCase()}`,
        `Warm greetings! ${clean}`,
        `Thanks so much for reaching out! ${clean}`,
      ],
      formal: [
        `It should be observed that ${clean.toLowerCase()}`,
        `Furthermore, ${clean.toLowerCase()}`,
        `In accordance with established standards, ${clean.toLowerCase()}`,
      ],
    };

    const alternatives = alternativesMap[tone] || [clean];

    return {
      originalSentence: sentence,
      tone,
      alternatives,
    };
  }

  async chatWritingAssistant(query: string, documentContext?: string): Promise<WritingChatResult> {
    const q = query.toLowerCase();

    if (q.includes('why') || q.includes('incorrect') || q.includes('mistake')) {
      return {
        reply: `In English, sentences must maintain consistent subject-verb agreement and proper auxiliary verb pairings. 

For instance:
- **Third-Person Singular**: Pronouns like *he*, *she*, or *it* require singular verbs (e.g., *"She doesn't"* instead of *"She don't"*).
- **Past Tense**: When referring to past time markers like *"yesterday"*, use simple past tense (*"I sent"*) rather than present perfect (*"I have sent"*).
- **Prepositional Complement**: Verbs such as *reply*, *listen*, and *belong* require the preposition *to* before direct recipient pronouns (*"reply to me"*).`,
      };
    }

    if (q.includes('email') || q.includes('manager') || q.includes('professional')) {
      return {
        reply: `Here is a polished, professional way to frame your message for a manager or colleague:

> *"Dear [Name],*  
> *I hope you are having a productive week. I am writing to share the updated report for your review. Please let me know if you would like any adjustments.*  
> *Best regards,*  
> *[Your Name]"*

**Key Tips for Workplace Emails:**
1. State your purpose clearly in the first sentence.
2. Use polite modal verbs (*"Could you please review"*, *"I would appreciate"*).
3. Include a clear call-to-action or next step.`,
      };
    }

    return {
      reply: `I am your AI Writing Assistant. I can help you:
- **Explain grammar rules** (e.g., subject-verb agreement, active vs. passive voice)
- **Adapt your writing tone** (make sentences professional, casual, or concise)
- **Draft or polish emails** for clients or team members
- **Improve vocabulary and sentence variety**

${documentContext ? `You currently have **${documentContext.trim().split(/\s+/).length} words** in your editor. Feel free to ask specific questions about any sentence!` : 'Feel free to paste any phrase or sentence you want feedback on!'}`
    };
  }
}
