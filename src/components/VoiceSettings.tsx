import { useEffect, useState } from 'react';
import { canSpeak, englishVoices, isGoodVoice, onVoicesReady, pickVoice, speak } from '../lib/speech';
import { useStore } from '../lib/store';

const SAMPLE = ['beautiful', 'The parrot is next to the monkeys.', 'beautiful'];

function quality(name: string): string {
  if (/premium/i.test(name)) return ' ★★★';
  if (/enhanced|erweitert|verbessert|natural|neural|online|^google/i.test(name)) return ' ★★';
  return '';
}

/** Voice, speed and a guide for installing a better voice on the Mac. */
export function VoiceSettings() {
  const { state, update } = useStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => englishVoices());
  useEffect(() => onVoicesReady(() => setVoices(englishVoices())), []);

  if (!canSpeak()) return <p className="warn">Dieser Browser kann nicht vorlesen. Bitte Safari oder Chrome verwenden.</p>;

  const { voiceURI, speechRate } = state.settings;
  const current = pickVoice(voiceURI);
  const best = voices[0];
  const set = (patch: Partial<typeof state.settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  return (
    <>
      <label className="inline wrap">
        Stimme:{' '}
        <select value={voiceURI ?? ''} onChange={(e) => set({ voiceURI: e.target.value || null })} className="voice-select">
          <option value="">Automatisch{best ? ` (${best.name})` : ''}</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} – {v.lang}
              {quality(v.name)}
            </option>
          ))}
        </select>
      </label>
      <label className="inline">
        Sprechtempo:{' '}
        <input type="range" min={0.5} max={1.1} step={0.05} value={speechRate} onChange={(e) => set({ speechRate: Number(e.target.value) })} />
        <span className="muted small">{speechRate < 0.75 ? 'langsam' : speechRate > 0.95 ? 'normal' : 'etwas langsamer'}</span>
      </label>
      <button className="btn" onClick={() => speak(SAMPLE, { rate: speechRate, voiceURI })}>
        🔊 Testen
      </button>

      <details className={`voice-help ${isGoodVoice(current) ? '' : 'open-warn'}`} open={!isGoodVoice(current)}>
        <summary>{isGoodVoice(current) ? 'Noch bessere Stimme installieren (Mac)' : '⚠️ Die Stimme klingt roboterhaft? So installierst du eine gute Stimme (Mac)'}</summary>
        <ol>
          <li>
            Öffne <b>Systemeinstellungen</b> → <b>Bedienungshilfen</b> → <b>Gesprochene Inhalte</b>.
          </li>
          <li>
            Klicke bei <b>Systemstimme</b> auf das Menü und wähle <b>„Stimmen verwalten …“</b>.
          </li>
          <li>
            Klappe <b>Englisch (Vereinigtes Königreich)</b> auf und lade z. B. <b>„Serena (Premium)“</b> oder <b>„Daniel (Erweitert)“</b> herunter
            (Wolken-Symbol). Die Systemstimme selbst musst du nicht ändern.
          </li>
          <li>
            Browser ganz beenden (⌘ + Q) und die App neu öffnen. Hier oben „Automatisch“ lassen: Die beste Stimme wird dann von selbst genommen.
          </li>
        </ol>
        <p className="muted small">
          Tipp: <b>Safari</b> zeigt die heruntergeladenen Premium-Stimmen zuverlässig an. In Chrome klingt „Google UK English Female“ ebenfalls gut
          (braucht Internet).
        </p>
      </details>
    </>
  );
}
