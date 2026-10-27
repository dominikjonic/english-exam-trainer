import { Diff } from '../components/Diff';
import { GRADE_NAMES } from '../lib/grading';
import { BADGES, goalStreak, meetsGoal } from '../lib/rewards';
import { newlyUnlocked } from '../lib/minigames';
import { useStore } from '../lib/store';
import type { ExamResult, Stat } from '../lib/types';

const pct = (s: Stat) => (s.total ? Math.round((s.right / s.total) * 100) : null);

export const TOPIC_NAMES = { vocab: 'Vokabeln', pronouns: 'Pronomen', prepositions: 'Präpositionen' } as const;

export function MistakeList({ result }: { result: ExamResult }) {
  if (!result.mistakes.length) return <p>Keine Fehler – perfekt! 🎉</p>;
  return (
    <ol className="mistakes">
      {result.mistakes.map((m, i) => (
        <li key={i}>
          <div className="muted small">
            {m.partId === 'warmup' ? 'Aufwärmen' : `Teil ${m.partId}`} · {m.kind} · {TOPIC_NAMES[m.topic]}
            {m.spelling ? ' · Rechtschreibung' : ''}
          </div>
          <div>{m.prompt}</div>
          {m.kind === 'Selbst schreiben' || m.kind === 'Buchstabensalat' ? (
            <Diff given={m.given} expected={m.expected} letters={m.spelling} />
          ) : (
            <div className="small">
              Deine Antwort: <span className="diff-extra-plain">{m.given || '–'}</span> · Richtig: <b>{m.expected}</b>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

export function ResultScreen({ result, onHome }: { result: ExamResult; onHome: () => void }) {
  const { state } = useStore();
  const t = state.settings.thresholds;
  const streak = goalStreak(state.results, result.unitId, t, state.settings.goalWithBonus);
  const goal = meetsGoal(result, t, state.settings.goalWithBonus);
  const enDe = pct(result.dirStats['en-de']);
  const deEn = pct(result.dirStats['de-en']);
  const unlocked = newlyUnlocked(state.xp - result.xp, state.xp);
  return (
    <div className="screen">
      <h1>Auswertung</h1>
      <div className={`grade-card grade-${result.grade}`}>
        <div className="grade-number">{result.grade}</div>
        <div>
          <div className="grade-name">{GRADE_NAMES[result.grade]}</div>
          <div>
            {result.points} von {result.maxPoints} Punkten · {result.percent} %
          </div>
          <div className="muted small">Dauer {Math.round(result.durationSec / 60)} Minuten</div>
          {result.bonus && (
            <div className="muted small">
              🎩 {result.bonus.asked} Zusatzfrage{result.bonus.asked === 1 ? '' : 'n'}, {result.bonus.recovered} Punkt
              {result.bonus.recovered === 1 ? '' : 'e'} zurückgeholt
              {!state.settings.goalWithBonus && ' · zählt nicht fürs Ziel'}
            </div>
          )}
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Teile</h3>
          <table className="simple">
            <tbody>
              {result.parts.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td className="num">
                    {p.points}/{p.max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Übersetzungsrichtungen</h3>
          <table className="simple">
            <tbody>
              <tr>
                <td>Englisch → Deutsch</td>
                <td className="num">{enDe ?? '–'} %</td>
              </tr>
              <tr>
                <td>Deutsch → Englisch</td>
                <td className="num">{deEn ?? '–'} %</td>
              </tr>
              <tr>
                <td>Rechtschreibfehler</td>
                <td className="num">{result.spellingErrors}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Belohnung</h3>
          <p className="xp-earned">+{result.xp} XP</p>
          {result.newBadges.map((id) => {
            const b = BADGES.find((x) => x.id === id);
            return b ? (
              <div key={id} className="badge new">
                {b.emoji} <b>{b.title}</b> – {b.description}
              </div>
            ) : null;
          })}
          {unlocked.map((g) => (
            <div key={g.id} className="badge new">
              {g.emoji} <b>Neues Pausen-Spiel:</b> {g.title}
            </div>
          ))}
        </div>
      </div>

      <div className={`goal-box ${goal ? 'ok' : ''}`}>
        {streak >= 2
          ? '🏆 Ziel erreicht: zwei Prüfungen hintereinander mit Note 1 in beide Richtungen!'
          : goal
            ? '⭐ Diese Prüfung zählt fürs Ziel. Noch eine Note 1 direkt danach!'
            : `Ziel: zwei Prüfungen hintereinander mit Note 1 (ab ${t[1]} %) und mindestens ${t[1]} % in beide Übersetzungsrichtungen.`}
      </div>

      <h2>Fehlerliste</h2>
      <p className="muted small">Falsch beantwortete Wörter kommen automatisch in den Lernmodus (Fach 1).</p>
      <MistakeList result={result} />
      <button className="btn primary big" onClick={onHome}>
        Zur Startseite
      </button>
    </div>
  );
}
