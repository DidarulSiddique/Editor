import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig, Freeze } from "remotion";
import "@fontsource/playfair-display/900.css";
import "@fontsource/playfair-display/900-italic.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import { CLIPS, FRAME_PHOTO, GALLERY, HEROES, Hero, OH_PHOTO, PREVIEW, STAR_CARDS, STRIP, TEXT, YEA_HERO } from "./config";
import { KitDefs, clamp, ease, progress } from "../../kit";

// GALLERY EDIT (VERTICAL) — 1080x1920 for TikTok/Shorts, 30 fps. Portrait re-layout of GalleryEdit.tsx;, built shot-for-shot on the
// structure of R03 (framez_00 "Love Me"): 3D card corridor fly-in, 2.5D
// hero cards with extruded serif words behind/in front of the player, tile
// wall pull-back to B&W, flash/whip/iris clip run, giant word behind the
// player, break-apart strip, gilt frame on a wall, framed-photo wall with a
// camera roll, push through a frame into a starfield, and the recursive
// pull-back into a giant glowing "ME".
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const END = 51.0;
export const FRAMES = Math.round(END * FPS);

const SERIF = "'Playfair Display', serif";
const UI = "Inter, sans-serif";
const GOLD = "#f0c040";
const CREAM = "#fbeedd";
const NEON = ["#c6ff3d", "#ff3dd2", "#ff8a2b", "#2fe6ff", "#9b6bff", "#ffe14a"];

// Section starts (bar grid of the song: 3.33 s per bar from 1.93 s).
// Cards 1 and 3 are 2 and 3 bars long so Messi's full lines fit (see MUSIC_V / build-audio notes).
const S = { fly: 0, h1: 1.93, h2: 8.6, h3: 11.93, h4: 21.93, oh: 24.1, wall: 25.3, c1: 28.7, c2: 30.5, c3: 32.2, yea: 34.0, strip: 36.4, gilt: 38.5, frames: 39.95, push: 42.55, stars: 42.95, recur: 46.55, end: 48.35 };
const HITS = [1.93, 8.6, 11.93, 21.93, 24.1, 25.3, 28.7, 30.5, 32.2, 34.0, 36.4, 38.5, 39.95, 42.95, 46.55];

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


// ---------------------------------------------------------------- vertical layout data

// Per-hero placement for the 9:16 frame: displayed width, centre x, head y.
const HERO_V = [
  { w: 1300, x: 540, head: 520 },
  { w: 1150, x: 560, head: 470 },
  { w: 1250, x: 560, head: 500 },
  { w: 1120, x: 540, head: 440 },
];
type WordPos = { x: number; y: number; ry: number; size: number };
const WORDS_V: { a: WordPos; b: WordPos }[] = [
  { a: { x: 130, y: 110, ry: 18, size: 280 }, b: { x: 430, y: 1060, ry: -24, size: 300 } },
  { a: { x: 150, y: 120, ry: -18, size: 270 }, b: { x: 50, y: 1060, ry: 24, size: 300 } },
  { a: { x: 130, y: 110, ry: 18, size: 280 }, b: { x: 440, y: 1060, ry: -24, size: 300 } },
  { a: { x: 150, y: 110, ry: -18, size: 270 }, b: { x: 50, y: 1060, ry: 24, size: 300 } },
];
// What Messi says on cards 1 and 3 (Whisper-small multilingual on the voice
// stem; card-local seconds, matching the soundtrack built in love-me-v.wav).
type Sub = { t0: number; t1: number; es: string; en: string };
const SUBS: Record<number, Sub[]> = {
  0: [
    { t0: 2.5, t1: 3.95, es: "Querían las tres…", en: "YOU WANTED ALL THREE…" },
    { t0: 3.95, t1: 5.9, es: "…acá están las tres.", en: "…HERE ARE ALL THREE." },
  ],
  2: [
    { t0: 5.05, t1: 6.2, es: "¿Qué mirás, bobo?", en: "WHAT ARE YOU LOOKING AT, FOOL?" },
    { t0: 6.2, t1: 9.0, es: "Andá pa' allá.", en: "GO ON, GET OUT OF HERE." },
  ],
};
// Clip crop for 9:16: subject x in the 16:9 frame, playback rate.
const CLIP_V = [
  { focus: 0.45, rate: 0.6 },
  { focus: 0.6, rate: 0.9 },
  { focus: 0.3, rate: 0.8 },
];

