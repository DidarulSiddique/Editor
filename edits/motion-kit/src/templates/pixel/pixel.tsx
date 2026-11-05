// 16-bit pixel-art kit (reference: the "What if Shevchenko…" pixel videos).
// Scenes draw on a low-res canvas (PW×PH) that is scaled up with hard edges.
import React, { useLayoutEffect, useRef } from "react";
import { random } from "remotion";

export const PW = 180;
export const PH = 320;
export const SCALE = 6; // 180×320 → 1080×1920

export type Ctx = CanvasRenderingContext2D;
export const PixelCanvas: React.FC<{ draw: (c: Ctx) => void; deps: unknown[] }> = ({ draw, deps }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, PW, PH);
    draw(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <canvas ref={ref} width={PW} height={PH} style={{ position: "absolute", inset: 0, width: PW * SCALE, height: PH * SCALE, imageRendering: "pixelated" }} />;
};

export const px = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// ---------------------------------------------------------------- palette
export const P = {
  night: "#0d1530", night2: "#141f45", grass: "#2f8f3a", grass2: "#2a8434", line: "#e9f2e6",
  red: "#d7262e", red2: "#a8161d", green: "#0f7a3a", green2: "#0a5a2a", gold: "#ffd23a", gold2: "#d9a21b",
  white: "#f4f4f0", black: "#141414", wood: "#7a4a2a", wood2: "#5c341c", silver: "#e6e9ef", silver2: "#a9b0bd",
  greece: "#1f5fd1", france: "#1e3a8a", spain: "#c4161c", skinR: "#e2ae84", skinR2: "#c58c62",
};

// ---------------------------------------------------------------- backgrounds
export const sky = (c: Ctx, t: number, h = PH) => {
  px(c, 0, 0, PW, h, P.night);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(random(`sx${i}`) * PW);
    const y = Math.floor(random(`sy${i}`) * h * 0.5);
    if (Math.sin(t * 3 + i) > -0.3) px(c, x, y, 1, 1, i % 5 ? "#8fa3d9" : "#ffffff");
  }
};

// Crowd: rows of 2×2 heads in team colours, flickering. top..bottom band.
export const crowd = (c: Ctx, top: number, bottom: number, cols: string[], t: number, seed = "c", jump = 0) => {
  px(c, 0, top, PW, bottom - top, "#1b1f2e");
  for (let y = top + 1; y < bottom - 1; y += 3) {
    px(c, 0, y + 2, PW, 1, "#232838");
    for (let x = (y / 3) % 2; x < PW; x += 3) {
      const r = random(`${seed}${x}_${y}`);
      const col = r < 0.12 ? "#f0d6b8" : r < 0.2 ? "#2a2a2a" : cols[Math.floor(r * 97) % cols.length];
      const hop = jump > 0 && Math.sin(t * 14 + x * 0.7 + y) > 0.6 ? -jump : 0;
      if (random(`f${seed}${x}_${y}_${Math.floor(t * 6)}`) < 0.04) continue; // flicker
      px(c, x, y + hop, 2, 2, col);
    }
  }
};

export const pitch = (c: Ctx, top: number, bottom = PH) => {
  for (let y = top; y < bottom; y += 8) px(c, 0, y, PW, Math.min(8, bottom - y), Math.floor((y - top) / 8) % 2 ? P.grass : P.grass2);
  px(c, 0, top, PW, 1, P.line);
};

// Goal seen from the front (x = centre, y = bottom).
export const goal = (c: Ctx, x: number, y: number, w = 70, h = 26) => {
  for (let i = 0; i <= w; i += 4) px(c, x - w / 2 + i, y - h, 1, h, "#ffffff55");
  for (let j = 0; j <= h; j += 4) px(c, x - w / 2, y - h + j, w, 1, "#ffffff55");
  px(c, x - w / 2 - 2, y - h - 2, w + 4, 2, P.white);
  px(c, x - w / 2 - 2, y - h, 2, h, P.white);
  px(c, x + w / 2, y - h, 2, h, P.white);
};

export const ball = (c: Ctx, x: number, y: number) => {
  px(c, x - 1, y - 2, 3, 4, P.white);
  px(c, x - 2, y - 1, 5, 2, P.white);
  px(c, x, y - 1, 1, 1, P.black);
};

export const rain = (c: Ctx, t: number, n = 70) => {
  for (let i = 0; i < n; i++) {
    const x = (random(`rx${i}`) * PW + t * 30) % PW;
    const y = (random(`ry${i}`) * PH + t * 260) % PH;
    px(c, x, y, 1, 3, "#9fb7e844");
  }
};

