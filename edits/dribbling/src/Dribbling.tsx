import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/900.css";

// "The Art of Dribbling" — six skills, built on the editing language of the
// anime power-systems reference (e1f66500): glowing title open with cycling
// keywords, one colour per concept, a title card with diagonal ribbons for
// each section, white-flash whip cuts, a split-panel recap and a white end
// card. Each skill gets a freeze-frame breakdown drawn on the real frame.
export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const END = 61.0;
export const FRAMES = Math.round(END * FPS);
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const snap = Easing.bezier(0.7, 0, 0.2, 1);

const DISPLAY = "Anton, sans-serif";
const UI = "Inter, sans-serif";
const HANDLE = "BRIGHTONBOYEDITS";

// Section starts sit on the music's own section changes (reference cuts at
// 3.27, 10.30, 17.30, 24.27, 31.20, 38.13, 45.13, 52.13, 58.95 s).
const AT = { open: 0, s: [3.27, 10.3, 17.3, 24.27, 31.2, 38.13], recap: 45.13, final: 52.13, end: 58.95 };
const CUTS = [...AT.s, AT.recap, AT.final, AT.end];
const HITS = [1.3, 3.62, 5.25, 9.2, 12.03, 16.37, 21.48, 23.34, 26.98, 28.61, 31.7, 35.48, 36.97, 46.16, 48.48, 50.6, 56.38, 58.28];

// ---------------------------------------------------------------- footage

type K = [number, number]; // [local seconds, source seconds] — time remap
type Z = [number, number]; // [local seconds, zoom]

const FOOTAGE_FILTER = "url(#sharp) contrast(1.1) saturate(1.18) brightness(1.03)";

// A 16:9 clip, time-remapped through `keys` (two keys with the same source
// time = a freeze), zoomed about `focus`. Children share the transform, so
// annotations drawn in 1920x1080 frame coordinates stay pinned to the image.
const Footage: React.FC<{
  src: string;
  keys: K[];
  zoom?: Z[];
  focus?: [number, number];
  whip?: boolean;
  t0?: number; // section time at which this sequence starts
  children?: (t: number) => React.ReactNode;
}> = ({ src, keys, zoom = [[0, 1.04]], focus = [0.5, 0.5], whip = true, t0 = 0, children }) => {
  const f = useCurrentFrame();
  const t = t0 + f / FPS;
  const st = interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), clamp);
  const z = zoom.length > 1 ? interpolate(t, zoom.map((k) => k[0]), zoom.map((k) => k[1]), { ...clamp, easing: Easing.inOut(Easing.cubic) }) : zoom[0][1];
  const w = whip ? interpolate(f, [0, 9], [1, 0], { ...clamp, easing: settle }) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z * (1 + 0.16 * w)})`, transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`, filter: w > 0.15 ? blurX(w * 60) : undefined }}>
        <Freeze frame={Math.max(0, Math.round(st * FPS))}>
          <OffthreadVideo src={staticFile(src)} muted style={{ width: W, height: H, filter: FOOTAGE_FILTER }} />
        </Freeze>
        {children?.(t)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const blurX = (amt: number) => {
  const steps = [8, 20, 40, 70];
  const d = steps.reduce((a, c) => (Math.abs(c - amt) < Math.abs(a - amt) ? c : a));
  return `url(#bx${d})`;
};

// ---------------------------------------------------------------- shared art

const Defs: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="sharp">
        <feConvolveMatrix order="3" kernelMatrix="0 -0.35 0 -0.35 2.4 -0.35 0 -0.35 0" preserveAlpha="true" />
      </filter>
      {[8, 20, 40, 70].map((d) => (
        <filter id={`bx${d}`} key={d} x="-10%" width="120%">
          <feGaussianBlur stdDeviation={`${d} 0`} />
        </filter>
      ))}
      {[10, 5].map((d) => (
        <filter id={`rgb${d}`} key={d} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={d} result="ro" />
          <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-d} result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bo" mode="screen" />
        </filter>
      ))}
    </defs>
  </svg>
);

const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);

// Section colour washed into the edges (the reference's coloured atmosphere).
const Atmos: React.FC<{ color: string; amount: number }> = ({ color, amount }) => (
  <AbsoluteFill style={{ opacity: amount, mixBlendMode: "screen", background: `radial-gradient(ellipse 60% 70% at 100% 0%, ${color}66, transparent 70%), radial-gradient(ellipse 50% 60% at 0% 100%, ${color}55, transparent 70%)` }} />
);

const Glow = (c: string, k = 1) => `0 0 ${10 * k}px ${c}, 0 0 ${30 * k}px ${c}aa, 0 0 ${70 * k}px ${c}66`;

// ---------------------------------------------------------------- type

// Word revealed by a skewed mask moving left → right, with RGB fringe.
const MaskWord: React.FC<{
  text: string;
  at: number;
  t: number;
  size: number;
  color?: string;
  glow?: string;
  font?: string;
  tracking?: string;
  dur?: number;
  fringe?: boolean;
  style?: React.CSSProperties;
}> = ({ text, at, t, size, color = "#fff", glow, font = DISPLAY, tracking = "0.01em", dur = 0.35, fringe = true, style }) => {
  const p = interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: settle });
  if (p <= 0) return null;
  const edge = p * 120 - 10;
  const mask = `linear-gradient(105deg, #000 ${edge}%, transparent ${edge + 8}%)`;
  const base: React.CSSProperties = { fontFamily: font, fontSize: size, lineHeight: 1, letterSpacing: tracking, whiteSpace: "nowrap", textTransform: "uppercase" };
  const fr = fringe ? interpolate(t, [at, at + 0.4], [8, 0], clamp) : 0;
  return (
    <div style={{ position: "relative", maskImage: mask, WebkitMaskImage: mask, transform: `translateX(${(1 - p) * -30}px)`, ...style }}>
      {fr > 0.5 ? (
        <>
          <div style={{ ...base, position: "absolute", color: "#ff2a55", opacity: 0.7, transform: `translateX(${fr}px)`, mixBlendMode: "screen" }}>{text}</div>
          <div style={{ ...base, position: "absolute", color: "#22e4ff", opacity: 0.7, transform: `translateX(${-fr}px)`, mixBlendMode: "screen" }}>{text}</div>
        </>
      ) : null}
      <div style={{ ...base, position: "relative", color, textShadow: glow ? Glow(glow) : undefined }}>{text}</div>
    </div>
  );
};

