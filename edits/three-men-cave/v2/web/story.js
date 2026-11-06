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
  { id: 'h3', a: 83, b: 148, light: 'cave' },
  { id: 'night', a: 149, b: 187, light: 'night' },
  { id: 'duck', a: 188, b: 254, light: 'night' },
  { id: 'rumble', a: 255, b: 283, light: 'cave' },
  { id: 'fall', a: 284, b: 324, light: 'night' },
  { id: 'slam', a: 325, b: 388, light: 'night' },
  { id: 'black', a: 389, b: 418, light: 'black' },
  { id: 'says', a: 419, b: 519, light: 'cave' },
  { id: 'react', a: 520, b: 562, light: 'cave' },
  { id: 'move', a: 563, b: 610, light: 'cave' },
  { id: 'how', a: 611, b: 676, light: 'cave' },
  { id: 'parents', a: 677, b: 772, light: 'dusk' },
  { id: 'asleep', a: 773, b: 815, light: 'vigil' },
  { id: 'vigil', a: 816, b: 887, light: 'vigil' },
  { id: 'dawn', a: 888, b: 969, light: 'vigil' },
  { id: 'shift1', a: 970, b: 1007, light: 'cave' },
  { id: 'crack', a: 1008, b: 1052, light: 'cave' },
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
const DAWN = { az: 75, el: 12, sky: '#c4b4e8', ground: '#8a6a58', hemi: 1.25, sun: '#ffc27e', sunI: 2.9, fog: '#ffc896', fogNear: 70, fogFar: 760,
  skyTop: '#4f86e0', skyHor: '#ffd29a', sunDisc: '#fff4cc', sunSize: 0.005, sat: 1.18, gain: '#ffffff', vig: 0.2, shadowExt: 22 };
