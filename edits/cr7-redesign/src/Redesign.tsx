import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/instrument-serif/400-italic.css";

// "The Greats on CR7" — redesign of the 2025 manual edit (export b9e61265).
// Same footage, same soundtrack timeline (interviews + music), rebuilt as
// one continuous glass card that morphs between layouts, kinetic quotes
// synced to the speech, a living colour aura, and a three-quote recap on
// the beat drop.
export const FPS = 60;
export const W = 1080;
export const H = 1920;
export const END = 46.6;
export const FRAMES = Math.round(END * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const swift = Easing.bezier(0.7, 0, 0.18, 1);

const DISPLAY = "Anton, sans-serif";
const UI = "Inter, sans-serif";
const SERIF = "'Instrument Serif', serif";
const HANDLE = "BRIGHTONBOYEDITS";

// Palette: United red into Madrid gold, with a cool violet for depth.
const RED = "#ff2e4d";
const GOLD = "#ffc84a";
const VIOLET = "#7b5cff";
const ICE = "#e9f1ff";

// Cuts in the source edit (per-frame difference scan) and music accents.
const CUT = { wright: 2.67, kick: 12.87, rio: 15.13, purple: 21.37, pele: 24.13, siu: 33.2, orange: 35.23, drop: 36.2, atl: 36.73, bil: 39.47, utd: 42.5, end: 44.5 };
const HITS = [2.67, 12.87, 15.13, 21.37, 24.13, 29.77, 33.2, 35.23, 36.2, 39.15, 42.14];

// ---------------------------------------------------------------- card layout

type L = { cx: number; cy: number; w: number; h: number; r: number; ry: number; rx: number; z: number; fx: number; fy: number };
const land = (cy: number, w = 1000, extra: Partial<L> = {}): L => ({ cx: 540, cy, w, h: Math.round((w * 9) / 16), r: 34, ry: 0, rx: 0, z: 1, fx: 0.5, fy: 0.5, ...extra });

// Scenes: [start, layout at start, layout at end]. On each cut the card
// morphs from where the last scene left it (MORPH s, fast settle), then
// drifts slowly to the scene's end layout (hold-and-push).
const PORTRAIT = (z: number): L => ({ cx: 540, cy: 960, w: 660, h: 1060, r: 44, ry: 0, rx: 0, z, fx: 0.6, fy: 0.5 });
const GONE: L = { cx: 540, cy: 860, w: 0, h: 0, r: 200, ry: 0, rx: 0, z: 1, fx: 0.5, fy: 0.5 };
const SCENES: [number, L, L][] = [
  [-1, land(1180, 380, { ry: 30, rx: 12, r: 60 }), land(1180, 380, { ry: 30, rx: 12, r: 60 })],
  [0.0, land(1180, 1000), land(1180, 1000, { z: 1.08 })],
  [2.67, land(640, 1000, { z: 1.22, fx: 0.42, fy: 0.3 }), land(640, 1000, { z: 1.3, fx: 0.42, fy: 0.3 })], // Ian Wright
  [12.87, land(900, 1160, { ry: -9, r: 26 }), land(900, 1160, { ry: 6, r: 26, z: 1.06 })], // bicycle kick
  [15.13, land(640, 1000, { z: 1.18, fx: 0.3, fy: 0.35 }), land(640, 1000, { z: 1.26, fx: 0.3, fy: 0.35 })], // Rio Ferdinand
  [21.37, land(900, 1160, { ry: 8, r: 26 }), land(900, 1160, { ry: -4, r: 26, z: 1.06 })], // celebration
  [24.13, land(640, 1000, { z: 1.28, fx: 0.4, fy: 0.0 }), land(640, 1000, { z: 1.34, fx: 0.4, fy: 0.0 })], // Pelé — crop drops the old burned-in subtitles
  [33.2, PORTRAIT(1), PORTRAIT(1.07)], // celebration, portrait
  [35.23, land(1000, 1080, { ry: -10, r: 30 }), land(1000, 1080, { ry: -4, r: 30, z: 1.05 })],
  [36.2, land(1060, 1120, { r: 30, z: 1.12 }), land(1060, 1120, { ry: 7, r: 30 })], // DROP
  [39.15, land(1060, 1120, { ry: -7, r: 30, z: 1.12 }), land(1060, 1120, { r: 30 })],
  [42.14, land(1060, 1120, { ry: 6, r: 30, z: 1.12 }), land(1060, 1120, { r: 30 })],
  [44.5, GONE, GONE],
];
const MORPH = 0.42;

const mix = (a: L, b: L, p: number) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k as keyof L] + (b[k as keyof L] - a[k as keyof L]) * p])) as L;
const layoutAt = (t: number): L => {
  let i = 0;
  while (i < SCENES.length - 1 && SCENES[i + 1][0] <= t) i++;
  const [at, A, B] = SCENES[i];
  const next = i < SCENES.length - 1 ? SCENES[i + 1][0] : at + 1;
  const base = mix(A, B, interpolate(t, [at, next], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) }));
  if (i === 0 || t >= at + MORPH) return base;
  return mix(SCENES[i - 1][2], base, interpolate(t, [at, at + MORPH], [0, 1], { ...clamp, easing: swift }));
};

