import { useEffect, useRef } from 'react';

/** Calls the handler on key presses; arrow keys and space do not scroll the page. */
export function useKeys(handler: (key: string) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      ref.current(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Maps arrow keys and WASD to a direction. */
export function keyDir(key: string): 'up' | 'down' | 'left' | 'right' | null {
  switch (key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      return 'up';
    case 'arrowdown':
    case 's':
      return 'down';
    case 'arrowleft':
    case 'a':
      return 'left';
    case 'arrowright':
    case 'd':
      return 'right';
    default:
      return null;
  }
}

/** On-screen arrow buttons for players without a keyboard. */
export function ArrowPad({ onDir }: { onDir: (d: 'up' | 'down' | 'left' | 'right') => void }) {
  return (
    <div className="arrow-pad">
      <button className="btn" onClick={() => onDir('up')} aria-label="hoch">
        ▲
      </button>
      <button className="btn" onClick={() => onDir('left')} aria-label="links">
        ◀
      </button>
      <button className="btn" onClick={() => onDir('down')} aria-label="runter">
        ▼
      </button>
      <button className="btn" onClick={() => onDir('right')} aria-label="rechts">
        ▶
      </button>
    </div>
  );
}
