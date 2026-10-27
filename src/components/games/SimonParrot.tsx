import { useEffect, useState } from 'react';

const PADS = [
  { emoji: '🦜', color: '#e5484d', name: 'rot' },
  { emoji: '🐸', color: '#30a46c', name: 'grün' },
  { emoji: '🐳', color: '#3e8ed0', name: 'blau' },
  { emoji: '🐥', color: '#f5c518', name: 'gelb' },
];

type Phase = 'idle' | 'show' | 'input' | 'over';

/** The parrot shows a colour sequence that gets one step longer each round. Repeat it! */
export function SimonParrot() {
  const [seq, setSeq] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [lit, setLit] = useState<number | null>(null);
  const [pos, setPos] = useState(0);
  const [best, setBest] = useState(0);

  // Play the sequence back.
  useEffect(() => {
    if (phase !== 'show') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const speed = Math.max(300, 650 - seq.length * 25);
    seq.forEach((p, k) => {
      timers.push(setTimeout(() => setLit(p), 500 + k * speed * 1.4));
      timers.push(setTimeout(() => setLit(null), 500 + k * speed * 1.4 + speed));
    });
    timers.push(
      setTimeout(
        () => {
          setPhase('input');
          setPos(0);
        },
        500 + seq.length * speed * 1.4,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, seq]);

  const start = () => {
    setSeq([Math.floor(Math.random() * 4)]);
    setPhase('show');
  };

  const press = (p: number) => {
    if (phase !== 'input') return;
    setLit(p);
    setTimeout(() => setLit((l) => (l === p ? null : l)), 200);
    if (seq[pos] !== p) {
      setBest((b) => Math.max(b, seq.length - 1));
      setPhase('over');
      return;
    }
    if (pos + 1 === seq.length) {
      setSeq((s) => [...s, Math.floor(Math.random() * 4)]);
      setTimeout(() => setPhase('show'), 400);
      setPhase('idle');
    } else setPos(pos + 1);
  };

  const score = Math.max(0, seq.length - 1);
  return (
    <div className="game">
      <p>
        {phase === 'show'
          ? 'Gut aufpassen …'
          : phase === 'input'
            ? 'Jetzt du! Drück die Felder in der gleichen Reihenfolge.'
            : phase === 'over'
              ? `Ups, falsch! Du hast ${score} geschafft.`
              : seq.length
                ? 'Richtig! Es kommt eins dazu …'
                : 'Der Papagei zeigt dir eine Farbfolge. Merk sie dir!'}{' '}
        · Länge: <b>{seq.length}</b>
        {best > 0 && <> · Rekord: {best}</>}
      </p>
      <div className="simon-grid">
        {PADS.map((p, i) => (
          <button
            key={i}
            className={`simon-pad ${lit === i ? 'lit' : ''}`}
            style={{ background: p.color }}
            onClick={() => press(i)}
            disabled={phase !== 'input'}
            aria-label={p.name}
          >
            {p.emoji}
          </button>
        ))}
      </div>
      {(phase === 'over' || (phase === 'idle' && !seq.length)) && (
        <button className="btn primary" onClick={start}>
          {seq.length ? 'Nochmal' : 'Start'}
        </button>
      )}
    </div>
  );
}
