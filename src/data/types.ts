export interface VocabItem {
  id: string;
  /** English word or phrase as it should be written. */
  en: string;
  /** Further accepted English spellings, e.g. "there's" for "there is". */
  enAlt?: string[];
  /** German meaning(s), shown to the learner. */
  de: string;
  /**
   * Context for the German prompt when the German word is ambiguous
   * (e.g. "sie" = she / they). Always shown when typing German → English.
   */
  deHint?: string;
  /** Own example sentence (not the book sentence). */
  example?: string;
}

export interface Unit {
  id: string;
  title: string;
  subtitle?: string;
  builtIn?: boolean;
  vocab: VocabItem[];
  /** Grammar modules the exam includes for this unit. */
  grammar: GrammarTopic[];
}

export type GrammarTopic = 'pronouns' | 'prepositions';

export type Topic = 'vocab' | 'pronouns' | 'prepositions';

export type Pronoun = 'I' | 'you' | 'he' | 'she' | 'it' | 'we' | 'they';

export interface PronounGap {
  id: string;
  /** Sentence with "___" for the gap. */
  text: string;
  answer: Pronoun;
}

export interface PronounReplace {
  id: string;
  /** The part to replace, e.g. "Tom and I". */
  phrase: string;
  /** Rest of the sentence after the phrase. */
  rest: string;
  answer: Pronoun;
}

export type Preposition = 'in' | 'on' | 'under' | 'next to' | 'behind' | 'in front of';
