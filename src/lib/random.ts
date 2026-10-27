export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Picks n distinct items (fewer if the list is shorter). */
export function sample<T>(items: readonly T[], n: number): T[] {
  return shuffle(items).slice(0, n);
}

/** Weighted sample without replacement. */
export function weightedSample<T>(items: readonly T[], n: number, weight: (item: T) => number): T[] {
  const pool = items.map((item) => ({ item, w: Math.max(0.0001, weight(item)) }));
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].w;
      if (r <= 0) break;
    }
    out.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return out;
}

function greedySpread<T>(items: readonly T[], keys: (item: T) => string[]): T[] {
  const remaining = shuffle(items);
  const out: T[] = [];
  while (remaining.length) {
    const prev = out.length ? keys(out[out.length - 1]) : [];
    const counts = new Map<string, number>();
    for (const it of remaining) for (const k of keys(it)) counts.set(k, (counts.get(k) ?? 0) + 1);
    const score = (it: T) => keys(it).reduce((s, k) => s + (counts.get(k) ?? 0), 0);
    const clashes = (it: T) => keys(it).filter((k) => prev.includes(k)).length;
    let bestIdx = 0;
    remaining.forEach((it, i) => {
      const best = remaining[bestIdx];
      if (clashes(it) < clashes(best) || (clashes(it) === clashes(best) && score(it) > score(best))) bestIdx = i;
    });
    out.push(remaining.splice(bestIdx, 1)[0]);
  }
  return out;
}

function violations<T>(list: T[], keys: (item: T) => string[]): [number, number] {
  // [same item next to each other, same task type next to each other]
  let item = 0;
  let kind = 0;
  for (let i = 1; i < list.length; i++) {
    const a = keys(list[i - 1]);
    const b = keys(list[i]);
    if (a[1] !== undefined && a[1] === b[1]) item++;
    if (a[0] === b[0]) kind++;
  }
  return [item, kind];
}

/**
 * Shuffles so that no two neighbours share a key (keys: [task type, item]),
 * as far as the items allow. Repeating the same item is avoided first.
 */
export function spreadShuffle<T>(items: readonly T[], keys: (item: T) => string[]): T[] {
  let best: T[] = [];
  let bestScore: [number, number] = [Infinity, Infinity];
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = greedySpread(items, keys);
    const v = violations(list, keys);
    if (v[0] < bestScore[0] || (v[0] === bestScore[0] && v[1] < bestScore[1])) {
      best = list;
      bestScore = v;
    }
    if (v[0] === 0 && v[1] === 0) break;
  }
  return best;
}

let counter = 0;
export function uid(prefix = 'q'): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter}`;
}
