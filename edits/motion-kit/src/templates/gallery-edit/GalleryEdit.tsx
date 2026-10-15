import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig, Freeze } from "remotion";
import "@fontsource/playfair-display/900.css";
import "@fontsource/playfair-display/900-italic.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import { CLIPS, FRAME_PHOTO, GALLERY, HEROES, Hero, MUSIC, OH_PHOTO, PREVIEW, STAR_CARDS, STRIP, TEXT, YEA_HERO } from "./config";
import { KitDefs, clamp, ease, progress } from "../../kit";

// GALLERY EDIT — landscape 1920x1080, 30 fps, built shot-for-shot on the
// structure of R03 (framez_00 "Love Me"): 3D card corridor fly-in, 2.5D
// hero cards with extruded serif words behind/in front of the player, tile
// wall pull-back to B&W, flash/whip/iris clip run, giant word behind the
// player, break-apart strip, gilt frame on a wall, framed-photo wall with a
// camera roll, push through a frame into a starfield, and the recursive
// pull-back into a giant glowing "ME".
export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const END = 41.0;
export const FRAMES = Math.round(END * FPS);

const SERIF = "'Playfair Display', serif";
const UI = "Inter, sans-serif";
const GOLD = "#f0c040";
const CREAM = "#fbeedd";
const NEON = ["#c6ff3d", "#ff3dd2", "#ff8a2b", "#2fe6ff", "#9b6bff", "#ffe14a"];

// Section starts (bar grid of the song: 3.33 s per bar from 1.93 s).
const S = { fly: 0, h1: 1.93, h2: 5.27, h3: 8.6, h4: 11.93, oh: 14.1, wall: 15.3, c1: 18.7, c2: 20.5, c3: 22.2, yea: 24.0, strip: 26.4, gilt: 28.5, frames: 29.95, push: 32.55, stars: 32.95, recur: 36.55, end: 38.35 };
const HITS = [1.93, 5.27, 8.6, 11.93, 14.1, 15.3, 18.7, 20.5, 22.2, 24.0, 26.4, 28.5, 29.95, 32.95, 36.55];

