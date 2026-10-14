import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/cinzel/700.css";
import { CLIPS, COLORS, MUSIC, PHOTOS, PREVIEW, TEXT, ClipSlot } from "./config";
import { Atmos, Aura, Callout, DrawPath, Grain, HitCamera, KitDefs, Ring, Vignette, clamp, ease, fadeOut, progress, wordTimes } from "../../kit";

// PLAYER EDIT — vertical 1080x1920 template. Each section is built from a
// benchmark technique (ref IDs in comments, see references/analysis/).
//   HOOK     R13 assembling serif title + PiP card + hairline, R03 glow
//   NAME     R15/R01 giant word behind cut-out, R04 boiling numeral + gold serif slam
//   QUOTE    R07 quiet-quote before the drop, R03 keyword-glow captions
//   PREDROP  R04 desaturate → red bar wipe → white flash on the drop
//   MONTAGE  R04 zoom-pop cuts on beats; per-clip treatments from R06, R05, R12/R13, R14, R07 + freeze annotation
//   STAT     R13 ticking counter anchored by hairlines
//   WALL     R16 photo wall that fills one frame per beat, pull-back
//   END      R04/R12 hold, tracked-out signature
export const W = 1080;
export const H = 1920;
export const FPS = 60;

const D = MUSIC.drop;
const B = MUSIC.beat;
export const T = {
  hook: 0,
  name: 2.6,
  quote: 6.0,
  predrop: D - 2 * B,
  montage: D,
  stat: D + 24 * B,
  wall: D + 32 * B,
  end: D + 42 * B,
  total: D + 42 * B + 2.4,
};
const MCUT = [0, 1, 2, 3, 4, 5].map((i) => D + i * 4 * B);
export const FRAMES = Math.round(T.total * FPS);

const DISPLAY = "Anton, sans-serif";
const UI = "Inter, sans-serif";
const SERIF = "'Instrument Serif', serif";
const CLASSIC = "Cinzel, serif";
const glowText = (c: string, k = 1) => `0 0 ${12 * k}px ${c}, 0 0 ${34 * k}px ${c}99, 0 0 ${80 * k}px ${c}55`;

const useLocal = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

// ---------------------------------------------------------------- media

// 16:9 clip cropped to fill the vertical frame around slot.focus.
// Children are drawn in SOURCE pixels (1920x1080) and stay pinned.
const Vertical: React.FC<{ slot: ClipSlot; keys?: [number, number][]; zoom?: number; filter?: string; children?: React.ReactNode }> = ({ slot, keys, zoom = 1, filter, children }) => {
  const t = useLocal();
  const st = keys ? interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), clamp) : slot.start + t * (slot.rate ?? 1);
  const k = (H / 1080) * zoom;
  const vw = 1920 * k;
  const vh = 1080 * k;
  const left = Math.min(0, Math.max(W - vw, W / 2 - slot.focus[0] * vw));
  const top = Math.min(0, Math.max(H - vh, H / 2 - slot.focus[1] * vh));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", left, top, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "0 0" }}>
        <Freeze frame={Math.max(0, Math.round(st * FPS))}>
          <OffthreadVideo src={staticFile(slot.file)} muted style={{ width: 1920, height: 1080, filter: filter ?? "url(#mk-sharpen) contrast(1.1) saturate(1.15) brightness(1.03)" }} />
        </Freeze>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Plain 16:9 clip in a box (cards, PiP).
