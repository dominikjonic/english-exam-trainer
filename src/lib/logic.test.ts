import { unit2 } from '../data/unit2';
import { pronounGaps, pronounReplaces } from '../data/grammar';
import { diffLetters, isExactMatch, isSpellingSlip } from './answer';
import { bossRound, buildPart, EXAM_PARTS, type ExamContext } from './exam';
import { gradeFor, validThresholds } from './grading';
import { answerCard, demoteCard, dueCards, newCard, cardKey } from './leitner';
import { gradeQuestion, kindLabel, vocabMatch, vocabTypeDeEn, type Question } from './questions';
import { finishExam, type Answered } from './results';
import { goalStreak, levelFor, xpForLevel } from './rewards';
import { defaultState, loadState } from './store';

const ctx = (): ExamContext => ({ unit: unit2, weak: {}, used: new Set() });

describe('vocabulary data', () => {
  it('has the 47 Unit 2 words with unique ids', () => {
    expect(unit2.vocab).toHaveLength(47);
    expect(new Set(unit2.vocab.map((v) => v.id)).size).toBe(47);
  });

  it('gives context for every German "sie"', () => {
    for (const v of unit2.vocab.filter((x) => /\bsie\b/.test(x.de))) expect(v.deHint).toBeTruthy();
  });

  it('every pronoun gap has exactly one gap', () => {
    for (const g of pronounGaps) expect(g.text.split('___')).toHaveLength(2);
    expect(pronounReplaces.length).toBeGreaterThan(10);
  });
});

describe('answer checking', () => {
  it('counts typos as wrong but recognises them as spelling slips', () => {
    expect(isExactMatch('beautifull', 'beautiful')).toBe(false);
    expect(isSpellingSlip('beautifull', ['beautiful'])).toBe(true);
    expect(isSpellingSlip('lion', ['giraffe'])).toBe(false);
  });

  it('ignores spacing, end punctuation and capitals – except "I"', () => {
    expect(isExactMatch('  In Front  of ', 'in front of')).toBe(true);
    expect(isExactMatch('at last', 'At last.')).toBe(true);
    expect(isExactMatch('i', 'I')).toBe(false);
    expect(isExactMatch('I', 'I')).toBe(true);
    expect(isExactMatch('there’s', "there's")).toBe(true);
  });

  it('shows the letter difference', () => {
    const parts = diffLetters('behnd', 'behind');
    expect(parts).toEqual([
      { text: 'beh', kind: 'same' },
      { text: 'i', kind: 'missing' },
      { text: 'nd', kind: 'same' },
    ]);
  });

  it('grades match tasks per pair', () => {
    const q = vocabMatch(unit2.vocab.slice(0, 4));
    const map = Object.fromEntries(q.pairs.map((p) => [p.key, p.right]));
    map[q.pairs[0].key] = q.pairs[1].right;
    const g = gradeQuestion(q, map);
    expect(g.points).toBe(3);
    expect(g.maxPoints).toBe(4);
    expect(g.wrongKeys).toEqual([q.pairs[0].key]);
  });
});

describe('grading scale', () => {
  it('uses the school scale', () => {
    expect(gradeFor(90)).toBe(1);
    expect(gradeFor(89.9)).toBe(2);
    expect(gradeFor(80)).toBe(2);
    expect(gradeFor(65)).toBe(3);
    expect(gradeFor(50)).toBe(4);
    expect(gradeFor(49)).toBe(5);
    expect(gradeFor(85, { 1: 85, 2: 75, 3: 60, 4: 45 })).toBe(1);
  });

  it('rejects thresholds that do not fall', () => {
    expect(validThresholds({ 1: 90, 2: 80, 3: 65, 4: 50 })).toBe(true);
    expect(validThresholds({ 1: 80, 2: 80, 3: 65, 4: 50 })).toBe(false);
  });
});