const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------------------------------------------------------------- 3D engine
// A camera and a list of flat items in world space (x right, y down,
// z away from camera). Each item is projected by CSS perspective as its own
// layer and painted far→near, which is reliable in headless Chrome (no
// preserve-3d sorting issues).
type Cam = { x: number; y: number; z: number; yaw?: number; roll?: number };
type Item = { key: string; x: number; y: number; z: number; ry?: number; rx?: number; rz?: number; w: number; h: number; node: React.ReactNode; fog?: boolean };
const PERSP = 1100;
const Space: React.FC<{ cam: Cam; items: Item[]; fogFrom?: number; fogTo?: number }> = ({ cam, items, fogFrom = 2600, fogTo = 6500 }) => {
  const yaw = ((cam.yaw ?? 0) * Math.PI) / 180;
  const placed = items
    .map((it) => {
      const dx = it.x - cam.x;
      const dz = it.z - cam.z;
      const x = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const d = dx * Math.sin(yaw) + dz * Math.cos(yaw);
      return { it, x, y: it.y - cam.y, d };
    })
    .filter((p) => p.d > -PERSP * 0.82)
    .sort((a, b) => b.d - a.d);
  return (
    <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: "50% 50%", transform: `rotate(${cam.roll ?? 0}deg)` }}>
      {placed.map(({ it, x, y, d }) => {
        const near = interpolate(d, [-PERSP * 0.82, -PERSP * 0.55], [0, 1], clamp);
        const fog = it.fog === false ? 1 : interpolate(d, [fogFrom, fogTo], [1, 0], clamp);
        return (
          <div
            key={it.key}
            style={{
              position: "absolute",
              left: W / 2 - it.w / 2,
              top: H / 2 - it.h / 2,
              width: it.w,
              height: it.h,
              transform: `translate3d(${x}px, ${y}px, ${-d}px) rotateY(${(it.ry ?? 0) + (cam.yaw ?? 0)}deg) rotateX(${it.rx ?? 0}deg) rotateZ(${it.rz ?? 0}deg)`,
              opacity: near * fog,
            }}
          >
            {it.node}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3D text
// Real extrusion: N copies of the word stepped back along the word's own
// normal, each projected through one perspective, front face lit + glow.
const Extrude: React.FC<{
  text: string;
  size: number;
  ry?: number;
  rx?: number;
  rz?: number;
  z?: number;
  depth?: number;
  layers?: number;
  face?: string;
  side?: [string, string];
  glow?: string;
  italic?: boolean;
  persp?: number;
  style?: React.CSSProperties;
}> = ({ text, size, ry = 0, rx = 0, rz = 0, z = 0, depth = 0.3, layers = 22, face = CREAM, side = ["#b98a55", "#3b2412"], glow, italic, persp = 1600, style }) => {
  const step = (size * depth) / layers;
  const base: React.CSSProperties = { fontFamily: SERIF, fontWeight: 900, fontStyle: italic ? "italic" : undefined, fontSize: size, lineHeight: 1, whiteSpace: "nowrap", letterSpacing: "0.01em" };
  return (
    <div style={{ position: "absolute", perspective: persp, ...style }}>
      {Array.from({ length: layers + 1 }).map((_, j) => {
        const i = layers - j;
        const c = i === 0 ? face : mixHex(side[0], side[1], i / layers);
        return (
          <div
            key={i}
            style={{
              ...base,
              position: i === 0 ? "relative" : "absolute",
              left: 0,
              top: 0,
              color: c,
              transform: `translateZ(${z}px) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg) translateZ(${-i * step}px)`,
              textShadow: i === 0 && glow ? `0 0 18px ${glow}, 0 0 48px ${glow}88` : i === layers ? "0 18px 30px rgba(0,0,0,0.55)" : undefined,
              backgroundImage: i === 0 ? `linear-gradient(180deg, #ffffff 0%, ${face} 55%, ${mixHex(face, "#000000", 0.18)} 100%)` : undefined,
              WebkitBackgroundClip: i === 0 ? "text" : undefined,
              backgroundClip: i === 0 ? "text" : undefined,
              WebkitTextFillColor: i === 0 ? "transparent" : undefined,
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
};
const mixHex = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, k) => Math.round(v + (pb[k] - v) * p)).join(",")})`;
};

// Fly-in wrapper: from depth with blur, settling (≈ 8 frames).
const FlyIn: React.FC<{ t: number; at: number; from?: [number, number]; dur?: number; out?: number; children: React.ReactNode }> = ({ t, at, from = [0, 0], dur = 0.3, out, children }) => {
  const p = progress(t, at, dur, ease.settle);
  const q = out !== undefined ? 1 - progress(t, out, 0.25, ease.exit) : 1;
  if (p <= 0 || q <= 0) return null;
  const blur = (1 - p) * 14 + (1 - q) * 10;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, p * 1.4) * q, transform: `translate(${(1 - p) * from[0]}px, ${(1 - p) * from[1]}px) scale(${1 + (1 - p) * 0.6 + (1 - q) * 0.3})`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- pieces

const Gilt: React.FC<{ w: number; h: number; thick?: number; children?: React.ReactNode; shadow?: boolean }> = ({ w, h, thick = 34, children, shadow = true }) => (
  <div
    style={{
      position: "relative",
      width: w,
      height: h,
      boxSizing: "border-box",
      padding: thick,
      background: "linear-gradient(135deg, #4a2806 0%, #e8c36a 18%, #8a5a1c 36%, #f8e09a 52%, #7a4a10 70%, #d9ae55 86%, #5a3208 100%)",
      boxShadow: `${shadow ? "0 30px 60px rgba(0,0,0,0.45), " : ""}inset 0 0 0 2px #2e1803, inset 0 0 0 ${thick * 0.45}px rgba(255,236,170,0.12), inset 0 0 22px rgba(0,0,0,0.55)`,
    }}
  >
    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 2px, transparent 2px 7px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 7px)", mixBlendMode: "overlay" }} />
    <div style={{ position: "absolute", inset: thick * 0.32, border: `${Math.max(2, thick * 0.12)}px solid rgba(255,232,160,0.6)`, boxShadow: "inset 0 0 6px rgba(0,0,0,0.6)" }} />
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", boxShadow: "inset 0 0 24px rgba(0,0,0,0.85)", background: "#111" }}>{children}</div>
  </div>
);

const Pic: React.FC<{ src: string; pos?: string; filter?: string }> = ({ src, pos = "50% 35%", filter }) => (
  <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, filter, display: "block" }} />
);

const Tag: React.FC<{ id: string; style?: React.CSSProperties }> = ({ id, style }) =>
  PREVIEW ? (
    <div style={{ position: "absolute", right: 26, top: 22, padding: "6px 14px", borderRadius: 999, background: "rgba(0,0,0,0.6)", border: "1.5px dashed rgba(255,255,255,0.75)", fontFamily: UI, fontWeight: 800, fontSize: 18, letterSpacing: "0.14em", color: "#fff", zIndex: 99, ...style }}>{id} · STAND-IN</div>
  ) : null;

const Bokeh: React.FC<{ t: number; seed: string; color?: string; n?: number }> = ({ t, seed, color = "#ffd9f0", n = 18 }) => (
  <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
    {Array.from({ length: n }).map((_, i) => {
      const s = 40 + random(`${seed}s${i}`) * 140;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`${seed}x${i}`) * W + Math.sin(t * 0.6 + i) * 30,
            top: random(`${seed}y${i}`) * H - t * 25 * random(`${seed}v${i}`),
            width: s,
            height: s,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}55 0%, ${color}22 45%, transparent 70%)`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

const Vignette: React.FC<{ k?: number; color?: string }> = ({ k = 0.6, color = "0,0,0" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 72% 72% at 50% 50%, transparent 52%, rgba(${color},${k}) 100%)`, pointerEvents: "none" }} />
);

// ---------------------------------------------------------------- A · corridor fly-in (R03 0–1.9 s)

