import { useState } from 'react';
import { addRandomTile, canMove, slideGrid, ZOO_TILES, type Dir, type Grid } from '../../lib/minigames';
import { ArrowPad, keyDir, useKeys } from './useKeys';

const newGrid = (): Grid => addRandomTile(addRandomTile(Array.from({ length: 4 }, () => [0, 0, 0, 0])));

/** 2048 with animals: two equal animals become the next bigger one. Goal: the lion. */
export function Zoo2048() {
  const [grid, setGrid] = useState(newGrid);
  const [points, setPoints] = useState(0);
  const [best, setBest] = useState(0);
  const over = !canMove(grid);
  const top = Math.max(...grid.flat());

  const move = (d: Dir) => {
    if (over) return;
    const r = slideGrid(grid, d);
    if (!r.moved) return;
    const next = addRandomTile(r.grid);
    setGrid(next);
    setPoints((p) => p + r.points);
    if (!canMove(next)) setBest((b) => Math.max(b, points + r.points));
  };
  useKeys((k) => {
    const d = keyDir(k);
    if (d) move(d);
  });

  return (
    <div className="game">
      <p>
        Pfeiltasten schieben alle Tiere. Zwei gleiche werden zum nächsten Tier. · Punkte: <b>{points}</b>
        {best > 0 && <> · Rekord: {best}</>}
      </p>
      <div className="zoo-chain small">
        {ZOO_TILES.map((t, i) => (
          <span key={t} className={i < top ? 'reached' : ''}>
            {t}
          </span>
        ))}
      </div>
      <div className="zoo-grid">
        {grid.flat().map((v, i) => (
          <div key={i} className={`zoo-tile level-${Math.min(v, 10)}`}>
            {v ? (
              <span key={v} className="pop-in">
                {ZOO_TILES[v - 1] ?? '⭐'}
              </span>
            ) : (
              ''
            )}
          </div>
        ))}
      </div>
      {top >= ZOO_TILES.length && <p>Du hast den Löwen erreicht! 🦁🎉</p>}
      {over && <p>Keine Züge mehr möglich.</p>}
      <div className="row">
        <ArrowPad onDir={move} />
        <button
          className={`btn ${over ? 'primary' : ''}`}
          onClick={() => {
            setGrid(newGrid());
            setPoints(0);
          }}
        >
          Neues Spiel
        </button>
      </div>
    </div>
  );
}