// ---------------------------------------------------------------- footage

const SRC_W = 1152;
const SRC_H = 648;
// Footage stays on the source timeline (t = source time) so speech stays in sync.
const Plate: React.FC<{ t: number; l: L }> = ({ t, l }) => {
  const cover = Math.max(l.w / SRC_W, l.h / SRC_H) * l.z;
  const vw = SRC_W * cover;
  const vh = SRC_H * cover;
  const left = (l.w - vw) * l.fx;
  const top = (l.h - vh) * l.fy;
  return (
    <Freeze frame={Math.round(Math.min(t, 44.45) * FPS)}>
      <OffthreadVideo
        src={staticFile("footage.mp4")}
        muted
        style={{ position: "absolute", left, top, width: vw, height: vh, filter: "url(#sharp) contrast(1.08) saturate(1.22) brightness(1.04)" }}
      />
    </Freeze>
  );
};

const Card: React.FC<{ t: number; accent: string }> = ({ t, accent }) => {
  const l = layoutAt(t);
  if (l.w < 4) return null;
  // Motion trail: outline ghosts of where the card just was.
  const ghosts = [0.05, 0.1, 0.16].map((d) => layoutAt(Math.max(0, t - d)));
  const moving = Math.abs(ghosts[2].cx - l.cx) + Math.abs(ghosts[2].cy - l.cy) + Math.abs(ghosts[2].w - l.w) > 12;
  const box = (g: L): React.CSSProperties => ({
    position: "absolute",
    left: g.cx - g.w / 2,
    top: g.cy - g.h / 2,
    width: g.w,
    height: g.h,
    borderRadius: g.r,
    transform: `perspective(1600px) rotateY(${g.ry}deg) rotateX(${g.rx}deg)`,
  });
  return (
    <>
      {moving
        ? ghosts.map((g, i) => (
            <div key={i} style={{ ...box(g), border: `3px solid ${accent}`, opacity: 0.45 - i * 0.13, boxShadow: `0 0 30px ${accent}88` }} />
          ))
        : null}
      <div style={{ ...box(l), overflow: "hidden", boxShadow: `0 40px 120px rgba(0,0,0,0.55), 0 0 60px ${accent}55` }}>
        <Plate t={t} l={l} />
        {/* glass rim + sheen */}
        <div style={{ position: "absolute", inset: 0, borderRadius: l.r, border: "2px solid rgba(255,255,255,0.38)", background: "linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.08) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.35) 100%)" }} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------- atmosphere

const AURA: [number, string, string][] = [
  [0, RED, GOLD],
  [2.67, RED, VIOLET],
  [12.87, GOLD, RED],
  [15.13, VIOLET, RED],
  [21.37, VIOLET, GOLD],
  [24.13, GOLD, VIOLET],
  [33.2, RED, GOLD],
  [36.2, RED, GOLD],
];
const Aura: React.FC<{ t: number }> = ({ t }) => {
  const cur = AURA.reduce((a, c) => (t >= c[0] ? c : a), AURA[0]);
  const blob = (c: string, x: number, y: number, s: number, o: number) => (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: "50%", background: `radial-gradient(circle, ${c} 0%, ${c}00 65%)`, opacity: o }} />
  );
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {blob(cur[1], 200 + Math.sin(t * 0.7) * 120, 380 + Math.cos(t * 0.5) * 140, 1100, 0.55)}
      {blob(cur[2], 900 + Math.cos(t * 0.6) * 120, 1550 + Math.sin(t * 0.8) * 140, 1200, 0.5)}
      {blob(ICE, 540 + Math.sin(t * 0.3) * 300, 980, 700, 0.12)}
    </AbsoluteFill>
  );
};