const Corridor: React.FC = () => {
  const t = useT();
  const items: Item[] = [];
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1;
    const k = Math.floor(i / 2);
    const col = NEON[i % NEON.length];
    items.push({
      key: `c${i}`,
      x: side * (760 + random(`cx${i}`) * 120),
      y: -60 + random(`cy${i}`) * 160 - 60,
      z: 700 + k * 820 + (side > 0 ? 380 : 0),
      ry: side * -58,
      w: 620,
      h: 380,
      node: (
        <div style={{ width: "100%", height: "100%", border: `3px solid ${col}`, boxShadow: `0 0 40px ${col}, 0 0 90px ${col}66`, background: "#000" }}>
          <Pic src={GALLERY[i % GALLERY.length]} filter={`saturate(1.3) contrast(1.1) brightness(0.95) sepia(0.15) hue-rotate(${(i * 37) % 60 - 30}deg)`} />
          <div style={{ position: "absolute", inset: 0, background: col, mixBlendMode: "color", opacity: 0.35 }} />
        </div>
      ),
    });
  }
  // the destination card: hero photo inside a glowing stage
  items.push({
    key: "dest",
    x: 0,
    y: -20,
    z: 7900,
    w: 1500,
    h: 860,
    fog: false,
    node: (
      <div style={{ width: "100%", height: "100%", border: `4px solid ${GOLD}`, boxShadow: `0 0 80px ${GOLD}, 0 0 200px ${GOLD}88` }}>
        <Pic src={HEROES[0].photo} pos="50% 30%" filter="saturate(1.2) contrast(1.1)" />
      </div>
    ),
  });
  const camZ = interpolate(t, [0, 1.75], [-600, 6650], { ...clamp, easing: ease.drift });
  const sway = Math.sin(t * 2.2) * 40;
  const white = interpolate(t, [1.55, 1.93], [0, 1], clamp);
  const fadeIn = interpolate(t, [0, 0.35], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fadeIn, filter: `brightness(${1 + white * 2.5})` }}>
        <Space cam={{ x: sway, y: -30, z: camZ, yaw: Math.sin(t * 1.4) * 3, roll: Math.sin(t * 1.1) * 2.5 }} items={items} fogFrom={3200} fogTo={7600} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: white * 0.9 }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- B · hero cards (R03 2.1–14 s)

type Layout = { a: { x: number; y: number; ry: number; size: number }; b: { x: number; y: number; ry: number; size: number } };
const LAYOUTS: Layout[] = [
  { a: { x: 90, y: 70, ry: 28, size: 230 }, b: { x: 1350, y: 610, ry: -30, size: 250 } },
  { a: { x: 1150, y: 90, ry: -30, size: 210 }, b: { x: 1240, y: 330, ry: -30, size: 230 } },
  { a: { x: 120, y: 720, ry: 26, size: 220 }, b: { x: 1420, y: 420, ry: -32, size: 250 } },
  { a: { x: 1260, y: 120, ry: -28, size: 220 }, b: { x: 140, y: 560, ry: 30, size: 250 } },
];

