// Cleopatra v4 — "The most famous Egyptian queen in history… was not Egyptian."  67.2 s, 30 fps, 9:16.
// voice.wav = vidIQ "Chris" (tighten.py). v4b: new hook + closing line spliced around the v4a middle, which moved exactly
// +64 frames (SHIFT) so its rendered frames are reused (middle shots keep their v4a seconds and add SHIFT).
// Transitions follow the @ricksclip references: no hard cuts — dissolves (D), whip pans (W), zoom-throughs (F).
import { M as EZ, camFromKeys, idle } from './motion.js';
export const FPS = 30, TOTAL = 2016, SHIFT = 64;
const s2f = (s) => Math.round(s * 30);
// [id, start s, light, transition in, flags]
const PLAN = [
  ['queen', 0.0, 'hall', null, { cu: true }], ['flip', 2.25, 'hall', 'W', { cu: true }], ['smug', 3.40, 'hall', 'F', { cu: true }],
  ['busts', 4.85, 'day', 'D'], ['dynasty', 6.40, 'hall', 'W', { cu: true }], ['bustsQ', 8.70, 'day', 'W'],
  ['farm', 9.50, 'farm', 'F', { cu: true }], ['enter', 11.35, 'hall', 'D'], ['translator', 13.35, 'hall', 'W', { cu: true }], ['shock', 15.0, 'hall', 'W', { macro: true }],
  ['how', 16.2, 'dusk', 'F'],
  ['stolen', 17.4, 'road', 'D'], ['coffin', 19.25, 'road', 'F', { macro: true }], ['hijack', 20.85, 'road', 'W'], ['chase', 23.8, 'road', 'W'],
  ['trophy', 26.65, 'egypt', 'D'], ['crown', 29.45, 'hall', 'F', { cu: true }],
  ['alex', 31.0, 'day', 'D'], ['kings', 33.95, 'day', 'W'], ['wedding', 34.75, 'hall', 'W'], ['banquet', 36.15, 'hall', 'W'],
  ['landlord', 38.05, 'apt', 'D'], ['name', 41.6, 'apt', 'W'],
  ['born', 43.1, 'night', 'D'], ['homework', 45.0, 'lib', 'F', { cu: true }], ['learns', 46.45, 'lib', 'W', { cu: true }],
  ['dress', 47.75, 'hall', 'F'], ['isis', 49.3, 'temple', 'F', { cu: true }], ['talk', 51.2, 'hall', 'D'],
  ['crowd', 53.6, 'egypt', 'F'], ['scribe', 54.9, 'tnight', 'D'], ['gold', 58.6, 'tnight', 'F'], ['loop', 63.1333, 'hall', 'D', { cu: true }],
];
const MID = new Set(['farm', 'enter', 'translator', 'shock', 'how', 'stolen', 'coffin', 'hijack', 'chase', 'trophy', 'crown', 'alex', 'kings', 'wedding', 'banquet', 'landlord', 'name', 'born', 'homework', 'learns', 'dress', 'isis', 'talk', 'crowd', 'scribe', 'gold']);
const startF = ([id, s]) => s2f(s) + (MID.has(id) ? SHIFT : 0);
export const SHOTS = PLAN.map((p, i) => { const [id, , light, tin, fl] = p; return { id, a: startF(p), b: (i + 1 < PLAN.length ? startF(PLAN[i + 1]) : TOTAL) - 1, light, tin, ...(fl || {}) }; });
let FORCE = null;
export const setForce = (s) => { FORCE = s; };
export const shotAt = (f) => FORCE || SHOTS.find((s) => f >= s.a && f < s.b + 1) || SHOTS[SHOTS.length - 1];
const TLEN = { D: 7, W: 8, F: 9 }, TMODE = { D: 1, W: 2, F: 3 };
export const transAt = (f) => { const i = SHOTS.findIndex((s) => f >= s.a && f < s.b + 1); if (i <= 0) return null; const S = SHOTS[i]; if (!S.tin) return null;
  const n = (S.id === 'stolen' || S.id === 'scribe') ? 12 : TLEN[S.tin], d = f - S.a; if (d >= n) return null;
  return { prev: SHOTS[i - 1], mode: TMODE[S.tin], t: (d + 1) / (n + 1), dir: i % 2 ? 1 : -1 }; };
const SH = Object.fromEntries(SHOTS.map((s) => [s.id, s]));
const A = (id) => SH[id] ? SH[id].a : -1e6, B = (id) => SH[id] ? SH[id].b : -1e6; // desk/card (v4a hook) are unused now

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
const hexLerp = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(lerp(v, y[i], t)).toString(16).padStart(2, '0')).join(''); };
const lerpL = (L1, L2, t) => { const o = { ...L1 }; for (const k of Object.keys(L2)) { const a = L1[k], b = L2[k]; if (typeof a === 'number' && typeof b === 'number') o[k] = lerp(a, b, t); else if (typeof a === 'string' && typeof b === 'string' && a[0] === '#' && b[0] === '#') o[k] = hexLerp(a, b, t); else o[k] = t < 0.5 ? a : b; } return o; };

// ---------- set coordinates (mirror main.js / sets4.js) ----------
const AX = 2000, SX = 3000, STOA_Z = 18, NURS = [AX - 40, 70], LIB = [AX + 40, 70], PY = [SX + 16, -34], PH = [AX - 35, -150];
const FARM = 4000, ROAD = 5000, APT = 6000, TX = 7000;
const THR = [0, 1.05, -19.7], SIT = { sit: 838, L: 'rest', R: 'rest', rest: [212, 486] }, QS = 1.3;
const BRAZ = [[-2.5, 0, -12.4], [2.5, 0, -12.4], [-2.6, 1.2, -18.4], [2.6, 1.2, -18.4], [-2.5, 0, -4], [2.5, 0, -4]];
const HALL_LIGHTS = [[-2.5, 2.2, -12.4, 3.2], [2.5, 2.2, -12.4, 3.2], [0, 3.4, -18.0, 3.6], [0, 2.4, -4, 2.6]];
const DESK = [LIB[0], 0, LIB[1] - 0.75];   // Cleopatra behind the study desk (desk top 1.06 m at z LIB+0.2)

// ---------- lights: warm key + cool fill, saturated (references: bright day, vivid blue nights) ----------
const HALL = { az: 82, el: 20, sky: '#fff0dc', ground: '#5a5488', hemi: 1.15, sun: '#ffcf94', sunI: 2.6, fog: '#3a3354', fogNear: 35, fogFar: 320,
  skyTop: '#3a5aa8', skyHor: '#ffc890', sunDisc: '#fff2cc', sunSize: 0.004, sat: 1.18, gain: '#fff8f0', vig: 0.34, shadowExt: 26, bloom: 0.85 };
const NIGHT_ROAD = { az: 200, el: 38, sky: '#7a96f0', ground: '#2a3678', hemi: 0.95, sun: '#a8c0ff', sunI: 1.15, fog: '#1d2a66', fogNear: 30, fogFar: 380,
  skyTop: '#0b1f5e', skyHor: '#3d6bd0', sat: 1.25, gain: '#e8eeff', vig: 0.36, shadowExt: 18, night: true, bloom: 1.25 };
const DAWN = { az: 262, el: 8, sky: '#ffc8b0', ground: '#7a5a60', hemi: 1.3, sun: '#ffa868', sunI: 2.9, fog: '#f7a878', fogNear: 60, fogFar: 700,
  skyTop: '#5a58b8', skyHor: '#ffb070', sunDisc: '#fff0c0', sunSize: 0.008, sat: 1.25, gain: '#ffffff', vig: 0.26, shadowExt: 22, bloom: 1.2 };
