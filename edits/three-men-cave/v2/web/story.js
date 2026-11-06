// "Three Men in the Cave" v2 — rebuilt on the user's quality bar (ricksclip pattern: paradox hook, you-are-there,
// "how is that possible?", fast cutting, bright worlds, visual payoff). Sahih al-Bukhari 2272.
// voice.mp3 = 56.0 s; END 60 s (payoff hold). Segments (s): 0.15 sealed | 2.75 only key | 3.95 secret | 4.98 night |
// 6.27 duck in | 8.52 rumble | 9.48 huge rock | 10.85 slams | 12.97 pitch black | 13.98 one says | 14.99 deed for Allah |
// 17.48 nobody saw | 18.78 move this rock | 20.37 how? | 22.56 first man | 23.58 parents drank first | 25.78 asleep |
// 27.19 stood with milk till dawn, kids crying | 32.32 rock shifts | 33.61 moonlight | 35.09 second walked away |
// 39.20 slides again | 40.86 too narrow | 42.25 third had a worker | 43.64 left unpaid | 45.34 invested, a herd |
// 48.88 then | 49.48 handed the worker | 50.75 every single animal | 52.72 and the rock | 53.59 rolls clear.
export const FPS = 30, TOTAL = 1800;
export const SHOTS = [
  { id: 'h1', a: 0, b: 41, light: 'night' },
  { id: 'h2', a: 42, b: 82, light: 'cave' },
  { id: 'h3', a: 83, b: 148, light: 'cave', cu: true },
  { id: 'night', a: 149, b: 187, light: 'night' },
  { id: 'duck', a: 188, b: 254, light: 'night' },
  { id: 'rumble', a: 255, b: 283, light: 'cave' },
  { id: 'fall', a: 284, b: 324, light: 'night' },
  { id: 'slam', a: 325, b: 388, light: 'night' },
  { id: 'black', a: 389, b: 418, light: 'black' },
  { id: 'says', a: 419, b: 519, light: 'cave', cu: true },
  { id: 'react', a: 520, b: 562, light: 'cave', cu: true },
  { id: 'move', a: 563, b: 610, light: 'cave' },
  { id: 'how', a: 611, b: 676, light: 'cave' },
  { id: 'parents', a: 677, b: 772, light: 'dusk' },
  { id: 'asleep', a: 773, b: 815, light: 'vigil' },
  { id: 'vigil', a: 816, b: 887, light: 'vigil' },
  { id: 'dawn', a: 888, b: 969, light: 'vigil' },
  { id: 'shift1', a: 970, b: 1007, light: 'cave' },
  { id: 'crack', a: 1008, b: 1052, light: 'cave', cu: true },
  { id: 'sin', a: 1053, b: 1115, light: 'memory' },
  { id: 'walk', a: 1116, b: 1175, light: 'memory' },
  { id: 'slide2', a: 1176, b: 1225, light: 'cave' },
  { id: 'narrow', a: 1226, b: 1267, light: 'cave' },
  { id: 'wage', a: 1268, b: 1359, light: 'day' },
  { id: 'herd', a: 1360, b: 1465, light: 'day' },
  { id: 'return', a: 1466, b: 1521, light: 'day' },
  { id: 'every', a: 1522, b: 1581, light: 'day' },
  { id: 'androck', a: 1582, b: 1607, light: 'cave' },
  { id: 'clear', a: 1608, b: 1799, light: 'dawn' },
];
import { M as EZ, camFromKeys, idle } from './motion.js';
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

// ---------- lights: vivid, never muddy ----------
const NIGHT = { az: 210, el: 40, sky: '#a8bcff', ground: '#5c6294', hemi: 1.9, sun: '#e4ecff', sunI: 2.3, fog: '#2c4f96', fogNear: 70, fogFar: 760,
  skyTop: '#0f2a6e', skyHor: '#4a7fd0', sunDisc: '#fffbe8', sunSize: 0.002, sat: 1.18, gain: '#eef2ff', vig: 0.26, shadowExt: 22, night: true };
