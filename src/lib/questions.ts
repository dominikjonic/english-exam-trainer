import {
  animals,
  numberWords,
  objectNames,
  objectPreps,
  prepositionDe,
  prepositions,
  pronounGaps,
  pronounReplaces,
  pronouns,
  type SceneObject,
} from '../data/grammar';
import type { Preposition, Pronoun, PronounGap, PronounReplace, Topic, VocabItem } from '../data/types';
import { isSpellingSlip, matchesAny, normalize } from './answer';
import { pick, sample, shuffle, uid } from './random';

export type Direction = 'en-de' | 'de-en' | 'listen';

export interface Scene {
  object: SceneObject;
  prep: Preposition;
  animal: string;
  count: number;
}

interface Base {
  uid: string;
  topic: Topic;
  /** Learning item behind the task, e.g. "v:lion", "pron:she", "prep:under". */
  itemKey: string;
  /** Short German instruction shown above the task. */
  instruction: string;
  dir?: Direction;
  picture?: Scene;
}

export interface McQuestion extends Base {
  kind: 'mc';
  prompt: string;
  options: string[];
  answer: string;
  /** Text read aloud by the speaker button (listening tasks). */
  speak?: string;
}

export interface TypeQuestion extends Base {
  kind: 'type';
  prompt: string;
  /** Small context line under the prompt (e.g. for German "sie"). */
  context?: string;
  accepted: string[];
  speak?: string;
  /** Letters shown for "Buchstabensalat". */
  letters?: string[];
  /** Text shown after answering, e.g. the full sentence. */
  solution?: string;
}

export interface TfQuestion extends Base {
  kind: 'tf';
  statement: string;
  answer: boolean;
  /** Explanation shown after answering. */
  solution: string;
}

export interface MatchQuestion extends Base {
  kind: 'match';
  pairs: { key: string; left: string; right: string }[];
  rightOrder: string[];
}

export interface BuildQuestion extends Base {
  kind: 'build';
  german?: string;
  words: string[];
  answer: string;
}

export interface PickPictureQuestion extends Base {
  kind: 'pick';
  sentence: string;
  options: Scene[];
  answerIndex: number;
}

export type Question =
  | McQuestion
  | TypeQuestion
  | TfQuestion
  | MatchQuestion
  | BuildQuestion
  | PickPictureQuestion;

export type Response = string | boolean | number | string[] | Record<string, string> | null;

export interface Graded {
  correct: boolean;
  points: number;
  maxPoints: number;
  given: string;
  expected: string;
  /** Wrong answer that was only a spelling slip. */
  spelling: boolean;
  /** Item keys answered wrongly (for match tasks several). */
  wrongKeys: string[];
}

/** Human-readable task type, also used to avoid the same type twice in a row. */
export function kindLabel(q: Question): string {
  switch (q.kind) {
    case 'mc':
      return q.speak ? 'Hören' : 'Multiple Choice';
    case 'type':
      if (q.letters) return 'Buchstabensalat';
      if (q.speak) return 'Hördiktat';
      return 'Selbst schreiben';
    case 'tf':
      return 'Richtig oder falsch';
    case 'match':
      return 'Zuordnen';
    case 'build':
      return 'Satz bauen';
    case 'pick':
      return 'Bildaufgabe';
  }
}

export function maxPoints(q: Question): number {
  return q.kind === 'match' ? q.pairs.length : 1;
}

