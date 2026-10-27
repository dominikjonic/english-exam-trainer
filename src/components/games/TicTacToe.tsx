import { useEffect, useState } from 'react';
import { tttMove, tttWinner, type Cell } from '../../lib/minigames';

/** You (🐵 = X) against the lion (🦁 = O). Whoever lost starts the next game. */
export function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [lionStarts, setLionStarts] = useState(false);
  const [score, setScore] = useState({ you: 0, lion: 0, draw: 0 });
  const result = tttWinner(board);
  const filled = board.filter(Boolean).length;
  const lionTurn = !result && (filled % 2 === 1) !== lionStarts;

  useEffect(() => {
    if (!lionTurn) return;
    const t = setTimeout(() => {
      setBoard((b) => {
        const m = tttMove(b, 'O');
        return m < 0 ? b : b.map((c, i) => (i === m ? 'O' : c));
      });
    }, 450);
    return () => clearTimeout(t);
  }, [lionTurn]);

  useEffect(() => {
    if (!result) return;
    setScore((s) => (result === 'X' ? { ...s, you: s.you + 1 } : result === 'O' ? { ...s, lion: s.lion + 1 } : { ...s, draw: s.draw + 1 }));
  }, [result]);

  const play = (i: number) => {
    if (result || lionTurn || board[i]) return;
    setBoard(board.map((c, j) => (j === i ? 'X' : c)));
  };

  return (
    <div className="game">
      <p>
        Du bist 🐵, der Löwe ist 🦁. · Du {score.you} : {score.lion} Löwe
        {score.draw > 0 && <> · Unentschieden {score.draw}</>}
      </p>
      <div className="ttt-grid">
        {board.map((c, i) => (
          <button key={i} className="ttt-cell" onClick={() => play(i)} disabled={!!c || !!result || lionTurn}>
            {c === 'X' ? '🐵' : c === 'O' ? '🦁' : ''}
          </button>
        ))}
      </div>
      <p>{result ? (result === 'X' ? 'Du hast gewonnen! 🎉' : result === 'O' ? 'Der Löwe gewinnt. 🦁' : 'Unentschieden!') : lionTurn ? 'Der Löwe überlegt …' : 'Du bist dran.'}</p>
      {result && (
        <button
          className="btn primary"
          onClick={() => {
            setLionStarts(result === 'O' ? false : result === 'X' ? true : !lionStarts);
            setBoard(Array(9).fill(null));
          }}
        >
          Nochmal
        </button>
      )}
    </div>
  );
}
