import { shuffle } from './random';

/**
 * Break games. They are unlocked by the total XP earned so far (XP is not
 * spent, so the level never goes down). Playing them never earns XP.
 */
export interface MiniGameInfo {
  id: string;
  emoji: string;
  title: string;
  description: string;
  /** Total XP needed to unlock; 0 = free from the start. */
  unlockXp: number;
}

export const MINI_GAMES: MiniGameInfo[] = [
  { id: 'memory', emoji: '🃏', title: 'Memory', description: 'Finde das Tier und sein englisches Wort.', unlockXp: 0 },
  { id: 'hangman', emoji: '🐧', title: 'Pinguin-Rätsel', description: 'Errate das Wort, bevor die Eisscholle schmilzt.', unlockXp: 50 },
  { id: 'wordsearch', emoji: '🔍', title: 'Wortsuche', description: 'Finde die englischen Wörter im Buchstabengitter.', unlockXp: 120 },
  { id: 'whack', emoji: '🐒', title: 'Affen-Klopfen', description: 'Tippe die Affen an, bevor sie wieder verschwinden.', unlockXp: 200 },
  { id: 'simon', emoji: '🦜', title: 'Papageien-Echo', description: 'Merk dir die Farbfolge und mach sie nach.', unlockXp: 300 },
  { id: 'tictactoe', emoji: '❌', title: 'Tic-Tac-Toe', description: 'Drei in einer Reihe – gegen den Löwen.', unlockXp: 400 },
  { id: 'slide', emoji: '🧩', title: 'Schiebepuzzle', description: 'Schieb die Tiere in die richtige Reihenfolge.', unlockXp: 550 },
  { id: 'snake', emoji: '🐍', title: 'Wildpark-Schlange', description: 'Friss Bananen und werde immer länger.', unlockXp: 700 },
  { id: 'jump', emoji: '🦒', title: 'Giraffen-Sprung', description: 'Spring über die Steine, so weit du kannst.', unlockXp: 900 },
  { id: 'connect4', emoji: '🔴', title: 'Vier gewinnt', description: 'Vier in einer Reihe – gegen den Affen.', unlockXp: 1150 },
  { id: 'zoo2048', emoji: '🦁', title: 'Zoo-2048', description: 'Schieb gleiche Tiere zusammen bis zum Löwen.', unlockXp: 1400 },
];

export function isUnlocked(game: MiniGameInfo, xp: number): boolean {
  return xp >= game.unlockXp;
}

/** Games unlocked by going from `before` to `after` XP. */
export function newlyUnlocked(before: number, after: number): MiniGameInfo[] {
  return MINI_GAMES.filter((g) => g.unlockXp > before && g.unlockXp <= after);
}

export function nextLocked(xp: number): MiniGameInfo | undefined {
  return MINI_GAMES.find((g) => !isUnlocked(g, xp));
}

// ------------------------------------------------------------ tic-tac-toe

export type Cell = 'X' | 'O' | null;

const LINES3 = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function tttWinner(b: Cell[]): Cell | 'draw' {
  for (const [a, c, d] of LINES3) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'draw' : null;
}

/**
 * The lion's move: win if possible, block if needed, otherwise a good free
 * field. Sometimes it picks randomly so that it can be beaten.
 */
export function tttMove(b: Cell[], me: 'X' | 'O', mistakeChance = 0.25, rnd = Math.random): number {
  const free = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return -1;
  const other: 'X' | 'O' = me === 'X' ? 'O' : 'X';
  const wins = (who: 'X' | 'O') => free.find((i) => tttWinner(b.map((c, j) => (j === i ? who : c))) === who);
  const win = wins(me);
  if (win !== undefined) return win;
  if (rnd() < mistakeChance) return free[Math.floor(rnd() * free.length)];
  const block = wins(other);
  if (block !== undefined) return block;
  for (const i of [4, 0, 2, 6, 8, 1, 3, 5, 7]) if (free.includes(i)) return i;
  return free[0];
}