const DAWN = { az: 75, el: 14, sky: '#b8caff', ground: '#9a7c64', hemi: 1.45, sun: '#ffd6a0', sunI: 2.6, fog: '#ffc896', fogNear: 70, fogFar: 760,
  skyTop: '#4f86e0', skyHor: '#ffd29a', sunDisc: '#fff4cc', sunSize: 0.005, sat: 1.18, gain: '#ffffff', vig: 0.2, shadowExt: 22 };
export const LIGHTS = {
  night: NIGHT,
  cave: { ...NIGHT, hemi: 2.3, sunI: 0.8, sky: '#b4c6ff', ground: '#8a90c4', gain: '#f0f4ff', vig: 0.3 },
  black: { ...NIGHT, hemi: 0.0, sunI: 0, sky: '#000000', ground: '#000000', fog: '#000000', skyTop: '#000000', skyHor: '#000000', sunSize: 0, night: true, gain: '#ffffff', vig: 0.5 },
  dusk: { az: 250, el: 8, sky: '#c9a0c8', ground: '#7a5040', hemi: 1.25, sun: '#ffab66', sunI: 2.6, fog: '#f2a87e', fogNear: 60, fogFar: 600,
    skyTop: '#5f62c0', skyHor: '#ffa870', sunDisc: '#ffe2b0', sunSize: 0.005, sat: 1.15, gain: '#ffffff', vig: 0.22, shadowExt: 18 },
  vigil: { ...NIGHT, lamp: 2.6 },
  memory: { ...NIGHT, hemi: 1.8, sat: 1.05, gain: '#fff0dc', vig: 0.3 },
  day: { az: 140, el: 48, sky: '#cfe2ff', ground: '#b08a5c', hemi: 1.3, sun: '#fff4dc', sunI: 2.7, fog: '#cfe0f4', fogNear: 90, fogFar: 900,
    skyTop: '#2f7de0', skyHor: '#bfe0ff', sat: 1.2, gain: '#ffffff', vig: 0.18, shadowExt: 20 },
  dawn: DAWN,
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'dawn') { // night turns to dawn while he waits
    const t = smooth(ramp(f, 888, 960));
    for (const k of ['skyTop', 'skyHor', 'sun', 'fog', 'gain']) if (t > 0.5) L[k] = DAWN[k];
    L.night = t < 0.6; L.hemi = lerp(L.hemi, DAWN.hemi, t); L.sunI = lerp(L.sunI, DAWN.sunI, t); L.az = 75; L.el = lerp(20, 10, t); L.lamp = lerp(2.6, 0.3, t);
  }
  if (S.id === 'crack' || S.id === 'narrow') L.hemi = 2.6;
  if (S.id === 'slide2' || S.id === 'slam' || S.id === 'fall') { L.hemi = 2.4; L.ground = '#8a8ab4'; }
  return L;
};

// ---------- boulder + moonlight through the gap ----------
const REST = { x: 0, y: 2.0, z: 1.05 };
export const worldAt = (f) => {
  const W = { boulder: { ...REST, rx: 0, rz: 0 }, shaft: 0, shaftW: 0.1, shaftX: 0 };
  const sealed = f < 149 || f >= 330;
  if (!sealed) {
    if (f < 290) W.boulder = { x: 10, y: 11, z: 6, rx: 0, rz: 0 };
    else { const t = smooth(ramp(f, 290, 330)), x = lerp(10, 0, t); W.boulder = { x, y: lerp(11, 2.0, t) + Math.sin(t * Math.PI * 3) * 0.5 * (1 - t), z: lerp(6, 1.05, t), rx: 0, rz: (10 - x) / 2.05 }; }
    return W;
  }
  const gap = f < 149 ? 0.15 : f < 975 ? 0 : f < 1180 ? 0.55 * smooth(ramp(f, 975, 1000)) : f < 1615 ? lerp(0.55, 1.15, smooth(ramp(f, 1180, 1205))) : lerp(1.15, 9, smooth(ramp(f, 1615, 1700)));
  W.boulder.x = gap; W.boulder.rz = 4.88 - gap / 2.05;
  if (f >= 1615) { const t = smooth(ramp(f, 1615, 1700)); W.boulder.z = lerp(1.05, 6, t); W.boulder.y = lerp(2.0, 1.2, t); }
  const w = Math.min(3.4, gap * 1.4);
  W.shaft = gap > 0.01 ? (f >= 1615 ? 0.03 : 0.08) : 0; W.shaftW = w; W.shaftX = -1.7 + w / 2;
  return W;
};