const Background: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: "#07060d" }}>
    <Freeze frame={Math.round(Math.min(t, 44.45) * FPS)}>
      <OffthreadVideo src={staticFile("bg.mp4")} muted style={{ width: W, height: H, opacity: 0.55 }} />
    </Freeze>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,6,13,0.55) 0%, rgba(7,6,13,0.2) 45%, rgba(7,6,13,0.75) 100%)" }} />
    <Aura t={t} />
    {/* fine dot grid for texture */}
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1.2px, transparent 1.2px)", backgroundSize: "26px 26px", opacity: 0.6 }} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- type

const Glass: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))",
      border: "1.5px solid rgba(255,255,255,0.3)",
      backdropFilter: "blur(18px) saturate(1.4)",
      WebkitBackdropFilter: "blur(18px) saturate(1.4)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
      ...style,
    }}
  >
    {children}
  </div>
);

const appear = (t: number, at: number, dur = 0.45) => interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: settle });
const fadeOut = (t: number, at: number, dur = 0.25) => interpolate(t, [at, at + dur], [1, 0], clamp);

// Chip at the top: "THE GREATS ON CR7 · 01 / 03".
const Chip: React.FC<{ t: number; at: number; until: number; n: number; accent: string }> = ({ t, at, until, n, accent }) => {
  const p = appear(t, at);
  const q = fadeOut(t, until - 0.25);
  if (p <= 0 || q <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", opacity: p * q, transform: `translateY(${(1 - p) * -30}px)` }}>
      <Glass style={{ borderRadius: 999, padding: "14px 30px", display: "flex", alignItems: "center", gap: 18 }}>
        <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 24, letterSpacing: "0.32em", color: "#fff" }}>THE GREATS ON CR7</span>
        <span style={{ width: 2, height: 26, background: "rgba(255,255,255,0.4)" }} />
        <span style={{ fontFamily: DISPLAY, fontSize: 30, color: accent, letterSpacing: "0.06em", textShadow: `0 0 18px ${accent}` }}>
          0{n}
          <span style={{ color: "rgba(255,255,255,0.5)" }}> / 03</span>
        </span>
      </Glass>
    </div>
  );
};