// ------------------------------------------------------------ connect four

export const C4_ROWS = 6;
export const C4_COLS = 7;
/** board[row][col], row 0 is the top. */
export type C4Board = Cell[][];

export function c4Empty(): C4Board {
  return Array.from({ length: C4_ROWS }, () => Array<Cell>(C4_COLS).fill(null));
}

/** Drops a disc; returns the new board, or null if the column is full. */
export function c4Drop(b: C4Board, col: number, who: 'X' | 'O'): C4Board | null {
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (!b[r][col]) {
      const next = b.map((row) => [...row]);
      next[r][col] = who;
      return next;
    }
  }
  return null;
}

export function c4Winner(b: C4Board): Cell | 'draw' {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < C4_ROWS; r++)
    for (let c = 0; c < C4_COLS; c++) {
      const who = b[r][c];
      if (!who) continue;
      for (const [dr, dc] of dirs) {
        let n = 1;
        while (n < 4 && b[r + dr * n]?.[c + dc * n] === who) n++;
        if (n === 4) return who;
      }
    }
  return b[0].every(Boolean) ? 'draw' : null;
}

/** The monkey's move: win, block, avoid giving away a win, prefer the middle. */
export function c4Move(b: C4Board, me: 'X' | 'O', rnd = Math.random): number {
  const other: 'X' | 'O' = me === 'X' ? 'O' : 'X';
  const cols = [...Array(C4_COLS).keys()].filter((c) => !b[0][c]);
  if (!cols.length) return -1;
  for (const who of [me, other]) {
    const c = cols.find((col) => c4Winner(c4Drop(b, col, who)!) === who);
    if (c !== undefined) return c;
  }
  const safe = cols.filter((col) => {
    const after = c4Drop(b, col, me)!;
    return !after[0].some((_, c2) => {
      const o = c4Drop(after, c2, other);
      return o && c4Winner(o) === other;
    });
  });
  const pool = safe.length ? safe : cols;
  const score = (c: number) => 4 - Math.abs(3 - c) + rnd() * 2.5;
  return pool.reduce((best, c) => (score(c) > score(best) ? c : best));
}

// ------------------------------------------------------------ 2048

/** From mouse to lion: the lion is tile 10 (1024 in classic 2048). */
export const ZOO_TILES = ['🐭', '🐰', '🐱', '🐶', '🦊', '🐧', '🦜', '🐒', '🦒', '🦁'];

/** 4x4 grid of tile levels (0 = empty, 1 = 🐭, 2 = 🐰, ...). */
export type Grid = number[][];
export type Dir = 'left' | 'right' | 'up' | 'down';

function slideRow(row: number[]): { row: number[]; merged: number } {
  const tiles = row.filter(Boolean);
  const out: number[] = [];
  let merged = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === tiles[i + 1]) {
      out.push(tiles[i] + 1);
      merged += 2 ** (tiles[i] + 1);
      i++;
    } else out.push(tiles[i]);
  }
  while (out.length < row.length) out.push(0);
  return { row: out, merged };
}

const transpose = (g: Grid): Grid => g[0].map((_, c) => g.map((row) => row[c]));

/** Moves all tiles; returns the new grid, the points for merges and whether anything moved. */
export function slideGrid(g: Grid, dir: Dir): { grid: Grid; points: number; moved: boolean } {
  let rows = dir === 'up' || dir === 'down' ? transpose(g) : g.map((r) => [...r]);
  const reverse = dir === 'right' || dir === 'down';
  let points = 0;
  rows = rows.map((r) => {
    const { row, merged } = slideRow(reverse ? [...r].reverse() : r);
    points += merged;
    return reverse ? row.reverse() : row;
  });
  const grid = dir === 'up' || dir === 'down' ? transpose(rows) : rows;
  const moved = grid.some((r, i) => r.some((v, j) => v !== g[i][j]));
  return { grid, points, moved };
}

