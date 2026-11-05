// Shot plan for "Three Men in the Cave" (Sahih al-Bukhari 2272), timed to voice.mp3 (57.7 s, 30 fps).
// Phrases (s): 0.35 travelling | 2.85 cave | 5.06 rock rolled | 7.60 sealed | 9.32 trapped | 10.71 only deeds |
// 14.11 first said | 16.37 parents | ~19.4 asleep / until dawn | 23.74 if for You | 26.25 rock moved | 27.99 a little |
// 28.90 second said | 30.07 great sin | 32.78 fear You | 34.93 walked away | 36.31 moved again | 38.35 third said |
// 39.50 worker left | 41.64 invested | 42.85 herd | 44.90 came back | 46.14 gave all | 47.59 rolled away |
// 49.53 walked out | 51.92 sincere deeds | 55.42 open the way out.
export const FPS = 30, TOTAL = 1731;
export const SHOTS = [
  { id: 'hook', a: 0, b: 151, light: 'night' },
  { id: 'roll', a: 152, b: 245, light: 'night' },
  { id: 'sealed', a: 246, b: 423, light: 'cave' },
  { id: 'first', a: 424, b: 491, light: 'cave' },
  { id: 'parents', a: 492, b: 582, light: 'dusk' },
  { id: 'vigil', a: 583, b: 703, light: 'vigil' },
  { id: 'plea1', a: 704, b: 786, light: 'cave' },
  { id: 'move1', a: 787, b: 866, light: 'cave' },
  { id: 'second', a: 867, b: 974, light: 'cave' },
  { id: 'sin', a: 975, b: 1081, light: 'memory' },
  { id: 'move2', a: 1082, b: 1149, light: 'cave' },
  { id: 'third', a: 1150, b: 1186, light: 'cave' },
  { id: 'wage', a: 1187, b: 1248, light: 'memoryDay' },
  { id: 'herd', a: 1249, b: 1346, light: 'memoryDay' },
  { id: 'returns', a: 1347, b: 1427, light: 'memoryDay' },
  { id: 'open', a: 1428, b: 1555, light: 'dawn' },
  { id: 'outro', a: 1556, b: 1730, light: 'dawn' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

// ---------- lights ----------
const NIGHT = { az: 210, el: 38, sky: '#8090c8', ground: '#5a4a60', hemi: 1.7, sun: '#d4dcff', sunI: 1.9, fog: '#1d2546', fogNear: 60, fogFar: 700,
  skyTop: '#0e1838', skyHor: '#3a4a82', sunDisc: '#f4f1e0', sunSize: 0.0016, sat: 0.95, gain: '#e2e8ff', vig: 0.34, shadowExt: 22, night: true };
export const LIGHTS = {
  night: NIGHT,
  cave: { ...NIGHT, hemi: 1.2, sunI: 0.5, sky: '#9a8aa0', ground: '#4a3428', gain: '#d4d0ec', vig: 0.4, lamp: 0 },
  dusk: { az: 250, el: 6, sky: '#a77fa0', ground: '#6a4434', hemi: 1.0, sun: '#ffab66', sunI: 2.4, fog: '#e8a27c', fogNear: 60, fogFar: 600,
    skyTop: '#5e4f8f', skyHor: '#f2a06e', sunDisc: '#ffe2b0', sunSize: 0.004, sat: 0.9, gain: '#fff0dc', vig: 0.3, shadowExt: 18 },
  vigil: { ...NIGHT, gain: '#d6d8ff', lamp: 2.2 },
  memory: { ...NIGHT, hemi: 1.4, sat: 0.7, gain: '#f2dcc0', vig: 0.4, lamp: 0 },
  memoryDay: { az: 140, el: 40, sky: '#d8c8a8', ground: '#a68a5c', hemi: 1.1, sun: '#fff1d6', sunI: 2.2, fog: '#ead8b4', fogNear: 80, fogFar: 800,
    skyTop: '#7aa0cf', skyHor: '#ecd6ae', sat: 0.78, gain: '#fff0d8', vig: 0.26, shadowExt: 20 },
  dawn: { az: 75, el: 10, sky: '#b9a0c4', ground: '#7a5844', hemi: 1.05, sun: '#ffc27e', sunI: 2.7, fog: '#f2c08e', fogNear: 70, fogFar: 760,
    skyTop: '#5f7cc0', skyHor: '#ffcf95', sunDisc: '#fff2c8', sunSize: 0.004, sat: 1.08, gain: '#fff4e4', vig: 0.24, shadowExt: 22 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'vigil') { // night slowly turns to dawn while he waits
    const t = smooth(ramp(f, 600, 700)), D = LIGHTS.dawn;
    L.skyTop = t > 0.5 ? D.skyTop : L.skyTop; L.skyHor = t > 0.3 ? D.skyHor : L.skyHor; L.night = t < 0.6;
    L.hemi = lerp(L.hemi, D.hemi, t); L.sunI = lerp(L.sunI, D.sunI, t); L.sun = t > 0.5 ? D.sun : L.sun; L.az = 75; L.el = lerp(20, 8, t);
    L.gain = t > 0.5 ? '#ffe9d0' : L.gain; L.lamp = lerp(2.2, 0.4, t); L.fog = t > 0.5 ? D.fog : L.fog;
  }
  if (S.id === 'move1') L.hemi = lerp(1.2, 1.4, smooth(ramp(f, 795, 830)));
  if (S.id === 'second' || S.id === 'move2') L.hemi = 1.4;
  if (S.id === 'move2') L.hemi = lerp(1.4, 1.6, smooth(ramp(f, 1090, 1120)));
  if (S.id === 'third') L.hemi = 1.6;
  if (S.id === 'open') { const t = smooth(ramp(f, 1440, 1500)); L.hemi = lerp(1.4, 1.05, t); L.gain = t > 0.5 ? '#fff4e4' : '#c9c4dc'; }
  return L;
};

// ---------- boulder + light through the gap ----------
const REST = { x: 0, y: 2.0, z: 1.05 };
export const worldAt = (f) => {
  const W = { boulder: { ...REST, rx: 0, rz: 0 }, shaft: 0, shaftW: 0.1, shaftX: 0 };
  if (f < 175) W.boulder = { x: 10, y: 11, z: 6, rx: 0, rz: 0 };
  else if (f < 236) { // roll down the slope to the mouth
    const t = smooth(ramp(f, 175, 236)), x = lerp(10, 0, t), y = lerp(11, 2.0, t) + Math.sin(t * Math.PI * 3) * 0.4 * (1 - t), z = lerp(6, 1.05, t);
    W.boulder = { x, y, z, rx: 0, rz: (10 - x) / 2.05 };
  }
  const gap = f < 800 ? 0 : f < 1095 ? 0.55 * smooth(ramp(f, 800, 830)) : f < 1440 ? lerp(0.55, 1.2, smooth(ramp(f, 1095, 1125))) : lerp(1.2, 6.5, smooth(ramp(f, 1440, 1495)));
  if (f >= 236) {
    W.boulder.x = gap; W.boulder.rz = 4.39 - gap / 2.05;
    if (f >= 1440) W.boulder.z = lerp(1.05, 3.2, smooth(ramp(f, 1440, 1495)));
    const w = Math.min(3.4, gap * 1.4);
    W.shaft = gap > 0.01 ? (f >= 1440 ? lerp(0.08, 0.03, smooth(ramp(f, 1470, 1530))) : 0.07) : 0; W.shaftW = w; W.shaftX = -1.7 + w / 2;
  }
  return W;
};

// ---------- cameras ----------
const IN = (z0, z1, y = 1.55) => [[0.15, y, z0], [0, 1.45, 2]];
const CAMS = {
  hook: [
    { f: 0, pos: [12, 3.2, 20], look: [3, 2.4, 2], fov: 44 },
    { f: 151, pos: [7, 2.6, 13.5], look: [0.5, 2.0, 0], fov: 42 },
  ],
  roll: [
    { f: 152, pos: [-12, 3.5, 18], look: [5, 7, 4], fov: 46 },
    { f: 230, pos: [-9, 2.8, 12], look: [1, 2.6, 0], fov: 42 },
    { f: 245, pos: [-8.6, 2.7, 11.5], look: [0.5, 2.4, 0], fov: 41 },
  ],
  sealed: [
    { f: 246, pos: [0.3, 1.6, -9.6], look: [0, 1.6, 2], fov: 50 },
    { f: 423, pos: [0.2, 1.5, -8.8], look: [0, 1.55, 2], fov: 47 },
  ],
  first: [
    { f: 424, pos: [-1.8, 1.8, -7.4], look: [-1.0, 1.75, -3.9], fov: 34 },
    { f: 491, pos: [-1.7, 1.78, -7.0], look: [-1.0, 1.75, -3.9], fov: 32 },
  ],
  parents: [
    { f: 492, pos: [79.4, 2.0, 8.5], look: [79.6, 1.4, 1.4], fov: 40 },
    { f: 582, pos: [79.4, 1.85, 7.4], look: [79.6, 1.4, 1.4], fov: 38 },
  ],
  vigil: [
    { f: 583, pos: [83.5, 2.6, 9.5], look: [79.8, 1.0, 1.2], fov: 42 },
    { f: 703, pos: [82.6, 2.2, 7.6], look: [79.8, 1.0, 1.2], fov: 38 },
  ],
  plea1: [
    { f: 704, pos: [-1.7, 1.78, -7.1], look: [-1.0, 1.75, -3.9], fov: 33 },
    { f: 786, pos: [-1.6, 1.76, -6.8], look: [-1.0, 1.75, -3.9], fov: 31 },
  ],
  move1: [
    { f: 787, pos: [0.3, 1.6, -9.6], look: [0, 1.6, 2], fov: 50 },
    { f: 866, pos: [0.2, 1.55, -9.0], look: [0, 1.6, 2], fov: 47 },
  ],
  second: [
    { f: 867, pos: [0.1, 1.8, -7.6], look: [0.05, 1.75, -4.2], fov: 34 },
    { f: 974, pos: [0.1, 1.78, -7.1], look: [0.05, 1.75, -4.2], fov: 31 },
  ],
  sin: [
    { f: 975, pos: [80.5, 1.8, 47.5], look: [80, 1.0, 38], fov: 42 },
    { f: 1081, pos: [80.3, 1.7, 46.2], look: [80, 1.0, 38], fov: 39 },
  ],
  move2: [
    { f: 1082, pos: [-0.3, 1.6, -9.6], look: [0, 1.6, 2], fov: 50 },
    { f: 1149, pos: [-0.2, 1.55, -9.0], look: [0, 1.6, 2], fov: 47 },
  ],
  third: [
    { f: 1150, pos: [1.9, 1.8, -7.4], look: [1.1, 1.75, -3.9], fov: 34 },
    { f: 1186, pos: [1.8, 1.78, -7.1], look: [1.1, 1.75, -3.9], fov: 33 },
  ],
  wage: [
    { f: 1187, pos: [77.5, 2.0, 99.5], look: [81, 1.2, 93], fov: 44 },
    { f: 1248, pos: [78, 1.9, 99], look: [81.4, 1.2, 93], fov: 42 },
  ],
  herd: [
    { f: 1249, pos: [80, 4.5, 104], look: [80, 0.8, 90], fov: 46 },
    { f: 1346, pos: [80, 5.5, 107], look: [80, 0.8, 89.5], fov: 48 },
  ],
  returns: [
    { f: 1347, pos: [76.5, 2.0, 101], look: [79.5, 1.3, 95], fov: 42 },
    { f: 1427, pos: [77, 1.9, 100.2], look: [79.5, 1.3, 95], fov: 40 },
  ],
  open: [
    { f: 1428, pos: [0.3, 1.6, -9.6], look: [0, 1.6, 2], fov: 50 },
    { f: 1500, pos: [0.2, 1.6, -8.4], look: [0, 1.7, 4], fov: 46 },
    { f: 1501, pos: [6, 2.2, 13], look: [0, 1.8, 0], fov: 40 },
    { f: 1555, pos: [5, 2.0, 11], look: [0, 1.8, 1.5], fov: 38 },
  ],
  outro: [
    { f: 1556, pos: [14, 4, 26], look: [0, 3, 0], fov: 44 },
    { f: 1730, pos: [20, 7, 36], look: [0, 4, 0], fov: 46 },
  ],
};
void IN;
const KICKS = [{ f: 236, a: 0.06 }, { f: 247, a: 0.05 }, { f: 805, a: 0.025 }, { f: 1100, a: 0.03 }, { f: 1460, a: 0.04 }];
export const camAt = (f) => {
  const S = shotAt(f), K = CAMS[S.id];
  let c;
  if (f <= K[0].f) c = { ...K[0] };
  else if (f >= K[K.length - 1].f) c = { ...K[K.length - 1] };
  else for (let i = 0; i < K.length - 1; i++) if (f >= K[i].f && f <= K[i + 1].f) {
    const t = smooth((f - K[i].f) / (K[i + 1].f - K[i].f)), a = K[i], b = K[i + 1];
    c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
  }
  for (const k of KICKS) { const d = f - k.f; if (d >= 0 && d < 8) { const s = (d % 2 ? -1 : 1) * k.a * (1 - d / 8); c.look = [c.look[0], c.look[1] + s * 3, c.look[2] + s * 2]; c.roll = (c.roll || 0) + s * 20; } }
  // soft white flash into and out of each memory
  const flashAt = [492, 704, 975, 1082, 1187, 1428];
  c.flash = 0; for (const a of flashAt) if (f >= a && f < a + 6) c.flash = Math.max(c.flash, (1 - (f - a) / 6) * 0.7);
  if (S.id === 'roll' && f >= 236 && f < 242) c.flash = 0.25;
  c.shadowAt = S.id === 'herd' || S.id === 'wage' || S.id === 'returns' ? [80, 0, 92] : S.id === 'parents' || S.id === 'vigil' ? [80, 0, 1] : S.id === 'sin' ? [80, 0, 40] : [0, 0, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'first': case 'plea1': return { focus: dist(C.pos, [-1.0, 1.75, -3.9]), cinf: 12 };
    case 'second': return { focus: dist(C.pos, [0.05, 1.75, -4.2]), cinf: 12 };
    case 'third': return { focus: dist(C.pos, [1.1, 1.75, -3.9]), cinf: 12 };
    case 'sealed': case 'move1': case 'move2': return { focus: dist(C.pos, [0, 1.5, -4]), cinf: 5 };
    case 'parents': return { focus: dist(C.pos, [79.6, 1.4, 1.6]), cinf: 8 };
    case 'vigil': return { focus: dist(C.pos, [80.6, 1.3, 2.4]), cinf: 7 };
    case 'sin': return { focus: dist(C.pos, [80, 1.2, 41]), cinf: 8 };
    case 'wage': case 'returns': return { focus: dist(C.pos, [79.5, 1.3, 94]), cinf: 7 };
  }
  return { focus: 20, cinf: 0 };
};

// ---------- actors ----------
const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const CARD = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, ...extra });
const TINT = { cave: '#c4c0dc', night: '#d4d8f0', memory: '#d8c4b0', dusk: '#ffd9c0', vigil: '#c8c8e6', memoryDay: '#f6e6cf', dawn: '#ffe6cc' };
const talk = (f, a, b) => f >= a && f <= b && Math.floor(f / 4) % 2 === 0 ? 'grin' : 'neutral';
// the three men in the cave (left, middle, right of the mouth, facing the camera inside)
const MEN = [['man1', 1, [-1.25, 0, -3.9]], ['man2', 2, [0.05, 0, -4.2]], ['man3', 3, [1.3, 0, -3.9]]];

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  const cave = (opts = {}) => MEN.forEach(([who, seed, pos], i) => out.push(R(T, who, { seed, blink: blinkAt(f, seed), expr: 'nervous', ...(opts[i] || opts.all || {}) }, pos, { tint })));
  switch (S.id) {
    case 'hook': { // walking in single file towards the cave mouth
      MEN.forEach(([who, seed], i) => {
        const d = Math.max(0, f - i * 12) / 151, x = lerp(6 + i * 1.3, 0.6 - i * 0.5, smooth(d)), z = lerp(11 + i * 0.8, 1.6, smooth(d));
        out.push(R(T, who, { seed, step: q((f * 0.045 + i * 0.3) % 1), blink: blinkAt(f, seed), expr: 'neutral', look: -0.4 }, [x, 0, z], { tint }));
      });
      break;
    }
    case 'roll': break; // just the boulder outside
    case 'sealed': {
      const shock = f < 300, dua = f > 330;
      cave({ all: { expr: shock ? 'shock' : dua ? 'nervous' : 'nervous', L: dua ? 'up' : shock ? 'cheek' : 'hang', R: dua ? 'up' : shock ? 'cheek' : 'hang', look: shock ? 0.5 : 0 } });
      break;
    }
    case 'first': case 'plea1': {
      const speaking = S.id === 'first' ? talk(f, 424, 491) : talk(f, 708, 770);
      cave({ 0: { expr: speaking, L: 'up', R: 'up' }, 1: { expr: 'nervous', L: 'up', R: 'up' }, 2: { expr: 'nervous', L: 'up', R: 'up' } });
      break;
    }
    case 'parents': { // he brings the milk to his parents first
      const give = smooth(ramp(f, 520, 560));
      out.push(R(T, 'father', { seed: 7, blink: blinkAt(f, 7), expr: give > 0.5 ? 'relief' : 'neutral', look: 0.4 }, [78.5, 0, 1.3], { tint }));
      out.push(R(T, 'mother', { seed: 8, blink: blinkAt(f, 8), expr: give > 0.5 ? 'relief' : 'neutral', look: 0.3 }, [79.4, 0, 1.0], { tint }));
      out.push(R(T, 'man1', { seed: 1, blink: blinkAt(f, 1), expr: 'grin', L: 'belly', R: 'belly', bowl: true, look: -0.5, step: give < 1 ? q((f * 0.04) % 1) : 0 }, [lerp(80.9, 80.25, give), 0, 1.9], { tint }));
      break;
    }
    case 'vigil': { // they sleep; he stands with the bowl until dawn
      out.push(R(T, 'father', { seed: 7, expr: 'snore', blink: 1 }, [78.9, 0.45, 1.2], { tint, roll: Math.PI / 2, blob: false }));
      out.push(R(T, 'mother', { seed: 8, expr: 'snore', blink: 1 }, [79.4, 0.45, 2.0], { tint, roll: Math.PI / 2, blob: false }));
      out.push(R(T, 'man1', { seed: 1, blink: f > 690 ? 0 : blinkAt(f, 1), expr: 'neutral', L: 'belly', R: 'belly', bowl: true, look: -0.6, bob: q(Math.sin(f * 0.05) * 0.006, 3) }, [81.0, 0, 2.6], { tint }));
      break;
    }
    case 'move1': case 'move2': case 'third': {
      const look = S.id === 'third' ? 0 : 0.6, e = S.id === 'third' ? null : f > (S.id === 'move1' ? 805 : 1100) ? 'relief' : 'nervous';
      if (S.id === 'third') cave({ 0: { L: 'up', R: 'up' }, 1: { L: 'up', R: 'up' }, 2: { expr: talk(f, 1150, 1186), L: 'up', R: 'up' } });
      else cave({ all: { expr: e, look, L: 'up', R: 'up' } });
      break;
    }
    case 'second': cave({ 0: { L: 'up', R: 'up' }, 1: { expr: talk(f, 870, 970), L: 'up', R: 'up' }, 2: { L: 'up', R: 'up' } }); break;
    case 'sin': { // gold on the floor; he turns away and walks out (no one else is shown)
      const turn = f > 1030, walkT = smooth(ramp(f, 1035, 1081));
      out.push(R(T, 'man2', { seed: 2, blink: blinkAt(f, 2), expr: f < 1015 ? 'neutral' : 'stern', look: turn ? -0.8 : 0.3, facing: turn ? -1 : 0, step: turn ? q((f * 0.05) % 1) : 0, L: 'hang', R: 'hang' }, [lerp(80.6, 77.0, walkT), 0, lerp(41.2, 42.5, walkT)], { tint }));
      break;
    }
    case 'wage': { // the worker leaves without his wage; the pouch stays
      const w = smooth(ramp(f, 1195, 1248));
      out.push(R(T, 'worker', { seed: 9, blink: blinkAt(f, 9), expr: 'neutral', facing: 1, step: q((f * 0.05) % 1), look: 0.6 }, [lerp(80.6, 83.4, w), 0, lerp(93.4, 92.4, w)], { tint }));
      out.push(R(T, 'man3', { seed: 3, blink: blinkAt(f, 3), expr: f > 1230 ? 'nervous' : 'neutral', L: 'reach', R: 'hang', look: 0.6 }, [78.6, 0, 93.8], { tint }));
      break;
    }
    case 'herd': { // the wage grows into a herd
      const n = Math.floor(lerp(2, 16, smooth(ramp(f, 1255, 1335))));
      for (let i = 0; i < n; i++) {
        const x = 73 + (i * 2.3) % 14, z = 86 + Math.floor(i / 6) * 2.6 + (i % 2) * 0.6, camelI = i % 5 === 4;
        const pop = clamp((f - (1255 + i * 5)) / 6);
        out.push(CARD(camelI ? 'camel' : 'sheep' + (i % 3), camelI ? (p) => T.camel(p) : (p) => T.sheep(p, i), [x, 0, z], (camelI ? 1.25 : 0.55) * (0.6 + 0.4 * pop), { tint, flip: i % 3 === 0 }));
      }
      out.push(R(T, 'man3', { seed: 3, blink: blinkAt(f, 3), expr: 'grin', L: 'hip', R: 'hip' }, [80, 0, 96.2], { tint }));
      break;
    }
    case 'returns': { // he comes back; given all of it
      const arrive = smooth(ramp(f, 1347, 1385));
      for (let i = 0; i < 10; i++) out.push(CARD(i % 4 === 3 ? 'camel' : 'sheep' + (i % 3), i % 4 === 3 ? (p) => T.camel(p) : (p) => T.sheep(p, i), [76 + (i * 2.1) % 9, 0, 88 + (i % 3) * 1.8], i % 4 === 3 ? 1.25 : 0.55, { tint, flip: i % 2 === 0 }));
      out.push(R(T, 'man3', { seed: 3, blink: blinkAt(f, 3), expr: f > 1395 ? 'grin' : 'neutral', L: f > 1390 ? 'point' : 'hang', R: 'hang', look: 0.4 }, [78.4, 0, 95.4], { tint, flip: true }));
      out.push(R(T, 'worker', { seed: 9, blink: blinkAt(f, 9), expr: f > 1400 ? 'shock' : 'neutral', step: arrive < 1 ? q((f * 0.05) % 1) : 0, facing: -1, L: f > 1405 ? 'cheek' : 'hang', R: f > 1405 ? 'cheek' : 'hang' }, [lerp(84.5, 80.7, arrive), 0, 95.0], { tint }));
      break;
    }
    case 'open': {
      if (f < 1501) cave({ all: { expr: f > 1455 ? 'relief' : 'shock', look: 0.5, L: f > 1470 ? 'up' : 'cheek', R: f > 1470 ? 'up' : 'cheek' } });
      else MEN.forEach(([who, seed], i) => { const d = smooth(ramp(f, 1501 + i * 6, 1555)); out.push(R(T, who, { seed, step: q((f * 0.045 + i * 0.3) % 1), expr: 'relief', blink: blinkAt(f, seed) }, [lerp(-0.6 + i * 0.7, 2 + i * 1.3, d), 0, lerp(-1.0, 4.5 + i * 0.6, d)], { tint })); });
      break;
    }
    case 'outro': MEN.forEach(([who, seed], i) => { const d = (f - 1556) / 174; out.push(R(T, who, { seed, step: q((f * 0.045 + i * 0.3) % 1), expr: 'relief' }, [2 + i * 1.3 + d * 10, 0, 4.5 + i * 0.6 + d * 6], { tint })); }); break;
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  if (S.id === 'roll' && f >= 234) { const k = q(ramp(f, 234, 245), 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#e9cfa4'), [0, 1.2, 3.4], 5, { tint })); }
  if (S.id === 'sealed' && f < 290) { const k = q(ramp(f, 246, 290), 2); out.push(FX('dusti' + k, (p) => T.fxDust(p, k, '#8a7462'), [0, 1.0, -0.6], 4, { tint: '#9a96b8' })); }
  if (S.id === 'vigil') { const t = q(((f - 583) / 50) % 1, 2); out.push(FX('z' + t, (p) => T.fxZ(p, t), [79.2, 1.0, 1.6], 0.6)); }
  if (S.id === 'sin') out.push(CARD('coins', (p) => T.coins(p), [81.5, 0, 40.4], 1.1, { tint, blob: false }));
  if (S.id === 'wage') out.push(CARD('pouch', (p) => T.pouch(p), [79.4, 0, 94.2], 0.5, { tint, blob: false }));
  if (S.id === 'herd') for (let i = 0; i < 3; i++) { const t = q(((f - 1249) / 30 + i / 3) % 1, 2); out.push(FX('grow' + t, (p) => T.fxGrow(p, t), [75 + i * 5, 2.4, 88], 0.8)); }
  return out;
};
