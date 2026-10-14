import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ease, progress } from "../utils/time";
import { motionBlur } from "../components/Defs";

// Transitions are written as wrappers around a scene's content, driven by
// the scene's local time and duration, so scenes stay self-contained.

// Whip in/out: content slides along an axis with directional blur. It is
// scaled up while displaced so the frame edge never shows black.
// dirIn/dirOut: +1 from left / to right, -1 the reverse.
export const Whip: React.FC<{ dur: number; dirIn?: 1 | -1 | 0; dirOut?: 1 | -1 | 0; axis?: "x" | "y"; distance?: number; children: React.ReactNode }> = ({
  dur,
  dirIn = 1,
  dirOut = 1,
  axis = "x",
  distance = 0.32,
  children,
}) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = f / fps;
  const span = (axis === "x" ? width : height) * distance;
  const e = progress(t, 0, 0.42);
  const q = interpolate(t, [dur - 0.12, dur], [0, 1], { ...clamp, easing: ease.exit });
  let off = 0;
  let blur = 0;
  if (dirIn) {
    off += (1 - e) * span * -dirIn;
    blur = Math.max(blur, 80 * Math.pow(1 - e, 1.6));
  }
  if (dirOut && q > 0) {
    off += q * span * dirOut;
    blur = Math.max(blur, 90 * q);
  }
  return (
    <AbsoluteFill style={{ transform: `${axis === "x" ? `translateX(${off}px)` : `translateY(${off}px)`} scale(${1 + (2 * Math.abs(off)) / (axis === "x" ? width : height)})`, filter: motionBlur(blur, axis) }}>{children}</AbsoluteFill>
  );
};

// Diagonal wipe reveal: the scene appears behind a moving slanted edge,
// with a bright leading bar in the accent colour.
export const DiagonalWipe: React.FC<{ dur?: number; color: string; angle?: number; children: React.ReactNode }> = ({ dur = 0.4, color, angle = 105, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = progress(f / fps, 0, dur, ease.swift);
  const edge = p * 130 - 15;
  const mask = `linear-gradient(${angle}deg, #000 ${edge}%, transparent ${edge + 0.5}%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ maskImage: p < 1 ? mask : undefined, WebkitMaskImage: p < 1 ? mask : undefined }}>{children}</AbsoluteFill>
      {p < 1 ? <AbsoluteFill style={{ background: `linear-gradient(${angle}deg, transparent ${edge - 2}%, ${color} ${edge - 0.5}%, #fff ${edge}%, transparent ${edge + 0.6}%)`, mixBlendMode: "screen" }} /> : null}
    </AbsoluteFill>
  );
};

// Zoom-through: the outgoing scene scales up and fades as it ends.
export const ZoomOut: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = interpolate(f / fps, [dur - 0.2, dur], [0, 1], { ...clamp, easing: ease.exit });
  return <AbsoluteFill style={{ transform: `scale(${1 + q * 0.6})`, opacity: 1 - q * 0.8, filter: q > 0.1 ? `blur(${q * 10}px)` : undefined }}>{children}</AbsoluteFill>;
};

// White flash for N frames from a scene's start (cuts that need a punctuation).
export const FlashIn: React.FC<{ frames?: number[] }> = ({ frames = [0.55, 0.3, 0.12, 0.04] }) => {
  const f = useCurrentFrame();
  return f < frames.length ? <AbsoluteFill style={{ background: "#fff", opacity: frames[f], pointerEvents: "none" }} /> : null;
};