// Speaker name plate pinned to the card's lower-left corner.
const NamePlate: React.FC<{ t: number; at: number; until: number; name: string; role: string; accent: string }> = ({ t, at, until, name, role, accent }) => {
  const p = appear(t, at + 0.25, 0.5);
  const q = fadeOut(t, until - 0.2);
  if (p <= 0 || q <= 0) return null;
  const chars = name.split("");
  return (
    <div style={{ position: "absolute", left: 60, top: 640 + 281 - 46, opacity: q }}>
      <Glass style={{ borderRadius: 22, padding: "16px 26px 14px", transform: `translateX(${(1 - p) * -60}px)`, opacity: p }}>
        <div style={{ display: "flex" }}>
          {chars.map((c, i) => {
            const cp = appear(t, at + 0.3 + i * 0.025, 0.35);
            return (
              <span key={i} style={{ fontFamily: DISPLAY, fontSize: 54, lineHeight: 1, color: "#fff", letterSpacing: "0.02em", opacity: cp, transform: `translateY(${(1 - cp) * 24}px)`, display: "inline-block", whiteSpace: "pre" }}>
                {c}
              </span>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <span style={{ width: 26 * p, height: 3, background: accent, boxShadow: `0 0 10px ${accent}` }} />
          <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 19, letterSpacing: "0.28em", color: "rgba(255,255,255,0.85)" }}>{role}</span>
        </div>
      </Glass>
    </div>
  );
};

// A spoken line: words appear on their (estimated) spoken times. Words in
// *stars* are the emphasis words, set in italic serif in the accent colour.
type Line = { t0: number; t1: number; text: string };
const words = (lines: Line[]) =>
  lines.flatMap((ln) => {
    const ws = ln.text.split(" ");
    const total = ws.reduce((a, w) => a + w.replace(/\*/g, "").length + 1, 0);
    let acc = 0;
    return ws.map((w) => {
      const at = ln.t0 + ((ln.t1 - ln.t0) * acc) / total;
      acc += w.replace(/\*/g, "").length + 1;
      return { w: w.replace(/\*/g, ""), at, em: w.startsWith("*") || w.endsWith("*") };
    });
  });

const Quote: React.FC<{ t: number; lines: Line[]; from: number; until: number; accent: string; top?: number }> = ({ t, lines, from, until, accent, top = 1050 }) => {
  if (t < from - 0.05 || t > until + 0.3) return null;
  const ws = words(lines);
  const q = fadeOut(t, until, 0.25);
  const mark = appear(t, from, 0.5);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, opacity: q }}>
      <div style={{ position: "absolute", right: -10, top: -150, fontFamily: SERIF, fontStyle: "italic", fontSize: 260, lineHeight: 1, color: accent, opacity: 0.85 * mark, textShadow: `0 0 40px ${accent}88`, transform: `scale(${0.6 + 0.4 * mark})`, transformOrigin: "100% 100%" }}>
        “
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 18, rowGap: 6, paddingTop: 30 }}>
        {ws.map((x, i) => {
          const p = appear(t, x.at - 0.05, 0.32);
          const lit = t >= x.at;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontFamily: x.em ? SERIF : UI,
                fontStyle: x.em ? "italic" : undefined,
                fontWeight: x.em ? 400 : 900,
                fontSize: x.em ? 92 : 62,
                lineHeight: 1.12,
                textTransform: x.em ? undefined : "uppercase",
                letterSpacing: x.em ? "0" : "-0.01em",
                color: x.em ? accent : lit ? "#fff" : "rgba(255,255,255,0.25)",
                textShadow: x.em ? `0 0 26px ${accent}aa` : "0 4px 24px rgba(0,0,0,0.5)",
                opacity: 0.25 + 0.75 * p,
                transform: `translateY(${(1 - p) * 26}px)`,
                filter: p < 0.6 ? `blur(${(1 - p) * 6}px)` : undefined,
              }}
            >
              {x.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Pelé's superlatives as a stacked ladder of glass rows.
const Ladder: React.FC<{ t: number }> = ({ t }) => {
  const rows: [string, number][] = [
    ["THE BEST PLAYER", 28.27],
    ["THE BEST SCORER", 29.58],
    ["THE BEST FORWARD", 30.53],
  ];
  const out = fadeOut(t, 33.0, 0.25);
  if (t < 28.1 || out <= 0) return null;
  const name = appear(t, 31.3, 0.5);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1050, opacity: out }}>
      {rows.map(([txt, at], i) => {
        const p = appear(t, at - 0.05, 0.4);
        const dim = t > rows[i + 1]?.[1] ? 0.6 : 1;
        return (
          <Glass key={i} style={{ borderRadius: 24, padding: "18px 28px", marginBottom: 16, display: "flex", alignItems: "center", gap: 24, opacity: p * dim, transform: `translateX(${(1 - p) * 120}px)` }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 44, color: GOLD, textShadow: `0 0 16px ${GOLD}` }}>0{i + 1}</span>
            <span style={{ fontFamily: DISPLAY, fontSize: 64, color: "#fff", letterSpacing: "0.02em" }}>{txt}</span>
          </Glass>
        );
      })}
      <div style={{ marginTop: 30, opacity: name, transform: `scale(${0.85 + 0.15 * name})`, transformOrigin: "0 50%" }}>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 24, letterSpacing: "0.4em", color: "rgba(255,255,255,0.8)" }}>IS</div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 132,
            lineHeight: 1,
            letterSpacing: "0.01em",
            backgroundImage: `linear-gradient(100deg, ${GOLD} 0%, #fff 45%, ${RED} 100%)`,
            backgroundSize: "200% 100%",
            backgroundPosition: `${(1 - name) * 100}% 0`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 0 22px ${GOLD}88)`,
          }}
        >
          CRISTIANO RONALDO
        </div>
      </div>
    </div>
  );
};

// Huge outlined background word behind the card (depth layer).
const BackWord: React.FC<{ t: number; at: number; until: number; text: string; color: string; y: number }> = ({ t, at, until, text, color, y }) => {
  const p = appear(t, at, 0.6);
  const q = fadeOut(t, until - 0.2);
  if (p <= 0 || q <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", opacity: p * q }}>
      <span
        style={{
          fontFamily: DISPLAY,
          fontSize: 460,
          lineHeight: 0.9,
          color: "transparent",
          WebkitTextStroke: `3px ${color}`,
          letterSpacing: "0.02em",
          display: "inline-block",
          transform: `translateX(${(t - at) * -40}px) scale(${1.15 - 0.15 * p})`,
          filter: `drop-shadow(0 0 20px ${color}66)`,
        }}
      >
        {text}
      </span>
    </div>
  );
};

const Label: React.FC<{ t: number; at: number; until: number; text: string; accent: string; y: number }> = ({ t, at, until, text, accent, y }) => {
  const p = appear(t, at + 0.15, 0.4);
  const q = fadeOut(t, until - 0.2);
  if (p <= 0 || q <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: p * q }}>
      <Glass style={{ borderRadius: 999, padding: "14px 34px", display: "flex", gap: 14, alignItems: "center", transform: `translateY(${(1 - p) * 30}px)` }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: accent, boxShadow: `0 0 14px ${accent}` }} />
        <span style={{ fontFamily: UI, fontWeight: 900, fontSize: 28, letterSpacing: "0.3em", color: "#fff" }}>{text}</span>
      </Glass>
    </div>
  );
};

// ---------------------------------------------------------------- set pieces

const Opening: React.FC<{ t: number }> = ({ t }) => {
  const q = fadeOut(t, 2.45, 0.3);
  if (q <= 0) return null;
  const word = "CRISTIANO".split("");
  const out = interpolate(t, [2.45, 2.75], [0, 1], { ...clamp, easing: swift });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", opacity: q, transform: `translateY(${-out * 120}px)` }}>
      <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 26, letterSpacing: `${0.5 + (1 - appear(t, 0.1, 0.8)) * 0.4}em`, color: "rgba(255,255,255,0.85)", opacity: appear(t, 0.1) }}>
        WHAT THE GREATS SAY ABOUT
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        {word.map((c, i) => {
          const p = appear(t, 0.3 + i * 0.045, 0.5);
          return (
            <span
              key={i}
              style={{
                fontFamily: DISPLAY,
                fontSize: 210,
                lineHeight: 1,
                display: "inline-block",
                color: "#fff",
                textShadow: `0 0 30px ${RED}aa, 0 10px 40px rgba(0,0,0,0.5)`,
                opacity: p,
                transform: `translateY(${(1 - p) * 140}px) rotate(${(1 - p) * (i % 2 ? 12 : -12)}deg)`,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: -6, opacity: appear(t, 0.85) }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: "transparent", WebkitTextStroke: `3px ${GOLD}`, letterSpacing: `${0.02 + (1 - appear(t, 0.85, 0.9)) * 0.3}em`, filter: `drop-shadow(0 0 16px ${GOLD}88)` }}>
          RONALDO
        </span>
      </div>
    </div>
  );
};

// The drop: each hit recalls one of the three quotes.
const RECALL: { at: number; until: number; big: string; who: string; color: string }[] = [
  { at: 36.2, until: 39.1, big: "HARD WORK.", who: "IAN WRIGHT", color: RED },
  { at: 39.15, until: 42.1, big: "MASSIVE IMPACT.", who: "RIO FERDINAND", color: VIOLET },
  { at: 42.14, until: 44.45, big: "THE BEST.", who: "PELÉ", color: GOLD },
];
const Recall: React.FC<{ t: number }> = ({ t }) => {
  const r = RECALL.find((x) => t >= x.at && t < x.until);
  if (!r) return null;
  const p = appear(t, r.at, 0.28);
  const q = fadeOut(t, r.until - 0.2, 0.2);
  const letters = r.big.split("");
  return (
    <>
      <div style={{ position: "absolute", left: 50, right: 50, top: 330, opacity: q }}>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 24, letterSpacing: "0.42em", color: "rgba(255,255,255,0.85)", opacity: p }}>“ THE GREATS SAID</div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 12 }}>
          {letters.map((c, i) => {
            const cp = appear(t, r.at + i * 0.022, 0.32);
            return (
              <span
                key={i}
                style={{
                  fontFamily: DISPLAY,
                  fontSize: r.big.length > 12 ? 150 : 190,
                  lineHeight: 0.95,
                  display: "inline-block",
                  whiteSpace: "pre",
                  color: "#fff",
                  textShadow: `0 0 34px ${r.color}, 0 8px 30px rgba(0,0,0,0.5)`,
                  opacity: cp,
                  transform: `translateY(${(1 - cp) * 90}px) scale(${1 + (1 - cp) * 0.4})`,
                }}
              >
                {c}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1460, display: "flex", justifyContent: "center", opacity: q * appear(t, r.at + 0.35) }}>
        <Glass style={{ borderRadius: 999, padding: "12px 30px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 30, height: 3, background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
          <span style={{ fontFamily: UI, fontWeight: 900, fontSize: 26, letterSpacing: "0.32em", color: "#fff" }}>{r.who}</span>
        </Glass>
      </div>
    </>
  );
};

const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < 44.45) return null;
  const p = appear(t, 44.5, 0.6);
  const glow = 0.6 + 0.4 * Math.sin((t - 44.5) * 3);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>
      <Glass style={{ borderRadius: 48, padding: "60px 90px 54px", textAlign: "center", transform: `scale(${0.8 + 0.2 * p}) translateY(${(1 - p) * 60}px)`, opacity: p }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 260,
            lineHeight: 0.95,
            backgroundImage: `linear-gradient(110deg, ${RED}, #fff 50%, ${GOLD})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 0 ${20 + 20 * glow}px ${GOLD}66)`,
          }}
        >
          CR7
        </div>
        <div style={{ fontFamily: UI, fontWeight: 900, fontSize: 30, letterSpacing: "0.34em", color: "#fff", marginTop: 18 }}>{HANDLE}</div>
      </Glass>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the quotes
