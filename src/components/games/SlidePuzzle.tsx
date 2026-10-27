import { useState } from 'react';
import { puzzleNeighbours, puzzleSolved, shufflePuzzle } from '../../lib/minigames';

const FACES = ['', '🐒', '🦜', '🦒', '🐧', '🦁', '🐘', '🦓', '🐍'];

/** Slide the animals into the right order (as in the small picture) with the gap at the bottom right. */
export function SlidePuzzle() {
  const [tiles, setTiles] = useState(() => shufflePuzzle());
  const [moves, setMoves] = useState(0);
  const solved = puzzleSolved(tiles);

  const move = (i: number) => {
    const gap = tiles.indexOf(0);
    if (solved || !puzzleNeighbours(gap).includes(i)) return;
    const next = [...tiles];
    [next[gap], next[i]] = [next[i], next[gap]];
    setTiles(next);
    setMoves((m) => m + 1);
  };

  return (
    <div className="game">
      <p>
        Klick auf ein Tier neben der Lücke, um es zu schieben. · Züge: <b>{moves}</b>
      </p>
      <div className="slide-layout">
        <div className="slide-grid">
          {tiles.map((t, i) => (
            <button key={t} className={`slide-tile ${t ? '' : 'gap'}`} style={{ order: i }} onClick={() => move(i)} disabled={!t}>
              {FACES[t]}
            </button>
          ))}
        </div>
        <div>
          <div className="muted small">So soll es aussehen:</div>
          <div className="slide-goal">
            {[1, 2, 3, 4, 5, 6, 7, 8, 0].map((t) => (
              <span key={t}>{FACES[t]}</span>
            ))}
          </div>
        </div>
      </div>
      {solved && <p>Geschafft in {moves} Zügen! 🎉</p>}
      <button
        className={`btn ${solved ? 'primary' : ''}`}
        onClick={() => {
          setTiles(shufflePuzzle());
          setMoves(0);
        }}
      >
        Neu mischen
      </button>
    </div>
  );
}