const Tracked: React.FC<{ text: string; t: number; at: number; size?: number; color?: string; spacing?: number; weight?: number }> = ({
  text,
  t,
  at,
  size = 22,
  color = "#fff",
  spacing = 0.45,
  weight = 700,
}) => {
  const p = interpolate(t, [at, at + 0.5], [0, 1], { ...clamp, easing: settle });
  return (
    <div style={{ fontFamily: UI, fontWeight: weight, fontSize: size, letterSpacing: `${spacing + (1 - p) * 0.4}em`, color, opacity: p, whiteSpace: "nowrap", textTransform: "uppercase" }}>
      {text}
    </div>
  );
};

// ---------------------------------------------------------------- section card

// Diagonal ribbons with the skill name scrolling along them.
const Ribbons: React.FC<{ t: number; name: string; color: string; out: number }> = ({ t, name, color, out }) => {
  const rows = [
    { y: 250, h: 70, fill: true, dir: 1, delay: 0.0 },
    { y: 520, h: 46, fill: false, dir: -1, delay: 0.06 },
    { y: 760, h: 78, fill: true, dir: 1, delay: 0.1 },
    { y: 1010, h: 50, fill: false, dir: -1, delay: 0.14 },
  ];
  const label = Array.from({ length: 14 }, () => `${name}  +  `).join("");
  return (
    <AbsoluteFill style={{ transform: "rotate(-17deg) scale(1.25)", transformOrigin: "50% 50%" }}>
      {rows.map((r, i) => {
        const inP = interpolate(t, [r.delay, r.delay + 0.45], [0, 1], { ...clamp, easing: settle });
        const outP = interpolate(t, [out - 0.3 + r.delay * 0.5, out + r.delay * 0.5], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
        const x = (1 - inP) * -2600 * r.dir + outP * 2600 * r.dir - (t * 90 * r.dir) % 600 - 600;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: r.y - r.h / 2,
              width: 4200,
              height: r.h,
              background: r.fill ? `linear-gradient(90deg, ${color}ee, ${color}bb)` : "transparent",
              border: r.fill ? undefined : `2px solid ${color}cc`,
              boxShadow: r.fill ? `0 0 30px ${color}88` : `0 0 18px ${color}55`,
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <div style={{ fontFamily: DISPLAY, fontSize: r.h * 0.62, letterSpacing: "0.12em", color: r.fill ? "#fff" : color, whiteSpace: "nowrap", paddingLeft: 20, textShadow: r.fill ? "0 2px 0 rgba(0,0,0,0.25)" : Glow(color, 0.4) }}>
              {label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Small geometric accents that pop in around the card.
const Accents: React.FC<{ t: number; color: string; seed: string; out: number }> = ({ t, color, seed, out }) => {
  const items = [
    { x: 1500, y: 140, k: "plus" },
    { x: 1700, y: 520, k: "ring" },
    { x: 1250, y: 880, k: "plus" },
    { x: 420, y: 980, k: "tri" },
    { x: 1820, y: 280, k: "zig" },
    { x: 980, y: 90, k: "ring" },
    { x: 140, y: 610, k: "plus" },
  ];
  const vis = interpolate(t, [out - 0.2, out], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: vis }}>
      <svg width={W} height={H}>
        {items.map((it, i) => {
          const at = 0.15 + random(`${seed}${i}`) * 0.5;
          const p = interpolate(t, [at, at + 0.25], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
          const dy = Math.sin((t + i) * 2.2) * 6;
          const g = `translate(${it.x}, ${it.y + dy}) scale(${p}) rotate(${t * 40 * (i % 2 ? 1 : -1)})`;
          const st = { stroke: color, strokeWidth: 4, fill: "none", filter: `drop-shadow(0 0 6px ${color})` } as const;
          return (
            <g key={i} transform={g}>
              {it.k === "plus" ? <path d="M-16 0H16M0 -16V16" {...st} stroke="#fff" /> : null}
              {it.k === "ring" ? <circle r={20} {...st} /> : null}
              {it.k === "tri" ? <path d="M0 -18L16 12H-16Z" {...st} /> : null}
              {it.k === "zig" ? <path d="M-30 8L-15 -8L0 8L15 -8L30 8" {...st} stroke="#fff" /> : null}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

type Def = {
  n: number;
  name: string;
  sub: string;
  tag: string;
  color: string;
  dur: number;
  titleEnd: number;
  steps: [string, string, string];
  stepsAt: number;
  stepsEnd: number;
  word: string;
  wordAt: number;
  segs: { src: string; from: number; to: number; keys: K[]; zoom?: Z[]; focus?: [number, number]; ann?: (t: number) => React.ReactNode }[];
};

const TitleCard: React.FC<{ d: Def; t: number }> = ({ d, t }) => {
  const out = interpolate(t, [d.titleEnd - 0.25, d.titleEnd], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bar = interpolate(t, [0.05, 0.45], [0, 1], { ...clamp, easing: settle });
  return (
    <AbsoluteFill>
      <Ribbons t={t} name={d.name} color={d.color} out={d.titleEnd} />
      <Accents t={t} color={d.color} seed={d.name} out={d.titleEnd} />
      {/* title plate, top-left */}
      <div style={{ position: "absolute", left: 90, top: 70, transform: `translateX(${-out * 900}px)`, opacity: 1 - out }}>
        <div style={{ position: "absolute", left: -40, top: -20, width: 1000 * bar, height: 330, background: "linear-gradient(90deg, rgba(8,8,14,0.92) 0%, rgba(8,8,14,0.85) 55%, rgba(8,8,14,0) 100%)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 40, color: d.color, textShadow: Glow(d.color, 0.5) }}>{String(d.n).padStart(2, "0")}</div>
          <div style={{ width: 120 * bar, height: 3, background: d.color, boxShadow: Glow(d.color, 0.4) }} />
          <Tracked text={`Skill ${d.n} of 6`} t={t} at={0.1} size={20} />
        </div>
        <MaskWord text={d.name} at={0.12} t={t} size={150} glow={d.color} style={{ transform: "skewX(-8deg)", marginTop: 4 }} />
        <div style={{ marginTop: 10 }}>
          <Tracked text={d.sub} t={t} at={0.3} size={26} weight={900} spacing={0.32} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Tracked text={d.tag} t={t} at={0.45} size={17} weight={500} spacing={0.3} color="#ffffffb0" />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// After the card: corner chip + six-step progress, kept small.
const Hud: React.FC<{ d: Def; t: number }> = ({ d, t }) => {
  const p = interpolate(t, [d.titleEnd, d.titleEnd + 0.35], [0, 1], { ...clamp, easing: settle });
  const q = interpolate(t, [d.dur - 0.2, d.dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: p * q }}>
      <div style={{ position: "absolute", left: 70, top: 56, display: "flex", alignItems: "center", gap: 14, transform: `translateX(${(1 - p) * -40}px)` }}>
        <div style={{ width: 6, height: 44, background: d.color, boxShadow: Glow(d.color, 0.5) }} />
        <div style={{ fontFamily: DISPLAY, fontSize: 40, color: "#fff", letterSpacing: "0.03em", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          <span style={{ color: d.color }}>{String(d.n).padStart(2, "0")}</span> {d.name}
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 72, display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ width: 44, height: 6, background: i === d.n ? d.color : i < d.n ? "#ffffffaa" : "#ffffff33", boxShadow: i === d.n ? Glow(d.color, 0.4) : undefined }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Three-step mechanics strip, bottom-left.
const Steps: React.FC<{ d: Def; t: number }> = ({ d, t }) => {
  const q = interpolate(t, [d.stepsEnd - 0.2, d.stepsEnd], [1, 0], clamp);
  if (t < d.stepsAt - 0.1 || q <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 70, top: 124, display: "flex", gap: 14, opacity: q }}>
      {d.steps.map((st, i) => {
        const at = d.stepsAt + i * 0.28;
        const p = interpolate(t, [at, at + 0.3], [0, 1], { ...clamp, easing: settle });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px 12px 14px",
              background: "rgba(8,8,14,0.78)",
              borderLeft: `4px solid ${d.color}`,
              opacity: p,
              transform: `translateY(${(1 - p) * -24}px)`,
            }}
          >
            <span style={{ fontFamily: DISPLAY, fontSize: 30, color: d.color }}>{i + 1}</span>
            <span style={{ fontFamily: UI, fontWeight: 700, fontSize: 22, letterSpacing: "0.08em", color: "#fff", textTransform: "uppercase" }}>{st}</span>
          </div>
        );
      })}
    </div>
  );
};

// One huge outlined word over the second example.
const BigWord: React.FC<{ d: Def; t: number }> = ({ d, t }) => {
  const p = interpolate(t, [d.wordAt, d.wordAt + 0.22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const q = interpolate(t, [d.dur - 0.35, d.dur - 0.05], [1, 0], clamp);
  if (p <= 0) return null;
  const drift = (t - d.wordAt) * 40;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 40, opacity: q }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 330,
          lineHeight: 0.9,
          letterSpacing: "0.04em",
          color: "transparent",
          WebkitTextStroke: `3px ${d.color}`,
          filter: `drop-shadow(0 0 14px ${d.color})`,
          transform: `scale(${1.5 - 0.5 * p}) translateX(${drift}px) skewX(-8deg)`,
          opacity: 0.9 * p,
        }}
      >
        {d.word}
      </div>
    </AbsoluteFill>
  );
};

const Section: React.FC<{ d: Def }> = ({ d }) => {
  const t = useCurrentFrame() / FPS;
  const atmos = interpolate(t, [0, 0.2, d.titleEnd - 0.2, d.titleEnd + 0.3], [0, 1, 1, 0.25], clamp);
  return (
    <AbsoluteFill>
      {d.segs.map((sg, i) => (
        <Sequence key={i} from={s(sg.from)} durationInFrames={s(sg.to) - s(sg.from)}>
          <Footage src={sg.src} keys={sg.keys} zoom={sg.zoom} focus={sg.focus} t0={sg.from} whip={i === 0 || sg.from !== d.segs[i - 1].to ? true : true}>
            {sg.ann}
          </Footage>
        </Sequence>
      ))}
      <Vignette />
      <Atmos color={d.color} amount={atmos} />
      {t < d.titleEnd + 0.05 ? <AbsoluteFill style={{ background: "rgba(5,5,12,0.25)" }} /> : null}
      {t < d.titleEnd + 0.05 ? <TitleCard d={d} t={t} /> : null}
      <Hud d={d} t={t} />
      <Steps d={d} t={t} />
      <BigWord d={d} t={t} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- annotations
// Every mark is placed on the actual frozen frame (measured on a gridded
// 960x540 still, here in 1920x1080 frame units).

const draw = (t: number, at: number, dur = 0.35) => interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

const Path: React.FC<{ d: string; p: number; color: string; dash?: boolean; width?: number; head?: boolean }> = ({ d, p, color, dash, width = 7, head = true }) => (
  <>
    <defs>
      <marker id={`hd${color.slice(1)}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10Z" fill={color} />
      </marker>
    </defs>
    <path d={d} pathLength={1} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={width + 6} strokeDasharray={`${p} 1`} strokeLinecap="round" />
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dash ? undefined : `${p} 1`}
      style={dash ? { strokeDasharray: "0.025 0.02", opacity: p > 0 ? 1 : 0, maskImage: undefined } : undefined}
      markerEnd={head && p > 0.97 ? `url(#hd${color.slice(1)})` : undefined}
      filter={`drop-shadow(0 0 8px ${color})`}
    />
  </>
);

// Dashed paths reveal with a clip instead of the dash array.
const DashPath: React.FC<{ d: string; p: number; color: string; box: [number, number, number, number]; dir?: 1 | -1 }> = ({ d, p, color, box, dir = 1 }) => {
  const [x0, y0, x1, y1] = box;
  const w = (x1 - x0) * p;
  const id = `cl${Math.round(x0)}${Math.round(y0)}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <rect x={dir === 1 ? x0 : x1 - w} y={y0} width={w} height={y1 - y0} />
        </clipPath>
        <marker id={`dh${color.slice(1)}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10Z" fill={color} />
        </marker>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d={d} fill="none" stroke={color} strokeWidth={6} strokeDasharray="18 14" strokeLinecap="round" markerEnd={`url(#dh${color.slice(1)})`} filter={`drop-shadow(0 0 6px ${color})`} />
      </g>
    </>
  );
};

const Ring: React.FC<{ x: number; y: number; r: number; p: number; color: string; t: number }> = ({ x, y, r, p, color, t }) => (
  <g opacity={p}>
    <circle cx={x} cy={y} r={r * (1 + 0.12 * Math.sin(t * 9))} fill="none" stroke={color} strokeWidth={4} filter={`drop-shadow(0 0 8px ${color})`} />
    <circle cx={x} cy={y} r={r * 1.7 * p} fill="none" stroke="#fff" strokeOpacity={0.5 * (1 - p) + 0.15} strokeWidth={2} />
  </g>
);

// Corner brackets around a player.
const Bracket: React.FC<{ box: [number, number, number, number]; p: number; color: string }> = ({ box, p, color }) => {
  const [x0, y0, x1, y1] = box;
  const L = 50 * p;
  const st = { stroke: color, strokeWidth: 5, fill: "none", filter: `drop-shadow(0 0 6px ${color})` } as const;
  return (
    <g opacity={p}>
      <path d={`M${x0} ${y0 + L}V${y0}H${x0 + L}`} {...st} />
      <path d={`M${x1 - L} ${y0}H${x1}V${y0 + L}`} {...st} />
      <path d={`M${x0} ${y1 - L}V${y1}H${x0 + L}`} {...st} />
      <path d={`M${x1 - L} ${y1}H${x1}V${y1 - L}`} {...st} />
    </g>
  );
};

const Callout: React.FC<{ x: number; y: number; text: string; p: number; color: string; align?: "left" | "right" }> = ({ x, y, text, p, color, align = "left" }) => (
  <div
    style={{
      position: "absolute",
      left: align === "left" ? x : undefined,
      right: align === "right" ? W - x : undefined,
      top: y,
      transform: "translateY(-50%)",
      opacity: p,
      clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
      background: color,
      color: "#0a0a0f",
      fontFamily: UI,
      fontWeight: 900,
      fontSize: 24,
      letterSpacing: "0.12em",
      padding: "8px 16px",
      whiteSpace: "nowrap",
      boxShadow: `0 0 24px ${color}88`,
    }}
  >
    {text}
  </div>
);

const Ann: React.FC<{ children: React.ReactNode; html?: React.ReactNode; on: number; off: number; t: number }> = ({ children, html, on, off, t }) => {
  const o = interpolate(t, [on - 0.05, on, off - 0.12, off], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.18)" }} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {children}
      </svg>
      {html}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the six

const C = { st: "#c6ff3d", bf: "#a46bff", cq: "#2fe6ff", el: "#ffb21f", fs: "#ff3d8e", ro: "#ff6a2b" };

const SKILLS: Def[] = [
  {
    n: 1,
    name: "Stepovers",
    sub: "The foot circles, the ball stays",
    tag: "Bait the defender before the burst",
    color: C.st,
    dur: 7.03,
    titleEnd: 1.65,
    steps: ["Foot circles the ball", "Defender shifts weight", "Go the other way"],
    stepsAt: 2.05,
    stepsEnd: 4.25,
    word: "BAIT",
    wordAt: 4.25,
    segs: [
      {
        src: "st1.mp4",
        from: 0,
        to: 4.25,
        keys: [[0, 0.05], [1.65, 0.42], [2.0, 0.55], [3.2, 0.55], [4.25, 1.75]],
        zoom: [[0, 1.04], [1.9, 1.04], [2.3, 1.2], [3.2, 1.2], [3.6, 1.04]],
        focus: [0.66, 0.62],
        ann: (t) => {
          const a = 2.05;
          return (
            <Ann on={a} off={3.2} t={t} html={<><Callout x={1330} y={700} text="FOOT CIRCLES THE BALL" p={draw(t, a + 0.35, 0.25)} color={C.st} /><Callout x={1190} y={300} text="DEFENDER READS IT" p={draw(t, a + 0.55, 0.25)} color="#ffffff" /></>}>
              <Ring x={1256} y={820} r={40} p={draw(t, a, 0.2)} color={C.st} t={t} />
              <Path d="M1140 850 C1110 770, 1250 740, 1350 790 S1380 900, 1260 905" p={draw(t, a + 0.1, 0.45)} color={C.st} />
              <Bracket box={[1190, 270, 1620, 910]} p={draw(t, a + 0.45, 0.25)} color="#ffffff" />
            </Ann>
          );
        },
      },
      { src: "st2.mp4", from: 4.25, to: 7.03, keys: [[4.25, 0.0], [7.03, 2.5]], zoom: [[4.25, 1.15], [7.03, 1.05]], focus: [0.58, 0.72] },
    ],
  },
  {
    n: 2,
    name: "Body Feints",
    sub: "Sell it with the shoulders",
    tag: "Move the defender, not the ball",
    color: C.bf,
    dur: 7.0,
    titleEnd: 1.65,
    steps: ["Drop the shoulder", "Defender leans in", "Ball goes the other way"],
    stepsAt: 2.05,
    stepsEnd: 4.7,
    word: "SELL IT",
    wordAt: 4.7,
    segs: [
      {
        src: "bf1.mp4",
        from: 0,
        to: 4.7,
        keys: [[0, 1.1], [1.65, 2.75], [2.0, 3.3], [3.15, 3.3], [4.7, 4.95]],
        zoom: [[0, 1.05], [1.9, 1.05], [2.3, 1.14], [3.15, 1.14], [3.5, 1.05]],
        focus: [0.55, 0.88],
        ann: (t) => {
          const a = 2.05;
          return (
            <Ann
              on={a}
              off={3.15}
              t={t}
              html={<><Callout x={300} y={560} text="SHOW" p={draw(t, a + 0.3, 0.2)} color="#ffffff" /><Callout x={1540} y={330} text="GO" p={draw(t, a + 0.75, 0.2)} color={C.bf} /></>}
            >
              <Bracket box={[880, 250, 1430, 880]} p={draw(t, a, 0.25)} color="#ffffff" />
              <DashPath d="M740 660 L460 640" p={draw(t, a + 0.1, 0.3)} color="#ffffff" box={[420, 600, 760, 700]} dir={-1} />
              <Path d="M890 1000 Q1660 990 1600 400" p={draw(t, a + 0.45, 0.45)} color={C.bf} />
              <Ring x={890} y={1005} r={34} p={draw(t, a + 0.35, 0.2)} color={C.bf} t={t} />
            </Ann>
          );
        },
      },
      { src: "bf3.mp4", from: 4.7, to: 7.0, keys: [[4.7, 0.2], [7.0, 2.3]], zoom: [[4.7, 1.12], [7.0, 1.02]], focus: [0.5, 0.6] },
    ],
  },
  {
    n: 3,
    name: "La Croqueta",
    sub: "Inside of one foot to the other",
    tag: "One touch, one step, through the gap",
    color: C.cq,
    dur: 6.97,
    titleEnd: 1.65,
    steps: ["Touch across the body", "Catch it with the other foot", "Through the gap"],
    stepsAt: 2.05,
    stepsEnd: 4.6,
    word: "GLIDE",
    wordAt: 4.6,
    segs: [
      {
        src: "cq1.mp4",
        from: 0,
        to: 4.6,
        keys: [[0, 0.0], [1.65, 0.3], [2.0, 0.4], [3.1, 0.4], [4.6, 1.3]],
        zoom: [[0, 1.04], [1.9, 1.04], [2.3, 1.16], [3.1, 1.16], [3.5, 1.04]],
        focus: [0.3, 0.75],
        ann: (t) => {
          const a = 2.05;
          return (
            <Ann on={a} off={3.1} t={t} html={<Callout x={640} y={600} text="INSIDE → INSIDE" p={draw(t, a + 0.5, 0.25)} color={C.cq} />}>
              <Ring x={570} y={790} r={46} p={draw(t, a, 0.2)} color={C.cq} t={t} />
              <Path d="M560 830 Q420 900 285 830" p={draw(t, a + 0.15, 0.35)} color={C.cq} />
              <g opacity={draw(t, a + 0.15, 0.2)}>
                <circle cx={610} cy={890} r={20} fill={C.cq} />
                <text x={610} y={898} fontFamily={DISPLAY} fontSize={24} textAnchor="middle" fill="#000">1</text>
              </g>
              <g opacity={draw(t, a + 0.45, 0.2)}>
                <circle cx={250} cy={870} r={20} fill={C.cq} />
                <text x={250} y={878} fontFamily={DISPLAY} fontSize={24} textAnchor="middle" fill="#000">2</text>
              </g>
            </Ann>
          );
        },
      },
      { src: "cq1.mp4", from: 4.6, to: 6.97, keys: [[4.6, 0.25], [6.97, 1.2]], zoom: [[4.6, 1.42], [6.97, 1.3]], focus: [0.22, 0.78] },
    ],
  },
  {
    n: 4,
    name: "Elastico",
    sub: "Out with the outside, back with the inside",
    tag: "Two touches that look like one",
    color: C.el,
    dur: 6.93,
    titleEnd: 1.65,
    steps: ["Push it out", "Snap it back", "Defender is wrong-footed"],
    stepsAt: 2.05,
    stepsEnd: 4.9,
    word: "SNAP",
    wordAt: 4.9,
    segs: [
      { src: "el2.mp4", from: 0, to: 1.65, keys: [[0, 0.0], [1.65, 0.75]], zoom: [[0, 1.1], [1.65, 1.04]], focus: [0.55, 0.55] },
      {
        src: "el1.mp4",
        from: 1.65,
        to: 4.9,
        keys: [[1.65, 0.05], [2.0, 0.3], [3.15, 0.3], [4.9, 1.9]],
        zoom: [[1.65, 1.04], [2.0, 1.04], [2.35, 1.15], [3.15, 1.15], [3.5, 1.04]],
        focus: [0.5, 0.85],
        ann: (t) => {
          const a = 2.05;
          return (
            <Ann
              on={a}
              off={3.15}
              t={t}
              html={<><Callout x={480} y={820} text="1 · OUT" p={draw(t, a + 0.3, 0.2)} color="#ffffff" /><Callout x={1290} y={880} text="2 · BACK" p={draw(t, a + 0.75, 0.2)} color={C.el} /></>}
            >
              <Ring x={910} y={940} r={38} p={draw(t, a, 0.2)} color={C.el} t={t} />
              <Path d="M900 935 Q800 900 700 950" p={draw(t, a + 0.1, 0.3)} color="#ffffff" width={6} />
              <Path d="M690 965 Q900 1060 1250 960" p={draw(t, a + 0.5, 0.35)} color={C.el} />
            </Ann>
          );
        },
      },
      { src: "el2.mp4", from: 4.9, to: 6.93, keys: [[4.9, 0.85], [6.93, 2.25]], zoom: [[4.9, 1.2], [6.93, 1.08]], focus: [0.58, 0.55] },
    ],
  },
  {
    n: 5,
    name: "Fake Shot",
    sub: "Show the strike, keep the ball",
    tag: "Make them block a shot that never comes",
    color: C.fs,
    dur: 6.93,
    titleEnd: 1.65,
    steps: ["Shape to shoot", "Defender commits", "Cut inside"],
    stepsAt: 2.05,
    stepsEnd: 5.0,
    word: "NO SHOT",
    wordAt: 5.0,
    segs: [
      {
        src: "fs1.mp4",
        from: 0,
        to: 5.0,
        keys: [[0, 0.0], [1.65, 0.22], [2.0, 0.3], [3.0, 0.3], [3.55, 0.9], [4.25, 0.95], [5.0, 2.7]],
        zoom: [[0, 1.04], [1.9, 1.04], [2.3, 1.12], [3.0, 1.12], [3.3, 1.04]],
        focus: [0.45, 0.7],
        ann: (t) => {
          const a = 2.05;
          const b = 3.55;
          return (
            <>
              <Ann on={a} off={3.0} t={t} html={<Callout x={1250} y={300} text="THE SHOT HE SHOWS" p={draw(t, a + 0.45, 0.25)} color={C.fs} />}>
                <Ring x={794} y={840} r={42} p={draw(t, a, 0.2)} color={C.fs} t={t} />
                <DashPath d="M830 810 L1700 380" p={draw(t, a + 0.1, 0.4)} color={C.fs} box={[800, 340, 1760, 840]} />
              </Ann>
              <Ann on={b} off={4.25} t={t} html={<Callout x={860} y={380} text="DEFENDER COMMITS" p={draw(t, b + 0.12, 0.2)} color="#ffffff" />}>
                <Bracket box={[320, 360, 840, 840]} p={draw(t, b, 0.18)} color="#ffffff" />
              </Ann>
            </>
          );
        },
      },
      { src: "fs2.mp4", from: 5.0, to: 6.93, keys: [[5.0, 0.7], [6.93, 2.35]], zoom: [[5.0, 1.18], [6.93, 1.06]], focus: [0.4, 0.6] },
    ],
  },
  {
    n: 6,
    name: "Roulette",
    sub: "Drag, spin, protect",
    tag: "Turn your back on the pressure",
    color: C.ro,
    dur: 7.0,
    titleEnd: 1.65,
    steps: ["Sole drags the ball", "Body spins round it", "Shield and away"],
    stepsAt: 2.05,
    stepsEnd: 4.6,
    word: "SPIN",
    wordAt: 4.6,
    segs: [
      {
        src: "ro1.mp4",
        from: 0,
        to: 4.6,
        keys: [[0, 0.2], [1.65, 0.45], [2.0, 0.55], [3.1, 0.55], [4.6, 1.75]],
        zoom: [[0, 1.04], [1.9, 1.04], [2.3, 1.12], [3.1, 1.12], [3.5, 1.04]],
        focus: [0.45, 0.78],
        ann: (t) => {
          const a = 2.05;
          return (
            <Ann on={a} off={3.1} t={t} html={<Callout x={1220} y={760} text="DRAG · SPIN · PROTECT" p={draw(t, a + 0.55, 0.25)} color={C.ro} />}>
              <Ring x={620} y={880} r={44} p={draw(t, a, 0.2)} color={C.ro} t={t} />
              <Path d="M600 930 A330 95 0 1 0 1150 840" p={draw(t, a + 0.12, 0.55)} color={C.ro} />
            </Ann>
          );
        },
      },
      { src: "ro2.mp4", from: 4.6, to: 7.0, keys: [[4.6, 0.25], [7.0, 3.1]], zoom: [[4.6, 1.15], [7.0, 1.05]], focus: [0.45, 0.6] },
    ],
  },
];

// ---------------------------------------------------------------- open

const OPEN_BG: [string, number][] = [
  ["mx1.mp4", 0.2],
  ["st2.mp4", 1.0],
  ["el1.mp4", 0.6],
  ["cq1.mp4", 0.6],
  ["bf1.mp4", 3.6],
  ["ro1.mp4", 0.9],
  ["fs1.mp4", 0.2],
  ["mx2.mp4", 0.5],
];
const KEYWORDS: [string, number][] = [
  ["CONTROL", 0.62],
  ["BALANCE", 1.02],
  ["TIMING", 1.3],
  ["DECEPTION", 1.7],
  ["NERVE", 2.08],
];

const Open: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const slot = Math.min(OPEN_BG.length - 1, Math.floor(t / 0.41));
  const [src, st] = OPEN_BG[slot];
  const local = t - slot * 0.41;
  const fadeIn = interpolate(t, [0, 0.35], [0, 1], clamp);
  const kw = KEYWORDS.reduce((a, c) => (t >= c[1] ? c : a), ["", -1] as [string, number]);
  const finalLine = t >= 2.46;
  const out = interpolate(t, [3.05, 3.27], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const titleP = interpolate(t, [0.2, 0.6], [0, 1], { ...clamp, easing: settle });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fadeIn * 0.85, filter: "blur(5px) brightness(0.55) saturate(1.2)", transform: `scale(${1.12 + local * 0.05})` }}>
        <Freeze frame={Math.round((st + local * 0.6) * FPS)}>
          <OffthreadVideo src={staticFile(src)} muted style={{ width: W, height: H }} />
        </Freeze>
      </AbsoluteFill>
      {/* light streaks + bokeh */}
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.5 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -400 + ((t * 220 + i * 520) % 2600),
              top: -200,
              width: 90 + i * 20,
              height: 1600,
              background: "linear-gradient(90deg, transparent, rgba(255,240,220,0.35), transparent)",
              transform: "rotate(28deg)",
            }}
          />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={`b${i}`}
            style={{
              position: "absolute",
              left: random(`bx${i}`) * W,
              top: random(`by${i}`) * H - t * 20 * random(`bs${i}`),
              width: 30 + random(`br${i}`) * 70,
              height: 30 + random(`br${i}`) * 70,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.05)",
            }}
          />
        ))}
      </AbsoluteFill>
      <Vignette strength={0.8} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${1 + out * 0.6})`, opacity: 1 - out, filter: out > 0.1 ? blurX(out * 70) : undefined }}>
        <div style={{ marginBottom: 6 }}>
          <Tracked text="A breakdown" t={t} at={0.12} size={18} color="#ffffffaa" spacing={0.6} weight={500} />
        </div>
        <Tracked text="The art of" t={t} at={0.2} size={40} spacing={0.55} weight={900} />
        <div style={{ fontFamily: DISPLAY, fontSize: 250, lineHeight: 1, letterSpacing: "0.04em", color: "#fff", textShadow: Glow("#ffe9c9", 1.1), opacity: titleP, transform: `scale(${1.08 - 0.08 * titleP})`, marginTop: 8 }}>
          DRIBBLING
        </div>
        <div style={{ height: 64, marginTop: 12, display: "flex", alignItems: "center" }}>
          {finalLine ? (
            <MaskWord text="Six skills · one ball" at={2.46} t={t} size={52} glow="#c6ff3d" tracking="0.3em" />
          ) : kw[1] >= 0 ? (
            <div key={kw[0]} style={{ fontFamily: UI, fontWeight: 900, fontSize: 40, letterSpacing: "0.5em", color: "#c6ff3d", textShadow: Glow("#c6ff3d", 0.6), opacity: interpolate(t, [kw[1], kw[1] + 0.06], [0, 1], clamp) }}>
              {kw[0]}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- recap

const RECAP: { src: string; keys: K[]; fx: number; d: Def }[] = [
  { src: "st1.mp4", keys: [[0, 0.3], [7, 2.0]], fx: 0.55, d: SKILLS[0] },
  { src: "bf1.mp4", keys: [[0, 3.4], [7, 4.9]], fx: 0.5, d: SKILLS[1] },
  { src: "cq1.mp4", keys: [[0, 0.2], [7, 1.6]], fx: 0.22, d: SKILLS[2] },
  { src: "el1.mp4", keys: [[0, 0.2], [7, 1.6]], fx: 0.5, d: SKILLS[3] },
  { src: "fs1.mp4", keys: [[0, 0.1], [7, 1.2]], fx: 0.25, d: SKILLS[4] },
  { src: "ro1.mp4", keys: [[0, 0.4], [7, 1.9]], fx: 0.45, d: SKILLS[5] },
];

const Recap: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const pw = W / 6;
  const out = interpolate(t, [6.6, 7.0], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: "#07070c" }}>
      {RECAP.map((r, i) => {
        const at = i * 0.18;
        const p = interpolate(t, [at, at + 0.4], [0, 1], { ...clamp, easing: settle });
        const st = interpolate(t, r.keys.map((k) => k[0]), r.keys.map((k) => k[1]), clamp);
        const vw = 1920 * 1.0;
        const left = Math.min(0, Math.max(pw + 120 - vw, (pw + 120) / 2 - r.fx * vw));
        const lab = interpolate(t, [0.9 + i * 0.12, 1.3 + i * 0.12], [0, 1], { ...clamp, easing: settle });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * pw - 60,
              top: 0,
              width: pw + 120,
              height: H,
              clipPath: "polygon(60px 0, 100% 0, calc(100% - 60px) 100%, 0 100%)",
              transform: `translateY(${(1 - p) * (i % 2 ? -H : H)}px) translateX(${out * (i - 2.5) * 60}px)`,
              opacity: 1 - out,
              overflow: "hidden",
            }}
          >
            <Freeze frame={Math.round(st * FPS)}>
              <OffthreadVideo src={staticFile(r.src)} muted style={{ position: "absolute", left, top: 0, width: vw, height: H, filter: `${FOOTAGE_FILTER} brightness(0.85)` }} />
            </Freeze>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, ${r.d.color}cc 0%, transparent 38%)`, mixBlendMode: "multiply" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 35%)` }} />
            <div style={{ position: "absolute", left: 90, bottom: 70, opacity: lab, transform: `translateY(${(1 - lab) * 30}px)` }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 64, color: r.d.color, textShadow: Glow(r.d.color, 0.5), lineHeight: 1 }}>{String(r.d.n).padStart(2, "0")}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 40, color: "#fff", lineHeight: 1.05, letterSpacing: "0.03em", width: pw - 60 }}>{r.d.name.toUpperCase()}</div>
            </div>
          </div>
        );
      })}
      {/* dividers */}
      <svg width={W} height={H} style={{ position: "absolute", opacity: 1 - out }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={i * pw + 60} y1={0} x2={i * pw - 60} y2={H} stroke="#fff" strokeWidth={4} opacity={interpolate(t, [0.6, 1.0], [0, 0.9], clamp)} />
        ))}
      </svg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 140, opacity: 1 - out }}>
        <div style={{ background: "rgba(7,7,12,0.82)", padding: "26px 60px", transform: `scaleX(${interpolate(t, [2.3, 2.7], [0, 1], { ...clamp, easing: settle })})` }}>
          <MaskWord text="Six ways past a defender" at={2.55} t={t} size={96} glow="#ffffff" tracking="0.05em" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- final

const Final: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const names = SKILLS.map((d) => d.name.toUpperCase()).join("  ·  ");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={s(1.7)}>
        <Footage src="mx1.mp4" keys={[[0, 0.0], [1.7, 1.6]]} zoom={[[0, 1.18], [1.7, 1.06]]} focus={[0.5, 0.6]} />
      </Sequence>
      <Sequence from={s(1.7)} durationInFrames={s(4.2) - s(1.7)}>
        <Footage src="mx2.mp4" keys={[[1.7, 0.0], [4.2, 2.4]]} zoom={[[1.7, 1.15], [4.2, 1.04]]} focus={[0.5, 0.6]} t0={1.7} />
      </Sequence>
      <Sequence from={s(4.2)} durationInFrames={s(6.82) - s(4.2)}>
        <AbsoluteFill style={{ filter: "brightness(0.5) saturate(1.1)" }}>
          <Footage src="bf3.mp4" keys={[[4.2, 0.2], [6.82, 1.6]]} zoom={[[4.2, 1.1], [6.82, 1.2]]} focus={[0.5, 0.6]} t0={4.2} />
        </AbsoluteFill>
      </Sequence>
      <Vignette strength={0.7} />
      {t < 4.2 ? (
        <div style={{ position: "absolute", left: 80, bottom: 70 }}>
          <Tracked text={t < 1.7 ? "Every skill is a question" : "the defender has to answer"} t={t} at={t < 1.7 ? 0.1 : 1.8} size={34} weight={900} spacing={0.25} />
        </div>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Tracked text="The art of" t={t} at={4.3} size={40} spacing={0.55} weight={900} />
          <MaskWord text="Dribbling" at={4.4} t={t} size={250} glow="#ffe9c9" tracking="0.04em" style={{ marginTop: 8 }} />
          <div style={{ marginTop: 22 }}>
            <Tracked text={names} t={t} at={5.0} size={20} spacing={0.25} color="#ffffffcc" weight={700} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// White end card with the handle, like the reference's signature card.
const EndCard: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const p = interpolate(t, [0, 0.35], [0, 1], { ...clamp, easing: settle });
  const blur = interpolate(t, [0, 0.4, 1.6, 2.05], [14, 2.5, 2.5, 10], clamp);
  const o = interpolate(t, [1.75, 2.05], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#fbfbfb", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: o, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 170, letterSpacing: "0.02em", color: "#0b0b0b", filter: `blur(${blur}px)`, transform: `scale(${1.1 - 0.1 * p})` }}>{HANDLE}</div>
        <div style={{ fontFamily: UI, fontWeight: 900, fontSize: 22, letterSpacing: "0.6em", color: "#0b0b0b", opacity: 0.8 * p, filter: "blur(0.6px)", marginTop: 6 }}>THE ART OF DRIBBLING</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- master

export const Dribbling: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const last = (list: number[]) => list.reduce((a, c) => (c <= t ? c : a), -9);
  const sinceCut = f - s(last(CUTS));
  const sinceHit = f - s(last(HITS));
  const near = Math.min(sinceCut, sinceHit);
  const decay = Math.exp(-near / 5);
  const live = t < AT.end;
  const shake = live && near < 8 ? (random(`sx${f}`) - 0.5) * 14 * decay : 0;
  const shakeY = live && near < 8 ? (random(`sy${f}`) - 0.5) * 10 * decay : 0;
  const punch = live ? 1 + 0.035 * decay : 1;
  const rgb = live && sinceCut < 3 ? "url(#rgb10)" : live && near < 4 ? "url(#rgb5)" : undefined;
  const flash = sinceCut >= 0 && sinceCut < 4 && t < AT.end ? [0.75, 0.4, 0.18, 0.06][sinceCut] : 0;
  const scenes: [number, number, React.ReactNode][] = [
    [0, AT.s[0], <Open />],
    ...SKILLS.map((d, i) => [AT.s[i], i < 5 ? AT.s[i + 1] : AT.recap, <Section d={d} />] as [number, number, React.ReactNode]),
    [AT.recap, AT.final, <Recap />],
    [AT.final, AT.end, <Final />],
    [AT.end, END, <EndCard />],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Defs />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shakeY}px) scale(${punch})`, filter: rgb }}>
        {scenes.map(([a, b, el], i) => (
          <Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)}>
            {el}
          </Sequence>
        ))}
      </AbsoluteFill>
      {live ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, textAlign: "center", fontFamily: UI, fontWeight: 900, fontSize: 14, letterSpacing: "0.5em", color: "#ffffff70" }}>{HANDLE}</div>
      ) : null}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Audio src={staticFile("music.wav")} />
    </AbsoluteFill>
  );
};
