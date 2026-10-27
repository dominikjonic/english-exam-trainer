import { useEffect, useState } from 'react';
import { c4Drop, c4Empty, c4Move, c4Winner, C4_COLS } from '../../lib/minigames';

/** You (🔴) against the monkey (🟡). Click a column to drop your disc. */
export function ConnectFour() {
  const [board, setBoard] = useState(c4Empty);
  const [monkeyTurn, setMonkeyTurn] = useState(false);
  const [score, setScore] = useState({ you: 0, monkey: 0 });
  const result = c4Winner(board);

  useEffect(() => {
    if (!monkeyTurn || result) return;
    const t = setTimeout(() => {
      setBoard((b) => {
        const col = c4Move(b, 'O');
        return col < 0 ? b : (c4Drop(b, col, 'O') ?? b);
      });
      setMonkeyTurn(false);
    }, 500);
    return () => clearTimeout(t);
  }, [monkeyTurn, result]);

  useEffect(() => {
    if (result === 'X') setScore((s) => ({ ...s, you: s.you + 1 }));
    if (result === 'O') setScore((s) => ({ ...s, monkey: s.monkey + 1 }));
  }, [result]);

  const drop = (col: number) => {
    if (result || monkeyTurn) return;
    const next = c4Drop(board, col, 'X');
    if (!next) return;
    setBoard(next);
    setMonkeyTurn(true);
  };

  return (
    <div className="game">
      <p>
        Du bist 🔴, der Affe ist 🟡. Wer zuerst vier in einer Reihe hat, gewinnt. · Du {score.you} : {score.monkey} Affe
      </p>
      <div className="c4-board" style={{ gridTemplateColumns: `repeat(${C4_COLS}, 1fr)` }}>
        {board.flatMap((row, r) =>
          row.map((c, col) => (
            <button key={`${r}-${col}`} className="c4-cell" onClick={() => drop(col)} disabled={!!result || monkeyTurn} aria-label={`Spalte ${col + 1}`}>
              {c && <span className="c4-disc" style={{ ['--rows' as string]: r + 1 }}>{c === 'X' ? '🔴' : '🟡'}</span>}
            </button>
          )),
        )}
      </div>
      <p>{result ? (result === 'X' ? 'Du hast gewonnen! 🎉' : result === 'O' ? 'Der Affe gewinnt. 🐒' : 'Unentschieden!') : monkeyTurn ? 'Der Affe überlegt …' : 'Du bist dran.'}</p>
      {result && (
        <button
          className="btn primary"
          onClick={() => {
            setBoard(c4Empty());
            // Whoever lost starts the next game.
            setMonkeyTurn(result === 'X');
          }}
        >
          Nochmal
        </button>
      )}
    </div>
  );
}
