import type { AppState } from './types';

/**
 * The pirate crew: the learner picks a hero and buys skins with gold.
 * Every XP earned also brings one gold, so gold = XP earned − gold spent; the
 * level keeps following all XP ever earned and never drops when buying.
 * Skins give perks for the exam and the learn mode. No perk helps to answer a
 * task: they only give a second chance, more time or more reward.
 */

export interface HeroInfo {
  id: string;
  name: string;
  role: string;
  /** Look of the figure. */
  skin: string;
  hair: string;
  eyes: string;
  hairStyle: 'spiky' | 'bob' | 'curly' | 'braids';
}

export const HEROES: HeroInfo[] = [
  { id: 'finn', name: 'Finn', role: 'Kapitän', skin: '#f1c39b', hair: '#2b2b38', eyes: '#3b2a1f', hairStyle: 'spiky' },
  { id: 'mira', name: 'Mira', role: 'Navigatorin', skin: '#f6d0b1', hair: '#e8833a', eyes: '#2e5e3a', hairStyle: 'bob' },
  { id: 'bo', name: 'Bo', role: 'Smutje', skin: '#c98b5e', hair: '#f2d064', eyes: '#2b2b38', hairStyle: 'curly' },
  { id: 'lotte', name: 'Lotte', role: 'Schiffsärztin', skin: '#8d5a3b', hair: '#1d1a24', eyes: '#2b2b38', hairStyle: 'braids' },
];

export type Slot = 'hat' | 'coat' | 'pet';

export interface Perks {
  /** Extra questions after a wrong answer, per exam. */
  secondChances: number;
  /** Extra minutes per exam part (not the break). */
  extraMinutes: number;
  /** Multiplier on all XP (and so gold) earned. */
  xpFactor: number;
  /** Multiplier on XP earned in the learn mode, on top of xpFactor. */
  learnFactor: number;
}

export interface Item {
  id: string;
  slot: Slot;
  name: string;
  emoji: string;
  cost: number;
  perk: Partial<Perks>;
  perkText: string;
}

export const ITEMS: Item[] = [
  { id: 'bandana', slot: 'hat', name: 'Bandana', emoji: '🧣', cost: 0, perk: {}, perkText: 'Ohne Fähigkeit' },
  { id: 'tricorn', slot: 'hat', name: 'Dreispitz', emoji: '🎩', cost: 300, perk: { secondChances: 1 }, perkText: '1 Zusatzfrage pro Prüfung' },
  { id: 'captain', slot: 'hat', name: 'Kapitänshut', emoji: '🏴‍☠️', cost: 900, perk: { secondChances: 2 }, perkText: '2 Zusatzfragen pro Prüfung' },
  { id: 'crown', slot: 'hat', name: 'Goldene Krone', emoji: '👑', cost: 2000, perk: { secondChances: 3 }, perkText: '3 Zusatzfragen pro Prüfung' },
  { id: 'shirt', slot: 'coat', name: 'Matrosenhemd', emoji: '👕', cost: 0, perk: {}, perkText: 'Ohne Fähigkeit' },
  { id: 'navigator', slot: 'coat', name: 'Navigatorenmantel', emoji: '🧭', cost: 500, perk: { extraMinutes: 1 }, perkText: '+1 Minute pro Prüfungsteil' },
  { id: 'admiral', slot: 'coat', name: 'Admiralsmantel', emoji: '🎖️', cost: 1500, perk: { extraMinutes: 2 }, perkText: '+2 Minuten pro Prüfungsteil' },
  { id: 'parrot', slot: 'pet', name: 'Papagei', emoji: '🦜', cost: 700, perk: { xpFactor: 1.1 }, perkText: '+10 % XP und Gold' },
  { id: 'monkey', slot: 'pet', name: 'Äffchen mit Schatzkarte', emoji: '🐒', cost: 1200, perk: { learnFactor: 2 }, perkText: 'Doppelte XP im Lernmodus' },
];

export const DEFAULT_OWNED = ITEMS.filter((i) => i.cost === 0).map((i) => i.id);
export const DEFAULT_EQUIPPED: Record<Slot, string | null> = { hat: 'bandana', coat: 'shirt', pet: null };

export function item(id: string | null | undefined): Item | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function gold(s: Pick<AppState, 'xp' | 'goldSpent'>): number {
  return Math.max(0, s.xp - s.goldSpent);
}

export function perksOf(equipped: Record<Slot, string | null>): Perks {
  const p: Perks = { secondChances: 0, extraMinutes: 0, xpFactor: 1, learnFactor: 1 };
  for (const id of Object.values(equipped)) {
    const it = item(id);
    if (!it) continue;
    p.secondChances += it.perk.secondChances ?? 0;
    p.extraMinutes += it.perk.extraMinutes ?? 0;
    p.xpFactor *= it.perk.xpFactor ?? 1;
    p.learnFactor *= it.perk.learnFactor ?? 1;
  }
  return p;
}

/** XP after the equipped perks; `learn` adds the learn-mode factor. */
export function boostXp(xp: number, perks: Perks, learn = false): number {
  return Math.round(xp * perks.xpFactor * (learn ? perks.learnFactor : 1));
}

/** Buys an item and puts it on; returns null if it is owned already or there is not enough gold. */
export function buyItem(s: AppState, id: string): AppState | null {
  const it = item(id);
  if (!it || s.owned.includes(id) || gold(s) < it.cost) return null;
  return { ...s, goldSpent: s.goldSpent + it.cost, owned: [...s.owned, id], equipped: { ...s.equipped, [it.slot]: id } };
}

/** Puts on an owned item; equipping the worn pet again takes it off. */
export function equipItem(s: AppState, id: string): AppState {
  const it = item(id);
  if (!it || !s.owned.includes(id)) return s;
  const off = it.slot === 'pet' && s.equipped.pet === id;
  return { ...s, equipped: { ...s.equipped, [it.slot]: off ? null : id } };
}
