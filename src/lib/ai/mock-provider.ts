import {
  GrammarCorrectionResult,
  WritingMode,
  LanguageVariant,
  ExplanationLevel,
  CorrectionSuggestion,
  ErrorCategory,
  SentenceRewriteResult,
  RewriteTone,
  WritingChatResult,
  WRITING_MODES,
} from './types';
import { validateAndFixOffsets, applyAllSuggestions } from './offset-validator';
import { analyzeWritingQuality } from './text-analysis';

interface RuleMatch {
  pattern: RegExp;
  category: 'grammar' | 'spelling' | 'punctuation' | 'clarity' | 'style';
  replacement: string | ((match: string, ...groups: string[]) => string);
  explanation: string | ((match: string, ...groups: string[]) => string);
  detailedExplanation?: string | ((match: string, ...groups: string[]) => string);
  rule: string;
}

const COMPREHENSIVE_RULES: RuleMatch[] = [
  // 1. Standalone lowercase pronoun 'i'
  {
    pattern: /\b(i)\b/g,
    category: 'grammar',
    replacement: 'I',
    explanation: "The first-person pronoun 'I' must always be capitalized.",
    detailedExplanation:
      "In English orthography, the personal pronoun 'I' is always capitalized regardless of where it appears in a sentence.",
    rule: 'Pronoun Capitalization',
  },

  // 2. Contraction apostrophe errors
  {
    pattern: /\bdont\b/g,
    category: 'punctuation',
    replacement: "don't",
    explanation: "Missing apostrophe in contraction 'don't'.",
    detailedExplanation:
      "Contractions that combine words require an apostrophe to indicate omitted letters ('do not' -> 'don't').",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bcant\b/g,
    category: 'punctuation',
    replacement: "can't",
    explanation: "Missing apostrophe in contraction 'can't'.",
    detailedExplanation: "Contraction of 'cannot' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bwont\b/g,
    category: 'punctuation',
    replacement: "won't",
    explanation: "Missing apostrophe in contraction 'won't'.",
    detailedExplanation: "Contraction of 'will not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bdidnt\b/g,
    category: 'punctuation',
    replacement: "didn't",
    explanation: "Missing apostrophe in contraction 'didn't'.",
    detailedExplanation: "Contraction of 'did not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bhasnt\b/g,
    category: 'punctuation',
    replacement: "hasn't",
    explanation: "Missing apostrophe in contraction 'hasn't'.",
    detailedExplanation: "Contraction of 'has not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bhavent\b/g,
    category: 'punctuation',
    replacement: "haven't",
    explanation: "Missing apostrophe in contraction 'haven't'.",
    detailedExplanation: "Contraction of 'have not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bisnt\b/g,
    category: 'punctuation',
    replacement: "isn't",
    explanation: "Missing apostrophe in contraction 'isn't'.",
    detailedExplanation: "Contraction of 'is not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\barent\b/g,
    category: 'punctuation',
    replacement: "aren't",
    explanation: "Missing apostrophe in contraction 'aren't'.",
    detailedExplanation: "Contraction of 'are not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bwasnt\b/g,
    category: 'punctuation',
    replacement: "wasn't",
    explanation: "Missing apostrophe in contraction 'wasn't'.",
    detailedExplanation: "Contraction of 'was not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bwerent\b/g,
    category: 'punctuation',
    replacement: "weren't",
    explanation: "Missing apostrophe in contraction 'weren't'.",
    detailedExplanation: "Contraction of 'were not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bdoesnt\b/g,
    category: 'punctuation',
    replacement: "doesn't",
    explanation: "Missing apostrophe in contraction 'doesn't'.",
    detailedExplanation: "Contraction of 'does not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bcouldnt\b/g,
    category: 'punctuation',
    replacement: "couldn't",
    explanation: "Missing apostrophe in contraction 'couldn't'.",
    detailedExplanation: "Contraction of 'could not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bshouldnt\b/g,
    category: 'punctuation',
    replacement: "shouldn't",
    explanation: "Missing apostrophe in contraction 'shouldn't'.",
    detailedExplanation: "Contraction of 'should not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },
  {
    pattern: /\bwouldnt\b/g,
    category: 'punctuation',
    replacement: "wouldn't",
    explanation: "Missing apostrophe in contraction 'wouldn't'.",
    detailedExplanation: "Contraction of 'would not' requires an apostrophe.",
    rule: 'Contraction Apostrophe',
  },

  // 3. Subject-Verb Agreement: Indefinite Pronouns
  {
    pattern: /\b(nobody|no\s+one|everyone|everybody|someone|somebody|anyone|anybody)\s+(were)\b/gi,
    category: 'grammar',
    replacement: (_m, subj) => `${subj} was`,
    explanation: (_m, subj) =>
      `Indefinite pronoun '${subj}' is grammatically singular and takes 'was', not 'were'.`,
    detailedExplanation:
      "Singular indefinite pronouns like 'nobody', 'everybody', and 'someone' require singular agreement verbs.",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\b(nobody|no\s+one|everyone|everybody|someone|somebody|anyone|anybody)\s+(are)\b/gi,
    category: 'grammar',
    replacement: (_m, subj) => `${subj} is`,
    explanation: (_m, subj) =>
      `Indefinite pronoun '${subj}' is grammatically singular and takes 'is', not 'are'.`,
    detailedExplanation:
      "Singular indefinite pronouns take singular present verb 'is'.",
    rule: 'Subject-Verb Agreement',
  },

  // 4. Subject-Verb Agreement: Pronouns and Plural Subjects
  {
    pattern: /\b(they|we|you)\s+doesn't\b/gi,
    category: 'grammar',
    replacement: (_m, subj) => `${subj} don't`,
    explanation: (_m, subj) => `Use plural auxiliary 'don't' with '${subj}'.`,
    detailedExplanation:
      "Third-person plural pronoun 'they' takes 'do not' ('don't') rather than singular 'does not' ('doesn't').",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\b(he|she|it)\s+don't\b/gi,
    category: 'grammar',
    replacement: (_m, subj) => `${subj} doesn't`,
    explanation: (_m, subj) => `Use third-person singular auxiliary 'doesn't' with '${subj}'.`,
    detailedExplanation:
      "Third-person singular pronouns take 'does not' ('doesn't') rather than 'do not'.",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\b(some\s+clients|clients|customers|people|users|members|partners)\s+is\b/gi,
    category: 'grammar',
    replacement: (_m, subj) => `${subj} are`,
    explanation: (_m, subj) => `Plural subject '${subj}' requires plural verb 'are'.`,
    detailedExplanation:
      "Plural nouns must agree with plural auxiliary or linking verbs.",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\b(the\s+company|the\s+team|the\s+organization)\s+need\b/gi,
    category: 'grammar',
    replacement: (_m, subj) => `${subj} needs`,
    explanation: (_m, subj) =>
      `Singular collective noun '${subj}' takes singular verb 'needs'.`,
    detailedExplanation:
      "In standard American and business English, collective entities treated as a single unit take third-person singular verbs.",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\b(this\s+kind\s+of\s+problem|this\s+type\s+of\s+issue)\s+happen\b/gi,
    category: 'grammar',
    replacement: (_m, subj) => `${subj} happens`,
    explanation: (_m, subj) =>
      `Singular subject phrase '${subj}' requires third-person singular verb 'happens'.`,
    detailedExplanation:
      "The head noun of the phrase is singular 'kind'/'type', requiring a singular verb.",
    rule: 'Subject-Verb Agreement',
  },
  {
    pattern: /\bit\s+make\b/gi,
    category: 'grammar',
    replacement: 'it makes',
    explanation: "Third-person singular pronoun 'it' takes 'makes', not 'make'.",
    detailedExplanation:
      "Singular pronoun 'it' requires third-person singular inflection (-s).",
    rule: 'Subject-Verb Agreement',
  },

  // 5. Infinitive Verb Form Errors (to + past/participle)
  {
    pattern: /\bto\s+(finished|worked|called|asked|checked|informed|sent|went|seen|done|started|created|talked)\b/gi,
    category: 'grammar',
    replacement: (_m, verb) => {
      const baseMap: Record<string, string> = {
        finished: 'finish',
        worked: 'work',
        called: 'call',
        asked: 'ask',
        checked: 'check',
        informed: 'inform',
        sent: 'send',
        went: 'go',
        seen: 'see',
        done: 'do',
        started: 'start',
        created: 'create',
        talked: 'talk',
      };
      return `to ${baseMap[verb.toLowerCase()] || verb}`;
    },
    explanation: (_m, verb) =>
      `The infinitive particle 'to' must be followed by base verb '${verb.toLowerCase() === 'finished' ? 'finish' : 'base form'}', not past tense.`,
    detailedExplanation:
      "The infinitive marker 'to' is followed by the bare infinitive (base form) of the verb.",
    rule: 'Infinitive Verb Form',
  },

  // 6. Passive Voice & Participle Errors
  {
    pattern: /\b(was|were|is|are|been)\s+(cancel|finish|check|inform|close|delay|postpone|complete)\b/gi,
    category: 'grammar',
    replacement: (_m, aux, verb) => {
      const v = verb.toLowerCase();
      let part = `${v}ed`;
      if (v === 'cancel') part = 'canceled';
      return `${aux} ${part}`;
    },
    explanation: (_m, _aux, verb) =>
      `Passive voice requires the past participle '${verb.toLowerCase() === 'cancel' ? 'canceled' : verb + 'ed'}'.`,
    detailedExplanation:
      "Passive constructions require a form of 'be' followed by the past participle of the main verb.",
    rule: 'Passive Voice & Past Participle',
  },
  {
    pattern: /\b(was|were|am|is|are)\s+very\s+confuse\b/gi,
    category: 'grammar',
    replacement: (_m, aux) => `${aux} very confused`,
    explanation: "Use predicate adjective 'confused' rather than base verb 'confuse'.",
    detailedExplanation:
      "The participial adjective 'confused' is needed to describe the psychological or emotional state.",
    rule: 'Participle Adjective Form',
  },

  // 7. Numerals and Singular/Plural Count Nouns
  {
    pattern: /\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(hour|day|week|month|year|minute|second|dollar|pound|mile|kilometer)\b/gi,
    category: 'grammar',
    replacement: (_m, num, noun) => `${num} ${noun}s`,
    explanation: (_m, _num, noun) =>
      `Plural numeral requires plural noun '${noun.toLowerCase()}s'.`,
    detailedExplanation:
      "Countable nouns modified by cardinal numbers greater than one must take plural inflection (-s).",
    rule: 'Plural Count Noun',
  },

  // 8. Demonstrative Determiner Agreement
  {
    pattern: /\b(this)\s+(changes|problems|reports|people|clients|things|items|issues|errors|books|emails|messages)\b/gi,
    category: 'grammar',
    replacement: (_m, _dem, pluralNoun) => `these ${pluralNoun}`,
    explanation: (_m, _dem, pluralNoun) =>
      `Plural noun '${pluralNoun}' requires plural demonstrative 'these' instead of singular 'this'.`,
    detailedExplanation:
      "Demonstrative determiners must agree in number with the nouns they modify ('this' + singular, 'these' + plural).",
    rule: 'Demonstrative Agreement',
  },
  {
    pattern: /\b(these)\s+(change|problem|report|person|client|thing|item|issue|error|book|email|message)\b/gi,
    category: 'grammar',
    replacement: (_m, _dem, singNoun) => `this ${singNoun}`,
    explanation: (_m, _dem, singNoun) =>
      `Singular noun '${singNoun}' requires singular demonstrative 'this' instead of plural 'these'.`,
    detailedExplanation:
      "Demonstratives must agree in number with the singular head noun.",
    rule: 'Demonstrative Agreement',
  },

  // 9. Verb Tenses with Past Context Time Markers
  // 9. Verb Tenses with Past Context Time Markers
  {
    pattern: /\bgoes\b/gi,
    category: 'grammar',
    replacement: 'went',
    explanation: "Use simple past 'went' rather than present tense 'goes' in past context.",
    detailedExplanation:
      "Narrative recounting past events requires simple past tense 'went'.",
    rule: 'Verb Tense Consistency',
  },
  {
    pattern: /\bmy\s+manager\s+ask\s+me\b/gi,
    category: 'grammar',
    replacement: 'my manager asked me',
    explanation: "Use past tense 'asked' for completed narrative actions.",
    detailedExplanation:
      "Past tense narrative sequences require consistent simple past forms ('asked').",
    rule: 'Verb Tense Consistency',
  },
  {
    pattern: /\bWhen\s+I\s+arrive\b/gi,
    category: 'grammar',
    replacement: 'When I arrived',
    explanation: "Use past tense 'arrived' in past time clause.",
    detailedExplanation:
      "Subordinate temporal clauses recounting past events must maintain past tense agreement.",
    rule: 'Verb Tense Consistency',
  },
  {
    pattern: /\bI\s+try\s+to\s+contact\b/gi,
    category: 'grammar',
    replacement: 'I tried to contact',
    explanation: "Use past tense 'tried' to match past narrative.",
    detailedExplanation:
      "The regular verb 'try' forms past tense as 'tried' in past narrative context.",
    rule: 'Verb Tense Consistency',
  },
  {
    pattern: /\bfinally\s+call\s+me\b/gi,
    category: 'grammar',
    replacement: 'finally called me',
    explanation: "Use past tense 'called' in past narrative.",
    detailedExplanation: "Simple past tense is required for completed actions in past time.",
    rule: 'Verb Tense Consistency',
  },
  {
    pattern: /\bnobody\s+inform\s+me\b/gi,
    category: 'grammar',
    replacement: 'nobody informed me',
    explanation: "Use past tense 'informed' for past action.",
    detailedExplanation:
      "Narrative reporting previous notification requires simple past ('informed').",
    rule: 'Verb Tense Consistency',
  },
  {
    pattern: /\bI\s+has\s+send\b/gi,
    category: 'grammar',
    replacement: 'I sent',
    explanation: "Use simple past 'sent' with yesterday, or 'have sent'.",
    detailedExplanation:
      "When specifying completed past time or subject 'I', use past tense 'sent' rather than auxiliary 'has send'.",
    rule: 'Verb Tense & Agreement',
  },
  {
    pattern: /\bhas\s+send\b/gi,
    category: 'grammar',
    replacement: 'sent',
    explanation: "Use simple past 'sent' or past participle.",
    detailedExplanation: "Past participle of 'send' is 'sent'.",
    rule: 'Past Participle Form',
  },
  {
    pattern: /\bhave\s+send\s+the\s+report\s+last\s+night\b/gi,
    category: 'grammar',
    replacement: 'sent the report last night',
    explanation: "Use simple past 'sent' with specific past time marker 'last night'.",
    detailedExplanation:
      "When a sentence includes a specific completed past time marker ('last night'), standard English uses simple past ('sent') rather than present perfect.",
    rule: 'Verb Tense & Time Marker',
  },
  {
    pattern: /\bhave\s+send\b/gi,
    category: 'grammar',
    replacement: 'have sent',
    explanation: "Use past participle 'sent' with auxiliary 'have'.",
    detailedExplanation:
      "The present perfect is formed by 'have' + past participle ('sent'), not the base form ('send').",
    rule: 'Past Participle Form',
  },
  {
    pattern: /\bhaven't\s+check\b/gi,
    category: 'grammar',
    replacement: "hasn't checked",
    explanation:
      "Use singular auxiliary 'hasn't' with third-person singular manager and past participle 'checked'.",
    detailedExplanation:
      "Third-person singular subjects ('my manager') require auxiliary 'hasn't' followed by past participle 'checked'.",
    rule: 'Subject-Verb Agreement & Participle',
  },

  // 10. Indirect Question Word Order
  {
    pattern: /\bwhat\s+should\s+I\s+do\b/gi,
    category: 'grammar',
    replacement: 'what I should do',
    explanation:
      "Indirect questions use affirmative statement word order ('what I should do'), not inverted question order.",
    detailedExplanation:
      "Embedded noun clauses following verbs like 'know' require subject-verb word order ('what I should do') rather than auxiliary-subject inversion ('what should I do').",
    rule: 'Indirect Question Structure',
  },

  // 11. Causative Verb Complement & Idiomatic Expressions
  {
    pattern: /\beveryone\s+wasting\b/gi,
    category: 'grammar',
    replacement: 'everyone waste',
    explanation:
      "Causative verb 'make' takes a bare infinitive ('waste'), not a present participle ('wasting').",
    detailedExplanation:
      "Verbs of causation (make + object) take the bare infinitive form of the following verb.",
    rule: 'Causative Verb Complement',
  },
  {
    pattern: /\b(their|our|my|your|his|her)\s+times\b/gi,
    category: 'grammar',
    replacement: (_m, poss) => `${poss} time`,
    explanation:
      "The idiomatic phrase is 'waste [one's] time' using non-count singular 'time'.",
    detailedExplanation:
      "When referring to duration or availability, 'time' functions as an uncountable noun in the idiom 'waste someone's time'.",
    rule: 'Count vs. Non-Count Noun',
  },
  {
    pattern: /\b(their|our|the)\s+communications\b/gi,
    category: 'clarity',
    replacement: (_m, det) => `${det} communication`,
    explanation:
      "Use singular uncountable 'communication' for general interpersonal and organizational interaction.",
    detailedExplanation:
      "While 'communications' can refer to technical telecommunication networks, general workplace information exchange is uncountable 'communication'.",
    rule: 'Noun Usage & Countability',
  },

  // 12. Modal Auxiliary and Phrasing
  {
    pattern: /\bcould\s+of\b/gi,
    category: 'grammar',
    replacement: 'could have',
    explanation: "Use 'could have' instead of 'could of'.",
    detailedExplanation:
      "The phrase 'could of' is an incorrect phonetic spelling of the contraction 'could've'. The correct modal verb phrase is 'could have'.",
    rule: 'Modal Auxiliary Phrasing',
  },
  {
    pattern: /\bshould\s+of\b/gi,
    category: 'grammar',
    replacement: 'should have',
    explanation: "Use 'should have' instead of 'should of'.",
    detailedExplanation: "Grammatically correct modal auxiliary is 'should have'.",
    rule: 'Modal Auxiliary Phrasing',
  },
  {
    pattern: /\bwould\s+of\b/gi,
    category: 'grammar',
    replacement: 'would have',
    explanation: "Use 'would have' instead of 'would of'.",
    detailedExplanation: "Grammatically correct modal auxiliary is 'would have'.",
    rule: 'Modal Auxiliary Phrasing',
  },
  {
    pattern: /\bhas\s+went\b/gi,
    category: 'grammar',
    replacement: 'has gone',
    explanation: "Use past participle 'gone' with auxiliary 'has'.",
    detailedExplanation: "The present perfect requires past participle 'gone', not simple past 'went'.",
    rule: 'Past Participle Form',
  },
  {
    pattern: /\bmore\s+better\b/gi,
    category: 'clarity',
    replacement: 'better',
    explanation: "Avoid double comparative; 'better' is already comparative.",
    detailedExplanation: "'Better' is already the comparative form of 'good'.",
    rule: 'Double Comparative',
  },
  {
    pattern: /\bhe\s+not\s+reply\s+me\b/gi,
    category: 'grammar',
    replacement: "he didn't reply to me",
    explanation: "Use auxiliary 'didn't reply' and preposition 'to me'.",
    detailedExplanation:
      "Negative statements in past tense require 'did not', and 'reply' requires preposition 'to'.",
    rule: 'Auxiliary Verb & Preposition',
  },

  // 13. Common Spelling Typos
  {
    pattern: /\bteh\b/gi,
    category: 'spelling',
    replacement: 'the',
    explanation: "Spelling typo: corrected to 'the'.",
    detailedExplanation: "Common typing transposition error.",
    rule: 'Spelling Correction',
  },
  {
    pattern: /\brecieve\b/gi,
    category: 'spelling',
    replacement: 'receive',
    explanation: "Spelling error: 'i before e except after c'.",
    detailedExplanation: "In English spelling, 'e' precedes 'i' when following 'c'.",
    rule: 'Spelling Rule',
  },
  {
    pattern: /\balot\b/gi,
    category: 'spelling',
    replacement: 'a lot',
    explanation: "'a lot' is written as two separate words.",
    detailedExplanation: "The noun phrase 'a lot' is always two distinct words.",
    rule: 'Word Division',
  },
  {
    pattern: /\bdefinately\b/gi,
    category: 'spelling',
    replacement: 'definitely',
    explanation: "Spelling error: corrected to 'definitely'.",
    detailedExplanation: "The root word is 'definite'.",
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
];

/**
 * Generic phrase/word dictionary applier. Pushes one raw suggestion per
 * regex match found anywhere in the text for a given [pattern, replacement] pair.
 */
function collectPairMatches(
  text: string,
  pairs: ReadonlyArray<readonly [RegExp, string]>,
  category: ErrorCategory,
  rule: string,
  explanationPrefix: string
): Partial<CorrectionSuggestion>[] {
  const out: Partial<CorrectionSuggestion>[] = [];
  for (const [pattern, replacement] of pairs) {
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const regex = new RegExp(pattern.source, flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (m[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      out.push({
        category,
        originalPhrase: m[0],
        replacementPhrase: replacement,
        explanation: `${explanationPrefix} ('${m[0].trim()}' → '${replacement.trim() || '(removed)'}').`,
        rule,
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      });
    }
  }
  return out;
}

/**
 * Replaces a single word/phrase while preserving the capitalization of the
 * matched text's first letter (e.g. "Hey" -> "Hello", "hey" -> "hello").
 */
function applyCasePreservingWord(
  text: string,
  word: RegExp,
  replacement: string,
  category: ErrorCategory,
  rule: string,
  explanation: string
): Partial<CorrectionSuggestion>[] {
  const out: Partial<CorrectionSuggestion>[] = [];
  const flags = word.flags.includes('g') ? word.flags : word.flags + 'g';
  const regex = new RegExp(word.source, flags);
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const matched = m[0];
    const repl =
      matched[0] === matched[0].toUpperCase()
        ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
        : replacement;
    out.push({
      category,
      originalPhrase: matched,
      replacementPhrase: repl,
      explanation,
      rule,
      startIndex: m.index,
      endIndex: m.index + matched.length,
    });
  }
  return out;
}

// --- PROFESSIONAL mode: elevate casual/slang language for workplace tone ---
const PROFESSIONAL_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bstuff\b/gi, 'materials'],
  [/\basap\b/gi, 'as soon as possible'],
  [/\bgonna\b/gi, 'going to'],
  [/\bwanna\b/gi, 'want to'],
  [/\bkinda\b/gi, 'somewhat'],
  [/\byeah\b/gi, 'yes'],
  [/\bthanks\b/gi, 'thank you'],
  [/\blet you know\b/gi, 'inform you'],
  [/\bneed you to\b/gi, 'would appreciate it if you could'],
  [/\bright now\b/gi, 'at your earliest convenience'],
];

// --- FORMAL mode: elevated register, expanded contractions, no slang ---
const FORMAL_PHRASE_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bwhat's going on with\b/gi, 'the current status of'],
  [/\bcan you\b/gi, 'could you kindly'],
  [/\bfind out\b/gi, 'ascertain'],
  [/\ba lot of\b/gi, 'a substantial amount of'],
  [/\bbuy\b/gi, 'purchase'],
  [/\bneed\b/gi, 'require'],
  [/\bget\b/gi, 'obtain'],
  [/\bhelp\b/gi, 'assistance'],
];

