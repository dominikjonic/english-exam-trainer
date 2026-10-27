import { prepositions, pronouns } from '../data/grammar';
import type { Preposition, Pronoun, Unit, VocabItem } from '../data/types';
import { pick, sample, shuffle, spreadShuffle, weightedSample } from './random';
import {
  canBuild,
  canScramble,
  gapsFor,
  kindLabel,
  prepBuild,
  prepPick,
  prepPicMc,
  prepPicType,
  prepTf,
  prepTranslate,
  pronBuild,
  pronGapMc,
  pronGapType,
  pronReplaceMc,
  pronReplaceType,
  pronTf,
  randomScene,
  replacesFor,
  thereMc,
  thereScene,
  thereType,
  vocabBuild,
  vocabMatch,
  vocabMcDeEn,
  vocabMcEnDe,
  vocabScramble,
  vocabTf,
  vocabTypeDeEn,
  type Question,
} from './questions';

export type PartId = 'warmup' | 'A' | 'B' | 'pause' | 'C' | 'D';

export interface PartPlan {
  id: PartId;
  title: string;
  subtitle: string;
  minutes: number;
  /** Start minute in the 50-minute plan, for display. */
  from: number;
}

export const EXAM_PARTS: PartPlan[] = [
  { id: 'warmup', title: 'Aufwärmen', subtitle: 'Multiple Choice Englisch → Deutsch', minutes: 5, from: 0 },
  { id: 'A', title: 'Teil A: Vokabeln', subtitle: 'Deutsch → Englisch schreiben und Buchstabensalat', minutes: 10, from: 5 },
  { id: 'B', title: 'Teil B: Pronomen', subtitle: 'Lückentexte und Satzteile ersetzen', minutes: 10, from: 15 },
  { id: 'pause', title: 'Pause', subtitle: 'Mini-Spiel ohne Wertung', minutes: 3, from: 25 },
  { id: 'C', title: 'Teil C: Präpositionen', subtitle: 'Bildaufgaben und there is / there are', minutes: 10, from: 28 },
  { id: 'D', title: 'Teil D: Boss-Runde', subtitle: 'Alles gemischt, mit deinen Fehlern', minutes: 9, from: 38 },
];

export const EXAM_MINUTES = 50;

/** How often each vocab item was answered wrong before, used to practise weak words more often. */
export type WeakMap = Record<string, number>;

export interface ExamContext {
  unit: Unit;
  weak: WeakMap;
  /** Vocab ids already used in this exam (warm-up and part A use different words). */
  used: Set<string>;
}

function pickVocab(ctx: ExamContext, n: number, filter: (v: VocabItem) => boolean = () => true): VocabItem[] {
  let pool = ctx.unit.vocab.filter((v) => !ctx.used.has(v.id) && filter(v));
  if (pool.length < n) pool = ctx.unit.vocab.filter(filter);
  const chosen = weightedSample(pool, n, (v) => 1 + 2 * (ctx.weak[`v:${v.id}`] ?? 0));
  chosen.forEach((v) => ctx.used.add(v.id));
  return chosen;
}

/** Orders questions so the same task type and the same item never follow each other. */
export function arrange(questions: Question[]): Question[] {
  return spreadShuffle(questions, (q) => [kindLabel(q), q.itemKey]);
}

function warmup(ctx: ExamContext): Question[] {
  const v = ctx.unit.vocab;
  const mc = pickVocab(ctx, 6).map((item) => vocabMcEnDe(item, v));
  const match = vocabMatch(pickVocab(ctx, 4, (x) => x.en.length <= 16));
  const tf = pickVocab(ctx, 2).map((item) => vocabTf(item, v));
  return arrange([...mc, ...tf, match]);
}

function partA(ctx: ExamContext): Question[] {
  const typed = pickVocab(ctx, 10).map(vocabTypeDeEn);
  const scramble = pickVocab(ctx, 4, canScramble).map(vocabScramble);
  return arrange([...typed, ...scramble]);
}

/** Vocabulary mix used when a unit has no grammar module for part B or C. */
function vocabMix(ctx: ExamContext, n: number): Question[] {
  const v = ctx.unit.vocab;
  const items = pickVocab(ctx, n);
  const makers = [
    (x: VocabItem) => vocabTypeDeEn(x),
    (x: VocabItem) => vocabMcDeEn(x, v),
    (x: VocabItem) => (canBuild(x) ? vocabBuild(x) : vocabTf(x, v)),
    (x: VocabItem) => vocabTf(x, v),
  ];
  return arrange(items.map((x, i) => makers[i % makers.length](x)));
}

