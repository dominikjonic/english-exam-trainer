import type { VocabItem } from '../data/types';

/** Leitner boxes 1–5. Box 0 means "new, not learned yet". */
export interface Card {
  box: number;
  /** Day (YYYY-MM-DD) when the card is due again. */
  due: string;
  right: number;
  wrong: number;
}

export type CardDir = 'de-en' | 'en-de';
export type Deck = Record<string, Card>;

/** Days until a card in a box is asked again. */
export const BOX_INTERVAL = [0, 1, 2, 4, 7, 14];
export const MAX_BOX = 5;
/** New cards introduced per day, so a fresh deck is not overwhelming. */
export const NEW_PER_DAY = 12;

export const cardKey = (vocabId: string, dir: CardDir) => `${vocabId}|${dir}`;

export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function newCard(day = today()): Card {
  return { box: 0, due: day, right: 0, wrong: 0 };
}

export function answerCard(card: Card, correct: boolean, day = today()): Card {
  if (correct) {
    const box = Math.min(MAX_BOX, Math.max(1, card.box + 1));
    return { ...card, box, due: addDays(day, BOX_INTERVAL[box]), right: card.right + 1 };
  }
  return { ...card, box: 1, due: addDays(day, BOX_INTERVAL[1]), wrong: card.wrong + 1 };
}

/** Wrong in the exam: back to box 1 and due today. */
export function demoteCard(card: Card | undefined, day = today()): Card {
  const c = card ?? newCard(day);
  return { ...c, box: 1, due: day, wrong: c.wrong + 1 };
}

/** All cards of a unit (both directions), creating missing ones. */
export function fullDeck(vocab: VocabItem[], deck: Deck, day = today()): Deck {
  const out: Deck = {};
  for (const v of vocab) {
    for (const dir of ['de-en', 'en-de'] as CardDir[]) {
      const k = cardKey(v.id, dir);
      out[k] = deck[k] ?? newCard(day);
    }
  }
  return out;
}

/** Cards to practise today: due cards from low boxes first, then a few new ones. */
export function dueCards(vocab: VocabItem[], deck: Deck, day = today()): string[] {
  const all = fullDeck(vocab, deck, day);
  const entries = Object.entries(all);
  const due = entries
    .filter(([, c]) => c.box > 0 && c.due <= day)
    .sort((a, b) => a[1].box - b[1].box || a[1].due.localeCompare(b[1].due))
    .map(([k]) => k);
  // New cards: German → English first, so writing is practised from the start.
  const fresh = entries
    .filter(([, c]) => c.box === 0)
    .sort((a, b) => (a[0].endsWith('de-en') ? 0 : 1) - (b[0].endsWith('de-en') ? 0 : 1))
    .slice(0, NEW_PER_DAY)
    .map(([k]) => k);
  return [...due, ...fresh];
}

export function boxCounts(vocab: VocabItem[], deck: Deck): number[] {
  const counts = [0, 0, 0, 0, 0, 0];
  for (const c of Object.values(fullDeck(vocab, deck))) counts[c.box] += 1;
  return counts;
}
