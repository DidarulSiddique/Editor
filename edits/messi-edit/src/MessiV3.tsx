import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import "@fontsource/mrs-saint-delafield/400.css";
import "@fontsource/monsieur-la-doulaise/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/allura/400.css";

// v3 — "Forever Remembered". Rebuilt on the second reference (97d7904d, a high-key
// watercolour character edit): white paper, one pastel tint per shot,
// hand-written script names that write themselves on, ghosted double
// exposures and horizontal whip-blur transitions, cut to the reference's
// own shot timing (two passes of eight shots, ~2 beats each at 152 BPM).
export const FPS = 60;
export const W = 1440;
export const H = 1080;
export const END = 12.45;
export const FRAMES = Math.round(END * FPS);
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);

const NAME = "'Mrs Saint Delafield', cursive";
const HAND = "'Monsieur La Doulaise', cursive";
const TITLE = "Allura, cursive"; // legible script for the title lines
const CAPS = "'Cormorant Garamond', serif";
const INK = "#2a2626";
export const CREATOR = "by.didarul";

// ---------------------------------------------------------------- tints

type Tint = "garnet" | "teal" | "gold" | "sky" | "mono" | "green";
// dark → light duotone ends, how much original colour survives, paper and
// edge colours, and the colour of the script name.
const TINTS: Record<Tint, { dark: string; light: string; sat: number; paper: string; edge: string; name: string }> = {
  garnet: { dark: "#8c1a2b", light: "#fff8f6", sat: 0.35, paper: "#fdf6f4", edge: "#f0c3c8", name: "#c42a42" },
  teal: { dark: "#1c5257", light: "#f6fafa", sat: 0.25, paper: "#f5f8f8", edge: "#c6d5d9", name: "#1d7a78" },
  gold: { dark: "#8f5f06", light: "#fffbea", sat: 0.35, paper: "#fdfaf0", edge: "#ecdfb8", name: "#e6bd14" },
  sky: { dark: "#1a4f8c", light: "#f5fbff", sat: 0.5, paper: "#f2f8fd", edge: "#b7d9f2", name: "#2a6fb8" },
  mono: { dark: "#141414", light: "#f8f8f8", sat: 0, paper: "#f7f7f7", edge: "#d9d9d9", name: INK },
  green: { dark: "#3f8c1c", light: "#f7fdf1", sat: 0.15, paper: "#f3f9ee", edge: "#d3e9c3", name: INK },
};
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);

// Lifted (high-key) duotone: partial desaturate, then map black → dark and
// white → light through a raised mid-point. Footage also gets a light sharpen
// first so the wash does not read as soft.
const TintFilters: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      {(Object.keys(TINTS) as Tint[]).flatMap((k) =>
        [false, true].map((sharp) => {
          const t = TINTS[k];
          const d = hex(t.dark);
          const l = hex(t.light);
          const [m1, m2] = sharp ? [0.48, 0.8] : [0.58, 0.86]; // footage keeps more mid-tone detail
          const table = (i: number) => [d[i], d[i] + (l[i] - d[i]) * m1, d[i] + (l[i] - d[i]) * m2, l[i]].map((v) => v.toFixed(3)).join(" ");
          return (
            <filter id={`${k}${sharp ? "-s" : ""}`} key={`${k}${sharp}`} colorInterpolationFilters="sRGB">
              {sharp ? <feConvolveMatrix order="3" kernelMatrix="0 -0.4 0 -0.4 2.6 -0.4 0 -0.4 0" preserveAlpha="true" result="a" /> : null}
              <feColorMatrix type="saturate" values={String(t.sat)} />
              <feComponentTransfer>
                <feFuncR type="table" tableValues={table(0)} />
                <feFuncG type="table" tableValues={table(1)} />
                <feFuncB type="table" tableValues={table(2)} />
              </feComponentTransfer>
            </filter>
          );
        }),
      )}
      {/* horizontal / vertical motion blur for whips only */}
      {[6, 14, 28, 50, 80].map((d) => (
        <React.Fragment key={d}>
          <filter id={`mx${d}`} x="-20%" width="140%">
            <feGaussianBlur stdDeviation={`${d} 0`} />
          </filter>
          <filter id={`my${d}`} y="-20%" height="140%">
            <feGaussianBlur stdDeviation={`0 ${d}`} />
          </filter>
        </React.Fragment>
      ))}
    </defs>
  </svg>
);
const blurId = (amt: number, axis: "x" | "y") => {
  const steps = [6, 14, 28, 50, 80];
  if (amt < 3) return undefined;
  const d = steps.reduce((a, c) => (Math.abs(c - amt) < Math.abs(a - amt) ? c : a));
  return `url(#m${axis}${d})`;
};

