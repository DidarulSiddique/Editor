// "Cleopatra wasn't Egyptian — so where did she come from?"  60 s, 30 fps, 9:16.
// voice.wav (Kokoro, 56.6 s). Shot cuts land on the narration (segs.txt); every shot moves.
export const FPS = 30, TOTAL = 1800;
export const SHOTS = [
  { id: 'eye', a: 0, b: 40, light: 'hall', macro: true },
  { id: 'hall', a: 41, b: 84, light: 'hall', cu: true },
  { id: 'spin', a: 85, b: 117, light: 'hall', cu: true },
  { id: 'coin', a: 118, b: 143, light: 'hall' },
  { id: 'picture', a: 144, b: 168, light: 'hall', cu: true },
  { id: 'collar', a: 169, b: 201, light: 'hall', macro: true },
  { id: 'cobra', a: 202, b: 234, light: 'hall', macro: true },
  { id: 'bow', a: 235, b: 281, light: 'hall' },
  { id: 'rewind', a: 282, b: 357, light: 'hall' },
  { id: 'macedonia', a: 358, b: 415, light: 'tent' },
  { id: 'battle', a: 416, b: 470, light: 'sunset' },
  { id: 'riders', a: 471, b: 525, light: 'sunset' },
  { id: 'dies', a: 526, b: 566, light: 'sunset' },
  { id: 'cake', a: 567, b: 639, light: 'tent' },
  { id: 'grab', a: 640, b: 699, light: 'tent', cu: true },
  { id: 'egypt', a: 700, b: 723, light: 'egypt' },
  { id: 'alex', a: 724, b: 803, light: 'day' },
  { id: 'kings', a: 804, b: 862, light: 'day' },
  { id: 'born', a: 863, b: 937, light: 'night' },
  { id: 'busts', a: 938, b: 1032, light: 'day' },
  { id: 'learn', a: 1033, b: 1076, light: 'lib' },
  { id: 'dress', a: 1077, b: 1124, light: 'hall' },
  { id: 'isis', a: 1125, b: 1178, light: 'egypt' },
  { id: 'speech', a: 1179, b: 1214, light: 'egypt' },
  { id: 'speech2', a: 1215, b: 1255, light: 'egypt', cu: true },
  { id: 'born2', a: 1256, b: 1317, light: 'day' },
  { id: 'ruler', a: 1318, b: 1392, light: 'hall', cu: true },
  { id: 'blood', a: 1393, b: 1437, light: 'hall', cu: true },
  { id: 'maced', a: 1438, b: 1481, light: 'sunset' },
  { id: 'aisle', a: 1482, b: 1518, light: 'hall' },
  { id: 'throne', a: 1519, b: 1625, light: 'hall', cu: true },
  { id: 'split', a: 1626, b: 1799, light: 'split' },
];
import { M as EZ, camFromKeys, idle } from './motion.js';
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

// ---------- set coordinates (mirror main.js) ----------
const BX = 1000, TZ = -150, AX = 2000, SX = 3000, STOA_Z = 18, NURS = [AX - 40, 70], LIB = [AX + 40, 70], PY = [SX + 16, -34], PH = [AX - 35, -150];
const THR = [0, 1.05, -19.9];                     // Cleopatra seated on the throne (seat hides her legs); drawn at QS scale
const QS = 1.3;                                   // v2: she was too small on the throne -> 1.3x (Egyptian art's hierarchy of scale)
const CAKE_TOP = 1.03, CAKE = [BX, CAKE_TOP, TZ];
const BRAZ = [[-2.5, 0, -12.4], [2.5, 0, -12.4], [-2.6, 1.2, -18.4], [2.6, 1.2, -18.4], [-2.5, 0, -4], [2.5, 0, -4]];
const HALL_LIGHTS = [[-2.5, 2.2, -12.4, 3.2], [2.5, 2.2, -12.4, 3.2], [0, 3.4, -18.0, 3.6], [0, 2.4, -4, 2.6]];
// map points on the cake top (world x/z offsets from the cake centre)
const MAPPT = { maced: [-0.65, -0.95], egypt: [-0.5, 0.9] };

// ---------- lights ----------
const HALL = { az: 82, el: 20, sky: '#fff0dc', ground: '#6a6488', hemi: 1.2, sun: '#ffd09a', sunI: 2.4, fog: '#3a3354', fogNear: 35, fogFar: 320,
  skyTop: '#3a5aa8', skyHor: '#ffc890', sunDisc: '#fff2cc', sunSize: 0.004, sat: 1.1, gain: '#fffaf4', vig: 0.3, shadowExt: 26, bloom: 0.65 };
export const LIGHTS = {
  hall: HALL,
  tent: { ...HALL, az: 100, el: 50, sunI: 0.9, hemi: 1.45, sky: '#ffe2c0', ground: '#6a5a7a', fog: '#3a2a3a', fogNear: 20, fogFar: 160, vig: 0.32, shadowExt: 12 },
  sunset: { az: 262, el: 9, sky: '#d8a8c8', ground: '#7a5a40', hemi: 1.3, sun: '#ffa060', sunI: 2.8, fog: '#f0a070', fogNear: 60, fogFar: 640,
    skyTop: '#5250a8', skyHor: '#ffb070', sunDisc: '#fff0c0', sunSize: 0.006, sat: 1.2, gain: '#ffffff', vig: 0.24, shadowExt: 26, bloom: 1.1 },
  day: { az: 130, el: 50, sky: '#cfe2ff', ground: '#b08a5c', hemi: 1.35, sun: '#fff4dc', sunI: 2.6, fog: '#cfe0f4', fogNear: 120, fogFar: 1100,
    skyTop: '#2f7de0', skyHor: '#bfe0ff', sat: 1.2, gain: '#ffffff', vig: 0.18, shadowExt: 30, bloom: 0.7 },
  egypt: { az: 120, el: 34, sky: '#d6e4ff', ground: '#c09a62', hemi: 1.3, sun: '#ffe8bc', sunI: 2.7, fog: '#f2dcb0', fogNear: 120, fogFar: 900,
    skyTop: '#3584e0', skyHor: '#ffe6b8', sunDisc: '#fff6d8', sunSize: 0.004, sat: 1.2, gain: '#ffffff', vig: 0.2, shadowExt: 26, bloom: 0.8 },
  night: { az: 210, el: 40, sky: '#a8bcff', ground: '#5c6294', hemi: 1.6, sun: '#d4e0ff', sunI: 1.2, fog: '#24305e', fogNear: 30, fogFar: 300,
    skyTop: '#0f2a6e', skyHor: '#4a7fd0', sat: 1.15, gain: '#eef2ff', vig: 0.32, shadowExt: 12, night: true, bloom: 1.1 },
  lib: { az: 60, el: 40, sky: '#ffe2b8', ground: '#8a6a44', hemi: 1.45, sun: '#ffdcaa', sunI: 2.2, fog: '#e8c8a0', fogNear: 40, fogFar: 300,
    skyTop: '#4a86d8', skyHor: '#ffdcb0', sat: 1.15, gain: '#fff8ee', vig: 0.24, shadowExt: 14, bloom: 0.8 },
  split: { az: 95, el: 16, sky: '#e0d0ff', ground: '#a07850', hemi: 1.3, sun: '#ffc98a', sunI: 2.8, fog: '#ffd2a0', fogNear: 120, fogFar: 900,
    skyTop: '#4a6ad0', skyHor: '#ffd29a', sunDisc: '#fff4cc', sunSize: 0.006, sat: 1.22, gain: '#ffffff', vig: 0.22, shadowExt: 18, bloom: 1.0 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'dies') { const t = smooth(ramp(f, 530, 560)); L.sunI = lerp(2.8, 1.2, t); L.hemi = lerp(1.3, 0.95, t); L.sat = lerp(1.2, 0.75, t); }
  if (S.id === 'blood') { const t = smooth(ramp(f, 1396, 1420)); L.hemi = lerp(1.25, 0.8, t); L.gain = t > 0.5 ? '#f0e4ff' : HALL.gain; L.vig = lerp(0.3, 0.5, t); }
  if (S.id === 'throne') L.bloom = 1.0 + 0.4 * smooth(ramp(f, 1560, 1600));
  if (S.id === 'rewind') L.sat = lerp(1.2, 0.5, ramp(f, 300, 350));
  return L;
};