export function gradeQuestion(q: Question, r: Response): Graded {
  const base = { maxPoints: maxPoints(q), spelling: false };
  switch (q.kind) {
    case 'mc': {
      const given = typeof r === 'string' ? r : '';
      const correct = given === q.answer;
      return { ...base, correct, points: correct ? 1 : 0, given, expected: q.answer, wrongKeys: correct ? [] : [q.itemKey] };
    }
    case 'type': {
      const given = typeof r === 'string' ? r : '';
      const correct = matchesAny(given, q.accepted);
      return {
        ...base,
        correct,
        points: correct ? 1 : 0,
        given,
        expected: q.accepted[0],
        spelling: !correct && isSpellingSlip(given, q.accepted),
        wrongKeys: correct ? [] : [q.itemKey],
      };
    }
    case 'tf': {
      const correct = r === q.answer;
      const label = (b: unknown) => (b === true ? 'richtig' : b === false ? 'falsch' : '–');
      return { ...base, correct, points: correct ? 1 : 0, given: label(r), expected: label(q.answer), wrongKeys: correct ? [] : [q.itemKey] };
    }
    case 'match': {
      const map = (r && typeof r === 'object' && !Array.isArray(r) ? r : {}) as Record<string, string>;
      const wrong = q.pairs.filter((p) => map[p.key] !== p.right);
      return {
        ...base,
        correct: wrong.length === 0,
        points: q.pairs.length - wrong.length,
        given: q.pairs.map((p) => `${p.left} = ${map[p.key] ?? '–'}`).join('; '),
        expected: q.pairs.map((p) => `${p.left} = ${p.right}`).join('; '),
        wrongKeys: wrong.map((p) => p.key),
      };
    }
    case 'build': {
      const given = Array.isArray(r) ? r.join(' ') : '';
      const correct = normalize(given) === normalize(q.answer);
      return { ...base, correct, points: correct ? 1 : 0, given, expected: q.answer, wrongKeys: correct ? [] : [q.itemKey] };
    }
    case 'pick': {
      const correct = r === q.answerIndex;
      return {
        ...base,
        correct,
        points: correct ? 1 : 0,
        given: typeof r === 'number' ? `Bild ${r + 1}` : '–',
        expected: `Bild ${q.answerIndex + 1}`,
        wrongKeys: correct ? [] : [q.itemKey],
      };
    }
  }
}

// ---------------------------------------------------------------- vocabulary

export const vocabKey = (v: VocabItem) => `v:${v.id}`;

function germanDistractors(item: VocabItem, vocab: VocabItem[], n: number): string[] {
  const others = vocab.filter((v) => v.id !== item.id && v.de !== item.de);
  return sample(Array.from(new Set(others.map((v) => v.de))), n);
}

function englishDistractors(item: VocabItem, vocab: VocabItem[], n: number): string[] {
  const others = vocab.filter((v) => v.id !== item.id && v.en !== item.en);
  return sample(Array.from(new Set(others.map((v) => v.en))), n);
}

/** German prompt with context when the German word is ambiguous. */
export function germanPrompt(v: VocabItem): { prompt: string; context?: string } {
  return { prompt: v.de, context: v.deHint };
}

export function vocabMcEnDe(v: VocabItem, vocab: VocabItem[]): McQuestion {
  return {
    uid: uid(),
    kind: 'mc',
    topic: 'vocab',
    itemKey: vocabKey(v),
    dir: 'en-de',
    instruction: 'Was heißt das auf Deutsch?',
    prompt: v.en,
    options: shuffle([v.de, ...germanDistractors(v, vocab, 3)]),
    answer: v.de,
  };
}

export function vocabMcDeEn(v: VocabItem, vocab: VocabItem[]): McQuestion {
  const g = germanPrompt(v);
  return {
    uid: uid(),
    kind: 'mc',
    topic: 'vocab',
    itemKey: vocabKey(v),
    dir: 'de-en',
    instruction: 'Welches englische Wort passt?',
    prompt: g.context ? `${g.prompt} (${g.context})` : g.prompt,
    options: shuffle([v.en, ...englishDistractors(v, vocab, 3)]),
    answer: v.en,
  };
}

export function accepted(v: VocabItem): string[] {
  return [v.en, ...(v.enAlt ?? [])];
}

export function vocabTypeDeEn(v: VocabItem): TypeQuestion {
  const g = germanPrompt(v);
  return {
    uid: uid(),
    kind: 'type',
    topic: 'vocab',
    itemKey: vocabKey(v),
    dir: 'de-en',
    instruction: 'Schreib das englische Wort.',
    prompt: g.prompt,
    context: g.context,
    accepted: accepted(v),
    solution: v.example,
  };
}

/** Text spoken in dictation: word, example sentence, word. */
export function dictationText(v: VocabItem): string {
  return v.example ? `${v.en}. ... ${v.example} ... ${v.en}.` : `${v.en}. ... ${v.en}.`;
}

export function vocabDictation(v: VocabItem): TypeQuestion {
  return {
    uid: uid(),
    kind: 'type',
    topic: 'vocab',
    itemKey: vocabKey(v),
    dir: 'listen',
    instruction: 'Hör gut zu und schreib das Wort.',
    prompt: '🔊 Hördiktat',
    accepted: accepted(v),
    speak: dictationText(v),
    solution: `${v.en} = ${v.de}`,
  };
}

