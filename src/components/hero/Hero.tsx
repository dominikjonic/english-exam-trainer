import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { HeroInfo, Slot } from '../../lib/pirates';
import './hero.css';

/** Mixes a hex colour with white (amt > 0) or black (amt < 0). */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

interface Props {
  hero: HeroInfo;
  equipped: Record<Slot, string | null>;
  /** Plays the landing jump when it appears. */
  entrance?: boolean;
  /** A short line in a speech bubble when tapped. */
  lines?: string[];
  className?: string;
}

/**
 * A pirate hero drawn in SVG, in layers so the skins show: hair, hat, coat and
 * pet. It breathes, blinks, follows the pointer with its eyes, and hops and
 * waves when tapped. All motion stops under "reduce motion".
 */
export function Hero({ hero, equipped, entrance = false, lines = ['Ahoi!'], className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  const u = (name: string) => `${name}-${id}`;
  const url = (name: string) => `url(#${u(name)})`;
  const svg = useRef<SVGSVGElement>(null);
  const [look, setLook] = useState<[number, number]>([0, 0]);
  const [hop, setHop] = useState(0);
  const [say, setSay] = useState<string | null>(null);
  const [hatKey, setHatKey] = useState(0);
  const lineIdx = useRef(0);
  const prevHat = useRef(equipped.hat);

  // A new hat drops in.
  useEffect(() => {
    if (prevHat.current === equipped.hat) return;
    prevHat.current = equipped.hat;
    setHatKey((k) => k + 1);
  }, [equipped.hat]);

  useEffect(() => {
    if (!say) return;
    const t = setTimeout(() => setSay(null), 1600);
    return () => clearTimeout(t);
  }, [say, hop]);

  const tap = () => {
    setHop((h) => h + 1);
    setSay(lines[lineIdx.current++ % lines.length]);
  };

  const onMove = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.42;
    const m = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, m * 3) * 5;
    setLook([(dx / m) * k, (dy / m) * k]);
  };

  const skinLight = shade(hero.skin, 0.35);
  const skinDark = shade(hero.skin, -0.18);
  const hairLight = shade(hero.hair, 0.25);
  const pupil = { transform: `translate(${look[0]}px, ${look[1]}px)` };

  return (
    <div className={`hero-wrap ${className}`}>
      <svg
        ref={svg}
        className="hero-svg"
        viewBox="80 170 280 450"
        onPointerMove={onMove}
        onPointerLeave={() => setLook([0, 0])}
        onClick={tap}
        role="img"
        aria-label={`${hero.name}, ${hero.role}`}
      >
        <defs>
          <radialGradient id={u('skin')} cx=".42" cy=".38" r=".75">
            <stop offset="0" stopColor={skinLight} />
            <stop offset=".65" stopColor={hero.skin} />
            <stop offset="1" stopColor={skinDark} />
          </radialGradient>
          <linearGradient id={u('hair')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hairLight} />
            <stop offset="1" stopColor={shade(hero.hair, -0.35)} />
          </linearGradient>
          <radialGradient id={u('iris')} cx=".5" cy=".35" r=".7">
            <stop offset="0" stopColor={shade(hero.eyes, 0.45)} />
            <stop offset=".6" stopColor={hero.eyes} />
            <stop offset="1" stopColor={shade(hero.eyes, -0.5)} />
          </radialGradient>
          <linearGradient id={u('red')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e2493f" />
            <stop offset="1" stopColor="#9c2427" />
          </linearGradient>
          <radialGradient id={u('redR')} cx=".4" cy=".3" r=".8">
            <stop offset="0" stopColor="#ff6a4d" />
            <stop offset="1" stopColor="#c3241f" />
          </radialGradient>
          <linearGradient id={u('pants')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a7fd0" />
            <stop offset="1" stopColor="#3a5aa6" />
          </linearGradient>
          <linearGradient id={u('boot')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8a5532" />
            <stop offset="1" stopColor="#4f2c16" />
          </linearGradient>
          <linearGradient id={u('gold')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff0a0" />
            <stop offset=".5" stopColor="#ffc93c" />
            <stop offset="1" stopColor="#c98a12" />
          </linearGradient>
          <linearGradient id={u('dark')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b3350" />
            <stop offset="1" stopColor="#15121f" />
          </linearGradient>
          <linearGradient id={u('brown')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9a6438" />
            <stop offset="1" stopColor="#5b3519" />
          </linearGradient>
          <linearGradient id={u('teal')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2fa3b0" />
            <stop offset="1" stopColor="#14636e" />
          </linearGradient>
          <linearGradient id={u('navy')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a4f8f" />
            <stop offset="1" stopColor="#1b2552" />
          </linearGradient>
          <pattern id={u('stripes')} width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill="#f4f6ff" />
            <rect y="8" width="14" height="5" fill="#2f4c94" />
          </pattern>
        </defs>

        <g key={hop} className={`hero-jump ${hop ? 'hop' : entrance ? 'land' : ''}`}>
          <ellipse className="hero-shadow" cx="220" cy="606" rx="70" ry="13" fill="#0b1230" opacity=".45" />
          <g className="hero-breathe">
            <Legs url={url} />
            <Body coat={equipped.coat} url={url} wave={hop > 0 || entrance} />
            <g className="hero-head">
              <rect x="207" y="400" width="26" height="22" rx="8" fill={skinDark} />
              <HairBack style={hero.hairStyle} fill={url('hair')} />
              <ellipse cx="142" cy="336" rx="16" ry="20" fill={skinDark} />
              <ellipse cx="298" cy="336" rx="16" ry="20" fill={skinDark} />
              <ellipse cx="220" cy="330" rx="78" ry="74" fill={url('skin')} />
              <ellipse cx="166" cy="362" rx="15" ry="9" fill="#ff8a80" opacity=".45" />
              <ellipse cx="274" cy="362" rx="15" ry="9" fill="#ff8a80" opacity=".45" />
              <Eye cx={188} iris={url('iris')} pupil={pupil} />
              <Eye cx={252} iris={url('iris')} pupil={pupil} right />
              <path d="M170 302 c10 -8 24 -8 32 -4" stroke={shade(hero.hair, -0.3)} strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M238 298 c8 -4 22 -4 32 4" stroke={shade(hero.hair, -0.3)} strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M216 362 c3 3 7 3 9 0" stroke={shade(hero.skin, -0.3)} strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M200 376 C206 392 234 392 240 376 C230 382 210 382 200 376 Z" fill="#7d2b25" />
              <path d="M210 384 c6 4 14 4 20 0 c-4 -3 -16 -3 -20 0 z" fill="#ff7c7c" />
              <HairFront style={hero.hairStyle} fill={url('hair')} light={hairLight} />
              <g key={hatKey} className={`hero-hat ${hatKey ? 'drop' : ''}`}>
                <Hat id={equipped.hat} url={url} />
              </g>
            </g>
            <Pet id={equipped.pet} url={url} />
          </g>
        </g>
      </svg>
      {say && (
        <div key={`${hop}-${say}`} className="hero-bubble">
          {say}
        </div>
      )}
    </div>
  );
}

type Url = (name: string) => string;

function Eye({ cx, iris, pupil, right = false }: { cx: number; iris: string; pupil: React.CSSProperties; right?: boolean }) {
  const ix = cx + (right ? -2 : 2);
  return (
    <g className={`hero-eye ${right ? 'r' : ''}`}>
      <ellipse cx={cx} cy="338" rx="21" ry="25" fill="#fff" />
      <g className="hero-pupil" style={pupil}>
        <circle cx={ix} cy="341" r="16" fill={iris} />
        <circle cx={ix} cy="342" r="8" fill="#140a04" />
        <circle cx={ix - 6} cy="333" r="5.6" fill="#fff" />
        <circle cx={ix + 6} cy="348" r="2.4" fill="#fff" opacity=".9" />
      </g>
      <path d={right ? 'M230 322 c10 -14 36 -12 44 0' : 'M166 322 c8 -12 34 -14 44 0'} stroke="#2b1a10" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Legs({ url }: { url: Url }) {
  return (
    <g>
      <path d="M186 500 h26 v62 h-26 z" fill={url('pants')} />
      <path d="M228 500 h26 v62 h-26 z" fill={url('pants')} />
      <path d="M180 556 h36 c4 0 6 6 6 12 v20 c0 8 -6 12 -14 12 h-36 c-10 0 -14 -6 -12 -12 c2 -8 8 -12 16 -14 z" fill={url('boot')} />
      <path d="M224 556 h36 l4 12 c8 2 14 6 16 14 c2 6 -2 12 -12 12 h-36 c-8 0 -14 -4 -14 -12 v-14 z" fill={url('boot')} />
      <rect x="178" y="552" width="40" height="10" rx="4" fill="#a8703f" />
      <rect x="222" y="552" width="40" height="10" rx="4" fill="#a8703f" />
    </g>
  );
}

function Body({ coat, url, wave }: { coat: string | null; url: Url; wave: boolean }) {
  const sleeve = coat === 'navigator' ? '#1f8796' : coat === 'admiral' ? '#2b3b74' : '#f4f6ff';
  const hand = '#f1bf96';
  const torso = 'M160 432 C160 420 180 412 220 412 C260 412 280 420 280 432 L284 506 C284 516 270 522 220 522 C170 522 156 516 156 506 Z';
  let panels: ReactNode;
  if (coat === 'navigator' || coat === 'admiral') {
    const fill = url(coat === 'navigator' ? 'teal' : 'navy');
    panels = (
      <>
        <path d="M158 430 C160 418 178 412 198 412 L208 548 C186 548 164 544 152 536 Z" fill={fill} />
        <path d="M282 430 C280 418 262 412 242 412 L232 548 C254 548 276 544 288 536 Z" fill={fill} />
        <path d="M198 412 L214 444 L206 452 Z M242 412 L226 444 L234 452 Z" fill={coat === 'admiral' ? '#ffc93c' : '#f4f6ff'} />
        {[460, 482, 504].map((y) => (
          <g key={y}>
            <circle cx="199" cy={y} r="4.5" fill={url('gold')} />
            <circle cx="241" cy={y} r="4.5" fill={url('gold')} />
          </g>
        ))}
        {coat === 'admiral' && (
          <g fill={url('gold')}>
            <ellipse cx="166" cy="428" rx="22" ry="9" />
            <ellipse cx="274" cy="428" rx="22" ry="9" />
            <path d="M146 432 v10 M154 434 v12 M162 435 v12 M170 435 v12 M278 435 v12 M286 435 v12 M294 434 v12" stroke="#ffc93c" strokeWidth="3" />
          </g>
        )}
      </>
    );
  } else {
    panels = (
      <>
        <path d="M160 432 C160 420 176 413 196 412 L206 522 C182 521 156 516 156 506 Z" fill={url('red')} />
        <path d="M280 432 C280 420 264 413 244 412 L234 522 C258 521 284 516 284 506 Z" fill={url('red')} />
      </>
    );
  }
  return (
    <g>
      <path d="M160 445 c-22 10 -34 34 -36 60" stroke={sleeve} strokeWidth="26" strokeLinecap="round" fill="none" />
      <circle cx="124" cy="512" r="15" fill={hand} />
      <path d={torso} fill={url('stripes')} />
      <rect x="154" y="490" width="132" height="18" rx="7" fill="#5b3519" />
      <rect x="207" y="487" width="26" height="24" rx="6" fill={url('gold')} stroke="#9a6a10" strokeWidth="2" />
      <rect x="214" y="494" width="12" height="10" rx="2" fill="#5b3519" />
      {panels}
      <g className={`hero-arm ${wave ? 'go' : ''}`}>
        <path d="M282 448 c20 12 30 34 32 56" stroke={sleeve} strokeWidth="26" strokeLinecap="round" fill="none" />
        {coat === 'admiral' && <path d="M306 486 l14 10" stroke="#ffc93c" strokeWidth="8" strokeLinecap="round" />}
        <circle cx="315" cy="512" r="15" fill={hand} />
      </g>
    </g>
  );
}

function HairBack({ style, fill }: { style: HeroInfo['hairStyle']; fill: string }) {
  switch (style) {
    case 'spiky':
      return <path d="M136 300 L118 262 L152 270 L150 228 L182 254 L196 214 L218 248 L244 212 L254 252 L290 228 L284 270 L320 262 L304 300 C314 326 312 344 300 352 L140 352 C128 344 126 326 136 300 Z" fill={fill} />;
    case 'bob':
      return <path d="M136 330 C126 262 168 232 220 232 C272 232 314 262 304 330 L310 384 C304 394 288 394 282 386 L158 386 C152 394 136 394 130 384 Z" fill={fill} />;
    case 'curly':
      return (
        <g fill={fill}>
          {[
            [146, 290, 26], [168, 258, 26], [200, 240, 28], [240, 240, 28], [272, 258, 26], [294, 290, 26], [140, 326, 20], [300, 326, 20],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case 'braids':
      return <path d="M138 320 C132 262 172 236 220 236 C268 236 308 262 302 320 L296 352 L144 352 Z" fill={fill} />;
  }
}

function HairFront({ style, fill, light }: { style: HeroInfo['hairStyle']; fill: string; light: string }) {
  switch (style) {
    case 'spiky':
      return (
        <>
          <path d="M146 300 C150 266 180 248 220 248 C262 248 292 266 296 302 L280 284 L276 304 L258 280 L250 300 L232 276 L222 298 L206 274 L196 300 L182 278 L174 302 L162 284 Z" fill={fill} />
          <path d="M186 262 c14 -6 32 -8 48 -4" stroke={light} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
        </>
      );
    case 'bob':
      return (
        <>
          <path d="M146 306 C148 262 180 244 220 244 C260 244 292 262 294 306 C278 292 258 288 242 298 C232 286 212 284 202 296 C188 286 166 288 146 306 Z" fill={fill} />
          <path d="M184 262 c14 -6 34 -8 52 -2" stroke={light} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
        </>
      );
    case 'curly':
      return (
        <g fill={fill}>
          {[
            [162, 288, 17], [186, 272, 18], [214, 266, 18], [242, 270, 18], [268, 284, 17],
          ].map(([x, y, r]) => (
            <circle key={x} cx={x} cy={y} r={r} />
          ))}
          <circle cx="206" cy="262" r="5" fill={light} opacity=".6" />
        </g>
      );
    case 'braids':
      return (
        <g fill={fill}>
          <path d="M146 306 C150 260 184 242 220 244 L214 270 C196 272 170 286 146 306 Z" />
          <path d="M294 306 C290 260 256 242 220 244 L226 270 C244 272 270 286 294 306 Z" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <ellipse cx="146" cy={372 + i * 22} rx="11" ry="13" />
              <ellipse cx="294" cy={372 + i * 22} rx="11" ry="13" />
            </g>
          ))}
          <circle cx="146" cy="460" r="7" fill="#ff5a6e" />
          <circle cx="294" cy="460" r="7" fill="#ff5a6e" />
        </g>
      );
  }
}

function Hat({ id, url }: { id: string | null; url: Url }) {
  switch (id) {
    case 'bandana':
      return (
        <>
          <path d="M144 300 C142 250 180 226 220 226 C262 226 298 250 296 300 C276 284 252 276 220 276 C188 276 164 284 144 300 Z" fill={url('redR')} />
          <g fill="#fff" opacity=".9">
            {[[190, 258, 4], [222, 248, 4], [252, 258, 4], [170, 276, 3.4], [272, 276, 3.4], [236, 266, 3], [206, 268, 3]].map(([x, y, r]) => (
              <circle key={x} cx={x} cy={y} r={r} />
            ))}
          </g>
          <path d="M292 288 c18 -4 30 4 34 18 c-12 -4 -20 -2 -28 6 z" fill="#c3241f" />
          <path d="M294 292 c16 8 22 22 18 36 c-8 -10 -14 -14 -24 -16 z" fill="#e2493f" />
        </>
      );
    case 'tricorn':
      return (
        <>
          <path d="M128 286 C150 250 186 236 220 236 C254 236 290 250 312 286 C290 282 260 292 220 292 C180 292 150 282 128 286 Z" fill={url('brown')} />
          <path d="M160 270 C166 226 194 204 220 204 C246 204 274 226 280 270 C260 262 240 260 220 260 C200 260 180 262 160 270 Z" fill={url('brown')} />
          <path d="M128 286 C150 250 186 236 220 236 C254 236 290 250 312 286" stroke={url('gold')} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="220" cy="244" r="7" fill={url('gold')} />
        </>
      );
    case 'captain':
      return (
        <>
          <path d="M118 290 C140 270 178 262 220 262 C262 262 300 270 322 290 C300 300 262 304 220 304 C178 304 140 300 118 290 Z" fill={url('dark')} />
          <path d="M150 280 C150 214 186 190 220 190 C254 190 290 214 290 280 C268 272 246 270 220 270 C194 270 172 272 150 280 Z" fill={url('dark')} />
          <path d="M150 280 C172 272 194 270 220 270 C246 270 268 272 290 280" stroke={url('gold')} strokeWidth="6" fill="none" />
          <g transform="translate(220 232)">
            <circle r="15" fill="#f4f6ff" />
            <circle cx="-5" cy="-2" r="4" fill="#15121f" />
            <circle cx="5" cy="-2" r="4" fill="#15121f" />
            <path d="M-4 8 h8" stroke="#15121f" strokeWidth="3" />
            <path d="M-22 14 L22 -2 M-22 -2 L22 14" stroke="#f4f6ff" strokeWidth="5" strokeLinecap="round" />
          </g>
          <path className="hero-feather" d="M272 214 C300 170 344 166 356 180 C330 188 306 204 288 232 Z" fill="#ff5a6e" />
        </>
      );
    case 'crown':
      return (
        <>
          <path d="M156 288 L148 220 L184 250 L220 204 L256 250 L292 220 L284 288 C262 280 242 278 220 278 C198 278 178 280 156 288 Z" fill={url('gold')} stroke="#a86a0c" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="148" cy="218" r="7" fill="#fff0a0" />
          <circle cx="220" cy="202" r="8" fill="#fff0a0" />
          <circle cx="292" cy="218" r="7" fill="#fff0a0" />
          <circle cx="220" cy="262" r="9" fill="#ff4d5e" stroke="#fff" strokeWidth="2" />
          <circle cx="182" cy="268" r="6" fill="#4db3ff" />
          <circle cx="258" cy="268" r="6" fill="#4ddc8a" />
          <circle className="hero-glint" cx="200" cy="232" r="3" fill="#fff" />
        </>
      );
    default:
      return null;
  }
}

function Pet({ id, url }: { id: string | null; url: Url }) {
  if (id === 'parrot') {
    return (
      <g className="hero-pet">
        <path d="M146 432 c-4 18 -16 34 -30 44 l10 4 c14 -8 24 -24 26 -40 z" fill="#2f8f4e" />
        <ellipse cx="140" cy="400" rx="20" ry="30" fill={url('redR')} />
        <path className="hero-wing" d="M150 384 c12 10 14 34 4 50 c-14 -6 -20 -28 -14 -46 z" fill="#2fa860" />
        <path className="hero-wing" d="M150 400 c8 8 8 24 2 34 c-8 -4 -12 -18 -8 -30 z" fill="#2b7fd0" />
        <circle cx="132" cy="370" r="16" fill={url('redR')} />
        <path d="M118 366 c-12 0 -16 10 -10 18 c4 -6 8 -8 12 -8 z" fill="#ffd34a" stroke="#c98a12" strokeWidth="1.5" />
        <circle cx="130" cy="364" r="6" fill="#fff" />
        <circle cx="129" cy="364" r="3.2" fill="#111" />
        <circle cx="128" cy="362.6" r="1.1" fill="#fff" />
        <path d="M134 431 l-4 10 M146 431 l2 10" stroke="#e0a64a" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  if (id === 'monkey') {
    return (
      <g className="hero-pet">
        <path className="hero-tail" d="M150 430 c-30 10 -40 40 -20 52 c12 6 22 -4 14 -12" stroke="#7a4a26" strokeWidth="6" fill="none" strokeLinecap="round" />
        <ellipse cx="146" cy="410" rx="20" ry="24" fill="#8a5532" />
        <ellipse cx="146" cy="416" rx="11" ry="14" fill="#e8c9a0" />
        <circle cx="122" cy="372" r="9" fill="#8a5532" />
        <circle cx="166" cy="372" r="9" fill="#8a5532" />
        <circle cx="144" cy="376" r="22" fill="#8a5532" />
        <ellipse cx="144" cy="382" rx="15" ry="13" fill="#e8c9a0" />
        <circle cx="138" cy="376" r="3.4" fill="#111" />
        <circle cx="150" cy="376" r="3.4" fill="#111" />
        <path d="M139 388 c3 3 7 3 10 0" stroke="#7a4a26" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="156" y="400" width="22" height="16" rx="2" fill="#f3e1b4" stroke="#b58a4a" strokeWidth="2" transform="rotate(-12 167 408)" />
        <path d="M160 404 l6 4 l5 -3 l6 5" stroke="#c3241f" strokeWidth="1.6" fill="none" transform="rotate(-12 167 408)" />
      </g>
    );
  }
  return null;
}