// Wording from the interview audio (Whisper small.en on the separated voice
// stem; Pelé's lines also match his burned-in subtitles). Times are when
// each phrase is spoken in the source.

const WRIGHT: Line[] = [
  { t0: 2.95, t1: 4.82, text: "But the fact is, is that he" },
  { t0: 5.22, t1: 7.49, text: "has shown that it's not just *ability.*" },
];
const WRIGHT2: Line[] = [
  { t0: 7.94, t1: 9.52, text: "It is *hard* *work,* and he seems to be" },
  { t0: 9.98, t1: 12.65, text: "getting the *fruits* of all the hard work he's putting in." },
];
const RIO: Line[] = [
  { t0: 15.13, t1: 17.72, text: "United... you think, who was that person who had a *massive* *impact*" },
  { t0: 17.72, t1: 19.35, text: "on the club while they were there?" },
];
const RIO2: Line[] = [{ t0: 19.74, t1: 21.1, text: "You can't look no further than *Cristiano.*" }];
const PELE: Line[] = [
  { t0: 24.28, t1: 26.18, text: "As I mentioned, I think today," },
  { t0: 27.03, t1: 27.9, text: "*no* *doubt..." },
];

// ---------------------------------------------------------------- master

const Defs: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="sharp">
        <feConvolveMatrix order="3" kernelMatrix="0 -0.3 0 -0.3 2.2 -0.3 0 -0.3 0" preserveAlpha="true" />
      </filter>
    </defs>
  </svg>
);

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
    <svg width={W} height={H}>
      <filter id="gr">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 3) % 8} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={W} height={H} filter="url(#gr)" />
    </svg>
  </AbsoluteFill>
);

