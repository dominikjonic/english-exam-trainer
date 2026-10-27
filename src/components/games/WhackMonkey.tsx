import { useEffect, useState } from 'react';

const HOLES = 9;
const ROUND_MS = 30_000;

/** Tap the monkeys before they hide again. Do not tap the lion! */
export function WhackMonkey() {
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [hole, setHole] = useState<{ i: number; lion: boolean; id: number } | null>(null);

  const left = Math.max(0, endsAt - now);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && left === 0) {
      setRunning(false);
      setHole(null);
      setBest((b) => Math.max(b, score));
    }
  }, [running, left, score]);

  // A new animal pops up; it gets faster the longer the round lasts.
  useEffect(() => {
    if (!running) return;
    const elapsed = ROUND_MS - (endsAt - Date.now());
    const stay = Math.max(450, 1100 - elapsed / 40);
    const t = setTimeout(() => {
      setHole((h) => {
        let i = Math.floor(Math.random() * HOLES);
        if (h && i === h.i) i = (i + 1) % HOLES;
        return { i, lion: Math.random() < 0.15, id: (h?.id ?? 0) + 1 };
      });
    }, hole ? stay : 300);
    return () => clearTimeout(t);
  }, [running, hole, endsAt]);

  const hit = (i: number) => {
    if (!running || !hole || hole.i !== i) return;
    setScore((s) => Math.max(0, s + (hole.lion ? -3 : 1)));
    setHole(null);
  };

  return (
    <div className="game">
      <p>
        Tippe die 🐒 an! Aber Vorsicht: Der 🦁 kostet 3 Punkte. · Punkte: <b>{score}</b> · Zeit: {Math.ceil(left / 1000)} s
        {best > 0 && <> · Rekord: {best}</>}
      </p>
      <div className="whack-grid">
        {Array.from({ length: HOLES }, (_, i) => (
          <button key={i} className="whack-hole" onClick={() => hit(i)} aria-label={`Loch ${i + 1}`}>
            {hole?.i === i ? (
              <span key={hole.id} className="whack-pop">
                {hole.lion ? '🦁' : '🐒'}
              </span>
            ) : (
              ''
            )}
          </button>
        ))}
      </div>
      {!running && (
        <button
          className="btn primary"
          onClick={() => {
            setScore(0);
            setHole(null);
            const t = Date.now();
            setNow(t);
            setEndsAt(t + ROUND_MS);
            setRunning(true);
          }}
        >
          {endsAt ? 'Nochmal' : 'Start'}
        </button>
      )}
    </div>
  );
}
