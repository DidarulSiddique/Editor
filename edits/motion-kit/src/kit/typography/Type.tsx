import React from "react";
import { ease, progress } from "../utils/time";
import { glow } from "../styles/tokens";

// ---------------------------------------------------------------- MaskWord
// Headline revealed by a skewed mask sweeping left→right, with a short
// RGB fringe that collapses as it lands (bible §Typography T1).
export const MaskWord: React.FC<{
  text: string;
  t: number;
  at: number;
  size: number;
  font: string;
  color?: string;
  glowColor?: string;
  dur?: number;
  fringe?: boolean;
  tracking?: string;
  skew?: number;
  style?: React.CSSProperties;
}> = ({ text, t, at, size, font, color = "#fff", glowColor, dur = 0.35, fringe = true, tracking = "0.01em", skew = 0, style }) => {
  const p = progress(t, at, dur);
  if (p <= 0) return null;
  const edge = p * 120 - 10;
  const mask = `linear-gradient(105deg, #000 ${edge}%, transparent ${edge + 8}%)`;
  const base: React.CSSProperties = { fontFamily: font, fontSize: size, lineHeight: 1, letterSpacing: tracking, whiteSpace: "nowrap" };
  const fr = fringe ? (1 - progress(t, at, 0.4, ease.drift)) * 8 : 0;
  return (
    <div style={{ position: "relative", maskImage: mask, WebkitMaskImage: mask, transform: `translateX(${(1 - p) * -30}px) skewX(${skew}deg)`, ...style }}>
      {fr > 0.5 ? (
        <>
          <div style={{ ...base, position: "absolute", color: "#ff2a55", opacity: 0.7, transform: `translateX(${fr}px)`, mixBlendMode: "screen" }}>{text}</div>
          <div style={{ ...base, position: "absolute", color: "#22e4ff", opacity: 0.7, transform: `translateX(${-fr}px)`, mixBlendMode: "screen" }}>{text}</div>
        </>
      ) : null}
      <div style={{ ...base, position: "relative", color, textShadow: glowColor ? glow(glowColor) : undefined }}>{text}</div>
    </div>
  );
};

// ---------------------------------------------------------------- CharRise
// Characters rise in on a stagger with a slight alternating rotation
// (T2: title slams, end cards).
export const CharRise: React.FC<{ text: string; t: number; at: number; size: number; font: string; color?: string; step?: number; rise?: number; tilt?: number; shadow?: string }> = ({
  text,
  t,
  at,
  size,
  font,
  color = "#fff",
  step = 0.045,
  rise = 1,
  tilt = 12,
  shadow,
}) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    {text.split("").map((c, i) => {
      const p = progress(t, at + i * step, 0.5);
      return (
        <span
          key={i}
          style={{
            fontFamily: font,
            fontSize: size,
            lineHeight: 1,
            whiteSpace: "pre",
            display: "inline-block",
            color,
            textShadow: shadow,
            opacity: p,
            transform: `translateY(${(1 - p) * size * 0.65 * rise}px) rotate(${(1 - p) * (i % 2 ? tilt : -tilt)}deg)`,
          }}
        >
          {c}
        </span>
      );
    })}
  </div>
);

// ---------------------------------------------------------------- Tracked
// Small tracked capitals that tighten as they appear (labels, kickers).
export const Tracked: React.FC<{ text: string; t: number; at: number; font: string; size?: number; color?: string; spacing?: number; weight?: number }> = ({
  text,
  t,
  at,
  font,
  size = 22,
  color = "#fff",
  spacing = 0.4,
  weight = 800,
}) => {
  const p = progress(t, at, 0.5);
  return (
    <div style={{ fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: `${spacing + (1 - p) * 0.4}em`, color, opacity: p, whiteSpace: "nowrap", textTransform: "uppercase" }}>
      {text}
    </div>
  );
};