// ---------- cameras ----------
const K = (f, pos, look, fov, ease, path) => ({ f, pos, look, fov, ease, path });
const CAMS = {
  eye: [K(0, [0.45, 3.12, -15.6], [0.0, 3.0, -19.9], 24), K(40, [0.05, 3.07, -16.15], [0.0, 3.0, -19.9], 23)],
  hall: [K(41, [0.0, 3.15, -16.6], [0, 2.9, -19.9], 36), K(84, [0.0, 6.2, 6.0], [0, 2.8, -18], 44, 'easeOut', [[0.4, 3.4, -12], [0.2, 5.0, -3]])],
  spin: [K(85, [0.6, 2.95, -15.4], [0, 2.75, -19.9], 36, null), K(117, [0.3, 2.9, -15.9], [0, 2.75, -19.9], 34, 'easeOut')],
  coin: [K(118, [0.0, 3.3, -8.6], [0, 0.1, -12.0], 36), K(143, [0.0, 2.9, -9.0], [0, 0.1, -12.0], 34, 'easeOut')],
  picture: [K(144, [1.4, 1.0, -13.4], [0, 2.85, -19.9], 40), K(168, [0.7, 0.95, -13.2], [0, 2.85, -19.9], 39)],
  collar: [K(169, [0.5, 2.66, -17.3], [0.0, 2.6, -19.9], 26), K(201, [0.15, 2.63, -17.55], [0.0, 2.6, -19.9], 25)],
  cobra: [K(202, [-0.38, 3.28, -17.3], [0.0, 3.17, -19.9], 26), K(234, [-0.08, 3.24, -17.55], [0.0, 3.17, -19.9], 24)],
  bow: [K(235, [0.0, 0.45, -3.2], [0, 2.3, -19], 46), K(281, [0.0, 0.6, -5.4], [0, 2.3, -19], 44)],
  rewind: [K(282, [0.0, 3.0, -9.0], [0, 2.4, -19.9], 44), K(357, [0.0, 34, 60], [0, 2, -12], 60, 'easeIn', [[0, 5, 0], [0, 12, 22]])],
  macedonia: [K(358, [BX - 0.3, 4.9, TZ + 2.4], [BX - 0.7, CAKE_TOP, TZ - 0.5], 40), K(415, [BX - 0.75, 3.45, TZ + 0.75], [BX - 0.75, CAKE_TOP, TZ - 0.7], 40, 'easeOut')],
  battle: [K(416, [BX + 0.6, 0.45, 5.4], [BX + 0.1, 1.9, -3], 50), K(470, [BX + 0.2, 0.6, 6.4], [BX, 1.8, -3], 48)],
  riders: [K(471, [BX - 6.2, 1.1, 15.3], [BX - 6.2, 1.75, 4], 40), K(525, [BX + 5.2, 1.25, 15.1], [BX + 5.2, 1.75, 4], 40, 'linear')],
  dies: [K(526, [BX + 2.9, 1.25, 6.6], [BX + 2.3, 1.2, 0.0], 40), K(566, [BX + 2.6, 1.35, 5.8], [BX + 2.25, 1.2, 0.0], 38)],
  cake: [K(567, [BX - 0.15, 2.6, TZ + 0.9], [BX - 0.1, CAKE_TOP, TZ], 38), K(639, [BX + 0.5, 3.1, TZ + 6.4], [BX, 1.0, TZ], 46, 'easeOut', [[BX + 0.2, 2.8, TZ + 2.8]])],
  grab: [K(640, [BX - 3.9, 1.85, TZ + 5.3], [BX - 0.45, 1.2, TZ + 2.8], 46), K(699, [BX - 3.6, 1.8, TZ + 5.0], [BX - 0.45, 1.2, TZ + 2.8], 44)],
  egypt: [K(700, [SX + 32.6, 0.55, -52.8], [SX + 30.5, 1.7, -60], 50), K(723, [SX + 32.3, 0.65, -53.4], [SX + 30.5, 1.7, -60], 48, 'easeOut')],
  alex: [K(724, [AX - 10, 72, -250], [PH[0], 52, PH[1]], 46), K(803, [AX + 4, 7.5, 62], [AX, 3.2, STOA_Z], 50, 'smooth', [[AX - 50, 62, -180], [AX - 20, 40, -90], [AX + 6, 22, 10]])],
  kings: [K(804, [AX - 2.9, 1.5, STOA_Z + 11.9], [AX + 0.2, 1.4, STOA_Z + 3.5], 42), K(862, [AX - 2.4, 1.65, STOA_Z + 11.2], [AX + 0.2, 1.4, STOA_Z + 3.5], 41)],
  born: [K(863, [NURS[0] - 0.2, 1.3, NURS[1] + 3.5], [NURS[0], 0.7, NURS[1] + 0.2], 40), K(937, [NURS[0] - 0.1, 1.15, NURS[1] + 3.0], [NURS[0], 0.65, NURS[1] + 0.2], 40)],
  busts: [K(938, [AX - 17.5, 1.75, STOA_Z + 7.4], [AX - 7, 1.45, STOA_Z + 4.5], 40), K(1008, [AX + 1.5, 1.8, STOA_Z + 7.6], [AX + 12, 1.45, STOA_Z + 4.5], 40, 'smooth'), K(1032, [AX + 15.4, 1.45, STOA_Z + 9.1], [AX + 15.5, 1.0, STOA_Z + 4.6], 40, 'easeOut')],
  learn: [K(1033, [LIB[0] + 0.8, 1.5, LIB[1] + 6.7], [LIB[0] + 0.75, 1.15, LIB[1] + 1.2], 46), K(1076, [LIB[0] + 0.75, 1.5, LIB[1] + 6.4], [LIB[0] + 0.75, 1.15, LIB[1] + 1.2], 45, 'easeOut')],
  dress: [K(1077, [0, 1.5, -11.9], [0, 1.25, -15.5], 40), K(1124, [0, 1.5, -11.9], [0, 1.25, -15.5], 40)],
  isis: [K(1125, [PY[0] + 0.3, 0.9, PY[1] + 10.2], [PY[0], 1.8, PY[1] + 3.0], 46), K(1178, [PY[0] + 0.2, 1.5, PY[1] + 9.6], [PY[0], 1.8, PY[1] + 3.0], 44, 'easeOut')],
  speech: [K(1179, [PY[0] + 0.8, 1.5, PY[1] + 13.4], [PY[0], 6.0, PY[1]], 50), K(1214, [PY[0] + 0.3, 1.8, PY[1] + 12.6], [PY[0], 6.3, PY[1]], 48)],
  speech2: [K(1215, [PY[0] + 0.5, 9.4, PY[1] + 7.0], [PY[0] + 0.15, 9.35, PY[1] + 2.0], 40), K(1255, [PY[0] + 0.35, 9.4, PY[1] + 6.6], [PY[0] + 0.15, 9.35, PY[1] + 2.0], 39)],
  born2: [K(1256, [AX + 40, 80, 150], [AX, 0, 30], 46), K(1317, [AX + 22, 46, 110], [AX, 4, 30], 44, 'easeOut')],
  ruler: [K(1318, [-1.2, 2.5, -14.6], [0, 2.8, -19.9], 38), K(1392, [-0.5, 2.6, -15.4], [0, 2.85, -19.9], 35)],
  blood: [K(1393, [0.3, 3.12, -15.5], [0, 3.0, -19.9], 30), K(1420, [0.06, 3.1, -15.9], [0, 3.0, -19.9], 29), K(1437, [0.0, 3.3, -16.2], [0, 10.4, -15.6], 44, 'easeIn')],
  maced: [K(1438, [BX + 0.9, 1.0, 6.4], [BX + 0.5, 1.35, 0], 44), K(1481, [BX + 0.4, 2.2, 7.6], [BX + 0.6, 2.3, -4], 50, 'easeOut')],
  aisle: [K(1482, [0.35, 1.65, -5.0], [0, 1.3, -11], 40), K(1518, [0.35, 1.65, -3.0], [0, 1.3, -9], 40, 'linear')],
  throne: [K(1519, [1.6, 2.5, -15.4], [0, 2.8, -19.9], 36), K(1625, [0.0, 8.6, 5.0], [0, 3.0, -19.5], 46, 'smooth', [[2.4, 3.8, -11], [1.2, 6.4, -3]])],
  split: [K(1626, [SX, 0.35, 3.0], [SX, 1.7, -6], 48), K(1700, [SX, 1.6, 2.2], [SX, 1.35, -6], 46, 'easeOut'), K(1799, [SX, 1.55, 0.9], [SX, 1.3, -6], 48)],
};
const KICKS = [{ f: 126, a: 0.06 }, { f: 588, a: 0.03 }, { f: 602, a: 0.03 }, { f: 616, a: 0.03 }, { f: 630, a: 0.04 }, { f: 703, a: 0.07 }, { f: 1299, a: 0.03 }, { f: 1362, a: 0.03 }, { f: 1440, a: 0.05 }];
EZ.linear = (t) => clamp(t);
export const camAt = (f) => {
  const S = shotAt(f);
  let c;
  if (S.id === 'dress') { // full 360 orbit around her while she changes
    const t = EZ.smooth(ramp(f, 1077, 1122)), a = t * Math.PI * 2, r = 2.8;
    c = { pos: [Math.sin(a) * r, 1.35 + 0.2 * Math.sin(t * Math.PI), -14.8 + Math.cos(a) * r], look: [0, 1.12, -14.8], fov: 60, roll: 6 * Math.sin(t * Math.PI) };
  } else c = camFromKeys(CAMS[S.id], f, { creep: 0.0004, kicks: KICKS });
  c.flash = 0;
  const flashAt = (a, n, k) => { if (f >= a && f < a + n) c.flash = Math.max(c.flash, (1 - (f - a) / n) * k); };
  flashAt(98, 6, 0.55); flashAt(358, 6, 0.9); flashAt(700, 5, 0.6); flashAt(863, 5, 0.5); flashAt(1100, 6, 0.6); flashAt(1125, 4, 0.4); flashAt(1438, 6, 0.8); flashAt(1626, 6, 0.6);
  if (S.id === 'rewind') c.flash = Math.max(c.flash, 0.9 * smooth(ramp(f, 345, 357)));
  if (S.id === 'blood') c.flash = Math.max(c.flash, 0.7 * smooth(ramp(f, 1430, 1437)));
  if (S.id === 'riders') { c.look = [c.look[0], c.look[1] + Math.sin(f * 0.9) * 0.02, c.look[2]]; }
  const set = { hall: [0, 0, -10], tent: [BX, 0, TZ], sunset: [BX, 0, 0], egypt: [PY[0], 0, PY[1]], day: [AX, 0, STOA_Z], night: [NURS[0], 0, NURS[1]], lib: [LIB[0], 0, LIB[1]], split: [SX, 0, -6] };
  // handheld drift: a slow, small wander of the aim point (scaled by distance) so no frame is ever locked off
  { const d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]) * 0.0045;
    c.look = [c.look[0] + d * Math.sin(f * 0.047 + 1.3), c.look[1] + d * 0.8 * Math.sin(f * 0.061), c.look[2] + d * Math.sin(f * 0.039 + 2.1)]; }
  c.shadowAt = set[S.light];
  if (S.id === 'egypt') c.shadowAt = [SX + 30, 0, -60];
  if (S.id === 'alex' || S.id === 'born2') c.shadowAt = [AX, 0, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const FOCUS = {
  eye: [0, 3.0, -19.9], spin: [0, 2.8, -19.9], coin: [0, 0.1, -12], picture: [0, 2.8, -19.9], collar: [0, 2.6, -19.9], cobra: [0, 3.17, -19.9],
  macedonia: [BX - 0.7, CAKE_TOP, TZ - 0.75], battle: [BX, 1.5, 1.5], dies: [BX + 2.2, 1.6, 1.0], grab: [BX - 0.4, 1.5, TZ + 2.6], egypt: [SX + 30.6, 1.5, -59.4],
  born: [NURS[0], 0.8, NURS[1] + 0.2], learn: [LIB[0] + 0.75, 1.3, LIB[1] + 1.2], dress: [0, 1.3, -14.8], isis: [PY[0], 1.6, PY[1] + 3.0], speech2: [PY[0], 9.1, PY[1] + 2.0],
  ruler: [0, 2.6, -19.9], blood: [0, 2.9, -19.9], maced: [BX + 0.5, 1.5, 1.0], aisle: null, kings: null, split: [SX, 1.3, -6],
};
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'aisle') { const z = cleoAisleZ(f); return { focus: dist(C.pos, [0, 1.4, z]), cinf: 7 }; }
  if (S.id === 'busts') return f < 1008 ? { focus: 5.5, cinf: 4 } : { focus: 4.5, cinf: 6 };
  if (S.id === 'cake') { const t = ramp(f, 567, 639); return { focus: lerp(1.6, 7.0, t), cinf: 6 }; }
  const p = FOCUS[S.id]; if (p) return { focus: dist(C.pos, p), cinf: S.macro ? 9 : 7 };
  return { focus: 20, cinf: 0 };
};