export const LIGHTS = {
  hall: HALL,
  day: { az: 150, el: 38, sky: '#bcd4ff', ground: '#a0784c', hemi: 1.05, sun: '#ffe6bc', sunI: 2.2, fog: '#cfe0f4', fogNear: 120, fogFar: 1100,
    skyTop: '#2a74e0', skyHor: '#bfe0ff', sat: 1.25, gain: '#ffffff', vig: 0.2, shadowExt: 30, bloom: 0.7 },
  egypt: { az: 120, el: 34, sky: '#d6e4ff', ground: '#c09a62', hemi: 1.3, sun: '#ffe8bc', sunI: 2.7, fog: '#f2dcb0', fogNear: 120, fogFar: 900,
    skyTop: '#2f7ee0', skyHor: '#ffe6b8', sunDisc: '#fff6d8', sunSize: 0.004, sat: 1.25, gain: '#ffffff', vig: 0.22, shadowExt: 26, bloom: 0.85 },
  farm: { az: 245, el: 12, sky: '#ffd9b8', ground: '#6a7a40', hemi: 1.3, sun: '#ffb070', sunI: 3.0, fog: '#ffc79a', fogNear: 60, fogFar: 700,
    skyTop: '#4f78d8', skyHor: '#ffc48a', sunDisc: '#fff2c8', sunSize: 0.007, sat: 1.28, gain: '#ffffff', vig: 0.24, shadowExt: 22, bloom: 1.15 },
  dusk: { az: 262, el: 7, sky: '#e0a8c8', ground: '#7a5a60', hemi: 1.25, sun: '#ff9858', sunI: 2.6, fog: '#e8907a', fogNear: 100, fogFar: 900,
    skyTop: '#3a3c9a', skyHor: '#ff9a62', sunDisc: '#fff0c0', sunSize: 0.008, sat: 1.25, gain: '#ffffff', vig: 0.28, shadowExt: 60, bloom: 1.2 },
  road: NIGHT_ROAD,
  apt: { az: 70, el: 60, sky: '#ffe6c0', ground: '#7a5a50', hemi: 1.35, sun: '#ffe0b0', sunI: 0.6, fog: '#5a4a48', fogNear: 18, fogFar: 90,
    skyTop: '#4a86d8', skyHor: '#ffdcb0', sat: 1.15, gain: '#fff4e4', vig: 0.36, shadowExt: 14, bloom: 0.9 },
  night: { az: 210, el: 40, sky: '#a8bcff', ground: '#5c6294', hemi: 1.6, sun: '#d4e0ff', sunI: 1.2, fog: '#24305e', fogNear: 30, fogFar: 300,
    skyTop: '#0f2a6e', skyHor: '#4a7fd0', sat: 1.2, gain: '#eef2ff', vig: 0.34, shadowExt: 12, night: true, bloom: 1.1 },
  lib: { az: 60, el: 40, sky: '#ffe2b8', ground: '#8a6a44', hemi: 1.4, sun: '#ffd49a', sunI: 2.3, fog: '#e8c8a0', fogNear: 40, fogFar: 300,
    skyTop: '#4a86d8', skyHor: '#ffdcb0', sat: 1.2, gain: '#fff6ea', vig: 0.3, shadowExt: 14, bloom: 0.9 },
  temple: { az: 110, el: 46, sky: '#d6e4ff', ground: '#c09a62', hemi: 1.3, sun: '#ffe8bc', sunI: 2.8, fog: '#f2dcb0', fogNear: 80, fogFar: 700,
    skyTop: '#2f7ee0', skyHor: '#ffe6b8', sat: 1.25, gain: '#ffffff', vig: 0.24, shadowExt: 26, bloom: 0.9 },
  tnight: { az: 160, el: 50, sky: '#7890f0', ground: '#202a6a', hemi: 0.72, sun: '#a8bcff', sunI: 0.65, fog: '#141d4e', fogNear: 30, fogFar: 260,
    skyTop: '#081650', skyHor: '#2f56b8', sat: 1.25, gain: '#e8eeff', vig: 0.4, shadowExt: 26, night: true, bloom: 1.3 },
};
export const lightFor = (S, f) => {
  let L = { ...LIGHTS[S.light] };
  if (S.id === 'chase') L = lerpL(NIGHT_ROAD, DAWN, smooth(ramp(f, A('chase') + 20, B('chase'))));
  if (S.id === 'homework') { const t = smooth(ramp(f, A('homework'), B('homework'))); L.sunI = lerp(2.3, 0.5, t); L.hemi = lerp(1.4, 1.15, t); L.gain = hexLerp('#fff6ea', '#dfe2ff', t); }
  if (S.id === 'gold') { const t = smooth(ramp(f, A('gold') + 10, A('gold') + 40)); L.bloom = lerp(1.2, 1.45, t); }
  if (S.id === 'shock') L.vig = 0.42;
  return L;
};

// ---------- cameras ----------
const K = (f, pos, look, fov, ease, path) => ({ f, pos, look, fov, ease, path });
const off = (id, df) => A(id) + df;
const CAMS = {
  queen: [K(A('queen'), [1.2, 0.9, -13.6], [0, 3.0, -19.9], 42), K(B('queen') + 9, [0.35, 1.6, -15.2], [0, 2.9, -19.9], 36, 'easeOut')],
  desk: [K(A('desk'), [DESK[0] + 0.5, 2.6, DESK[2] + 3.4], [DESK[0], 1.25, DESK[2] + 0.6], 44), K(B('desk') + 9, [DESK[0] + 0.15, 1.85, DESK[2] + 2.9], [DESK[0], 1.35, DESK[2] + 0.4], 40, 'easeOut')],
  card: [K(A('card'), [DESK[0] + 0.05, 1.55, DESK[2] + 1.5], [DESK[0] + 0.32, 1.38, DESK[2] + 0.55], 34), K(B('card') + 9, [DESK[0] + 0.12, 1.5, DESK[2] + 1.75], [DESK[0] + 0.2, 1.4, DESK[2] + 0.4], 40, 'easeOut')],
  flip: [K(A('flip'), [0.45, 3.1, -15.9], [0, 2.95, -19.9], 30), K(B('flip') + 9, [0.12, 3.05, -16.4], [0, 2.95, -19.9], 27, 'easeOut')],
  smug: [K(A('smug'), [-0.5, 3.15, -16.6], [0, 3.05, -19.9], 26), K(B('smug') + 9, [-0.2, 3.12, -16.95], [0, 3.05, -19.9], 24)],
  dynasty: [K(A('dynasty'), [0.0, 2.2, -11.4], [0, 2.55, -19.9], 44), K(B('dynasty') + 9, [0.0, 2.6, -14.2], [0, 2.75, -19.9], 38, 'smooth')],
  busts: [K(A('busts'), [AX - 15.5, 2.4, STOA_Z + 7.2], [AX - 13.5, 1.6, STOA_Z + 4.5], 40), K(B('busts') + 9, [AX + 4.0, 1.75, STOA_Z + 6.9], [AX + 6, 1.6, STOA_Z + 4.5], 40, 'smooth', [[AX - 6, 1.9, STOA_Z + 7.0]])],
  bustsQ: [K(A('bustsQ'), [AX + 1.2, 1.85, STOA_Z + 8.6], [AX - 2.6, 1.7, STOA_Z + 4.5], 46), K(B('bustsQ') + 9, [AX + 0.6, 1.8, STOA_Z + 9.2], [AX - 2.8, 1.7, STOA_Z + 4.5], 44)],
  farm: [K(A('farm'), [FARM - 14, 3.2, -28], [FARM + 1, 1.2, -2], 46), K(off('farm', 40), [FARM + 0.4, 1.7, 3.6], [FARM + 1, 1.25, -2], 40, 'easeOut', [[FARM - 6, 2.0, -14]]), K(B('farm') + 9, [FARM + 0.6, 1.65, 3.2], [FARM + 1, 1.25, -2], 38)],
  enter: [K(A('enter'), [0.6, 0.55, 15.5], [0, 3.2, -4], 50), K(B('enter') + 9, [0.3, 0.7, 13.0], [0, 3.0, -6], 48)],
  translator: [K(A('translator'), [2.1, 2.5, -12.9], [0.42, 2.6, -19.4], 42), K(B('translator') + 9, [1.85, 2.5, -13.5], [0.42, 2.6, -19.4], 40)],
  shock: [K(A('shock'), [0.15, 1.55, -16.2], [0, 1.45, -12.0], 40), K(B('shock') + 9, [0.05, 1.5, -15.5], [0, 1.45, -12.0], 34, 'easeOut')],
  how: [K(A('how'), [AX + 2, 6, STOA_Z + 30], [AX, 4, STOA_Z], 50), K(B('how') + 9, [AX - 40, 72, STOA_Z + 150], [PH[0], 30, PH[1]], 50, 'easeIn')],
  stolen: [K(A('stolen'), [ROAD + 7.5, 1.4, 8.5], [ROAD, 1.9, 0], 42), K(B('stolen') + 12, [ROAD + 4.4, 1.7, 6.0], [ROAD, 2.0, 0], 40)],
  coffin: [K(A('coffin'), [ROAD + 2.9, 2.35, 1.6], [ROAD + 1.0, 1.7, 0], 36), K(B('coffin') + 9, [ROAD + 2.3, 2.15, 1.15], [ROAD + 1.0, 1.66, 0], 32)],
  hijack: [K(A('hijack'), [ROAD + 4.2, 1.7, 9.4], [ROAD + 2.2, 1.5, 0], 50), K(B('hijack') + 9, [ROAD + 3.8, 1.65, 8.8], [ROAD + 2.3, 1.55, 0], 48)],
  trophy: [K(A('trophy'), [ROAD + 152, 1.2, 11.5], [ROAD + 145, 2.2, 0], 48), K(B('trophy') + 9, [ROAD + 148.5, 2.1, 8.4], [ROAD + 145, 2.0, 0], 44, 'easeOut')],
  crown: [K(A('crown'), [0.0, 3.0, -14.9], [0, 2.9, -19.9], 34), K(B('crown') + 9, [0.0, 3.0, -15.6], [0, 2.95, -19.9], 30, 'easeOut')],
  alex: [K(A('alex'), [AX - 10, 72, -250], [PH[0], 52, PH[1]], 46), K(B('alex') + 9, [AX + 4, 9.5, 64], [AX, 3.4, STOA_Z], 50, 'smooth', [[AX - 50, 62, -180], [AX - 20, 40, -90], [AX + 6, 24, 10]])],
  kings: [K(A('kings'), [AX - 2.9, 1.5, STOA_Z + 11.9], [AX + 0.2, 1.4, STOA_Z + 3.5], 42), K(B('kings') + 9, [AX - 2.4, 1.65, STOA_Z + 11.2], [AX + 0.2, 1.4, STOA_Z + 3.5], 41)],
  wedding: [K(A('wedding'), [0.9, 1.7, -6.4], [0, 1.4, -12.2], 42), K(B('wedding') + 9, [0.4, 1.65, -6.7], [0, 1.4, -12.2], 41)],
  banquet: [K(A('banquet'), [0.2, 1.65, -0.2], [0.55, 1.25, -6.0], 50), K(B('banquet') + 9, [0.35, 1.6, -0.9], [0.6, 1.25, -6.0], 48)],
  landlord: [K(A('landlord'), [APT, 1.7, 2.5], [APT, 1.4, -12], 48), K(B('landlord') + 9, [APT + 0.2, 1.6, -3.2], [APT, 1.35, -8.5], 44, 'linear')],
  name: [K(A('name'), [APT + 1.3, 1.6, -3.2], [APT - 0.1, 1.3, -8.3], 44), K(B('name') + 9, [APT + 1.1, 1.6, -3.4], [APT - 0.1, 1.3, -8.3], 42)],
  born: [K(A('born'), [NURS[0] - 0.2, 1.3, NURS[1] + 3.5], [NURS[0], 0.7, NURS[1] + 0.2], 40), K(B('born') + 9, [NURS[0] - 0.1, 1.15, NURS[1] + 3.0], [NURS[0], 0.65, NURS[1] + 0.2], 40)],
  homework: [K(A('homework'), [DESK[0] - 1.2, 2.2, DESK[2] + 3.6], [DESK[0], 1.3, DESK[2] + 0.4], 46), K(B('homework') + 9, [DESK[0] + 1.0, 2.0, DESK[2] + 3.4], [DESK[0], 1.3, DESK[2] + 0.4], 44, 'linear')],
  learns: [K(A('learns'), [DESK[0] + 0.1, 1.65, DESK[2] + 2.9], [DESK[0] + 0.15, 1.45, DESK[2] + 0.4], 42), K(B('learns') + 9, [DESK[0] + 0.05, 1.65, DESK[2] + 2.6], [DESK[0] + 0.12, 1.47, DESK[2] + 0.4], 40)],
  isis: [K(A('isis'), [TX + 0.3, 1.0, -12.0], [TX, 3.3, -22], 50), K(B('isis') + 9, [TX + 0.2, 1.4, -14.0], [TX, 3.2, -22], 48, 'easeOut')],
  talk: [K(A('talk'), [2.0, 1.6, -10.2], [0.1, 1.25, -15.0], 44), K(B('talk') + 9, [1.7, 1.6, -10.8], [0.1, 1.25, -15.0], 42)],
  crowd: [K(A('crowd'), [PY[0] + 0.6, 2.3, PY[1] + 16.5], [PY[0], 5.2, PY[1] + 2], 56), K(B('crowd') + 9, [PY[0] + 0.2, 2.7, PY[1] + 14.5], [PY[0], 5.8, PY[1] + 2], 52, 'easeOut')],
  scribe: [K(A('scribe'), [TX - 1.5, 1.4, -12], [TX + 0.5, 4.6, -27], 50), K(B('scribe') + 9, [TX + 0.6, 3.0, -19.5], [TX + 1.3, 4.2, -27], 44, 'smooth')],
  gold: [K(A('gold'), [TX + 3.4, 4.9, -20.6], [TX + 1.0, 5.0, -27.3], 48), K(off('gold', 26), [TX + 2.8, 5.0, -19.6], [TX + 0.6, 5.0, -27.3], 50), K(B('gold') + 9, [TX, 9, 26], [TX, 4.5, -24], 56, 'easeIn', [[TX + 0.5, 5.2, -12], [TX, 6.5, 6]])],
  loop: [K(A('loop'), [0.6, 1.8, -15.0], [0, 2.85, -19.9], 38), K(off('loop', 70), [0.3, 2.9, -16.2], [0, 2.95, -19.9], 30, 'smooth'), K(B('loop'), [1.2, 0.9, -13.6], [0, 3.0, -19.9], 42, 'smooth')],
};
const CHASE_X = (f) => ROAD + 4 + (f - A('chase')) * 0.32;
const KICKS = [{ f: A('flip') + 9, a: 0.05 }, { f: A('loop') + 83, a: 0.04 }, { f: A('hijack') + 30, a: 0.05 }, { f: A('crown') + 20, a: 0.04 }, { f: A('gold') + 6, a: 0.03 }];
EZ.linear = (t) => clamp(t);
export const camAt = (f) => {
  const S = shotAt(f); let c;
  if (S.id === 'dress') { const t = EZ.smooth(ramp(f, A('dress'), B('dress') - 2)), a = t * Math.PI * 2, r = 2.8;
    c = { pos: [Math.sin(a) * r, 1.35 + 0.2 * Math.sin(t * Math.PI), -14.8 + Math.cos(a) * r], look: [0, 1.12, -14.8], fov: 60, roll: 6 * Math.sin(t * Math.PI) }; }
  else if (S.id === 'chase') { const x = CHASE_X(f), t = smooth(ramp(f, A('chase') + 40, B('chase') + 8));
    c = { pos: [x + 10.5 - 2.5 * t, 1.25 + 0.5 * t, 3.2 + 2.2 * t], look: [x - 1.5, 1.55, 0.2], fov: 50 - 6 * t, roll: 0 }; c.look[1] += Math.sin(f * 0.9) * 0.025; }
  else c = camFromKeys(CAMS[S.id], f, { creep: 0.0005, kicks: KICKS });
  c.flash = 0;
  const flashAt = (a, n, k) => { if (f >= a && f < a + n) c.flash = Math.max(c.flash, (1 - (f - a) / n) * k); };
  flashAt(A('flip') + 8, 6, 0.6); flashAt(A('smug') + 34, 5, 0.45); flashAt(A('loop') + 82, 6, 0.55); flashAt(A('crown') + 18, 6, 0.6); flashAt(A('dress') + 20, 6, 0.6); flashAt(A('learns') + 12, 5, 0.35); flashAt(A('gold') + 8, 7, 0.55); flashAt(A('isis') + 14, 5, 0.4);
  // handheld drift on every shot (references never lock off)
  { const d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]) * 0.005;
    c.look = [c.look[0] + d * Math.sin(f * 0.047 + 1.3), c.look[1] + d * 0.8 * Math.sin(f * 0.061), c.look[2] + d * Math.sin(f * 0.039 + 2.1)]; }
  const set = { hall: [0, 0, -10], lib: [LIB[0], 0, LIB[1]], day: [AX, 0, STOA_Z], egypt: [PY[0], 0, PY[1]], farm: [FARM, 0, -2], dusk: [AX, 0, 0], road: [ROAD, 0, 0], apt: [APT, 0, -8], night: [NURS[0], 0, NURS[1]], temple: [TX, 0, -20], tnight: [TX, 0, -22] };
  c.shadowAt = set[S.light];
  if (S.id === 'chase') c.shadowAt = [CHASE_X(f), 0, 0];
  if (S.id === 'trophy') c.shadowAt = [ROAD + 145, 0, 0];
  if (S.id === 'alex' || S.id === 'how') c.shadowAt = [AX, 0, 0];
  return c;
};

