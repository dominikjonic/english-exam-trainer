import { unit2 } from '../data/unit2';
import { boostXp, buyItem, equipItem, gold, ITEMS, perksOf } from './pirates';
import { gradeQuestion, vocabTypeDeEn } from './questions';
import { finishExam, type Answered } from './results';
import { goalStreak, levelFor } from './rewards';
import { defaultState, loadState } from './store';

describe('gold and skins', () => {
  it('pays with gold without lowering the level', () => {
    const s = { ...defaultState(), xp: 1000 };
    const bought = buyItem(s, 'tricorn')!;
    expect(gold(bought)).toBe(700);
    expect(bought.xp).toBe(1000);
    expect(levelFor(bought.xp)).toBe(levelFor(1000));
    expect(bought.equipped.hat).toBe('tricorn');
    expect(buyItem(bought, 'tricorn')).toBeNull();
    expect(buyItem(bought, 'crown')).toBeNull();
  });

  it('adds up the perks of what is worn', () => {
    let s = { ...defaultState(), xp: 5000 };
    for (const id of ['captain', 'navigator', 'parrot']) s = buyItem(s, id)!;
    const p = perksOf(s.equipped);
    expect(p).toMatchObject({ secondChances: 2, extraMinutes: 1, xpFactor: 1.1 });
    expect(boostXp(100, p)).toBe(110);
    expect(perksOf(equipItem(s, 'parrot').equipped).xpFactor).toBe(1);
    expect(ITEMS.filter((i) => i.cost === 0).every((i) => defaultState().owned.includes(i.id))).toBe(true);
  });

  it('keeps old saves working', () => {
    const s = loadState(JSON.stringify({ version: 1, xp: 40 }));
    expect(s).toMatchObject({ heroId: null, goldSpent: 0, equipped: { hat: 'bandana', coat: 'shirt', pet: null } });
  });
});

describe('extra questions', () => {
  const exam = (bonusRight: boolean): Answered[] => {
    const out: Answered[] = unit2.vocab.slice(0, 10).map((v, i) => {
      const q = vocabTypeDeEn(v);
      return { partId: 'A', q, g: gradeQuestion(q, i === 0 ? 'xyz' : v.en) };
    });
    const extra = vocabTypeDeEn(unit2.vocab[0]);
    out.push({ partId: 'A', q: extra, g: gradeQuestion(extra, bonusRight ? unit2.vocab[0].en : 'nope'), bonus: true });
    return out;
  };

  it('wins back the lost point, keeps the mistake, and adds no points to the maximum', () => {
    const { result } = finishExam(defaultState(), unit2, exam(true), 1800);
    expect(result).toMatchObject({ points: 10, maxPoints: 10, bonus: { asked: 1, recovered: 1 } });
    expect(result.mistakes).toHaveLength(1);
    expect(result.newBadges).not.toContain('spelling-star');
    expect(finishExam(defaultState(), unit2, exam(false), 1800).result.points).toBe(9);
  });

  it('counts for the goal only when the parent allows it', () => {
    let s = defaultState();
    s = finishExam(s, unit2, exam(true), 1800).state;
    s = finishExam(s, unit2, exam(true), 1800).state;
    expect(goalStreak(s.results, 'unit2', s.settings.thresholds)).toBe(0);
    expect(goalStreak(s.results, 'unit2', s.settings.thresholds, true)).toBe(2);
  });
});
