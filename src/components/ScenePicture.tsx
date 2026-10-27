import type { ReactNode } from 'react';
import type { Preposition } from '../data/types';
import { animalOf, type Scene } from '../lib/questions';

interface Pos {
  x: number;
  y: number;
  size: number;
  /** Drawn before the object, so the object hides part of the animal. */
  back: boolean;
}

/**
 * Where the animal sits for each object and preposition (viewBox 300 × 215).
 * "behind" is drawn smaller and further back, so only the head shows;
 * "in front of" is drawn bigger and lower than "under".
 */
const POSITIONS: Record<'box' | 'table', Partial<Record<Preposition, Pos>>> = {
  table: {
    on: { x: 150, y: 70, size: 46, back: false },
    under: { x: 150, y: 150, size: 32, back: false },
    'next to': { x: 255, y: 146, size: 46, back: false },
    behind: { x: 182, y: 84, size: 36, back: true },
    'in front of': { x: 150, y: 180, size: 56, back: false },
  },
  box: {
    in: { x: 152, y: 94, size: 46, back: false },
    on: { x: 155, y: 72, size: 46, back: false },
    'next to': { x: 255, y: 146, size: 46, back: false },
    behind: { x: 186, y: 80, size: 34, back: true },
    'in front of': { x: 150, y: 180, size: 56, back: false },
  },
};

function spread(p: Pos, count: number, prep: Preposition): Pos[] {
  if (count <= 1) return [p];
  const step = Math.min(34, p.size * 0.75);
  if (prep === 'next to') {
    // Animals on both sides of the object.
    const xs = [245, 280, 55, 20];
    return xs.slice(0, count).map((x) => ({ ...p, x, size: p.size * 0.8 }));
  }
  const width = step * (count - 1);
  return Array.from({ length: count }, (_, i) => ({ ...p, x: p.x - width / 2 + i * step, size: p.size * 0.8 }));
}

function Table() {
  return (
    <g>
      <rect x="96" y="104" width="8" height="66" fill="#8b5a2b" />
      <rect x="196" y="104" width="8" height="66" fill="#8b5a2b" />
      <rect x="84" y="94" width="132" height="12" rx="3" fill="#a0672f" />
      {/* tablecloth front, so an animal behind the table is partly hidden */}
      <path d="M86 104 H214 V124 Q200 132 186 124 Q172 132 158 124 Q144 132 130 124 Q116 132 102 124 Q94 130 86 124 Z" fill="#e85d5d" />
    </g>
  );
}

function BoxBack({ open }: { open: boolean }) {
  return open ? <path d="M100 104 L118 90 H218 L200 104 Z" fill="#6b4423" /> : null;
}

function BoxFront({ open }: { open: boolean }) {
  return (
    <g>
      {!open && <path d="M100 104 L118 90 H218 L200 104 Z" fill="#d9a25f" stroke="#8b5a2b" strokeWidth="2" />}
      <path d="M200 104 L218 90 V156 L200 170 Z" fill="#b97f3d" stroke="#8b5a2b" strokeWidth="2" />
      <rect x="100" y="104" width="100" height="66" fill="#d08f45" stroke="#8b5a2b" strokeWidth="2" />
      <line x1="100" y1="126" x2="200" y2="126" stroke="#8b5a2b" strokeWidth="2" />
      <line x1="100" y1="148" x2="200" y2="148" stroke="#8b5a2b" strokeWidth="2" />
    </g>
  );
}

export function ScenePicture({ scene, small = false }: { scene: Scene; small?: boolean }) {
  const pos = POSITIONS[scene.object][scene.prep] ?? POSITIONS[scene.object]['next to']!;
  const animal = animalOf(scene.animal);
  const all = spread(pos, scene.count, scene.prep);
  const draw = (p: Pos, i: number): ReactNode => (
    <g key={i}>
      {!p.back && scene.prep !== 'in' && (
        <ellipse cx={p.x} cy={p.y + p.size * 0.45} rx={p.size * 0.38} ry={4} fill="rgba(0,0,0,0.18)" />
      )}
      <text x={p.x} y={p.y} fontSize={p.size} textAnchor="middle" dominantBaseline="central">
        {animal.emoji}
      </text>
    </g>
  );
  const open = scene.object === 'box' && scene.prep === 'in';
  return (
    <svg
      className={small ? 'scene scene-small' : 'scene'}
      viewBox="0 0 300 215"
      role="img"
      aria-label="Bild mit Tier und Gegenstand"
    >
      <rect width="300" height="215" fill="#dff3ff" />
      <rect y="165" width="300" height="50" fill="#a7d98a" />
      {pos.back && all.map(draw)}
      {scene.object === 'table' ? (
        <Table />
      ) : (
        <>
          <BoxBack open={open} />
          {open && all.map(draw)}
          <BoxFront open={open} />
        </>
      )}
      {!pos.back && !open && all.map(draw)}
    </svg>
  );
}
