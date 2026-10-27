import type { Topic, Unit } from '../data/types';
import type { Grade, GradeThresholds } from './grading';
import type { Deck } from './leitner';
import type { WeakMap } from './exam';
import type { Slot } from './pirates';

export interface Stat {
  right: number;
  total: number;
}

export interface MistakeRecord {
  partId: string;
  kind: string;
  topic: Topic;
  itemKey: string;
  instruction: string;
  prompt: string;
  given: string;
  expected: string;
  spelling: boolean;
}

export interface ExamResult {
  id: string;
  date: string;
  unitId: string;
  unitTitle: string;
  points: number;
  maxPoints: number;
  percent: number;
  grade: Grade;
  durationSec: number;
  parts: { id: string; title: string; points: number; max: number }[];
  dirStats: { 'en-de': Stat; 'de-en': Stat };
  topicStats: Record<Topic, Stat>;
  spellingErrors: number;
  mistakes: MistakeRecord[];
  xp: number;
  newBadges: string[];
  /** Extra questions from the second-chance perk: how many were asked and how many points they won back. */
  bonus?: { asked: number; recovered: number };
}

export interface Settings {
  thresholds: GradeThresholds;
  pin: string | null;
  learnMinutes: number;
  /** Whether exams that used extra questions count for the goal (two grade 1 in a row). */
  goalWithBonus: boolean;
}

export interface AppState {
  version: 1;
  units: Unit[];
  activeUnitId: string;
  results: ExamResult[];
  decks: Record<string, Deck>;
  weak: Record<string, WeakMap>;
  xp: number;
  badges: Record<string, string>;
  learnDays: string[];
  settings: Settings;
  /** Chosen pirate hero, null until the learner picks one. */
  heroId: string | null;
  /** Gold spent on skins; gold = xp − goldSpent. */
  goldSpent: number;
  owned: string[];
  equipped: Record<Slot, string | null>;
}