export const confetti = (c: Ctx, t: number, t0: number, cols = [P.red, P.green, P.gold, P.white]) => {
  if (t < t0) return;
  for (let i = 0; i < 90; i++) {
    const x = (random(`cx${i}`) * PW + Math.sin(t * 2 + i) * 6) % PW;
    const y = ((random(`cy${i}`) * PH * 0.7 + (t - t0) * (40 + random(`cv${i}`) * 50)) % (PH * 0.9)) - 10;
    px(c, x, y, 2, 1 + (Math.floor(t * 8 + i) % 2), cols[i % cols.length]);
  }
};

// Trophy (generic cup / Euro shape / Nations League shape). x centre, y base.
export const trophy = (c: Ctx, x: number, y: number, kind: "euro" | "nl" | "wc" = "euro", lit = 1) => {
  const s1 = lit > 0.5 ? P.silver : "#6c7280";
  const s2 = lit > 0.5 ? P.silver2 : "#4b505b";
  if (kind === "euro") {
    px(c, x - 6, y - 4, 12, 4, s2);
    px(c, x - 3, y - 10, 6, 6, s1);
    px(c, x - 7, y - 26, 14, 16, s1);
    px(c, x - 9, y - 24, 2, 8, s2);
    px(c, x + 7, y - 24, 2, 8, s2);
    px(c, x - 5, y - 24, 2, 12, "#ffffff");
  } else if (kind === "nl") {
    px(c, x - 6, y - 4, 12, 4, "#2b2b5a");
    px(c, x - 2, y - 14, 4, 10, s1);
    px(c, x - 8, y - 26, 16, 12, s1);
    px(c, x - 6, y - 24, 2, 8, "#ffffff");
  } else {
    px(c, x - 5, y - 4, 10, 4, P.green);
    px(c, x - 3, y - 18, 6, 14, P.gold);
    px(c, x - 5, y - 26, 10, 8, P.gold);
  }
};

// Spotlight cone (additive-looking).
export const spot = (c: Ctx, x: number, top: number, bottom: number, w: number, a: number) => {
  if (a <= 0) return;
  c.globalAlpha = a * 0.22;
  for (let y = top; y < bottom; y++) {
    const ww = 4 + ((y - top) / (bottom - top)) * w;
    px(c, x - ww / 2, y, ww, 1, "#fff6d0");
  }
  c.globalAlpha = 1;
};

// ---------------------------------------------------------------- the player sprite
export type Hair = "frosted" | "gelled" | "fade" | "short" | "curly" | "bald" | "long";
export type Pose = "stand" | "run" | "celebrate" | "siu" | "cry" | "point" | "kick" | "header" | "back";
export type Look = { skin: string; skin2: string; hair: string; hair2?: string; style: Hair; shirt: string; shirt2: string; trim: string; shorts: string; socks: string; num?: string; band?: boolean };

export const PT: Look = { skin: P.skinR, skin2: P.skinR2, hair: "#20160f", style: "fade", shirt: P.red, shirt2: P.red2, trim: P.green, shorts: P.green, socks: P.red, num: "7", band: true };
export const RONALDO = {
  y2003: { ...PT, style: "frosted" as Hair, hair2: "#e8c26a", num: "17", band: false },
  y2008: { ...PT, style: "gelled" as Hair, num: "7", band: true },
  y2016: { ...PT, style: "fade" as Hair, num: "7", band: true },
  y2025: { ...PT, style: "short" as Hair, num: "7", band: true },
};