export function canScramble(v: VocabItem): boolean {
  return /^[a-z]{4,}$/i.test(v.en);
}

export function vocabScramble(v: VocabItem): TypeQuestion {
  if (!canScramble(v)) return vocabTypeDeEn(v);
  let letters = shuffle(v.en.toLowerCase().split(''));
  for (let i = 0; i < 5 && letters.join('') === v.en.toLowerCase(); i++) letters = shuffle(letters);
  return {
    uid: uid(),
    kind: 'type',
    topic: 'vocab',
    itemKey: vocabKey(v),
    dir: 'de-en',
    instruction: 'Buchstabensalat: Bring die Buchstaben in die richtige Reihenfolge.',
    prompt: v.de,
    context: v.deHint,
    letters,
    accepted: accepted(v),
  };
}

export function vocabTf(v: VocabItem, vocab: VocabItem[]): TfQuestion {
  const truth = Math.random() < 0.5;
  const shown = truth ? v.de : germanDistractors(v, vocab, 1)[0] ?? v.de;
  return {
    uid: uid(),
    kind: 'tf',
    topic: 'vocab',
    itemKey: vocabKey(v),
    dir: 'en-de',
    instruction: 'Stimmt die Übersetzung?',
    statement: `${v.en} = ${shown}`,
    answer: shown === v.de,
    solution: `${v.en} = ${v.de}`,
  };
}

export function vocabMatch(items: VocabItem[]): MatchQuestion {
  const pairs = items.map((v) => ({ key: vocabKey(v), left: v.en, right: v.de }));
  return {
    uid: uid(),
    kind: 'match',
    topic: 'vocab',
    itemKey: pairs.map((p) => p.key).join(','),
    dir: 'en-de',
    instruction: 'Ordne zu: Tippe links ein Wort an, dann rechts die Übersetzung.',
    pairs,
    rightOrder: shuffle(pairs.map((p) => p.right)),
  };
}

export function canBuild(v: VocabItem): boolean {
  return !!v.example && splitSentence(v.example).length >= 4 && splitSentence(v.example).length <= 9;
}

export function splitSentence(s: string): string[] {
  return normalize(s).split(' ');
}

function buildFrom(sentence: string, base: Omit<BuildQuestion, 'uid' | 'kind' | 'words' | 'answer'>): BuildQuestion {
  const words = splitSentence(sentence);
  let shuffled = shuffle(words);
  for (let i = 0; i < 5 && shuffled.join(' ') === words.join(' '); i++) shuffled = shuffle(words);
  return { ...base, uid: uid(), kind: 'build', words: shuffled, answer: words.join(' ') };
}

export function vocabBuild(v: VocabItem): BuildQuestion | TypeQuestion {
  if (!canBuild(v)) return vocabTypeDeEn(v);
  return buildFrom(v.example!, {
    topic: 'vocab',
    itemKey: vocabKey(v),
    dir: 'de-en',
    instruction: `Bau einen Satz mit „${v.en}“. Tippe die Wörter in der richtigen Reihenfolge an.`,
  });
}

// ---------------------------------------------------------------- pronouns

const pronKey = (p: Pronoun) => `pron:${p}`;

const fillGap = (text: string, p: string) => {
  const idx = text.indexOf('___');
  const atStart = idx === 0 || /[.?!–-]\s*$/.test(text.slice(0, idx));
  const word = atStart || p === 'I' ? p.charAt(0).toUpperCase() + p.slice(1) : p;
  return text.replace('___', word);
};

export function gapsFor(p?: Pronoun): PronounGap[] {
  return p ? pronounGaps.filter((g) => g.answer === p) : pronounGaps;
}

export function replacesFor(p?: Pronoun): PronounReplace[] {
  return p ? pronounReplaces.filter((g) => g.answer === p) : pronounReplaces;
}

export function pronGapType(g: PronounGap): TypeQuestion {
  return {
    uid: uid(),
    kind: 'type',
    topic: 'pronouns',
    itemKey: pronKey(g.answer),
    instruction: 'Setz das richtige Personalpronomen ein.',
    prompt: g.text,
    accepted: [g.answer],
    solution: fillGap(g.text, g.answer),
  };
}