// ---------------------------------------------------------------- A · corridor fly-in

const Corridor: React.FC = () => {
  const t = useT();
  const items: Item[] = [];
  for (let i = 0; i < 20; i++) {
    const side = i % 2 ? 1 : -1;
    const row = Math.floor(i / 2) % 2 ? 1 : -1;
    const k = Math.floor(i / 4);
    const col = NEON[i % NEON.length];
    items.push({
      key: `c${i}`,
      x: side * (440 + random(`cx${i}`) * 60),
      y: row * (360 + random(`cy${i}`) * 80),
      z: 600 + k * 1300 + (side > 0 ? 320 : 0) + (row > 0 ? 640 : 0),
      ry: side * -62,
      w: 560,
      h: 360,
      node: (
        <div style={{ width: "100%", height: "100%", border: `3px solid ${col}`, boxShadow: `0 0 40px ${col}, 0 0 90px ${col}66`, background: "#000" }}>
          <Pic src={GALLERY[i % GALLERY.length]} filter="saturate(1.3) contrast(1.1)" />
          <div style={{ position: "absolute", inset: 0, background: col, mixBlendMode: "color", opacity: 0.3 }} />
        </div>
      ),
    });
  }
  items.push({
    key: "dest",
    x: 0,
    y: 0,
    z: 7900,
    w: 1000,
    h: 1500,
    fog: false,
    node: (
      <div style={{ width: "100%", height: "100%", border: `4px solid ${GOLD}`, boxShadow: `0 0 80px ${GOLD}, 0 0 200px ${GOLD}88` }}>
        <Pic src={HEROES[0].photo} pos="50% 30%" filter="saturate(1.2) contrast(1.1)" />
      </div>
    ),
  });
  const camZ = interpolate(t, [0, 1.75], [-600, 6700], { ...clamp, easing: ease.drift });
  const white = interpolate(t, [1.55, 1.93], [0, 1], clamp);
  const fadeIn = interpolate(t, [0, 0.35], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fadeIn, filter: `brightness(${1 + white * 2.5})` }}>
        <Space cam={{ x: Math.sin(t * 2.2) * 30, y: Math.sin(t * 1.7) * 40, z: camZ, yaw: Math.sin(t * 1.4) * 3, roll: Math.sin(t * 1.1) * 3 }} items={items} fogFrom={3400} fogTo={7800} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: white * 0.9 }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- B · hero cards

const Subtitle: React.FC<{ t: number; subs?: Sub[] }> = ({ t, subs }) => {
  const s = subs?.find((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.1);
  if (!s) return null;
  const p = progress(t, s.t0 - 0.05, 0.2);
  const q = 1 - progress(t, s.t1, 0.12);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1470, display: "flex", justifyContent: "center", opacity: p * q }}>
      <div style={{ padding: "18px 34px 16px", borderRadius: 22, background: "rgba(10,6,14,0.62)", border: "1.5px solid rgba(255,255,255,0.28)", backdropFilter: "blur(12px)", textAlign: "center", transform: `translateY(${(1 - p) * 18}px)` }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontStyle: "italic", fontSize: 64, lineHeight: 1.1, color: CREAM, textShadow: `0 0 20px ${GOLD}88` }}>{s.es}</div>
        <div style={{ marginTop: 8, fontFamily: UI, fontWeight: 800, fontSize: 26, letterSpacing: "0.12em", color: GOLD }}>{s.en}</div>
      </div>
    </div>
  );
};

