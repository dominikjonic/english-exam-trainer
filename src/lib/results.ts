import type { Topic, Unit } from '../data/types';
import { gradeFor, percent } from './grading';
import { boxCounts, cardKey, demoteCard, fullDeck, today, addDays, type CardDir } from './leitner';
import { kindLabel, type Graded, type Question } from './questions';
import { dayStreak, goalStreak, XP_GRADE_BONUS, XP_NEW_BEST, XP_PER_POINT } from './rewards';
import type { AppState, ExamResult, MistakeRecord, Stat } from './types';
import { EXAM_PARTS } from './exam';
import { boostXp, perksOf } from './pirates';

export interface Answered {
  partId: string;
  q: Question;
  g: Graded;
  /** An extra question from the second-chance perk: worth no points of its own, a right answer wins back one lost point. */
  bonus?: boolean;
}

const stat = (): Stat => ({ right: 0, total: 0 });

export function questionText(q: Question): string {
  switch (q.kind) {
    case 'mc':
      return q.prompt;
    case 'type':
      return q.context ? `${q.prompt} (${q.context})` : q.prompt;
    case 'tf':
      return q.statement;
    case 'match':
      return q.pairs.map((p) => p.left).join(', ');
    case 'build':
      return 'Satz bauen';
    case 'pick':
      return q.sentence;
  }
}

/** Grants a badge once; returns true if it is new. */
function grant(badges: Record<string, string>, id: string, newOnes: string[]) {
  if (!badges[id]) {
    badges[id] = new Date().toISOString();
    newOnes.push(id);
  }
}

export function checkLearnBadges(state: AppState, badges: Record<string, string>, newOnes: string[]) {
  const streak = dayStreak(state.learnDays, today(), addDays);
  if (streak >= 3) grant(badges, 'streak-3', newOnes);
  if (streak >= 7) grant(badges, 'streak-7', newOnes);
  for (const unit of state.units) {
    const counts = boxCounts(unit.vocab, state.decks[unit.id] ?? {});
    if (counts[5] >= 10) grant(badges, 'box5-10', newOnes);
    if (unit.vocab.length && counts[0] + counts[1] + counts[2] === 0) grant(badges, 'all-words', newOnes);
  }
}

/** Builds the exam result and the updated app state (XP, badges, Leitner deck, weak words). */
export function finishExam(
  state: AppState,
  unit: Unit,
  answered: Answered[],
  durationSec: number,
): { result: ExamResult; state: AppState } {
  const t = state.settings.thresholds;
  const extra = answered.filter((a) => a.bonus);
  answered = answered.filter((a) => !a.bonus);
  const lost = answered.reduce((s, a) => s + a.g.maxPoints - a.g.points, 0);
  const recovered = Math.min(lost, extra.filter((a) => a.g.correct).length);
  const points = answered.reduce((s, a) => s + a.g.points, 0) + recovered;
  const max = answered.reduce((s, a) => s + a.g.maxPoints, 0);
  const pct = percent(points, max);
  const grade = gradeFor(pct, t);

  const parts = EXAM_PARTS.filter((p) => p.id !== 'pause').map((p) => {
    const own = answered.filter((a) => a.partId === p.id);
    const won = extra.filter((a) => a.partId === p.id && a.g.correct).length;
    const pts = own.reduce((s, a) => s + a.g.points, 0);
    const mx = own.reduce((s, a) => s + a.g.maxPoints, 0);
    return { id: p.id, title: p.title, points: Math.min(mx, pts + won), max: mx };
  });

  const dirStats = { 'en-de': stat(), 'de-en': stat() };
  const topicStats: Record<Topic, Stat> = { vocab: stat(), pronouns: stat(), prepositions: stat() };
  const mistakes: MistakeRecord[] = [];
  let spellingErrors = 0;

  const deck = { ...fullDeck(unit.vocab, state.decks[unit.id] ?? {}) };
  const weak = { ...(state.weak[unit.id] ?? {}) };

  for (const a of answered) {
    const { q, g } = a;
    topicStats[q.topic].right += g.points;
    topicStats[q.topic].total += g.maxPoints;
    if (q.topic === 'vocab' && q.dir) {
      dirStats[q.dir].right += g.points;
      dirStats[q.dir].total += g.maxPoints;
    }
    if (g.spelling) spellingErrors++;
    if (!g.correct) {
      mistakes.push({
        partId: a.partId,
        kind: kindLabel(q),
        topic: q.topic,
        itemKey: q.itemKey,
        instruction: q.instruction,
        prompt: questionText(q),
        given: g.given,
        expected: g.expected,
        spelling: g.spelling,
      });
    }
    // Weak words get picked more often next time; Leitner gets the wrong words.
    const keys = q.kind === 'match' ? q.pairs.map((p) => p.key) : [q.itemKey];
    for (const key of keys) {
      const wrong = g.wrongKeys.includes(key);
      weak[key] = wrong ? (weak[key] ?? 0) + 1 : Math.max(0, (weak[key] ?? 0) - 0.5);
      if (wrong && key.startsWith('v:')) {
        const dir: CardDir = q.dir === 'en-de' ? 'en-de' : 'de-en';
        const ck = cardKey(key.slice(2), dir);
        deck[ck] = demoteCard(deck[ck]);
      }
    }
  }

  const previous = state.results.filter((r) => r.unitId === unit.id);
  const best = previous.reduce((m, r) => Math.max(m, r.percent), -1);
  const isNewBest = previous.length > 0 && pct > best;
  const xp = boostXp(points * XP_PER_POINT + XP_GRADE_BONUS[grade] + (isNewBest ? XP_NEW_BEST : 0), perksOf(state.equipped));

  const result: ExamResult = {
    id: `exam-${Date.now()}`,
    date: new Date().toISOString(),
    unitId: unit.id,
    unitTitle: unit.subtitle ? `${unit.title} – ${unit.subtitle}` : unit.title,
    points,
    maxPoints: max,
    percent: pct,
    grade,
    durationSec,
    parts,
    dirStats,
    topicStats,
    spellingErrors,
    mistakes,
    xp,
    newBadges: [],
    ...(extra.length ? { bonus: { asked: extra.length, recovered } } : {}),
  };

  const badges = { ...state.badges };
  const newOnes: string[] = [];
  grant(badges, 'first-exam', newOnes);
  if (grade === 1) grant(badges, 'grade-1', newOnes);
  if (isNewBest) grant(badges, 'new-best', newOnes);
  const perfect = (id: string) => {
    const p = parts.find((x) => x.id === id);
    return !!p && p.max > 0 && p.points === p.max && !extra.some((a) => a.partId === id);
  };
  if (perfect('A')) grant(badges, 'spelling-star', newOnes);
  if (perfect('B') && unit.grammar.includes('pronouns')) grant(badges, 'pronoun-pro', newOnes);
  if (perfect('C') && unit.grammar.includes('prepositions')) grant(badges, 'prep-pro', newOnes);
  if (perfect('D')) grant(badges, 'boss', newOnes);

  const results = [...state.results, result];
  if (goalStreak(results, unit.id, state.settings.thresholds, state.settings.goalWithBonus) >= 2) grant(badges, 'goal', newOnes);

  const next: AppState = {
    ...state,
    results,
    xp: state.xp + xp,
    badges,
    decks: { ...state.decks, [unit.id]: deck },
    weak: { ...state.weak, [unit.id]: weak },
  };
  checkLearnBadges(next, badges, newOnes);
  result.newBadges = newOnes;
  return { result, state: next };
}