export function addRandomTile(g: Grid, rnd = Math.random): Grid {
  const empty: [number, number][] = [];
  g.forEach((r, i) => r.forEach((v, j) => !v && empty.push([i, j])));
  if (!empty.length) return g;
  const [i, j] = empty[Math.floor(rnd() * empty.length)];
  const next = g.map((r) => [...r]);
  next[i][j] = rnd() < 0.9 ? 1 : 2;
  return next;
}

export function canMove(g: Grid): boolean {
  return (['left', 'right', 'up', 'down'] as Dir[]).some((d) => slideGrid(g, d).moved);
}

// ------------------------------------------------------------ slide puzzle

/** Tiles 1..8 and 0 for the gap; solved = [1..8, 0]. */
export function puzzleSolved(tiles: number[]): boolean {
  return tiles.every((t, i) => t === (i === tiles.length - 1 ? 0 : i + 1));
}

export function puzzleNeighbours(gap: number, size = 3): number[] {
  const r = Math.floor(gap / size);
  const c = gap % size;
  const out: number[] = [];
  if (r > 0) out.push(gap - size);
  if (r < size - 1) out.push(gap + size);
  if (c > 0) out.push(gap - 1);
  if (c < size - 1) out.push(gap + 1);
  return out;
}

/** Shuffles by making random legal moves, so the puzzle is always solvable. */
export function shufflePuzzle(moves = 80, size = 3, rnd = Math.random): number[] {
  const n = size * size;
  let tiles = [...Array(n).keys()].map((i) => (i === n - 1 ? 0 : i + 1));
  let last = -1;
  for (let k = 0; k < moves || puzzleSolved(tiles); k++) {
    const gap = tiles.indexOf(0);
    const options = puzzleNeighbours(gap, size).filter((x) => x !== last);
    const pick = options[Math.floor(rnd() * options.length)];
    tiles = [...tiles];
    [tiles[gap], tiles[pick]] = [tiles[pick], tiles[gap]];
    last = gap;
  }
  return tiles;
}

// ------------------------------------------------------------ word search

export interface Placed {
  word: string;
  cells: number[];
}

const WS_DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
];

/**
 * Builds a square letter grid with the words hidden left→right, top→bottom or
 * diagonally. Words that do not fit are left out.
 */
export function buildWordSearch(words: string[], size = 10, rnd = Math.random): { grid: string[]; placed: Placed[] } {
  const grid: (string | null)[] = Array(size * size).fill(null);
  const placed: Placed[] = [];
  for (const raw of shuffle(words)) {
    const word = raw.toUpperCase();
    if (word.length > size) continue;
    for (let attempt = 0; attempt < 200; attempt++) {
      const [dr, dc] = WS_DIRS[Math.floor(rnd() * WS_DIRS.length)];
      const r0 = Math.floor(rnd() * (size - dr * (word.length - 1)));
      const c0 = Math.floor(rnd() * (size - dc * (word.length - 1)));
      const cells = [...word].map((_, k) => (r0 + dr * k) * size + c0 + dc * k);
      if (cells.every((cell, k) => grid[cell] === null || grid[cell] === word[k])) {
        cells.forEach((cell, k) => (grid[cell] = word[k]));
        placed.push({ word, cells });
        break;
      }
    }
  }
  const letters = 'ABCDEFGHIJKLMNOPRSTUVWY';
  return { grid: grid.map((ch) => ch ?? letters[Math.floor(rnd() * letters.length)]), placed };
}

/** Cells on the straight line from a to b (row, column or diagonal), or null. */
export function lineCells(a: number, b: number, size: number): number[] | null {
  const [r1, c1, r2, c2] = [Math.floor(a / size), a % size, Math.floor(b / size), b % size];
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  if ((r1 !== r2 && c1 !== c2 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) || len === 0) return null;
  return [...Array(len + 1).keys()].map((k) => (r1 + dr * k) * size + c1 + dc * k);
}
