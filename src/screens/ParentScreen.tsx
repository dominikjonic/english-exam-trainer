import { useState, type FormEvent } from 'react';
import { unit2 } from '../data/unit2';
import type { GrammarTopic, Topic, Unit, VocabItem } from '../data/types';
import { GRADE_NAMES, validThresholds, type GradeThresholds } from '../lib/grading';
import { VoiceSettings } from '../components/VoiceSettings';
import { defaultState, loadState, useStore } from '../lib/store';
import type { AppState, ExamResult } from '../lib/types';
import { MistakeList, TOPIC_NAMES } from './ResultScreen';

type Tab = 'results' | 'stats' | 'vocab' | 'settings';

export function ParentScreen({ onHome }: { onHome: () => void }) {
  const { state } = useStore();
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('results');

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} onHome={onHome} hasPin={!!state.settings.pin} />;

  return (
    <div className="screen wide">
      <div className="exam-header">
        <h1>👪 Eltern-Bereich</h1>
        <button className="btn" onClick={onHome}>
          Zur Startseite
        </button>
      </div>
      <nav className="tabs">
        {(
          [
            ['results', 'Ergebnisse'],
            ['stats', 'Fehlerstatistik'],
            ['vocab', 'Vokabeln & Units'],
            ['settings', 'Einstellungen'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'results' && <Results />}
      {tab === 'stats' && <Stats />}
      {tab === 'vocab' && <VocabEditor />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

function PinGate({ onUnlock, onHome, hasPin }: { onUnlock: () => void; onHome: () => void; hasPin: boolean }) {
  const { state, update } = useStore();
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (hasPin) {
      if (pin === state.settings.pin) onUnlock();
      else setError('Falscher PIN.');
      return;
    }
    if (!/^\d{4,8}$/.test(pin)) return setError('Bitte 4 bis 8 Ziffern verwenden.');
    if (pin !== pin2) return setError('Die beiden PINs sind nicht gleich.');
    update((s) => ({ ...s, settings: { ...s.settings, pin } }));
    onUnlock();
  };
  return (
    <div className="screen narrow">
      <h1>👪 Eltern-Bereich</h1>
      <form onSubmit={submit} className="form">
        <p>{hasPin ? 'Bitte PIN eingeben.' : 'Lege einen PIN fest, damit nur Eltern hier Einstellungen ändern.'}</p>
        <input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" aria-label="PIN" />
        {!hasPin && (
          <input type="password" inputMode="numeric" value={pin2} onChange={(e) => setPin2(e.target.value)} placeholder="PIN wiederholen" aria-label="PIN wiederholen" />
        )}
        {error && <p className="warn">{error}</p>}
        <div className="row">
          <button type="button" className="btn" onClick={onHome}>
            Zurück
          </button>
          <button className="btn primary" type="submit">
            {hasPin ? 'Öffnen' : 'PIN speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function Results() {
  const { state } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const list = [...state.results].reverse();
  if (!list.length) return <p className="muted">Noch keine Prüfungen.</p>;
  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>Datum</th>
          <th>Unit</th>
          <th className="num">Punkte</th>
          <th className="num">%</th>
          <th>Note</th>
          <th className="num">E→D</th>
          <th className="num">D→E</th>
          <th className="num">Tippfehler</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {list.map((r) => (
          <ResultRow key={r.id} r={r} open={open === r.id} toggle={() => setOpen(open === r.id ? null : r.id)} />
        ))}
      </tbody>
    </table>
  );
}

const statPct = (s: { right: number; total: number }) => (s.total ? `${Math.round((s.right / s.total) * 100)}` : '–');

function ResultRow({ r, open, toggle }: { r: ExamResult; open: boolean; toggle: () => void }) {
  return (
    <>
      <tr>
        <td>{fmtDate(r.date)}</td>
        <td>{r.unitTitle}</td>
        <td className="num">
          {r.points}/{r.maxPoints}
        </td>
        <td className="num">{r.percent}</td>
        <td>
          <b>{r.grade}</b> <span className="muted small">{GRADE_NAMES[r.grade]}</span>
        </td>
        <td className="num">{statPct(r.dirStats['en-de'])}</td>
        <td className="num">{statPct(r.dirStats['de-en'])}</td>
        <td className="num">{r.spellingErrors}</td>
        <td>
          <button className="btn small" onClick={toggle}>
            {open ? 'Zuklappen' : `Fehler (${r.mistakes.length})`}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={9}>
            <div className="muted small">
              {r.parts.map((p) => `${p.title}: ${p.points}/${p.max}`).join(' · ')} · Dauer {Math.round(r.durationSec / 60)} Min.
            </div>
            <MistakeList result={r} />
          </td>
        </tr>
      )}
    </>
  );
}

export function itemLabel(key: string, units: Unit[]): string {
  const [kind, value] = key.split(':');
  if (kind === 'v') {
    for (const u of units) {
      const v = u.vocab.find((x) => x.id === value);
      if (v) return `${v.en} = ${v.de}`;
    }
    return value;
  }
  if (kind === 'pron') return `Pronomen „${value}“`;
  if (kind === 'prep') return `Präposition „${value}“`;
  if (kind === 'there') return `there ${value}`;
  return key;
}

function Stats() {
  const { state } = useStore();
  const [unitId, setUnitId] = useState<string>('all');
  const results = state.results.filter((r) => unitId === 'all' || r.unitId === unitId);
  if (!state.results.length) return <p className="muted">Noch keine Prüfungen.</p>;

  const topics: Topic[] = ['vocab', 'pronouns', 'prepositions'];
  const sum = (t: Topic) =>
    results.reduce((s, r) => ({ right: s.right + r.topicStats[t].right, total: s.total + r.topicStats[t].total }), { right: 0, total: 0 });
  const mistakes = results.flatMap((r) => r.mistakes);
  const spelling = mistakes.filter((m) => m.spelling).length;
  const typedTotal = results.reduce((s, r) => s + r.dirStats['de-en'].total + r.dirStats.listen.total, 0);

  const counts = new Map<string, number>();
  // Match tasks cover several words at once, so they are left out here.
  for (const m of mistakes) if (m.kind !== 'Zuordnen') counts.set(m.itemKey, (counts.get(m.itemKey) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  const rows: { label: string; wrong: number; total: number }[] = [
    ...topics.map((t) => {
      const s = sum(t);
      return { label: TOPIC_NAMES[t], wrong: s.total - s.right, total: s.total };
    }),
    { label: 'Rechtschreibung (Tippfehler)', wrong: spelling, total: typedTotal },
  ];

  return (
    <div>
      <label className="inline">
        Unit:{' '}
        <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="all">Alle</option>
          {state.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
      </label>
      <p className="muted small">{results.length} Prüfungen ausgewertet.</p>
      <h3>Fehler nach Thema</h3>
      <div className="stat-bars">
        {rows.map((r) => {
          const rate = r.total ? Math.round((r.wrong / r.total) * 100) : 0;
          return (
            <div key={r.label} className="stat-row">
              <span className="stat-label">{r.label}</span>
              <span className="stat-track">
                <span className="stat-fill" style={{ width: `${rate}%` }} />
              </span>
              <span className="stat-value">
                {r.wrong} von {r.total} ({rate} %)
              </span>
            </div>
          );
        })}
      </div>

      <h3>Verlauf</h3>
      <div className="history">
        {results.map((r) => (
          <div key={r.id} className="history-bar" title={`${fmtDate(r.date)}: ${r.percent} %, Note ${r.grade}`}>
            <span style={{ height: `${r.percent}%` }} className={`grade-${r.grade}`} />
            <small>{r.grade}</small>
          </div>
        ))}
      </div>

      <h3>Häufigste Fehler</h3>
      {top.length ? (
        <ol>
          {top.map(([key, n]) => (
            <li key={key}>
              {itemLabel(key, state.units)} – {n}×
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted">Keine Fehler.</p>
      )}
    </div>
  );
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'wort';

interface VocabDraft {
  en: string;
  de: string;
  deHint: string;
  example: string;
  enAlt: string;
}

const emptyDraft: VocabDraft = { en: '', de: '', deHint: '', example: '', enAlt: '' };

function toItem(d: VocabDraft, id: string): VocabItem {
  const alt = d.enAlt
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    id,
    en: d.en.trim(),
    de: d.de.trim(),
    ...(d.deHint.trim() ? { deHint: d.deHint.trim() } : {}),
    ...(d.example.trim() ? { example: d.example.trim() } : {}),
    ...(alt.length ? { enAlt: alt } : {}),
  };
}

function VocabEditor() {
  const { state, update } = useStore();
  const [unitId, setUnitId] = useState(state.activeUnitId);
  const unit = state.units.find((u) => u.id === unitId) ?? state.units[0];
  const [draft, setDraft] = useState<VocabDraft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [newUnit, setNewUnit] = useState({ title: '', subtitle: '' });
  const [message, setMessage] = useState('');

  const setUnit = (fn: (u: Unit) => Unit) =>
    update((s) => ({ ...s, units: s.units.map((u) => (u.id === unit.id ? fn(u) : u)) }));

  const saveWord = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.en.trim() || !draft.de.trim()) return setMessage('Englisch und Deutsch sind Pflichtfelder.');
    if (editing) {
      setUnit((u) => ({ ...u, vocab: u.vocab.map((v) => (v.id === editing ? toItem(draft, editing) : v)) }));
      setMessage(`„${draft.en}“ gespeichert.`);
    } else {
      let id = slug(draft.en);
      while (unit.vocab.some((v) => v.id === id)) id += '-2';
      setUnit((u) => ({ ...u, vocab: [...u.vocab, toItem(draft, id)] }));
      setMessage(`„${draft.en}“ hinzugefügt.`);
    }
    setDraft(emptyDraft);
    setEditing(null);
  };

  const edit = (v: VocabItem) => {
    setEditing(v.id);
    setDraft({ en: v.en, de: v.de, deHint: v.deHint ?? '', example: v.example ?? '', enAlt: (v.enAlt ?? []).join(', ') });
  };

  const addUnit = (e: FormEvent) => {
    e.preventDefault();
    if (!newUnit.title.trim()) return;
    let id = slug(newUnit.title);
    while (state.units.some((u) => u.id === id)) id += '-2';
    const u: Unit = { id, title: newUnit.title.trim(), subtitle: newUnit.subtitle.trim() || undefined, vocab: [], grammar: [] };
    update((s) => ({ ...s, units: [...s.units, u] }));
    setUnitId(id);
    setNewUnit({ title: '', subtitle: '' });
    setMessage(`Unit „${u.title}“ angelegt. Jetzt Vokabeln hinzufügen.`);
  };

  const toggleGrammar = (g: GrammarTopic) =>
    setUnit((u) => ({ ...u, grammar: u.grammar.includes(g) ? u.grammar.filter((x) => x !== g) : [...u.grammar, g] }));

  return (
    <div>
      <div className="row wrap">
        <label className="inline">
          Unit:{' '}
          <select value={unit.id} onChange={(e) => setUnitId(e.target.value)}>
            {state.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
                {u.subtitle ? ` – ${u.subtitle}` : ''}
              </option>
            ))}
          </select>
        </label>
        {state.activeUnitId === unit.id ? (
          <span className="pill">aktiv für Prüfung und Lernmodus</span>
        ) : (
          <button className="btn small" onClick={() => update((s) => ({ ...s, activeUnitId: unit.id }))} disabled={unit.vocab.length < 8}>
            Als aktive Unit verwenden
          </button>
        )}
        {unit.vocab.length < 8 && <span className="warn small">Mindestens 8 Vokabeln nötig.</span>}
      </div>

      <div className="row wrap">
        <span>Grammatik in der Prüfung:</span>
        <label className="inline">
          <input type="checkbox" checked={unit.grammar.includes('pronouns')} onChange={() => toggleGrammar('pronouns')} /> Personalpronomen (Teil B)
        </label>
        <label className="inline">
          <input type="checkbox" checked={unit.grammar.includes('prepositions')} onChange={() => toggleGrammar('prepositions')} /> Präpositionen / there is (Teil C)
        </label>
      </div>
      <p className="muted small">Ohne Grammatik werden Teil B und C mit gemischten Vokabelaufgaben gefüllt.</p>

      <form className="vocab-form" onSubmit={saveWord}>
        <h3>{editing ? 'Vokabel bearbeiten' : 'Neue Vokabel'}</h3>
        <input placeholder="Englisch, z. B. elephant" value={draft.en} onChange={(e) => setDraft({ ...draft, en: e.target.value })} aria-label="Englisch" />
        <input placeholder="Deutsch, z. B. Elefant" value={draft.de} onChange={(e) => setDraft({ ...draft, de: e.target.value })} aria-label="Deutsch" />
        <input
          placeholder="Hinweis bei mehrdeutigem Deutsch (z. B. bei „sie“)"
          value={draft.deHint}
          onChange={(e) => setDraft({ ...draft, deHint: e.target.value })}
          aria-label="Hinweis"
        />
        <input placeholder="Eigener Beispielsatz (Englisch)" value={draft.example} onChange={(e) => setDraft({ ...draft, example: e.target.value })} aria-label="Beispielsatz" />
        <input
          placeholder="Weitere richtige Schreibweisen, mit Komma getrennt"
          value={draft.enAlt}
          onChange={(e) => setDraft({ ...draft, enAlt: e.target.value })}
          aria-label="Weitere Schreibweisen"
        />
        <div className="row">
          {editing && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setEditing(null);
                setDraft(emptyDraft);
              }}
            >
              Abbrechen
            </button>
          )}
          <button className="btn primary" type="submit">
            {editing ? 'Speichern' : 'Hinzufügen'}
          </button>
        </div>
        {message && <p className="small">{message}</p>}
      </form>

      <h3>
        {unit.vocab.length} Vokabeln in {unit.title}
      </h3>
      <table className="vocab-table">
        <thead>
          <tr>
            <th>Englisch</th>
            <th>Deutsch</th>
            <th>Beispielsatz</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {unit.vocab.map((v) => (
            <tr key={v.id}>
              <td>
                {v.en}
                {v.enAlt?.length ? <span className="muted small"> ({v.enAlt.join(', ')})</span> : null}
              </td>
              <td>
                {v.de}
                {v.deHint ? <span className="muted small"> – {v.deHint}</span> : null}
              </td>
              <td className="small">{v.example}</td>
              <td className="nowrap">
                <button className="btn small" onClick={() => edit(v)}>
                  Bearbeiten
                </button>{' '}
                <button className="btn small danger" onClick={() => setUnit((u) => ({ ...u, vocab: u.vocab.filter((x) => x.id !== v.id) }))}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row wrap">
        {unit.builtIn && (
          <button className="btn small" onClick={() => setUnit(() => structuredClone(unit2))}>
            Unit 2 auf Original-Vokabeln zurücksetzen
          </button>
        )}
        {!unit.builtIn && state.activeUnitId !== unit.id && (
          <button
            className="btn small danger"
            onClick={() => {
              update((s) => ({ ...s, units: s.units.filter((u) => u.id !== unit.id) }));
              setUnitId(state.activeUnitId);
            }}
          >
            Unit löschen
          </button>
        )}
      </div>

      <form className="vocab-form" onSubmit={addUnit}>
        <h3>Neue Unit für den nächsten Stoff</h3>
        <input placeholder="Titel, z. B. Unit 3" value={newUnit.title} onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })} aria-label="Titel" />
        <input placeholder="Thema, z. B. My family" value={newUnit.subtitle} onChange={(e) => setNewUnit({ ...newUnit, subtitle: e.target.value })} aria-label="Thema" />
        <button className="btn primary" type="submit">
          Unit anlegen
        </button>
      </form>
    </div>
  );
}

function SettingsTab() {
  const { state, update, replace } = useStore();
  const [t, setT] = useState<GradeThresholds>(state.settings.thresholds);
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [newPin, setNewPin] = useState('');

  const saveThresholds = () => {
    if (!validThresholds(t)) return setMsg('Die Grenzen müssen von Note 1 bis 4 kleiner werden (z. B. 90, 80, 65, 50).');
    update((s) => ({ ...s, settings: { ...s.settings, thresholds: t } }));
    setMsg('Notengrenzen gespeichert.');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `english-exam-trainer-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    const text = await file.text();
    let parsed: Partial<AppState> | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // handled below
    }
    if (parsed?.version !== 1 || !Array.isArray(parsed.units)) return setMsg('Das ist keine Sicherung dieser App.');
    replace(loadState(text));
    setMsg('Sicherung geladen.');
  };

  return (
    <div className="settings">
      <section>
        <h3>Notengrenzen (Mindestprozent)</h3>
        <div className="row wrap">
          {([1, 2, 3, 4] as const).map((g) => (
            <label key={g} className="inline">
              Note {g} ab{' '}
              <input
                type="number"
                min={1}
                max={100}
                value={t[g]}
                onChange={(e) => setT({ ...t, [g]: Number(e.target.value) })}
                className="num-input"
              />{' '}
              %
            </label>
          ))}
          <span className="muted">Darunter: Note 5</span>
        </div>
        <button className="btn primary" onClick={saveThresholds}>
          Speichern
        </button>
      </section>

      <section>
        <h3>Lernmodus</h3>
        <label className="inline">
          Dauer einer Lernrunde:{' '}
          <input
            type="number"
            min={3}
            max={30}
            className="num-input"
            value={state.settings.learnMinutes}
            onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, learnMinutes: Math.max(3, Math.min(30, Number(e.target.value) || 10)) } }))}
          />{' '}
          Minuten
        </label>
      </section>

      <section>
        <h3>Stimme fürs Hördiktat</h3>
        <VoiceSettings />
      </section>

      <section>
        <h3>PIN ändern</h3>
        <div className="row">
          <input type="password" inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Neuer PIN" aria-label="Neuer PIN" />
          <button
            className="btn"
            onClick={() => {
              if (!/^\d{4,8}$/.test(newPin)) return setMsg('PIN: 4 bis 8 Ziffern.');
              update((s) => ({ ...s, settings: { ...s.settings, pin: newPin } }));
              setNewPin('');
              setMsg('PIN geändert.');
            }}
          >
            Ändern
          </button>
        </div>
      </section>

      <section>
        <h3>Daten</h3>
        <p className="muted small">Alles wird nur in diesem Browser gespeichert. Mit einer Sicherung kannst du die Daten auf einen anderen Computer mitnehmen.</p>
        <div className="row wrap">
          <button className="btn" onClick={exportData}>
            Sicherung herunterladen
          </button>
          <label className="btn">
            Sicherung laden
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
          </label>
          {confirmReset ? (
            <span className="confirm">
              Alle Ergebnisse, XP und Karten löschen?{' '}
              <button
                className="btn small danger"
                onClick={() => {
                  replace({ ...defaultState(), settings: { ...defaultState().settings, pin: state.settings.pin } });
                  setConfirmReset(false);
                  setMsg('Alles zurückgesetzt.');
                }}
              >
                Ja, löschen
              </button>{' '}
              <button className="btn small" onClick={() => setConfirmReset(false)}>
                Nein
              </button>
            </span>
          ) : (
            <button className="btn danger" onClick={() => setConfirmReset(true)}>
              Alles zurücksetzen
            </button>
          )}
        </div>
      </section>
      {msg && <p className="msg">{msg}</p>}
    </div>
  );
}