const Boxed: React.FC<{ slot: ClipSlot; rate?: number; style?: React.CSSProperties; filter?: string }> = ({ slot, rate, style, filter }) => {
  const t = useLocal();
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <Freeze frame={Math.round((slot.start + t * (rate ?? slot.rate ?? 1)) * FPS)}>
        <OffthreadVideo src={staticFile(slot.file)} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${slot.focus[0] * 100}% ${slot.focus[1] * 100}%`, filter: filter ?? "url(#mk-sharpen) contrast(1.08) saturate(1.12)" }} />
      </Freeze>
    </div>
  );
};

// Preview-only label so you can see which slot is which.
const SlotTag: React.FC<{ id: string }> = ({ id }) =>
  PREVIEW ? (
    <div style={{ position: "absolute", right: 30, top: 30, padding: "8px 16px", borderRadius: 999, background: "rgba(0,0,0,0.6)", border: "1.5px dashed rgba(255,255,255,0.7)", fontFamily: UI, fontWeight: 800, fontSize: 22, letterSpacing: "0.14em", color: "#fff", zIndex: 50 }}>
      {id} · STAND-IN
    </div>
  ) : null;

// ---------------------------------------------------------------- HOOK (R13, R03)

const Hook: React.FC = () => {
  const t = useLocal();
  const dur = T.name - T.hook;
  const name = `${TEXT.first} ${TEXT.last}`;
  const out = progress(t, dur - 0.35, 0.35, ease.swift);
  const card = progress(t, 0.1, 0.6);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: "blur(22px) brightness(0.35) saturate(1.2)", transform: "scale(1.15)", opacity: card }}>
        <Vertical slot={CLIPS.hook} />
      </AbsoluteFill>
      {/* vertical hairline from the top into the card */}
      <div style={{ position: "absolute", left: W / 2 - 1, top: 0, width: 2, height: 760 * progress(t, 0.05, 0.7), background: `linear-gradient(180deg, transparent, ${COLORS.gold})`, boxShadow: `0 0 12px ${COLORS.gold}` }} />
      {/* title: letters assemble in random order with glow */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", opacity: 1 - out }}>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 24, letterSpacing: `${0.6 + (1 - progress(t, 0.1, 0.8)) * 0.4}em`, color: "rgba(255,255,255,0.8)", opacity: progress(t, 0.1, 0.5) }}>{TEXT.kicker}</div>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          {name.split("").map((c, i) => {
            const p = progress(t, 0.25 + random(`h${i}`) * 0.6, 0.35);
            return (
              <span key={i} style={{ fontFamily: CLASSIC, fontWeight: 700, fontSize: 86, letterSpacing: "0.08em", color: COLORS.ink, whiteSpace: "pre", opacity: p, textShadow: glowText(COLORS.gold, 0.6 + (1 - p)) }}>
                {c}
              </span>
            );
          })}
        </div>
      </div>
      {/* PiP card that zooms through to the next section */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 380,
          top: 760,
          width: 760,
          height: 428,
          transform: `scale(${(0.86 + 0.14 * card) * (1 + out * 2.6)})`,
          opacity: card,
          border: `2px solid ${COLORS.gold}aa`,
          boxShadow: `0 0 40px ${COLORS.gold}44, 0 30px 80px rgba(0,0,0,0.6)`,
        }}
      >
        <Boxed slot={CLIPS.hook} style={{ width: "100%", height: "100%" }} />
      </div>
      <SlotTag id={CLIPS.hook.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- NAME (R15/R01, R04)

const NUM_SKINS = [COLORS.gold, COLORS.red, COLORS.sky, "#ffffff", COLORS.violet];
const NameCard: React.FC = () => {
  const t = useLocal();
  const f = useCurrentFrame();
  const dur = T.quote - T.name;
  const push = interpolate(t, [0, dur], [1.0, 1.07], clamp);
  const boil = t < 0.9 ? Math.floor(f / 3) % NUM_SKINS.length : 0;
  const slam = progress(t, 0.9, 0.12, ease.settle);
  const nameP = progress(t, 0.15, 0.5);
  const photo = PHOTOS[0];
  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push * 1.12})` }}>
        <Img src={staticFile(photo.file)} style={{ width: W, height: H, objectFit: "cover", filter: "blur(18px) brightness(0.4) saturate(1.2)" }} />
      </AbsoluteFill>
      <Atmos color={COLORS.gold} amount={0.8} />
      {/* boiling jersey numeral, behind everything */}
      <div style={{ position: "absolute", left: 40, top: 150, fontFamily: DISPLAY, fontSize: 520, lineHeight: 0.9, color: "transparent", WebkitTextStroke: `4px ${NUM_SKINS[boil]}`, filter: `drop-shadow(0 0 18px ${NUM_SKINS[boil]}88)`, opacity: progress(t, 0.05, 0.2) }}>
        {TEXT.number}
      </div>
      {/* surname BEHIND the cut-out */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", opacity: nameP, transform: `translateY(${(1 - nameP) * 80}px) scale(${push})` }}>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 30, letterSpacing: "0.7em", color: COLORS.ink, marginBottom: 6 }}>{TEXT.first}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 340, lineHeight: 0.92, color: COLORS.ink, textShadow: glowText(COLORS.gold, 0.5) }}>{TEXT.last}</div>
      </div>
      {/* cut-out subject */}
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 100%" }}>
        <Img src={staticFile(photo.cut ?? photo.file)} style={{ position: "absolute", left: -60, top: 280, width: W + 120, height: H - 220, objectFit: "cover", objectPosition: "50% 20%", filter: "contrast(1.06) saturate(1.1) drop-shadow(0 30px 50px rgba(0,0,0,0.6))" }} />
      </AbsoluteFill>
      {/* outline copy of the surname IN FRONT for depth */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640 + 42, textAlign: "center", opacity: nameP * 0.9, transform: `scale(${push})` }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 340, lineHeight: 0.92, color: "transparent", WebkitTextStroke: `3px ${COLORS.ink}` }}>{TEXT.last}</div>
      </div>
      {/* gold serif word slams from 300% */}
      {slam > 0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1480, textAlign: "center", transform: `scale(${3 - 2 * slam})`, opacity: slam, filter: slam < 0.95 ? "url(#mk-by20)" : undefined }}>
          <span style={{ fontFamily: CLASSIC, fontWeight: 700, fontSize: 120, letterSpacing: "0.12em", backgroundImage: `linear-gradient(180deg, #fff6d8, ${COLORS.gold} 55%, #a8781a)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: `drop-shadow(0 0 22px ${COLORS.gold}aa)` }}>
            {TEXT.word}
          </span>
        </div>
      ) : null}
      <Vignette strength={0.6} />
      <SlotTag id={photo.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- QUOTE + PREDROP (R07, R03, R04)

const Quote: React.FC = () => {
  const t = useLocal();
  const dur = T.montage - T.quote;
  const pre = T.predrop - T.quote;
  const desat = progress(t, pre, D - T.predrop, ease.drift);
  const bar = progress(t, dur - 0.1, 0.08, ease.swift);
  const phrases = TEXT.quote.map((q, i) => ({ t0: q.at, t1: q.at + 0.9 + (i === 0 ? 0.3 : 0), text: q.text }));
  return (
    <AbsoluteFill style={{ background: "#050507", filter: `grayscale(${desat}) contrast(${1 + desat * 0.2})` }}>
      <AbsoluteFill style={{ filter: "blur(26px) brightness(0.28)", transform: "scale(1.2)" }}>
        <Vertical slot={CLIPS.quote} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 560, width: W, height: 608, boxShadow: "0 30px 90px rgba(0,0,0,0.7)" }}>
        <Boxed slot={CLIPS.quote} rate={0.5} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 1250 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 18, rowGap: 4 }}>
          {wordTimes(phrases).map((x, i) => {
            const p = progress(t, x.at, 0.35);
            return (
              <span key={i} style={{ fontFamily: x.em ? SERIF : CLASSIC, fontStyle: x.em ? "italic" : undefined, fontWeight: x.em ? 400 : 700, fontSize: x.em ? 96 : 54, lineHeight: 1.15, color: x.em ? COLORS.gold : COLORS.ink, textShadow: x.em ? glowText(COLORS.gold, 0.6) : glowText("#ffffff", 0.25), opacity: p, transform: `translateY(${(1 - p) * 20}px)`, filter: p < 0.7 ? `blur(${(1 - p) * 8}px)` : undefined }}>
                {x.w}
              </span>
            );
          })}
        </div>
      </div>
      {/* pre-drop red bar wipes down from the top */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H * bar, background: COLORS.red }} />
      <SlotTag id={CLIPS.quote.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- MONTAGE (R04 + per-clip treatments)

// Zoom-pop entry: 120% → 100% in ~4 frames with vertical blur (R04).
const Pop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 4], [1, 0], { ...clamp, easing: ease.settle });
  return <AbsoluteFill style={{ transform: `scale(${1 + 0.2 * p})`, filter: p > 0.2 ? "url(#mk-by20)" : undefined }}>{children}</AbsoluteFill>;
};

const BigWord: React.FC<{ text: string; color: string; t: number; style?: React.CSSProperties }> = ({ text, color, t, style }) => {
  const p = progress(t, 0.05, 0.25);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 230, textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 40}px)`, ...style }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 210, lineHeight: 1, color: "#fff", letterSpacing: "0.02em", textShadow: `0 0 40px ${color}, 0 10px 40px rgba(0,0,0,0.6)` }}>{text}</span>
    </div>
  );
};

