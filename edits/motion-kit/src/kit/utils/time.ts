import { Easing, interpolate } from "remotion";

// Timeline helpers. Everything in the kit is authored in SECONDS and
// converted with the composition's fps, so timings read like an edit list.

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const toFrames = (sec: number, fps: number) => Math.round(sec * fps);

// Easing presets (named by feel, used across every component).
export const ease = {
  // Fast start, long soft landing — titles, cards, most entrances.
  settle: Easing.bezier(0.16, 1, 0.3, 1),
  // Hard in-out — morphs and whips, where the middle should be a blur.
  swift: Easing.bezier(0.7, 0, 0.18, 1),
  // Accelerating exit.
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  // Gentle drift for holds and push-ins.
  drift: Easing.inOut(Easing.sin),
  // Small overshoot for pops (icons, accents — not for text blocks).
  pop: Easing.out(Easing.back(1.8)),
};

// 0→1 progress of an event that starts at `at` and lasts `dur` seconds.
export const progress = (t: number, at: number, dur: number, easing = ease.settle) =>
  interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing });

// 1→0 fade that starts at `at`.
export const fadeOut = (t: number, at: number, dur = 0.25) => interpolate(t, [at, at + dur], [1, 0], clamp);

// Piecewise-linear time remap: [[localSec, sourceSec], ...]. Two keys with
// the same source time are a freeze; steeper segments are speed-ups.
export type RemapKey = [number, number];
export const remap = (t: number, keys: RemapKey[]) =>
  interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), clamp);

// Seconds since the most recent event in `list` (Infinity if none yet).
export const sinceLast = (t: number, list: number[]) => {
  const last = list.reduce((a, c) => (c <= t ? c : a), -Infinity);
  return t - last;
};

// Stagger helper: start time of item i.
export const stagger = (at: number, i: number, step: number) => at + i * step;