// ---------- lens: depth of field on every close shot ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const FOCUS = {
  busts: null, flip: [0, 2.95, -19.9], smug: [0, 3.05, -19.9], dynasty: [0, 2.7, -19.9], loop: [0, 2.9, -19.9], queen: [0, 2.8, -19.9], desk: [DESK[0], 1.45, DESK[2] + 0.1], card: [DESK[0] + 0.3, 1.38, DESK[2] + 0.55], bustsQ: [AX - 2.25, 1.6, STOA_Z + 4.5],
  farm: [FARM + 1, 1.3, -2], translator: [0.5, 2.6, -19.4], shock: [0, 1.45, -14.2], stolen: [ROAD, 1.8, 0.3], coffin: [ROAD + 1.16, 1.62, 0], hijack: [ROAD + 1.6, 1.6, 0.5],
  trophy: [ROAD + 145, 1.8, 1.2], crown: [0, 2.9, -19.7], kings: null, wedding: [0, 1.4, -12.2], banquet: [0, 1.3, -6.0], name: [APT - 0.1, 1.45, -8.3],
  born: [NURS[0], 0.8, NURS[1] + 0.2], homework: [DESK[0], 1.4, DESK[2]], learns: [DESK[0] + 0.12, 1.45, DESK[2] + 0.4], dress: [0, 1.3, -14.8], isis: [TX, 1.6, -21],
  talk: [0, 1.45, -15.0], scribe: null, landlord: null,
};
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'chase') return { focus: dist(C.pos, [CHASE_X(f), 1.6, 0]), cinf: 6 };
  if (S.id === 'landlord') return { focus: dist(C.pos, [APT, 1.4, -8.4]), cinf: 5 };
  if (S.id === 'gold') return f < A('gold') + 30 ? { focus: dist(C.pos, [TX + 1.6, 5.0, -26.5]), cinf: 5 } : { focus: 30, cinf: 0 };
  if (S.id === 'busts') { const x = lerp(AX - 13.5, AX + 6, ramp(f, A('busts'), B('busts'))); return { focus: dist(C.pos, [x, 1.6, STOA_Z + 4.5]), cinf: 8 }; }
  if (S.id === 'scribe') return { focus: dist(C.pos, [TX + 2.2, 3.4, -26]), cinf: 4 };
  const p = FOCUS[S.id]; if (p) return { focus: dist(C.pos, p), cinf: S.light === 'lib' ? 20 : S.macro ? 13 : S.cu ? 11 : 8 };
  return { focus: 20, cinf: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f), W = { lights: [] };
  if (S.light === 'hall') W.lights = HALL_LIGHTS.map(([x, y, z, i]) => [x, y, z, i * (S.id === 'crown' ? 1.3 : 1), '#ff9a4a', 16]);
  if (S.light === 'lib') W.lights = [[LIB[0] + 1.1, 1.7, LIB[1] + 0.3, S.id === 'homework' ? lerp(1.2, 3.2, ramp(f, A('homework'), B('homework'))) : 1.6, '#ffb45c', 8], [LIB[0], 3, LIB[1] + 2, 1.0, '#ffe0b0', 14]];
  if (S.light === 'night') W.lights = [[NURS[0] + 1.6, 1.4, NURS[1] + 0.6, 3.0, '#ffb45c', 10], [NURS[0] - 0.4, 2.2, NURS[1] + 2.5, 1.0, '#9fb4ff', 8]];
  if (S.light === 'apt') W.lights = [[APT, 3.3, -3, 2.4, '#ffd9a0', 9], [APT, 3.3, -9, 2.4, '#ffd9a0', 9], [APT, 3.3, -15, 2.0, '#ffd9a0', 9]];
  if (S.light === 'road' || S.id === 'chase') { const x = S.id === 'chase' ? CHASE_X(f) : ROAD; W.lights = [[x - 1.6, 2.7, 1.2, 2.6, '#ffb050', 10], [x + 1.6, 2.7, 1.2, 2.6, '#ffb050', 10]];
    if (S.id === 'chase') W.lights.push([x - 6.5, 2.4, 1.5, 2.2, '#ff8a3a', 9]); }
  if (S.light === 'tnight') { const g = S.id === 'gold' ? smooth(ramp(f, A('gold') + 6, A('gold') + 40)) : 0;
    W.lights = [[TX + 2.2, 4.4, -25.2, 2.4 + 1.2 * g, '#ffb050', 10 + 4 * g], [TX - 3.2, 2.2, -20, 1.6, '#ff9a4a', 8], [TX + 3.2, 2.2, -20, 1.6, '#ff9a4a', 8], [TX, 6, -24.5, 1.2 * g, '#ffcf50', 14]]; }
  // the cart
  if (S.light === 'road' && S.id !== 'chase') W.cart = { x: ROAD, z: 0 };
  if (S.id === 'chase') W.cart = { x: CHASE_X(f), z: 0, rz: Math.sin(f * 0.7) * 0.01 };
  if (S.id === 'trophy') W.cart = { x: ROAD + 145, z: 0 };
  // study: scrolls pile up and the candle burns down during "she does the homework"
  W.scaffold = S.light === 'tnight';
  W.stack = S.id === 'homework' ? ramp(f, A('homework') + 4, B('homework') - 4) : (S.id === 'learns' || S.id === 'loop') ? 1 : 0.15;
  W.wax = S.id === 'homework' ? lerp(0.9, 0.18, ramp(f, A('homework'), B('homework'))) : (S.id === 'learns' || S.id === 'loop') ? 0.18 : 0.75;
  return W;
};