const HeroCard: React.FC<{ hero: Hero; n: number; dur: number }> = ({ hero, n, dur }) => {
  const t = useT();
  const L = WORDS_V[n % WORDS_V.length];
  const V = HERO_V[n % HERO_V.length];
  const whip = interpolate(t, [0, 0.22], [1, 0], { ...clamp, easing: ease.settle });
  const push = interpolate(t, [0, dur], [0, 1], clamp);
  // long cards get a second beat: a punch-in toward the face halfway through
  const mid = dur > 5 ? dur * 0.5 : 99;
  const punch = progress(t, mid, 0.35, ease.settle);
  const pf = t >= mid && t < mid + 0.12 ? 1 - (t - mid) / 0.12 : 0;
  const wD = V.w;
  const hD = wD / hero.ar;
  const top = V.head - hero.ytop * hD;
  const zoom = 1 + 0.06 * push + punch * 0.16 + whip * 0.5;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.15 + 0.08 * push + punch * 0.1 + whip * 0.35})`, filter: `blur(${10 + whip * 10}px) saturate(1.35) brightness(0.8)` }}>
        <Pic src={hero.photo} pos="50% 35%" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(255,60,170,0.18), rgba(60,40,140,0.25) 60%, rgba(255,140,60,0.15))", mixBlendMode: "screen" }} />
      <Bokeh t={t} seed={`h${n}`} />
      <AbsoluteFill style={{ transform: `scale(${1 + punch * 0.08})`, transformOrigin: "50% 20%" }}>
        <FlyIn t={t} at={0.12} from={[L.a.ry > 0 ? -220 : 220, 0]}>
          <Extrude text={TEXT.words.a} size={L.a.size} ry={L.a.ry} rx={-6} face="#fff1f6" side={["#d79ab8", "#3a1830"]} glow="#ffb3da" style={{ left: L.a.x, top: L.a.y }} />
        </FlyIn>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: V.x - wD * hero.cx, top, width: wD, height: hD, transform: `scale(${zoom})`, transformOrigin: `50% ${((V.head - top) / hD) * 100}%`, filter: whip > 0.2 ? `blur(${whip * 8}px)` : undefined }}>
        <Img src={staticFile(hero.cut)} style={{ width: "100%", height: "100%", filter: "contrast(1.08) saturate(1.15) drop-shadow(0 0 30px rgba(255,200,230,0.35)) drop-shadow(0 30px 40px rgba(0,0,0,0.5))" }} />
      </div>
      <FlyIn t={t} at={0.45} from={[L.b.ry > 0 ? -260 : 260, 40]}>
        <Extrude text={TEXT.words.b} size={L.b.size} ry={L.b.ry} rx={-4} face="#fff1f6" side={["#d79ab8", "#3a1830"]} glow="#ffb3da" style={{ left: L.b.x, top: L.b.y }} />
      </FlyIn>
      <AbsoluteFill style={{ background: `linear-gradient(115deg, transparent ${push * 160 - 40}%, rgba(255,255,255,0.18) ${push * 160 - 30}%, transparent ${push * 160 - 20}%)`, mixBlendMode: "screen" }} />
      <Subtitle t={t} subs={SUBS[n]} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "center", opacity: progress(t, 0.5, 0.3) }}>
        <div style={{ padding: "12px 26px", borderRadius: 14, background: "rgba(10,6,14,0.55)", border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", gap: 12 }}>
          {hero.caption.split(" ").map((w, i) => {
            const p = progress(t, 0.6 + i * 0.09, 0.2);
            return (
              <span key={i} style={{ fontFamily: UI, fontWeight: 900, fontSize: 32, letterSpacing: "0.06em", color: w === "·" ? GOLD : "#fff", opacity: p, transform: `translateY(${(1 - p) * 14}px)`, display: "inline-block" }}>
                {w}
              </span>
            );
          })}
        </div>
      </div>
      <Vignette k={0.55} />
      <AbsoluteFill style={{ background: "#fff", opacity: pf * 0.6 }} />
      <Tag id={hero.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- C · OH [frame] BABY

const OhBaby: React.FC = () => {
  const t = useT();
  const spin = Math.sin(t * 3) * 18;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #ffe9a8 0%, #f0b93a 45%, #8a5a10 100%)" }}>
      <Bokeh t={t} seed="oh" color="#fff6c8" n={16} />
      <FlyIn t={t} at={0.0} from={[0, -300]} out={0.85}>
        <Extrude text={TEXT.words.c} size={300} rx={14} face="#fffaf0" side={["#c58a1c", "#5a3606"]} glow="#fff2b0" style={{ left: 330, top: 230 }} />
      </FlyIn>
      <div style={{ position: "absolute", left: W / 2 - 240, top: H / 2 - 330, perspective: 1200 }}>
        <div style={{ transform: `rotateY(${spin}deg) scale(${0.9 + progress(t, 0, 0.3) * 0.1})` }}>
          <Gilt w={480} h={660} thick={30}>
            <Pic src={OH_PHOTO} />
          </Gilt>
        </div>
      </div>
      <FlyIn t={t} at={0.18} from={[0, 300]} out={0.7}>
        <Extrude text={TEXT.words.d} size={260} rx={-14} face="#fffaf0" side={["#c58a1c", "#5a3606"]} glow="#fff2b0" style={{ left: 170, top: 1360 }} />
      </FlyIn>
      <Vignette k={0.35} color="60,30,0" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- D · tile wall pull-back to B&W

const TileWall: React.FC = () => {
  const t = useT();
  const items: Item[] = [];
  let k = 0;
  for (let r = -5; r <= 5; r++)
    for (let c = -2; c <= 2; c++) {
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
  const camZ = interpolate(t, [0, 3.4], [-700, -2400], { ...clamp, easing: ease.drift });
  const roll = interpolate(t, [0, 3.4], [0, -8], { ...clamp, easing: ease.drift });
  const bw = interpolate(t, [1.85, 2.15], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#0a0a0d" }}>
      <AbsoluteFill style={{ filter: `grayscale(${bw}) contrast(${1 + bw * 0.15})` }}>
        <Space cam={{ x: interpolate(t, [0, 3.4], [0, 120], clamp), y: interpolate(t, [0, 3.4], [0, -160], clamp), z: camZ, roll }} items={items} fogFrom={9000} fogTo={12000} />
      </AbsoluteFill>
      <Vignette k={0.7} />
      {[
        { w: TEXT.words.a, at: 1.3, y: 560, dir: 1 },
        { w: TEXT.words.b, at: 2.3, y: 1060, dir: -1 },
      ].map(({ w, at, y, dir }) => {
        const p = interpolate(t, [at, at + 1.1], [0, 1], clamp);
        if (p <= 0 || p >= 1) return null;
        const x = lerp(dir > 0 ? -900 : W + 100, dir > 0 ? W + 100 : -900, ease.swift(p));
        const v = Math.abs(ease.swift(Math.min(1, p + 0.02)) - ease.swift(p)) * 4000;
        return (
          <div key={w} style={{ position: "absolute", left: x, top: y, filter: v > 6 ? `blur(${Math.min(18, v / 6)}px)` : undefined }}>
            <Extrude text={w} size={280} ry={dir * -16} face="#ffffff" side={["#9a9a9a", "#202020"]} glow="#ffffff" />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- E · clip run (flash / whip / iris)

const ClipShot: React.FC<{ n: number; dur: number; kind: "flash" | "whip" | "iris" }> = ({ n, dur, kind }) => {
  const t = useT();
  const c = CLIPS[n];
  const v = CLIP_V[n];
  const push = interpolate(t, [0, dur], [1.04, 1.16], clamp);
  const whip = kind === "whip" ? interpolate(t, [0, 0.25], [1, 0], { ...clamp, easing: ease.settle }) : 0;
  const iris = kind === "iris" ? interpolate(t, [0, 0.3], [0, 1], { ...clamp, easing: ease.settle }) : 1;
  const flash = kind === "flash" ? interpolate(t, [0, 0.15], [1, 0], clamp) : 0;
  const grade = ["saturate(0.9) contrast(1.15) brightness(1.04)", "saturate(1.15) contrast(1.12)", "saturate(1.05) contrast(1.15) brightness(0.97)"][n];
  const vw = (H * 16) / 9;
  const left = Math.min(0, Math.max(W - vw, W / 2 - v.focus * vw));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ clipPath: kind === "iris" ? `circle(${iris * 75}% at 50% 50%)` : undefined }}>
        <AbsoluteFill style={{ transform: `translateY(${whip * -700}px) scale(${push + whip * 0.2})`, filter: whip > 0.1 ? "url(#mk-by40)" : undefined }}>
          <Freeze frame={Math.round((c.start + t * v.rate) * FPS)}>
            <OffthreadVideo src={staticFile(c.file)} muted style={{ position: "absolute", left, top: 0, width: vw, height: H, filter: `url(#mk-sharpen) ${grade}` }} />
          </Freeze>
        </AbsoluteFill>
        <Vignette k={0.75} />
        <FlyIn t={t} at={0.15} from={[-200, 0]}>
          <Extrude text={TEXT.words.a} size={250} ry={22} italic face="#ffffff" side={["#a8b8c8", "#1a2430"]} glow="#ffffff" style={{ left: 70, top: 220 }} />
        </FlyIn>
        <FlyIn t={t} at={0.55} from={[200, 0]}>
          <div style={{ opacity: 0.6 }}>
            <Extrude text={TEXT.words.b} size={280} ry={-22} italic face="#ffffff" side={["#a8b8c8", "#1a2430"]} style={{ left: 470, top: 1380 }} />
          </div>
        </FlyIn>
      </AbsoluteFill>
      {kind === "iris" && iris < 1 ? <div style={{ position: "absolute", left: W / 2 - iris * 0.75 * 2000, top: H / 2 - iris * 0.75 * 2000, width: iris * 1.5 * 2000, height: iris * 1.5 * 2000, borderRadius: "50%", border: `5px solid ${GOLD}`, boxShadow: `0 0 40px ${GOLD}` }} /> : null}
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Tag id={c.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- F · giant word behind the player

const Yea: React.FC = () => {
  const t = useT();
  const hero = YEA_HERO;
  const push = interpolate(t, [0, 2.4], [0, 1], clamp);
  const hD = H * 1.12;
  const wD = hD * hero.ar;
  const top = 640 - hero.ytop * hD;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.15 + 0.06 * push})`, filter: "blur(9px) saturate(1.2) brightness(0.7)" }}>
        <Pic src={hero.photo} pos="50% 40%" />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", transform: `scale(${1.25 - 0.18 * progress(t, 0, 0.5)}) translateY(${-push * 20}px)` }}>
        <div style={{ position: "relative" }}>
          <Extrude text={TEXT.words.e} size={430} rx={10} face="#ffffff" side={["#b4b4c0", "#1c1c26"]} glow="#ffffff" depth={0.14} layers={18} style={{ position: "relative" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: W / 2 - wD * hero.cx, top, width: wD, height: hD, transform: `scale(${1 + 0.06 * push})`, transformOrigin: "50% 40%" }}>
        <Img src={staticFile(hero.cut)} style={{ width: "100%", height: "100%", filter: "contrast(1.08) saturate(1.1) drop-shadow(0 30px 40px rgba(0,0,0,0.6))" }} />
      </div>
      <Vignette k={0.6} />
      <Tag id={hero.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- G · 2x2 slanted cards break apart

const Strip: React.FC = () => {
  const t = useT();
  const pull = progress(t, 0, 0.9, ease.settle);
  const split = progress(t, 0.9, 0.9, ease.settle);
  const bw = interpolate(t, [0.9, 1.25], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#f4f4f2" }}>
      <AbsoluteFill style={{ perspective: 1600, transform: `scale(${1.9 - 0.9 * pull}) rotate(-6deg)` }}>
        {STRIP.map((src, i) => {
          const cx = i % 2 ? 1 : -1;
          const cy = i < 2 ? -1 : 1;
          const x = cx * (232 + split * 70);
          const y = cy * (332 + split * 90);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: W / 2 - 220 + x,
                top: H / 2 - 320 + y,
                width: 440,
                height: 640,
                transform: `rotateZ(${split * (cx * cy * 7)}deg) rotateY(${split * cx * 12}deg)`,
                border: "8px solid #fff",
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
        <Extrude text={TEXT.words.c} size={260} ry={20} face="#ffffff" side={["#8c8c8c", "#222222"]} glow="#ffffff" style={{ left: 60, top: 60 }} />
      </FlyIn>
      <FlyIn t={t} at={1.35} from={[240, 0]}>
        <Extrude text={TEXT.words.d} size={240} ry={-20} face="#ffffff" side={["#8c8c8c", "#222222"]} glow="#ffffff" style={{ left: 260, top: 1590 }} />
      </FlyIn>
      <Vignette k={0.25} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- H · gilt frame on a white wall

const GiltWall: React.FC = () => {
  const t = useT();
  const z = interpolate(t, [0, 0.55, 1.45], [0.92, 1.12, 0.82], { ...clamp, easing: ease.drift });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #ffffff 0%, #e9e7e3 50%, #2a2826 100%)" }}>
      <div style={{ position: "absolute", left: W / 2 - 470, top: H / 2 - 325, transform: `scale(${z})` }}>
        <Gilt w={940} h={650} thick={46}>
          <Pic src={FRAME_PHOTO} pos="50% 40%" />
        </Gilt>
      </div>
      <FlyIn t={t} at={1.0} from={[-700, 0]}>
        <Extrude text={TEXT.words.a} size={240} ry={16} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: 140, top: 330 }} />
      </FlyIn>
      <FlyIn t={t} at={1.15} from={[700, 0]}>
        <Extrude text={TEXT.words.b} size={280} ry={-16} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: 330, top: 1330 }} />
      </FlyIn>
      <Tag id="FRAME PHOTO" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- I · wall of frames, roll + pull-back, sepia

const FRAME_WALL: { x: number; y: number; w: number; h: number; r: number; src: string }[] = (() => {
  const out: { x: number; y: number; w: number; h: number; r: number; src: string }[] = [];
  let k = 0;
  for (let r = -6; r <= 6; r++)
    for (let c = -3; c <= 3; c++) {
      if (r === 0 && c === 0) continue;
      const portrait = random(`fp${r}${c}`) > 0.5;
      out.push({ x: c * 440 + (random(`fx${r}${c}`) - 0.5) * 110, y: r * 380 + (random(`fy${r}${c}`) - 0.5) * 80, w: portrait ? 230 : 320, h: portrait ? 300 : 230, r: (random(`fr${r}${c}`) - 0.5) * 14, src: GALLERY[k++ % GALLERY.length] });
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
  items.push({ key: "center", x: 0, y: 0, z: -10, w: 560, h: 400, fog: false, node: <Gilt w={560} h={400} thick={34}><Pic src={FRAME_PHOTO} pos="50% 40%" /></Gilt> });
  const words: Item[] = [
    { key: "wa", x: -60, y: -360, z: -420, w: 10, h: 10, fog: false, node: <Extrude text={TEXT.words.a} size={170} ry={12} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: -260, top: -90 }} /> },
    { key: "wb", x: 60, y: 330, z: -520, w: 10, h: 10, fog: false, node: <Extrude text={TEXT.words.b} size={210} ry={-12} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ left: -150, top: -110 }} /> },
  ];
  const yea = progress(t, 1.25, 0.4);
  return (
    <AbsoluteFill style={{ background: "#efede8" }}>
      <AbsoluteFill style={{ filter: `sepia(${sepia}) saturate(${1 - sepia * 0.3}) contrast(${1 + sepia * 0.08})` }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #fbfaf6 0%, #e6e2d8 60%, #8d877a 100%)" }} />
        <Space cam={{ x: 0, y: 0, z: camZ, roll }} items={[...items, ...words]} fogFrom={9000} fogTo={12000} />
      </AbsoluteFill>
      {yea > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center", opacity: yea * (1 - progress(t, dur - 0.3, 0.25)) }}>
          <div style={{ position: "relative", filter: yea < 1 ? `blur(${(1 - yea) * 10}px)` : undefined }}>
            <Extrude text={TEXT.words.e} size={220} rx={-12} face="#fff2c0" side={["#c9922a", "#4a2c06"]} glow={GOLD} style={{ position: "relative" }} />
          </div>
        </div>
      ) : null}
      <Vignette k={0.55} color="40,25,5" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- J · starfield

const Starfield: React.FC<{ t: number; w: number; h: number; speed: (t: number) => number }> = ({ t, w, h, speed }) => {
  const lines: React.ReactNode[] = [];
  const s0 = speed(t);
  const s1 = speed(Math.max(0, t - 1 / FPS));
  const f = Math.max(w, h) * 0.3;
  for (let i = 0; i < 480; i++) {
    const x = (random(`sx${i}`) - 0.5) * 2;
    const y = (random(`sy${i}`) - 0.5) * 2;
    const z0 = random(`sz${i}`);
    const za = 0.02 + ((((z0 - s0) % 1) + 1) % 1) * 0.98;
    const zb = 0.02 + ((((z0 - s1) % 1) + 1) % 1) * 0.98;
    if (zb < za) continue;
    const xa = w / 2 + (x / za) * f;
    const ya = h / 2 + (y / za) * f;
    const xb = w / 2 + (x / zb) * f;
    const yb = h / 2 + (y / zb) * f;
    if (xa < -50 || xa > w + 50 || ya < -50 || ya > h + 50) continue;
    lines.push(<line key={i} x1={xb} y1={yb} x2={xa} y2={ya} stroke="#fff" strokeOpacity={Math.min(1, 0.45 + 0.5 / za)} strokeWidth={Math.min(4, 0.8 / za)} strokeLinecap="round" />);
  }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, background: "radial-gradient(ellipse at 50% 50%, #0d0b18 0%, #000 80%)" }}>
      {lines}
    </svg>
  );
};

const StarWorld: React.FC<{ t: number; w: number; h: number }> = ({ t, w, h }) => {
  const speed = (x: number) => 0.18 * x + 0.7 * (1 - Math.exp(-x * 2.2));
  const cw = Math.min(w, h) * 0.46;
  const ch = cw * 1.36;
  const card = (i: number) => {
    const p = progress(t, 0.25 + i * 0.35, 0.7);
    const first = i === 0;
    const x = first ? lerp(-cw - 40, w * 0.06, p) : lerp(w + 40, w - cw - w * 0.06, p);
    const y = first ? h * 0.12 : h - ch - h * 0.1;
    const drift = (first ? -1 : 1) * t * 10 * (w / W);
    return (
      <div key={i} style={{ position: "absolute", left: x + drift, top: y, width: cw, height: ch, transform: `perspective(${1200}px) rotateY(${first ? 20 : -20}deg)`, opacity: p }}>
        <div style={{ position: "absolute", inset: -cw * 0.02, background: "#fff", clipPath: "polygon(0 6%, 100% 0, 100% 94%, 0 100%)" }} />
        <div style={{ position: "absolute", inset: 0, clipPath: "polygon(0 6%, 100% 0, 100% 94%, 0 100%)", overflow: "hidden" }}>
          <Pic src={STAR_CARDS[i]} pos="50% 25%" />
        </div>
      </div>
    );
  };
  const g = Math.min(w, h) * 0.13;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Starfield t={t} w={w} h={h} speed={speed} />
      {card(0)}
      {card(1)}
      <div style={{ position: "absolute", left: w / 2 - g, top: h / 2 - g, width: g * 2, height: g * 2, borderRadius: "50%", background: `radial-gradient(circle, #fff6d0 0%, ${GOLD} 30%, ${GOLD}00 70%)`, transform: `scale(${1 + 0.15 * Math.sin(t * 5)})` }} />
    </div>
  );
};

