// BRIGHTON 2026/27: why they dominate + how to beat them. 3D tactical breakdown in the
// style of the reference (dark stadium, glowing lines, tags, lime highlights, condensed
// caps captions, scoreboard card). Voiceover: vidIQ (Daniel), tightened to 56 s.
// Stats: web search 4 Nov 2026 — see edits/brighton-tactics/storyboard.md.
import React from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { ArcLine, BKey, BLUE, Ball, CKey, CameraRig, KITS, LIME, Lane, NeonLine, PKey, Player, RED, Ring, Stadium, V2, Zone, ballAt, camAt, clamp01, curve, makeCam, posAt, project, smooth } from "./engine";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const END = 57.0;
export const FRAMES = Math.round(END * FPS);

// Beat starts (s), set on the voiceover's sentence boundaries.
export const B = { hook: 0, how: 7.0, bait: 10.0, pass: 15.1, hunt: 20.8, wide: 27.7, but: 32.0, c1: 34.3, c2: 40.2, c3: 47.6, cta: 53.6, end: END };

// ---------------------------------------------------------------- fonts
const COND = "Anton, 'Bebas Neue', sans-serif";
const MONO = "'JetBrains Mono', monospace";
let fontsReady: Promise<unknown> | null = null;
const useFonts = () => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    fontsReady ??= Promise.all(
      [
        ["Anton", "anton-400.woff2", "400"],
        ["JetBrains Mono", "jetbrains-600.ttf", "600"],
      ].map(([fam, file, weight]) => new FontFace(fam, `url(${staticFile(`fonts/${file}`)})`, { weight }).load().then((f) => document.fonts.add(f))),
    );
    fontsReady.then(() => continueRender(h));
  }, [h]);
};

// ---------------------------------------------------------------- scene description
type PDef = { id: string; kit: keyof typeof KITS; keys: PKey[]; tag?: string; tagColor?: string; tagAt?: number; tagUntil?: number };
type RDef = { pid?: string; pos?: V2; at: number; until?: number; color: string; r?: number };
type LDef = { pts: V2[]; at: number; dur: number; until?: number; color: string; dashed?: boolean; arrow?: boolean; w?: number };
type ADef = { a: V2; b: V2; h: number; at: number; dur: number; until?: number; color: string };
type ZDef = { pts: V2[]; at: number; until?: number; color: string; opacity?: number };
type LnDef = { a: V2; b: V2; w: number; at: number; until?: number; color: string };
type SceneDef = { players: PDef[]; ball: BKey[]; cam: CKey[]; rings?: RDef[]; lines?: LDef[]; arcs?: ADef[]; zones?: ZDef[]; lanes?: LnDef[] };

const life = (t: number, at: number, until?: number, fin = 0.35, fout = 0.3) => {
  const a = clamp01((t - at) / fin);
  const b = until === undefined ? 1 : 1 - clamp01((t - until) / fout);
  return Math.min(a, b);
};