// ---------- world state ----------
const chopF = [584, 598, 612, 626], chopA = [80, 170, 260, 330];
export const worldAt = (f) => {
  const S = shotAt(f), W = { lights: [] };
  if (S.light === 'hall') W.lights = HALL_LIGHTS.map(([x, y, z, i]) => [x, y, z, i * (S.id === 'throne' ? 1 + 0.6 * smooth(ramp(f, 1560, 1600)) : 1), '#ff9a4a', 16]);
  if (S.light === 'tent') W.lights = [[BX, 3.2, TZ + 1.5, 3.0, '#ffb060', 18], [BX - 4, 1.8, TZ - 3, 2.4, '#ff9a4a', 12], [BX + 4, 1.8, TZ - 3, 2.4, '#ff9a4a', 12]];
  if (S.light === 'night') W.lights = [[NURS[0] + 1.6, 1.4, NURS[1] + 0.6, 3.0, '#ffb45c', 10], [NURS[0] - 0.4, 2.2, NURS[1] + 2.5, 1.0, '#9fb4ff', 8]];
  if (S.light === 'lib') W.lights = [[LIB[0], 3, LIB[1] + 2, 1.2, '#ffe0b0', 14]];
  // the empire cake: chops, then the pieces drift apart; Ptolemy drags Egypt to himself
  const done = chopF.filter((c) => f >= c + 3).length;
  if (S.id === 'cake' || S.id === 'grab') {
    const sp = S.id === 'grab' ? 0.42 : 0.05 * done + 0.3 * EZ.easeOut(ramp(f, 628, 639));
    W.cake = { spread: [sp, sp, sp, sp], lift: [0, 0, 0, 0] };
    if (S.id === 'grab') { const t = EZ.back(ramp(f, 650, 672), 1.2); W.cake.egypt = [-0.1 * t, 0.75 * t]; W.cake.lift = [0.12 * clamp(t * 3), 0, 0, 0]; }
    if (S.id === 'cake' && f >= 578) { // knife: hover to the next cut line, chop down, lift
      const k = Math.min(3, chopF.findIndex((c) => f < c + 8) < 0 ? 3 : chopF.findIndex((c) => f < c + 8)), c0 = chopF[k], a = chopA[k] * Math.PI / 180;
      const d = f - c0, y = d < -4 ? 1.9 : d < 0 ? lerp(1.9, 2.05, (d + 4) / 4) : d < 3 ? lerp(2.05, 0.82, EZ.easeIn(d / 3)) : d < 8 ? lerp(0.82, 1.9, EZ.smooth((d - 3) / 5)) : 1.9;
      W.knife = { x: Math.cos(a) * 0.75, y, z: Math.sin(a) * 0.75, ry: Math.PI / 2 - a, rz: 0.08 };
    }
  }
  if (S.id === 'coin') { const t = ramp(f, 118, 126), land = f >= 126, b = land ? Math.abs(Math.sin((f - 126) * 0.6)) * 0.12 * Math.exp(-(f - 126) * 0.25) : 0;
    W.coin = { x: 0, y: land ? 0.07 + b : lerp(2.4, 0.07, EZ.easeIn(t)), z: -12, rx: land ? Math.sin((f - 126) * 0.9) * 0.06 * Math.exp(-(f - 126) * 0.2) : (1 - t) * Math.PI * 3, ry: Math.PI / 2, rz: 0, s: 0.72 }; }
  if (S.id === 'dies') W.stdFall = 1.4 * EZ.easeIn(ramp(f, 532, 556));
  if (S.id === 'egypt') W.land = f < 702 ? lerp(4, 0, EZ.easeIn(ramp(f, 698, 702))) : 0;
  else W.land = 0;
  return W;
};

