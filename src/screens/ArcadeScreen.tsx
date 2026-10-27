import { MiniGames } from '../components/MiniGames';
import type { MiniGameInfo } from '../lib/minigames';
import { activeUnit, useStore } from '../lib/store';

/** The arcade: the unlocked break games, any time, just for fun and without XP. */
export function ArcadeScreen({ start, onHome }: { start?: MiniGameInfo; onHome: () => void }) {
  const { state } = useStore();
  return (
    <div className="screen">
      <div className="exam-header">
        <h1>🎮 Spielhalle</h1>
        <button className="btn" onClick={onHome}>
          Zur Startseite
        </button>
      </div>
      <MiniGames
        xp={state.xp}
        vocab={activeUnit(state).vocab}
        start={start}
        intro="Hier kannst du alle freigeschalteten Spiele einfach so spielen. Punkte und XP gibt es hier keine."
      />
    </div>
  );
}