// m1 — giant translucent vertical word over the shot (R06)
const M1: React.FC = () => {
  const t = useLocal();
  return (
    <Pop>
      <Vertical slot={CLIPS.m1} />
      <div style={{ position: "absolute", left: W / 2, top: H / 2, transform: `translate(-50%, -50%) rotate(-90deg) translateX(${t * -60}px)`, fontFamily: DISPLAY, fontSize: 470, lineHeight: 1, color: "#fff", opacity: 0.32, mixBlendMode: "overlay", whiteSpace: "nowrap" }}>{TEXT.montageWords[0]}</div>
      <BigWord text={TEXT.montageWords[0]} color={COLORS.gold} t={t} />
      <SlotTag id={CLIPS.m1.id} />
    </Pop>
  );
};

// m2 — freeze-frame annotation (measured on the stand-in; re-measure for the real clip)
const M2: React.FC = () => {
  const t = useLocal();
  const a = 0.3;
  const on = t > a - 0.02 && t < 1.15;
  const keys: [number, number][] = [[0, CLIPS.m2.start], [a, CLIPS.m2.start + 0.3], [1.1, CLIPS.m2.start + 0.3], [4 * B, CLIPS.m2.start + 1.2]];
  return (
    <Pop>
      <Vertical slot={CLIPS.m2} keys={keys} zoom={1 + 0.08 * progress(t, a, 0.3) * (1 - progress(t, 1.1, 0.2))}>
        <div style={{ position: "absolute", inset: 0, opacity: on ? 1 : 0 }}>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <Ring x={794} y={840} r={46} p={progress(t, a, 0.15)} color={COLORS.sky} t={t} />
            <DrawPath d="M830 800 Q1000 560 1180 470" p={progress(t, a + 0.08, 0.3)} color={COLORS.sky} width={9} />
          </svg>
        </div>
      </Vertical>
      {on ? <div style={{ position: "absolute", left: 520, top: 560 }}><Callout x={0} y={0} text="EYES UP. BALL CLOSE." p={progress(t, a + 0.25, 0.2)} color={COLORS.sky} font={UI} size={30} /></div> : null}
      <BigWord text={TEXT.montageWords[1]} color={COLORS.sky} t={t} />
      <SlotTag id={CLIPS.m2.id} />
    </Pop>
  );
};