export function pronGapMc(g: PronounGap): McQuestion {
  const opts = shuffle([g.answer, ...sample(pronouns.filter((p) => p !== g.answer), 3)]);
  return {
    uid: uid(),
    kind: 'mc',
    topic: 'pronouns',
    itemKey: pronKey(g.answer),
    instruction: 'Welches Pronomen passt in die Lücke?',
    prompt: g.text,
    options: opts,
    answer: g.answer,
  };
}

export function pronReplaceType(r: PronounReplace): TypeQuestion {
  return {
    uid: uid(),
    kind: 'type',
    topic: 'pronouns',
    itemKey: pronKey(r.answer),
    instruction: `Ersetze „${r.phrase}“ durch ein Pronomen.`,
    prompt: `${r.phrase} ${r.rest}  →  ___ ${r.rest}`,
    accepted: [r.answer],
    solution: `${r.answer.charAt(0).toUpperCase()}${r.answer.slice(1)} ${r.rest}`,
  };
}

export function pronReplaceMc(r: PronounReplace): McQuestion {
  return {
    uid: uid(),
    kind: 'mc',
    topic: 'pronouns',
    itemKey: pronKey(r.answer),
    instruction: 'Welches Pronomen ersetzt den Satzteil?',
    prompt: `${r.phrase} → ?`,
    options: shuffle([r.answer, ...sample(pronouns.filter((p) => p !== r.answer), 3)]),
    answer: r.answer,
  };
}

export function pronTf(r: PronounReplace): TfQuestion {
  const truth = Math.random() < 0.5;
  // "you" also replaces "you and X", so do not offer it as a wrong option there.
  const wrongOptions = pronouns.filter((p) => p !== r.answer && p !== 'I');
  const shown = truth ? r.answer : pick(wrongOptions);
  return {
    uid: uid(),
    kind: 'tf',
    topic: 'pronouns',
    itemKey: pronKey(r.answer),
    instruction: 'Ersetzt das Pronomen den Satzteil richtig?',
    statement: `${r.phrase} ${r.rest}  →  ${shown.charAt(0).toUpperCase()}${shown.slice(1)} ${r.rest}`,
    answer: truth,
    solution: `${r.phrase} → ${r.answer}`,
  };
}

export function pronBuild(g: PronounGap): BuildQuestion {
  const full = fillGap(g.text, g.answer);
  // Use only the part with the pronoun, so the tiles stay short.
  const parts = full.split(/(?<=[.?!])\s+|\s+–\s+/);
  const withPron = parts.find((p) => new RegExp(`\\b${g.answer}\\b`, 'i').test(p)) ?? full;
  return buildFrom(withPron, {
    topic: 'pronouns',
    itemKey: pronKey(g.answer),
    instruction: 'Bau den Satz. Tippe die Wörter in der richtigen Reihenfolge an.',
    german: parts.length > 1 ? `Davor: „${parts.filter((p) => p !== withPron).join(' ')}“` : undefined,
  });
}

// ---------------------------------------------------------------- prepositions

const prepKey = (p: Preposition) => `prep:${p}`;

export function randomScene(prep?: Preposition, count = 1): Scene {
  const objects = (Object.keys(objectPreps) as SceneObject[]).filter((o) => !prep || objectPreps[o].includes(prep));
  const object = pick(objects);
  return { object, prep: prep ?? pick(objectPreps[object]), animal: pick(animals).id, count };
}

export const animalOf = (id: string) => animals.find((a) => a.id === id) ?? animals[0];

export function sceneSentence(s: Scene): string {
  const a = animalOf(s.animal);
  return `The ${a.en} is ${s.prep} the ${objectNames[s.object].en}.`;
}

export function prepPicMc(s: Scene): McQuestion {
  const a = animalOf(s.animal);
  return {
    uid: uid(),
    kind: 'mc',
    topic: 'prepositions',
    itemKey: prepKey(s.prep),
    instruction: `Schau dir das Bild an: Where is the ${a.en}?`,
    picture: s,
    prompt: `The ${a.en} is ___ the ${objectNames[s.object].en}.`,
    options: shuffle([s.prep, ...sample(prepositions.filter((p) => p !== s.prep), 3)]),
    answer: s.prep,
  };
}

