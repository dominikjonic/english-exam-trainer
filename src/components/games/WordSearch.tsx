import { useMemo, useState } from 'react';
import type { VocabItem } from '../../data/types';
import { buildWordSearch, lineCells } from '../../lib/minigames';
import { sample } from '../../lib/random';

const SIZE = 10;

/** Find the hidden English words: click the first and the last letter. */
export function WordSearch({ vocab }: { vocab: VocabItem[] }) {
  const [round, setRound] = useState(0);
  const { grid, placed, items } = useMemo(() => {
    const items = sample(
      vocab.filter((v) => /^[a-z]{3,9}$/i.test(v.en)),
      7,
    );
    return { ...buildWordSearch(items.map((v) => v.en), SIZE), items };
    // A new grid for each round.
  }, [vocab, round]);
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<number | null>(null);
  const [miss, setMiss] = useState<number[]>([]);

  const foundCells = new Set(placed.filter((p) => found.includes(p.word)).flatMap((p) => p.cells));
  const done = placed.length > 0 && found.length === placed.length;

  const click = (i: number) => {
    if (start === null) {
      setStart(i);
      setMiss([]);
      return;
    }
    const cells = lineCells(start, i, SIZE);
    setStart(null);
    const hit =
      cells &&
      placed.find(
        (p) =>
          !found.includes(p.word) &&
          p.cells.length === cells.length &&
          (p.cells.every((c, k) => c === cells[k]) || p.cells.every((c, k) => c === cells[cells.length - 1 - k])),
      );
    if (hit) setFound((f) => [...f, hit.word]);
    else setMiss(cells ?? [i]);
  };

  return (
    <div className="game">
      <p>Klick auf den ersten und dann auf den letzten Buchstaben eines Wortes.</p>
      <div className="ws-layout">
        <div className="ws-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {grid.map((ch, i) => (
            <button
              key={`${round}-${i}`}
              className={`ws-cell ${foundCells.has(i) ? 'found' : ''} ${start === i ? 'start' : ''} ${miss.includes(i) ? 'miss' : ''}`}
              onClick={() => click(i)}
            >
              {ch}
            </button>
          ))}
        </div>
        <ul className="ws-list">
          {placed.map((p) => {
            const v = items.find((x) => x.en.toUpperCase() === p.word);
            return (
              <li key={p.word} className={found.includes(p.word) ? 'found' : ''}>
                {found.includes(p.word) ? <b>{v?.en}</b> : '???'} <span className="muted small">({v?.de})</span>
              </li>
            );
          })}
        </ul>
      </div>
      {done && (
        <div className="game-over">
          <p>Alle Wörter gefunden! 🎉</p>
          <button
            className="btn primary"
            onClick={() => {
              setFound([]);
              setStart(null);
              setMiss([]);
              setRound((r) => r + 1);
            }}
          >
            Neues Gitter
          </button>
        </div>
      )}
    </div>
  );
}