// ---------- cast ----------
const hash = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
const saccade = (f, seed) => { const per = 46 + (seed * 29) % 37, g = f + seed * 17, k = Math.floor(g / per), ph = g - k * per; return lerp((hash(k - 1 + seed * 101) - 0.5) * 0.5, (hash(k + seed * 101) - 0.5) * 0.5, clamp(ph / 3)); };
const LIFE = (f, seed, o) => { const I = idle(f, seed); return { tilt: q(I.tilt, 1), headTilt: q(I.headTilt + (o.ht || 0), 1), bob: q(I.bob + (o.step ? Math.abs(Math.sin(o.step * Math.PI * 2)) * 0.012 : 0), 3), ...o, look: q((o.look ?? 0) + (o.fixLook ? 0 : saccade(f, seed)), 2) }; };
const R = (T, who, o, pos, extra = {}) => ({ key: (typeof who === 'string' ? who : JSON.stringify(who)) + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], check: true, ...extra });
const CARD = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, ...extra });
const TINT = { hall: '#fff6ee', lib: '#fff4e6', day: '#ffffff', egypt: '#fffaf0', farm: '#fff0dc', dusk: '#ffe6d6', road: '#cfd9ff', apt: '#fff2e2', night: '#dfe4ff', temple: '#fffaf0', tnight: '#c8d2ff' };
const hop = (f, f0, h = 0.12) => { const t = (f - f0) / 8; return t < 0 || t > 1 ? { dy: 0, sq: 1 } : { dy: h * Math.sin(t * Math.PI), sq: 1 + 0.07 * Math.sin(t * Math.PI * 2) }; };
const spinAt = (f, f0, n = 10) => { const t = (f - f0) / n; if (t <= 0) return { sx: 1, swapped: false }; if (t >= 1) return { sx: 1, swapped: true }; return { sx: Math.max(0.04, Math.abs(Math.cos(t * Math.PI))), swapped: t > 0.5 }; };
// lip flap (mouth only) on characters who speak on screen
const flap = (f, base, on) => !on ? base : (((Math.floor(f / 4) * 7919) % 5) < 3 ? base + '_o' : base);
const COURT = [];
{ const who = ['egyptA', 'greekA', 'priest', 'egyptB', 'greekB', 'egyptA', 'priest', 'greekA', 'egyptB', 'egyptA', 'greekB', 'priest'];
  let i = 0; for (const z of [-14.2, -10.6, -7.0]) for (const x of [-1.85, -3.05, 1.85, 3.05]) { COURT.push({ who: who[i], seed: 30 + i, pos: [x + (i % 3) * 0.08, 0, z + (x > 0 ? 0.4 : 0)], row: Math.round((z + 14.2) / 3.6) }); i++; } }
let outfitsAdded = false;
const addOutfits = (T) => { if (outfitsAdded) return; outfitsAdded = true; const O = T.OUTFITS;
  O.farmer = { tunic: '#efe4c8', skin: '#a86e48', wrap: '#f6f1e4' };
  O.translator = { tunic: '#e9e4f2', dress: '#e2dcea', skin: '#e2b48c', greekHair: '#2a1d14', sash: '#3f6fb0' };
  O.landlord = { tunic: '#5f7a5a', skin: '#f0c8a8', hair: '#6a5a4a', moustache: '#6a5a4a', stout: true };
  O.landlordOld = { tunic: '#5f7a5a', skin: '#f0c8a8', hair: '#eeeeee', moustache: '#eeeeee', brows: '#eeeeee', stout: true };
  O.tenant = { tunic: '#c0433a', skin: '#d9a57a', hair: '#2b211c' };
  O.scribe = { tunic: '#f4efe2', dress: '#efe8d6', skin: '#b67c55', bald: true, beard: '#f4f1ea', brows: '#f4f1ea', leopard: true };
  O.bride = { tunic: '#f3f0ea', dress: '#ece6dc', skin: '#e2b48c', greekHair: '#3a2414', crown: 'diadem', sash: '#c8443a', bun: true };
  O.groom = { tunic: '#f1ead8', dress: '#ece2cc', skin: '#e2b48c', greekHair: '#3a2414', crown: 'diadem', sash: '#6b2f7a' };
  O.statue = { ...O.cleoIsis };
};