export function prepPicType(s: Scene): TypeQuestion {
  const a = animalOf(s.animal);
  return {
    uid: uid(),
    kind: 'type',
    topic: 'prepositions',
    itemKey: prepKey(s.prep),
    instruction: `Schau dir das Bild an und schreib die Präposition: Where is the ${a.en}?`,
    picture: s,
    prompt: `The ${a.en} is ___ the ${objectNames[s.object].en}.`,
    accepted: [s.prep],
    solution: sceneSentence(s),
  };
}

export function prepTranslate(s: Scene): TypeQuestion {
  const a = animalOf(s.animal);
  const o = objectNames[s.object];
  const de = `${a.de.charAt(0).toUpperCase()}${a.de.slice(1)} ist ${prepositionDe[s.prep]} ${o.dat}.`;
  return {
    uid: uid(),
    kind: 'type',
    topic: 'prepositions',
    itemKey: prepKey(s.prep),
    dir: 'de-en',
    instruction: 'Übersetze und schreib das fehlende Wort.',
    prompt: `The ${a.en} is ___ the ${o.en}.`,
    context: de,
    accepted: [s.prep],
    solution: sceneSentence(s),
  };
}

export function prepPick(s: Scene): PickPictureQuestion {
  const others = sample(
    objectPreps[s.object].filter((p) => p !== s.prep),
    2,
  ).map((prep) => ({ ...s, prep }));
  const options = shuffle([s, ...others]);
  return {
    uid: uid(),
    kind: 'pick',
    topic: 'prepositions',
    itemKey: prepKey(s.prep),
    instruction: 'Welches Bild passt zum Satz?',
    sentence: sceneSentence(s),
    options,
    answerIndex: options.indexOf(s),
  };
}

export function prepTf(s: Scene): TfQuestion {
  const truth = Math.random() < 0.5;
  const shownPrep = truth ? s.prep : pick(objectPreps[s.object].filter((p) => p !== s.prep));
  const a = animalOf(s.animal);
  return {
    uid: uid(),
    kind: 'tf',
    topic: 'prepositions',
    itemKey: prepKey(s.prep),
    instruction: 'Passt der Satz zum Bild?',
    picture: s,
    statement: `The ${a.en} is ${shownPrep} the ${objectNames[s.object].en}.`,
    answer: truth,
    solution: sceneSentence(s),
  };
}

export function thereSentence(s: Scene): { gap: string; full: string; answer: string } {
  const a = animalOf(s.animal);
  const o = objectNames[s.object].en;
  const answer = s.count === 1 ? 'There is' : 'There are';
  const thing = s.count === 1 ? `a ${a.en}` : `${numberWords[s.count]} ${a.plural}`;
  return { gap: `___ ${thing} ${s.prep} the ${o}.`, full: `${answer} ${thing} ${s.prep} the ${o}.`, answer };
}

export function thereMc(s: Scene): McQuestion {
  const t = thereSentence(s);
  return {
    uid: uid(),
    kind: 'mc',
    topic: 'prepositions',
    itemKey: s.count === 1 ? 'there:is' : 'there:are',
    instruction: 'Schau dir das Bild an: there is oder there are?',
    picture: s,
    prompt: t.gap,
    options: ['There is', 'There are'],
    answer: t.answer,
  };
}

export function thereType(s: Scene): TypeQuestion {
  const t = thereSentence(s);
  return {
    uid: uid(),
    kind: 'type',
    topic: 'prepositions',
    itemKey: s.count === 1 ? 'there:is' : 'there:are',
    instruction: 'Schau dir das Bild an und schreib „there is“ oder „there are“.',
    picture: s,
    prompt: t.gap,
    accepted: s.count === 1 ? ['There is', "There's"] : ['There are'],
    solution: t.full,
  };
}

export function prepBuild(s: Scene): BuildQuestion {
  const sentence = s.count > 1 ? thereSentence(s).full : sceneSentence(s);
  return buildFrom(sentence, {
    topic: 'prepositions',
    itemKey: s.count > 1 ? 'there:are' : prepKey(s.prep),
    instruction: 'Schau dir das Bild an und bau den passenden Satz.',
    picture: s,
  });
}

/** Random "there is / there are" scene; count 1 for "there is". */
export function thereScene(plural?: boolean): Scene {
  const isPlural = plural ?? Math.random() < 0.6;
  return randomScene(pick(['on', 'next to', 'in front of'] as Preposition[]), isPlural ? 2 + Math.floor(Math.random() * 3) : 1);
}
