/* A Hairline figure (https://github.com/lucasmarkes/hairline), made with its hairline-create skill. */
/**
 * Giraffe: a giraffe on a plinth beside an acacia. The pointer, put on the
 * ground, is where she looks: the neck leans toward it and the head turns
 * after it, each on a spring. At rest she reaches up to the crown of the
 * tree. Her head is the one bright stroke. The slider is the farthest lean
 * of the neck, in degrees.
 *
 * The pattern: aim. Two springs for the neck top, a hit test on the ground
 * plane, a lean clamped to a forward cone so the paint order never changes.
 */
import HL from '../../vendor/hairline/kernel.js';

const {
  Cam, clamp, circ, facing, fit, hull, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  spring, stepS, unproj, disposer, mk, pointer, put, register, solid,
} = HL;

const NX = 68, NY = 43.5, NZ = 60, L = 62;            // neck base and length
const TREE = [104, -16], PHI_MIN = -78, PHI_MAX = 62; // the acacia, and the forward cone
const REST = { phi: -58, lean: 30 };

/** Moves a ring centred on 0 by heading phi (degrees) to (x, y). */
const turn = (ring, phi, x, y) => {
  const c = Math.cos(rad(phi)), s = Math.sin(rad(phi));
  return ring.map((q) => ({ u: x + q.u * c - q.v * s, v: y + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c }));
};

/** The neck top's offset and height for a heading and a lean, in degrees. */
const aim = (phi, lean) => {
  const o = L * Math.sin(rad(lean));
  return [o * Math.cos(rad(phi)), o * Math.sin(rad(phi)), NZ + L * Math.cos(rad(lean))];
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.62);
  const reach = [];
  for (let p = PHI_MIN; p <= PHI_MAX; p += 20) {
    const [dx, dy, z] = aim(p, 44);
    reach.push([NX + dx + 21, NY + dy, z + 15], [NX + dx - 8, NY + dy, z]);
  }
  fit(C, [[4, -42, -5], [140, -42, -5], [140, 64, -5], [4, 64, -5], [NX, NY, NZ + L + 14], ...reach], 200, 166);
  const P = proj(C), front = facing(C);
  let max = value, over = null;

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(4, -42, 140, 64, 14, 2.2);
  put(solid(g), prism(P, front, pr, pi, -5, 0));

  // The acacia, at the back: a trunk under a wide flat crown.
  const [tr, ti] = rings(TREE[0] - 4, TREE[1] - 4, TREE[0] + 4, TREE[1] + 4, 4, 1);
  put(solid(g), prism(P, front, tr, ti, 0, 80));
  const crown = rrect(TREE[0] - 32, TREE[1] - 20, TREE[0] + 32, TREE[1] + 20, 18, 10);
  const crownIn = rrect(TREE[0] - 30, TREE[1] - 18, TREE[0] + 30, TREE[1] + 18, 16, 10);
  put(solid(g), prism(P, front, crown, crownIn, 80, 85));

  // Legs, far to near, then the tail, then the body: a capsule sloping up to the shoulders.
  for (const [x, y, h] of [[31, 32, 38], [61, 32, 44], [31, 43, 38], [61, 43, 44]].sort((a, b) => a[0] + a[1] - b[0] - b[1])) {
    const [lr, li] = rings(x, y, x + 6, y + 6, 3, 0.8);
    put(solid(g), prism(P, front, lr, li, 0, h));
  }
  mk("path", { class: "nf lo", d: seg(P(24, NY, 50), P(17, NY, 30)) }, g);
  const disc = (x, zc, r) => Array.from({ length: 28 }, (_, k) => {
    const a = (k / 28) * Math.PI * 2;
    return P(x, NY + r * Math.cos(a), zc + r * Math.sin(a));
  });
  mk("path", { class: "sil", d: poly(hull(disc(30, 47, 10).concat(disc(66, 53, 12)))) }, g);
  mk("path", { class: "nf lo", d: poly(disc(66, 53, 10.6)) }, g);
  for (const [x, y, w, h, z] of [[30, 36, 8, 6, 57], [42, 41, 9, 6, 59], [52, 35, 8, 6, 61], [36, 44, 7, 4, 56]])
    mk("path", { class: "nf lo", d: poly(ringAt(P, rrect(x, y, x + w, y + h, 3, 3), z)) }, g);

  // Neck, head and its two ossicones, rebuilt each frame they move.
  const neck = solid(g), head = solid(g), oss = [solid(g), solid(g)];
  head.sil.classList.add("hi");
  const base = circ(6.5, 32).map((q) => ({ ...q, u: q.u + NX, v: q.v + NY }));
  const skull = rrect(-6, -5.5, 21, 5.5, 5.5, 6), skullIn = rrect(-5, -4.5, 20, 4.5, 4.5, 6);
  const nub = rrect(-1.8, -1.8, 1.8, 1.8, 1.8, 4), nubIn = rrect(-0.8, -0.8, 0.8, 0.8, 0.8, 4);

  const [x0, y0] = aim(REST.phi, REST.lean);
  const sx = spring(x0), sy = spring(y0), sh = spring(REST.phi);
  let drawn = "";

  function draw() {
    const key = `${sx.x.toFixed(2)},${sy.x.toFixed(2)},${sh.x.toFixed(2)}`;
    if (key === drawn) return;
    drawn = key;
    const o = Math.min(Math.hypot(sx.x, sy.x), L * 0.95);
    const z = NZ + Math.sqrt(L * L - o * o), hx = NX + sx.x, hy = NY + sy.x;
    const top = circ(4, 32).map((q) => ({ ...q, u: q.u + hx, v: q.v + hy }));
    const topIn = circ(3, 32).map((q) => ({ ...q, u: q.u + hx, v: q.v + hy }));
    put(neck, {
      sil: poly(hull(ringAt(P, base, 58).concat(ringAt(P, top, z)))),
      crease: open(ringAt(P, run(topIn, front), z)),
    });
    put(head, prism(P, front, turn(skull, sh.x, hx, hy), turn(skullIn, sh.x, hx, hy), z - 3, z + 8));
    [-3, 3].forEach((v, k) => {
      const c = Math.cos(rad(sh.x)), s = Math.sin(rad(sh.x)), u = -2.5;
      put(oss[k], prism(P, front, turn(nub, 0, hx + u * c - v * s, hy + u * s + v * c), turn(nubIn, 0, hx + u * c - v * s, hy + u * s + v * c), z + 8, z + 15));
    });
  }

  const B = register(stage, (dt) => {
    const m = [stepS(sx, dt), stepS(sy, dt), stepS(sh, dt)].some(Boolean);
    draw();
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    let phi = REST.phi, lean = REST.lean * (max / 32);
    if (over) {
      const dx = over[0] - NX, dy = over[1] - NY;
      phi = clamp(Math.atan2(dy, dx) * 180 / Math.PI, PHI_MIN, PHI_MAX);
      lean = clamp(Math.hypot(dx, dy) / 1.6, 6, max);
      read.textContent = `look ${Math.round(phi)}°`;
    } else read.textContent = "rest";
    const [ox, oy] = aim(phi, Math.min(lean, 44));
    sx.t = ox; sy.t = oy; sh.t = phi;
    B.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { max = v; retarget(); },
    destroy: bag.dispose,
  };
}

export const giraffe = {
  name: "giraffe",
  means: "A giraffe beside an acacia leans her long neck toward wherever the pointer stands on the ground.",
  rules: [1, 3, 5, 9],
  range: [20, 32, 44],
  tour: [[300, 230], [110, 250], [150, 120], null],
  mount,
};