function partB(ctx: ExamContext): Question[] {
  if (!ctx.unit.grammar.includes('pronouns')) return vocabMix(ctx, 14);
  // Every pronoun appears at least once.
  const gaps = shuffle(gapsFor());
  const byPronoun = pronouns.map((p) => gaps.find((g) => g.answer === p)!).filter(Boolean);
  const restGaps = gaps.filter((g) => !byPronoun.includes(g));
  const gapItems = [...byPronoun, ...restGaps.slice(0, 2)];
  const typed = gapItems.slice(0, 5).map(pronGapType);
  const mc = gapItems.slice(5, 8).map(pronGapMc);
  const reps = shuffle(replacesFor());
  const replaceTyped = reps.slice(0, 4).map(pronReplaceType);
  const replaceMc = reps.slice(4, 5).map(pronReplaceMc);
  const tf = reps.slice(5, 7).map(pronTf);
  const build = [pronBuild(restGaps[2] ?? pick(gaps))];
  return arrange([...typed, ...mc, ...replaceTyped, ...replaceMc, ...tf, ...build]);
}

function partC(ctx: ExamContext): Question[] {
  if (!ctx.unit.grammar.includes('prepositions')) return vocabMix(ctx, 14);
  // Each of the six prepositions in a picture task, plus extra mixed ones.
  const preps = shuffle(prepositions);
  const pictureMc = preps.slice(0, 3).map((p) => prepPicMc(randomScene(p)));
  const pictureType = preps.slice(3, 6).map((p) => prepPicType(randomScene(p)));
  const pickPic = sample(prepositions, 2).map((p) => prepPick(randomScene(p)));
  const tf = sample(prepositions, 2).map((p) => prepTf(randomScene(p)));
  const there = [thereMc(thereScene(false)), thereMc(thereScene(true)), thereType(thereScene())];
  const translate = [prepTranslate(randomScene())];
  const build = [prepBuild(Math.random() < 0.5 ? thereScene(true) : randomScene())];
  return arrange([...pictureMc, ...pictureType, ...pickPic, ...tf, ...there, ...translate, ...build]);
}

/** A new task for an item that was answered wrong, using a different task type. */
export function retryQuestion(itemKey: string, previousKind: string, unit: Unit): Question | null {
  const [kind, value] = itemKey.split(':');
  const different = (qs: (() => Question)[]): Question => {
    for (const make of shuffle(qs)) {
      const q = make();
      if (kindLabel(q) !== previousKind) return q;
    }
    return qs[0]();
  };
  if (kind === 'v') {
    const v = unit.vocab.find((x) => x.id === value);
    if (!v) return null;
    return different([
      () => vocabTypeDeEn(v),
      () => vocabMcEnDe(v, unit.vocab),
      () => vocabScramble(v),
      () => vocabMcDeEn(v, unit.vocab),
    ]);
  }
  if (kind === 'pron') {
    const p = value as Pronoun;
    const gaps = gapsFor(p);
    const reps = replacesFor(p);
    return different([
      () => pronGapType(pick(gaps)),
      () => pronGapMc(pick(gaps)),
      ...(reps.length ? [() => pronReplaceType(pick(reps)), () => pronTf(pick(reps))] : []),
    ]);
  }
  if (kind === 'prep') {
    const p = value as Preposition;
    return different([
      () => prepPicType(randomScene(p)),
      () => prepPicMc(randomScene(p)),
      () => prepPick(randomScene(p)),
      () => prepTranslate(randomScene(p)),
    ]);
  }
  if (kind === 'there') {
    const plural = value === 'are';
    return different([() => thereType(thereScene(plural)), () => thereMc(thereScene(plural))]);
  }
  return null;
}

export interface Mistake {
  itemKey: string;
  kind: string;
}

export const BOSS_SIZE = 14;

/** Boss round: mistakes from parts A–C first (with a different task type), filled up with a mix. */
export function bossRound(unit: Unit, mistakes: Mistake[], weak: WeakMap): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const m of shuffle(mistakes)) {
    if (seen.has(m.itemKey) || out.length >= 10) continue;
    seen.add(m.itemKey);
    const q = retryQuestion(m.itemKey, m.kind, unit);
    if (q) out.push(q);
  }
  const ctx: ExamContext = { unit, weak, used: new Set() };
  const fillers: (() => Question)[] = [
    () => vocabMcEnDe(pickVocab(ctx, 1)[0], unit.vocab),
    () => vocabTypeDeEn(pickVocab(ctx, 1)[0]),
    () => vocabMcDeEn(pickVocab(ctx, 1)[0], unit.vocab),
  ];
  if (unit.grammar.includes('pronouns')) {
    fillers.push(() => pronGapType(pick(gapsFor())), () => pronReplaceType(pick(replacesFor())));
  }
  if (unit.grammar.includes('prepositions')) {
    fillers.push(() => prepPicType(randomScene()), () => thereMc(thereScene()));
  }
  let i = 0;
  let guard = 0;
  const order = shuffle(fillers);
  while (out.length < BOSS_SIZE && guard++ < 100) {
    const q = order[i++ % order.length]();
    if (seen.has(q.itemKey)) continue;
    seen.add(q.itemKey);
    out.push(q);
  }
  return arrange(out);
}

export function buildPart(id: Exclude<PartId, 'pause' | 'D'>, ctx: ExamContext): Question[] {
  switch (id) {
    case 'warmup':
      return warmup(ctx);
    case 'A':
      return partA(ctx);
    case 'B':
      return partB(ctx);
    case 'C':
      return partC(ctx);
  }
}