const Scene: React.FC<{ def: SceneDef }> = ({ def }) => {
  const t = useCurrentFrame() / FPS;
  const c = camAt(def.cam, t);
  const ball = ballAt(def.ball, t);
  const ballPrev = ballAt(def.ball, t - 1 / FPS);
  const spin = t * 8 * Math.min(1, Math.hypot(ball[0] - ballPrev[0], ball[2] - ballPrev[2]) * 3);
  const ppos: Record<string, V2> = {};
  const players = def.players.map((p) => {
    const [x, z] = posAt(p.keys, t);
    const [x0, z0] = posAt(p.keys, t - 0.1);
    const vx = (x - x0) / 0.1;
    const vz = (z - z0) / 0.1;
    const speed = Math.hypot(vx, vz);
    const heading = speed > 0.8 ? Math.atan2(vx, vz) : Math.atan2(ball[0] - x, ball[2] - z);
    const stride = Math.min(1, speed / 6);
    ppos[p.id] = [x, z];
    return { p, x, z, heading, stride, phase: t * (5 + 7 * stride) + p.id.length };
  });
  const cam = makeCam(c, W, H);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={W} height={H} style={{ background: "#020804" }} gl={{ antialias: true }}>
        <CameraRig c={c} />
        <fog attach="fog" args={["#020804", 70, 190]} />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#cfe8d6", "#0b2a12", 0.6]} />
        <directionalLight position={[20, 40, 25]} intensity={1.6} />
        <Stadium />
        {(def.zones ?? []).map((z, i) => <Zone key={`z${i}`} pts={z.pts} color={z.color} p={life(t, z.at, z.until)} opacity={z.opacity} />)}
        {(def.lanes ?? []).map((l, i) => <Lane key={`ln${i}`} a={l.a} b={l.b} w={l.w} color={l.color} p={life(t, l.at, l.until, 0.6)} t={t} />)}
        {(def.rings ?? []).map((r, i) => {
          const at = r.pos ?? ppos[r.pid ?? ""] ?? [0, 0];
          return <Ring key={`r${i}`} x={at[0]} z={at[1]} color={r.color} p={life(t, r.at, r.until, 0.3)} r={r.r} t={t} />;
        })}
        {(def.lines ?? []).map((l, i) => <NeonLine key={`l${i}`} pts={l.pts} draw={smooth(clamp01((t - l.at) / l.dur))} color={l.color} dashed={l.dashed} arrow={l.arrow} w={l.w} fade={l.until === undefined ? 1 : 1 - clamp01((t - l.until) / 0.3)} />)}
        {(def.arcs ?? []).map((a, i) => <ArcLine key={`a${i}`} a={a.a} b={a.b} h={a.h} draw={clamp01((t - a.at) / a.dur)} color={a.color} fade={a.until === undefined ? 1 : 1 - clamp01((t - a.until) / 0.3)} />)}
        {players.map(({ p, x, z, heading, stride, phase }) => <Player key={p.id} x={x} z={z} heading={heading} phase={phase} stride={stride} kit={KITS[p.kit]} seed={p.id} />)}
        <Ball p={ball} spin={spin} />
      </ThreeCanvas>
      {/* player tags (projected) */}
      {players.map(({ p, x, z }) => {
        if (!p.tag) return null;
        const o = life(t, p.tagAt ?? 0, p.tagUntil, 0.25, 0.2);
        if (o <= 0) return null;
        const s = project(cam, [x, 3.15, z], W, H);
        if (!s.visible) return null;
        const col = p.tagColor ?? LIME;
        return (
          <div key={p.id} style={{ position: "absolute", left: s.x, top: s.y, transform: `translate(-50%, -100%) scale(${0.85 + 0.15 * o})`, opacity: o, padding: "5px 12px 4px", borderRadius: 7, background: col, color: col === RED ? "#fff" : "#06140a", fontFamily: COND, fontSize: 26, letterSpacing: "0.04em", whiteSpace: "nowrap", boxShadow: `0 0 18px ${col}aa` }}>
            {p.tag}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- formations
// Brighton attack toward -z (their goal at z = +52.5). Red defend the -z goal.
const F = (id: string, kit: PDef["kit"], x: number, z: number, extra: Partial<PDef> = {}): PDef => ({ id, kit, keys: [[0, x, z]], ...extra });
const still = (ps: PDef[]) => ps;
const BHA_BUILD = (): PDef[] => [
  F("bgk", "BGK", 0, 47),
  F("brcb", "B", 10, 42), F("blcb", "B", -10, 42), F("brb", "B", 25, 32), F("blb", "B", -25, 32),
  F("b6", "B", 4, 32), F("b8", "B", -7, 28),
  F("brw", "B", 27, 12), F("b10", "B", 1, 15), F("blw", "B", -27, 12), F("bst", "B", 0, -2),
];
const RED_MID = (): PDef[] => [
  F("rgk", "RGK", 0, -48),
  F("rlb", "R", -22, -12), F("rlcb", "R", -8, -14), F("rrcb", "R", 8, -14), F("rrb", "R", 22, -12),
  F("rlm", "R", -20, 6), F("rcm1", "R", -6, 4), F("rcm2", "R", 7, 4), F("rrm", "R", 20, 6),
  F("rf1", "R", -6, 24), F("rf2", "R", 8, 22),
];
const withKeys = (ps: PDef[], over: Record<string, Partial<PDef>>) => ps.map((p) => (over[p.id] ? { ...p, ...over[p.id] } : p));

// 1 · HOOK — Brighton's 10 finishes; scoreboard card.
const HOOK: SceneDef = {
  players: [
    F("b10", "B", 6, -20, { keys: [[0, 6, -20], [0.7, 0, -26], [2.3, -2, -33.5], [3.4, -1.5, -35], [6, -1, -36]], tag: "BRIGHTON 10", tagAt: 0.3, tagUntil: 2.9 }),
    F("bst", "B", 9, -38, { keys: [[0, 12, -34], [3, 8, -42], [6, 7, -43]] }),
    F("blw", "B", -20, -30, { keys: [[0, -22, -26], [3, -14, -40]] }),
    F("rlcb", "R", -4, -38, { keys: [[0, -6, -40], [1.8, -3.5, -36.5], [3.4, -3, -37]], tag: "CB", tagColor: RED, tagAt: 0.8, tagUntil: 2.7 }),
    F("rrcb", "R", 6, -40, { keys: [[0, 7, -41], [2.5, 4, -40]] }),
    F("rlb", "R", -15, -38), F("rcm", "R", -9, -28, { keys: [[0, -10, -24], [2.2, -7, -31]] }),
    F("rgk", "RGK", 0, -50.5, { keys: [[0, 0, -50.5], [2.7, 0, -50.5], [3.15, -1.8, -50.8]] }),
  ],
  ball: [[0, 14, -14, 0], [0.7, 0.6, -26.8, 0], [1.5, -1, -30, 0], [2.3, -1.6, -34.3, 0], [2.65, -1.6, -34.3, 0.9], [3.15, 2.6, -52.8, 0], [3.5, 2.8, -53.6, 0], [9, 2.8, -53.6, 0]],
  cam: [
    [0, [11, 3.8, -9], [4, 1, -28], 42],
    [0.7, [5, 3.5, -15], [-1, 1, -36], 42],
    [2.3, [3, 3.2, -23], [-0.5, 1.2, -44], 40],
    [3.4, [1, 2.6, -30], [1.5, 1.4, -52], 38],
    [7, [-6, 3.6, -38], [1, 1.2, -52], 38],
  ],
  rings: [{ pid: "b10", at: 0.2, until: 3.0, color: LIME }, { pid: "rlcb", at: 0.8, until: 2.8, color: RED }],
  lines: [{ pts: curve([-1.6, -34.3], [2.6, -52.5], 1.5), at: 2.65, dur: 0.45, until: 5.5, color: LIME, arrow: false }],
};

// 2 · HOW — camera lifts to reveal Brighton's 4-2-3-1.
const ROLES: Record<string, string> = { bgk: "GK", brcb: "RCB", blcb: "LCB", brb: "RB", blb: "LB", b6: "6", b8: "8", brw: "RW", b10: "10", blw: "LW", bst: "ST" };
const HOW: SceneDef = {
  players: [...BHA_BUILD().map((p, i) => ({ ...p, tag: ROLES[p.id], tagAt: 0.6 + i * 0.12 })), ...RED_MID()],
  ball: [[0, 0, 46.3, 0]],
  cam: [[0, [0, 30, 84], [0, 0, 12], 44], [3, [0, 40, 80], [0, 0, 6], 44]],
  rings: BHA_BUILD().map((p, i) => ({ pid: p.id, at: 0.6 + i * 0.12, color: LIME, r: 1.6 })),
};

// 3 · BAIT — keeper stands on the ball; red press jumps.
const BAIT_PLAYERS = withKeys([...BHA_BUILD(), ...RED_MID()], {
  bgk: { keys: [[0, 0, 47]], tag: "FOOT ON THE BALL", tagAt: 1.2 },
  brcb: { keys: [[0, 10, 42], [1.2, 14, 44]] },
  blcb: { keys: [[0, -10, 42], [1.2, -14, 44]] },
  b6: { keys: [[0, 4, 32], [2.0, 3, 36]] },
  rf1: { keys: [[0, -6, 24], [3.4, -6, 24], [4.8, -4, 38]], tag: "PRESS", tagColor: RED, tagAt: 3.5 },
  rf2: { keys: [[0, 8, 22], [3.5, 8, 22], [4.9, 10, 39]] },
  rcm1: { keys: [[0, -6, 4], [3.6, -6, 4], [5.1, -4, 18]] },
  rcm2: { keys: [[0, 7, 4], [3.6, 7, 4], [5.1, 6, 20]] },
});
const BAIT: SceneDef = {
  players: BAIT_PLAYERS,
  ball: [[0, 0.1, 46.3, 0]],
  cam: [[0, [12, 12, 72], [0, 0, 34], 40], [5.1, [8, 9.5, 64], [0, 0.5, 36], 40]],
  rings: [{ pid: "bgk", at: 0.9, color: LIME, r: 1.5 }],
  lines: [
    { pts: curve([-6, 26], [-4, 37], 1), at: 3.2, dur: 0.6, color: RED, dashed: true },
    { pts: curve([8, 24], [10, 38], -1), at: 3.3, dur: 0.6, color: RED, dashed: true },
  ],
};

// 4 · ONE PASS — through the first line, lane to the back four.
const PASS_PLAYERS = withKeys([...BHA_BUILD(), ...RED_MID()], {
  bgk: { keys: [[0, 0, 47]] },
  brcb: { keys: [[0, 14, 44]] },
  blcb: { keys: [[0, -14, 44]] },
  b6: { keys: [[0, 3, 36], [1.1, 2.5, 35.5]], tag: "6", tagAt: 0.4, tagUntil: 2.4 },
  b10: { keys: [[0, 1, 15], [1.6, 1, 18], [2.5, 0.5, 16.5], [5.7, 0, -2]], tag: "10", tagAt: 1.6 },
  rf1: { keys: [[0, -4, 38], [0.8, -2, 42]] },
  rf2: { keys: [[0, 10, 39], [0.8, 6, 41]] },
  rcm1: { keys: [[0, -4, 18], [1.5, -3, 24]] },
  rcm2: { keys: [[0, 6, 20], [1.5, 5, 26]] },
  rlcb: { keys: [[0, -8, -14], [3, -6, -8]], tag: "BACK FOUR", tagColor: RED, tagAt: 2.8 },
  rrcb: { keys: [[0, 8, -14], [3, 6, -8]] },
  rlb: { keys: [[0, -22, -12], [3, -18, -8]] },
  rrb: { keys: [[0, 22, -12], [3, 18, -8]] },
});
const PASS: SceneDef = {
  players: PASS_PLAYERS,
  ball: [[0, 0.1, 46.3, 0], [0.5, 0.1, 46.3, 0], [1.1, 2.4, 35.2, 0], [1.5, 2.2, 34.8, 0], [2.4, 0.8, 17.2, 0], [5.7, 0, -1.3, 0]],
  cam: [[0, [8, 9.5, 64], [0, 0.5, 36], 40], [1.6, [5, 12, 52], [0, 0, 26], 40], [5.7, [4, 12, 26], [0, 0, -4], 42]],
  rings: [{ pid: "b6", at: 0.6, until: 2.4, color: LIME }, { pid: "b10", at: 1.8, color: LIME }],
  lines: [
    { pts: [[0.1, 45.6], [2.4, 35.6]], at: 0.5, dur: 0.45, until: 3.6, color: LIME },
    { pts: [[2.3, 34.4], [0.9, 17.8]], at: 1.5, dur: 0.6, until: 4.2, color: LIME },
  ],
  zones: [{ pts: [[-12, 47], [12, 47], [12, 36], [-12, 36]], at: 1.1, until: 2.6, color: RED, opacity: 0.18 }],
  lanes: [{ a: [0.5, 15], b: [0, -9], w: 7, at: 2.4, color: LIME }],
};

// 5 · HUNT — red lose it wide, three Brighton players collapse.
const HUNT: SceneDef = {
  players: [
    F("rgk", "RGK", 0, -48), F("rlcb", "R", -9, -41), F("rrcb", "R", 10, -41), F("rrb", "R", 26, -32),
    F("rlb", "R", -29, -30, { keys: [[0, -27, -28], [1.2, -30, -30], [2.8, -30.5, -30.5]], tag: "BALL", tagColor: RED, tagAt: 1.1, tagUntil: 3.3 }),
    F("rcm1", "R", -8, -24), F("rcm2", "R", 8, -26), F("rlm", "R", -24, -12), F("rf1", "R", -4, -6),
    F("blw", "B", -18, -18, { keys: [[0, -18, -18], [1.2, -19, -20], [2.6, -28, -27.5], [3.6, -28.5, -29]], tag: "LW", tagAt: 1.4 }),
    F("bst", "B", -8, -30, { keys: [[0, -6, -32], [1.2, -10, -33], [2.6, -26, -33]], tag: "ST", tagAt: 1.5 }),
    F("b8", "B", -12, -12, { keys: [[0, -12, -12], [1.2, -14, -16], [2.7, -24, -24]], tag: "8", tagAt: 1.6 }),
    F("b10", "B", 0, -16, { keys: [[0, 0, -16], [2.5, -6, -22]] }),
    F("brw", "B", 18, -22), F("blb", "B", -24, 2, { keys: [[0, -26, 4], [2.5, -28, -8]] }),
  ],
  ball: [[0, -9, -40.4, 0], [0.4, -9, -40.4, 0], [1.2, -29.4, -29.6, 0], [3.0, -29.8, -30.0, 0], [3.25, -28.2, -28.8, 0], [6.9, -28.2, -28.8, 0]],
  cam: [[0, [4, 24, -6], [-20, 0, -30], 42], [3.0, [-6, 15, -12], [-26, 0, -29], 40], [6.9, [-10, 12, -14], [-27, 0, -29], 38]],
  rings: [
    { pid: "rlb", at: 1.1, until: 3.3, color: RED },
    { pid: "blw", at: 1.4, color: LIME }, { pid: "bst", at: 1.5, color: LIME }, { pid: "b8", at: 1.6, color: LIME },
  ],
  lines: [
    { pts: [[-9, -40.4], [-28.8, -30]], at: 0.4, dur: 0.6, until: 2.0, color: RED, w: 0.22 },
    { pts: curve([-19, -20], [-27.5, -27.4], -2), at: 1.3, dur: 0.6, until: 4.5, color: LIME, dashed: true },
    { pts: curve([-10, -33], [-26.5, -32.8], 2), at: 1.4, dur: 0.6, until: 4.5, color: LIME, dashed: true },
    { pts: curve([-14, -16], [-24, -24.5], -1), at: 1.5, dur: 0.6, until: 4.5, color: LIME, dashed: true },
  ],
};

// 6 · WIDE — overhead: the touchline as the extra man.
const WIDE: SceneDef = {
  players: HUNT.players.map((p) => ({ ...p, keys: [[0, ...posAt(p.keys, 6.9)] as PKey], tag: undefined })),
  ball: [[0, -28.2, -28.8, 0]],
  cam: [[0, [-12, 46, -8], [-24, 0, -29], 42], [4.3, [-14, 38, -12], [-25, 0, -29], 42]],
  zones: [
    { pts: [[-34, -44], [-30.5, -44], [-30.5, -14], [-34, -14]], at: 0.4, color: LIME, opacity: 0.3 },
    { pts: [[-28.5, -29], [-26, -33], [-24, -24]], at: 0.2, color: LIME, opacity: 0.25 },
  ],
  rings: [{ pos: [-30.5, -30.5], at: 0.2, color: RED, r: 1.6 }],
};

// 7 · BUT — pitch level behind Brighton's high line.
const BHA_LINE = (z: number): PDef[] => [
  F("bgk", "BGK", 0, 49), F("blb", "B", -21, z), F("blcb", "B", -7, z), F("brcb", "B", 7, z), F("brb", "B", 21, z),
  F("b6", "B", 2, z - 10), F("b8", "B", -8, z - 12),
];
const BUT: SceneDef = {
  players: [...BHA_LINE(6), F("rst", "R", 2, 0), F("r10", "R", -6, -6), F("rw", "R", 16, -2)],
  ball: [[0, -6, -5.3, 0]],
  cam: [[0, [11, 4.2, 26], [0, 0.8, 5], 42], [2.3, [8, 3.6, 21], [0, 0.8, 4], 40]],
  zones: [{ pts: [[-34, 7.5], [34, 7.5], [34, 40], [-34, 40]], at: 0.4, color: "#ff8a3c", opacity: 0.1 }],
  lines: [{ pts: [[-30, 6.6], [30, 6.6]], at: 0.3, dur: 0.6, color: WHITE_LINE(), dashed: true, arrow: false, w: 0.2 }],
};
function WHITE_LINE() { return "#ffffff"; }

// 8 · COUNTER 1 — skip the press: long and early.
const C1: SceneDef = {
  players: [
    F("rgk", "RGK", 0, -47, { tag: "YOU", tagColor: LIME, tagAt: 0.4, tagUntil: 2.5 }), F("rlcb", "R", -13, -43), F("rrcb", "R", 13, -43),
    F("rlb", "R", -24, -32), F("rrb", "R", 24, -32), F("rcm", "R", 0, -30),
    F("rst", "R", -3, -4, { keys: [[0, -3, -4], [2.6, -3, -4], [4.0, -4, -1]], tag: "TARGET", tagColor: LIME, tagAt: 2.6 }),
    F("bst", "B", 0, -30, { keys: [[0, 0, -30], [2.4, 0, -42]] }), F("b10", "B", -6, -26, { keys: [[0, -6, -26], [2.4, -11, -40]] }), F("brw", "B", 12, -26, { keys: [[0, 12, -26], [2.4, 11, -40]] }),
    F("b6", "B", 3, -18), F("blcb", "B", -6, 2, { keys: [[0, -6, 2], [3.6, -5, 1]] }), F("brcb", "B", 8, 3),
  ],
  ball: [[0, 0, -46.3, 0], [2.6, 0, -46.3, 13], [4.2, -3.6, -2.2, 0], [5.9, -3.8, -1.5, 0]],
  cam: [[0, [10, 15, -72], [0, 0, -36], 40], [2.6, [14, 20, -64], [0, 0, -30], 42], [4.4, [10, 14, -28], [-3, 1, -6], 40], [5.9, [9, 9, -16], [-3, 1, -4], 40]],
  rings: [{ pid: "rgk", at: 0.3, until: 2.6, color: LIME }, { pid: "rst", at: 2.6, color: LIME }, { pid: "bst", at: 0.8, until: 3, color: BLUE }, { pid: "b10", at: 0.9, until: 3, color: BLUE }, { pid: "brw", at: 1.0, until: 3, color: BLUE }],
  arcs: [{ a: [0, -46.3], b: [-3.6, -2.2], h: 13, at: 2.6, dur: 1.6, color: LIME }],
};

// 9 · COUNTER 2 — caught square: run in behind.
const C2: SceneDef = {
  players: [
    ...BHA_LINE(8).map((p) => (["blb", "blcb", "brcb", "brb"].includes(p.id) ? { ...p, keys: [[0, posAt(p.keys, 0)[0], 8], [4.2, posAt(p.keys, 0)[0], 8], [6.4, posAt(p.keys, 0)[0], 18]] as PKey[] } : p)),
    F("r10", "R", -6, -8, { keys: [[0, -6, -10], [3.4, -5, -6]], tag: "BALL", tagColor: LIME, tagAt: 2.6, tagUntil: 4.6 }),
    F("rrun", "R", 14, 2, { keys: [[0, 14, 2], [3.4, 14, 3], [5.0, 8, 20], [6.4, 4, 30], [7.4, 3, 34]], tag: "RUNNER", tagColor: LIME, tagAt: 2.8 }),
    F("rst", "R", -2, 3, { keys: [[0, -2, 3], [5, -4, 12]] }),
  ],
  ball: [[0, -5.6, -9.2, 0], [3.4, -4.6, -5.3, 0], [3.7, -4.6, -5.3, 0], [5.1, 7.4, 22.5, 0], [7.4, 3, 34.6, 0]],
  cam: [[0, [-16, 7, -18], [2, 0, 8], 40], [3.4, [-14, 8, -12], [4, 0, 12], 42], [7.4, [-10, 8, 14], [3, 0, 32], 40]],
  lines: [
    { pts: [[-30, 8.7], [30, 8.7]], at: 1.0, dur: 0.6, until: 4.6, color: "#ffffff", dashed: true, arrow: false, w: 0.22 },
    { pts: curve([14, 3], [5, 29], -4), at: 3.0, dur: 0.8, color: LIME, dashed: true },
    { pts: [[-4.6, -5.3], [7.4, 22.5]], at: 3.7, dur: 0.6, color: LIME },
  ],
  zones: [{ pts: [[-34, 9.5], [34, 9.5], [34, 30], [-34, 30]], at: 1.4, until: 5.6, color: LIME, opacity: 0.12 }],
  rings: [{ pid: "rrun", at: 2.8, color: LIME }, { pid: "r10", at: 2.6, until: 4.6, color: LIME }],
};

// 10 · COUNTER 3 — press them back: steal at the box edge.
const C3: SceneDef = {
  players: [
    F("bgk", "BGK", 0, 47.5), F("brcb", "B", 13, 44, { keys: [[0, 13, 44], [1.4, 12.5, 43.5]], tag: "BRIGHTON BUILD-UP", tagAt: 0.3, tagUntil: 1.6, tagColor: BLUE }),
    F("blcb", "B", -13, 44), F("b6", "B", 3, 34), F("brb", "B", 26, 32), F("blb", "B", -26, 32),
    F("rf", "R", 6, 30, { keys: [[0, 6, 30], [0.7, 7, 33], [1.6, 11.6, 42.4], [3.0, 7, 42], [3.6, 5.5, 41]], tag: "PRESS", tagColor: LIME, tagAt: 0.6 }),
    F("rf2", "R", -8, 30, { keys: [[0, -8, 30], [1.6, -10, 38]] }), F("rm", "R", 0, 22, { keys: [[0, 0, 22], [2, 2, 32]] }),
  ],
  ball: [[0, 0, 46.8, 0], [0.5, 0, 46.8, 0], [1.4, 12.3, 43.3, 0], [1.75, 11.2, 42.4, 0], [3.0, 6.6, 41.4, 0], [3.25, 6.6, 41.4, 0.6], [3.7, 2.4, 52.7, 0], [6, 2.6, 53.4, 0]],
  cam: [[0, [24, 9, 26], [6, 0, 43], 40], [1.8, [20, 7, 30], [9, 0, 44], 38], [3.6, [14, 4, 32], [4, 1, 50], 38], [6, [12, 4.5, 34], [3, 1, 51], 40]],
  rings: [{ pid: "rf", at: 0.6, color: LIME }, { pid: "brcb", at: 1.3, until: 2.2, color: RED }],
  lines: [
    { pts: curve([7, 33], [11.4, 42], -1.5), at: 0.6, dur: 0.7, until: 3, color: LIME, dashed: true },
    { pts: curve([6.6, 41.4], [2.4, 52.5], 0.8), at: 3.25, dur: 0.4, color: LIME, arrow: false },
  ],
};

// 11 · CTA — wide orbit.
const CTA: SceneDef = {
  players: [...BHA_BUILD(), ...RED_MID()],
  ball: [[0, 1, 15.5, 0]],
  cam: [[0, [30, 34, 44], [0, 0, 6], 46], [3.4, [-26, 36, 48], [0, 0, 4], 46]],
};

// ---------------------------------------------------------------- 2D overlay: captions, cards, cuts
// "[word]" = lime. Lines accumulate within a beat (max 2 shown), words pop in.
type Cap = { t: number; text: string };
const CAPS: Cap[][] = [
  [{ t: 0.25, text: "9 GAMES IN." }, { t: 1.81, text: "BRIGHTON ARE [3RD]" }],
  [{ t: 3.3, text: "WITH [24] GOALS" }, { t: 5.02, text: "AND NOBODY CAN [PLAY THROUGH] THEM" }],
  [{ t: 7.01, text: "HERE'S HOW [HÜRZELER] DOES IT…" }, { t: 8.72, text: "…AND HOW YOU [BEAT] IT" }],
  [{ t: 10.03, text: "IT STARTS WITH [BAIT]" }, { t: 11.59, text: "THE KEEPER [STANDS ON THE BALL]" }],
  [{ t: 13.31, text: "…AND WAITS FOR YOU TO [PRESS]" }],
  [{ t: 15.14, text: "THE MOMENT YOU [JUMP]" }, { t: 16.4, text: "ONE PASS: [FIRST LINE GONE]" }],
  [{ t: 18.82, text: "NOW THEY'RE RUNNING AT" }, { t: 19.6, text: "YOUR [BACK FOUR]" }],
  [{ t: 20.81, text: "LOSE THE BALL…" }, { t: 21.97, text: "…AND THEY [HUNT] YOU" }],
  [{ t: 23.2, text: "PPDA: [7.4]" }, { t: 26.23, text: "[LOWEST] IN THE LEAGUE" }],
  [{ t: 27.73, text: "THEY PUSH YOU [WIDE]" }, { t: 29.6, text: "THE TOUCHLINE = [AN EXTRA MAN]" }],
  [{ t: 32.02, text: "BUT THAT PRESS…" }, { t: 33.13, text: "…HAS A [PRICE]" }],
  [{ t: 34.36, text: "[COUNTER 1]" }, { t: 35.48, text: "DON'T TAKE THE [BAIT]" }],
  [{ t: 36.73, text: "SKIP THEIR [FIRST LINE]" }, { t: 38.44, text: "GO [LONG.] GO [EARLY.]" }],
  [{ t: 40.24, text: "[COUNTER 2]" }, { t: 41.31, text: "THEIR LINE GETS [CAUGHT SQUARE]" }],
  [{ t: 44.76, text: "RUN [IN BEHIND]" }, { t: 46.05, text: "THE SECOND YOU [WIN IT]" }],
  [{ t: 47.61, text: "[COUNTER 3]" }, { t: 48.74, text: "[PRESS] THEM BACK" }],
  [{ t: 53.61, text: "WHICH TEAM DO WE" }, { t: 54.3, text: "[BREAK DOWN] NEXT?" }],
];
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const gi = CAPS.reduce((acc, g, i) => (g[0].t - 0.05 <= t ? i : acc), -1);
  if (gi < 0) return null;
  const g = CAPS[gi];
  const nextT = CAPS[gi + 1]?.[0].t ?? 99;
  const out = 1 - clamp01((t - (nextT - 0.12)) / 0.1);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: out }}>
      {g.filter((l) => l.t - 0.05 <= t).map((l, li) => {
        const parts = l.text.split(/(\[[^\]]+\])/).filter(Boolean);
        let k = 0;
        return (
          <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 18 }}>
            {parts.flatMap((p, pi) => {
              const lime = p.startsWith("[");
              return (lime ? p.slice(1, -1) : p).trim().split(/\s+/).filter(Boolean).map((w, wi) => {
                const i = k++;
                const a = clamp01((t - l.t - i * 0.07) / 0.14);
                return (
                  <span key={`${pi}-${wi}`} style={{ fontFamily: COND, fontSize: 78, lineHeight: 1.08, letterSpacing: "0.01em", color: lime ? LIME : "#ffffff", opacity: a, transform: `scale(${1.25 - 0.25 * a})`, display: "inline-block", textShadow: lime ? `0 0 24px ${LIME}88, 0 4px 14px rgba(0,0,0,0.8)` : "0 4px 14px rgba(0,0,0,0.85)" }}>
                    {w}
                  </span>
                );
              });
            })}
          </div>
        );
      })}
    </div>
  );
};

