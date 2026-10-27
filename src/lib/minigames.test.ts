import { unit2 } from '../data/unit2';
import {
  buildWordSearch,
  c4Drop,
  c4Empty,
  c4Move,
  c4Winner,
  canMove,
  lineCells,
  MINI_GAMES,
  newlyUnlocked,
  nextLocked,
  puzzleSolved,
  shufflePuzzle,
  slideGrid,
  tttMove,
  tttWinner,
  type Cell,
} from './minigames';

describe('mini-game unlocking', () => {
  it('has the free memory game plus 10 unlockable games, cheapest first', () => {
    expect(MINI_GAMES[0]).toMatchObject({ id: 'memory', unlockXp: 0 });
    expect(MINI_GAMES.filter((g) => g.unlockXp > 0)).toHaveLength(10);
    expect(new Set(MINI_GAMES.map((g) => g.id)).size).toBe(MINI_GAMES.length);
    for (let i = 1; i < MINI_GAMES.length; i++) expect(MINI_GAMES[i].unlockXp).toBeGreaterThan(MINI_GAMES[i - 1].unlockXp);
  });

  it('reports games unlocked by an XP gain', () => {
    expect(newlyUnlocked(40, 130).map((g) => g.id)).toEqual(['hangman', 'wordsearch']);
    expect(newlyUnlocked(130, 140)).toEqual([]);
    expect(nextLocked(0)?.id).toBe('hangman');
    expect(nextLocked(99999)).toBeUndefined();
  });
});

describe('tic-tac-toe', () => {
  it('finds winners and draws', () => {
    expect(tttWinner(['X', 'X', 'X', null, 'O', 'O', null, null, null])).toBe('X');
    expect(tttWinner(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'])).toBe('draw');
  });

  it('the lion takes a win and blocks', () => {
    const b: Cell[] = ['O', 'O', null, 'X', 'X', null, null, null, null];
    expect(tttMove(b, 'O', 0)).toBe(2);
    const block: Cell[] = ['X', 'X', null, null, 'O', null, null, null, null];
    expect(tttMove(block, 'O', 0)).toBe(2);
  });
});

describe('connect four', () => {
  it('stacks discs and detects four in a row', () => {
    let b = c4Empty();
    for (const col of [0, 1, 2, 3]) b = c4Drop(b, col, 'X')!;
    expect(c4Winner(b)).toBe('X');
    let v = c4Empty();
    for (let i = 0; i < 6; i++) v = c4Drop(v, 0, 'O')!;
    expect(c4Drop(v, 0, 'X')).toBeNull();
  });

  it('the monkey blocks three in a row', () => {
    let b = c4Empty();
    for (const col of [1, 2, 3]) b = c4Drop(b, col, 'X')!;
    expect([0, 4]).toContain(c4Move(b, 'O'));
  });
});

describe('zoo 2048', () => {
  it('merges equal tiles once per move', () => {
    const r = slideGrid(
      [
        [1, 1, 1, 1],
        [2, 0, 2, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 3],
      ],
      'left',
    );
    expect(r.grid[0]).toEqual([2, 2, 0, 0]);
    expect(r.grid[1]).toEqual([3, 0, 0, 0]);
    expect(r.grid[3]).toEqual([3, 0, 0, 0]);
    expect(r.moved).toBe(true);
  });

  it('knows when no move is left', () => {
    expect(
      canMove([
        [1, 2, 1, 2],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ]),
    ).toBe(false);
  });
});

describe('slide puzzle and word search', () => {
  it('shuffles into an unsolved but solvable order', () => {
    const t = shufflePuzzle();
    expect([...t].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(puzzleSolved(t)).toBe(false);
    // Even number of inversions = solvable for a 3x3 puzzle.
    const n = t.filter(Boolean);
    let inv = 0;
    for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) if (n[i] > n[j]) inv++;
    expect(inv % 2).toBe(0);
  });

  it('hides real Unit 2 words in the grid', () => {
    const words = unit2.vocab.filter((v) => /^[a-z]{3,9}$/i.test(v.en)).slice(0, 7).map((v) => v.en);
    const { grid, placed } = buildWordSearch(words, 10);
    expect(grid).toHaveLength(100);
    expect(placed.length).toBeGreaterThanOrEqual(5);
    for (const p of placed) expect(p.cells.map((c) => grid[c]).join('')).toBe(p.word);
  });

  it('only accepts straight lines', () => {
    expect(lineCells(0, 3, 10)).toEqual([0, 1, 2, 3]);
    expect(lineCells(0, 22, 10)).toEqual([0, 11, 22]);
    expect(lineCells(0, 12, 10)).toBeNull();
  });
});
