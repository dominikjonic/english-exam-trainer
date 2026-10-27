import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gradeQuestion, kindLabel, type Graded, type Question, type Response } from '../lib/questions';
import { Diff } from './Diff';
import { ScenePicture } from './ScenePicture';

interface Props {
  q: Question;
  /** "exam": no help. "learn": shows the example sentence after answering. */
  mode: 'exam' | 'learn';
  onGraded: (g: Graded) => void;
  onNext: () => void;
  extraSolution?: string;
}

export function QuestionView({ q, mode, onGraded, onNext, extraSolution }: Props) {
  const [graded, setGraded] = useState<Graded | null>(null);
  const [response, setResponse] = useState<Response>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (graded) nextRef.current?.focus();
  }, [graded]);

  const submit = (r: Response) => {
    if (graded) return;
    const g = gradeQuestion(q, r);
    setResponse(r);
    setGraded(g);
    onGraded(g);
  };

  return (
    <div className="question">
      <div className="q-kind">{kindLabel(q)}</div>
      <p className="q-instruction">{q.instruction}</p>
      {q.picture && <ScenePicture scene={q.picture} />}
      <Body q={q} graded={graded} response={response} submit={submit} mode={mode} />
      {graded && (
        <Feedback q={q} g={graded} mode={mode} extraSolution={extraSolution}>
          <button ref={nextRef} className="btn primary" onClick={onNext}>
            Weiter →
          </button>
        </Feedback>
      )}
    </div>
  );
}

interface BodyProps {
  q: Question;
  graded: Graded | null;
  response: Response;
  submit: (r: Response) => void;
  mode: 'exam' | 'learn';
}

function Body(props: BodyProps) {
  const { q } = props;
  switch (q.kind) {
    case 'mc':
      return <McBody {...props} q={q} />;
    case 'type':
      return <TypeBody {...props} q={q} />;
    case 'tf':
      return <TfBody {...props} q={q} />;
    case 'match':
      return <MatchBody {...props} q={q} />;
    case 'build':
      return <BuildBody {...props} q={q} />;
    case 'pick':
      return <PickBody {...props} q={q} />;
  }
}

function McBody({ q, graded, response, submit }: BodyProps & { q: Extract<Question, { kind: 'mc' }> }) {
  return (
    <>
      <p className="q-prompt">{q.prompt}</p>
      <div className="options">
        {q.options.map((o) => {
          const cls =
            graded && o === q.answer ? 'right' : graded && o === response ? 'wrong' : '';
          return (
            <button key={o} className={`btn option ${cls}`} disabled={!!graded} onClick={() => submit(o)}>
              {o}
            </button>
          );
        })}
      </div>
    </>
  );
}