// m3 — one word, colour flips on every beat (R05)
const M3: React.FC = () => {
  const t = useLocal();
  const beat = Math.floor(t / B);
  const col = beat % 2 ? COLORS.red : COLORS.sky;
  return (
    <Pop>
      <Vertical slot={CLIPS.m3} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 230, textAlign: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 230, color: col, textShadow: `0 0 40px ${col}aa`, display: "inline-block", transform: `scale(${1 + 0.06 * Math.exp(-((t % B) / B) * 6)})` }}>{TEXT.montageWords[2]}</span>
      </div>
      <SlotTag id={CLIPS.m3.id} />
    </Pop>
  );
};

// m4 — hue-cycle flash + neon frame on the first half-second (R12 hue cycle, R13 invert accent)
const M4: React.FC = () => {
  const t = useLocal();
  const f = useCurrentFrame();
  const flashing = t < 0.5;
  const step = Math.floor(f / 3);
  const hue = flashing ? (step % 4) * 90 : 0;
  const invert = flashing && step % 5 === 2;
  const col = [COLORS.violet, COLORS.sky, COLORS.red, COLORS.gold][step % 4];
  return (
    <Pop>
      <Vertical slot={CLIPS.m4} filter={`url(#mk-sharpen) contrast(1.15) saturate(1.3) hue-rotate(${hue}deg)${invert ? " invert(1)" : ""}`} />
      {flashing ? <div style={{ position: "absolute", inset: 24, border: `6px solid ${col}`, boxShadow: `0 0 40px ${col}, inset 0 0 40px ${col}` }} /> : null}
      <BigWord text={TEXT.montageWords[3]} color={COLORS.violet} t={t} />
      <SlotTag id={CLIPS.m4.id} />
    </Pop>
  );
};

