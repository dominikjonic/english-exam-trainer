import { useState, type ReactNode } from 'react';
import type { VocabItem } from '../data/types';
import { isUnlocked, MINI_GAMES, nextLocked, type MiniGameInfo } from '../lib/minigames';
import { ConnectFour } from './games/ConnectFour';
import { GiraffeJump } from './games/GiraffeJump';
import { Hangman } from './games/Hangman';
import { SimonParrot } from './games/SimonParrot';
import { SlidePuzzle } from './games/SlidePuzzle';
import { Snake } from './games/Snake';
import { TicTacToe } from './games/TicTacToe';
import { WhackMonkey } from './games/WhackMonkey';
import { WordSearch } from './games/WordSearch';
import { Zoo2048 } from './games/Zoo2048';
import { HairlineGiraffe } from './hairline/HairlineGiraffe';
import { MemoryGame } from './MemoryGame';
import './games/games.css';

function renderGame(id: string, vocab: VocabItem[]): ReactNode {
  switch (id) {
    case 'memory':
      return <MemoryGame />;
    case 'hangman':
      return <Hangman vocab={vocab} />;
    case 'wordsearch':
      return <WordSearch vocab={vocab} />;
    case 'whack':
      return <WhackMonkey />;
    case 'simon':
      return <SimonParrot />;
    case 'tictactoe':
      return <TicTacToe />;
    case 'slide':
      return <SlidePuzzle />;
    case 'snake':
      return <Snake />;
    case 'jump':
      return <GiraffeJump />;
    case 'connect4':
      return <ConnectFour />;
    case 'zoo2048':
      return <Zoo2048 />;
  }
  return null;
}

/** All break games as tiles; locked ones show how many XP they need. */
export function GameGallery({ xp, onPick }: { xp: number; onPick?: (g: MiniGameInfo) => void }) {
  return (
    <div className="game-gallery">
      {MINI_GAMES.map((g) => {
        const open = isUnlocked(g, xp);
        return (
          <button
            key={g.id}
            className={`game-tile ${open ? 'open' : 'locked'}`}
            disabled={!open || !onPick}
            onClick={() => onPick?.(g)}
            title={g.description}
          >
            <span className="game-tile-emoji">{open ? g.emoji : '🔒'}</span>
            <span className="game-tile-title">{g.title}</span>
            <span className="game-tile-sub">{open ? g.description : `ab ${g.unlockXp} XP · noch ${g.unlockXp - xp} XP`}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pick one of the unlocked games, in the exam break or in the arcade.
 * Nothing here is graded and no XP is earned.
 */
export function MiniGames({ xp, vocab, intro, start }: { xp: number; vocab: VocabItem[]; intro?: string; start?: MiniGameInfo }) {
  const [game, setGame] = useState<MiniGameInfo | null>(start ?? null);
  const next = nextLocked(xp);

  if (!game) {
    return (
      <div>
        <div className="pause-hero">
          <HairlineGiraffe />
          <p>{intro ?? 'Such dir ein Spiel aus! Hier gibt es keine Punkte und keine XP – einfach durchatmen.'} Und die Giraffe schaut dahin, wo deine Maus ist. 🦒</p>
        </div>
        <GameGallery xp={xp} onPick={setGame} />
        {next && (
          <p className="muted small">
            Nächstes Spiel: {next.emoji} {next.title} bei {next.unlockXp} XP. XP bekommst du in der Prüfung und im Lernmodus.
          </p>
        )}
      </div>
    );
  }
  return (
    <div>
      <div className="row">
        <button className="btn small" onClick={() => setGame(null)}>
          ← Anderes Spiel
        </button>
        <b>
          {game.emoji} {game.title}
        </b>
      </div>
      {renderGame(game.id, vocab)}
    </div>
  );
}