// ---------- blocking ----------
// The three men stand close and staggered so the whole group fits the 9:16 safe frame.
const MEN = [['man1', 1, [-0.62, 0, -3.75]], ['man2', 2, [0.0, 0, -4.35]], ['man3', 3, [0.62, 0, -3.75]]];
const POS = Object.fromEntries(MEN.map(([w, , p]) => [w, p]));

// ---------- cameras: punchy ease-out starts, creep on holds, everyone inside the safe frame ----------
const K = (f, pos, look, fov, ease) => ({ f, pos, look, fov, ease });
const CAMS = {
  h1: [K(0, [9, 4.2, 24], [0, 3.2, 0], 46), K(41, [4, 2.8, 13], [0, 2.4, 0], 44, 'easeOut')],
  h2: [K(42, [0.15, 1.55, -9.5], [0, 1.35, -1], 52), K(82, [0.1, 1.5, -9.0], [0, 1.35, -1], 50, 'easeOut')],
  h3: [K(83, [0.0, 1.55, -8.4], [0, 1.45, -4.35], 34), K(148, [0.0, 1.55, -8.0], [0, 1.45, -4.35], 33, 'easeOut')],
  night: [K(149, [24, 1.6, 36], [0, 6, 0], 52), K(187, [20, 1.8, 30], [0, 6, 0], 50)],
  duck: [K(188, [-0.2, 1.2, -9.4], [0.1, 1.6, 4], 52), K(254, [-0.1, 1.25, -9.0], [0.1, 1.6, 4], 50)],
  rumble: [K(255, [0.0, 0.9, -9.5], [0, 1.9, -2.5], 54), K(283, [0.0, 0.95, -9.3], [0, 2.0, -2.5], 53)],
  fall: [K(284, [-10, 2.2, 18], [6, 8, 3], 46), K(324, [-8, 2.0, 14], [2, 3, 1], 44, 'easeOut')],
  slam: [K(325, [5.5, 1.0, 10.5], [0, 2.4, 0.8], 50), K(388, [6.4, 1.2, 12.0], [0, 2.6, 0.8], 50, 'easeOut')],
  black: [K(389, [0.05, 1.6, -7.4], [0.05, 1.55, -4.0], 46), K(418, [0.05, 1.6, -7.2], [0.05, 1.55, -4.0], 45)],
  says: [K(419, [-0.75, 1.55, -7.9], [-0.62, 1.45, -3.75], 34), K(519, [-0.72, 1.55, -7.5], [-0.62, 1.45, -3.75], 33, 'easeOut')],
  react: [K(520, [0.45, 1.5, -9.0], [0.3, 1.35, -4.0], 40), K(562, [0.42, 1.5, -8.7], [0.3, 1.35, -4.0], 39, 'easeOut')],
  move: [K(563, [-0.3, 1.0, -9.6], [0, 1.9, 0.8], 54), K(610, [-0.2, 1.05, -9.2], [0, 1.9, 0.8], 52, 'easeOut')],
  how: [K(611, [0.4, 2.5, -9.6], [0, 1.2, -2], 54), K(676, [-0.4, 2.4, -9.4], [0, 1.2, -2], 52)],
  parents: [K(677, [80.25, 1.8, 9.8], [80.25, 1.0, 1.4], 44), K(772, [80.2, 1.75, 9.4], [80.25, 1.0, 1.4], 43, 'easeOut')],
  asleep: [K(773, [80.0, 5.4, 6.1], [79.95, 0.35, 1.4], 48), K(815, [80.0, 5.1, 5.8], [79.95, 0.35, 1.4], 47)],
  vigil: [K(816, [80.9, 0.85, 7.9], [80.9, 1.1, 2.6], 40), K(887, [80.9, 0.9, 7.5], [80.9, 1.15, 2.6], 39, 'easeOut')],
  dawn: [K(888, [83.6, 2.6, 11.0], [80.05, 1.0, 1.8], 44), K(969, [83.0, 2.4, 10.2], [80.05, 1.0, 1.8], 43)],
  shift1: [K(970, [0.1, 0.95, -9.5], [0, 1.8, 1], 52), K(1007, [0.08, 1.0, -9.2], [0, 1.8, 1], 51, 'easeOut')],
  crack: [K(1008, [-0.75, 1.55, -7.9], [-0.62, 1.45, -3.75], 34), K(1052, [-0.72, 1.55, -7.6], [-0.62, 1.45, -3.75], 33, 'easeOut')],
  sin: [K(1053, [81.5, 1.0, 46.6], [80.85, 0.9, 40.9], 42), K(1115, [81.3, 1.1, 46.0], [80.75, 1.0, 40.9], 41, 'easeOut')],
  walk: [K(1116, [81.2, 1.7, 47.5], [80.0, 1.0, 41.0], 44), K(1175, [79.4, 1.7, 46.0], [78.0, 1.0, 39.2], 44)],
  slide2: [K(1176, [3.2, 0.6, 7.2], [0, 2.0, 0.8], 50), K(1225, [3.6, 0.65, 7.8], [0, 2.0, 0.8], 48, 'easeOut')],
  narrow: [K(1226, [-1.5, 1.4, -5.4], [-0.85, 1.15, -0.6], 44), K(1267, [-1.45, 1.4, -5.1], [-0.85, 1.15, -0.6], 43)],
  wage: [K(1268, [79.6, 1.7, 102.0], [80.4, 1.1, 93.5], 44), K(1359, [79.9, 1.75, 101.6], [80.7, 1.1, 92.5], 44)],
  herd: [K(1360, [80, 3.0, 103], [80, 0.8, 90], 46), K(1465, [80, 9.0, 108], [80, 0.5, 89], 50)],
  return: [K(1466, [79.8, 1.75, 102.2], [79.8, 1.15, 95.2], 42), K(1521, [79.8, 1.75, 101.8], [79.8, 1.15, 95.2], 41)],
  every: [K(1522, [79.8, 1.6, 102.4], [79.8, 1.2, 95.2], 42, 'easeOut'), K(1545, [79.8, 1.6, 102.1], [79.8, 1.2, 95.2], 42), K(1581, [81, 6.5, 108], [80, 0.6, 90], 52)],
  androck: [K(1582, [0.1, 1.0, -9.5], [0, 1.8, 1], 52), K(1607, [0.08, 1.05, -9.1], [0, 1.8, 1], 51, 'easeOut')],
  clear: [K(1608, [-6, 1.6, 13], [1.5, 2.2, 1.5], 44), K(1660, [-4.0, 1.8, 13.0], [0.3, 1.8, 1.0], 42, 'easeOut'), K(1700, [-1.6, 1.6, 12.4], [0.3, 1.45, 2.2], 44), K(1799, [-2.4, 2.6, 13.4], [0.3, 1.8, 2.0], 47)],
};
const KICKS = [{ f: 255, a: 0.03 }, { f: 330, a: 0.08 }, { f: 336, a: 0.05 }, { f: 975, a: 0.03 }, { f: 1180, a: 0.035 }, { f: 1615, a: 0.04 }];
export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { creep: 0.0004, kicks: KICKS });
  if (S.id === 'rumble') { const s = Math.sin(f * 2.1) * 0.012; c.look = [c.look[0] + s * 3, c.look[1] + s * 2, c.look[2]]; }
  c.flash = 0;
  for (const a of [677, 1053, 1268]) if (f >= a && f < a + 5) c.flash = Math.max(c.flash, (1 - (f - a) / 5) * 0.8);
  if (f >= 330 && f < 334) c.flash = 0.45;
  if (f >= 1008 && f < 1012) c.flash = 0.2;
  if (f >= 1640 && f < 1646) c.flash = 0.5 * (1 - (f - 1640) / 6);
  const set = { parents: [80, 0, 1], asleep: [80, 0, 1], vigil: [80, 0, 1], dawn: [80, 0, 1], sin: [80, 0, 40], walk: [80, 0, 40], wage: [80, 0, 92], herd: [80, 0, 92], return: [80, 0, 92], every: [80, 0, 92] };
  c.shadowAt = set[S.id] || [0, 0, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  const F = { h3: POS.man2, says: POS.man1, crack: POS.man1, react: [0.3, 1.4, -4.0], parents: [80.2, 1.2, 1.6], vigil: [80.9, 1.3, 2.6],
    sin: [80.8, 0.8, 41], walk: [79, 1.0, 40], wage: [80.4, 1.2, 94.5], return: [79.8, 1.3, 95.2], narrow: [-0.85, 1.3, -0.6] };
  if (F[S.id]) return { focus: dist(C.pos, [F[S.id][0], 1.4, F[S.id][2]]), cinf: 8 };
  return { focus: 20, cinf: 0 };
};

