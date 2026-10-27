import { useMemo, useRef, useState } from 'react';
import { QuestionView } from '../components/QuestionView';
import { answerCard, boxCounts, dueCards, fullDeck, today } from '../lib/leitner';
import { canScramble, vocabDictation, vocabMcEnDe, vocabScramble, vocabTypeDeEn, type Question } from '../lib/questions';
import { checkLearnBadges } from '../lib/results';
import { BADGES, LEARN_MIN_ANSWERS, XP_LEARN_CORRECT, XP_LEARN_ROUND } from '../lib/rewards';
import { activeUnit, useStore } from '../lib/store';
import { formatClock, useNow } from '../lib/useNow';

function questionFor(key: string, vocab: ReturnType<typeof activeUnit>['vocab'], box: number): Question | null {
  const [id, dir] = key.split('|');
  const v = vocab.find((x) => x.id === id);
  if (!v) return null;
  if (dir === 'en-de') return vocabMcEnDe(v, vocab);
  const r = Math.random();
  if (box <= 1 && canScramble(v) && r < 0.25) return vocabScramble(v);
  if (r > 0.8) return vocabDictation(v);
  return vocabTypeDeEn(v);
}

export function LearnScreen({ onHome }: { onHome: () => void }) {
  const { state, update } = useStore();
  const unit = activeUnit(state);
  const minutes = state.settings.learnMinutes;
  const [startedAt] = useState(() => Date.now());
  const [queue, setQueue] = useState<string[]>(() => dueCards(unit.vocab, state.decks[unit.id] ?? {}));
  const [pos, setPos] = useState(0);
  const [stats, setStats] = useState({ answers: 0, right: 0, xp: 0 });
  const [finished, setFinished] = useState<null | { badges: string[]; bonus: number }>(null);
  const answeredOnce = useRef(new Set<string>());

  const now = useNow(!finished);
  const left = startedAt + minutes * 60_000 - now;
  const key = queue[pos];
  const deck = fullDeck(unit.vocab, state.decks[unit.id] ?? {});
  // A new task per position; re-asked cards get a fresh task type.
  const q = useMemo(() => (key ? questionFor(key, unit.vocab, deck[key]?.box ?? 0) : null), [key, pos]);

  const end = (answers: number) => {
    const newOnes: string[] = [];
    const bonus = answers >= LEARN_MIN_ANSWERS ? XP_LEARN_ROUND : 0;
    const learnDays = answers > 0 && !state.learnDays.includes(today()) ? [...state.learnDays, today()] : state.learnDays;
    const badges = { ...state.badges };
    const next = { ...state, learnDays, badges, xp: state.xp + bonus };
    checkLearnBadges(next, badges, newOnes);
    update(() => next);
    setFinished({ badges: newOnes, bonus });
  };

  if (finished || (!q && queue.length === 0)) {
    const counts = boxCounts(unit.vocab, state.decks[unit.id] ?? {});
    return (
      <div className="screen">
        <h1>Lernrunde</h1>
        {queue.length === 0 && !finished ? (
          <p className="lead">Für heute ist alles gelernt! Komm morgen wieder. 🌙</p>
        ) : (
          <>
            <p className="lead">
              Geschafft! {stats.right} von {stats.answers} beim ersten Versuch richtig.
            </p>
            <p className="xp-earned">+{stats.xp + (finished?.bonus ?? 0)} XP</p>
            {finished?.badges.map((id) => {
              const b = BADGES.find((x) => x.id === id);
              return b ? (
                <div key={id} className="badge new">
                  {b.emoji} <b>{b.title}</b> – {b.description}
                </div>
              ) : null;
            })}
          </>
        )}
        <BoxBar counts={counts} />
        <button className="btn primary big" onClick={onHome}>
          Zur Startseite
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="exam-header">
        <div>
          <b>Lernmodus</b>
          <div className="muted small">
            Karte {Math.min(pos + 1, queue.length)} von {queue.length} · Fach {Math.max(1, deck[key]?.box ?? 1)}
          </div>
        </div>
        <div className="timer">⏱ {formatClock(left)}</div>
        <button className="btn small" onClick={() => end(stats.answers)}>
          Beenden
        </button>
      </div>
      {q && (
        <QuestionView
          key={`${q.uid}-${pos}`}
          q={q}
          mode="learn"
          speech={{ rate: state.settings.speechRate, voiceURI: state.settings.voiceURI }}
          extraSolution={(() => {
            const v = unit.vocab.find((x) => x.id === key.split('|')[0]);
            return v ? `${v.en} = ${v.de}${v.example ? ` · ${v.example}` : ''}` : undefined;
          })()}
          onGraded={(g) => {
            const first = !answeredOnce.current.has(key);
            answeredOnce.current.add(key);
            if (first) {
              update((s) => {
                const d = fullDeck(unit.vocab, s.decks[unit.id] ?? {});
                return {
                  ...s,
                  xp: s.xp + (g.correct ? XP_LEARN_CORRECT : 0),
                  decks: { ...s.decks, [unit.id]: { ...d, [key]: answerCard(d[key], g.correct) } },
                };
              });
              setStats((st) => ({
                answers: st.answers + 1,
                right: st.right + (g.correct ? 1 : 0),
                xp: st.xp + (g.correct ? XP_LEARN_CORRECT : 0),
              }));
            }
            // Wrong cards come back once more at the end of the round.
            if (!g.correct) setQueue((qu) => [...qu, key]);
          }}
          onNext={() => {
            if (left <= 0 || pos + 1 >= queue.length) end(stats.answers);
            else setPos(pos + 1);
          }}
        />
      )}
    </div>
  );
}

export function BoxBar({ counts }: { counts: number[] }) {
  const labels = ['Neu', 'Fach 1', 'Fach 2', 'Fach 3', 'Fach 4', 'Fach 5'];
  return (
    <div className="boxes">
      {counts.map((c, i) => (
        <div key={i} className={`box box-${i}`}>
          <div className="box-count">{c}</div>
          <div className="box-label">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}