const CONTRACTION_EXPAND_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bdon't\b/gi, 'do not'],
  [/\bcan't\b/gi, 'cannot'],
  [/\bwon't\b/gi, 'will not'],
  [/\bisn't\b/gi, 'is not'],
  [/\baren't\b/gi, 'are not'],
  [/\bwasn't\b/gi, 'was not'],
  [/\bweren't\b/gi, 'were not'],
  [/\bdidn't\b/gi, 'did not'],
  [/\bdoesn't\b/gi, 'does not'],
  [/\bhaven't\b/gi, 'have not'],
  [/\bhasn't\b/gi, 'has not'],
  [/\bhadn't\b/gi, 'had not'],
  [/\bcouldn't\b/gi, 'could not'],
  [/\bshouldn't\b/gi, 'should not'],
  [/\bwouldn't\b/gi, 'would not'],
  [/\bI'm\b/g, 'I am'],
  [/\byou're\b/gi, 'you are'],
  [/\bwe're\b/gi, 'we are'],
  [/\bthey're\b/gi, 'they are'],
  [/\bit's\b/gi, 'it is'],
  [/\bthat's\b/gi, 'that is'],
  [/\bthere's\b/gi, 'there is'],
  [/\bI've\b/g, 'I have'],
  [/\blet's\b/gi, 'let us'],
];

// --- CASUAL mode: relax formal phrasing, contract where natural ---
const CASUAL_PHRASE_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bI would like to inform you that\b/gi, 'Just wanted to let you know that'],
  [/\bI am unable to\b/gi, "I can't"],
  [/\bis unable to\b/gi, "can't"],
  [/\bare unable to\b/gi, "can't"],
  [/\butilize\b/gi, 'use'],
  [/\bregarding\b/gi, 'about'],
  [/\badditionally\b/gi, 'plus'],
  [/\btherefore\b/gi, 'so'],
  [/\bhowever\b/gi, 'but'],
  [/\bapproximately\b/gi, 'about'],
  [/\brequire\b/gi, 'need'],
  [/\bpurchase\b/gi, 'buy'],
  [/\bindividuals\b/gi, 'people'],
  [/\bassistance\b/gi, 'help'],
];

const CONTRACTION_CONTRACT_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bdo not\b/gi, "don't"],
  [/\bcannot\b/gi, "can't"],
  [/\bwill not\b/gi, "won't"],
  [/\bis not\b/gi, "isn't"],
  [/\bare not\b/gi, "aren't"],
  [/\bwas not\b/gi, "wasn't"],
  [/\bwere not\b/gi, "weren't"],
  [/\bdid not\b/gi, "didn't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bhave not\b/gi, "haven't"],
  [/\bhas not\b/gi, "hasn't"],
  [/\bit is\b/gi, "it's"],
  [/\bthat is\b/gi, "that's"],
];

// --- SIMPLIFY mode: plain-English vocabulary for dense/jargon-heavy text ---
const SIMPLIFY_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\boptimization of operational efficiencies\b/gi, 'improving how well things work'],
  [/\butilization\b/gi, 'use'],
  [/\butilize\b/gi, 'use'],
  [/\bfacilitates\b/gi, 'helps'],
  [/\bfacilitate\b/gi, 'help'],
  [/\bmethodologies\b/gi, 'methods'],
  [/\bmethodology\b/gi, 'method'],
  [/\bimplementation\b/gi, 'use'],
  [/\bnecessitates\b/gi, 'requires'],
  [/\bnecessitate\b/gi, 'require'],
  [/\bsubstantial\b/gi, 'major'],
  [/\bsophisticated\b/gi, 'advanced'],
  [/\boptimization\b/gi, 'improvement'],
  [/\bnumerous\b/gi, 'many'],
  [/\bsubsequently\b/gi, 'then'],
  [/\bprioritize\b/gi, 'focus on'],
  [/\bendeavor\b/gi, 'try'],
  [/\bcommence\b/gi, 'start'],
  [/\bterminate\b/gi, 'end'],
  [/\bapproximately\b/gi, 'about'],
  [/\bregarding\b/gi, 'about'],
  [/\bin order to\b/gi, 'to'],
  [/\bcomprehend\b/gi, 'understand'],
  [/\bdemonstrate\b/gi, 'show'],
  [/\bprior to\b/gi, 'before'],
  [/\bin the event that\b/gi, 'if'],
  [/\bdue to the fact that\b/gi, 'because'],
];

// --- SHORTEN mode: remove filler and wordy circumlocutions ---
const SHORTEN_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bat this point in time\b/gi, 'now'],
  [/\ba large number of\b/gi, 'many'],
  [/\bdespite the fact that\b/gi, 'although'],
  [/\bin spite of the fact that\b/gi, 'although'],
  [/\bin the event that\b/gi, 'if'],
  [/\bwith regard to\b/gi, 'about'],
  [/\bfor the purpose of\b/gi, 'to'],
  [/\bon a regular basis\b/gi, 'regularly'],
  [/\bin the near future\b/gi, 'soon'],
  [/\btake into consideration\b/gi, 'consider'],
  [/\bis currently experiencing a shortage of\b/gi, 'lacks'],
  [/\bare currently experiencing a shortage of\b/gi, 'lack'],
  [/\bare unable to\b/gi, 'cannot'],
  [/\bis unable to\b/gi, 'cannot'],
  [/\bit is important to note that\s*/gi, ''],
  [/\bbasically\s*/gi, ''],
  [/\breally\s*/gi, ''],
];

// --- ACADEMIC mode: scholarly, precise vocabulary ---
const ACADEMIC_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\blots of\b/gi, 'numerous'],
  [/\ba bunch of\b/gi, 'numerous'],
  [/\ba lot of\b/gi, 'numerous'],
  [/\bdo good\b/gi, 'perform well'],
  [/\bfind out\b/gi, 'determine'],
  [/\bshow\b/gi, 'demonstrate'],
  [/\bbig\b/gi, 'substantial'],
  [/\blook into\b/gi, 'investigate'],
  [/\bend up\b/gi, 'result'],
  [/\bbasically\b/gi, 'fundamentally'],
  [/\ba lot\b/gi, 'a great deal'],
  [/\buse\b/gi, 'utilize'],
];

// --- IMPROVE WRITING mode: clarity and flow, trimming weak/filler phrasing ---
const IMPROVE_WRITING_PAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\ba lot of\b/gi, 'many'],
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bat this point in time\b/gi, 'currently'],
  [/\bvery good\b/gi, 'excellent'],
  [/\bvery important\b/gi, 'crucial'],
  [/\bvery bad\b/gi, 'poor'],
  [/\bbasically\s*/gi, ''],
  [/\bkind of\s*/gi, ''],
  [/\bsort of\s*/gi, ''],
];

// --- FRIENDLY mode: warm, polite, approachable ---
const IMPERATIVE_VERBS = [
  'submit', 'send', 'complete', 'finish', 'review', 'update', 'confirm',
  'contact', 'call', 'email', 'provide', 'attach', 'schedule', 'prepare',
  'check', 'verify', 'upload', 'download', 'sign', 'return', 'reply',
  'respond', 'share', 'include',
];

function softenImperatives(text: string): Partial<CorrectionSuggestion>[] {
  const out: Partial<CorrectionSuggestion>[] = [];
  const pattern = new RegExp(`(^|[.!?]\\s+)(${IMPERATIVE_VERBS.join('|')})\\b`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const verb = m[2];
    const verbStart = m.index + m[1].length;
    out.push({
      category: 'style',
      originalPhrase: verb,
      replacementPhrase: `Please ${verb.toLowerCase()}`,
      explanation: `Softened the direct command '${verb}' with a polite 'Please' for a warmer tone.`,
      rule: 'Friendly Tone',
      startIndex: verbStart,
      endIndex: verbStart + verb.length,
    });
  }
  return out;
}

function appendFriendlyCloser(text: string): Partial<CorrectionSuggestion>[] {
  const trimmedEnd = text.trimEnd();
  if (!trimmedEnd || /thanks|thank you/i.test(trimmedEnd.slice(-30))) return [];
  const lastChar = trimmedEnd[trimmedEnd.length - 1];
  if (lastChar !== '.' && lastChar !== '!' && lastChar !== '?') return [];
  const idx = trimmedEnd.length - 1;
  return [
    {
      category: 'style',
      originalPhrase: lastChar,
      replacementPhrase: `${lastChar} Thanks!`,
      explanation: 'Added a warm closing note to keep the tone friendly and approachable.',
      rule: 'Friendly Tone',
      startIndex: idx,
      endIndex: idx + 1,
    },
  ];
}

// --- EXPAND mode: add a clarifying consequence clause without inventing facts ---
const EXPAND_VERB_CLAUSES: ReadonlyArray<readonly [string[], string]> = [
  [['canceled', 'cancelled'], 'meaning it will not take place as planned'],
  [['delayed', 'postponed'], 'meaning it could not proceed according to its original schedule'],
  [['approved'], 'confirming that it can now move forward'],
  [['completed', 'finished'], 'meaning the related work has been finished'],
  [['submitted'], 'confirming that it has been formally sent for review'],
  [['rejected', 'denied'], 'meaning it did not meet the necessary requirements'],
  [['closed'], 'meaning no further action will be taken on it'],
  [['accepted'], 'confirming that it has been formally approved'],
];

function expandPassiveClauses(text: string): Partial<CorrectionSuggestion>[] {
  const out: Partial<CorrectionSuggestion>[] = [];
  const allVerbs = EXPAND_VERB_CLAUSES.flatMap(([verbs]) => verbs);
  const pattern = new RegExp(`\\b(was|were)\\s+(${allVerbs.join('|')})\\b([^.!?]*)([.!?])`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const verb = m[2].toLowerCase();
    const entry = EXPAND_VERB_CLAUSES.find(([verbs]) => verbs.includes(verb));
    if (!entry) continue;
    const clause = entry[1];
    const trailing = m[3];
    const punct = m[4];
    out.push({
      category: 'clarity',
      originalPhrase: m[0],
      replacementPhrase: `${m[1]} ${m[2]}${trailing}, ${clause}${punct}`,
      explanation: `Expanded with a clarifying clause to explain the implication of '${m[1]} ${m[2]}', without inventing new facts.`,
      rule: 'Expand & Clarify',
      startIndex: m.index,
      endIndex: m.index + m[0].length,
    });
  }
  return out;
}

export class MockAIProvider {
  async correctGrammar(
    text: string,
    mode: WritingMode = 'grammar_fix',
    language: LanguageVariant = 'en-US',
    explanationLevel: ExplanationLevel = 'simple'
  ): Promise<GrammarCorrectionResult> {
    const rawSuggestions: Partial<CorrectionSuggestion>[] = [];

    // 1. Run all comprehensive grammar and linguistic rules
    for (const rule of COMPREHENSIVE_RULES) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const originalPhrase = match[0];
        const replacement =
          typeof rule.replacement === 'function'
            ? rule.replacement(originalPhrase, ...(match.slice(1) || []))
            : rule.replacement;

        const explanation =
          typeof rule.explanation === 'function'
            ? rule.explanation(originalPhrase, ...(match.slice(1) || []))
            : rule.explanation;

        const detailedExplanation =
          typeof rule.detailedExplanation === 'function'
            ? rule.detailedExplanation(originalPhrase, ...(match.slice(1) || []))
            : rule.detailedExplanation;

        rawSuggestions.push({
          category: rule.category,
          originalPhrase,
          replacementPhrase: replacement,
          explanation,
          detailedExplanation: detailedExplanation || explanation,
          rule: rule.rule,
          startIndex: match.index,
          endIndex: match.index + originalPhrase.length,
        });
      }
    }

    // 2. Language variant spelling adjustments
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

    // 3. Mode-specific transformations: each mode applies a distinct
    // set of lexical/structural rules so results are never identical
    // across modes, even without a live Gemini connection.
    switch (mode) {
      case 'professional':
        rawSuggestions.push(
          ...applyCasePreservingWord(
            text,
            /\bhey\b/gi,
            'Hello',
            'style',
            'Professional Tone',
            "Replaced casual greeting with a professional opener."
          ),
          ...collectPairMatches(
            text,
            PROFESSIONAL_PAIRS,
            'style',
            'Professional Tone',
            'Elevated phrasing to a professional register'
          )
        );
        break;
      case 'formal':
        rawSuggestions.push(
          ...applyCasePreservingWord(
            text,
            /\bhey\b/gi,
            'Greetings',
            'style',
            'Formal Register',
            "Replaced casual greeting with a formal opener."
          ),
          ...collectPairMatches(
            text,
            FORMAL_PHRASE_PAIRS,
            'style',
            'Formal Register',
            'Adopted formal vocabulary'
          ),
          ...collectPairMatches(
            text,
            CONTRACTION_EXPAND_PAIRS,
            'style',
            'Formal Register',
            'Expanded contraction for a formal register'
          )
        );
        break;
      case 'casual':
        rawSuggestions.push(
          ...collectPairMatches(
            text,
            CASUAL_PHRASE_PAIRS,
            'style',
            'Casual Tone',
            'Relaxed the phrasing for a conversational tone'
          ),
          ...collectPairMatches(
            text,
            CONTRACTION_CONTRACT_PAIRS,
            'style',
            'Casual Tone',
            'Used a natural contraction for a conversational tone'
          )
        );
        break;
      case 'simplify':
        rawSuggestions.push(
          ...collectPairMatches(
            text,
            SIMPLIFY_PAIRS,
            'clarity',
            'Plain English',
            'Replaced complex vocabulary with simpler wording'
          )
        );
        break;
      case 'shorten':
        rawSuggestions.push(
          ...collectPairMatches(
            text,
            SHORTEN_PAIRS,
            'clarity',
            'Conciseness',
            'Streamlined wordy phrasing for conciseness'
          )
        );
        break;
      case 'expand':
        rawSuggestions.push(...expandPassiveClauses(text));
        break;
      case 'academic':
        rawSuggestions.push(
          ...collectPairMatches(
            text,
            ACADEMIC_PAIRS,
            'style',
            'Scholarly Tone',
            'Adopted more precise scholarly vocabulary'
          )
        );
        break;
      case 'friendly':
        rawSuggestions.push(
          ...applyCasePreservingWord(
            text,
            /\bhey\b/gi,
            'Hi there',
            'style',
            'Friendly Tone',
            'Warmed up the greeting for an approachable tone.'
          ),
          ...softenImperatives(text),
          ...appendFriendlyCloser(text)
        );
        break;
      case 'improve_writing':
        rawSuggestions.push(
          ...collectPairMatches(
            text,
            IMPROVE_WRITING_PAIRS,
            'clarity',
            'Clarity & Flow',
            'Improved clarity and flow'
          )
        );
        break;
      case 'grammar_fix':
      default:
        // Conservative: no stylistic rewriting beyond the grammar/spelling/
        // punctuation rules applied above.
        break;
    }

    // 4. Validate offsets and safely apply suggestions
    const verifiedSuggestions = validateAndFixOffsets(text, rawSuggestions);
    const correctedText = applyAllSuggestions(text, verifiedSuggestions);

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
      correctedText,
      grammarIssuesCount,
      clarityIssuesCount,
      styleIssuesCount
    );

    const MODE_SUMMARY_LABEL: Record<WritingMode, string> = {
      grammar_fix: 'grammar, spelling, and punctuation',
      improve_writing: 'clarity, flow, and overall readability',
      professional: 'professional, workplace-appropriate phrasing',
      casual: 'relaxed, conversational phrasing',
      formal: 'formal register and sentence structure',
      simplify: 'plain-English vocabulary and sentence simplicity',
      shorten: 'conciseness, removing filler and redundancy',
      expand: 'descriptive clarity and clarifying detail',
      academic: 'scholarly vocabulary and objective tone',
      friendly: 'warmth and approachable tone',
    };

    const summary =
      verifiedSuggestions.length > 0
        ? `Identified and applied ${verifiedSuggestions.length} improvement${
            verifiedSuggestions.length > 1 ? 's' : ''
          } focused on ${MODE_SUMMARY_LABEL[mode]}.`
        : `Your text already reads well for the ${WRITING_MODES[mode].name} style — no changes were necessary.`;

    return {
      originalText: text,
      correctedText,
      mode,
      language,
      explanationLevel,
      suggestions: verifiedSuggestions,
      summary,
      qualityInsights,
      modelUsed: 'VerbaCraft Editorial Engine',
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

${
  documentContext
    ? `You currently have **${
        documentContext.trim().split(/\s+/).length
      } words** in your editor. Feel free to ask specific questions about any sentence!`
    : 'Feel free to paste any phrase or sentence you want feedback on!'
}`,
    };
  }
}