// ---------- actors: idle life on everyone, hops on reactions, bob on walks ----------
const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
const LIFE = (f, seed, o) => { const I = idle(f, seed); return { tilt: q(I.tilt, 1), headTilt: q(I.headTilt, 1), bob: q(I.bob + (o.step ? Math.abs(Math.sin(o.step * Math.PI * 2)) * 0.012 : 0), 3), ...o }; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], check: true, ...extra });
const CARD = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, ...extra });
const TINT = { cave: '#eef1ff', night: '#f2f4ff', memory: '#fff1e0', dusk: '#fff0e4', vigil: '#e6eaff', day: '#ffffff', dawn: '#fff1e2', black: '#0a0a10' };
// reaction hop: up and squash-stretch for ~8 frames after f0
const hop = (f, f0, h = 0.12) => { const t = (f - f0) / 8; return t < 0 || t > 1 ? { dy: 0, sq: 1 } : { dy: h * Math.sin(t * Math.PI), sq: 1 + 0.07 * Math.sin(t * Math.PI * 2) }; };
// lip flap: mouth only, held ~4 frames, only while his line plays
const LINES = [[14.99, 17.34], [17.48, 18.64], [18.78, 20.23]];
const flap = (f, base) => { const t = f / 30; if (!LINES.some(([a, b]) => t >= a && t <= b)) return base; const k = Math.floor(f / 4); return ((k * 7919) % 5) < 3 ? base + '_o' : base; };

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  const man = (who, seed, o, pos, extra = {}) => { const P = pos || POS[who]; const H = extra.hop || { dy: 0, sq: 1 }; out.push(R(T, who, LIFE(f, seed, { seed, blink: blinkAt(f, seed), ...o }), [P[0], P[1] + H.dy, P[2]], { tint, s: (extra.s || 1) * H.sq, ...extra, hop: undefined })); };
  const cave = (opts = {}, who = null) => MEN.forEach(([w, seed], i) => { if (who && !who.includes(w)) return; man(w, seed, { expr: 'nervous', ...(opts.all || {}), ...(opts[i] || {}) }, null, opts.hop ? { hop: hop(f, opts.hop + i * 2) } : {}); });
  switch (S.id) {
    case 'h2': cave({ all: { expr: 'nervous', look: 0.5 } }); break;
    case 'h3': cave({ all: { expr: 'nervous', look: -0.2 } }, ['man2']); break;
    case 'duck': MEN.forEach(([w, seed], i) => { const d = EZ.smooth(ramp(f, 188 + i * 7, 250)); man(w, seed, { step: q((f * 0.05 + i * 0.3) % 1), expr: 'neutral' }, [lerp(0.25 * (i - 1), POS[w][0], d), 0, lerp(3.2 + i * 1.1, POS[w][2], d)]); }); break;
    case 'rumble': cave({ all: { expr: 'shock', look: 0, L: 'cheek', R: 'cheek' }, hop: 255 }); break;
    case 'says': cave({ 0: { expr: flap(f, 'stern'), L: 'up', R: 'up', look: 0.2 } }, ['man1']); break;
    case 'react': cave({ 1: { expr: 'nervous', look: -0.6 }, 2: { expr: 'nervous', look: -0.6 } }, ['man2', 'man3']); break;
    case 'move': case 'how': cave({ all: { expr: 'nervous', look: 0.0 } }); break;
    case 'shift1': cave({ all: { expr: 'shock', look: 0.5, L: 'cheek', R: 'cheek' }, hop: 975 }); break;
    case 'crack': cave({ 0: { expr: 'relief', L: 'up', R: 'up', look: 0.4 } }, ['man1']); break;
    case 'narrow': man('man3', 3, { expr: 'nervous', L: 'reach', R: 'hang', look: 0.2 }, [-0.85, 0, -0.6]); break;
    case 'androck': cave({ all: { expr: 'shock', look: 0.5, L: 'up', R: 'up' }, hop: 1584 }); break;
    case 'parents': {
      const give = EZ.easeOut(ramp(f, 695, 735));
      man('father', 7, { expr: give > 0.5 ? 'relief' : 'neutral', look: 0.4 }, [79.15, 0, 1.25]);
      man('mother', 8, { expr: give > 0.5 ? 'relief' : 'neutral', look: 0.3 }, [79.75, 0, 0.95]);
      man('man1', 1, { expr: 'grin', L: 'belly', R: 'belly', bowl: true, look: -0.5, step: give < 1 ? q((f * 0.04) % 1) : 0 }, [lerp(81.1, 80.4, give), 0, lerp(2.2, 1.85, give)]);
      man('civA', 11, { expr: 'neutral', look: -0.6 }, [80.85, 0, 0.6], { s: 0.6 });
      man('civC', 12, { expr: 'neutral', look: -0.6 }, [81.3, 0, 0.8], { s: 0.55 });
      break;
    }
    case 'asleep':
      out.push(R(T, 'father', { seed: 7, expr: 'snore', blink: 1 }, [80.55, 0.42, 1.0], { tint, roll: Math.PI / 2, blob: false }));
      out.push(R(T, 'mother', { seed: 8, expr: 'snore', blink: 1 }, [80.95, 0.42, 1.75], { tint, roll: Math.PI / 2, blob: false }));
      break;
    case 'vigil': case 'dawn': {
      man('man1', 1, { expr: S.id === 'dawn' && f > 940 ? 'relief' : 'neutral', L: 'belly', R: 'belly', bowl: true, look: -0.6 }, [80.9, 0, 2.6]);
      man('civA', 11, { expr: 'shock', look: 0.4 }, [80.45, 0, 3.0], { s: 0.55 });
      man('civC', 12, { expr: 'shock', look: -0.4 }, [81.35, 0, 3.1], { s: 0.5 });
      if (S.id === 'dawn') { out.push(R(T, 'father', { seed: 7, expr: 'snore', blink: 1 }, [80.05, 0.42, 1.0], { tint, roll: Math.PI / 2, blob: false })); out.push(R(T, 'mother', { seed: 8, expr: 'snore', blink: 1 }, [80.35, 0.42, 1.6], { tint, roll: Math.PI / 2, blob: false })); }
      break;
    }
    case 'sin': man('man2', 2, { expr: f < 1085 ? 'neutral' : 'stern', look: f > 1085 ? -0.8 : 0.4, facing: f > 1090 ? -1 : 0 }, [80.4, 0, 41.4]); break;
    case 'walk': { const w = EZ.smooth(ramp(f, 1118, 1175)); man('man2', 2, { expr: 'stern', facing: -1, look: -0.8, step: q((f * 0.05) % 1) }, [lerp(80.2, 78.0, w), 0, lerp(41.4, 39.4, w)]); break; }
    case 'wage': {
      const w = EZ.smooth(ramp(f, 1285, 1359));
      man('worker', 9, { expr: 'stern', facing: 1, step: q((f * 0.05) % 1), look: 0.4 }, [lerp(80.9, 82.4, w), 0, lerp(94.4, 88.5, w)]);
      man('man3', 3, { expr: f > 1320 ? 'nervous' : 'neutral', L: 'reach', R: 'hang', look: 0.6 }, [80.3, 0, 95.6]);
      break;
    }
    case 'herd': {
      const n = Math.floor(lerp(1, 20, EZ.smooth(ramp(f, 1365, 1450))));
      for (let i = 0; i < n; i++) {
        const x = 72.5 + (i * 2.3) % 15, z = 85 + Math.floor(i / 6) * 2.4 + (i % 2) * 0.6, camelI = i % 5 === 4, pop = EZ.back(clamp((f - (1365 + i * 4)) / 6));
        out.push(CARD(camelI ? 'camel' : 'sheep' + (i % 3), camelI ? (p) => T.camel(p) : (p) => T.sheep(p, i, q((f * 0.03 + i * 0.2) % 1)), [x, 0, z], (camelI ? 1.25 : 0.55) * Math.max(0.05, pop), { tint, flip: i % 3 === 0 }));
      }
      man('man3', 3, { expr: 'grin', L: 'hip', R: 'hip' }, [80, 0, 96.2]);
      break;
    }
    case 'return': case 'every': {
      const arrive = EZ.easeOut(ramp(f, 1466, 1500));
      for (let i = 0; i < 14; i++) out.push(CARD(i % 4 === 3 ? 'camel' : 'sheep' + (i % 3), i % 4 === 3 ? (p) => T.camel(p) : (p) => T.sheep(p, i), [74.5 + (i * 2.1) % 12, 0, 87 + (i % 3) * 1.8], i % 4 === 3 ? 1.25 : 0.55, { tint, flip: i % 2 === 0 }));
      const giving = S.id === 'every';
      man('man3', 3, { expr: giving ? 'grin' : 'neutral', L: giving ? 'point' : 'hang', R: giving ? 'up' : 'hang', look: 0.4 }, [79.2, 0, 95.4], { flip: true });
      man('worker', 9, { blink: giving ? 0 : blinkAt(f, 9), expr: giving ? 'shock' : 'neutral', step: arrive < 1 ? q((f * 0.05) % 1) : 0, facing: -1, L: giving ? 'cheek' : 'hang', R: giving ? 'cheek' : 'hang' }, [lerp(83.2, 80.4, arrive), 0, 95.0], giving ? { hop: hop(f, 1526, 0.18) } : {});
      break;
    }
    case 'clear': {
      if (f > 1640) MEN.forEach(([w, seed], i) => { const d = EZ.smooth(ramp(f, 1640 + i * 5, 1740)); man(w, seed, { step: d < 1 ? q((f * 0.045 + i * 0.3) % 1) : 0, expr: 'relief', L: f > 1735 ? 'up' : 'hang', R: f > 1735 ? 'up' : 'hang' }, [lerp(-0.4 + i * 0.4, -0.6 + i * 0.95, d), 0, lerp(-0.8, 2.8 + (i % 2) * 0.5, d)], f > 1735 ? { hop: hop(f, 1738 + i * 3, 0.15) } : {}); });
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  if (S.id === 'rumble') for (let i = 0; i < 6; i++) { const t = ((f - 255) / 20 + i / 6) % 1; out.push(FX('peb', (p) => T.fxDrip(p), [-1.4 + i * 0.55, 4.6 - t * 4.4, -3.0 - (i % 2)], 0.12, { tint: '#b89a7a' })); }
  if (S.id === 'fall') { const B = worldAt(f).boulder, t = q((f % 10) / 10, 1); out.push(FX('speed' + t, (p) => T.fxSpeed(p, t), [B.x + 2.2, B.y + 0.3, B.z], 3.2, { roll: -0.75 })); }
  if (S.id === 'slam' && f >= 330) { const k = q(ramp(f, 330, 370), 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#efd6ad'), [0, 0.9, 3.4], 5.5, { tint })); }
  if (S.id === 'black') MEN.forEach(([, seed], i) => { const b = blinkAt(f + i * 7, seed); out.push(FX('eyes' + b + (i - 1), (p) => T.fxEyes(p, b, i - 1), [(i - 1) * 0.36, 1.45 + (i % 2) * 0.18, -4.0], 0.4)); });
  if (S.id === 'says' || S.id === 'react' || S.id === 'how') for (const [i, [w]] of MEN.entries()) if ((S.id === 'says' && i === 0) || (S.id === 'react' && i > 0) || S.id === 'how') { const P = POS[w]; out.push(FX('sweat', (p) => T.fxSweat(p), [P[0] + 0.3, 1.95 - ((f * 0.01 + i * 0.3) % 1) * 0.2, P[2] + 0.05], 0.12)); }
  if (S.id === 'how') { const t = q((f - 611) / 66, 2); out.push(FX('q' + t, (p) => T.fxQuestion(p, t), [0, 2.5, -2.6], 0.7)); }
  if (['move', 'how', 'crack', 'shift1', 'androck'].includes(S.id)) for (let i = 0; i < 14; i++) { const t = ((f * 0.004 + i * 0.13) % 1); out.push(FX('mote', (p) => T.fxMote(p), [-1.2 + (i * 0.37) % 2.4 + Math.sin(f * 0.02 + i) * 0.1, 0.4 + t * 2.6, -1.2 - (i % 4) * 0.8], 0.05)); }
  if (S.id === 'asleep' || S.id === 'vigil' || S.id === 'dawn') { const t = q(((f - 773) / 50) % 1, 2); out.push(FX('z' + t, (p) => T.fxZ(p, t), [79.2, 1.0, 1.6], 0.6)); }
  if (S.id === 'vigil' || S.id === 'dawn') { const t = q(((f - 816) / 24) % 1, 2); for (const [x, z, s] of [[80.45, 3.0, 0.55], [81.35, 3.1, 0.5]]) out.push(FX('tears' + t, (p) => T.fxTears(p, t), [x, s * 1.08, z + 0.02], s * 0.55)); }
  if (S.id === 'crack') { const t = q((f - 1008) / 10, 1); out.push(FX('shine' + t, (p) => T.fxShine(p, t, '#e8f2ff'), [POS.man1[0], 2.35, POS.man1[2] + 0.05], 0.45)); }
  if (S.id === 'sin' || S.id === 'walk') { out.push(CARD('coins', (p) => T.coins(p), [81.4, 0, 40.4], 1.0, { tint, blob: false })); if (S.id === 'sin') { const t = q((f - 1053) / 12, 1); out.push(FX('gshine' + t, (p) => T.fxShine(p, t), [81.4, 0.85, 40.5], 0.42)); } }
  if (S.id === 'wage') out.push(CARD('pouch', (p) => T.pouch(p), [80.5, 0, 95.9], 0.45, { tint, blob: false }));
  if (S.id === 'herd') for (let i = 0; i < 4; i++) { const t = q(((f - 1360) / 24 + i / 4) % 1, 2); out.push(FX('grow' + t, (p) => T.fxGrow(p, t), [74 + i * 4, 2.4, 87], 0.8)); }
  if (S.id === 'clear') {
    if (f >= 1615 && f < 1680) { const k = q(ramp(f, 1615, 1680), 2); out.push(FX('dustc' + k, (p) => T.fxDust(p, k, '#ffe2b8'), [3, 1.0, 3.5], 5, { tint })); }
    if (f >= 1640) { const t = q(Math.min(1, (f - 1640) / 30), 2); out.push(FX('burst' + t, (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#fff1b8', 14, 60, 260); }, [0, 0.6, -1.0], 3.2, { order: 1 })); }
    if (f >= 1700) for (let i = 0; i < 6; i++) { const ph = q(((f * 0.06) + i * 0.17) % 1, 1); out.push(FX('bird' + ph, (p) => T.fxBird(p, ph), [-6 + i * 2.2 + (f - 1700) * 0.05, 7 + (i % 3) * 1.2, -2 - (i % 2) * 2], 0.6)); }
  }
  if (S.id === 'dawn' && f > 930) for (let i = 0; i < 4; i++) { const ph = q(((f * 0.07) + i * 0.23) % 1, 1); out.push(FX('birdd' + ph, (p) => T.fxBird(p, ph), [76 + i * 1.8 + (f - 930) * 0.04, 5 + (i % 2), -4], 0.5)); }
  return out;
};