const HeroCard: React.FC<{ hero: Hero; n: number; dur: number }> = ({ hero, n, dur }) => {
  const t = useT();
  const L = LAYOUTS[n % LAYOUTS.length];
  // camera: whip-zoom in (6 f), then slow push; cut-out moves faster than bg (parallax)
  const whip = interpolate(t, [0, 0.22], [1, 0], { ...clamp, easing: ease.settle });
  const push = interpolate(t, [0, dur], [0, 1], clamp);
  const hD = H * hero.scale;
  const wD = hD * hero.ar;
  const top = 0.07 * H - hero.ytop * hD;
  const drift = (n % 2 ? -1 : 1) * 30 * push;
  const caption = hero.caption.split(" ");
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.18 + 0.08 * push + whip * 0.35}) translateX(${-drift * 0.5}px)`, filter: `blur(${10 + whip * 10}px) saturate(1.35) brightness(0.8)` }}>
        <Pic src={hero.photo} pos="50% 40%" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(120deg, rgba(255,60,170,0.18), rgba(60,40,140,0.25) 60%, rgba(255,140,60,0.15))", mixBlendMode: "screen" }} />
      <Bokeh t={t} seed={`h${n}`} />
      {/* word A sits BEHIND the player */}
      <FlyIn t={t} at={0.12} from={[L.a.ry > 0 ? -220 : 220, 0]}>
        <Extrude text={TEXT.words.a} size={L.a.size} ry={L.a.ry} rx={-6} face="#fff1f6" side={["#d79ab8", "#3a1830"]} glow="#ffb3da" style={{ left: L.a.x, top: L.a.y }} />
      </FlyIn>
      <div style={{ position: "absolute", left: hero.x - wD * hero.cx + drift, top, width: wD, height: hD, transform: `scale(${1.02 + 0.07 * push + whip * 0.5})`, transformOrigin: "50% 30%", filter: whip > 0.2 ? `blur(${whip * 8}px)` : undefined }}>
        <Img src={staticFile(hero.cut)} style={{ width: "100%", height: "100%", filter: "contrast(1.08) saturate(1.15) drop-shadow(0 0 30px rgba(255,200,230,0.35)) drop-shadow(0 30px 40px rgba(0,0,0,0.5))" }} />
      </div>
      {/* word B in FRONT */}
      <FlyIn t={t} at={0.45} from={[L.b.ry > 0 ? -260 : 260, 40]}>
        <Extrude text={TEXT.words.b} size={L.b.size} ry={L.b.ry} rx={-4} face="#fff1f6" side={["#d79ab8", "#3a1830"]} glow="#ffb3da" style={{ left: L.b.x, top: L.b.y }} />
      </FlyIn>
      {/* light sweep across the frame */}
      <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${push * 160 - 40}%, rgba(255,255,255,0.18) ${push * 160 - 30}%, transparent ${push * 160 - 20}%)`, mixBlendMode: "screen" }} />
      {/* caption: big, readable, typed word by word on a glass bar */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, display: "flex", justifyContent: "center", opacity: progress(t, 0.5, 0.3) }}>
        <div style={{ padding: "14px 30px", borderRadius: 14, background: "rgba(10,6,14,0.55)", border: "1.5px solid rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", display: "flex", gap: 16 }}>
          {caption.map((w, i) => {
            const p = progress(t, 0.6 + i * 0.09, 0.2);
            return (
              <span key={i} style={{ fontFamily: UI, fontWeight: 900, fontSize: 40, letterSpacing: "0.08em", color: w === "·" ? GOLD : "#fff", opacity: p, transform: `translateY(${(1 - p) * 14}px)`, display: "inline-block" }}>
                {w}
              </span>
            );
          })}
        </div>
      </div>
      <Vignette k={0.55} />
      <Tag id={hero.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- C · OH [frame] BABY gold card (R03 14.1–15.3 s)

const OhBaby: React.FC = () => {
  const t = useT();
  const spin = Math.sin(t * 3) * 18;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #ffe9a8 0%, #f0b93a 45%, #8a5a10 100%)" }}>
      <Bokeh t={t} seed="oh" color="#fff6c8" n={14} />
      <FlyIn t={t} at={0.0} from={[-300, 0]} out={0.85}>
        <Extrude text={TEXT.words.c} size={250} ry={22} face="#fffaf0" side={["#c58a1c", "#5a3606"]} glow="#fff2b0" style={{ left: 230, top: 380 }} />
      </FlyIn>
      <div style={{ position: "absolute", left: W / 2 - 170, top: H / 2 - 230, perspective: 1200 }}>
        <div style={{ transform: `rotateY(${spin}deg) scale(${0.9 + progress(t, 0, 0.3) * 0.1})` }}>
          <Gilt w={340} h={460} thick={26}>
            <Pic src={OH_PHOTO} />
          </Gilt>
        </div>
      </div>
      <FlyIn t={t} at={0.18} from={[300, 0]} out={0.7}>
        <Extrude text={TEXT.words.d} size={250} ry={-22} face="#fffaf0" side={["#c58a1c", "#5a3606"]} glow="#fff2b0" style={{ left: 1150, top: 380 }} />
      </FlyIn>
      <Vignette k={0.35} color="60,30,0" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- D · tile wall pull-back to B&W (R03 15.3–18.7 s)

const TileWall: React.FC = () => {
  const t = useT();
  const items: Item[] = [];
  let k = 0;
  for (let r = -2; r <= 2; r++)
    for (let c = -3; c <= 3; c++) {
      const center = r === 0 && c === 0;
      items.push({
        key: `t${r}${c}`,
        x: c * 600 + (r % 2 ? 300 : 0) + (random(`tx${r}${c}`) - 0.5) * 80,
        y: r * 380 + (random(`ty${r}${c}`) - 0.5) * 60,
        z: center ? 0 : 60 + random(`tz${r}${c}`) * 260,
        ry: center ? 0 : (random(`tr${r}${c}`) - 0.5) * 36,
        rz: center ? 0 : (random(`tq${r}${c}`) - 0.5) * 14,
        w: 560,
        h: 340,
        fog: false,
        node: (
          <div style={{ width: "100%", height: "100%", border: center ? `3px solid ${GOLD}` : "2px solid rgba(255,255,255,0.7)", boxShadow: center ? `0 0 40px ${GOLD}` : "0 20px 40px rgba(0,0,0,0.6)" }}>
            <Pic src={center ? GALLERY[3] : GALLERY[k++ % GALLERY.length]} />
          </div>
        ),
      });
    }
  const camZ = interpolate(t, [0, 3.4], [-700, -2100], { ...clamp, easing: ease.drift });
  const roll = interpolate(t, [0, 3.4], [0, -8], { ...clamp, easing: ease.drift });
  const bw = interpolate(t, [1.85, 2.15], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#0a0a0d" }}>
      <AbsoluteFill style={{ filter: `grayscale(${bw}) contrast(${1 + bw * 0.15})` }}>
        <Space cam={{ x: interpolate(t, [0, 3.4], [0, 180], clamp), y: 0, z: camZ, roll }} items={items} fogFrom={9000} fogTo={12000} />
      </AbsoluteFill>
      <Vignette k={0.7} />
      {/* serif words slide across with motion blur */}
      {[
        { w: TEXT.words.a, at: 1.3, y: 250, dir: 1 },
        { w: TEXT.words.b, at: 2.3, y: 560, dir: -1 },
      ].map(({ w, at, y, dir }) => {
        const p = interpolate(t, [at, at + 1.1], [0, 1], clamp);
        if (p <= 0 || p >= 1) return null;
        const x = lerp(dir > 0 ? -900 : W + 100, dir > 0 ? W + 100 : -900, ease.swift(p));
        const v = Math.abs(ease.swift(Math.min(1, p + 0.02)) - ease.swift(p)) * 4000;
        return (
          <div key={w} style={{ position: "absolute", left: x, top: y, filter: v > 6 ? `blur(${Math.min(18, v / 6)}px)` : undefined }}>
            <Extrude text={w} size={260} ry={dir * -16} face="#ffffff" side={["#9a9a9a", "#202020"]} glow="#ffffff" />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- E · clip run with flash / whip / iris (R03 18.7–24 s)

const ClipShot: React.FC<{ n: number; dur: number; kind: "flash" | "whip" | "iris" }> = ({ n, dur, kind }) => {
  const t = useT();
  const c = CLIPS[n];
  const push = interpolate(t, [0, dur], [1.04, 1.18], clamp);
  const whip = kind === "whip" ? interpolate(t, [0, 0.25], [1, 0], { ...clamp, easing: ease.settle }) : 0;
  const iris = kind === "iris" ? interpolate(t, [0, 0.3], [0, 1], { ...clamp, easing: ease.settle }) : 1;
  const flash = kind === "flash" ? interpolate(t, [0, 0.15], [1, 0], clamp) : 0;
  const grade = ["saturate(0.85) contrast(1.15) brightness(1.04)", "saturate(1.15) contrast(1.12)", "saturate(1.05) contrast(1.15) brightness(0.95)"][n];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ clipPath: kind === "iris" ? `circle(${iris * 75}% at 50% 50%)` : undefined }}>
        <AbsoluteFill style={{ transform: `translateX(${whip * -500}px) scale(${push + whip * 0.2})`, filter: whip > 0.1 ? "url(#mk-bx40)" : undefined }}>
          <Freeze frame={Math.round((c.start + t * 0.8) * FPS)}>
            <OffthreadVideo src={staticFile(c.file)} muted style={{ width: W, height: H, filter: `url(#mk-sharpen) ${grade}` }} />
          </Freeze>
        </AbsoluteFill>
        <Vignette k={0.75} />
        <FlyIn t={t} at={0.15} from={[-200, 0]}>
          <Extrude text={TEXT.words.a} size={210} ry={24} italic face="#ffffff" side={["#a8b8c8", "#1a2430"]} glow="#ffffff" style={{ left: 110, top: 300 }} />
        </FlyIn>
        <FlyIn t={t} at={0.55} from={[200, 0]}>
          <div style={{ opacity: 0.55 }}>
            <Extrude text={TEXT.words.b} size={210} ry={-24} italic face="#ffffff" side={["#a8b8c8", "#1a2430"]} style={{ left: 1430, top: 520 }} />
          </div>
        </FlyIn>
      </AbsoluteFill>
      {kind === "iris" && iris < 1 ? <div style={{ position: "absolute", left: W / 2 - iris * 0.75 * 1100, top: H / 2 - iris * 0.75 * 1100, width: iris * 1.5 * 1100, height: iris * 1.5 * 1100, borderRadius: "50%", border: `4px solid ${GOLD}`, boxShadow: `0 0 40px ${GOLD}` }} /> : null}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Tag id={c.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- F · giant word behind the player (R03 24–26.4 s)

const Yea: React.FC = () => {
  const t = useT();
  const hero = YEA_HERO;
  const push = interpolate(t, [0, 2.4], [0, 1], clamp);
  const hD = H * 1.25;
  const wD = hD * hero.ar;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.15 + 0.06 * push})`, filter: "blur(9px) saturate(1.2) brightness(0.7)" }}>
        <Pic src={hero.photo} pos="50% 45%" />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", transform: `scale(${1.25 - 0.18 * progress(t, 0, 0.5)}) translateY(${-push * 20}px)` }}>
        <div style={{ position: "relative", height: 700 }}>
          <Extrude text={TEXT.words.e} size={640} rx={10} face="#ffffff" side={["#b4b4c0", "#1c1c26"]} glow="#ffffff" depth={0.12} layers={18} style={{ position: "relative" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: hero.x - wD / 2, top: 0.12 * H - hero.ytop * hD, width: wD, height: hD, transform: `scale(${1 + 0.06 * push})`, transformOrigin: "50% 40%" }}>
        <Img src={staticFile(hero.cut)} style={{ width: "100%", height: "100%", filter: "contrast(1.08) saturate(1.1) drop-shadow(0 30px 40px rgba(0,0,0,0.6))" }} />
      </div>
      <Vignette k={0.6} />
      <Tag id={hero.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- G · slanted strip breaks apart (R03 26.4–28.4 s)

const Strip: React.FC = () => {
  const t = useT();
  const pull = progress(t, 0, 0.9, ease.settle);
  const split = progress(t, 0.9, 0.9, ease.settle);
  const bw = interpolate(t, [0.9, 1.25], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#f4f4f2" }}>
      <AbsoluteFill style={{ perspective: 1400 }}>
        {STRIP.map((src, i) => {
          const x = (i - 1.5) * (340 + split * 120);
          const rot = split * (i % 2 ? 9 : -8) + (i - 1.5) * split * 3;
          const y = split * (i % 2 ? 50 : -40);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: W / 2 - 170 + x,
                top: H / 2 - 330 + y,
                width: 340,
                height: 660,
                transform: `scale(${1.9 - 0.9 * pull}) rotateZ(${-8 + rot}deg) rotateY(${split * (i - 1.5) * 10}deg)`,
                transformOrigin: `${50 - x / 6}% 50%`,
                border: "6px solid #fff",
                boxShadow: "0 30px 50px rgba(0,0,0,0.35)",
                filter: `grayscale(${bw})`,
                overflow: "hidden",
              }}
            >
              <Pic src={src} pos="50% 30%" />
            </div>
          );
        })}
      </AbsoluteFill>
      <FlyIn t={t} at={0.95} from={[-240, 0]}>
        <Extrude text={TEXT.words.c} size={220} ry={20} face="#ffffff" side={["#8c8c8c", "#222222"]} style={{ left: 120, top: 90 }} />
      </FlyIn>
      <FlyIn t={t} at={1.35} from={[240, 0]}>
        <Extrude text={TEXT.words.d} size={220} ry={-20} face="#ffffff" side={["#8c8c8c", "#222222"]} style={{ left: 1150, top: 740 }} />
      </FlyIn>
      <Vignette k={0.25} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- H · gilt frame on a white wall (R03 47.5–49 s)

const GiltWall: React.FC = () => {
  const t = useT();
  const z = interpolate(t, [0, 0.55, 1.45], [0.92, 1.12, 0.78], { ...clamp, easing: ease.drift });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #ffffff 0%, #e9e7e3 50%, #2a2826 100%)" }}>
      <div style={{ position: "absolute", left: W / 2 - 480, top: H / 2 - 330, transform: `scale(${z})` }}>
        <Gilt w={960} h={660} thick={48}>
          <Pic src={FRAME_PHOTO} pos="50% 40%" />
        </Gilt>
      </div>
      <FlyIn t={t} at={1.0} from={[-700, 0]}>
        <Extrude text={TEXT.words.a} size={190} ry={18} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: 160, top: 420 }} />
      </FlyIn>
      <FlyIn t={t} at={1.15} from={[700, 0]}>
        <Extrude text={TEXT.words.b} size={220} ry={-18} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: 1330, top: 400 }} />
      </FlyIn>
      <Tag id="FRAME PHOTO" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- I · wall of frames, roll + pull-back, sepia (R03 49–51.6 s)

const FRAME_WALL: { x: number; y: number; w: number; h: number; r: number; src: string }[] = (() => {
  const out: { x: number; y: number; w: number; h: number; r: number; src: string }[] = [];
  let k = 0;
  for (let r = -3; r <= 3; r++)
    for (let c = -4; c <= 4; c++) {
      if (r === 0 && c === 0) continue;
      const portrait = random(`fp${r}${c}`) > 0.5;
      out.push({ x: c * 470 + (random(`fx${r}${c}`) - 0.5) * 120, y: r * 400 + (random(`fy${r}${c}`) - 0.5) * 90, w: portrait ? 230 : 320, h: portrait ? 300 : 230, r: (random(`fr${r}${c}`) - 0.5) * 14, src: GALLERY[k++ % GALLERY.length] });
    }
  return out;
})();

const FrameWall: React.FC = () => {
  const t = useT();
  const dur = S.push - S.frames;
  const camZ = interpolate(t, [0, dur], [-200, -2600], { ...clamp, easing: ease.drift });
  const roll = interpolate(t, [0, dur], [0, -32], { ...clamp, easing: ease.drift });
  const sepia = interpolate(t, [1.6, 2.3], [0, 0.8], clamp);
  const items: Item[] = FRAME_WALL.map((f, i) => ({
    key: `f${i}`,
    x: f.x,
    y: f.y,
    z: 0,
    rz: f.r,
    w: f.w + 40,
    h: f.h + 40,
    fog: false,
    node: (
      <Gilt w={f.w + 40} h={f.h + 40} thick={20}>
        <Pic src={f.src} />
      </Gilt>
    ),
  }));
  items.push({
    key: "center",
    x: 0,
    y: 0,
    z: -10,
    w: 560,
    h: 400,
    fog: false,
    node: (
      <Gilt w={560} h={400} thick={34}>
        <Pic src={FRAME_PHOTO} pos="50% 40%" />
      </Gilt>
    ),
  });
  // gold 3D words float in front of the wall, in the same space
  const words: Item[] = [
    { key: "wa", x: -360, y: -40, z: -420, w: 10, h: 10, fog: false, node: <Extrude text={TEXT.words.a} size={150} ry={12} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: -200, top: -80 }} /> },
    { key: "wb", x: 380, y: 60, z: -520, w: 10, h: 10, fog: false, node: <Extrude text={TEXT.words.b} size={190} ry={-12} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: -120, top: -100 }} /> },
  ];
  const yea = progress(t, 1.25, 0.4);
  return (
    <AbsoluteFill style={{ background: "#efede8" }}>
      <AbsoluteFill style={{ filter: `sepia(${sepia}) saturate(${1 - sepia * 0.3}) contrast(${1 + sepia * 0.08})` }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #fbfaf6 0%, #e6e2d8 60%, #8d877a 100%)" }} />
        <Space cam={{ x: 0, y: 0, z: camZ, roll }} items={[...items, ...words]} fogFrom={9000} fogTo={12000} />
      </AbsoluteFill>
      {yea > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", opacity: yea * (1 - progress(t, dur - 0.3, 0.25)) }}>
          <div style={{ position: "relative", filter: yea < 1 ? `blur(${(1 - yea) * 10}px)` : undefined }}>
            <Extrude text={TEXT.words.e} size={170} rx={-12} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ position: "relative" }} />
          </div>
        </div>
      ) : null}
      <Vignette k={0.55} color="40,25,5" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- J · starfield (R03 52–55.6 s)

const Starfield: React.FC<{ t: number; w: number; h: number; speed: (t: number) => number }> = ({ t, w, h, speed }) => {
  const N = 420;
  const lines: React.ReactNode[] = [];
  const s0 = speed(t);
  const s1 = speed(Math.max(0, t - 1 / FPS));
  for (let i = 0; i < N; i++) {
    const x = (random(`sx${i}`) - 0.5) * 2;
    const y = (random(`sy${i}`) - 0.5) * 2;
    const z0 = random(`sz${i}`);
    const za = 0.02 + ((((z0 - s0) % 1) + 1) % 1) * 0.98;
    const zb = 0.02 + ((((z0 - s1) % 1) + 1) % 1) * 0.98;
    if (zb < za) continue; // wrapped this frame
    const f = w * 0.35;
    const xa = w / 2 + (x / za) * f;
    const ya = h / 2 + (y / za) * f;
    const xb = w / 2 + (x / zb) * f;
    const yb = h / 2 + (y / zb) * f;
    if (xa < -50 || xa > w + 50 || ya < -50 || ya > h + 50) continue;
    const r = Math.min(4, 0.8 / za);
    lines.push(<line key={i} x1={xb} y1={yb} x2={xa} y2={ya} stroke="#fff" strokeOpacity={Math.min(1, 0.45 + 0.5 / za)} strokeWidth={r} strokeLinecap="round" />);
  }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, background: "radial-gradient(ellipse at 50% 50%, #0d0b18 0%, #000 80%)" }}>
      {lines}
    </svg>
  );
};

// Starfield world with slanted cut-out cards (used full-screen and inside the frame).
const StarWorld: React.FC<{ t: number; w: number; h: number }> = ({ t, w, h }) => {
  const speed = (x: number) => 0.18 * x + 0.7 * (1 - Math.exp(-x * 2.2));
  const k = w / W;
  const card = (i: number) => {
    const p = progress(t, 0.25 + i * 0.35, 0.7);
    const left = i === 0;
    const x = left ? lerp(-500, 120, p) : lerp(W + 200, W - 560, p);
    const drift = (left ? -1 : 1) * t * 18;
    return (
      <div key={i} style={{ position: "absolute", left: (x + drift) * k, top: (left ? 300 : 170) * k, width: 440 * k, height: 600 * k, transform: `perspective(${1200 * k}px) rotateY(${left ? 22 : -22}deg)`, opacity: p }}>
        <div style={{ position: "absolute", inset: -8 * k, background: "#fff", clipPath: "polygon(0 6%, 100% 0, 100% 94%, 0 100%)" }} />
        <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 6%, 100% 0, 100% 94%, 0 100%)", overflow: "hidden" }}>
          <Pic src={STAR_CARDS[i]} pos="50% 25%" />
        </div>
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Starfield t={t} w={w} h={h} speed={speed} />
      {card(0)}
      {card(1)}
      <div style={{ position: "absolute", left: w / 2 - 70 * k, top: h / 2 - 70 * k, width: 140 * k, height: 140 * k, borderRadius: "50%", background: `radial-gradient(circle, #fff6d0 0%, ${GOLD} 30%, ${GOLD}00 70%)`, filter: `blur(${2 * k}px)`, transform: `scale(${1 + 0.15 * Math.sin(t * 5)})` }} />
    </div>
  );
};

const PushThrough: React.FC = () => {
  const t = useT();
  const dur = S.stars - S.push;
  const p = progress(t, 0, dur, ease.swift);
  const s = lerp(1, 4.2, p);
  return (
    <AbsoluteFill style={{ background: "#e9e5dc", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: W / 2 - 280, top: H / 2 - 200, transform: `scale(${s})`, transformOrigin: "50% 50%" }}>
        <Gilt w={560} h={400} thick={34}>
          <div style={{ position: "absolute", inset: 0, opacity: p }}>
            <StarWorld t={0} w={492} h={332} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: 1 - p }}>
            <Pic src={FRAME_PHOTO} pos="50% 40%" />
          </div>
        </Gilt>
      </div>
      <AbsoluteFill style={{ filter: "url(#mk-by20)", opacity: p * 0.4 }} />
    </AbsoluteFill>
  );
};

const Stars: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <StarWorld t={t} w={W} h={H} />
      <Tag id="STAR CARDS" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- K · recursion: world inside frame inside giant ME (R03 55.6–57.4 s)

const Recursion: React.FC = () => {
  const t = useT();
  const pull = progress(t, 0, 0.75, ease.settle);
  const s = lerp(3.4, 1, pull);
  const me = progress(t, 0.25, 0.6);
  const dim = interpolate(t, [1.2, 1.8], [0, 0.55], clamp);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #ffffff 0%, #ece6da 55%, #7a7468 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center", opacity: me, transform: `scale(${1.4 - 0.4 * me})` }}>
        <div style={{ position: "relative" }}>
          <Extrude text={TEXT.words.b} size={760} face="#fff4d6" side={["#d9b46a", "#5a3a0c"]} glow="#ffe9a8" depth={0.09} layers={18} style={{ position: "relative" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: W / 2 - 400, top: H / 2 - 240, transform: `scale(${s})` }}>
        <Gilt w={800} h={480} thick={40}>
          <StarWorld t={3.6 + t} w={720} h={400} />
        </Gilt>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: dim }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- L · end card

const EndCard: React.FC = () => {
  const t = useT();
  const letters = TEXT.handle.split("");
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #1a1712 0%, #000 75%)", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex" }}>
        {letters.map((c, i) => {
          const p = progress(t, 0.15 + i * 0.045, 0.2);
          return (
            <span key={i} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 96, color: CREAM, opacity: p, textShadow: `0 0 24px ${GOLD}88`, transform: `translateY(${(1 - p) * 20}px)`, display: "inline-block" }}>
              {c}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 18, fontFamily: UI, fontWeight: 800, fontSize: 24, letterSpacing: "0.6em", color: "rgba(251,238,221,0.75)", opacity: progress(t, 1.1, 0.5) }}>{TEXT.end}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- master

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width={W} height={H}>
        <filter id="ge-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 8} />
        </filter>
        <rect width={W} height={H} filter="url(#ge-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const GalleryEdit: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const sec = (a: number, b: number) => ({ from: Math.round(a * fps), durationInFrames: Math.round(b * fps) - Math.round(a * fps) });
  // hit punch: small zoom + shake for 5 frames after each section start
  const last = HITS.reduce((a, c) => (c <= t ? c : a), -9);
  const since = (t - last) * fps;
  const decay = since >= 0 && since < 8 ? Math.exp(-since / 3) : 0;
  const shake = (random(`gs${f}`) - 0.5) * 10 * decay;
  const flash = since >= 0 && since < 3 && last !== S.c2 && last !== S.c3 ? [0.55, 0.25, 0.08][Math.floor(since)] : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KitDefs />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px) scale(${1 + 0.03 * decay})` }}>
        <Sequence {...sec(S.fly, S.h1)}><Corridor /></Sequence>
        {HEROES.map((h, i) => {
          const a = [S.h1, S.h2, S.h3, S.h4][i];
          const b = [S.h2, S.h3, S.h4, S.oh][i];
          return (
            <Sequence key={i} {...sec(a, b)}>
              <HeroCard hero={h} n={i} dur={b - a} />
            </Sequence>
          );
        })}
        <Sequence {...sec(S.oh, S.wall)}><OhBaby /></Sequence>
        <Sequence {...sec(S.wall, S.c1)}><TileWall /></Sequence>
        <Sequence {...sec(S.c1, S.c2)}><ClipShot n={0} dur={S.c2 - S.c1} kind="flash" /></Sequence>
        <Sequence {...sec(S.c2, S.c3)}><ClipShot n={1} dur={S.c3 - S.c2} kind="whip" /></Sequence>
        <Sequence {...sec(S.c3, S.yea)}><ClipShot n={2} dur={S.yea - S.c3} kind="iris" /></Sequence>
        <Sequence {...sec(S.yea, S.strip)}><Yea /></Sequence>
        <Sequence {...sec(S.strip, S.gilt)}><Strip /></Sequence>
        <Sequence {...sec(S.gilt, S.frames)}><GiltWall /></Sequence>
        <Sequence {...sec(S.frames, S.push)}><FrameWall /></Sequence>
        <Sequence {...sec(S.push, S.stars)}><PushThrough /></Sequence>
        <Sequence {...sec(S.stars, S.recur)}><Stars /></Sequence>
        <Sequence {...sec(S.recur, S.end)}><Recursion /></Sequence>
        <Sequence {...sec(S.end, END)}><EndCard /></Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Grain />
      <Audio src={staticFile(MUSIC.file)} />
    </AbsoluteFill>
  );
};