// Scoreboard-style stat card (reference: NEWCASTLE 0-0 ARSENAL panel).
const Card: React.FC<{ t: number; at: number; until: number; title: string; big: string; sub: string }> = ({ t, at, until, title, big, sub }) => {
  const a = clamp01((t - at) / 0.35) * (1 - clamp01((t - until) / 0.3));
  if (a <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1230, display: "flex", justifyContent: "center", opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
      <div style={{ minWidth: 640, padding: "18px 34px 16px", borderRadius: 18, background: "rgba(6,18,10,0.82)", border: `2px solid ${LIME}66`, boxShadow: `0 0 40px ${LIME}33`, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: "0.3em", color: `${LIME}cc` }}>{title}</div>
        <div style={{ fontFamily: COND, fontSize: 96, lineHeight: 1.05, color: "#fff" }}>{big}</div>
        <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: "0.18em", color: "rgba(255,255,255,0.7)" }}>{sub}</div>
      </div>
    </div>
  );
};

const Hud: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "absolute", left: 70, top: 170, fontFamily: MONO, fontSize: 20, letterSpacing: "0.22em", color: "rgba(255,255,255,0.55)", opacity: clamp01(t / 0.6) }}>
    BRIGHTON · 2026/27 · TACTICS
  </div>
);

const CUTS = [B.how, B.bait, B.pass, B.hunt, B.wide, B.but, B.c1, B.c2, B.c3, B.cta];
const sec = (a: number, b: number) => ({ from: Math.round(a * FPS), durationInFrames: Math.round((b - a) * FPS) });

