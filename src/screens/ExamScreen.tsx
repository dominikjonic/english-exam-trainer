import { useEffect, useMemo, useRef, useState } from 'react';
import { MiniGames } from '../components/MiniGames';
import { QuestionView } from '../components/QuestionView';
import { bossRound, buildPart, EXAM_MINUTES, EXAM_PARTS, retryQuestion, type ExamContext, type Mistake } from '../lib/exam';
import { Hero } from '../components/hero/Hero';
import { HEROES, perksOf } from '../lib/pirates';
import { gradeQuestion, kindLabel, type Graded, type Question } from '../lib/questions';
import { finishExam, type Answered } from '../lib/results';
import { activeUnit, useStore } from '../lib/store';
import type { ExamResult } from '../lib/types';
import { formatClock, useNow } from '../lib/useNow';

type Phase = { kind: 'start' } | { kind: 'intro'; part: number } | { kind: 'run'; part: number } | { kind: 'done' };

export function ExamScreen({ onFinish, onCancel }: { onFinish: (r: ExamResult) => void; onCancel: () => void }) {
  const { state, replace } = useStore();
  const unit = activeUnit(state);
  const [phase, setPhase] = useState<Phase>({ kind: 'start' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [partEndsAt, setPartEndsAt] = useState(0);
  const [examStart, setExamStart] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const answered = useRef<Answered[]>([]);
  const currentGraded = useRef(false);
  // Second-chance perk: extra questions left in this exam, and which tasks are extra ones.
  const hero = HEROES.find((h) => h.id === state.heroId);
  const perks = useMemo(() => perksOf(state.equipped), []);
  const chancesLeft = useRef(perks.secondChances);
  const bonusIds = useRef(new Set<string>());
  const ctx = useMemo<ExamContext>(() => ({ unit, weak: state.weak[unit.id] ?? {}, used: new Set() }), [unit, state.weak]);

  const running = phase.kind === 'run';
  const now = useNow(running || phase.kind === 'intro');
  const part = phase.kind === 'intro' || phase.kind === 'run' ? EXAM_PARTS[phase.part] : null;
  const remaining = partEndsAt - now;

  const finish = () => {
    const duration = Math.round((Date.now() - examStart) / 1000);
    const out = finishExam(state, unit, answered.current, duration);
    replace(out.state);
    setPhase({ kind: 'done' });
    onFinish(out.result);
  };

  const goToPart = (p: number) => {
    if (p >= EXAM_PARTS.length) finish();
    else setPhase({ kind: 'intro', part: p });
  };

  const startPart = (p: number) => {
    const plan = EXAM_PARTS[p];
    if (plan.id === 'pause') setQuestions([]);
    else if (plan.id === 'D') {
      const mistakes: Mistake[] = answered.current
        .filter((a) => !a.g.correct)
        .flatMap((a) => a.g.wrongKeys.map((itemKey) => ({ itemKey, kind: kindLabel(a.q) })));
      setQuestions(bossRound(unit, mistakes, ctx.weak));
    } else setQuestions(buildPart(plan.id, ctx));
    setIndex(0);
    currentGraded.current = false;
    setPartEndsAt(Date.now() + (plan.minutes + (plan.id === 'pause' ? 0 : perks.extraMinutes)) * 60_000);
    setPhase({ kind: 'run', part: p });
  };

  const endPart = (p: number, fromIndex: number) => {
    // Unanswered tasks count as wrong when the time is up; an unanswered extra question just lapses.
    for (const q of questions.slice(fromIndex)) {
      if (bonusIds.current.has(q.uid)) continue;
      const g: Graded = { ...gradeQuestion(q, null), given: '(keine Zeit mehr)' };
      answered.current.push({ partId: EXAM_PARTS[p].id, q, g });
    }
    goToPart(p + 1);
  };

  const timeUp = running && remaining <= 0;
  useEffect(() => {
    if (timeUp && phase.kind === 'run') endPart(phase.part, currentGraded.current ? index + 1 : index);
    // Only react to the moment the time runs out.
  }, [timeUp]);

  if (phase.kind === 'start') {
    return (
      <div className="screen">
        <h1>Übungs-Schularbeit</h1>
        <p className="lead">
          {unit.title}
          {unit.subtitle ? ` – ${unit.subtitle}` : ''} · {EXAM_MINUTES} Minuten
        </p>
        <table className="plan">
          <tbody>
            {EXAM_PARTS.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.from}–{p.from + p.minutes}
                </td>
                <td>
                  <b>{p.title}</b>
                  <br />
                  <span className="muted">{p.subtitle}</span>
                </td>
              </tr>
            ))}
            <tr>
              <td>47–50</td>
              <td>
                <b>Auswertung</b>
                <br />
                <span className="muted">Note, Fehlerliste, verdiente XP</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="rules">
          <h3>Regeln wie bei der Schularbeit</h3>
          <ul>
            <li>Keine Hilfen. Der Timer läuft sichtbar mit.</li>
            <li>Rechtschreibung zählt: Ein Tippfehler ist ein Fehler. Danach siehst du den Unterschied.</li>
            <li>Wenn die Zeit für einen Teil um ist, geht es automatisch weiter.</li>
            {perks.secondChances > 0 && <li>🎩 Dein Hut: {perks.secondChances} Zusatzfrage(n) nach einer falschen Antwort.</li>}
            {perks.extraMinutes > 0 && <li>🧭 Dein Mantel: +{perks.extraMinutes} Minute(n) pro Teil.</li>}
            {perks.xpFactor > 1 && <li>🦜 Dein Papagei: +{Math.round((perks.xpFactor - 1) * 100)} % XP und Gold.</li>}
          </ul>
        </div>
        <div className="row">
          <button className="btn" onClick={onCancel}>
            Zurück
          </button>
          <button
            className="btn primary big"
            onClick={() => {
              setExamStart(Date.now());
              answered.current = [];
              setPhase({ kind: 'intro', part: 0 });
            }}
          >
            Prüfung starten
          </button>
        </div>
      </div>
    );
  }

  if (phase.kind === 'done' || !part) return <div className="screen">Auswertung …</div>;

  const header = (
    <div className="exam-header">
      <div>
        <b>{part.title}</b>
        <div className="muted small">Prüfungszeit {formatClock(now - examStart)} von {EXAM_MINUTES}:00</div>
      </div>
      {running && (
        <div className={`timer ${remaining < 60_000 ? 'urgent' : ''}`} aria-label="Restzeit für diesen Teil">
          ⏱ {formatClock(remaining)}
        </div>
      )}
      <div>
        {confirmCancel ? (
          <span className="confirm">
            Wirklich abbrechen?{' '}
            <button className="btn small danger" onClick={onCancel}>
              Ja
            </button>{' '}
            <button className="btn small" onClick={() => setConfirmCancel(false)}>
              Nein
            </button>
          </span>
        ) : (
          <button className="btn small" onClick={() => setConfirmCancel(true)}>
            Abbrechen
          </button>
        )}
      </div>
    </div>
  );

  if (phase.kind === 'intro') {
    return (
      <div className="screen">
        {header}
        <div className="part-intro">
          {hero && (
            <div className="intro-hero">
              <Hero hero={hero} equipped={state.equipped} entrance lines={['Du schaffst das!', 'Konzentriert bleiben!', 'Auf geht’s!']} />
            </div>
          )}
          <h2>{part.title}</h2>
          <p>{part.subtitle}</p>
          <p className="muted">Zeit: {part.minutes} Minuten</p>
          <button className="btn primary big" onClick={() => startPart(phase.part)}>
            {part.id === 'pause' ? 'Pause starten' : 'Los geht’s!'}
          </button>
        </div>
      </div>
    );
  }

  if (part.id === 'pause') {
    return (
      <div className="screen">
        {header}
        <h2>Kurze Pause 🌴</h2>
        <MiniGames xp={state.xp} vocab={unit.vocab} />
        <button className="btn primary" onClick={() => goToPart(phase.part + 1)}>
          Pause beenden
        </button>
      </div>
    );
  }

  const q = questions[index];
  if (!q) return <div className="screen">{header}</div>;

  return (
    <div className="screen">
      {header}
      <div className="progress">
        <div className="progress-bar" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <div className="muted small">
        Aufgabe {index + 1} von {questions.length}
        {perks.secondChances > 0 && <> · 🎩 Zusatzfragen übrig: {chancesLeft.current}</>}
      </div>
      {bonusIds.current.has(q.uid) && (
        <div className="bonus-banner">🎩 Zusatzfrage! Richtig beantwortet holst du dir den verlorenen Punkt zurück.</div>
      )}
      <QuestionView
        key={q.uid}
        q={q}
        mode="exam"
        onGraded={(g) => {
          currentGraded.current = true;
          const bonus = bonusIds.current.has(q.uid);
          answered.current.push({ partId: part.id, q, g, ...(bonus ? { bonus } : {}) });
          // A wrong answer brings an extra question on the same item, while the hat has chances left.
          if (!g.correct && !bonus && chancesLeft.current > 0) {
            const extra = retryQuestion(g.wrongKeys[0] ?? q.itemKey, kindLabel(q), unit);
            if (extra) {
              chancesLeft.current--;
              bonusIds.current.add(extra.uid);
              setQuestions((qs) => [...qs.slice(0, index + 1), extra, ...qs.slice(index + 1)]);
            }
          }
        }}
        onNext={() => {
          currentGraded.current = false;
          if (index + 1 >= questions.length) goToPart(phase.part + 1);
          else setIndex(index + 1);
        }}
      />
    </div>
  );
}
