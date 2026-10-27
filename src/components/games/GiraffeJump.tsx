import { useEffect, useRef, useState } from 'react';
import { useKeys } from './useKeys';

const WIDTH = 600;
const GROUND = 0;
const GRAVITY = 2400;
const JUMP = 820;
const GIRAFFE_X = 60;
const GIRAFFE_W = 40;

interface Obstacle {
  x: number;
  w: number;
  h: number;
  emoji: string;
}

/** Endless runner: jump over the stones with space, arrow up or a click. */
export function GiraffeJump() {
  const [, setFrame] = useState(0);
  const [state, setState] = useState<'ready' | 'run' | 'over'>('ready');
  const [best, setBest] = useState(0);
  const game = useRef({ y: GROUND, vy: 0, obstacles: [] as Obstacle[], distance: 0, nextIn: 1.2 });

  const jump = () => {
    const g = game.current;
    if (state === 'over') return;
    if (state === 'ready') setState('run');
    if (g.y <= GROUND + 0.5) g.vy = JUMP;
  };
  useKeys((k) => (k === ' ' || k === 'ArrowUp') && jump());

  useEffect(() => {
    if (state !== 'run') return;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const g = game.current;
      const speed = 260 + g.distance / 12;
      g.distance += speed * dt;
      g.vy -= GRAVITY * dt;
      g.y = Math.max(GROUND, g.y + g.vy * dt);
      if (g.y === GROUND) g.vy = Math.max(0, g.vy);
      for (const o of g.obstacles) o.x -= speed * dt;
      g.obstacles = g.obstacles.filter((o) => o.x + o.w > -10);
      g.nextIn -= dt;
      if (g.nextIn <= 0) {
        const big = Math.random() < 0.3;
        g.obstacles.push({ x: WIDTH, w: big ? 44 : 30, h: big ? 44 : 30, emoji: big ? '🪨' : Math.random() < 0.5 ? '🪨' : '🌵' });
        g.nextIn = 0.9 + Math.random() * 1.1 - Math.min(0.4, g.distance / 20000);
      }
      const hit = g.obstacles.some(
        (o) => o.x < GIRAFFE_X + GIRAFFE_W - 8 && o.x + o.w > GIRAFFE_X + 8 && g.y < o.h - 6,
      );
      if (hit) {
        setState('over');
        setBest((b) => Math.max(b, Math.floor(g.distance / 50)));
      }
      setFrame((f) => f + 1);
      if (!hit) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  const restart = () => {
    game.current = { y: GROUND, vy: 0, obstacles: [], distance: 0, nextIn: 1.2 };
    setState('ready');
    setFrame(0);
  };

  const g = game.current;
  const meters = Math.floor(g.distance / 50);
  return (
    <div className="game">
      <p>
        Springen mit der Leertaste, Pfeil nach oben oder Klick ins Bild. · <b>{meters} m</b>
        {best > 0 && <> · Rekord: {best} m</>}
      </p>
      <div className="jump-scene" onPointerDown={jump} role="button" aria-label="Springen">
        <span className="jump-giraffe" style={{ left: GIRAFFE_X, bottom: 20 + g.y }}>
          🦒
        </span>
        {g.obstacles.map((o, i) => (
          <span key={i} className="jump-obstacle" style={{ left: o.x, bottom: 20, fontSize: o.h, lineHeight: 1 }}>
            {o.emoji}
          </span>
        ))}
        <div className="jump-ground" />
        {state === 'ready' && <div className="jump-msg">Drück die Leertaste zum Starten!</div>}
        {state === 'over' && <div className="jump-msg">Bumm! {meters} m geschafft.</div>}
      </div>
      {state === 'over' && (
        <button className="btn primary" onClick={restart}>
          Nochmal
        </button>
      )}
    </div>
  );
}
