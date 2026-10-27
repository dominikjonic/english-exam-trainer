import type { Grade, GradeThresholds } from './grading';
import type { ExamResult } from './types';

export const XP_PER_POINT = 5;
export const XP_GRADE_BONUS: Record<Grade, number> = { 1: 100, 2: 60, 3: 30, 4: 10, 5: 0 };
export const XP_NEW_BEST = 50;
export const XP_LEARN_CORRECT = 2;
export const XP_LEARN_ROUND = 20;
/** A learn round only earns the round bonus with at least this many answers. */
export const LEARN_MIN_ANSWERS = 10;

/** XP needed to reach a level: 0, 150, 450, 900, 1500, ... */
export function xpForLevel(level: number): number {
  return (150 * (level - 1) * level) / 2;
}

export function levelFor(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

const LEVEL_NAMES = [
  'Zoo-Besucher',
  'Tierfreund',
  'Pinguin-Pfleger',
  'Papageien-Profi',
  'Affen-Experte',
  'Giraffen-Guide',
  'Löwen-Champion',
  'Wildpark-Direktor',
];

export function levelName(level: number): string {
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length) - 1];
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export const BADGES: Badge[] = [
  { id: 'first-exam', emoji: '🎒', title: 'Erste Prüfung', description: 'Die erste Übungsprüfung fertig gemacht.' },
  { id: 'grade-1', emoji: '🥇', title: 'Sehr gut!', description: 'Eine Prüfung mit Note 1.' },
  { id: 'goal', emoji: '🏆', title: 'Ziel erreicht', description: 'Zwei Prüfungen hintereinander mit Note 1, beide Richtungen sicher.' },
  { id: 'new-best', emoji: '📈', title: 'Neue Bestnote', description: 'Die eigene Bestleistung übertroffen.' },
  { id: 'spelling-star', emoji: '✍️', title: 'Rechtschreib-Star', description: 'Teil A ganz ohne Fehler.' },
  { id: 'pronoun-pro', emoji: '🧑‍🤝‍🧑', title: 'Pronomen-Profi', description: 'Teil B ganz ohne Fehler.' },
  { id: 'prep-pro', emoji: '📦', title: 'Präpositionen-Profi', description: 'Teil C ganz ohne Fehler.' },
  { id: 'boss', emoji: '🐉', title: 'Boss besiegt', description: 'Die Boss-Runde ohne Fehler.' },
  { id: 'streak-3', emoji: '🔥', title: '3 Tage am Stück', description: 'An drei Tagen hintereinander eine Lernrunde.' },
  { id: 'streak-7', emoji: '🌟', title: 'Eine ganze Woche', description: 'An sieben Tagen hintereinander eine Lernrunde.' },
  { id: 'box5-10', emoji: '🗃️', title: 'Fach 5', description: '10 Karten im höchsten Leitner-Fach.' },
  { id: 'all-words', emoji: '🦁', title: 'Alle Wörter sitzen', description: 'Alle Karten einer Unit mindestens in Fach 3.' },
];

/** The success criterion: grade 1, and both translation directions at or above the grade-1 limit. */
export function meetsGoal(r: ExamResult, t: GradeThresholds): boolean {
  const ok = (s: { right: number; total: number }) => s.total === 0 || (s.right / s.total) * 100 >= t[1];
  return r.grade === 1 && ok(r.dirStats['en-de']) && ok(r.dirStats['de-en']);
}

/** Number of results at the end of the list (same unit) that meet the goal in a row. */
export function goalStreak(results: ExamResult[], unitId: string, t: GradeThresholds): number {
  const own = results.filter((r) => r.unitId === unitId);
  let n = 0;
  for (let i = own.length - 1; i >= 0 && meetsGoal(own[i], t); i--) n++;
  return n;
}

/** Longest run of consecutive days ending today or yesterday. */
export function dayStreak(days: string[], todayStr: string, addDays: (d: string, n: number) => string): number {
  const set = new Set(days);
  let day = set.has(todayStr) ? todayStr : addDays(todayStr, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
