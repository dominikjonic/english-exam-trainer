import { useMemo, useState } from 'react';
import type { VocabItem } from '../../data/types';
import { pick } from '../../lib/random';
import { useKeys } from './useKeys';

const MAX_WRONG = 7;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Guess the English word letter by letter; each wrong letter melts the penguin's ice floe. */
export function Hangman({ vocab }: { vocab: VocabItem[] }) {
  const words = useMemo(() => vocab.filter((v) => /^[a-z]{3,}$/i.test(v.en)), [vocab]);
  const [item, setItem] = useState(() => pick(words));
  const [guessed, setGuessed] = useState<string[]>([]);
  const word = item.en.toUpperCase();
  const wrong = guessed.filter((l) => !word.includes(l)).length;
  const won = [...word].every((l) => guessed.includes(l));
  const lost = wrong >= MAX_WRONG;

  const guess = (l: string) => {
    if (won || lost || guessed.includes(l)) return;
    setGuessed((g) => [...g, l]);
  };
  useKeys((k) => /^[a-z]$/i.test(k) && guess(k.toUpperCase()));

  const next = () => {
    setItem(pick(words.filter((w) => w !== item)));
    setGuessed([]);
  };

  return (
    <div className="game hangman">
      <p>
        Tipp: <b>{item.de}</b> · Noch {MAX_WRONG - wrong} Fehlversuche
      </p>
      <div className="ice">
        <div className="ice-floe" style={{ width: `${30 + ((MAX_WRONG - wrong) / MAX_WRONG) * 70}%` }}>
          <span key={`${wrong}-${won}-${lost}`} className={`ice-penguin ${lost ? 'sink' : won ? 'cheer' : wrong ? 'wobble' : ''}`}>
            {lost ? '💦' : '🐧'}
          </span>
        </div>
      </div>
      <div className="hangman-word">
        {[...word].map((l, i) => (
          <span key={i} className="hangman-letter">
            {guessed.includes(l) || lost ? l : '_'}
          </span>
        ))}
      </div>
      <div className="letter-keys">
        {ALPHABET.map((l) => (
          <button
            key={l}
            className={`btn small ${guessed.includes(l) ? (word.includes(l) ? 'hit' : 'miss') : ''}`}
            disabled={guessed.includes(l) || won || lost}
            onClick={() => guess(l)}
          >
            {l}
          </button>
        ))}
      </div>
      {(won || lost) && (
        <div className="game-over">
          <p>{won ? 'Gerettet! Der Pinguin bleibt trocken. 🎉' : `Platsch! Das Wort war ${item.en}.`}</p>
          <button className="btn primary" onClick={next}>
            Nächstes Wort
          </button>
        </div>
      )}
    </div>
  );
}