// Draw a big-head sprite. (x, y) = feet centre. u = pixel unit (1–4). phase drives limbs.
export const player = (c: Ctx, x: number, y: number, L: Look, pose: Pose = "stand", phase = 0, u = 2, flip = false) => {
  const R = (dx: number, dy: number, w: number, h: number, col: string) => {
    const xx = flip ? x - (dx + w) * u : x + dx * u;
    px(c, xx, y + dy * u, w * u, h * u, col);
  };
  const run = pose === "run" || pose === "kick";
  const sw = run ? Math.round(Math.sin(phase) * 2) : 0;
  const bob = run ? (Math.abs(Math.cos(phase)) > 0.7 ? -1 : 0) : 0;
  const jump = pose === "header" ? -4 : pose === "celebrate" || pose === "siu" ? -Math.max(0, Math.round(Math.sin(phase) * 2)) : 0;
  const oy = bob + jump;
  // shadow
  R(-5, -1, 10, 1, "#00000055");
  // legs: socks + boots
  const lx = -3 + (run ? sw : 0);
  const rx = 1 - (run ? sw : 0);
  R(lx, -8 + oy, 2, 6, L.socks);
  R(rx, -8 + oy, 2, 6, L.socks);
  R(lx, -10 + oy, 2, 2, L.skin);
  R(rx, -10 + oy, 2, 2, L.skin);
  R(lx - 1, -2 + oy, 3, 2, P.black);
  R(rx, -2 + oy, 3, 2, P.black);
  if (pose === "kick") R(rx + 1, -7 + oy, 3, 2, L.socks);
  // shorts
  R(-4, -13 + oy, 8, 4, L.shorts);
  R(-1, -11 + oy, 1, 2, "#00000033");
  // torso
  R(-5, -21 + oy, 10, 8, L.shirt);
  R(-5, -21 + oy, 10, 1, L.trim);
  R(3, -20 + oy, 2, 7, L.shirt2);
  if (pose === "back" && L.num) {
    // number on the back as a light block pattern
    R(-2, -19 + oy, L.num.length > 1 ? 5 : 3, 4, P.white);
    R(-1, -18 + oy, 1, 2, L.shirt);
  }
  // arms
  const armUp = pose === "celebrate" || pose === "header";
  if (armUp) {
    R(-7, -27 + oy, 2, 7, L.shirt);
    R(5, -27 + oy, 2, 7, L.shirt);
    R(-7, -29 + oy, 2, 2, L.skin);
    R(5, -29 + oy, 2, 2, L.skin);
  } else if (pose === "siu") {
    R(-9, -19 + oy, 4, 2, L.shirt);
    R(5, -19 + oy, 4, 2, L.shirt);
    R(-10, -19 + oy, 1, 2, L.skin);
    R(9, -19 + oy, 1, 2, L.skin);
  } else if (pose === "point") {
    R(-7, -20 + oy, 2, 5, L.shirt);
    R(-7, -15 + oy, 2, 2, L.skin);
    R(5, -21 + oy, 6, 2, L.shirt);
    R(11, -21 + oy, 2, 2, L.skin);
  } else if (pose === "cry") {
    R(-7, -20 + oy, 2, 5, L.shirt);
    R(5, -20 + oy, 2, 5, L.shirt);
    R(-6, -24 + oy, 2, 3, L.skin);
    R(4, -24 + oy, 2, 3, L.skin);
  } else {
    const a = run ? -sw : 0;
    R(-7, -20 + oy + a, 2, 5, L.shirt);
    R(5, -20 + oy - a, 2, 5, L.shirt);
    R(-7, -15 + oy + a, 2, 2, L.skin);
    R(5, -15 + oy - a, 2, 2, L.skin);
  }
  if (L.band) R(armUp ? -7 : pose === "siu" ? -8 : -7, armUp ? -24 + oy : pose === "siu" ? -19 + oy : -19 + oy, 2, 1, P.gold);
  // head (big)
  const hy = -30 + oy + (pose === "cry" ? 1 : 0);
  R(-4, hy, 8, 9, L.skin);
  R(3, hy + 1, 1, 7, L.skin2);
  R(-1, hy + 8, 3, 1, L.skin2); // neck shade
  if (pose !== "back") {
    R(-3, hy + 4, 1, 2, P.black);
    R(1, hy + 4, 1, 2, P.black);
    R(-1, hy + 7, 2, 1, pose === "celebrate" || pose === "siu" || pose === "header" ? "#7a1f1f" : L.skin2);
    if (pose === "cry") {
      R(-3, hy + 6, 1, 2, "#7fc4ff");
      R(1, hy + 6, 1, 2, "#7fc4ff");
    }
  }
  // hair
  const H = L.hair;
  const H2 = L.hair2 ?? L.hair;
  switch (L.style) {
    case "frosted": // spiky with blond tips (2003)
      R(-4, hy - 1, 8, 3, H);
      R(-4, hy - 3, 1, 2, H2);
      R(-2, hy - 4, 1, 3, H2);
      R(0, hy - 3, 1, 2, H2);
      R(2, hy - 4, 1, 3, H2);
      R(-5, hy, 1, 4, H);
      break;
    case "gelled": // slicked up quiff (2006–11)
      R(-4, hy - 1, 8, 3, H);
      R(-3, hy - 3, 6, 2, H);
      R(-1, hy - 4, 3, 1, H);
      R(-5, hy + 1, 1, 3, H);
      break;
    case "fade": // short top, shaved sides (2014–18)
      R(-4, hy - 2, 8, 3, H);
      R(-4, hy + 1, 1, 2, "#5a4636");
      R(3, hy + 1, 1, 2, "#5a4636");
      break;
    case "short":
      R(-4, hy - 1, 8, 2, H);
      R(-4, hy + 1, 1, 2, H);
      break;
    case "curly":
      R(-5, hy - 2, 10, 4, H);
      for (let i = -5; i < 5; i += 2) R(i, hy - 3, 1, 1, H);
      break;
    case "long":
      R(-5, hy - 2, 10, 3, H);
      R(-5, hy + 1, 2, 6, H);
      R(3, hy + 1, 2, 6, H);
      break;
    case "bald":
      break;
  }
  if (pose === "back") R(-4, hy, 8, 5, H);
};

// Greek / French / generic kits for opponents.
export const kit = (shirt: string, shirt2: string, shorts: string, socks: string, skin = "#e6b48c", hair = "#2a1a10", style: Hair = "short"): Look => ({
  skin, skin2: "#c08a64", hair, style, shirt, shirt2, trim: shirt2, shorts, socks,
});
