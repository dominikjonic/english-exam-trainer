import { useEffect, useMemo, useState } from 'react';
import { shuffle } from '../lib/random';

const CARDS = [
  { emoji: '🦁', word: 'lion' },
  { emoji: '🐒', word: 'monkey' },
  { emoji: '🦜', word: 'parrot' },
  { emoji: '🦒', word: 'giraffe' },
  { emoji: '🐧', word: 'penguin' },
  { emoji: '🌳', word: 'tree' },
];

interface Card {
  id: number;
  pair: number;
  face: string;
}

/** Memory: find the picture and its English word. Just for fun, not graded. */
export function MemoryGame() {
  const [round, setRound] = useState(0);
  const cards = useMemo<Card[]>(
    () =>
      shuffle(
        CARDS.flatMap((c, i) => [
          { id: i * 2, pair: i, face: c.emoji },
          { id: i * 2 + 1, pair: i, face: c.word },
        ]),
      ),
    // A new deck for each round.
    [round],
  );
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((id) => cards.find((c) => c.id === id)!);
    const t = setTimeout(
      () => {
        if (a.pair === b.pair) setFound((f) => [...f, a.pair]);
        setOpen([]);
      },
      a.pair === b.pair ? 300 : 900,
    );
    return () => clearTimeout(t);
  }, [open, cards]);

  const done = found.length === CARDS.length;
  return (
    <div className="memory">
      <p>Finde immer das Tier und sein englisches Wort!</p>
      <div className="memory-grid">
        {cards.map((c) => {
          const visible = open.includes(c.id) || found.includes(c.pair);
          return (
            <button
              key={`${round}-${c.id}`}
              className={`memory-card ${visible ? 'visible' : ''} ${found.includes(c.pair) ? 'found' : ''}`}
              disabled={visible || open.length === 2}
              onClick={() => setOpen((o) => [...o, c.id])}
            >
              {visible ? c.face : '?'}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="memory-done">
          <p>Super, alle gefunden! 🎉</p>
          <button
            className="btn"
            onClick={() => {
              setFound([]);
              setOpen([]);
              setRound((r) => r + 1);
            }}
          >
            Nochmal spielen
          </button>
        </div>
      )}
    </div>
  );
}