const PushThrough: React.FC = () => {
  const t = useT();
  const dur = S.stars - S.push;
  const p = progress(t, 0, dur, ease.swift);
  return (
    <AbsoluteFill style={{ background: "#e9e5dc", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: W / 2 - 280, top: H / 2 - 200, transform: `scale(${lerp(1, 6, p)})` }}>
        <Gilt w={560} h={400} thick={34}>
          <div style={{ position: "absolute", inset: 0, opacity: p }}>
            <StarWorld t={0} w={492} h={332} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: 1 - p }}>
            <Pic src={FRAME_PHOTO} pos="50% 40%" />
          </div>
        </Gilt>
      </div>
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

// ---------------------------------------------------------------- K · recursion into the giant ME

const Recursion: React.FC = () => {
  const t = useT();
  const pull = progress(t, 0, 0.75, ease.settle);
  const me = progress(t, 0.25, 0.6);
  const dim = interpolate(t, [1.2, 1.8], [0, 0.55], clamp);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #ffffff 0%, #ece6da 55%, #7a7468 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", opacity: me, transform: `scale(${1.4 - 0.4 * me})` }}>
        <div style={{ position: "relative" }}>
          <Extrude text={TEXT.words.b} size={620} face="#fff4d6" side={["#d9b46a", "#5a3a0c"]} glow="#ffe9a8" depth={0.1} layers={18} style={{ position: "relative" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: W / 2 - 430, top: H / 2 - 290, transform: `scale(${lerp(3.4, 0.62, pull)})` }}>
        <Gilt w={860} h={580} thick={40}>
          <StarWorld t={3.6 + t} w={780} h={500} />
        </Gilt>
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: dim }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- L · end card