// ---------- actors ----------
const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
// micro-animation (v2): eye darts every 1.5-2.7 s (3-frame glide), on top of the idle sway/bob and blinks
const hash = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const saccade = (f, seed) => { const per = 46 + (seed * 29) % 37, g = f + seed * 17, k = Math.floor(g / per), ph = g - k * per;
  return lerp((hash(k - 1 + seed * 101) - 0.5) * 0.5, (hash(k + seed * 101) - 0.5) * 0.5, clamp(ph / 3)); };
const LIFE = (f, seed, o) => { const I = idle(f, seed); return { tilt: q(I.tilt, 1), headTilt: q(I.headTilt, 1), bob: q(I.bob + (o.step ? Math.abs(Math.sin(o.step * Math.PI * 2)) * 0.012 : 0), 3), ...o,
  look: q((o.look ?? 0) + (o.fixLook ? 0 : saccade(f, seed)), 2) }; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], check: true, ...extra });
const CARD = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, ...extra });
const TINT = { hall: '#fff8f0', tent: '#fff4e8', sunset: '#ffe8d0', day: '#ffffff', night: '#dfe4ff', lib: '#fff6ea', egypt: '#fffaf0', split: '#fff4e2' };
const hop = (f, f0, h = 0.12) => { const t = (f - f0) / 8; return t < 0 || t > 1 ? { dy: 0, sq: 1 } : { dy: h * Math.sin(t * Math.PI), sq: 1 + 0.07 * Math.sin(t * Math.PI * 2) }; };
// lip flap (mouth only) while Cleopatra addresses the crowd
const LINES = [[1188 / 30, 1250 / 30]];
const flap = (f, base) => { const t = f / 30; if (!LINES.some(([a, b]) => t >= a && t <= b)) return base; const k = Math.floor(f / 4); return ((k * 7919) % 5) < 3 ? base + '_o' : base; };
// identity flip: card squashes to a sliver and back (a coin-like spin), the costume swaps at the sliver
const spinAt = (f, f0, n = 10) => { const t = (f - f0) / n; if (t <= 0) return { sx: 1, swapped: false }; if (t >= 1) return { sx: 1, swapped: true }; return { sx: Math.max(0.04, Math.abs(Math.cos(t * Math.PI))), swapped: t > 0.5 }; };
// the court: Greeks and Egyptians side by side (the Ptolemaic court had both)
const COURT = [];
{ const who = ['egyptA', 'greekA', 'priest', 'egyptB', 'greekB', 'egyptA', 'priest', 'greekA', 'egyptB', 'egyptA', 'greekB', 'priest'];
  let i = 0; for (const z of [-14.2, -10.6, -7.0]) for (const x of [-1.85, -3.05, 1.85, 3.05]) { COURT.push({ who: who[i], seed: 30 + i, pos: [x + (i % 3) * 0.08, 0, z + (x > 0 ? 0.4 : 0)], row: Math.round((z + 14.2) / 3.6) }); i++; } }
