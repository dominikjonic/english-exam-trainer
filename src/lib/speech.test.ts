import { isGoodVoice, rankVoices, voiceScore, type VoiceInfo } from './speech';

const v = (name: string, lang: string): VoiceInfo => ({ name, lang, voiceURI: name, localService: true });

describe('voice choice', () => {
  const macVoices = [
    v('Albert', 'en-US'),
    v('Eddy (Englisch (Vereinigtes Königreich))', 'en-GB'),
    v('Fred', 'en-US'),
    v('Daniel', 'en-GB'),
    v('Samantha', 'en-US'),
    v('Serena (Premium)', 'en-GB'),
    v('Anna', 'de-DE'),
    v('Zarvox', 'en-US'),
  ];

  it('prefers premium British voices and never picks robotic ones', () => {
    const ranked = rankVoices(macVoices).map((x) => x.name);
    expect(ranked[0]).toBe('Serena (Premium)');
    expect(ranked).not.toContain('Albert');
    expect(ranked).not.toContain('Fred');
    expect(ranked).not.toContain('Zarvox');
    expect(ranked.some((n) => n.startsWith('Eddy'))).toBe(false);
    expect(ranked).not.toContain('Anna');
  });

  it('prefers a British standard voice over an American one', () => {
    expect(rankVoices([v('Samantha', 'en-US'), v('Daniel', 'en-GB')])[0].name).toBe('Daniel');
  });

  it('rates Chrome’s Google UK voice and enhanced voices as good', () => {
    expect(isGoodVoice(v('Google UK English Female', 'en-GB'))).toBe(true);
    expect(isGoodVoice(v('Daniel (Erweitert)', 'en-GB'))).toBe(true);
    expect(isGoodVoice(v('Daniel', 'en-GB'))).toBe(false);
    expect(voiceScore(v('Grandma (Englisch (USA))', 'en-US'))).toBe(-1);
  });
});