function TypeBody({ q, graded, submit }: BodyProps & { q: Extract<Question, { kind: 'type' }> }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) submit(value);
  };
  return (
    <form onSubmit={onSubmit}>
      <p className="q-prompt">{q.prompt}</p>
      {q.context && <p className="q-context">({q.context})</p>}
      {q.letters && (
        <div className="letters">
          {q.letters.map((l, i) => (
            <span key={i} className="letter">
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="type-row">
        <input
          ref={inputRef}
          className="answer-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!!graded}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Deine Antwort"
          placeholder="Antwort eintippen …"
        />
        {!graded && (
          <button className="btn primary" type="submit" disabled={!value.trim()}>
            Prüfen
          </button>
        )}
      </div>
    </form>
  );
}

function TfBody({ q, graded, response, submit }: BodyProps & { q: Extract<Question, { kind: 'tf' }> }) {
  const cls = (v: boolean) => (graded && v === q.answer ? 'right' : graded && v === response ? 'wrong' : '');
  return (
    <>
      <p className="q-prompt">{q.statement}</p>
      <div className="options two">
        <button className={`btn option ${cls(true)}`} disabled={!!graded} onClick={() => submit(true)}>
          ✔ Richtig
        </button>
        <button className={`btn option ${cls(false)}`} disabled={!!graded} onClick={() => submit(false)}>
          ✘ Falsch
        </button>
      </div>
    </>
  );
}

function MatchBody({ q, graded, submit }: BodyProps & { q: Extract<Question, { kind: 'match' }> }) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const usedRight = new Set(Object.values(pairs));
  const colorOf = (key: string) => q.pairs.findIndex((p) => p.key === key);

  const clickLeft = (key: string) => {
    if (graded) return;
    if (pairs[key]) {
      const next = { ...pairs };
      delete next[key];
      setPairs(next);
    }
    setActive(key);
  };
  const clickRight = (right: string) => {
    if (graded || !active) return;
    const next = Object.fromEntries(Object.entries(pairs).filter(([, r]) => r !== right));
    next[active] = right;
    setPairs(next);
    setActive(null);
  };
  const rightOwner = (right: string) => Object.entries(pairs).find(([, r]) => r === right)?.[0];
  const correctness = (key: string) => (graded ? (pairs[key] === q.pairs.find((p) => p.key === key)!.right ? 'right' : 'wrong') : '');

  return (
    <>
      <div className="match">
        <div className="match-col">
          {q.pairs.map((p) => (
            <button
              key={p.key}
              className={`btn option ${active === p.key ? 'active' : ''} ${pairs[p.key] ? `pair-${colorOf(p.key)}` : ''} ${correctness(p.key)}`}
              disabled={!!graded}
              onClick={() => clickLeft(p.key)}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="match-col">
          {q.rightOrder.map((r) => {
            const owner = rightOwner(r);
            return (
              <button
                key={r}
                className={`btn option ${owner ? `pair-${colorOf(owner)}` : ''}`}
                disabled={!!graded || (!active && !usedRight.has(r))}
                onClick={() => clickRight(r)}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
      {!graded && (
        <button className="btn primary" disabled={Object.keys(pairs).length < q.pairs.length} onClick={() => submit(pairs)}>
          Prüfen
        </button>
      )}
    </>
  );
}

function BuildBody({ q, graded, submit }: BodyProps & { q: Extract<Question, { kind: 'build' }> }) {
  // Indices into q.words, in the order the learner tapped them.
  const [chosen, setChosen] = useState<number[]>([]);
  const words = chosen.map((i) => q.words[i]);
  return (
    <>
      {q.german && <p className="q-context">{q.german}</p>}
      <div className="build-line" aria-label="Dein Satz">
        {chosen.length === 0 && <span className="placeholder">Tippe die Wörter unten an …</span>}
        {chosen.map((i, pos) => (
          <button key={pos} className="btn tile" disabled={!!graded} onClick={() => setChosen(chosen.filter((_, p) => p !== pos))}>
            {q.words[i]}
          </button>
        ))}
      </div>
      <div className="tiles">
        {q.words.map((w, i) => (
          <button
            key={i}
            className="btn tile"
            disabled={!!graded || chosen.includes(i)}
            onClick={() => setChosen([...chosen, i])}
          >
            {w}
          </button>
        ))}
      </div>
      {!graded && (
        <button className="btn primary" disabled={chosen.length < q.words.length} onClick={() => submit(words)}>
          Prüfen
        </button>
      )}
    </>
  );
}

function PickBody({ q, graded, response, submit }: BodyProps & { q: Extract<Question, { kind: 'pick' }> }) {
  return (
    <>
      <p className="q-prompt">{q.sentence}</p>
      <div className="pick">
        {q.options.map((s, i) => {
          const cls = graded && i === q.answerIndex ? 'right' : graded && i === response ? 'wrong' : '';
          return (
            <button key={i} className={`btn pick-option ${cls}`} disabled={!!graded} onClick={() => submit(i)} aria-label={`Bild ${i + 1}`}>
              <ScenePicture scene={s} small />
              <span>Bild {i + 1}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Feedback({
  q,
  g,
  mode,
  extraSolution,
  children,
}: {
  q: Question;
  g: Graded;
  mode: 'exam' | 'learn';
  extraSolution?: string;
  children: React.ReactNode;
}) {
  const typed = q.kind === 'type';
  return (
    <div className={`feedback ${g.correct ? 'ok' : 'bad'}`} role="status">
      <strong>
        {g.correct
          ? '✔ Richtig!'
          : q.kind === 'match'
            ? `✘ ${g.points} von ${g.maxPoints} richtig zugeordnet.`
            : g.spelling
              ? '✘ Fast! Aber ein Tippfehler zählt als Fehler.'
              : '✘ Leider falsch.'}
      </strong>
      {!g.correct && typed && <Diff given={g.given} expected={g.expected} letters={g.spelling} />}
      {!g.correct && q.kind === 'match' && (
        <ul className="match-solution">
          {q.pairs.map((p) => (
            <li key={p.key}>
              {p.left} = {p.right}
            </li>
          ))}
        </ul>
      )}
      {!g.correct && !typed && q.kind !== 'match' && q.kind !== 'pick' && (
        <p>
          Richtig ist: <b>{g.expected}</b>
        </p>
      )}
      {'solution' in q && q.solution && (mode === 'learn' || !g.correct || q.kind === 'type') && <p className="solution">{q.solution}</p>}
      {mode === 'learn' && extraSolution && <p className="solution">{extraSolution}</p>}
      {children}
    </div>
  );
}
