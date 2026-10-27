import { useEffect, useRef, useState } from 'react';
import { ArrowPad, keyDir, useKeys } from './useKeys';

const N = 14;
type P = { x: number; y: number };
type D = 'up' | 'down' | 'left' | 'right';
const STEP: Record<D, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<D, D> = { up: 'down', down: 'up', left: 'right', right: 'left' };

function freeSpot(snake: P[]): P {
  for (;;) {
    const p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
}

const startSnake = (): P[] => [
  { x: 5, y: 7 },
  { x: 4, y: 7 },
  { x: 3, y: 7 },
];

/** Classic snake: eat bananas, do not bite yourself or hit the fence. Arrow keys or WASD. */
export function Snake() {
  const [snake, setSnake] = useState<P[]>(startSnake);
  const [food, setFood] = useState<P>(() => freeSpot(startSnake()));
  const [state, setState] = useState<'ready' | 'run' | 'over'>('ready');
  const [best, setBest] = useState(0);
  const dir = useRef<D>('right');
  const queued = useRef<D[]>([]);

  const turn = (d: D) => {
    if (state === 'ready') setState('run');
    const last = queued.current[queued.current.length - 1] ?? dir.current;
    if (d !== last && d !== OPPOSITE[last] && queued.current.length < 3) queued.current.push(d);
  };
  useKeys((k) => {
    const d = keyDir(k);
    if (d) turn(d);
  });

  const score = snake.length - 3;
  useEffect(() => {
    if (state !== 'run') return;
    const t = setTimeout(() => {
      dir.current = queued.current.shift() ?? dir.current;
      const head = { x: snake[0].x + STEP[dir.current].x, y: snake[0].y + STEP[dir.current].y };
      const eats = head.x === food.x && head.y === food.y;
      const body = eats ? snake : snake.slice(0, -1);
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || body.some((s) => s.x === head.x && s.y === head.y)) {
        setState('over');
        setBest((b) => Math.max(b, score));
        return;
      }
      const next = [head, ...body];
      setSnake(next);
      if (eats) setFood(freeSpot(next));
    }, Math.max(90, 170 - score * 4));
    return () => clearTimeout(t);
  }, [state, snake, food, score]);

  const restart = () => {
    const s = startSnake();
    setSnake(s);
    setFood(freeSpot(s));
    dir.current = 'right';
    queued.current = [];
    setState('ready');
  };

  const cells: string[] = Array(N * N).fill('');
  snake.forEach((s, i) => (cells[s.y * N + s.x] = i === 0 ? 'head' : 'body'));
  return (
    <div className="game">
      <p>
        Steuern mit den Pfeiltasten (oder W A S D). · Bananen: <b>{score}</b>
        {best > 0 && <> · Rekord: {best}</>}
      </p>
      <div className="snake-board" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {cells.map((c, i) => (
          <div key={i} className={`snake-cell ${c}`}>
            {c === 'head' ? '🐍' : i === food.y * N + food.x ? '🍌' : ''}
          </div>
        ))}
      </div>
      {state === 'ready' && <p className="muted small">Drück eine Pfeiltaste, um loszulegen.</p>}
      {state === 'over' && (
        <div className="game-over">
          <p>Autsch! {score} Bananen gefressen.</p>
          <button className="btn primary" onClick={restart}>
            Nochmal
          </button>
        </div>
      )}
      <ArrowPad onDir={turn} />
    </div>
  );
}
