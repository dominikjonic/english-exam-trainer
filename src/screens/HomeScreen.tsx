import { GameGallery } from '../components/MiniGames';
import { boxCounts, dueCards } from '../lib/leitner';
import { BADGES, goalStreak, levelFor, levelName, xpForLevel } from '../lib/rewards';
import { activeUnit, useStore } from '../lib/store';
import { BoxBar } from './LearnScreen';

export function HomeScreen({ go }: { go: (screen: 'exam' | 'learn' | 'parent') => void }) {
  const { state, update } = useStore();
  const unit = activeUnit(state);
  const level = levelFor(state.xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  const due = dueCards(unit.vocab, state.decks[unit.id] ?? {}).length;
  const own = state.results.filter((r) => r.unitId === unit.id);
  const best = own.reduce<(typeof own)[number] | null>((b, r) => (!b || r.percent > b.percent ? r : b), null);
  const streak = goalStreak(state.results, unit.id, state.settings.thresholds, state.settings.goalWithBonus);

  return (
    <div className="screen">
      <header className="home-header">
        <div>
          <h1>English Exam Trainer 🦜</h1>
          {state.units.length > 1 ? (
            <select
              className="unit-select"
              value={unit.id}
              onChange={(e) => update((s) => ({ ...s, activeUnitId: e.target.value }))}
              aria-label="Unit wählen"
            >
              {state.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                  {u.subtitle ? ` – ${u.subtitle}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <p className="lead">
              {unit.title}
              {unit.subtitle ? ` – ${unit.subtitle}` : ''}
            </p>
          )}
        </div>
        <div className="level">
          <div className="level-name">
            Level {level} · {levelName(level)}
          </div>
          <div className="xp-bar" aria-label={`${state.xp} XP`}>
            <div style={{ width: `${((state.xp - from) / (to - from)) * 100}%` }} />
          </div>
          <div className="muted small">
            {state.xp} XP · noch {to - state.xp} bis Level {level + 1}
          </div>
        </div>
      </header>

      <div className="actions">
        <button className="action exam" onClick={() => go('exam')}>
          <span className="action-emoji">📝</span>
          <span className="action-title">Übungs-Schularbeit</span>
          <span className="action-sub">50 Minuten · wie in der Schule</span>
        </button>
        <button className="action learn" onClick={() => go('learn')}>
          <span className="action-emoji">🗂️</span>
          <span className="action-title">Lernmodus</span>
          <span className="action-sub">{due ? `${due} Karten warten · 10 Minuten` : 'Heute alles gelernt'}</span>
        </button>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Bestnote</h3>
          {best ? (
            <p>
              <span className="big-number">{best.grade}</span> mit {best.percent} %
              <br />
              <span className="muted small">Schaffst du mehr?</span>
            </p>
          ) : (
            <p className="muted">Noch keine Prüfung gemacht.</p>
          )}
        </div>
        <div className="card">
          <h3>Ziel</h3>
          <p>Zwei Prüfungen hintereinander mit Note 1, in beide Richtungen und richtig geschrieben.</p>
          <div className="goal-dots">
            {[0, 1].map((i) => (
              <span key={i} className={`dot ${streak > i ? 'on' : ''}`}>
                {streak > i ? '🥇' : '○'}
              </span>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Leitner-Kartei</h3>
          <BoxBar counts={boxCounts(unit.vocab, state.decks[unit.id] ?? {})} />
        </div>
      </div>

      <h2>Abzeichen</h2>
      <div className="badges">
        {BADGES.map((b) => (
          <div key={b.id} className={`badge ${state.badges[b.id] ? 'earned' : 'locked'}`} title={b.description}>
            <span className="badge-emoji">{b.emoji}</span>
            <span className="badge-title">{b.title}</span>
            <span className="badge-desc">{b.description}</span>
          </div>
        ))}
      </div>

      <h2>Pausen-Spiele</h2>
      <p className="muted small">Mit deinen XP schaltest du neue Spiele für die Pause in der Prüfung frei. Die XP bleiben dir dabei erhalten.</p>
      <GameGallery xp={state.xp} />

      <footer className="footer">
        <button className="btn small" onClick={() => go('parent')}>
          👪 Eltern-Bereich
        </button>
      </footer>
    </div>
  );
}
