export type Grade = 1 | 2 | 3 | 4 | 5;

/** Minimum percentage for grades 1–4; below the grade-4 limit it is a 5. */
export interface GradeThresholds {
  1: number;
  2: number;
  3: number;
  4: number;
}

export const DEFAULT_THRESHOLDS: GradeThresholds = { 1: 90, 2: 80, 3: 65, 4: 50 };

export const GRADE_NAMES: Record<Grade, string> = {
  1: 'Sehr gut',
  2: 'Gut',
  3: 'Befriedigend',
  4: 'Genügend',
  5: 'Nicht genügend',
};

export function percent(points: number, max: number): number {
  return max === 0 ? 0 : Math.round((points / max) * 1000) / 10;
}

export function gradeFor(pct: number, t: GradeThresholds = DEFAULT_THRESHOLDS): Grade {
  if (pct >= t[1]) return 1;
  if (pct >= t[2]) return 2;
  if (pct >= t[3]) return 3;
  if (pct >= t[4]) return 4;
  return 5;
}

/** Thresholds must fall strictly from grade 1 to grade 4 and stay within 1–100. */
export function validThresholds(t: GradeThresholds): boolean {
  return t[1] <= 100 && t[1] > t[2] && t[2] > t[3] && t[3] > t[4] && t[4] >= 1;
}
