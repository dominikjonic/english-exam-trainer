import type { Topic, Unit } from '../data/types';
import type { Grade, GradeThresholds } from './grading';
import type { Deck } from './leitner';
import type { WeakMap } from './exam';

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
  dirStats: { 'en-de': Stat; 'de-en': Stat; listen: Stat };
  topicStats: Record<Topic, Stat>;
  spellingErrors: number;
  mistakes: MistakeRecord[];
  xp: number;
  newBadges: string[];
}

export interface Settings {
  thresholds: GradeThresholds;
  pin: string | null;
  speechRate: number;
  learnMinutes: number;
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
}