// m5 — circle iris punch into the subject, then open (R14)
const M5: React.FC = () => {
  const t = useLocal();
  const r = interpolate(t, [0, 0.12, 0.7, 1.0], [0, 330, 330, 1400], { ...clamp, easing: ease.settle });
  const cx = W / 2;
  const cy = H * 0.55;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>
        <Vertical slot={CLIPS.m5} zoom={interpolate(t, [0, 0.7, 1.0], [1.35, 1.35, 1], clamp)} />
      </AbsoluteFill>
      {r < 1300 ? <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `5px solid ${COLORS.gold}`, boxShadow: `0 0 30px ${COLORS.gold}` }} /> : null}
      <BigWord text={TEXT.montageWords[4]} color={COLORS.gold} t={t} />
      <SlotTag id={CLIPS.m5.id} />
    </AbsoluteFill>
  );
};

// m6 — repeated-word stack, rows sliding in opposite directions (R07)
const M6: React.FC = () => {
  const t = useLocal();
  const word = TEXT.montageWords[5];
  return (
    <Pop>
      <Vertical slot={CLIPS.m6} />
      <AbsoluteFill style={{ justifyContent: "center", mixBlendMode: "screen", opacity: 0.85 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ whiteSpace: "nowrap", fontFamily: DISPLAY, fontSize: 200, lineHeight: 0.95, transform: `translateX(${(i % 2 ? 1 : -1) * (t * 160 + 60) - 300}px)`, color: i % 2 ? "transparent" : `${COLORS.red}cc`, WebkitTextStroke: i % 2 ? `3px ${COLORS.ink}` : undefined, opacity: progress(t, i * 0.05, 0.2) }}>
            {`${word} ${word} ${word} ${word}`}
          </div>
        ))}
      </AbsoluteFill>
      <SlotTag id={CLIPS.m6.id} />
    </Pop>
  );
};

// ---------------------------------------------------------------- STAT (R13)

