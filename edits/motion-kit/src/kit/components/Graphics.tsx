import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { clamp, ease, progress } from "../utils/time";
import { glow } from "../styles/tokens";

// ---------------------------------------------------------------- finishing

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);

export const Grain: React.FC<{ opacity?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({ opacity = 0.06, blend = "overlay" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: blend, pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id="mk-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 3) % 8} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#mk-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// Section colour washed into opposite corners (screen blend).
export const Atmos: React.FC<{ color: string; amount?: number }> = ({ color, amount = 1 }) => (
  <AbsoluteFill style={{ opacity: amount, mixBlendMode: "screen", pointerEvents: "none", background: `radial-gradient(ellipse 60% 70% at 100% 0%, ${color}66, transparent 70%), radial-gradient(ellipse 50% 60% at 0% 100%, ${color}55, transparent 70%)` }} />
);

// Slow drifting colour blobs (aura) — background life for type/card scenes.
export const Aura: React.FC<{ t: number; colors: [string, string]; w: number; h: number; opacity?: number }> = ({ t, colors, w, h, opacity = 0.55 }) => {
  const blob = (c: string, x: number, y: number, s: number, o: number) => (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: "50%", background: `radial-gradient(circle, ${c} 0%, ${c}00 65%)`, opacity: o }} />
  );
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {blob(colors[0], w * 0.2 + Math.sin(t * 0.7) * w * 0.11, h * 0.2 + Math.cos(t * 0.5) * h * 0.07, Math.max(w, h) * 0.6, opacity)}
      {blob(colors[1], w * 0.83 + Math.cos(t * 0.6) * w * 0.11, h * 0.8 + Math.sin(t * 0.8) * h * 0.07, Math.max(w, h) * 0.65, opacity * 0.9)}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- glass

export const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; blur?: number }> = ({ style, children, blur = 18 }) => (
  <div
    style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05))",
      border: "1.5px solid rgba(255,255,255,0.3)",
      backdropFilter: `blur(${blur}px) saturate(1.4)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
      boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)",
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------- ribbons

// Diagonal ribbons with a label scrolling along them (section title cards,
// bible §Motion M1). Slide in staggered, scroll, slide out at `out`.
export const Ribbons: React.FC<{ t: number; label: string; color: string; out: number; font: string; angle?: number; rows?: { y: number; h: number; fill: boolean; dir: 1 | -1 }[] }> = ({
  t,
  label,
  color,
  out,
  font,
  angle = -17,
  rows = [
    { y: 250, h: 70, fill: true, dir: 1 },
    { y: 520, h: 46, fill: false, dir: -1 },
    { y: 760, h: 78, fill: true, dir: 1 },
    { y: 1010, h: 50, fill: false, dir: -1 },
  ],
}) => {
  const text = Array.from({ length: 14 }, () => `${label}  +  `).join("");
  return (
    <AbsoluteFill style={{ transform: `rotate(${angle}deg) scale(1.25)`, pointerEvents: "none" }}>
      {rows.map((r, i) => {
        const d = i * 0.05;
        const inP = progress(t, d, 0.45);
        const outP = interpolate(t, [out - 0.3 + d * 0.5, out + d * 0.5], [0, 1], { ...clamp, easing: ease.exit });
        const x = (1 - inP) * -2600 * r.dir + outP * 2600 * r.dir - ((t * 90 * r.dir) % 600) - 600;
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
            <div style={{ fontFamily: font, fontSize: r.h * 0.62, letterSpacing: "0.12em", color: r.fill ? "#fff" : color, whiteSpace: "nowrap", paddingLeft: 20, textShadow: r.fill ? undefined : glow(color, 0.4) }}>{text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Pop-in geometric accents (plus, ring, triangle, zigzag). Keep to 5–7.
export const Accents: React.FC<{ t: number; color: string; seed: string; until: number; items: { x: number; y: number; k: "plus" | "ring" | "tri" | "zig" }[]; w: number; h: number }> = ({ t, color, seed, until, items, w, h }) => {
  const vis = 1 - progress(t, until - 0.2, 0.2, ease.drift);
  return (
    <AbsoluteFill style={{ opacity: vis, pointerEvents: "none" }}>
      <svg width={w} height={h}>
        {items.map((it, i) => {
          const at = 0.15 + random(`${seed}${i}`) * 0.5;
          const p = progress(t, at, 0.25, ease.pop);
          const st = { stroke: color, strokeWidth: 4, fill: "none", filter: `drop-shadow(0 0 6px ${color})` } as const;
          return (
            <g key={i} transform={`translate(${it.x}, ${it.y + Math.sin((t + i) * 2.2) * 6}) scale(${p}) rotate(${t * 40 * (i % 2 ? 1 : -1)})`}>
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

// ---------------------------------------------------------------- annotations
// Draw on a frozen frame in SOURCE pixel coordinates (put them inside
// <Footage> children so they share its zoom). Measure positions on a
// gridded still first — never guess (bible §Motion M4).

export const DrawPath: React.FC<{ d: string; p: number; color: string; width?: number; dashed?: boolean; head?: boolean }> = ({ d, p, color, width = 7, dashed, head = true }) => {
  const id = `mk-hd-${color.replace("#", "")}`;
  return (
    <>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
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
        strokeDasharray={dashed ? "0.03 0.02" : `${p} 1`}
        opacity={dashed ? p : 1}
        markerEnd={head && p > 0.97 ? `url(#${id})` : undefined}
        filter={`drop-shadow(0 0 8px ${color})`}
      />
    </>
  );
};

export const Ring: React.FC<{ x: number; y: number; r: number; p: number; color: string; t: number }> = ({ x, y, r, p, color, t }) => (
  <g opacity={p}>
    <circle cx={x} cy={y} r={r * (1 + 0.12 * Math.sin(t * 9))} fill="none" stroke={color} strokeWidth={4} filter={`drop-shadow(0 0 8px ${color})`} />
    <circle cx={x} cy={y} r={r * 1.7 * p} fill="none" stroke="#fff" strokeOpacity={0.5 * (1 - p) + 0.15} strokeWidth={2} />
  </g>
);

export const Bracket: React.FC<{ box: [number, number, number, number]; p: number; color: string }> = ({ box, p, color }) => {
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

export const Callout: React.FC<{ x: number; y: number; text: string; p: number; color: string; font: string; size?: number }> = ({ x, y, text, p, color, font, size = 24 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translateY(-50%)",
      opacity: p,
      clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
      background: color,
      color: "#0a0a0f",
      fontFamily: font,
      fontWeight: 900,
      fontSize: size,
      letterSpacing: "0.12em",
      padding: "8px 16px",
      whiteSpace: "nowrap",
      boxShadow: `0 0 24px ${color}88`,
    }}
  >
    {text}
  </div>
);
