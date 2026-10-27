export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
}

/**
 * macOS joke and old formant voices. They are hard to understand, so they are
 * never chosen automatically and are hidden from the voice list.
 */
const NOVELTY = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'fred', 'good news', 'hysterical',
  'jester', 'junior', 'organ', 'pipe organ', 'ralph', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox',
  // Eloquence voices: very robotic.
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
];

/** Natural-sounding voices that ship with macOS, iOS, Windows or Chrome. */
const GOOD_NAMES = ['serena', 'daniel', 'kate', 'oliver', 'stephanie', 'jamie', 'martha', 'arthur', 'samantha', 'karen', 'moira', 'tessa', 'ava', 'zoe', 'evan', 'nathan', 'libby', 'sonia', 'ryan', 'hazel', 'george', 'susan'];

export function isNovelty(v: Pick<VoiceInfo, 'name'>): boolean {
  const base = v.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
  return NOVELTY.includes(base);
}

/** Higher is better: premium/enhanced quality, then British English, then known good voices. */
export function voiceScore(v: VoiceInfo): number {
  if (!v.lang.toLowerCase().startsWith('en') || isNovelty(v)) return -1;
  const name = v.name.toLowerCase();
  let score = 0;
  if (/premium/.test(name)) score += 60;
  else if (/enhanced|erweitert|verbessert/.test(name)) score += 45;
  else if (/natural|neural|online/.test(name)) score += 40;
  if (/^google uk english/.test(name)) score += 35;
  else if (/^google us english/.test(name)) score += 25;
  if (GOOD_NAMES.some((g) => name.startsWith(g))) score += 20;
  const lang = v.lang.toLowerCase().replace('_', '-');
  if (lang === 'en-gb') score += 15;
  else if (lang === 'en-ie' || lang === 'en-au') score += 8;
  else if (lang === 'en-us') score += 6;
  return score;
}

/** English voices worth offering, best first. */
export function rankVoices<T extends VoiceInfo>(voices: T[]): T[] {
  return voices.filter((v) => voiceScore(v) >= 0).sort((a, b) => voiceScore(b) - voiceScore(a));
}

export function englishVoices(): SpeechSynthesisVoice[] {
  return canSpeak() ? rankVoices(window.speechSynthesis.getVoices()) : [];
}

/** The chosen voice if it still exists, otherwise the best one available. */
export function pickVoice(voiceURI: string | null): SpeechSynthesisVoice | undefined {
  const voices = englishVoices();
  return (voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined) ?? voices[0];
}

/** A voice that sounds good enough; otherwise the settings show how to download one. */
export function isGoodVoice(v: VoiceInfo | undefined): boolean {
  return !!v && voiceScore(v) >= 45;
}

/** Calls back once the browser has loaded its voices (Chrome loads them late). */
export function onVoicesReady(cb: () => void): () => void {
  if (!canSpeak()) return () => {};
  const synth = window.speechSynthesis;
  if (synth.getVoices().length) cb();
  const handler = () => cb();
  synth.addEventListener('voiceschanged', handler);
  return () => synth.removeEventListener('voiceschanged', handler);
}

export interface SpeakOptions {
  rate?: number;
  voiceURI?: string | null;
}

/**
 * Reads English text aloud. Several parts are spoken one after the other
 * with a short natural pause between them (e.g. word, sentence, word).
 */
export function speak(text: string | string[], { rate = 0.85, voiceURI = null }: SpeakOptions = {}): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const voice = pickVoice(voiceURI);
  for (const part of Array.isArray(text) ? text : [text]) {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voice?.lang ?? 'en-GB';
    u.rate = rate;
    if (voice) u.voice = voice;
    synth.speak(u);
  }
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}