export const actorsAt = (f, T) => {
  addOutfits(T);
  const S = shotAt(f), out = [], tint = TINT[S.light] || '#ffffff';
  const man = (who, seed, o, pos, extra = {}) => { const H = extra.hop || { dy: 0, sq: 1 }; out.push(R(T, who, LIFE(f, seed, { seed, blink: blinkAt(f, seed), ...o }), [pos[0], pos[1] + H.dy, pos[2]], { tint, ...extra, s: (extra.s || 1) * H.sq, sy: q(1 + 0.014 * Math.sin(f * 0.11 + seed * 1.7), 3), hop: undefined })); };
  const mood = (seed) => { const per = 64 + (seed * 13) % 30, k = Math.floor((f + seed * 37) / per); return Math.floor(hash(k + seed * 7) * 5); };
  const court = (bowFn, exprFn) => COURT.forEach((c, i) => { const b = bowFn ? q(bowFn(c, i), 1) : 0, m = mood(c.seed), side = c.pos[0] > 0 ? -1 : 1;
    const idleO = m === 1 ? { look: side * 0.9, headTilt: side * 4 } : m === 2 ? { expr: (Math.floor(f / 4) + c.seed) % 3 ? 'neutral_o' : 'neutral', look: -side * 0.8, headTilt: -side * 5 } : m === 3 ? { L: 'cross', R: 'cross' } : m === 4 ? { L: 'belly', R: 'belly', expr: 'grin' } : {};
    man(c.who, c.seed, { expr: b > 0.3 ? 'relief' : (exprFn ? exprFn(c, i) : 'neutral'), L: b > 0.2 ? 'belly' : 'hang', R: b > 0.2 ? 'belly' : 'hang', look: side * 0.5, ...(b > 0.2 ? {} : idleO), bow: b, blink: b > 0.3 ? 1 : blinkAt(f, c.seed) }, c.pos, { check: false }); });
  const statues = () => { for (const sx of [-1, 1]) out.push(R(T, 'egyptA', { seed: 50, expr: 'stern', blink: 0, L: 'cross', R: 'cross' }, [sx * 3.4, 1.2, -21.6], { tint: '#f2b640', s: 2.3, check: false, blob: false })); };
  const restK = () => { const C = camAt(f), d = Math.hypot(C.pos[0] - THR[0], C.pos[1] - 2.5, C.pos[2] - THR[2]), hw = d * Math.tan(C.fov * Math.PI / 360) * 9 / 16; return q(smooth(ramp(hw, 0.82, 1.02)), 2); };
  const seated = (who, seed, o, extra = {}) => man(who, seed, { expr: 'neutral', ...SIT, restK: restK(), ...o }, THR, { s: QS, face: 0, ...extra });
  const atDesk = (who, o, extra = {}) => man(who, 21, { expr: 'calm', L: 'belly', R: 'belly', ...o }, DESK, { s: 1.0, ...extra });
  switch (S.id) {
    case 'queen': seated('cleoEgypt', 21, { expr: f > A('queen') + 14 ? 'smug' : 'calm', look: q(lerp(-0.3, 0.15, smooth(ramp(f, 2, 20))), 2) }, { check: false }); court(() => 1); statues(); break;
    case 'flip': { const sp = spinAt(f, A('flip') + 3, 10); seated(sp.swapped ? 'cleoGreek' : 'cleoEgypt', 21, { expr: sp.swapped ? 'grin' : 'smug', look: sp.swapped ? 0.15 : 0 }, { sx: sp.sx, check: false }); statues(); break; }
    case 'smug': { const sp = spinAt(f, A('smug') + 30, 10), k = f - A('smug'); seated(sp.swapped ? 'cleoEgypt' : 'cleoGreek', 21, { expr: sp.swapped ? 'smug' : (k > 8 ? 'smug' : 'grin'), look: k > 10 && !sp.swapped ? -0.45 : 0.1, blink: sp.swapped && k > 40 && k < 46 ? 1 : blinkAt(f, 21), ht: k > 10 && k < 30 ? -5 : 0 }, { sx: sp.sx, check: false }); statues(); break; }
    case 'dynasty': { const k = f - A('dynasty'), n = Math.min(5, Math.floor(k / 12)), sp = spinAt(f, A('dynasty') + n * 12 - 4, 8), i = sp.swapped ? n : Math.max(0, n - 1);
      const sashes = ['#6b2f7a', '#3f6fb0', '#b8322f', '#2f8a5a', '#c48a22', '#6b2f7a'];
      seated({ tunic: '#f1ead8', dress: '#ece2cc', skin: ['#e2b48c', '#e8bf98', '#d9a57a'][i % 3], greekHair: ['#3a2414', '#4a2c1a', '#2a1d14', '#8a8a8a'][i % 4], crown: 'diadem', sash: sashes[i], beard: i % 2 ? '#3a2414' : undefined }, 80 + i, { expr: ['smug', 'grin', 'stern', 'laugh', 'smug', 'grin'][i], look: 0.1 }, { sx: k < 6 ? 1 : sp.sx });
      court(); statues(); break; }
    case 'loop': { const k = f - A('loop'), sp = spinAt(f, A('loop') + 80, 10);
      seated(sp.swapped ? 'cleoGreek' : 'cleoEgypt', 21, { expr: sp.swapped ? 'smug' : (k > 30 ? 'grin' : 'calm'), look: sp.swapped ? -0.3 : 0.1, blink: sp.swapped && k > 100 && k < 106 ? 1 : blinkAt(f, 21) }, { sx: sp.sx });
      court(() => smooth(ramp(k, 10, 26))); statues(); break; }
    case 'desk': case 'card': {
      const k = 0;
      const expr = S.id === 'card' ? (f > A('card') + 28 ? 'pained' : 'squint') : S.id === 'loop' ? (k > 70 ? 'smug' : 'grin') : 'squint';
      atDesk('cleoEgypt', { expr, look: S.id === 'card' ? 0.35 : 0.1, L: 'belly', R: S.id === 'loop' && k > 20 ? 'up' : 'belly', blink: S.id === 'loop' && k > 96 && k < 104 ? 1 : blinkAt(f, 21), ht: S.id === 'card' && f > A('card') + 28 ? -6 : 0 },
        S.id === 'card' && f > A('card') + 28 ? { hop: { dy: -0.06 * smooth(ramp(f, A('card') + 28, A('card') + 36)), sq: 1 } } : {});
      break; }
    case 'busts': case 'bustsQ': for (let i = 0; i < 7; i++) out.push(CARD('bust' + i, (p) => T.bust(p, i, true), [AX - 13.5 + i * 4.5, 1.26, STOA_Z + 4.5], 0.62, { tint, check: false, blob: false })); break;
    case 'farm': { const w = smooth(ramp(f, A('farm') + 30, A('farm') + 44));
      man('farmer', 61, { expr: f > A('farm') + 34 ? 'grin' : 'neutral', look: 0.2, L: 'hang', R: f > A('farm') + 34 ? 'wave' : 'hang', wv: f * 0.35 }, [FARM + 1, 0, -2], f > A('farm') + 34 && f < A('farm') + 44 ? { hop: hop(f, A('farm') + 35, 0.1) } : {});
      man('egyptB', 62, { expr: 'neutral', look: -0.5, L: 'belly', R: 'belly', bow: 0.3 }, [FARM - 2.4, 0, -4.6], { check: false });
      break; }
    case 'enter': { const z = lerp(9.5, 2.5, ramp(f, A('enter'), B('enter') + 8));
      man('farmer', 61, { expr: 'nervous', look: 0, L: 'belly', R: 'belly', step: q((f * 0.045) % 1) }, [0, 0, z], { check: false }); court(); statues(); break; }
    case 'translator': case 'crown': {
      const isCrown = S.id === 'crown', sp = isCrown ? spinAt(f, A('crown') + 16, 8) : { sx: 1, swapped: false };
      if (isCrown) seated(sp.swapped ? 'ptolemyKing' : 'ptolemy', 11, { expr: sp.swapped ? 'laugh' : 'grin', look: 0.1 }, { sx: sp.sx });
      else seated('ptolemyKing', 15, { expr: f > A('translator') + 18 ? 'dazed' : 'neutral', look: 0.55, ht: 8 });
      if (!isCrown) man('translator', 16, { expr: flap(f, 'nervous', true), look: -0.7, L: 'cheek', R: 'hang', ht: -6 }, [0.95, 1.2, -19.1], { check: false });
      if (isCrown) { court(() => smooth(ramp(f, A('crown') + 22, A('crown') + 32))); } statues(); break; }
    case 'shock': man('farmer', 61, { expr: f > A('shock') + 6 ? 'shock' : 'nervous', look: 0, L: f > A('shock') + 8 ? 'cheek' : 'belly', R: f > A('shock') + 8 ? 'cheek' : 'belly' }, [0, 0, -14.2], f > A('shock') + 6 && f < A('shock') + 16 ? { hop: hop(f, A('shock') + 7, 0.1) } : {}); break;
    case 'stolen': break;
    case 'coffin': break;
    case 'hijack': { const k = f - A('hijack'), fly = smooth(ramp(k, 30, 46)), land = EZ.back(ramp(k, 14, 30), 1.4);
      // driver on the bench gets shoved off; Ptolemy leaps up from the road onto the bench
      if (k < 60) man('greekB', 71, { expr: k > 30 ? 'shock' : 'snore', look: 0, L: k > 30 ? 'up' : 'belly', R: k > 30 ? 'up' : 'belly' }, [ROAD + 1.95 + fly * 1.8, 1.15 + Math.sin(fly * Math.PI) * 0.7 - fly * 1.15, 0.6 + fly * 1.2], { roll: -fly * 1.4, check: false, blob: k > 46 });
      man('ptolemy', 11, { expr: k > 30 ? 'laugh' : 'grin', look: -0.3, L: k > 30 ? 'reach' : 'hip', R: 'hip' }, [ROAD + 2.4 - land * 0.45, Math.sin(clamp(land) * Math.PI) * 0.5 + land * 1.15, 1.4 - land * 0.8], { blob: land < 0.2 });
      break; }
    case 'chase': { const x = CHASE_X(f), st = (f * 0.1) % 1;
      for (const [dx, dz, sd] of [[3.6, -0.5, 1], [3.6, 0.6, 2]]) { const ph = q((st + sd * 0.33) % 1, 2); out.push(CARD('horse' + sd + ph, (p) => T.horse(p, ph, '#f2efe8', '#6b2f7a', '#c9c2b4', false), [x + dx, 0, dz], 2.0, { tint, check: false })); }
      man('ptolemy', 11, { expr: 'laugh', look: 0.4, L: 'reach', R: 'up' }, [x + 1.95, 1.15 + Math.abs(Math.sin(f * 0.45)) * 0.05, 0.6], { check: false, blob: false });
      for (let i = 0; i < 3; i++) man(i === 1 ? 'greekA' : 'hoplite', 75 + i, { expr: 'shock', look: 0.5, L: 'up', R: 'up', step: q((f * 0.09 + i * 0.3) % 1) }, [x - 7.2 - i * 1.4, 0, 1.0 + i * 0.7], { check: false });
      break; }
    case 'trophy': {
      man('ptolemy', 11, { expr: 'laugh', look: 0, L: 'up', R: 'thumb' }, [ROAD + 145.5, 1.15, 1.1], { check: false, blob: false });
      for (let i = 0; i < 9; i++) { const x = ROAD + 141 + (i % 5) * 1.6 + (i > 4 ? 0.8 : 0), z = 3.6 + Math.floor(i / 5) * 1.4, cheer = (f + i * 7) % 26 < 8;
        man(['egyptA', 'egyptB', 'priest', 'greekA', 'egyptB'][i % 5], 120 + i, { expr: cheer ? 'shock' : 'grin', L: cheer ? 'cheek' : 'hang', R: cheer ? 'cheek' : 'hang', look: 0 }, [x, 0, z], { check: false }); }
      break; }
    case 'alex': case 'how': break;
    case 'kings': { const sashes = ['#6b2f7a', '#3f6fb0', '#b8322f', '#2f8a5a', '#c48a22', '#6b2f7a'];
      for (let i = 0; i < 6; i++) { const x = AX - 1.9 + i * 1.3; man({ tunic: '#f1ead8', dress: '#ece2cc', skin: ['#e2b48c', '#e8bf98', '#d9a57a'][i % 3], greekHair: ['#3a2414', '#4a2c1a', '#2a1d14'][i % 3], crown: 'diadem', sash: sashes[i], beard: i % 3 === 1 ? '#3a2414' : undefined },
        80 + i, { expr: flap(f, 'grin', (f + i * 9) % 30 < 18), look: i % 2 ? 0.3 : -0.3, L: i % 2 ? 'wave' : 'hang', wv: f * 0.3 + i }, [x, 0, STOA_Z + 7.5 - i * 1.7], { check: false }); }
      break; }
    case 'wedding': { const k = f - A('wedding');
      man('groom', 31, { expr: 'grin', look: 0.4, L: 'hang', R: 'hang' }, [-0.55, 0, -12.2]); man('bride', 31, { expr: 'grin', look: -0.4, L: 'hang', R: 'hang' }, [0.55, 0, -12.2]);
      man('priest', 33, { expr: 'nervous', look: 0, L: 'belly', R: 'belly' }, [0, 0, -13.6], { check: false });
      man('greekA', 34, { expr: 'nervous', look: 0.6, L: 'cross', R: 'cross' }, [-2.1, 0, -11.3], { check: false }); man('egyptA', 35, { expr: k > 14 ? 'dazed' : 'nervous', look: -0.6 }, [2.1, 0, -11.0], { check: false });
      break; }
    case 'banquet': { const k = f - A('banquet');
      man('groom', 31, { expr: 'smug', look: -0.8, L: 'belly', R: 'up', ht: 6 }, [-0.6, 0, -6.6], { check: false }); man('bride', 31, { expr: 'smug', look: -0.9, L: 'belly', R: 'belly', ht: 6 }, [0.5, 0, -6.6], { check: false });
      man('egyptA', 41, { expr: flap(f, k > 24 ? 'nervous' : 'neutral', k < 40), look: -0.4, L: 'reach', R: 'hang', lift: 0.2 }, [0.88, 0, -4.9]);
      break; }
    case 'landlord': { const k = f - A('landlord'), old = k > 70;
      man(old ? 'landlordOld' : 'landlord', 51, { expr: old ? 'dazed' : 'neutral', look: 0.2, L: 'hang', R: 'belly', bow: old ? 0.25 : 0 }, [APT - 0.4, 0, -8.4]); break; }
    case 'name': { const k = f - A('name');
      man('landlordOld', 51, { expr: flap(f, k > 18 ? 'grin' : 'neutral', k > 6 && k < 34), look: 0.7, L: 'hang', R: k > 8 ? 'point' : 'belly', bow: 0.25 }, [APT - 0.6, 0, -8.6]);
      man('tenant', 52, { expr: 'stubborn', look: -0.7, L: 'cross', R: 'cross', fixLook: true }, [APT + 0.4, 0, -8.0]); break; }
    case 'born': out.push(CARD('cradle' + q(((f - A('born')) / 60) % 1, 2), (p) => T.cradle(p, ((f - A('born')) / 60) % 1), [NURS[0], 0.0, NURS[1] + 0.2], 0.95, { tint, check: true }));
      man('ptolemyKing', 15, { expr: 'relief', look: 0.6, facing: 1, L: 'cross', R: 'cross' }, [NURS[0] - 1.25, 0, NURS[1] - 0.4], { check: false }); break;
    case 'homework': atDesk('cleoTeen', { expr: (Math.floor(f / 10) % 3) ? 'squint' : 'stubborn', look: 0.3, L: 'belly', R: 'belly', ht: Math.sin(f * 0.3) * 3 }, { s: 0.95 }); break;
    case 'learns': atDesk('cleoTeen', { expr: f > A('learns') + 10 ? 'laugh' : 'squint', look: 0.2, L: 'belly', R: f > A('learns') + 10 ? 'up' : 'belly' }, { s: 0.95, ...(f > A('learns') + 10 && f < A('learns') + 20 ? { hop: hop(f, A('learns') + 11, 0.08) } : {}) }); break;
    case 'dress': { const sp = spinAt(f, A('dress') + 18, 10); man(sp.swapped ? 'cleoEgypt' : 'cleoGreek', 21, { expr: sp.swapped ? 'smug' : 'calm', look: 0 }, [0, 0, -14.8], { s: 1.12, sx: sp.sx }); statues(); break; }
    case 'isis': { const k = f - A('isis'), w = EZ.easeOut(ramp(k, 0, 16));
      out.push(R(T, 'statue', { seed: 21, expr: 'calm', blink: 0, L: 'up', R: 'up' }, [TX, 1.2, -24.6], { tint: '#efd9a6', s: 3.0, check: false, blob: false }));
      man('cleoIsis', 21, { expr: k > 14 ? 'smug' : 'calm', look: 0, L: k > 12 ? 'up' : 'hang', R: k > 12 ? 'up' : 'hang', step: k < 14 ? q((f * 0.05) % 1) : 0 }, [TX + (1 - w) * 1.6, 0, -21], { s: 1.12 });
      for (const [dx, dz, sd] of [[-2.2, 1.8, 42], [2.2, 1.8, 43]]) { const b = q(smooth(ramp(k, 14, 26)), 1); man('priest', sd, { expr: 'relief', bow: b, blink: b > 0.3 ? 1 : 0, L: 'belly', R: 'belly' }, [TX + dx, 0, -21 + dz], { check: false }); }
      break; }
    case 'talk': { const k = f - A('talk');
      man('cleoEgypt', 21, { expr: flap(f, 'grin', k > 4 && k < 50), look: 0.75, L: 'hang', R: 'wave', wv: f * 0.2, wvx: 18 }, [-0.7, 0, -15.3], { s: 1.05 });
      man('farmer', 61, { expr: k > 20 ? 'laugh' : 'shock', look: -0.7, L: k > 20 ? 'up' : 'cheek', R: k > 20 ? 'up' : 'cheek' }, [0.6, 0, -14.6], k > 22 && k < 32 ? { hop: hop(f, A('talk') + 23, 0.12) } : {});
      man('translator', 16, { expr: k > 30 ? 'dazed' : 'nervous', look: -0.6, L: 'cross', R: 'cross' }, [2.0, 0, -16.6], { check: false });
      break; }
    case 'crowd': man('cleoEgypt', 21, { expr: flap(f, 'grin', true), look: 0, L: 'wave', wv: f * 0.25, R: 'up' }, [PY[0], 7.9, PY[1] + 2.05], { blob: false, check: false });
      for (let i = 0; i < 21; i++) { const x = PY[0] - 5.2 + (i % 7) * 1.7 + (Math.floor(i / 7) % 2 ? 0.85 : 0), z = PY[1] + 6 + Math.floor(i / 7) * 1.7, cheer = (f + i * 7) % 24 < 9;
        man(['egyptA', 'egyptB', 'priest', 'egyptB', 'farmer'][i % 5], 90 + i, { expr: cheer ? 'laugh' : 'grin', L: cheer ? 'up' : 'hang', R: cheer ? 'up' : 'hang', look: 0 }, [x, 0, z], { check: false, ...(cheer ? { hop: hop(f, f - ((f + i * 7) % 24), 0.14) } : {}) }); }
      break;
    case 'scribe': case 'gold': {
      const g = S.id === 'gold' ? smooth(ramp(f, A('gold') + 6, A('gold') + 40)) : 0;
      out.push(R(T, 'statue', { seed: 21, expr: 'calm', blink: 0, L: 'up', R: 'hang' }, [TX - 0.4, -1.3, -27.35], { tint: hexLerp('#a8946e', '#f2b52c', g), s: 4.3, check: false, blob: false, shadow: false, face: 0 }));
      const k = f - A('scribe'), climb = S.id === 'scribe' ? smooth(ramp(k, 30, 100)) : 1;
      man('scribe', 91, { expr: S.id === 'gold' ? (g > 0.4 ? 'laugh' : 'relief') : 'neutral', look: -0.6, L: S.id === 'gold' ? 'reach' : 'hang', R: 'belly', step: climb < 1 ? q((f * 0.06) % 1) : 0, lift: 0.3 }, [TX + 2.2 + (1 - climb) * 0.3, 3.66 * climb, -25.9 + (1 - climb) * 0.9], { check: false, s: 0.95, blob: false });
      break; }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const FXc = (key, draw, c, s, extra = {}) => FX(key, draw, [c[0], c[1] - 1.069 * s, c[2]], s, extra);
// flash card held up (ink-outlined, hieroglyph on the front; state: 'q' | 'x' | 'ok')
const flashCard = (p, state, flip = 1) => { const g = p.g; g.save(); g.translate(300, 500); g.scale(Math.max(0.05, flip), 1); g.translate(-300, -500);
  const r = [[80, 330], [520, 330], [520, 670], [80, 670]]; p.poly(r, '#fbf6ea', 14); p.poly([[80, 330], [520, 330], [520, 380], [80, 380]], '#2f6fb0', 0);
  // the glyph: an owl ("m")
  p.ell(230, 520, 70, 90, '#2a1d24', 0); p.ell(210, 470, 18, 18, '#fbf6ea', 0); p.ell(250, 470, 18, 18, '#fbf6ea', 0); p.poly([[200, 600], [180, 640], [215, 615]], '#2a1d24', 0); p.poly([[255, 600], [275, 640], [240, 615]], '#2a1d24', 0);
  g.fillStyle = '#2a1d24'; g.font = 'bold 120px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('= ?', 410, 530);
  if (state === 'x') { p.stroke([[120, 360], [480, 640]], 34, '#d0312d'); p.stroke([[480, 360], [120, 640]], 34, '#d0312d'); }
  if (state === 'ok') { g.fillStyle = '#fbf6ea'; g.fillRect(340, 450, 160, 160); g.fillStyle = '#2a1d24'; g.font = 'bold 110px DejaVu Sans'; g.fillText('m', 410, 530); p.stroke([[330, 640], [380, 680], [490, 600]], 26, '#2f9a4a'); }
  g.restore(); };
const rays = (p, t, col = '255,236,180') => { const g = p.g; g.save(); for (let i = 0; i < 6; i++) { const x0 = 120 + i * 80 + Math.sin(t * 2 + i) * 20, w = 40 + (i % 3) * 30; const gr = g.createLinearGradient(0, 0, 0, 1000);
  gr.addColorStop(0, `rgba(${col},0.42)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w * 3 + 160, 1000); g.lineTo(x0 + 160, 1000); g.fill(); } g.restore(); };
const textBubble = (p, txt, t, tail = 1) => { const s = 0.4 + 0.6 * Math.min(1, t * 1.6); const g = p.g; g.save(); g.translate(300, 520); g.scale(s, s); g.translate(-300, -520);
  const b = [...Array(40)].map((_, i) => { const a = i / 40 * Math.PI * 2; return [300 + Math.cos(a) * 270, 470 + Math.sin(a) * 150]; });
  p.poly([[300 + tail * 60, 590], [300 + tail * 150, 740], [300 + tail * 130, 590]], '#ffffff', 8); p.poly(b, '#ffffff', 8);
  g.fillStyle = '#2a1d24'; g.font = 'bold 92px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 300, 475); g.restore(); };
const calPage = (p, rot) => { const g = p.g; g.save(); g.translate(300, 500); g.rotate(rot); g.translate(-300, -500); p.poly([[200, 400], [400, 400], [400, 640], [200, 640]], '#f7f2e6', 8); p.poly([[200, 400], [400, 400], [400, 450], [200, 450]], '#c0433a', 0); g.restore(); };
const cobweb = (p, k) => { const g = p.g; g.save(); g.globalAlpha = 0.9 * k; for (let i = 0; i < 7; i++) { const a = Math.PI * (0.05 + 0.4 * i / 6); p.stroke([[80, 80], [80 + Math.cos(a) * 420 * k, 80 + Math.sin(a) * 420 * k]], 4, '#f4f4f4'); }
  for (let r = 1; r <= 4; r++) { const pts = []; for (let i = 0; i < 7; i++) { const a = Math.PI * (0.05 + 0.4 * i / 6); pts.push([80 + Math.cos(a) * 100 * r * k, 80 + Math.sin(a) * 100 * r * k]); } p.stroke(pts, 3, '#f4f4f4'); } g.restore(); };
const keys = (p, t) => { const a = Math.sin(t * 8) * 0.3; const g = p.g; g.save(); g.translate(300, 420); g.rotate(a); g.translate(-300, -420); p.ell(300, 420, 40, 40, null, 10); for (const [dx, r] of [[-30, -0.3], [10, 0.2], [40, 0.5]]) { g.save(); g.translate(300 + dx, 470); g.rotate(r); p.poly([[-8, 0], [8, 0], [8, 150], [-8, 150]], '#e8c35a', 6); p.poly([[8, 110], [30, 110], [30, 130], [8, 130]], '#e8c35a', 5); g.restore(); } g.restore(); };
const crown = (p) => { p.poly([[150, 640], [450, 640], [470, 480], [380, 560], [300, 430], [220, 560], [130, 480]], '#e8b531', 12); for (const x of [200, 300, 400]) p.ell(x, 600, 22, 22, '#c8443a', 6); };
const SKY_BIRDS = { busts: [AX - 2, 10, STOA_Z - 6], farm: [FARM - 4, 9, -30], trophy: [ROAD + 140, 12, -20], kings: [AX - 3, 9.5, STOA_Z - 8], crowd: [PY[0] + 3, 17, PY[1] - 8], isis: [TX - 2, 15, -40] };
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.light === 'hall') {
    for (let i = 0; i < 16; i++) { const u = ((f * 0.0025 + hash(i)) % 1); out.push(FX('mote', (p) => T.fxMote(p), [-3 + hash(i + 3) * 6 + Math.sin(f * 0.013 + i) * 0.3, 0.6 + u * 4.2, -19 + hash(i + 7) * 15], 0.045, { tint: '#ffe6b0', order: 4 })); }
    for (const [x, y, z] of BRAZ) { const t = q((f * 0.04 + x) % 1, 2); out.push(FX('flame' + t, (p) => T.fxFlame(p, t * 6.283), [x, y + 1.42, z + 0.02], 0.42, { order: 3 })); }
  }
  if (SKY_BIRDS[S.id]) { const [bx, by, bz] = SKY_BIRDS[S.id]; for (let i = 0; i < 5; i++) { const ph = q((f * 0.07 + i * 0.21) % 1, 1), a = f * 0.012 + i * 1.3;
    out.push(FX('bird' + ph, (p) => T.fxBird(p, ph), [bx + Math.cos(a) * (3 + i), by + (i % 3) * 0.8 + Math.sin(f * 0.05 + i) * 0.3, bz + Math.sin(a) * 2], 0.5, { order: 1 })); } }
  if (S.light === 'lib') { const t = q((f * 0.05) % 1, 2); out.push(FX('cflame' + t, (p) => T.fxFlame(p, t * 6.283), [LIB[0] + 1.1, 1.08 + (worldAt(f).wax ?? 0.3), LIB[1] + 0.12], 0.12, { order: 3 }));
    for (let i = 0; i < 10; i++) { const u = ((f * 0.002 + hash(i + 40)) % 1); out.push(FX('mote', (p) => T.fxMote(p), [LIB[0] - 2 + hash(i + 5) * 4, 0.8 + u * 2.4, LIB[1] - 1 + hash(i + 9) * 3], 0.035, { tint: '#ffe6b0', order: 4 })); } }
  const shine = (key, t, c, s, col) => out.push(FXc(key + q(t, 1), (p) => T.fxShine(p, t, col), c, s));
  const spark = (key, t, c, s) => out.push(FXc(key + q(t, 2), (p) => T.fxSpark(p, t), c, s));
  const card = (state, flip, pos, s = 0.5) => out.push(FXc('fc' + state + q(flip, 2), (p) => flashCard(p, state, flip), pos, s, { order: 6 }));
  switch (S.id) {
    case 'queen': if (f > 10) spark('sp', ramp(f, 10, 30), [0.1, 3.35, -19.4], 0.3); break;
    case 'flip': { const k = f - A('flip'); if (k > 2 && k < 26) { const t = ramp(k, 2, 22); out.push(FXc('fburst' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe9a0', 16, 60, 260); }, [0, 3.0, -20.0], 1.7, { order: 1 })); spark('fsp', ramp(k, 4, 22), [0.1, 3.3, -19.4], 0.5); } break; }
    case 'smug': { const k = f - A('smug'); if (k > 10 && k < 34) spark('ssp', ramp(k, 10, 32), [-0.25, 3.45, -19.4], 0.22); if (k > 28 && k < 50) { const t = ramp(k, 28, 46); out.push(FXc('sburst' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe9a0', 16, 60, 260); }, [0, 3.0, -20.0], 1.7, { order: 1 })); } break; }
    case 'dynasty': { const k = f - A('dynasty'); for (let n = 1; n <= 5; n++) { const d = k - (n * 12 - 4); if (d >= 0 && d < 10) spark('dsp' + n, d / 10, [0.1, 3.2, -19.4], 0.4); } break; }
    case 'loop': { const k = f - A('loop'); if (k > 4) spark('lsp', ramp(k, 4, 24), [0.1, 3.35, -19.4], 0.3); if (k > 78 && k < 104) { const t = ramp(k, 78, 100); out.push(FXc('lburst' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe9a0', 16, 60, 260); }, [0, 3.0, -20.0], 1.7, { order: 1 })); spark('lsp2', ramp(k, 80, 100), [0.1, 3.3, -19.4], 0.5); } break; }
    case 'desk': card('q', 1, [DESK[0] + 0.32, 1.42, DESK[2] + 0.42], 0.42); out.push(FXc('sw', (p) => T.fxSweat(p), [DESK[0] + 0.32, 1.95, DESK[2] + 0.05], 0.18)); break;
    case 'card': { const k = f - A('card'), fl = k < 14 ? 1 : k < 22 ? Math.abs(Math.cos((k - 14) / 8 * Math.PI)) : 1;
      card(k < 18 ? 'q' : 'x', fl, [DESK[0] + 0.32, 1.42, DESK[2] + 0.55], 0.42); break; }
    case 'bustsQ': for (let i = 0; i < 7; i++) { const f0 = A('bustsQ') + 4 + i * 7, t = q(ramp(f, f0, f0 + 7), 2); if (f >= f0) out.push(FXc('bq' + i + t, (p) => T.bubble(p, i % 2 ? 'q' : 'greek', t, -1), [AX - 13.5 + i * 4.5 + 0.35, 2.6, STOA_Z + 4.6], 0.5)); } break;
    case 'busts': for (let i = 0; i < 7; i++) { const f0 = A('busts') + 4 + i * 5, t = q(ramp(f, f0, f0 + 6), 2); if (f >= f0) out.push(FXc('bg' + i + t, (p) => T.bubble(p, 'greek', t, -1), [AX - 13.5 + i * 4.5 + 0.35, 2.6, STOA_Z + 4.6], 0.5)); } break;
    case 'translator': { const t = q(ramp(f, A('translator') + 18, A('translator') + 26), 2); if (t > 0) out.push(FXc('tq' + t, (p) => T.bubble(p, 'q', t, -1), [-0.6, 4.2, -19.4], 0.45)); break; }
    case 'shock': if (f > A('shock') + 8) out.push(FXc('sw2', (p) => T.fxSweat(p), [0.32, 2.05, -14.0], 0.16)); break;
    case 'how': { const t = q(ramp(f, A('how') + 4, A('how') + 12), 2); out.push(FXc('hq' + t, (p) => T.bubble(p, 'q', t, 0), [AX, 9, STOA_Z + 4], 3.2 * clamp(1 - ramp(f, A('how') + 22, B('how')) * 0.6))); break; }
    case 'stolen': case 'coffin': case 'hijack': for (const sx of [-1.6, 1.6]) { const t = q((f * 0.05 + sx) % 1, 2); out.push(FX('lf' + t, (p) => T.fxFlame(p, t * 6.283), [ROAD + sx, 2.62, 1.05], 0.16, { order: 3 })); }
      if (S.id === 'coffin' && f > A('coffin') + 8) shine('cf', (f - A('coffin') - 8) / 12, [ROAD + 0.9, 2.0, 0.45], 0.32, '#fff3b0');
      if (S.id === 'hijack') { const k = f - A('hijack'); if (k > 28 && k < 48) out.push(FXc('spd' + q(ramp(k, 28, 48), 1), (p) => T.fxSpeed(p, ramp(k, 28, 48)), [ROAD + 2.3, 1.9, 1.2], 0.9)); }
      break;
    case 'chase': { const x = CHASE_X(f); for (let i = 0; i < 5; i++) { const k = q(((f * 0.06) + i * 0.2) % 1, 2); out.push(FXc('rd' + k, (p) => T.fxDust(p, k, '#e8c896'), [x - 2.6 - k * 4, 0.45, 0.4 + (i % 2) * 0.8], 0.9, { order: 4 })); }
      for (let i = 0; i < 3; i++) { const t = q((f * 0.06 + i * 0.3) % 1, 2); out.push(FX('tf' + i + t, (p) => T.fxFlame(p, t * 6.283), [x - 7.2 - i * 1.4 + 0.45, 2.15, 1.05 + i * 0.7], 0.22, { order: 3 })); }
      out.push(FXc('csp' + q((f * 0.1) % 1, 1), (p) => T.fxSpeed(p, (f * 0.1) % 1), [x - 0.5, 1.6, 1.5], 1.2, { order: 4 })); break; }
    case 'trophy': if (f > A('trophy') + 6) shine('tr', (f - A('trophy') - 6) / 14, [ROAD + 145.3, 1.75, 0.6], 0.5, '#fff3b0'); break;
    case 'crown': { const k = f - A('crown'), y = lerp(5.4, 3.55, EZ.easeOut(ramp(k, 0, 16))); if (k < 18) out.push(FXc('cr' + q(y, 2), (p) => crown(p), [0, y, -19.3], 0.42, { order: 6 }));
      if (k > 16 && k < 40) { const t = ramp(k, 16, 34); out.push(FXc('burst' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe9a0', 16, 60, 260); }, [0, 3.0, -20.0], 1.7, { order: 1 })); spark('spk', ramp(k, 18, 34), [0.1, 3.3, -19.4], 0.5); } break; }
    case 'alex': { const t = q((f * 0.04) % 1, 2); out.push(FX('pf' + t, (p) => T.fxFlame(p, t * 6.283), [PH[0], 58.2, PH[1] + 3.5], 4.0, { order: 3 })); break; }
    case 'kings': for (let i = 0; i < 6; i++) { const f0 = A('kings') + 2 + i * 3, t = q(ramp(f, f0, f0 + 6), 2); if (f >= f0) out.push(FXc('kb' + i + t, (p) => T.bubble(p, 'greek', t, i % 2 ? 1 : -1), [AX - 1.9 + i * 1.3 + (i % 2 ? 0.45 : -0.45), 2.55, STOA_Z + 7.6 - i * 1.7], 0.42)); } break;
    case 'wedding': { const t = q((f * 0.05) % 1, 2); out.push(FXc('hrt' + t, (p) => { p.g.globalAlpha = 0.9; p.ell(250, 470, 70, 70, '#e0405a', 8); p.ell(350, 470, 70, 70, '#e0405a', 8); p.poly([[185, 500], [415, 500], [300, 640]], '#e0405a', 0); }, [0, 2.75 + Math.sin(f * 0.2) * 0.05, -12.0], 0.3));
      out.push(FXc('sw3', (p) => T.fxSweat(p), [-1.8, 2.05, -11.1], 0.16)); out.push(FXc('sw4', (p) => T.fxSweat(p), [2.4, 2.05, -10.8], 0.16)); break; }
    case 'banquet': { const t = q(ramp(f, A('banquet') + 2, A('banquet') + 10), 2); out.push(FXc('gb' + t, (p) => T.bubble(p, 'glyph', t, -1), [1.3, 2.6, -4.8], 0.45)); break; }
    case 'landlord': { const k = f - A('landlord');
      for (let i = 0; i < 6; i++) { const u = ramp(k, 10 + i * 12, 40 + i * 12); if (u > 0 && u < 1) out.push(FXc('cp' + i + q(u, 2), (p) => calPage(p, u * 6), [APT - 2.3 + u * 1.6, 1.75 + Math.sin(u * Math.PI) * 0.6 - u * 1.2, -5.0 + u * 2], 0.4)); }
      const w = q(ramp(k, 20, 90), 2); if (w > 0) out.push(FX('web' + w, (p) => cobweb(p, w), [APT - 2.2, 2.3, -9.6], 1.3, { face: Math.PI / 2, order: 4 }));
      out.push(FXc('keys' + q((f * 0.05) % 1, 2), (p) => keys(p, f * 0.05), [APT - 0.05, 1.05, -8.3], 0.28)); break; }
    case 'name': { const k = f - A('name'), t = q(ramp(k, 6, 14), 2); if (t > 0) out.push(FXc('hey' + t, (p) => textBubble(p, 'Hey… you.', t, -1), [APT - 0.4, 2.65, -8.6], 0.55)); break; }
    case 'born': if (f > A('born') + 20) spark('bs', ramp(f, A('born') + 20, A('born') + 46), [NURS[0] - 0.2, 1.0, NURS[1] + 0.35], 0.5); break;
    case 'homework': for (let i = 0; i < 4; i++) { const k = (f - A('homework')) / 10 + i * 0.25, st = Math.floor(k) % 2 ? 'x' : 'q'; out.push(FXc('hc' + i + st, (p) => flashCard(p, st, 1), [DESK[0] - 0.9 + i * 0.6, 1.1, DESK[2] + 0.75 + (i % 2) * 0.1], 0.18, { order: 4 })); } break;
    case 'learns': { const k = f - A('learns'), fl = k < 4 ? 1 : k < 12 ? Math.abs(Math.cos((k - 4) / 8 * Math.PI)) : 1; card(k < 8 ? 'q' : 'ok', fl, [DESK[0] + 0.32, 1.42, DESK[2] + 0.55], 0.42); if (k > 10) spark('lk', ramp(k, 10, 30), [DESK[0] + 0.3, 1.55, DESK[2] + 0.6], 0.3); break; }
    case 'dress': { const k = f - A('dress'); if (k > 17 && k < 40) { const t = ramp(k, 17, 35); spark('ds', t, [0, 1.5, -14.6], 0.7); out.push(FXc('db' + q(t, 2), (p) => { p.g.translate(50, 250); T.fxBurst(p, t, '#ffe9a0', 16, 60, 260); }, [0, 1.4, -15.1], 1.5, { order: 1 })); } break; }
    case 'isis': { const t = q(((f - A('isis')) / 50) % 1, 2); out.push(FXc('ib' + t, (p) => { p.g.translate(50, 250); p.g.translate(250, 250); p.g.rotate(t * 0.6); p.g.translate(-250, -250); T.fxBurst(p, 1, '#ffe08a', 18, 80, 300); }, [TX, 2.4, -21.6], 2.4, { order: 1 })); break; }
    case 'talk': { const t = q(ramp(f, A('talk') + 4, A('talk') + 12), 2); out.push(FXc('tb' + t, (p) => T.bubble(p, 'glyph', t, -1), [-0.2, 2.75, -15.2], 0.5));
      if (f > A('talk') + 30) out.push(FXc('sw5', (p) => T.fxSweat(p), [2.3, 2.05, -16.5], 0.16)); break; }
    case 'crowd': { const t = q(ramp(f, A('crowd') + 4, A('crowd') + 12), 2); out.push(FXc('cb' + t, (p) => T.bubble(p, 'glyph', t, -1), [PY[0] + 1.6, 10.6, PY[1] + 2.1], 1.2));
      for (let i = 0; i < 14; i++) { const u = ((f - A('crowd')) * 0.02 + hash(i + 60)) % 1; out.push(FX('pet' + (i % 3), (p) => p.ell(300, 500, 120, 70, ['#ff8fb0', '#ffd34a', '#ffffff'][i % 3], 10), [PY[0] - 5 + hash(i) * 10 + Math.sin(f * 0.05 + i), 9 - u * 9, PY[1] + 5 + hash(i + 2) * 4], 0.12, { order: 4 })); } break; }
    case 'scribe': case 'gold': {
      const k = f - A('scribe'), climb = S.id === 'scribe' ? smooth(ramp(k, 30, 100)) : 1, sx = TX + 2.2 + (1 - climb) * 0.3, sy = 3.66 * climb, sz = -25.9 + (1 - climb) * 0.9;
      const t = q((f * 0.06) % 1, 2); out.push(FX('lamp' + t, (p) => T.fxFlame(p, t * 6.283), [sx + 0.45, sy + 1.25, sz + 0.1], 0.18, { order: 3 }));
      for (const x of [-3.2, 3.2]) { const t2 = q((f * 0.04 + x) % 1, 2); out.push(FX('tbz' + t2, (p) => T.fxFlame(p, t2 * 6.283), [TX + x, 1.7, -19.98], 0.42, { order: 3 })); }
      if (S.id === 'gold') { const g = smooth(ramp(f, A('gold') + 6, A('gold') + 40)); for (let i = 0; i < 6; i++) spark('gs' + i, ((f - A('gold')) / 22 + i * 0.17) % 1, [TX - 2.6 + i * 1.05, 2 + (i % 3) * 2.6, -27.0], 0.6 * g);
        if (g > 0.05) out.push(FX('grays' + q(f * 0.01, 2), (p) => rays(p, f * 0.01, '255,214,120'), [TX - 1.5, 6.5, -26.9], 3.2 * g, { order: 1, face: 0, alpha: 0.3 })); }
      break; }
    case 'deskLoop': { const k = f - A('loop'); card(k < 20 ? 'q' : 'ok', 1, [DESK[0] + (k < 20 ? 0.32 : 0.42), 1.42 + (k < 20 ? 0 : 0.35 * EZ.back(ramp(k, 20, 32))), DESK[2] + 0.55], 0.42); if (k > 26) spark('lp', ramp(k, 26, 50), [DESK[0] + 0.45, 1.85, DESK[2] + 0.6], 0.32); break; }
  }
  return out;
};
