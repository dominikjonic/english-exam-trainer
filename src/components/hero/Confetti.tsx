import { useMemo } from 'react';

const COLORS = ['#ffc93c', '#ff4d5e', '#4db3ff', '#4ddc8a', '#ffffff', '#b47cff'];

/** A short burst of falling confetti over its parent, for a good grade. */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.4,
        rot: Math.random() * 720 - 360,
        drift: Math.random() * 120 - 60,
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [pieces],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className={b.round ? 'round' : ''}
          style={
            {
              left: `${b.left}%`,
              background: b.color,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
              '--rot': `${b.rot}deg`,
              '--drift': `${b.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
