import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { sinceLast } from "../utils/time";

// Hit-driven camera: punch-in + decaying shake + optional RGB split on cuts
// and musical hits. Wrap the whole picture (not the UI/HUD) in it.
//
//   <HitCamera hits={[1.3, 3.62]} bigHits={[36.2]}>{scene}</HitCamera>
//
// Defaults are deliberately small (bible §Camera: impact must not hide the
// action). bigHits get ~2.5x the energy and a white flash.
export const HitCamera: React.FC<{
  hits: number[];
  bigHits?: number[];
  punch?: number;
  shake?: number;
  rgb?: boolean;
  flash?: boolean;
  children: React.ReactNode;
}> = ({ hits, bigHits = [], punch = 0.03, shake = 10, rgb = true, flash = true, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const sBig = sinceLast(t, bigHits) * fps;
  const sAny = Math.min(sinceLast(t, hits) * fps, sBig);
  const big = sBig <= sAny + 0.001;
  const decay = Number.isFinite(sAny) ? Math.exp(-sAny / 5) : 0;
  const k = big ? 2.5 : 1;
  const dx = sAny < 8 ? (random(`cx${f}`) - 0.5) * shake * k * decay : 0;
  const dy = sAny < 8 ? (random(`cy${f}`) - 0.5) * shake * 0.7 * k * decay : 0;
  const filter = rgb && sAny < 2 ? "url(#mk-rgb12)" : rgb && sAny < 5 ? "url(#mk-rgb6)" : undefined;
  const flashO = flash && big && sBig < 4 ? [0.6, 0.32, 0.14, 0.05][Math.floor(sBig)] : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${1 + punch * k * decay})`, filter }}>{children}</AbsoluteFill>
      {flashO > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flashO }} /> : null}
    </AbsoluteFill>
  );
};

// Layout morph between scenes: [start sec, layout at start, layout at end].
// On each scene change the box morphs from where the last scene ended
// (`morph` seconds, hard in-out), then drifts to the scene's end layout.
export type Box = { cx: number; cy: number; w: number; h: number; r: number; ry: number; z: number };
export type MorphScene = [number, Box, Box];
const mix = (a: Box, b: Box, p: number) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k as keyof Box] + (b[k as keyof Box] - a[k as keyof Box]) * p])) as Box;
export const morphLayout = (t: number, scenes: MorphScene[], morph = 0.42, easeMorph = (x: number) => x, easeDrift = (x: number) => x): Box => {
  let i = 0;
  while (i < scenes.length - 1 && scenes[i + 1][0] <= t) i++;
  const [at, A, B] = scenes[i];
  const next = i < scenes.length - 1 ? scenes[i + 1][0] : at + 1;
  const base = mix(A, B, easeDrift(Math.min(1, Math.max(0, (t - at) / (next - at)))));
  if (i === 0 || t >= at + morph) return base;
  return mix(scenes[i - 1][2], base, easeMorph(Math.min(1, Math.max(0, (t - at) / morph))));
};