const cleoAisleZ = (f) => lerp(-12.6, -8.4, ramp(f, 1482, 1518));

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  const man = (who, seed, o, pos, extra = {}) => { const H = extra.hop || { dy: 0, sq: 1 }; out.push(R(T, who, LIFE(f, seed, { seed, blink: blinkAt(f, seed), ...o }), [pos[0], pos[1] + H.dy, pos[2]], { tint, ...extra, s: (extra.s || 1) * H.sq, sy: q(1 + 0.014 * Math.sin(f * 0.11 + seed * 1.7), 3), hop: undefined })); };
  // courtiers live between bows: glance at a neighbour, whisper, fold or rest their hands (cycle per seed)
  const mood = (seed) => { const per = 64 + (seed * 13) % 30, k = Math.floor((f + seed * 37) / per); return Math.floor(hash(k + seed * 7) * 5); };
  const court = (bowFn, exprFn) => COURT.forEach((c, i) => { const b = bowFn ? q(bowFn(c, i), 1) : 0, m = mood(c.seed), side = c.pos[0] > 0 ? -1 : 1;
    const idleO = m === 1 ? { look: side * 0.9, headTilt: side * 4 } : m === 2 ? { expr: (Math.floor(f / 4) + c.seed) % 3 ? 'neutral_o' : 'neutral', look: -side * 0.8, headTilt: -side * 5 } : m === 3 ? { L: 'cross', R: 'cross' } : m === 4 ? { L: 'belly', R: 'belly', expr: 'grin' } : {};
    man(c.who, c.seed, { expr: b > 0.3 ? 'relief' : (exprFn ? exprFn(c, i) : 'neutral'), L: b > 0.2 ? 'belly' : 'hang', R: b > 0.2 ? 'belly' : 'hang', look: side * 0.5, ...(b > 0.2 ? {} : idleO), bow: b, blink: b > 0.3 ? 1 : blinkAt(f, c.seed) }, c.pos, { check: false }); });
  const statues = () => { for (const sx of [-1, 1]) out.push(R(T, 'egyptA', { seed: 50, expr: 'stern', blink: 0, L: 'cross', R: 'cross' }, [sx * 3.4, 1.2, -21.6], { tint: '#f2b640', s: 2.3, check: false, blob: false })); };
  const queen = (o, look = 'cleoEgypt', pos = THR, extra = {}) => man(look, 21, { expr: 'neutral', ...o }, pos, { s: pos === THR ? QS : 1.12, ...extra });
  switch (S.id) {
    case 'eye': queen({ expr: f > 22 ? 'smug' : 'calm', look: q(lerp(-0.4, 0.15, smooth(ramp(f, 4, 26))), 2), blink: f > 30 && f < 34 ? 1 : 0 }, 'cleoEgypt', THR, { check: false }); break;
    case 'hall': queen({ expr: 'smug' }); court((c) => smooth(ramp(f, 48 + c.row * 4, 60 + c.row * 4))); statues(); break;
    case 'spin': { const sp = spinAt(f, 93, 10); queen({ expr: sp.swapped ? 'grin' : 'smug', look: sp.swapped ? 0.2 : 0 }, sp.swapped ? 'cleoGreek' : 'cleoEgypt', THR, { sx: sp.sx }); statues(); break; }
    case 'coin': break;
    case 'picture': queen({ expr: 'relief', headTilt: -3 }); statues(); break;
    case 'collar': case 'cobra': queen({ expr: 'smug', look: 0.2 }, 'cleoEgypt', THR, { check: false }); break;
    case 'bow': queen({ expr: 'relief' }); court((c) => smooth(ramp(f, 240 + (2 - c.row) * 5 + (Math.abs(c.pos[0]) > 2.5 ? 2 : 0), 250 + (2 - c.row) * 5))); statues(); break;
    case 'rewind': queen({ expr: 'smug' }); court((c) => 1 - smooth(ramp(f, 290 + c.row * 3, 305 + c.row * 3))); statues(); break;
    case 'macedonia': break;
    case 'battle': {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) { const x = BX - 4.2 + i * 1.4 + r * 0.7, z = -2.2 - r * 1.5; man('hoplite', 60 + r * 7 + i, { expr: 'stern', L: 'shield', R: 'spear', step: q((f * 0.045 + i * 0.13 + r * 0.5) % 1), look: 0 }, [x, 0, z], { check: false }); }
      man('ptolemy', 11, { expr: f > 440 ? 'grin' : 'stern', look: f > 440 ? 0.3 : -0.6, L: 'hip', R: f > 454 ? 'thumb' : 'hip' }, [BX + 0.1, 0, 1.5], f > 440 && f < 452 ? { hop: hop(f, 441, 0.08) } : {});
      break;
    }
    case 'riders': {
      const x0 = lerp(BX - 6.4, BX + 5.0, ramp(f, 471, 525)), st = (f * 0.07) % 1;
      const rider = (who, seed, o, hx, hz, horseArgs) => { const ph = q((st + (seed % 2) * 0.33) % 1, 2), bob = Math.sin(ph * Math.PI * 4) * 0.045;
        out.push(CARD('horse' + seed + ph, (p) => T.horse(p, ph, ...horseArgs), [hx, 0, hz], 2.0, { tint, check: true }));
        out.push(R(T, who, LIFE(f, seed, { seed, blink: blinkAt(f, seed), facing: 1, ...o }), [hx - 0.15, 1.25 + bob, hz - 0.06], { tint, check: true, blob: false })); };
      rider('alexander', 7, { expr: 'grin', look: 0.6, L: 'hang', R: 'up' }, x0 - 0.5, 2.8, ['#2b2226', '#b8322f', '#111', true]);
      rider('ptolemy', 11, { expr: 'grin', look: 0.6, L: 'hang', R: 'hang' }, x0 + 0.55, 4.6, ['#8a5a3a', '#6b2f7a', '#2a1d14', false]);
      break;
    }
    case 'dies': {
      const t = smooth(ramp(f, 538, 552));
      if (t < 1) man('alexander', 7, { expr: f > 530 ? 'relief' : 'grin', look: 0.2, blink: f > 534 ? 1 : 0 }, [BX + 2.2, 0, 1.0], { alpha: 1 - t });
      if (t > 0) out.push(R(T, 'alexStone', { seed: 7, expr: 'relief', blink: 1 }, [BX + 2.2, 0, 1.0], { tint, alpha: t }));
      break;
    }
    case 'cake': case 'grab': {
      const grab = S.id === 'grab', pull = EZ.back(ramp(f, 650, 672), 1.2);
      man('ptolemy', 11, { expr: grab ? (f > 662 ? 'laugh' : 'grin') : 'grin', look: grab ? -0.5 : 0, L: grab ? 'reach' : 'hip', R: 'hip', lift: grab ? 0.2 - 0.2 * pull : 0 }, [BX - 0.4, 0, TZ + 2.95], { check: grab });
      man('greekA', 12, { expr: grab && f > 660 ? 'shock' : 'stern', look: 0.5, L: grab ? 'cheek' : 'hang', R: grab ? 'cheek' : 'hang' }, [BX - 2.6, 0, TZ + 0.5], { check: false });
      man('hoplite', 13, { expr: grab && f > 660 ? 'shock' : 'grin', look: -0.5, L: 'hang', R: 'hang' }, [BX + 2.6, 0, TZ + 0.3], { check: false });
      man('greekB', 14, { expr: grab && f > 664 ? 'nervous' : 'neutral', look: 0.2 }, [BX + 0.4, 0, TZ - 2.6], { check: false });
      break;
    }
    case 'egypt': man('ptolemy', 11, { expr: 'grin', look: -0.4, L: 'reach', R: 'hip' }, [SX + 30.9, 0, -59.3], f > 702 && f < 712 ? { hop: hop(f, 703, 0.1) } : {}); break;
    case 'kings': {
      const sashes = ['#6b2f7a', '#3f6fb0', '#b8322f', '#2f8a5a', '#c48a22', '#6b2f7a'];
      for (let i = 0; i < 6; i++) { const x = AX - 1.9 + i * 1.3; man({ ...{}, tunic: '#f1ead8', dress: '#ece2cc', skin: ['#e2b48c', '#e8bf98', '#d9a57a'][i % 3], greekHair: ['#3a2414', '#4a2c1a', '#2a1d14'][i % 3], crown: 'diadem', sash: sashes[i], beard: i % 3 === 1 ? '#3a2414' : undefined },
        80 + i, { expr: 'grin', look: i % 2 ? 0.3 : -0.3, L: i % 2 ? 'wave' : 'hang', wv: f * 0.3 + i }, [x, 0, STOA_Z + 7.5 - i * 1.7], { check: false }); }
      break;
    }
    case 'born': {
      out.push(CARD('cradle' + q(((f - 863) / 60) % 1, 2), (p) => T.cradle(p, ((f - 863) / 60) % 1), [NURS[0], 0.0, NURS[1] + 0.2], 0.95, { tint, check: true }));
      man('ptolemyKing', 15, { expr: 'relief', look: 0.6, facing: 1, L: 'cross', R: 'cross' }, [NURS[0] - 1.25, 0, NURS[1] - 0.4], { check: false });
      break;
    }
    case 'busts': {
      for (let i = 0; i < 7; i++) out.push(CARD('bust' + i, (p) => T.bust(p, i, true), [AX - 13.5 + i * 4.5, 1.26, STOA_Z + 4.5], 0.62, { tint, check: false, blob: false }));
      if (f >= 1002) { const w = EZ.easeOut(ramp(f, 1002, 1018)); man('cleoTeen', 22, { expr: f > 1015 ? 'smug' : 'calm', look: -0.3, L: 'belly', R: 'belly', step: w < 1 ? q((f * 0.05) % 1) : 0 }, [AX + 15.5 + (1 - w) * 2.2, 0, STOA_Z + 4.6], { s: 0.92 }); } // walks into the gallery's end
      break;
    }
    case 'learn': {
      const said = f > 1040;
      man('cleoGreek', 21, { expr: said ? (f > 1058 ? 'grin' : 'calm_o') : 'calm', look: 0.6, L: 'belly', R: 'belly' }, [LIB[0] + 0.15, 0, LIB[1] + 1.15]);
      out.push(FX('lscr', (p) => T.scroll(p, 1), [LIB[0] + 0.15, 0.42, LIB[1] + 1.3], 0.4, { order: 4 }));
      man('priest', 41, { expr: f > 1052 ? 'shock' : 'neutral', look: -0.6, L: f > 1052 ? 'cheek' : 'hang', R: f > 1052 ? 'cheek' : 'hang' }, [LIB[0] + 1.35, 0, LIB[1] + 1.35], f > 1052 && f < 1062 ? { hop: hop(f, 1053, 0.14) } : {});
      break;
    }
    case 'dress': { const sp = spinAt(f, 1095, 10); queen({ expr: sp.swapped ? 'smug' : 'calm', look: 0 }, sp.swapped ? 'cleoEgypt' : 'cleoGreek', [0, 0, -14.8], { sx: sp.sx }); statues(); break; }
    case 'isis': {
      queen({ expr: 'relief', L: 'up', R: 'up' }, 'cleoIsis', [PY[0], 0, PY[1] + 3.0]);
      for (const [dx, dz, w, sd] of [[-1.7, 1.6, 'priest', 42], [1.7, 1.6, 'priest', 43], [-2.9, 2.6, 'egyptA', 44], [2.9, 2.6, 'egyptB', 45]]) { const b = q(smooth(ramp(f, 1132 + Math.abs(dx) * 4, 1144 + Math.abs(dx) * 4)), 1); man(w, sd, { expr: 'relief', bow: b, blink: b > 0.3 ? 1 : 0, L: 'belly', R: 'belly' }, [PY[0] + dx, 0, PY[1] + 3.0 + dz], { check: false }); }
      break;
    }
    case 'speech': case 'speech2': {
      queen({ expr: flap(f, 'grin'), look: 0.0, L: 'wave', wv: f * 0.25, R: 'hang' }, 'cleoEgypt', [PY[0], 7.9, PY[1] + 2.05], { blob: false, check: S.id === 'speech2' });
      if (S.id === 'speech') for (let i = 0; i < 14; i++) { const x = PY[0] - 4.6 + (i % 7) * 1.5 + (i > 6 ? 0.75 : 0), z = PY[1] + 6 + Math.floor(i / 7) * 1.8, cheer = (f + i * 7) % 28 < 9;
        man(['egyptA', 'egyptB', 'priest', 'egyptB'][i % 4], 90 + i, { expr: cheer ? 'laugh' : 'grin', L: cheer ? 'up' : 'hang', R: cheer ? 'up' : 'hang', look: 0 }, [x, 0, z], { check: false, ...(cheer ? { hop: hop(f, f - ((f + i * 7) % 28), 0.12) } : {}) }); }
      break;
    }
    case 'ruler': queen({ expr: f > 1362 ? 'grin' : 'smug', headTilt: q(f > 1362 && f < 1376 ? 6 * Math.sin((f - 1362) / 14 * Math.PI) : 0, 0), look: 0.1 }); statues(); break;
    case 'blood': queen({ expr: f > 1404 ? 'stern' : 'calm', look: f > 1404 ? -0.7 : 0 }); statues(); break;
    case 'maced': {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) man('hoplite', 60 + r * 7 + i, { expr: 'stern', L: 'shield', R: 'spear' }, [BX - 3.5 + i * 1.4 + r * 0.7, 0, -2.2 - r * 1.5], { check: false });
      man('ptolemy', 11, { expr: 'stern', look: 0, L: 'hip', R: 'hip' }, [BX + 0.5, 0, 1.0]);
      break;
    }
    case 'aisle': {
      const z = cleoAisleZ(f);
      queen({ expr: 'relief', step: q((f * 0.04) % 1), L: 'hang', R: 'hang' }, 'cleoEgypt', [0, 0, z]);
      court((c) => smooth(ramp(c.pos[2] - z, 3.2, 0.4)));
      break;
    }
    case 'throne': queen({ expr: f > 1585 ? 'grin' : 'relief', look: f > 1585 ? 0.15 : 0 }); court((c) => smooth(ramp(f, 1530 + (2 - c.row) * 6, 1544 + (2 - c.row) * 6))); statues(); break;
    case 'split': {
      const turn = f > 1708;
      man('cleoGreek', 22, { expr: turn ? 'grin' : 'stern', facing: turn ? 0 : 1, look: turn ? 0 : 0.8, L: turn ? 'hip' : 'hang', R: turn ? 'hip' : 'hang' }, [SX - 0.95, 0, -6], turn && f < 1720 ? { hop: hop(f, 1709, 0.1) } : {});
      man('cleoEgypt', 21, { expr: turn ? 'grin' : 'stern', facing: turn ? 0 : -1, look: turn ? 0 : -0.8, L: turn ? 'hip' : 'hang', R: turn ? 'hip' : 'hang' }, [SX + 0.95, 0, -6], turn && f < 1722 ? { hop: hop(f, 1711, 0.1) } : {});
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const FXc = (key, draw, c, s, extra = {}) => FX(key, draw, [c[0], c[1] - 1.069 * s, c[2]], s, extra); // centred on design (300,500)
const SKY_BIRDS = { battle: [BX - 6, 11, -26], riders: [BX + 2, 10, -24], dies: [BX + 4, 9, -18], maced: [BX - 3, 12, -24], kings: [AX - 3, 9.5, STOA_Z - 8],
  busts: [AX - 2, 10, STOA_Z - 6], egypt: [SX + 26, 12, -90], isis: [PY[0] - 2, 15, PY[1] - 8], speech: [PY[0] + 3, 17, PY[1] - 8], split: [SX - 4, 8.5, -32] };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  // hall: dust motes drifting through the light, embers rising off the braziers
  if (S.light === 'hall') {
    for (let i = 0; i < 16; i++) { const u = ((f * 0.0025 + hash(i) ) % 1); out.push(FX('mote', (p) => T.fxMote(p), [-3 + hash(i + 3) * 6 + Math.sin(f * 0.013 + i) * 0.3, 0.6 + u * 4.2, -19 + hash(i + 7) * 15], 0.045, { tint: '#ffe6b0', order: 4 })); }
    for (const [x, y, z] of BRAZ) for (let k = 0; k < 2; k++) { const u = (f * 0.03 + k * 0.5 + x) % 1; out.push(FX('ember', (p) => T.fxMote(p), [x + Math.sin(f * 0.2 + k * 3) * 0.12, y + 1.6 + u * 1.6, z + 0.05], 0.035 * (1 - u), { tint: '#ff9a3a', order: 4 })); }
  }
  // birds wheeling in the outdoor skies
  if (SKY_BIRDS[S.id]) { const [bx, by, bz] = SKY_BIRDS[S.id]; for (let i = 0; i < 5; i++) { const ph = q((f * 0.07 + i * 0.21) % 1, 1), a = f * 0.012 + i * 1.3;
    out.push(FX('bird' + ph, (p) => T.fxBird(p, ph), [bx + Math.cos(a) * (3 + i), by + (i % 3) * 0.8 + Math.sin(f * 0.05 + i) * 0.3, bz + Math.sin(a) * 2], 0.5, { order: 1 })); } }
  if (S.light === 'hall') for (const [x, y, z] of BRAZ) { const t = q((f * 0.04 + x) % 1, 2); out.push(FX('flame' + t, (p) => T.fxFlame(p, t * 6.283), [x, y + 1.42, z + 0.02], 0.42, { order: 3 })); }
  if (S.light === 'tent') for (const [x, z] of [[-4, -3], [4, -3]]) { const t = q((f * 0.04 + x) % 1, 2); out.push(FX('flame' + t, (p) => T.fxFlame(p, t * 6.283), [BX + x, 1.45, TZ + z + 0.02], 0.42, { order: 3 })); }
  const shine = (key, t, c, s, col) => out.push(FXc(key + q(t, 1), (p) => T.fxShine(p, t, col), c, s));
  const spark = (key, t, c, s) => out.push(FXc(key + q(t, 2), (p) => T.fxSpark(p, t), c, s));
  switch (S.id) {
    case 'eye': if (f > 14) spark('sp', ramp(f, 14, 34), [0, 3.42, -19.6], 0.2); break;
    case 'spin': if (f > 94 && f < 116) { const t = ramp(f, 94, 112); out.push(FXc('burst' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe9a0', 16, 60, 260); }, [0, 2.95, -20.3], 1.7, { order: 1 })); spark('spk', ramp(f, 97, 113), [0.1, 2.9, -19.6], 0.5); } break;
    case 'coin': if (f > 128) shine('cs', (f - 128) / 10, [-0.35, 0.3, -11.7], 0.22, '#fff3b0'); break;
    case 'collar': if (f > 176) shine('cl', (f - 176) / 12, [0.22, 2.6, -19.45], 0.2, '#fff3b0'); break;
    case 'cobra': if (f > 208) shine('cb', (f - 208) / 12, [0.0, 3.32, -19.45], 0.17, '#fff3b0'); break;
    case 'macedonia': { const t = EZ.back(ramp(f, 368, 380)); if (t > 0.01) out.push(FX('pin', (p) => T.fxPin(p), [BX + MAPPT.maced[0], CAKE_TOP, TZ + MAPPT.maced[1]], 0.3 * t, { order: 4 })); break; }
    case 'battle': for (let i = 0; i < 5; i++) { const k = q(((f * 0.02) + i * 0.2) % 1, 2); out.push(FXc('bd' + k, (p) => T.fxDust(p, k, '#f0c896'), [BX - 4 + i * 2, 0.3, -1.6], 0.8)); } break;
    case 'riders': { const x0 = lerp(BX - 6.4, BX + 5.0, ramp(f, 471, 525)); for (let i = 0; i < 4; i++) { const k = q(((f * 0.05) + i * 0.25) % 1, 2); out.push(FXc('rd' + k, (p) => T.fxDust(p, k, '#f0c896'), [x0 - 1.4 - k * 2.4, 0.35, 3.9 + (i % 2) * 0.9], 0.75)); } break; }
    case 'dies': if (f >= 538 && f < 566) { const k = q(ramp(f, 538, 566), 2); out.push(FXc('sd' + k, (p) => T.fxDust(p, k, '#d8d2c4'), [BX + 2.2, 0.35, 1.2], 0.55)); } break;
    case 'cake': for (const c of chopF) if (f >= c + 2 && f < c + 12) { const t = ramp(f, c + 2, c + 12), a = chopA[chopF.indexOf(c)] * Math.PI / 180; out.push(FXc('crumb' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe2b0', 10, 40, 200); }, [BX + Math.cos(a) * 0.9, CAKE_TOP + 0.15, TZ + Math.sin(a) * 0.9 + 0.1], 0.32)); } break;
    case 'grab': if (f > 664) shine('eg', (f - 664) / 12, [BX - 0.6, CAKE_TOP + 0.35, TZ + 1.5], 0.25, '#ffe680'); break;
    case 'egypt': if (f >= 702) { const k = q(ramp(f, 702, 723), 2); out.push(FXc('ld' + k, (p) => T.fxDust(p, k, '#f2d6a2'), [SX + 30, 0.6, -59.6], 1.3)); } break;
    case 'alex': { const t = q((f * 0.04) % 1, 2); out.push(FX('pf' + t, (p) => T.fxFlame(p, t * 6.283), [PH[0], 58.2, PH[1] + 3.5], 4.0, { order: 3 })); break; }
    case 'kings': for (let i = 0; i < 6; i++) { const f0 = 810 + i * 7, t = q(ramp(f, f0, f0 + 8), 2); if (f >= f0) out.push(FXc('kb' + i + t, (p) => T.bubble(p, 'greek', t, i % 2 ? 1 : -1), [AX - 1.9 + i * 1.3 + (i % 2 ? 0.45 : -0.45), 2.55, STOA_Z + 7.6 - i * 1.7], 0.42)); } break;
    case 'born': if (f > 900) spark('bs', ramp(f, 900, 926), [NURS[0] - 0.2, 1.0, NURS[1] + 0.35], 0.5); break;
    case 'busts': for (let i = 0; i < 7; i++) { const f0 = 944 + i * 8, t = q(ramp(f, f0, f0 + 7), 2); if (f >= f0) out.push(FXc('bq' + i + t, (p) => T.bubble(p, 'q', t, -1), [AX - 13.5 + i * 4.5 + 0.35, 2.6, STOA_Z + 4.6], 0.5)); }
      if (f > 1016) out.push(FX('tscr', (p) => T.scroll(p, clamp((f - 1016) / 8)), [AX + 15.5, 0.42, STOA_Z + 4.75], 0.4, { order: 4 })); break;
    case 'learn': if (f > 1040) { const t = q(ramp(f, 1040, 1048), 2); out.push(FXc('lb' + t, (p) => T.bubble(p, 'glyph', t, -1), [LIB[0] + 0.65, 2.35, LIB[1] + 1.2], 0.55)); } break;
    case 'dress': if (f > 1094 && f < 1116) { const t = ramp(f, 1094, 1112); spark('ds', t, [0, 1.5, -14.6], 0.7); out.push(FXc('db' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe9a0', 16, 60, 260); }, [0, 1.4, -15.1], 1.5, { order: 1 })); } break;
    case 'isis': { const t = q(((f - 1125) / 50) % 1, 2); out.push(FXc('ib' + t, (p) => { p.g.translate(50, 250); p.g.translate(250, 250); p.g.rotate(t * 0.6); p.g.translate(-250, -250); T.fxBurst(p, 1, '#ffe08a', 18, 80, 300); }, [PY[0], 2.4, PY[1] + 2.4], 2.2, { order: 1 })); if (f > 1130) spark('is', ramp(f, 1130, 1150), [PY[0], 2.45, PY[1] + 3.2], 0.45); break; }
    case 'speech': case 'speech2': { const t = q(ramp(f, S.id === 'speech' ? 1186 : 1218, S.id === 'speech' ? 1194 : 1226), 2); out.push(FXc('hb' + S.id + t, (p) => T.bubble(p, 'glyph', t, -1), S.id === 'speech' ? [PY[0] + 1.6, 10.6, PY[1] + 2.1] : [PY[0] + 0.5, 10.5, PY[1] + 2.1], S.id === 'speech' ? 1.2 : 0.5)); break; }
    case 'born2': { const t = EZ.back(ramp(f, 1262, 1276)); if (t > 0.01) out.push(FX('pin2', (p) => T.fxPin(p, '#2f8fb0'), [AX, 0, 30], 9 * t, { order: 4 })); break; }
    case 'ruler': if (f > 1364) shine('rs', (f - 1364) / 12, [0, 3.37, -19.45], 0.26, '#fff3b0'); break;
    case 'throne': if (f > 1575) for (let i = 0; i < 5; i++) spark('ts' + i, ((f - 1575) / 24 + i * 0.2) % 1, [(i - 2) * 1.6, 3.4 + (i % 2) * 1.5, -18.5 + (i % 3)], 0.5); break;
    case 'split': if (f > 1652) { const t = q(ramp(f, 1652, 1662), 2); out.push(FXc('sq' + t, (p) => T.bubble(p, 'q', t, 0), [SX, 2.85, -6], 0.75)); } break;
  }
  return out;
};
