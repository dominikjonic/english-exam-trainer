/** Normalises a typed answer without forgiving spelling: only spacing, quote style and end punctuation. */
export function normalize(s: string): string {
  return s
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.!?,;:]+|[.!?,;:]+$/g, '')
    .trim();
}

/**
 * Exact comparison. Capital letters are not counted, except for the word "I",
 * which is always written with a capital letter in English.
 */
export function isExactMatch(given: string, expected: string): boolean {
  const g = normalize(given);
  const e = normalize(expected);
  if (g.toLowerCase() !== e.toLowerCase()) return false;
  const gt = g.split(' ');
  const et = e.split(' ');
  return et.every((tok, i) => !/^I('|$)/.test(tok) || gt[i].startsWith('I'));
}

export function matchesAny(given: string, accepted: string[]): boolean {
  return accepted.some((a) => isExactMatch(given, a));
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

/**
 * True when a wrong answer is close to the right one, i.e. the word was
 * known but misspelled (counts for the "Rechtschreibung" statistic).
 */
export function isSpellingSlip(given: string, accepted: string[]): boolean {
  const g = normalize(given).toLowerCase();
  if (!g) return false;
  return accepted.some((a) => {
    const e = normalize(a).toLowerCase();
    if (g === e) return true; // only capital "I" was wrong
    const max = e.length <= 4 ? 1 : 2;
    return levenshtein(g, e) <= max;
  });
}

export type DiffPart = { text: string; kind: 'same' | 'extra' | 'missing' };

/** Letter-by-letter difference between the typed and the correct answer. */
export function diffLetters(given: string, expected: string): DiffPart[] {
  const keepCase = /(^|\s)I('|\s|$)/.test(normalize(expected));
  const a = keepCase ? normalize(given) : normalize(given).toLowerCase();
  const b = keepCase ? normalize(expected) : normalize(expected).toLowerCase();
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (text: string, kind: DiffPart['kind']) => {
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.text += text;
    else parts.push({ text, kind });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(a[i], 'same');
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push(a[i++], 'extra');
    } else {
      push(b[j++], 'missing');
    }
  }
  while (i < n) push(a[i++], 'extra');
  while (j < m) push(b[j++], 'missing');
  return parts;
}