const EndCard: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #1a1712 0%, #000 75%)", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex" }}>
        {TEXT.handle.split("").map((c, i) => {
          const p = progress(t, 0.15 + i * 0.045, 0.2);
          return (
            <span key={i} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 72, color: CREAM, opacity: p, textShadow: `0 0 24px ${GOLD}88`, transform: `translateY(${(1 - p) * 20}px)`, display: "inline-block" }}>
              {c}
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 18, fontFamily: UI, fontWeight: 800, fontSize: 24, letterSpacing: "0.5em", color: "rgba(251,238,221,0.75)", opacity: progress(t, 1.1, 0.5) }}>{TEXT.end}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- master

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width={W} height={H}>
        <filter id="gv-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 8} />
        </filter>
        <rect width={W} height={H} filter="url(#gv-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const GalleryVertical: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const sec = (a: number, b: number) => ({ from: Math.round(a * fps), durationInFrames: Math.round(b * fps) - Math.round(a * fps) });
  const last = HITS.reduce((a, c) => (c <= t ? c : a), -9);
  const since = (t - last) * fps;
  const decay = since >= 0 && since < 8 ? Math.exp(-since / 3) : 0;
  const shake = (random(`gs${f}`) - 0.5) * 10 * decay;
  const flash = since >= 0 && since < 3 && last !== S.c2 && last !== S.c3 ? [0.55, 0.25, 0.08][Math.floor(since)] : 0;
  const heroStarts = [S.h1, S.h2, S.h3, S.h4, S.oh];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <KitDefs />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px) scale(${1 + 0.03 * decay})` }}>
        <Sequence {...sec(S.fly, S.h1)}><Corridor /></Sequence>
        {HEROES.map((h, i) => (
          <Sequence key={i} {...sec(heroStarts[i], heroStarts[i + 1])}>
            <HeroCard hero={h} n={i} dur={heroStarts[i + 1] - heroStarts[i]} />
          </Sequence>
        ))}
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
      <Audio src={staticFile("love-me-v.wav")} />
    </AbsoluteFill>
  );
};