export const LIGHTS = {
  night: NIGHT,
  cave: { ...NIGHT, hemi: 2.3, sunI: 0.8, sky: '#b4c6ff', ground: '#8a90c4', gain: '#f0f4ff', vig: 0.3 },
  black: { ...NIGHT, hemi: 0.0, sunI: 0, sky: '#000000', ground: '#000000', fog: '#000000', skyTop: '#000000', skyHor: '#000000', sunSize: 0, night: false, gain: '#ffffff', vig: 0.5 },
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

// ---------- cameras (every hold creeps) ----------
const MEN = [['man1', 1, [-1.25, 0, -3.9]], ['man2', 2, [0.05, 0, -4.2]], ['man3', 3, [1.3, 0, -3.9]]];
const CAMS = {
  h1: [{ f: 0, pos: [10, 4.5, 26], look: [0, 4, 0], fov: 44 }, { f: 41, pos: [3, 2.6, 11], look: [0, 2.4, 0], fov: 40 }],
  h2: [{ f: 42, pos: [0.05, 1.75, -6.6], look: [0.05, 1.7, -3.6], fov: 46 }, { f: 82, pos: [0.05, 1.72, -6.1], look: [0.05, 1.7, -3.6], fov: 43 }],
  h3: [{ f: 83, pos: [1.9, 1.85, -6.6], look: [1.3, 1.8, -3.9], fov: 32 }, { f: 148, pos: [1.8, 1.82, -6.1], look: [1.3, 1.8, -3.9], fov: 29 }],
  night: [{ f: 149, pos: [24, 1.6, 36], look: [0, 6, 0], fov: 52 }, { f: 187, pos: [20, 1.8, 30], look: [0, 6, 0], fov: 50 }],
  duck: [{ f: 188, pos: [-0.6, 0.9, -7.5], look: [0.3, 1.6, 4], fov: 50 }, { f: 254, pos: [-0.4, 1.0, -6.8], look: [0.3, 1.6, 4], fov: 48 }],
  rumble: [{ f: 255, pos: [0.1, 0.7, -7.2], look: [0.05, 2.4, -4], fov: 52 }, { f: 283, pos: [0.1, 0.75, -7.0], look: [0.05, 2.5, -4], fov: 50 }],
  fall: [{ f: 284, pos: [-10, 2.2, 18], look: [6, 8, 3], fov: 46 }, { f: 324, pos: [-8, 2.0, 14], look: [2, 3, 1], fov: 44 }],
  slam: [{ f: 325, pos: [5.5, 1.0, 10.5], look: [0, 2.4, 0.8], fov: 50 }, { f: 388, pos: [6.4, 1.2, 12.0], look: [0, 2.6, 0.8], fov: 50 }],
  black: [{ f: 389, pos: [0.05, 1.7, -6.8], look: [0.05, 1.7, -3.6], fov: 46 }, { f: 418, pos: [0.05, 1.7, -6.6], look: [0.05, 1.7, -3.6], fov: 45 }],
  says: [{ f: 419, pos: [-1.8, 1.85, -6.7], look: [-1.15, 1.8, -3.9], fov: 32 }, { f: 519, pos: [-1.65, 1.82, -6.2], look: [-1.15, 1.8, -3.9], fov: 29 }],
  react: [{ f: 520, pos: [1.4, 1.75, -7.2], look: [0.6, 1.7, -4.0], fov: 36 }, { f: 562, pos: [1.3, 1.72, -6.9], look: [0.6, 1.7, -4.0], fov: 34 }],
  move: [{ f: 563, pos: [-0.4, 1.3, -7.6], look: [0, 2.0, 0.8], fov: 46 }, { f: 610, pos: [-0.3, 1.35, -6.4], look: [0, 2.0, 0.8], fov: 42 }],
  how: [{ f: 611, pos: [0.3, 2.6, -9.4], look: [0, 1.4, -1], fov: 52 }, { f: 676, pos: [-0.6, 2.4, -9.0], look: [0, 1.4, -1], fov: 48 }],
  parents: [{ f: 677, pos: [79.6, 1.9, 7.6], look: [79.7, 1.3, 1.4], fov: 40 }, { f: 772, pos: [79.5, 1.8, 6.9], look: [79.7, 1.3, 1.4], fov: 38 }],
  asleep: [{ f: 773, pos: [78.4, 3.4, 4.6], look: [79.2, 0.4, 1.6], fov: 40 }, { f: 815, pos: [78.5, 3.1, 4.2], look: [79.2, 0.4, 1.6], fov: 38 }],
  vigil: [{ f: 816, pos: [80.9, 0.5, 6.2], look: [80.9, 1.6, 2.6], fov: 46 }, { f: 887, pos: [80.9, 0.55, 5.6], look: [80.9, 1.7, 2.6], fov: 44 }],
  dawn: [{ f: 888, pos: [84, 2.6, 9.5], look: [80.2, 1.4, 1.6], fov: 44 }, { f: 969, pos: [83, 2.4, 8.2], look: [80.2, 1.4, 1.6], fov: 40 }],
  shift1: [{ f: 970, pos: [0.3, 1.0, -8.6], look: [0, 1.6, 2], fov: 48 }, { f: 1007, pos: [0.25, 1.05, -8.2], look: [0, 1.6, 2], fov: 46 }],
  crack: [{ f: 1008, pos: [-1.6, 1.85, -6.4], look: [-1.15, 1.8, -3.9], fov: 32 }, { f: 1052, pos: [-1.5, 1.82, -6.0], look: [-1.15, 1.8, -3.9], fov: 30 }],
  sin: [{ f: 1053, pos: [82.4, 0.6, 43.2], look: [81.4, 0.4, 40.4], fov: 40 }, { f: 1115, pos: [82.0, 0.9, 43.4], look: [80.9, 1.0, 40.6], fov: 44 }],
  walk: [{ f: 1116, pos: [80.4, 1.8, 47.5], look: [79.2, 1.0, 38.5], fov: 44 }, { f: 1175, pos: [80.2, 1.7, 46.6], look: [78.8, 1.0, 38.5], fov: 42 }],
  slide2: [{ f: 1176, pos: [3.2, 0.6, 7.2], look: [0, 2.0, 0.8], fov: 50 }, { f: 1225, pos: [3.6, 0.65, 7.8], look: [0, 2.0, 0.8], fov: 48 }],
  narrow: [{ f: 1226, pos: [-1.3, 1.6, -1.6], look: [-1.0, 1.6, 6], fov: 48 }, { f: 1267, pos: [-1.25, 1.6, -1.2], look: [-1.0, 1.6, 6], fov: 46 }],
  wage: [{ f: 1268, pos: [77.5, 2.0, 99.5], look: [81, 1.2, 93], fov: 44 }, { f: 1359, pos: [78, 1.9, 99], look: [81.6, 1.2, 93], fov: 42 }],
  herd: [{ f: 1360, pos: [80, 3.0, 102], look: [80, 0.8, 90], fov: 46 }, { f: 1465, pos: [80, 9.0, 108], look: [80, 0.5, 89], fov: 50 }],
  return: [{ f: 1466, pos: [76.5, 2.0, 101], look: [79.5, 1.3, 95], fov: 42 }, { f: 1521, pos: [77, 1.9, 100.2], look: [79.5, 1.3, 95], fov: 40 }],
  every: [{ f: 1522, pos: [82.6, 1.5, 98.6], look: [80.6, 1.5, 95], fov: 36 }, { f: 1581, pos: [84.5, 4.5, 104], look: [80, 0.8, 91], fov: 52 }],
  androck: [{ f: 1582, pos: [0.2, 1.4, -9.2], look: [0, 1.7, 2], fov: 50 }, { f: 1607, pos: [0.2, 1.45, -8.6], look: [0, 1.7, 2], fov: 47 }],
  clear: [{ f: 1608, pos: [-6, 1.6, 13], look: [1.5, 2.2, 1.5], fov: 44 }, { f: 1700, pos: [-4, 2.0, 12], look: [1, 2.0, 1.5], fov: 42 }, { f: 1799, pos: [-10, 9, 30], look: [0, 3, 0], fov: 50 }],
};
const KICKS = [{ f: 255, a: 0.03 }, { f: 330, a: 0.08 }, { f: 336, a: 0.05 }, { f: 975, a: 0.03 }, { f: 1180, a: 0.035 }, { f: 1615, a: 0.04 }];
export const camAt = (f) => {
  const S = shotAt(f), K = CAMS[S.id];
  let c;
  if (f <= K[0].f) c = { ...K[0] };
  else if (f >= K[K.length - 1].f) c = { ...K[K.length - 1] };
  else for (let i = 0; i < K.length - 1; i++) if (f >= K[i].f && f <= K[i + 1].f) {
    const t = smooth((f - K[i].f) / (K[i + 1].f - K[i].f)), a = K[i], b = K[i + 1];
    c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
  }
  if (S.id === 'rumble') { const s = Math.sin(f * 2.1) * 0.012; c.look = [c.look[0] + s * 3, c.look[1] + s * 2, c.look[2]]; }
  for (const k of KICKS) { const d = f - k.f; if (d >= 0 && d < 9) { const s = (d % 2 ? -1 : 1) * k.a * (1 - d / 9); c.look = [c.look[0], c.look[1] + s * 3, c.look[2] + s * 2]; c.roll = (c.roll || 0) + s * 20; } }
  c.flash = 0;
  for (const a of [677, 1053, 1268]) if (f >= a && f < a + 5) c.flash = Math.max(c.flash, (1 - (f - a) / 5) * 0.8);
  if (f >= 330 && f < 334) c.flash = 0.45;
  if (f >= 1008 && f < 1012) c.flash = 0.2;
  const set = { parents: [80, 0, 1], asleep: [80, 0, 1], vigil: [80, 0, 1], dawn: [80, 0, 1], sin: [80, 0, 40], walk: [80, 0, 40], wage: [80, 0, 92], herd: [80, 0, 92], return: [80, 0, 92], every: [80, 0, 92] };
  c.shadowAt = set[S.id] || [0, 0, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  const F = { h2: [0.05, 1.7, -4.2], says: [-1.15, 1.8, -3.9], crack: [-1.15, 1.8, -3.9], react: [0.6, 1.7, -4.0], parents: [79.7, 1.3, 1.6], vigil: [80.9, 1.6, 2.6],
    sin: [81.4, 0.5, 40.4], walk: [79.5, 1.0, 40], wage: [80.5, 1.2, 93.5], return: [79.5, 1.3, 95], every: [80.6, 1.5, 95], move: [0, 2, 0.8], h3: [0.1, 1.9, 0.6], shift1: [0, 1, 0.8], narrow: [-1, 1.6, 2] };
  if (F[S.id]) return { focus: dist(C.pos, F[S.id]), cinf: S.id === 'every' ? lerp(10, 0, smooth(ramp(f, 1540, 1570))) : 10 };
  return { focus: 20, cinf: 0 };
};

// ---------- actors ----------
const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const CARD = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, ...extra });
const TINT = { cave: '#eef1ff', night: '#f2f4ff', memory: '#fff1e0', dusk: '#fff0e4', vigil: '#e6eaff', day: '#ffffff', dawn: '#fff1e2', black: '#0a0a10' };
// lip flap: mouth only, held 3-5 frames, only while this line plays
const LINES = [[14.99, 17.34], [17.48, 18.64], [18.78, 20.23]];
const flap = (f, base) => { const t = f / 30; if (!LINES.some(([a, b]) => t >= a && t <= b)) return base; const k = Math.floor(f / 4); return ((k * 7919) % 5) < 3 ? base + '_o' : base; };

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  const cave = (opts = {}) => MEN.forEach(([who, seed, pos], i) => out.push(R(T, who, { seed, blink: blinkAt(f, seed), expr: 'nervous', ...(opts.all || {}), ...(opts[i] || {}) }, pos, { tint })));
  switch (S.id) {
    case 'h2': cave({ all: { expr: 'nervous', look: 0.6 } }); break;
    case 'h3': cave({ 2: { expr: 'nervous', look: -0.3 }, all: { look: 0.4 } }); break;
    case 'duck': MEN.forEach(([who, seed], i) => { const d = smooth(ramp(f, 188 + i * 8, 254)); out.push(R(T, who, { seed, step: q((f * 0.05 + i * 0.3) % 1), expr: 'neutral', blink: blinkAt(f, seed) }, [lerp(1.6 - i * 0.9, MEN[i][2][0], d), 0, lerp(3.5 + i, MEN[i][2][2] + 1.2, d)], { tint })); }); break;
    case 'rumble': cave({ all: { expr: 'shock', look: 0, L: 'cheek', R: 'cheek' } }); break;
    case 'says': case 'react': cave({ 0: { expr: flap(f, 'stern'), L: 'up', R: 'up', look: 0.3 }, 1: { expr: S.id === 'react' ? 'nervous' : 'neutral', look: -0.6 }, 2: { expr: S.id === 'react' ? 'nervous' : 'neutral', look: -0.6 } }); break;
    case 'how': case 'move': cave({ all: { expr: 'nervous', look: 0.0, L: 'hang', R: 'hang' } }); break;
    case 'crack': cave({ 0: { expr: 'relief', L: 'up', R: 'up', look: 0.4 }, 1: { expr: 'relief', look: 0.5 }, 2: { expr: 'relief', look: 0.5 } }); break;
    case 'narrow': out.push(R(T, 'man3', { seed: 3, expr: 'nervous', L: 'reach', R: 'hang', look: 0 }, [-0.7, 0, 1.0], { tint, s: 1 })); break;
    case 'androck': cave({ all: { expr: 'shock', look: 0.5, L: 'up', R: 'up' } }); break;
    case 'shift1': cave({ all: { expr: 'shock', look: 0.5, L: 'cheek', R: 'cheek' } }); break;
    case 'parents': {
      const give = smooth(ramp(f, 700, 745));
      out.push(R(T, 'father', { seed: 7, blink: blinkAt(f, 7), expr: give > 0.5 ? 'relief' : 'neutral', look: 0.4 }, [78.6, 0, 1.3], { tint }));
      out.push(R(T, 'mother', { seed: 8, blink: blinkAt(f, 8), expr: give > 0.5 ? 'relief' : 'neutral', look: 0.3 }, [79.4, 0, 1.0], { tint }));
      out.push(R(T, 'man1', { seed: 1, blink: blinkAt(f, 1), expr: 'grin', L: 'belly', R: 'belly', bowl: true, look: -0.5, step: give < 1 ? q((f * 0.04) % 1) : 0 }, [lerp(80.9, 80.25, give), 0, 1.9], { tint }));
      out.push(R(T, 'civA', { seed: 11, expr: 'neutral', look: -0.6 }, [81.4, 0, 0.9], { tint, s: 0.6 }));
      out.push(R(T, 'civC', { seed: 12, expr: 'neutral', look: -0.6 }, [81.9, 0, 1.2], { tint, s: 0.55 }));
      break;
    }
    case 'asleep':
      out.push(R(T, 'father', { seed: 7, expr: 'snore', blink: 1 }, [78.9, 0.45, 1.2], { tint, roll: Math.PI / 2, blob: false }));
      out.push(R(T, 'mother', { seed: 8, expr: 'snore', blink: 1 }, [79.4, 0.45, 2.0], { tint, roll: Math.PI / 2, blob: false }));
      break;
    case 'vigil': case 'dawn': {
      out.push(R(T, 'man1', { seed: 1, blink: blinkAt(f, 1), expr: S.id === 'dawn' && f > 940 ? 'relief' : 'neutral', L: 'belly', R: 'belly', bowl: true, look: -0.6, bob: q(Math.sin(f * 0.05) * 0.006, 3) }, [80.9, 0, 2.6], { tint }));
      out.push(R(T, 'civA', { seed: 11, expr: 'shock', look: 0.4 }, [80.3, 0, 3.0], { tint, s: 0.55 }));
      out.push(R(T, 'civC', { seed: 12, expr: 'shock', look: -0.4 }, [81.5, 0, 3.1], { tint, s: 0.5 }));
      if (S.id === 'dawn') { out.push(R(T, 'father', { seed: 7, expr: 'snore', blink: 1 }, [78.9, 0.45, 1.2], { tint, roll: Math.PI / 2, blob: false })); out.push(R(T, 'mother', { seed: 8, expr: 'snore', blink: 1 }, [79.4, 0.45, 2.0], { tint, roll: Math.PI / 2, blob: false })); }
      break;
    }
    case 'sin': out.push(R(T, 'man2', { seed: 2, blink: blinkAt(f, 2), expr: f < 1085 ? 'neutral' : 'stern', look: f > 1085 ? -0.8 : 0.4, facing: f > 1090 ? -1 : 0 }, [80.4, 0, 41.4], { tint })); break;
    case 'walk': { const w = smooth(ramp(f, 1118, 1175)); out.push(R(T, 'man2', { seed: 2, blink: blinkAt(f, 2), expr: 'stern', facing: -1, look: -0.8, step: q((f * 0.05) % 1) }, [lerp(80.2, 77.4, w), 0, lerp(41.4, 39.0, w)], { tint })); break; }
    case 'wage': {
      const w = smooth(ramp(f, 1285, 1359));
      out.push(R(T, 'worker', { seed: 9, blink: blinkAt(f, 9), expr: 'stern', facing: 1, step: q((f * 0.05) % 1), look: 0.6 }, [lerp(80.6, 83.6, w), 0, lerp(93.4, 92.4, w)], { tint }));
      out.push(R(T, 'man3', { seed: 3, blink: blinkAt(f, 3), expr: f > 1320 ? 'nervous' : 'neutral', L: 'reach', R: 'hang', look: 0.6 }, [78.6, 0, 93.8], { tint }));
      break;
    }
    case 'herd': {
      const n = Math.floor(lerp(1, 20, smooth(ramp(f, 1365, 1450))));
      for (let i = 0; i < n; i++) {
        const x = 72.5 + (i * 2.3) % 15, z = 85 + Math.floor(i / 6) * 2.4 + (i % 2) * 0.6, camelI = i % 5 === 4, pop = clamp((f - (1365 + i * 4)) / 5);
        out.push(CARD(camelI ? 'camel' : 'sheep' + (i % 3), camelI ? (p) => T.camel(p) : (p) => T.sheep(p, i), [x, 0, z], (camelI ? 1.25 : 0.55) * (0.5 + 0.5 * pop), { tint, flip: i % 3 === 0 }));
      }
      out.push(R(T, 'man3', { seed: 3, blink: blinkAt(f, 3), expr: 'grin', L: 'hip', R: 'hip' }, [80, 0, 96.2], { tint }));
      break;
    }
    case 'return': case 'every': {
      const arrive = smooth(ramp(f, 1466, 1500));
      for (let i = 0; i < 14; i++) out.push(CARD(i % 4 === 3 ? 'camel' : 'sheep' + (i % 3), i % 4 === 3 ? (p) => T.camel(p) : (p) => T.sheep(p, i), [74.5 + (i * 2.1) % 12, 0, 87 + (i % 3) * 1.8], i % 4 === 3 ? 1.25 : 0.55, { tint, flip: i % 2 === 0 }));
      const giving = S.id === 'every';
      out.push(R(T, 'man3', { seed: 3, blink: blinkAt(f, 3), expr: giving ? 'grin' : 'neutral', L: giving ? 'point' : 'hang', R: giving ? 'up' : 'hang', look: 0.4 }, [78.4, 0, 95.4], { tint, flip: true }));
      out.push(R(T, 'worker', { seed: 9, blink: giving ? 0 : blinkAt(f, 9), expr: giving ? 'shock' : 'neutral', step: arrive < 1 ? q((f * 0.05) % 1) : 0, facing: -1, L: giving ? 'cheek' : 'hang', R: giving ? 'cheek' : 'hang' }, [lerp(84.5, 80.7, arrive), 0, 95.0], { tint }));
      break;
    }
    case 'clear': {
      if (f > 1660) MEN.forEach(([who, seed], i) => { const d = smooth(ramp(f, 1660 + i * 6, 1760)); out.push(R(T, who, { seed, step: q((f * 0.045 + i * 0.3) % 1), expr: 'relief', blink: blinkAt(f, seed), L: f > 1740 ? 'up' : 'hang', R: f > 1740 ? 'up' : 'hang' }, [lerp(-0.8 + i * 0.8, 0.5 + i * 1.6, d), 0, lerp(-0.6, 5.2 + i * 0.4, d)], { tint })); });
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  if (S.id === 'rumble') for (let i = 0; i < 6; i++) { const t = ((f - 255) / 20 + i / 6) % 1; out.push(FX('peb', (p) => T.fxDrip(p), [-1.6 + i * 0.6, 4.6 - t * 4.4, -3.2 - (i % 2)], 0.12, { tint: '#b89a7a' })); }
  if (S.id === 'slam' && f >= 330) { const k = q(ramp(f, 330, 370), 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#efd6ad'), [0, 0.9, 3.4], 5.5, { tint })); }
  if (S.id === 'black') MEN.forEach(([, seed], i) => { const b = blinkAt(f + i * 7, seed); out.push(FX('eyes' + b + (i - 1), (p) => T.fxEyes(p, b, i - 1), [(i - 1) * 0.55, 1.45 + (i % 2) * 0.18, -4.0], 0.42)); });
  if (S.id === 'says' || S.id === 'react' || S.id === 'how') for (const [i, [, , pos]] of MEN.entries()) if (i > 0 || S.id === 'how') out.push(FX('sweat', (p) => T.fxSweat(p), [pos[0] + 0.32, 1.95 - ((f * 0.01 + i * 0.3) % 1) * 0.2, pos[2] + 0.05], 0.12));
  if (S.id === 'how') { const t = q((f - 611) / 66, 2); out.push(FX('q' + t, (p) => T.fxQuestion(p, t), [0, 3.3, -2.2], 0.9)); }
  if (S.id === 'asleep' || S.id === 'vigil' || S.id === 'dawn') { const t = q(((f - 773) / 50) % 1, 2); out.push(FX('z' + t, (p) => T.fxZ(p, t), [79.2, 1.0, 1.6], 0.6)); }
  if (S.id === 'vigil' || S.id === 'dawn') { const t = q(((f - 816) / 24) % 1, 2); for (const [x, z, s] of [[80.3, 3.0, 0.55], [81.5, 3.1, 0.5]]) out.push(FX('tears' + t, (p) => T.fxTears(p, t), [x, s * 1.08, z + 0.02], s * 0.55)); }
  if (S.id === 'crack') { const t = q((f - 1008) / 10, 1); out.push(FX('shine' + t, (p) => T.fxShine(p, t, '#e8f2ff'), [-1.15, 2.45, -3.85], 0.5)); }
  if (S.id === 'sin' || S.id === 'walk') { out.push(CARD('coins', (p) => T.coins(p), [81.5, 0, 40.4], 1.1, { tint, blob: false })); if (S.id === 'sin') { const t = q((f - 1053) / 12, 1); out.push(FX('gshine' + t, (p) => T.fxShine(p, t), [81.5, 0.9, 40.5], 0.45)); } }
  if (S.id === 'wage') out.push(CARD('pouch', (p) => T.pouch(p), [79.4, 0, 94.2], 0.5, { tint, blob: false }));
  if (S.id === 'herd') for (let i = 0; i < 4; i++) { const t = q(((f - 1360) / 24 + i / 4) % 1, 2); out.push(FX('grow' + t, (p) => T.fxGrow(p, t), [74 + i * 4, 2.4, 87], 0.8)); }
  if (S.id === 'clear' && f >= 1615 && f < 1680) { const k = q(ramp(f, 1615, 1680), 2); out.push(FX('dustc' + k, (p) => T.fxDust(p, k, '#ffe2b8'), [3, 1.0, 3.5], 5, { tint })); }
  return out;
};