describe('exam building', () => {
  const noRepeats = (qs: Question[]) => {
    for (let i = 1; i < qs.length; i++) {
      expect(qs[i].itemKey).not.toBe(qs[i - 1].itemKey);
    }
  };

  it('builds all parts with mixed task types and no item twice in a row', () => {
    for (let run = 0; run < 20; run++) {
      const c = ctx();
      for (const id of ['warmup', 'A', 'B', 'C'] as const) {
        const qs = buildPart(id, c);
        expect(qs.length).toBeGreaterThanOrEqual(9);
        noRepeats(qs);
        for (let i = 1; i < qs.length; i++) {
          const same = kindLabel(qs[i]) === kindLabel(qs[i - 1]);
          // Same type next to each other is only allowed when nothing else is left.
          if (same) expect(qs.slice(i).every((q) => kindLabel(q) === kindLabel(qs[i]))).toBe(true);
        }
      }
    }
  });

  it('uses different words in warm-up and part A', () => {
    const c = ctx();
    const keys = (qs: Question[]) => qs.flatMap((q) => (q.kind === 'match' ? q.pairs.map((p) => p.key) : [q.itemKey]));
    const w = keys(buildPart('warmup', c));
    const a = keys(buildPart('A', c));
    expect(w.filter((k) => a.includes(k))).toEqual([]);
  });

  it('orders differently each time', () => {
    const a = buildPart('A', ctx()).map((q) => q.itemKey).join();
    const b = buildPart('A', ctx()).map((q) => q.itemKey).join();
    expect(a).not.toBe(b);
  });

  it('puts mistakes into the boss round with a different task type', () => {
    const qs = bossRound(unit2, [{ itemKey: 'v:lion', kind: 'Selbst schreiben' }, { itemKey: 'pron:she', kind: 'Multiple Choice' }], {});
    const lion = qs.find((q) => q.itemKey === 'v:lion')!;
    const she = qs.find((q) => q.itemKey === 'pron:she')!;
    expect(lion).toBeTruthy();
    expect(kindLabel(lion)).not.toBe('Selbst schreiben');
    expect(kindLabel(she)).not.toBe('Multiple Choice');
    expect(qs.length).toBe(14);
  });

  it('fills parts B and C with vocabulary when a unit has no grammar', () => {
    const unit = { ...unit2, grammar: [] };
    const qs = buildPart('B', { unit, weak: {}, used: new Set() });
    expect(qs.every((q) => q.topic === 'vocab')).toBe(true);
  });

  it('plans 50 minutes', () => {
    const last = EXAM_PARTS[EXAM_PARTS.length - 1];
    expect(last.from + last.minutes).toBe(47);
  });
});

describe('Leitner', () => {
  it('moves cards up on right and back to box 1 on wrong', () => {
    let c = newCard('2026-10-27');
    c = answerCard(c, true, '2026-10-27');
    expect(c.box).toBe(1);
    expect(c.due).toBe('2026-10-28');
    c = answerCard(c, true, '2026-10-28');
    expect(c.box).toBe(2);
    expect(c.due).toBe('2026-10-30');
    c = answerCard(c, false, '2026-10-30');
    expect(c.box).toBe(1);
  });

  it('puts exam mistakes in box 1, due today', () => {
    const c = demoteCard({ box: 4, due: '2026-12-01', right: 5, wrong: 0 }, '2026-10-27');
    expect(c).toMatchObject({ box: 1, due: '2026-10-27', wrong: 1 });
    const deck = { [cardKey('lion', 'de-en')]: c };
    expect(dueCards(unit2.vocab, deck, '2026-10-27')[0]).toBe('lion|de-en');
  });
});

describe('finishing an exam', () => {
  const answerAll = (correct: (i: number) => boolean): Answered[] =>
    unit2.vocab.slice(0, 20).map((v, i) => {
      const q = vocabTypeDeEn(v);
      return { partId: 'A', q, g: gradeQuestion(q, correct(i) ? v.en : 'xyz') };
    });

  it('saves the result, XP, badges and sends wrong words to the learn mode', () => {
    const { result, state } = finishExam(defaultState(), unit2, answerAll((i) => i !== 0), 1800);
    expect(result.percent).toBe(95);
    expect(result.grade).toBe(1);
    expect(result.mistakes).toHaveLength(1);
    expect(state.results).toHaveLength(1);
    expect(state.xp).toBe(result.xp);
    expect(state.badges['first-exam']).toBeTruthy();
    expect(state.decks.unit2[cardKey(unit2.vocab[0].id, 'de-en')].box).toBe(1);
  });

  it('reaches the goal after two grade-1 exams in a row', () => {
    let s = defaultState();
    s = finishExam(s, unit2, answerAll(() => true), 1800).state;
    expect(goalStreak(s.results, 'unit2', s.settings.thresholds)).toBe(1);
    s = finishExam(s, unit2, answerAll(() => true), 1800).state;
    expect(s.badges.goal).toBeTruthy();
    s = finishExam(s, unit2, answerAll((i) => i > 5), 1800).state;
    expect(goalStreak(s.results, 'unit2', s.settings.thresholds)).toBe(0);
  });
});

describe('levels and storage', () => {
  it('computes levels', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(xpForLevel(2))).toBe(2);
    expect(levelFor(xpForLevel(3) - 1)).toBe(2);
  });

  it('survives broken saved data', () => {
    expect(loadState('{not json').units[0].id).toBe('unit2');
    const s = loadState(JSON.stringify({ version: 1, xp: 30, settings: { thresholds: { 1: 85 } } }));
    expect(s.xp).toBe(30);
    expect(s.settings.thresholds).toEqual({ 1: 85, 2: 80, 3: 65, 4: 50 });
  });
});
