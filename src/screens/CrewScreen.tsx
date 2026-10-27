import { useState } from 'react';
import './crew.css';
import { Hero } from '../components/hero/Hero';
import { buyItem, equipItem, gold, HEROES, ITEMS, type Slot } from '../lib/pirates';
import { levelFor } from '../lib/rewards';
import { useStore } from '../lib/store';

const SLOTS: { id: Slot; label: string }[] = [
  { id: 'hat', label: 'Hüte' },
  { id: 'coat', label: 'Mäntel' },
  { id: 'pet', label: 'Begleiter' },
];

const LINES = ['Ahoi!', 'Bereit für Vokabeln?', 'Auf zum Schatz!', 'Yo-ho-ho!'];

/** Pick a hero, buy skins with gold and put them on. */
export function CrewScreen({ onHome }: { onHome: () => void }) {
  const { state, update } = useStore();
  const [slot, setSlot] = useState<Slot>('hat');
  const [picking, setPicking] = useState(!state.heroId);
  const [flash, setFlash] = useState<string | null>(null);
  const hero = HEROES.find((h) => h.id === state.heroId) ?? HEROES[0];
  const coins = gold(state);

  if (picking) {
    return (
      <div className="screen game-screen">
        <h1 className="game-title">Wähle deinen Helden</h1>
        <p className="lead">Dein Held begleitet dich durch jede Prüfung. Du kannst später wechseln, deine Skins bleiben.</p>
        <div className="crew-pick">
          {HEROES.map((h) => (
            <button
              key={h.id}
              className={`crew-card ${h.id === state.heroId ? 'chosen' : ''}`}
              onClick={() => {
                update((s) => ({ ...s, heroId: h.id }));
                setPicking(false);
              }}
            >
              <Hero hero={h} equipped={{ hat: 'bandana', coat: 'shirt', pet: null }} />
              <span className="crew-name">{h.name}</span>
              <span className="crew-role">{h.role}</span>
            </button>
          ))}
        </div>
        {state.heroId && (
          <button className="btn" onClick={() => setPicking(false)}>
            Zurück
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="screen game-screen">
      <div className="crew-top">
        <button className="btn small" onClick={onHome}>
          ← Start
        </button>
        <div className="coin-pill" aria-label={`${coins} Gold`}>
          <span className="coin" aria-hidden="true" /> {coins}
        </div>
      </div>
      <div className="crew-layout">
        <div className="crew-stage">
          <h1 className="game-title">{hero.name}</h1>
          <p className="crew-sub">
            {hero.role} · Level {levelFor(state.xp)}
          </p>
          <Hero hero={hero} equipped={state.equipped} entrance lines={LINES} />
          <div className="pedestal" aria-hidden="true" />
          <button className="btn small" onClick={() => setPicking(true)}>
            Held wechseln
          </button>
        </div>
        <div className="crew-shop">
          <div className="shop-tabs" role="tablist">
            {SLOTS.map((s) => (
              <button key={s.id} role="tab" aria-selected={slot === s.id} className={`shop-tab ${slot === s.id ? 'active' : ''}`} onClick={() => setSlot(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="shop-grid">
            {ITEMS.filter((i) => i.slot === slot).map((it) => {
              const owned = state.owned.includes(it.id);
              const worn = state.equipped[it.slot] === it.id;
              const afford = coins >= it.cost;
              return (
                <div key={it.id} className={`shop-item ${worn ? 'worn' : ''} ${flash === it.id ? 'flash' : ''}`}>
                  <span className="shop-emoji">{it.emoji}</span>
                  <b>{it.name}</b>
                  <span className="shop-perk">{it.perkText}</span>
                  {owned ? (
                    <button className={`btn small ${worn ? 'primary' : ''}`} onClick={() => update((s) => equipItem(s, it.id))} disabled={worn && it.slot !== 'pet'}>
                      {worn ? (it.slot === 'pet' ? 'Absetzen' : 'Angezogen') : 'Anziehen'}
                    </button>
                  ) : (
                    <button
                      className="btn small buy"
                      disabled={!afford}
                      onClick={() => {
                        update((s) => buyItem(s, it.id) ?? s);
                        setFlash(it.id);
                        setTimeout(() => setFlash(null), 900);
                      }}
                    >
                      <span className="coin" aria-hidden="true" /> {it.cost}
                    </button>
                  )}
                  {!owned && !afford && <span className="shop-need">noch {it.cost - coins} Gold</span>}
                </div>
              );
            })}
          </div>
          <p className="muted small">
            Gold bekommst du mit jedem XP in der Prüfung und im Lernmodus. Ausgeben senkt dein Level nicht. Die Fähigkeiten wirken in der Prüfung,
            helfen aber nie beim Beantworten.
          </p>
        </div>
      </div>
    </div>
  );
}