// ---------------------------------------------------------------- shot

type Move = { kind: "whip"; dir: 1 | -1; axis?: "x" | "y" } | { kind: "fade" } | { kind: "cut" } | { kind: "zoomOut"; from: number };

// Paper, edge glow, entry/exit move and a slow push. Children are laid out
// in a 1440x1080 frame.
const Shot: React.FC<{ dur: number; tint: Tint; enter: Move; exit: Move; push?: number; children: React.ReactNode }> = ({
  dur,
  tint,
  enter,
  exit,
  push = 0.045,
  children,
}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const T = TINTS[tint];
  const e = interpolate(t, [0, 0.42], [0, 1], { ...clamp, easing: settle });
  const q = interpolate(t, [dur - 0.12, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  let x = 0;
  let y = 0;
  let scale = 1 + push * (t / dur);
  let opacity = 1;
  let blur: string | undefined;
  if (enter.kind === "whip") {
    const off = (1 - e) * (enter.axis === "y" ? H : W) * 0.32 * -enter.dir;
    if (enter.axis === "y") y += off;
    else x += off;
    blur = blurId(80 * Math.pow(1 - e, 1.6), enter.axis ?? "x");
    opacity = interpolate(t, [0, 0.07], [0.15, 1], clamp);
  } else if (enter.kind === "fade") {
    opacity = interpolate(t, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
    scale *= 1 + 0.07 * (1 - e);
  } else if (enter.kind === "zoomOut") {
    scale *= 1 + (enter.from - 1) * (1 - e);
  }
  if (exit.kind === "whip" && q > 0) {
    const off = q * (exit.axis === "y" ? H : W) * 0.34 * exit.dir;
    if (exit.axis === "y") y += off;
    else x += off;
    blur = blurId(90 * q, exit.axis ?? "x");
    opacity *= 1 - 0.75 * q;
  } else if (exit.kind === "fade") {
    opacity *= 1 - q;
  }
  return (
    <AbsoluteFill style={{ background: T.paper, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity, filter: blur }}>
        {children}
      </AbsoluteFill>
      {/* coloured paper edges, as in the reference's soft vignette */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 80% at 50% 48%, transparent 58%, ${T.edge} 100%)`, opacity: 0.75 }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- media

const DIMS: Record<string, [number, number]> = {
  "12fbf6b3": [1056, 2324],
  "17d36584": [1168, 2092],
  "1fa6cf3b": [1298, 1700],
  "1ffe19d4": [1088, 1910],
  "785a0283": [1332, 2194],
  d735f99e: [1146, 2334],
  d923c80d: [1278, 2368],
};

// Photo as illustration on paper: the full frame very faint behind (texture),
// the cut-out on top, both in the shot's tint, fading out at the bottom.
const Figure: React.FC<{ id: string; tint: Tint; cx: number; cy: number; h: number; ghost?: number; fadeBottom?: number; flip?: boolean; opacity?: number }> = ({
  id,
  tint,
  cx,
  cy,
  h,
  ghost = 0.2,
  fadeBottom = 0.78,
  flip,
  opacity = 1,
}) => {
  const [iw, ih] = DIMS[id];
  const w = (h * iw) / ih;
  const box: React.CSSProperties = { position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, transform: flip ? "scaleX(-1)" : undefined, opacity };
  const fade = `linear-gradient(180deg, #000 ${fadeBottom * 100}%, transparent 100%)`;
  return (
    <>
      {ghost > 0 ? (
        <Img
          src={staticFile(`${id}.png`)}
          style={{ ...box, opacity: ghost * opacity, filter: `url(#${tint})`, maskImage: `radial-gradient(ellipse 50% 50% at 50% 45%, #000 40%, transparent 100%)`, WebkitMaskImage: `radial-gradient(ellipse 50% 50% at 50% 45%, #000 40%, transparent 100%)` }}
        />
      ) : null}
      <Img src={staticFile(`${id}-cut.png`)} style={{ ...box, filter: `url(#${tint})`, maskImage: fade, WebkitMaskImage: fade }} />
    </>
  );
};

// A tight crop of a photo used as a large faded face (the double exposures).
const Ghost: React.FC<{ id: string; tint: Tint; x: number; y: number; w: number; h: number; focus: string; zoom: number; opacity: number; mask?: string }> = ({
  id,
  tint,
  x,
  y,
  w,
  h,
  focus,
  zoom,
  opacity,
  mask = "radial-gradient(ellipse 50% 50% at 50% 50%, #000 35%, transparent 100%)",
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", opacity, maskImage: mask, WebkitMaskImage: mask }}>
    <Img src={staticFile(`${id}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focus, transform: `scale(${zoom})`, transformOrigin: focus, filter: `url(#${tint})` }} />
  </div>
);

type Key = [number, number]; // [source seconds, Messi x as a fraction of the 16:9 frame]

const track = (keys: Key[], t: number) =>
  interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), { ...clamp, easing: Easing.inOut(Easing.quad) });

// 16:9 clip in the 4:3 frame, played at `rate`, cropped to follow Messi.
const Clip: React.FC<{ src: string; start: number; rate: number; keys: Key[]; zoom?: [number, number]; fy?: number; tint: Tint; dur: number; mask?: string; style?: React.CSSProperties; at?: number }> = ({
  src,
  start,
  rate,
  keys,
  zoom = [1, 1],
  fy = 0.5,
  tint,
  dur,
  mask,
  style,
  at,
}) => {
  const f = useCurrentFrame();
  const st = start + (f / FPS) * rate;
  const z = interpolate(f / FPS, [0, dur], zoom, { ...clamp, easing: inOut });
  const vw = 1920 * z;
  const vh = 1080 * z;
  // `at`: put Messi at this screen x even if the clip edge shows (masked).
  const left = at !== undefined ? at - track(keys, st) * vw : Math.min(0, Math.max(W - vw, W / 2 - track(keys, st) * vw));
  const top = Math.min(0, Math.max(H - vh, H / 2 - fy * vh));
  return (
    <AbsoluteFill style={{ overflow: "hidden", maskImage: mask, WebkitMaskImage: mask, ...style }}>
      <Freeze frame={Math.round(st * FPS)}>
        <OffthreadVideo src={staticFile(src)} muted style={{ position: "absolute", left, top, width: vw, height: vh, filter: `url(#${tint}-s)` }} />
      </Freeze>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- type

// Hand-written word that writes itself on left → right, with the faint
// offset echo the reference uses under its names.
const Script: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  at: number;
  dur?: number;
  font?: string;
  echo?: boolean;
  rotate?: number;
  opacity?: number;
}> = ({ text, x, y, size, color, at, dur = 0.45, font = NAME, echo = true, rotate = -3, opacity = 1 }) => {
  const t = useCurrentFrame() / FPS;
  const p = interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  if (p <= 0) return null;
  const edge = p * 112 - 10;
  const mask = `linear-gradient(100deg, #000 ${edge}%, transparent ${edge + 10}%)`;
  const drift = interpolate(t, [at, at + 1.2], [0, 10], clamp);
  const word = (extra: React.CSSProperties) => (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: font,
        fontSize: size,
        lineHeight: 1,
        color,
        whiteSpace: "nowrap",
        padding: "0.25em 0.35em",
        transform: `translate(${drift}px, -50%) rotate(${rotate}deg)`,
        maskImage: mask,
        WebkitMaskImage: mask,
        ...extra,
      }}
    >
      {text}
    </div>
  );
  return (
    <>
      {echo ? word({ opacity: 0.13 * opacity, top: y + size * 0.42, left: x + size * 0.08 }) : null}
      {word({ opacity })}
    </>
  );
};

// Small tracked capitals under a name: the editorial caption.
const Caption: React.FC<{ text: string; x: number; y: number; color: string; at: number; align?: "left" | "right" }> = ({ text, x, y, color, at, align = "left" }) => {
  const t = useCurrentFrame() / FPS;
  const p = interpolate(t, [at, at + 0.4], [0, 1], { ...clamp, easing: settle });
  return (
    <div
      style={{
        position: "absolute",
        left: align === "left" ? x : undefined,
        right: align === "right" ? W - x : undefined,
        top: y,
        fontFamily: CAPS,
        fontWeight: 600,
        fontSize: 24,
        letterSpacing: `${0.34 + (1 - p) * 0.3}em`,
        color,
        opacity: 0.85 * p,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "inline-block", width: 34 * p, height: 1.5, background: color, verticalAlign: "middle", marginRight: 14 }} />
      {text}
    </div>
  );
};

// ---------------------------------------------------------------- shots
// Name card: figure on one side, name written on the other.
type CardProps = {
  dur: number;
  tint: Tint;
  enter: Move;
  exit: Move;
  children: React.ReactNode;
};
const Card: React.FC<CardProps> = ({ dur, tint, enter, exit, children }) => (
  <Shot dur={dur} tint={tint} enter={enter} exit={exit}>
    {children}
  </Shot>
);

// Opening: blank paper, a hairline frame draws itself in.
const Open: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useCurrentFrame() / FPS;
  const p = interpolate(t, [0.03, dur - 0.03], [0, 1], { ...clamp, easing: inOut });
  const per = 2 * (W - 160 + H - 160);
  return (
    <AbsoluteFill style={{ background: "#fbfaf8" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, #fff 55%, #efe9e6 100%)" }} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <rect x={80} y={80} width={W - 160} height={H - 160} fill="none" stroke="#d8cfcb" strokeWidth={1.5} strokeDasharray={per} strokeDashoffset={per * (1 - p)} />
      </svg>
    </AbsoluteFill>
  );
};

// White wash over the text side so script sits on clean paper.
const Wash: React.FC<{ side: "left" | "right"; paper: string; from?: number; to?: number }> = ({ side, paper, from = 38, to = 72 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(${side === "right" ? 90 : 270}deg, transparent ${from}%, ${paper} ${to}%)` }} />
);

// Huge faint numeral behind the figure: a quiet second layer of type.
const Numeral: React.FC<{ text: string; x: number; y: number; color: string; size?: number }> = ({ text, x, y, color, size = 520 }) => {
  const t = useCurrentFrame() / FPS;
  const p = interpolate(t, [0.05, 0.6], [0, 1], { ...clamp, easing: settle });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateX(${(1 - p) * 60}px)`,
        fontFamily: CAPS,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        color: "transparent",
        WebkitTextStroke: `1.5px ${color}`,
        opacity: 0.22 * p,
      }}
    >
      {text}
    </div>
  );
};

// Paper haze over broadcast clutter: scoreboard (top) and channel bug
// (bottom-left); for sky shots the top reads as bright sky.
const Haze: React.FC<{ paper: string; sky?: boolean }> = ({ paper, sky }) => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${paper} 0%, ${paper}${sky ? "e6" : "cc"} 9%, transparent ${sky ? 30 : 22}%)` }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 22% 20% at 4% 96%, ${paper} 45%, transparent 100%)` }} />
  </>
);

// Diagonal chequered floor (the reference's checker plate), faded at its edges.
const Checker: React.FC<{ opacity?: number }> = ({ opacity = 0.75 }) => (
  <div style={{ position: "absolute", left: -500, top: 380, width: 1500, height: 1100, opacity, maskImage: "radial-gradient(ellipse 50% 45% at 40% 45%, #000 30%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 50% 45% at 40% 45%, #000 30%, transparent 100%)" }}>
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "repeating-conic-gradient(#232323 0 25%, #f2f2f2 0 50%) 0 0 / 170px 170px",
        transform: "perspective(1000px) rotateX(52deg) rotateZ(-30deg)",
      }}
    />
  </div>
);