// ---------------------------------------------------------------- SpokenLine
// Words appear on their spoken times (estimated within each phrase by
// character count). *starred* words are emphasis: serif italic in accent.
export type Phrase = { t0: number; t1: number; text: string };
export const wordTimes = (phrases: Phrase[]) =>
  phrases.flatMap((ln) => {
    const ws = ln.text.split(" ");
    const total = ws.reduce((a, w) => a + w.replace(/\*/g, "").length + 1, 0);
    let acc = 0;
    return ws.map((w) => {
      const at = ln.t0 + ((ln.t1 - ln.t0) * acc) / total;
      acc += w.replace(/\*/g, "").length + 1;
      return { w: w.replace(/\*/g, ""), at, em: w.startsWith("*") || w.endsWith("*") };
    });
  });
export const SpokenLine: React.FC<{ t: number; phrases: Phrase[]; ui: string; serif: string; accent: string; size?: number; dim?: string }> = ({
  t,
  phrases,
  ui,
  serif,
  accent,
  size = 62,
  dim = "rgba(255,255,255,0.25)",
}) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: size * 0.3, rowGap: 6 }}>
    {wordTimes(phrases).map((x, i) => {
      const p = progress(t, x.at - 0.05, 0.32);
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            fontFamily: x.em ? serif : ui,
            fontStyle: x.em ? "italic" : undefined,
            fontWeight: x.em ? 400 : 900,
            fontSize: x.em ? size * 1.48 : size,
            lineHeight: 1.12,
            textTransform: x.em ? undefined : "uppercase",
            color: x.em ? accent : t >= x.at ? "#fff" : dim,
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
);

// ---------------------------------------------------------------- OutlineWord
// Huge outlined word as a depth layer behind the subject/card (T5).
export const OutlineWord: React.FC<{ text: string; t: number; at: number; until: number; font: string; color: string; size?: number; drift?: number; style?: React.CSSProperties }> = ({
  text,
  t,
  at,
  until,
  font,
  color,
  size = 460,
  drift = -40,
  style,
}) => {
  const p = progress(t, at, 0.6);
  const q = 1 - progress(t, until - 0.2, 0.2, ease.drift);
  if (p <= 0 || q <= 0) return null;
  return (
    <div style={{ textAlign: "center", opacity: p * q, ...style }}>
      <span
        style={{
          fontFamily: font,
          fontSize: size,
          lineHeight: 0.9,
          color: "transparent",
          WebkitTextStroke: `3px ${color}`,
          display: "inline-block",
          transform: `translateX(${(t - at) * drift}px) scale(${1.15 - 0.15 * p})`,
          filter: `drop-shadow(0 0 20px ${color}66)`,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------- WriteOn
// Script/handwritten word revealed by a moving mask, with a faint echo copy
// below (paper/high-key looks, T6).
export const WriteOn: React.FC<{ text: string; t: number; at: number; size: number; font: string; color: string; dur?: number; echo?: boolean; rotate?: number }> = ({
  text,
  t,
  at,
  size,
  font,
  color,
  dur = 0.45,
  echo = true,
  rotate = -3,
}) => {
  const p = progress(t, at, dur, ease.drift);
  if (p <= 0) return null;
  const edge = p * 112 - 10;
  const mask = `linear-gradient(100deg, #000 ${edge}%, transparent ${edge + 10}%)`;
  const word = (extra: React.CSSProperties) => (
    <div style={{ position: "absolute", fontFamily: font, fontSize: size, lineHeight: 1, color, whiteSpace: "nowrap", padding: "0.25em 0.35em", transform: `translateY(-50%) rotate(${rotate}deg)`, maskImage: mask, WebkitMaskImage: mask, ...extra }}>{text}</div>
  );
  return (
    <div style={{ position: "relative" }}>
      {echo ? word({ opacity: 0.13, top: size * 0.42, left: size * 0.08 }) : null}
      {word({})}
    </div>
  );
};