export const Redesign: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const lastHit = HITS.reduce((a, c) => (c <= t ? c : a), -9);
  const since = (t - lastHit) * FPS;
  const decay = since >= 0 ? Math.exp(-since / 6) : 0;
  const big = [36.2, 39.15, 42.14].includes(lastHit);
  const punch = 1 + (big ? 0.05 : 0.02) * decay;
  const shake = since < 10 ? (random(`s${f}`) - 0.5) * (big ? 22 : 8) * decay : 0;
  const flash = since >= 0 && since < 5 ? (big ? [0.55, 0.3, 0.14, 0.06, 0.02] : [0.22, 0.1, 0.04, 0, 0])[Math.floor(since)] : 0;
  const accent = t < CUT.wright ? RED : t < CUT.kick ? RED : t < CUT.rio ? GOLD : t < CUT.purple ? VIOLET : t < CUT.pele ? VIOLET : t < CUT.siu ? GOLD : t < 39.15 ? RED : t < 42.14 ? VIOLET : GOLD;
  return (
    <AbsoluteFill style={{ background: "#07060d" }}>
      <Defs />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px) scale(${punch})` }}>
        <Background t={t} />
        {/* depth: big outlined words sit between the background and the card */}
        <BackWord t={t} at={12.87} until={15.13} text="ICON" color={GOLD} y={560} />
        <BackWord t={t} at={21.37} until={24.13} text="SEVEN" color={VIOLET} y={560} />
        <BackWord t={t} at={33.2} until={36.2} text="SIUU" color={RED} y={180} />
        <BackWord t={t} at={36.2} until={44.45} text="CR7" color={accent} y={1240} />
        <Card t={t} accent={accent} />
        <Opening t={t} />
        <Chip t={t} at={2.7} until={12.87} n={1} accent={RED} />
        <NamePlate t={t} at={2.67} until={12.87} name="IAN WRIGHT" role="ARSENAL LEGEND" accent={RED} />
        <Quote t={t} lines={WRIGHT} from={2.85} until={7.8} accent={RED} />
        <Quote t={t} lines={WRIGHT2} from={7.85} until={12.8} accent={RED} />
        <Label t={t} at={12.87} until={15.13} text="THE BICYCLE KICK" accent={GOLD} y={1330} />
        <Chip t={t} at={15.13} until={21.37} n={2} accent={VIOLET} />
        <NamePlate t={t} at={15.13} until={21.37} name="RIO FERDINAND" role="FORMER UNITED TEAMMATE" accent={VIOLET} />
        <Quote t={t} lines={RIO} from={15.13} until={19.6} accent={VIOLET} />
        <Quote t={t} lines={RIO2} from={19.65} until={21.3} accent={VIOLET} />
        <Chip t={t} at={24.13} until={33.2} n={3} accent={GOLD} />
        <NamePlate t={t} at={24.13} until={33.2} name="PELÉ" role="THREE-TIME WORLD CUP WINNER" accent={GOLD} />
        <Quote t={t} lines={PELE} from={24.2} until={28.05} accent={GOLD} />
        <Ladder t={t} />
        <Label t={t} at={33.2} until={36.2} text="THE GREATS AGREE" accent={RED} y={1540} />
        <Recall t={t} />
        <EndCard t={t} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: UI, fontWeight: 800, fontSize: 18, letterSpacing: "0.5em", color: "rgba(255,255,255,0.45)", opacity: t < 44.45 ? 1 : 0 }}>{HANDLE}</div>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Grain f={f} />
      <Audio src={staticFile("audio.wav")} />
    </AbsoluteFill>
  );
};