// ---------------------------------------------------------------- the edit

const P2 = 5.97; // second pass starts here
const C = {
  a1: 0.43, a2: 1.13, a3: 1.92, a4: 2.6, a5: 3.43, a6: 4.23, a7: 5.0, a8: 5.71,
  b1: P2, b2: 6.6, b3: 7.4, b4: 8.1, b5: 8.9, b6: 9.73, b7: 10.5, b8: 11.1, black: 11.2,
};

const N5: Key[] = [[2.4, 0.6], [2.8, 0.62], [3.2, 0.66], [3.6, 0.7]];
const N3A: Key[] = [[2.4, 0.42], [2.8, 0.45], [3.2, 0.41], [3.6, 0.42]];
const N3B: Key[] = [[6.0, 0.53], [6.1, 0.41], [6.2, 0.33], [6.3, 0.27], [6.4, 0.27], [6.5, 0.35], [6.6, 0.4], [6.7, 0.47]];
const N1: Key[] = [[4.95, 0.45], [5.3, 0.47]];
const N1W: Key[] = [[6.0, 0.6], [7.0, 0.6]];
const N2: Key[] = [[9.0, 0.74], [9.45, 0.74]];

type Scene = [number, number, React.FC<{ dur: number }>];

// A trio of footage + big tinted face, then a punch-in with the checker floor.
const Fade1: React.FC<{ dur: number; tight?: boolean; flicker?: boolean; base: React.ReactNode; over: React.ReactNode; title: string; enter: Move; exit: Move }> = ({
  dur,
  tight,
  flicker,
  base,
  over,
  title,
  enter,
  exit,
}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const alt = flicker && t < 0.22 && Math.floor(f / 4) % 2 === 1;
  const zoomed = tight && !alt;
  return (
    <Shot dur={dur} tint="green" enter={enter} exit={exit} push={0.03}>
      <AbsoluteFill style={{ transform: zoomed ? "scale(1.22) translate(-60px, -40px)" : undefined, transformOrigin: "60% 40%" }}>
        <AbsoluteFill style={{ opacity: 0.8 }}>{base}</AbsoluteFill>
        {tight ? <Checker /> : null}
        <AbsoluteFill>{over}</AbsoluteFill>
      </AbsoluteFill>
      {tight ? (
        <>
          <Script text={title.split(" ")[0]} x={40} y={300} size={190} color={INK} font={TITLE} at={-1} echo={false} opacity={0.5} />
          <Script text={title} x={110} y={450} size={112} color={INK} font={TITLE} at={-1} />
        </>
      ) : (
        <Script text={title} x={60} y={330} size={112} color={INK} font={TITLE} at={0.12} dur={0.55} />
      )}
    </Shot>
  );
};