const Stat: React.FC = () => {
  const t = useLocal();
  const n = Math.round(TEXT.stat.value * progress(t, 0.25, 1.3, ease.settle));
  const line = progress(t, 0.1, 0.4);
  return (
    <AbsoluteFill>
      <Vertical slot={CLIPS.stat} filter="contrast(1.05) saturate(0.6) brightness(0.38)" />
      <Atmos color={COLORS.gold} amount={0.5} />
      <div style={{ position: "absolute", left: 0, top: 820, height: 2, width: W * line, background: COLORS.gold, boxShadow: `0 0 12px ${COLORS.gold}` }} />
      <div style={{ position: "absolute", right: 0, top: 1240, height: 2, width: W * line, background: COLORS.gold, boxShadow: `0 0 12px ${COLORS.gold}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center" }}>
        <div style={{ fontFamily: CLASSIC, fontWeight: 700, fontSize: 40, letterSpacing: "0.3em", color: COLORS.ink, opacity: progress(t, 0.15, 0.4), textShadow: glowText(COLORS.gold, 0.3) }}>{TEXT.stat.label}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 380, lineHeight: 1.05, color: "#fff", textShadow: glowText(COLORS.gold, 0.7), fontVariantNumeric: "tabular-nums" }}>
          {n}
          {TEXT.stat.suffix}
        </div>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 24, letterSpacing: "0.4em", color: "rgba(255,255,255,0.75)", opacity: progress(t, 1.3, 0.4) }}>{TEXT.stat.caption}</div>
      </div>
      <SlotTag id={CLIPS.stat.id} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- WALL (R16, R03)

const Wall: React.FC = () => {
  const t = useLocal();
  const pull = interpolate(t, [0, 10 * B], [1.08, 0.9], { ...clamp, easing: ease.drift });
  const cols = 2;
  const fw = 440;
  const fh = 470;
  const gap = 30;
  const x0 = (W - (cols * fw + (cols - 1) * gap)) / 2;
  const y0 = 250;
  const photos = PHOTOS.slice(1, 7);
  const title = progress(t, 7 * B, 0.5);
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Aura t={t} colors={[COLORS.gold, COLORS.violet]} w={W} h={H} opacity={0.35} />
      <AbsoluteFill style={{ transform: `scale(${pull})` }}>
        {photos.map((p, i) => {
          const fill = progress(t, i * B, 0.18, ease.pop);
          const x = x0 + (i % cols) * (fw + gap);
          const y = y0 + Math.floor(i / cols) * (fh + gap);
          return (
            <div key={i} style={{ position: "absolute", left: x, top: y, width: fw, height: fh, border: "3px solid rgba(255,255,255,0.85)", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
              <Img src={staticFile(p.file)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", opacity: fill, transform: `scale(${1.2 - 0.2 * fill})` }} />
              {PREVIEW ? <div style={{ position: "absolute", left: 10, bottom: 10, fontFamily: UI, fontWeight: 800, fontSize: 18, letterSpacing: "0.1em", color: "#fff", background: "rgba(0,0,0,0.6)", padding: "4px 10px" }}>{p.id}</div> : null}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(6,6,10,${0.55 * title})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", opacity: title, transform: `scale(${1.1 - 0.1 * title})` }}>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 28, letterSpacing: "0.6em", color: COLORS.ink }}>{TEXT.first}</div>
        <div style={{ fontFamily: CLASSIC, fontWeight: 700, fontSize: 150, letterSpacing: "0.08em", backgroundImage: `linear-gradient(180deg, #fff6d8, ${COLORS.gold} 55%, #a8781a)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: `drop-shadow(0 0 24px ${COLORS.gold}88)` }}>{TEXT.last}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- END (R04, R12)

const End: React.FC = () => {
  const t = useLocal();
  const dur = T.total - T.end;
  const p = progress(t, 0.2, 0.8);
  const q = fadeOut(t, dur - 0.5, 0.5);
  return (
    <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center", opacity: q }}>
      <div style={{ fontFamily: CLASSIC, fontWeight: 700, fontSize: 30, letterSpacing: `${0.5 + (1 - p) * 0.6}em`, color: COLORS.ink, opacity: p, textShadow: glowText(COLORS.gold, 0.4) }}>{TEXT.end}</div>
      <div style={{ marginTop: 26, fontFamily: UI, fontWeight: 900, fontSize: 34, letterSpacing: "0.35em", color: "#fff", opacity: progress(t, 0.6, 0.6) }}>{TEXT.handle}</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- master

export const PlayerEdit: React.FC = () => {
  const { fps } = useVideoConfig();
  const sec = (a: number, b: number) => ({ from: Math.round(a * fps), durationInFrames: Math.round(b * fps) - Math.round(a * fps) });
  const montage = [M1, M2, M3, M4, M5, M6];
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <KitDefs />
      <HitCamera hits={[T.name, T.quote, ...MCUT.slice(1), T.stat, T.wall]} bigHits={[D]}>
        <Sequence {...sec(T.hook, T.name)}><Hook /></Sequence>
        <Sequence {...sec(T.name, T.quote)}><NameCard /></Sequence>
        <Sequence {...sec(T.quote, T.montage)}><Quote /></Sequence>
        {montage.map((M, i) => (
          <Sequence key={i} {...sec(MCUT[i], i < 5 ? MCUT[i + 1] : T.stat)}><M /></Sequence>
        ))}
        <Sequence {...sec(T.stat, T.wall)}><Stat /></Sequence>
        <Sequence {...sec(T.wall, T.end)}><Wall /></Sequence>
        <Sequence {...sec(T.end, T.total)}><End /></Sequence>
      </HitCamera>
      <Grain opacity={0.05} />
      <Audio src={staticFile(MUSIC.file)} trimBefore={Math.round(MUSIC.offset * fps)} volume={(f) => interpolate(f / fps, [T.total - 1.2, T.total], [1, 0], clamp)} />
    </AbsoluteFill>
  );
};