export const BrightonTactics: React.FC = () => {
  useFonts();
  const t = useCurrentFrame() / FPS;
  const flash = CUTS.reduce((m, c) => Math.max(m, interpolate(t, [c, c + 0.02, c + 0.18], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 0);
  const scenes: [number, number, SceneDef][] = [
    [B.hook, B.how, HOOK], [B.how, B.bait, HOW], [B.bait, B.pass, BAIT], [B.pass, B.hunt, PASS], [B.hunt, B.wide, HUNT],
    [B.wide, B.but, WIDE], [B.but, B.c1, BUT], [B.c1, B.c2, C1], [B.c2, B.c3, C2], [B.c3, B.cta, C3], [B.cta, B.end, CTA],
  ];
  return (
    <AbsoluteFill style={{ background: "#020804" }}>
      {scenes.map(([a, b, def], i) => (
        <Sequence key={i} {...sec(a, b)}>
          <Scene def={def} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)" }} />
      <Hud t={t} />
      <Captions t={t} />
      <Card t={t} at={1.9} until={6.8} title="PREMIER LEAGUE · 9 GAMES" big="3RD · 19 PTS" sub="W6 D1 L2 · 24 FOR · 7 AGAINST" />
      <Card t={t} at={23.3} until={27.6} title="PASSES ALLOWED PER DEFENSIVE ACTION" big="PPDA 7.4" sub="LOWEST IN THE PREMIER LEAGUE" />
      <Card t={t} at={29.0} until={31.9} title="BRIGHTON 2026/27" big="58% POSSESSION" sub="4-2-3-1 · LAST 5 GAMES" />
      <Card t={t} at={50.0} until={53.5} title="CRITICAL LOSSES IN DANGEROUS AREAS" big="34 · 2ND MOST" sub="IN THE PREMIER LEAGUE" />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Audio src={staticFile("brighton-mix.wav")} />
    </AbsoluteFill>
  );
};