const bottomUp = "linear-gradient(0deg, #000 35%, transparent 80%)";
const topRight = "radial-gradient(ellipse 48% 70% at 64% 36%, #000 35%, transparent 100%)";

const SCENES: Scene[] = [
  [0, C.a1, ({ dur }) => <Open dur={dur} />],
  // ---- pass 1: who he is
  [
    C.a1,
    C.a2,
    ({ dur }) => (
      <Card dur={dur} tint="garnet" enter={{ kind: "whip", dir: 1 }} exit={{ kind: "whip", dir: 1 }}>
        <Numeral text="10" x={1240} y={560} color={TINTS.garnet.dark} />
        <Figure id="785a0283" tint="garnet" cx={400} cy={290} h={1700} ghost={0.28} />
        <Wash side="right" paper={TINTS.garnet.paper} from={45} to={78} />
        <Script text="Lionel" x={840} y={380} size={190} color={TINTS.garnet.name} at={0.06} />
        <Caption text="FC BARCELONA · 2004 — 2021" x={910} y={560} color={TINTS.garnet.dark} at={0.35} />
      </Card>
    ),
  ],
  [
    C.a2,
    C.a3,
    ({ dur }) => (
      <Card dur={dur} tint="teal" enter={{ kind: "whip", dir: -1 }} exit={{ kind: "whip", dir: 1, axis: "y" }}>
        <Ghost id="1fa6cf3b" tint="teal" x={-120} y={0} w={760} h={1080} focus="45% 22%" zoom={1.6} opacity={0.2} />
        <Numeral text="2022" x={330} y={330} color={TINTS.teal.dark} size={320} />
        <Figure id="1fa6cf3b" tint="teal" cx={1040} cy={560} h={1180} ghost={0.25} />
        <Wash side="left" paper={TINTS.teal.paper} from={40} to={75} />
        <Script text="Andrés" x={110} y={700} size={180} color={TINTS.teal.name} at={0.1} />
        <Caption text="CAMPEÓN DEL MUNDO · QATAR 2022" x={190} y={870} color={TINTS.teal.dark} at={0.4} />
      </Card>
    ),
  ],
  [
    C.a3,
    C.a4,
    ({ dur }) => (
      <Card dur={dur} tint="gold" enter={{ kind: "fade" }} exit={{ kind: "cut" }}>
        <Ghost id="d923c80d" tint="gold" x={-80} y={-60} w={700} h={1100} focus="50% 30%" zoom={1.2} opacity={0.16} />
        <Numeral text="1987" x={1050} y={820} color={TINTS.gold.dark} size={300} />
        <Figure id="d735f99e" tint="gold" cx={470} cy={365} h={1710} ghost={0.18} fadeBottom={0.8} />
        <Script text="Messi" x={800} y={560} size={200} color={TINTS.gold.name} at={0.08} />
        <Script text="Rosario…" x={1010} y={330} size={54} color={INK} font={HAND} at={0.35} dur={0.5} echo={false} opacity={0.7} />
      </Card>
    ),
  ],
  [
    C.a4,
    C.a5,
    ({ dur }) => (
      <Shot dur={dur} tint="gold" enter={{ kind: "zoomOut", from: 1.45 }} exit={{ kind: "whip", dir: 1 }} push={0.02}>
        <Ghost id="785a0283" tint="gold" x={-60} y={-80} w={640} h={640} focus="52% 30%" zoom={1.5} opacity={0.55} />
        <Ghost id="1fa6cf3b" tint="gold" x={-40} y={520} w={620} h={620} focus="40% 25%" zoom={1.3} opacity={0.5} />
        <Ghost id="12fbf6b3" tint="gold" x={760} y={470} w={620} h={700} focus="50% 12%" zoom={2.2} opacity={0.5} />
        <Figure id="d735f99e" tint="gold" cx={560} cy={457} h={1354} ghost={0} fadeBottom={0.8} />
        <Script text="Rosario, 1987…" x={860} y={230} size={78} color={INK} font={HAND} at={0.05} dur={0.6} echo={false} />
        <Script text="La Pulga —" x={1030} y={350} size={70} color={INK} font={HAND} at={0.5} dur={0.3} echo={false} />
      </Shot>
    ),
  ],
  [
    C.a5,
    C.a6,
    ({ dur }) => (
      <Shot dur={dur} tint="sky" enter={{ kind: "whip", dir: 1 }} exit={{ kind: "zoomOut", from: 1 }} push={0}>
        <Clip src="n5.mp4" start={2.55} rate={0.55} keys={N5} zoom={[1.18, 1.42]} fy={0.48} tint="sky" dur={dur} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 55% 45%, transparent 55%, #f2f8fd 100%)" }} />
        <Haze paper={TINTS.sky.paper} sky />
      </Shot>
    ),
  ],
  [
    C.a6,
    C.a7,
    ({ dur }) => (
      <Fade1
        dur={dur}
        title="Forever Remembered"
        enter={{ kind: "whip", dir: -1 }}
        exit={{ kind: "cut" }}
        base={<Clip src="n3.mp4" start={2.6} rate={0.5} keys={N3A} zoom={[1.25, 1.3]} fy={0.5} tint="mono" dur={dur} mask={bottomUp} style={{ top: 160 }} />}
        over={<Clip src="n2.mp4" start={9.0} rate={0.3} keys={N2} zoom={[1.45, 1.5]} fy={0.52} at={880} tint="green" dur={dur} mask={topRight} />}
      />
    ),
  ],
  [
    C.a7,
    C.a8,
    ({ dur }) => (
      <Fade1
        dur={dur}
        tight
        title="Forever Remembered"
        enter={{ kind: "cut" }}
        exit={{ kind: "whip", dir: 1 }}
        base={<Clip src="n3.mp4" start={2.98} rate={0.5} keys={N3A} zoom={[1.3, 1.34]} fy={0.5} tint="mono" dur={dur} mask={bottomUp} style={{ top: 160 }} />}
        over={<Clip src="n2.mp4" start={9.23} rate={0.3} keys={N2} zoom={[1.5, 1.54]} fy={0.52} at={880} tint="green" dur={dur} mask={topRight} />}
      />
    ),
  ],
  [C.a8, C.b1, () => <AbsoluteFill style={{ background: "linear-gradient(90deg, #fdf3f3, #fff 50%, #fbeef0)" }} />],
  // ---- pass 2: where he's been
  [
    C.b1,
    C.b2,
    ({ dur }) => (
      <Card dur={dur} tint="garnet" enter={{ kind: "whip", dir: 1 }} exit={{ kind: "whip", dir: 1 }}>
        <Numeral text="672" x={1180} y={600} color={TINTS.garnet.dark} size={340} />
        <Figure id="1ffe19d4" tint="garnet" cx={420} cy={465} h={1500} ghost={0.3} />
        <Wash side="right" paper={TINTS.garnet.paper} from={45} to={78} />
        <Script text="Barcelona" x={740} y={360} size={170} color={TINTS.garnet.name} at={0.04} dur={0.4} />
        <Caption text="672 GOALS · 778 GAMES" x={830} y={530} color={TINTS.garnet.dark} at={0.3} />
      </Card>
    ),
  ],
  [
    C.b2,
    C.b3,
    ({ dur }) => (
      <Card dur={dur} tint="teal" enter={{ kind: "whip", dir: -1 }} exit={{ kind: "whip", dir: 1, axis: "y" }}>
        <Ghost id="12fbf6b3" tint="teal" x={-120} y={-40} w={760} h={1120} focus="50% 14%" zoom={2.0} opacity={0.2} />
        <Numeral text="10" x={330} y={360} color={TINTS.teal.dark} />
        <Figure id="12fbf6b3" tint="teal" cx={1060} cy={600} h={1260} ghost={0.25} />
        <Wash side="left" paper={TINTS.teal.paper} from={40} to={75} />
        <Script text="Argentina" x={70} y={690} size={170} color={TINTS.teal.name} at={0.1} />
        <Caption text="COPA AMÉRICA" x={170} y={850} color={TINTS.teal.dark} at={0.4} />
      </Card>
    ),
  ],
  [
    C.b3,
    C.b4,
    ({ dur }) => (
      <Shot dur={dur} tint="gold" enter={{ kind: "fade" }} exit={{ kind: "cut" }}>
        <Clip src="n1.mp4" start={4.95} rate={0.5} keys={N1} zoom={[1.08, 1.14]} fy={0.38} at={560} tint="gold" dur={dur} mask="linear-gradient(90deg, #000 48%, transparent 86%)" />
        <Haze paper={TINTS.gold.paper} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 70% at 30% 45%, transparent 50%, #fdfaf0 100%)" }} />
        <Script text="Leo" x={930} y={600} size={230} color={TINTS.gold.name} at={0.08} />
        <Script text="Forever…" x={1100} y={330} size={54} color={INK} font={HAND} at={0.35} dur={0.4} echo={false} opacity={0.7} />
      </Shot>
    ),
  ],
  [
    C.b4,
    C.b5,
    ({ dur }) => (
      <Shot dur={dur} tint="gold" enter={{ kind: "zoomOut", from: 1.45 }} exit={{ kind: "whip", dir: 1 }} push={0.02}>
        <Ghost id="1fa6cf3b" tint="gold" x={-60} y={-80} w={640} h={640} focus="42% 22%" zoom={1.4} opacity={0.5} />
        <Ghost id="785a0283" tint="gold" x={-40} y={520} w={620} h={620} focus="52% 30%" zoom={1.5} opacity={0.5} />
        <Ghost id="d923c80d" tint="gold" x={780} y={470} w={600} h={700} focus="50% 30%" zoom={1.4} opacity={0.45} />
        <Figure id="17d36584" tint="gold" cx={570} cy={560} h={1150} ghost={0} fadeBottom={0.8} />
        <Script text="Forever Remembered…" x={760} y={230} size={72} color={INK} font={TITLE} at={0.05} dur={0.55} echo={false} />
        <Script text="since 2004 —" x={1020} y={350} size={70} color={INK} font={HAND} at={0.45} dur={0.3} echo={false} />
      </Shot>
    ),
  ],
  [
    C.b5,
    C.b6,
    ({ dur }) => (
      <Shot dur={dur} tint="sky" enter={{ kind: "whip", dir: 1 }} exit={{ kind: "zoomOut", from: 1 }} push={0}>
        <Clip src="n3.mp4" start={6.0} rate={0.7} keys={N3B} zoom={[1.2, 1.4]} fy={0.5} tint="sky" dur={dur} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 55%, #f2f8fd 100%)" }} />
        <Haze paper={TINTS.sky.paper} sky />
      </Shot>
    ),
  ],
  [
    C.b6,
    C.b7,
    ({ dur }) => (
      <Fade1
        dur={dur}
        title="Forever Remembered"
        enter={{ kind: "whip", dir: -1 }}
        exit={{ kind: "cut" }}
        base={<Clip src="n1.mp4" start={6.05} rate={0.5} keys={N1W} zoom={[1.1, 1.15]} fy={0.45} tint="mono" dur={dur} mask={bottomUp} style={{ top: 120 }} />}
        over={<Figure id="d923c80d" tint="green" cx={1040} cy={470} h={1150} ghost={0.35} fadeBottom={0.6} />}
      />
    ),
  ],
  [
    C.b7,
    C.b8,
    ({ dur }) => (
      <Fade1
        dur={dur}
        tight
        flicker
        title="Forever Remembered"
        enter={{ kind: "cut" }}
        exit={{ kind: "whip", dir: 1 }}
        base={<Clip src="n1.mp4" start={6.43} rate={0.5} keys={N1W} zoom={[1.15, 1.18]} fy={0.45} tint="mono" dur={dur} mask={bottomUp} style={{ top: 120 }} />}
        over={<Figure id="d923c80d" tint="green" cx={1040} cy={470} h={1150} ghost={0.35} fadeBottom={0.6} />}
      />
    ),
  ],
  [C.b8, C.black, () => <AbsoluteFill style={{ background: "#fbf7f6" }} />],
  [
    C.black,
    END,
    ({ dur }) => {
      const t = useCurrentFrame() / FPS;
      return (
        <AbsoluteFill style={{ background: "#000", opacity: interpolate(t, [dur - 0.25, dur], [1, 1], clamp) }}>
          <div style={{ opacity: interpolate(t, [dur - 0.35, dur - 0.05], [1, 0], clamp) }}>
            <Script text={CREATOR} x={W / 2 - 150} y={H / 2} size={64} color="#d8d4d0" font={HAND} at={0.15} dur={0.5} echo={false} rotate={-2} />
          </div>
        </AbsoluteFill>
      );
    },
  ],
];

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "multiply", pointerEvents: "none" }}>
      <svg width={W} height={H}>
        <filter id="grain3">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 3) % 8} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain3)" />
      </svg>
    </AbsoluteFill>
  );
};

export const MessiV3: React.FC = () => {
  const f = useCurrentFrame();
  // A tiny white bloom on each hard cut, like the reference's frame blends.
  const cuts = [C.a1, C.a2, C.a3, C.a5, C.a6, C.b1, C.b2, C.b3, C.b5, C.b6].map(s);
  const since = Math.min(...cuts.map((c) => (f >= c ? f - c : 99)));
  const flash = since < 4 ? [0.35, 0.2, 0.1, 0.04][since] : 0;
  return (
    <AbsoluteFill style={{ background: "#fbfaf8" }}>
      <TintFilters />
      {SCENES.map(([a, b, Scene], i) => (
        <Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)}>
          <Scene dur={(s(b) - s(a)) / FPS} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "#fff", opacity: f < s(C.black) ? flash : 0 }} />
      {f < s(C.black) ? <Grain /> : null}
      <Audio src={staticFile("fade.wav")} />
    </AbsoluteFill>
  );
};
