// THE FIRST 7 DAYS AFTER DEATH — flat-vector explainer (vertical 1080×1920, 30 fps).
// Look: reference 1 ("8 forgotten sunnahs of Jumu'ah": plum grid, flat shapes, faceless
// pill figures, word-by-word type with serif keywords + cream chips, source tags, arch
// push-through / whip / grow transitions). Devices: reference 2 (As-Siraj: hadith cards with
// Arabic, "no one is depicted"). Script: modern story arc (hook at 70, spike by 10 s,
// peak/release). Only Qur'an + sahih/hasan hadith; see edits/after-death/storyboard.md.
import React from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { clamp, ease, progress } from "../../kit";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const END = 62.0;
export const FRAMES = Math.round(END * FPS);

// Scene starts (s). Each scene runs to the next one.
export const S = { hook: 0, teach: 3.6, soul: 6.6, funeral: 12.4, steps: 17.4, grave: 24.4, dua: 32.4, mourn: 38.4, deeds: 44.4, turn: 52.4, cta: 58.4, end: END };
// Moments that get a sound (see build-audio.py): whooshes on cuts, chimes on source tags.
export const CUES = { whoosh: [S.teach + 2.6, S.funeral, S.steps, S.grave, S.dua, S.mourn, S.deeds, S.turn, S.cta] };

// ---------------------------------------------------------------- palette + type
const BG = "#170910";
const PLUM = "#2a0f1a";
const MAROON = "#4d1b29";
const MAROON2 = "#672537";
const CREAM = "#ffe7b3";
const INK = "#fbf3e6";
const BLUE = "#a9d3ef";
const PINK = "#e7a2b4";
const GREEN = "#a9cf9d";
const NIGHT = "#101831";
const SANS = "'Bricolage Grotesque', sans-serif";
const SERIF = "'Instrument Serif', serif";
const MONO = "'JetBrains Mono', monospace";
const ARABIC = "'Amiri', serif";

const FONTS: [string, string, string, string][] = [
  ["Bricolage Grotesque", "bricolage-500.ttf", "500", "normal"],
  ["Bricolage Grotesque", "bricolage-700.ttf", "700", "normal"],
  ["Bricolage Grotesque", "bricolage-800.ttf", "800", "normal"],
  ["Instrument Serif", "instrument-serif.ttf", "400", "normal"],
  ["Instrument Serif", "instrument-serif-italic.ttf", "400", "italic"],
  ["JetBrains Mono", "jetbrains-600.ttf", "600", "normal"],
  ["Amiri", "amiri-400.ttf", "400", "normal"],
  ["Amiri", "amiri-700.ttf", "700", "normal"],
];
let fontsReady: Promise<unknown> | null = null;
const useFonts = () => {
  const [handle] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    fontsReady ??= Promise.all(
      FONTS.map(([fam, file, weight, style]) => {
        const f = new FontFace(fam, `url(${staticFile(`fonts/${file}`)})`, { weight, style });
        return f.load().then((x) => document.fonts.add(x));
      }),
    );
    fontsReady.then(() => continueRender(handle));
  }, [handle]);
};

const useT = () => useCurrentFrame() / FPS;
const sec = (a: number, b: number) => ({ from: Math.round(a * FPS), durationInFrames: Math.round((b - a) * FPS) });
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// ---------------------------------------------------------------- type
// "*word*" = italic serif keyword, "[word]" = cream highlight chip. Words build one by one.
type Seg = { text: string; kind: "plain" | "serif" | "chip" };
const parse = (s: string): Seg[] =>
  s.split(/(\*[^*]+\*|\[[^\]]+\])/).filter(Boolean).map((p) =>
    p.startsWith("*") ? { text: p.slice(1, -1), kind: "serif" } : p.startsWith("[") ? { text: p.slice(1, -1), kind: "chip" } : { text: p, kind: "plain" },
  );

const Words: React.FC<{ t: number; text: string; at: number; size?: number; step?: number; color?: string; out?: number; weight?: number }> = ({ t, text, at, size = 64, step = 0.075, color = INK, out, weight = 700 }) => {
  let k = 0;
  const q = out === undefined ? 1 : 1 - progress(t, out, 0.3, ease.exit);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: size * 0.26, rowGap: size * 0.12, opacity: q, filter: q < 1 ? `blur(${(1 - q) * 10}px)` : undefined }}>
      {parse(text).map((seg, si) => {
        if (seg.kind === "chip") {
          const i = k++;
          const p = progress(t, at + i * step, 0.4);
          const bg = progress(t, at + i * step + 0.12, 0.35, ease.swift);
          return (
            <span key={si} style={{ position: "relative", display: "inline-block", fontFamily: SANS, fontWeight: 800, fontSize: size, color: bg > 0.5 ? PLUM : color, padding: `0 ${size * 0.18}px`, opacity: p, filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined, lineHeight: 1.15 }}>
              <span style={{ position: "absolute", inset: `${size * 0.04}px 0`, background: CREAM, borderRadius: size * 0.12, transformOrigin: "left", transform: `scaleX(${bg})` }} />
              <span style={{ position: "relative" }}>{seg.text}</span>
            </span>
          );
        }
        return seg.text.trim().split(/\s+/).filter(Boolean).map((w, wi) => {
          const i = k++;
          const p = progress(t, at + i * step, 0.45);
          const serif = seg.kind === "serif";
          return (
            <span key={`${si}-${wi}`} style={{ display: "inline-block", fontFamily: serif ? SERIF : SANS, fontStyle: serif ? "italic" : "normal", fontWeight: serif ? 400 : weight, fontSize: serif ? size * 1.14 : size, color: serif ? CREAM : color, opacity: p, transform: `translateY(${(1 - p) * size * 0.3}px)`, filter: p < 1 ? `blur(${(1 - p) * 9}px)` : undefined, lineHeight: 1.12, letterSpacing: serif ? "0" : "-0.01em" }}>
              {w}
            </span>
          );
        });
      })}
    </div>
  );
};

const Head: React.FC<{ top?: number; children: React.ReactNode }> = ({ top = 300, children }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, textAlign: "center" }}>{children}</div>
);

// Small monospace source pill (reference 1).
const Source: React.FC<{ t: number; at: number; text: string; top?: number }> = ({ t, at, text, top = 1452 }) => {
  const p = progress(t, at, 0.5);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
      <div style={{ padding: "10px 22px", borderRadius: 10, background: MAROON, border: `1.5px solid ${MAROON2}`, fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: "0.14em", color: "rgba(255,231,179,0.9)" }}>{text}</div>
    </div>
  );
};

// ---------------------------------------------------------------- shared pieces
const Grid: React.FC<{ color?: string }> = ({ color = BG }) => (
  <AbsoluteFill style={{ background: color }}>
    <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.035) 2px, transparent 2px)", backgroundSize: "72px 72px", backgroundPosition: "36px 36px" }} />
  </AbsoluteFill>
);

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.07, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' seed='${f % 7}'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>")` }} />;
};
const Vignette: React.FC = () => <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 48%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />;

// Faceless pill figure (reference 1): round head + capsule body. (x, y) = feet centre.
const Figure: React.FC<{ x: number; y: number; h?: number; color?: string; arms?: number; bob?: number }> = ({ x, y, h = 150, color = BLUE, arms = 0, bob = 0 }) => {
  const bw = h * 0.38;
  const bh = h * 0.62;
  const r = h * 0.15;
  return (
    <g transform={`translate(${x}, ${y - bob})`}>
      <rect x={-bw / 2} y={-bh} width={bw} height={bh} rx={bw / 2} fill={color} />
      <circle cx={0} cy={-bh - r - h * 0.05} r={r} fill={color} />
      {arms > 0 && (
        <>
          <rect x={-bw / 2 - h * 0.1} y={-bh - h * 0.12 * arms} width={h * 0.09} height={h * 0.32} rx={h * 0.045} fill={color} transform={`rotate(${-18 * arms}, ${-bw / 2}, ${-bh * 0.6})`} />
          <rect x={bw / 2 + h * 0.01} y={-bh - h * 0.12 * arms} width={h * 0.09} height={h * 0.32} rx={h * 0.045} fill={color} transform={`rotate(${18 * arms}, ${bw / 2}, ${-bh * 0.6})`} />
        </>
      )}
    </g>
  );
};

const Stars: React.FC<{ t: number; n?: number; top?: number; bottom?: number; seed?: string }> = ({ t, n = 40, top = 0, bottom = 900, seed = "s" }) => (
  <>
    {Array.from({ length: n }).map((_, i) => {
      const x = random(`${seed}x${i}`) * W;
      const y = top + random(`${seed}y${i}`) * (bottom - top);
      const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + random(`${seed}t${i}`) * 2) + i);
      return <circle key={i} cx={x} cy={y} r={1.5 + random(`${seed}r${i}`) * 2.5} fill={INK} opacity={tw * 0.7} />;
    })}
  </>
);

const Crescent: React.FC<{ x: number; y: number; r?: number; bg: string }> = ({ x, y, r = 34, bg }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={CREAM} />
    <circle cx={x + r * 0.42} cy={y - r * 0.22} r={r * 0.86} fill={bg} />
  </g>
);

// Arch doorway path (pointed top).
const archPath = (cx: number, base: number, w: number, h: number) => {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const sh = base - h + w * 0.55;
  return `M ${l} ${base} L ${l} ${sh} Q ${l} ${base - h + w * 0.08} ${cx} ${base - h} Q ${r} ${base - h + w * 0.08} ${r} ${sh} L ${r} ${base} Z`;
};

// Hanging lantern.
const Lantern: React.FC<{ x: number; y: number; s?: number; glow?: number; t: number }> = ({ x, y, s = 1, glow = 1, t }) => {
  const sw = Math.sin(t * 1.3) * 3;
  const fl = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3);
  return (
    <g transform={`translate(${x}, ${y}) rotate(${sw}) scale(${s})`}>
      <line x1={0} y1={-260} x2={0} y2={-70} stroke={CREAM} strokeWidth={3} opacity={0.6} />
      <circle cx={0} cy={10} r={150} fill={CREAM} opacity={0.12 * glow * fl} />
      <circle cx={0} cy={10} r={80} fill={CREAM} opacity={0.18 * glow * fl} />
      <path d="M -26 -70 L 26 -70 L 40 -40 L -40 -40 Z" fill={MAROON2} />
      <path d="M -40 -40 Q -52 10 -30 60 L 30 60 Q 52 10 40 -40 Z" fill={CREAM} opacity={0.35 + 0.6 * glow * fl} />
      <path d="M -40 -40 Q -52 10 -30 60 L 30 60 Q 52 10 40 -40 Z" fill="none" stroke={MAROON2} strokeWidth={6} />
      <line x1={0} y1={-40} x2={0} y2={60} stroke={MAROON2} strokeWidth={5} />
      <path d="M -30 60 L 30 60 L 18 84 L -18 84 Z" fill={MAROON2} />
      <ellipse cx={0} cy={18} rx={9} ry={16} fill="#fff6dc" opacity={glow * fl} />
    </g>
  );
};

// ---------------------------------------------------------------- the 7-day strip
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
// lit: 0..1 per day. accent: highlight colour.
const DayStrip: React.FC<{ t: number; lit: number[]; y?: number; at?: number; scale?: number; accent?: string; flicker?: boolean }> = ({ t, lit, y = 690, at = 0, scale = 1, accent = CREAM, flicker }) => {
  const tw = 104;
  const gap = 12;
  const total = 7 * tw + 6 * gap;
  return (
    <div style={{ position: "absolute", left: W / 2 - total / 2, top: y, width: total, display: "flex", gap, transform: `scale(${scale})`, transformOrigin: "center top" }}>
      {DAYS.map((d, i) => {
        const p = progress(t, at + i * 0.06, 0.4);
        let l = lit[i] ?? 0;
        if (flicker) l = Math.max(l, random(`fl${i}${Math.floor(t * 10)}`) > 0.82 ? 0.5 : 0);
        return (
          <div key={d} style={{ width: tw, height: 62, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: l > 0.5 ? accent : MAROON, border: `2px solid ${l > 0.5 ? accent : MAROON2}`, boxShadow: l > 0.5 ? `0 0 ${30 * l}px ${accent}88` : "none", fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: "0.12em", color: l > 0.5 ? PLUM : "rgba(255,231,179,0.45)", opacity: p, transform: `translateY(${(1 - p) * 16}px) scale(${1 + (l > 0.5 ? 0.06 * Math.max(0, 1 - (l - 0.5) * 4) : 0)})` }}>
            {d}
          </div>
        );
      })}
    </div>
  );
};
// A tile switches on over 0.25 s at time `at`.
const on = (t: number, at: number) => (t >= at ? 0.5 + 0.5 * Math.min(1, (t - at) / 0.25) : 0);

// Whip in/out (reference 1): slide sideways with a skew + streak.
const Whip: React.FC<{ t: number; dur: number; inAt?: number; out?: boolean; children: React.ReactNode }> = ({ t, dur, inAt = 0, out = true, children }) => {
  const pin = progress(t, inAt, 0.45, ease.settle);
  const pout = out ? progress(t, dur - 0.35, 0.35, ease.exit) : 0;
  const x = (1 - pin) * W * 0.9 - pout * W * 1.0;
  const skew = (1 - pin) * -10 + pout * 10;
  return <AbsoluteFill style={{ transform: `translateX(${x}px) skewX(${skew}deg)` }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- 1 · hook + 2 · teach
const Opening: React.FC = () => {
  const t = useT();
  const dur = S.soul - S.hook;
  const push = progress(t, dur - 0.75, 0.75, ease.swift); // camera dives into the arch
  const z = 1 + push * 7;
  const dark = interpolate(t, [dur - 0.35, dur], [0, 1], clamp);
  const hookOut = S.teach - 0.3;
  return (
    <AbsoluteFill>
      <Grid />
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 62%" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={archPath(540, 1500, 560, 760)} fill={MAROON} />
          <path d={archPath(540, 1500, 470, 680)} fill={PLUM} />
          <path d={archPath(540, 1500, 470, 680)} fill="#0b0408" opacity={0.6} />
          <Lantern x={540} y={1110} t={t} glow={progress(t, 0.3, 1.2)} />
          <rect x={0} y={1500} width={W} height={420} fill={MAROON} opacity={0.35} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - push }}>
        <Head top={250}>
          <Words t={t} at={0.05} size={66} text="Do you *even* know what happens in the" out={hookOut} />
          <Words t={t} at={0.55} size={92} weight={800} text="[first 7 days]" out={hookOut} />
          <Words t={t} at={0.8} size={66} text="after death?" out={hookOut} />
        </Head>
        <div style={{ opacity: 1 - progress(t, hookOut, 0.3) }}><DayStrip t={t} lit={[0, 0, 0, 0, 0, 0, 0]} y={640} at={0.9} flicker /></div>
        <Head top={300}>
          <Words t={t} at={S.teach + 0.05} size={104} weight={800} text="Let me [teach] you." />
          <Words t={t} at={S.teach + 0.75} size={58} text="*Only* from the Qur'an and authentic hadith." />
        </Head>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 26, color: "rgba(251,243,230,0.55)", opacity: progress(t, 1.2, 0.6) }}>Out of respect, no one is depicted.</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#000", opacity: dark }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3 · the soul leaves
const Soul: React.FC = () => {
  const t = useT();
  const dur = S.funeral - S.soul;
  const fadeIn = interpolate(t, [0, 0.4], [0, 1], clamp);
  const gather = progress(t, 1.0, 1.4);
  const rise = progress(t, 2.6, 2.6, ease.swift);
  const dropY = lerp(1130, 760, rise);
  const dropO = 1 - progress(t, 4.4, 0.8);
  const camY = rise * 120;
  return (
    <Whip t={t} dur={dur} inAt={-1}>
      <Grid color={NIGHT} />
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `translateY(${camY}px)` }}>
          <Stars t={t} top={0} bottom={1000} seed="soul" />
          {/* window */}
          <path d={archPath(540, 1030, 300, 380)} fill="#1c2950" />
          <Crescent x={600} y={770} r={30} bg="#1c2950" />
          <path d={archPath(540, 1030, 300, 380)} fill="none" stroke={MAROON2} strokeWidth={14} />
          {/* room floor + bed with a covered figure */}
          <rect x={0} y={1290} width={W} height={700} fill={PLUM} />
          <rect x={250} y={1205} width={580} height={70} rx={20} fill={MAROON2} />
          <rect x={250} y={1250} width={30} height={60} fill={MAROON2} />
          <rect x={800} y={1250} width={30} height={60} fill={MAROON2} />
          <circle cx={318} cy={1168} r={30} fill={BLUE} />
          <rect x={352} y={1150} width={440} height={64} rx={32} fill={INK} />
          {/* gathering light + rising drop */}
          <circle cx={540} cy={1130} r={60 + gather * 140} fill={CREAM} opacity={gather * (1 - rise) * 0.16} />
          <circle cx={540} cy={dropY} r={70} fill={CREAM} opacity={gather * 0.25 * dropO} />
          <path d={archPath(540, 1030, 300, 380)} fill={CREAM} opacity={0.22 * progress(t, 4.4, 0.4) * (1 - progress(t, 4.9, 0.9))} />
          <path d={`M 540 ${dropY - 46} Q 568 ${dropY - 6} 568 ${dropY + 12} A 28 28 0 1 1 512 ${dropY + 12} Q 512 ${dropY - 6} 540 ${dropY - 46} Z`} fill="#fff6dc" opacity={gather * dropO} />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (t * 0.6 + i / 10) % 1;
            return <circle key={i} cx={540 + Math.sin(i * 2.1 + t) * 40} cy={dropY + 60 + a * 220} r={4 * (1 - a)} fill={CREAM} opacity={rise > 0 ? (1 - a) * 0.8 * dropO : 0} />;
          })}
        </svg>
        <Head top={250}>
          <Words t={t} at={0.3} size={62} text="The believer's soul flows out" />
          <Words t={t} at={1.1} size={62} text="*like a drop from a waterskin.*" />
        </Head>
        <Source t={t} at={1.8} text="MUSNAD AHMAD 18534 · SAHIH" />
      </AbsoluteFill>
    </Whip>
  );
};

// ---------------------------------------------------------------- 4 · the funeral
const Funeral: React.FC = () => {
  const t = useT();
  const dur = S.steps - S.funeral;
  const walk = t * 70;
  return (
    <Whip t={t} dur={dur}>
      <Grid />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* mosque skyline */}
        <g opacity={0.9}>
          <rect x={120} y={940} width={26} height={300} fill={MAROON} />
          <path d="M 120 940 L 133 900 L 146 940 Z" fill={CREAM} />
          <rect x={934} y={940} width={26} height={300} fill={MAROON} />
          <path d="M 934 940 L 947 900 L 960 940 Z" fill={CREAM} />
          <path d="M 330 1240 L 330 1060 Q 540 860 750 1060 L 750 1240 Z" fill={MAROON} />
          <rect x={536} y={880} width={8} height={40} fill={CREAM} />
          <path d={archPath(540, 1240, 120, 170)} fill={PLUM} />
        </g>
        <rect x={0} y={1240} width={W} height={700} fill={MAROON} opacity={0.4} />
        {/* bearers + bier, walking right */}
        <g transform={`translate(${-160 + walk}, 0)`}>
          {[0, 1, 2, 3].map((i) => {
            const x = 330 + i * 130;
            const b = Math.abs(Math.sin(t * 6 + i * 1.3)) * 7;
            return <Figure key={i} x={x} y={1390} h={190} color={[BLUE, PINK, GREEN, CREAM][i]} bob={b} />;
          })}
          <g transform={`translate(0, ${Math.sin(t * 6) * 3})`}>
            <rect x={280} y={1238} width={600} height={22} rx={6} fill={MAROON2} />
            <path d="M 300 1238 Q 300 1180 360 1176 L 800 1176 Q 860 1180 860 1238 Z" fill={INK} />
            <rect x={330} y={1196} width={500} height={10} fill={GREEN} opacity={0.75} />
          </g>
        </g>
      </svg>
      <Head top={250}>
        <Words t={t} at={0.35} size={64} text="[Hurry] with the funeral." />
        <Words t={t} at={1.6} size={52} text="The righteous one says:" />
        <Words t={t} at={2.1} size={72} text="*“Take me forward.”*" />
      </Head>
      <DayStrip t={t} lit={[on(t, 0.8), 0, 0, 0, 0, 0, 0]} y={720} at={0.15} />
      <Source t={t} at={1.0} text="SAHIH AL-BUKHĀRĪ 1315 · 1316" />
    </Whip>
  );
};

// ---------------------------------------------------------------- 5 · footsteps
const Steps: React.FC = () => {
  const t = useT();
  const dur = S.grave - S.steps;
  const dive = progress(t, dur - 0.7, 0.7, ease.swift); // camera dives into the ground
  // footprint pairs walking away right from the grave
  const prints = Array.from({ length: 9 }).map((_, i) => {
    const at = 1.6 + i * 0.42;
    const x = 470 + i * 78;
    const y = 1330 + (i % 2) * 34 - i * 10;
    const p = progress(t, at, 0.15);
    const fade = 1 - progress(t, at + 1.4, 1.2);
    return { x, y, o: p * fade, left: i % 2 === 0 };
  });
  return (
    <Whip t={t} dur={dur} out={false}>
      <AbsoluteFill style={{ transform: `translateY(${-dive * 900}px) scale(${1 + dive * 0.5})`, transformOrigin: "50% 75%" }}>
        <Grid color={NIGHT} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Stars t={t} top={60} bottom={1050} seed="steps" />
          <Crescent x={820} y={880} r={44} bg={NIGHT} />
          <rect x={0} y={1240} width={W} height={900} fill={PLUM} />
          {/* grave mound + marker stone */}
          <path d="M 130 1260 Q 300 1150 470 1260 Z" fill={MAROON2} />
          <rect x={150} y={1090} width={36} height={150} rx={12} fill={CREAM} opacity={0.9} />
          {prints.map((f, i) => (
            <g key={i} opacity={f.o} transform={`translate(${f.x}, ${f.y}) rotate(80)`}>
              <ellipse cx={0} cy={0} rx={13} ry={24} fill={CREAM} />
              <ellipse cx={0} cy={-36} rx={10} ry={10} fill={CREAM} />
            </g>
          ))}
        </svg>
        <Head top={250}>
          <Words t={t} at={0.4} size={66} text="After burial, he *hears*" />
          <Words t={t} at={1.0} size={66} text="the [footsteps] of the people walking away." />
        </Head>
        <Source t={t} at={2.2} text="AL-BUKHĀRĪ 1338 · MUSLIM 2870" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#0b0507", opacity: interpolate(t, [dur - 0.25, dur], [0, 1], clamp) }} />
    </Whip>
  );
};

// ---------------------------------------------------------------- 6 · the three questions
const QUESTIONS = [
  { ar: "مَنْ رَبُّكَ؟", en: "Who is your Lord?" },
  { ar: "مَا دِينُكَ؟", en: "What is your religion?" },
  { ar: "مَنْ هَذَا الرَّجُلُ الَّذِي بُعِثَ فِيكُمْ؟", en: "Who is this man who was sent to you?" },
];
const Grave: React.FC = () => {
  const t = useT();
  const dur = S.dua - S.grave;
  const fadeIn = interpolate(t, [0, 0.5], [0, 1], clamp);
  const rise = progress(t, dur - 0.7, 0.7, ease.swift); // camera rises back out
  return (
    <AbsoluteFill style={{ opacity: fadeIn, transform: `translateY(${rise * 1100}px)` }}>
      <AbsoluteFill style={{ background: "#1d0c12" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* earth strata */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M 0 ${180 + i * 300} Q 270 ${150 + i * 300 + (i % 2) * 40} 540 ${180 + i * 300} T 1080 ${180 + i * 300} L 1080 ${330 + i * 300} L 0 ${330 + i * 300} Z`} fill={i % 2 ? "#26101a" : "#2c1320"} opacity={0.8} />
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={random(`pb${i}`) * W} cy={random(`pc${i}`) * H} r={3 + random(`pd${i}`) * 6} fill="#3a1a28" />
        ))}
        {/* the niche */}
        <rect x={190} y={1330} width={700} height={170} rx={85} fill="#0d0508" />
        <rect x={290} y={1390} width={500} height={58} rx={29} fill={INK} opacity={0.9} />
        {/* two angels — only light */}
        {[300, 780].map((x, i) => {
          const p = progress(t, 0.5 + i * 0.3, 1.0);
          const b = Math.sin(t * 2 + i) * 10;
          return (
            <g key={i} opacity={p}>
              <circle cx={x} cy={1250 + b} r={150} fill={CREAM} opacity={0.08} />
              <circle cx={x} cy={1250 + b} r={80} fill={CREAM} opacity={0.14} />
              <circle cx={x} cy={1250 + b} r={34} fill="#fff6dc" opacity={0.75} />
            </g>
          );
        })}
      </svg>
      <Head top={240}>
        <Words t={t} at={0.4} size={56} text="Two angels sit him up and ask" />
        <Words t={t} at={1.0} size={80} weight={800} text="[three] questions." />
      </Head>
      {QUESTIONS.map((q, i) => {
        const at = 2.0 + i * 1.6;
        const flip = progress(t, at, 0.55, ease.settle);
        const top = 620 + i * 205;
        return (
          <div key={i} style={{ position: "absolute", left: 120, right: 120, top, height: 175, perspective: 1200 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 22, background: MAROON, border: `2px solid ${MAROON2}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, transform: `rotateX(${(1 - flip) * -90}deg)`, transformOrigin: "50% 0%", opacity: flip > 0 ? 1 : 0 }}>
              <div style={{ fontFamily: ARABIC, fontWeight: 700, fontSize: 46, color: CREAM, direction: "rtl", lineHeight: 1.3 }}>{q.ar}</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: INK }}>{q.en}</div>
            </div>
          </div>
        );
      })}
      <Source t={t} at={2.4} text="ABŪ DĀWŪD 4753 · AL-BUKHĀRĪ 1374" top={1560} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7 · du'a at the grave
// Hadith card (reference 2): Arabic + English + source.
const HadithCard: React.FC<{ t: number; at: number; lead: string; ar: string; en: string; src: string; top?: number }> = ({ t, at, lead, ar, en, src, top = 540 }) => {
  const p = progress(t, at, 0.6);
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top, opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + 0.06 * p})` }}>
      <div style={{ borderRadius: 26, background: "rgba(42,15,26,0.92)", border: `2px solid ${MAROON2}`, padding: "30px 40px 28px", boxShadow: "0 30px 60px rgba(0,0,0,0.45)", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 22, letterSpacing: "0.3em", color: CREAM, opacity: 0.8 }}>{lead}</div>
        <div style={{ marginTop: 14, fontFamily: ARABIC, fontWeight: 700, fontSize: 44, lineHeight: 1.55, color: CREAM, direction: "rtl" }}>{ar}</div>
        <div style={{ marginTop: 14 }}>
          <Words t={t} at={at + 0.5} size={44} step={0.06} text={en} />
        </div>
        <div style={{ marginTop: 18, fontFamily: MONO, fontWeight: 600, fontSize: 21, letterSpacing: "0.14em", color: "rgba(255,231,179,0.7)" }}>{src}</div>
      </div>
    </div>
  );
};

const Dua: React.FC = () => {
  const t = useT();
  const dur = S.mourn - S.dua;
  const fadeIn = interpolate(t, [0, 0.5], [0, 1], clamp);
  const camUp = 1 - progress(t, 0, 0.8, ease.settle); // arrives from below (camera rising)
  return (
    <Whip t={t} dur={dur} inAt={-1}>
      <AbsoluteFill style={{ opacity: fadeIn, transform: `translateY(${-camUp * 500}px)` }}>
        <Grid color={NIGHT} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <Stars t={t} top={60} bottom={500} seed="dua" />
          <rect x={0} y={1420} width={W} height={600} fill={PLUM} />
          <path d="M 120 1440 Q 290 1330 460 1440 Z" fill={MAROON2} />
          <rect x={140} y={1270} width={36} height={150} rx={12} fill={CREAM} opacity={0.9} />
          {[0, 1, 2, 3].map((i) => {
            const raise = progress(t, 1.2 + i * 0.15, 0.6);
            return <Figure key={i} x={560 + i * 115} y={1440} h={170} color={[BLUE, PINK, GREEN, CREAM][i]} arms={raise} />;
          })}
        </svg>
        <HadithCard
          t={t}
          at={0.6}
          top={330}
          lead="THE PROPHET ﷺ SAID"
          ar="اسْتَغْفِرُوا لِأَخِيكُمْ وَسَلُوا لَهُ التَّثْبِيتَ فَإِنَّهُ الْآنَ يُسْأَلُ"
          en="“Ask forgiveness for your brother, and ask that he be kept firm, *for he is being questioned now.”*"
          src="ABŪ DĀWŪD 3221 · SAHIH"
        />
      </AbsoluteFill>
    </Whip>
  );
};

// ---------------------------------------------------------------- 8 · mourning: 3 days
const Mourn: React.FC = () => {
  const t = useT();
  const dur = S.deeds - S.mourn;
  const lit = [on(t, 0.5), on(t, 1.1), on(t, 1.7), 0, 0, 0, 0];
  const after = progress(t, 3.6, 0.8);
  return (
    <Whip t={t} dur={dur}>
      <Grid />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* house */}
        <rect x={0} y={1400} width={W} height={600} fill={MAROON} opacity={0.4} />
        <path d="M 300 1030 L 540 860 L 780 1030 Z" fill={MAROON2} />
        <rect x={330} y={1030} width={420} height={370} fill={MAROON} />
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x={380 + i * 220} y={1080} width={100} height={110} rx={10} fill={CREAM} opacity={lerp(0.95, 0.35, after)} />
            <rect x={380 + i * 220} y={1080} width={100} height={110} rx={10} fill="none" stroke={MAROON2} strokeWidth={8} />
          </g>
        ))}
        <path d={archPath(540, 1400, 110, 160)} fill={PLUM} />
        {/* people leaving the house after day 3 */}
        {[0, 1, 2].map((i) => {
          const x = lerp(540, [180, 830, 960][i], progress(t, 3.8 + i * 0.25, 1.6, ease.drift));
          return <Figure key={i} x={x} y={1440} h={140} color={[BLUE, PINK, GREEN][i]} bob={after > 0 ? Math.abs(Math.sin(t * 6 + i)) * 5 : 0} />;
        })}
      </svg>
      <Head top={250}>
        <Words t={t} at={0.2} size={64} text="Mourning for him lasts" />
        <Words t={t} at={0.6} size={96} weight={800} text="[3 days.]" />
      </Head>
      <DayStrip t={t} lit={lit} y={640} at={0} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 30, color: "rgba(251,243,230,0.6)", opacity: progress(t, 2.2, 0.5) }}>(a widow: 4 months and 10 days)</div>
      <Head top={1515}>
        <Words t={t} at={3.6} size={46} text="Then life goes on… but *his* story doesn't." />
      </Head>
      <Source t={t} at={2.0} text="SAHIH AL-BUKHĀRĪ 1280" top={1660} />
    </Whip>
  );
};

// ---------------------------------------------------------------- 9 · deeds end, except three
const Deeds: React.FC = () => {
  const t = useT();
  const dur = S.turn - S.deeds;
  const close = progress(t, 1.3, 0.45, ease.swift);
  const lit = [1, 1, 1, on(t, 4.6), on(t, 5.0), on(t, 5.4), on(t, 5.8)];
  const items = [
    { label: "Ongoing charity", icon: "well", c: BLUE },
    { label: "Beneficial knowledge", icon: "book", c: CREAM },
    { label: "A righteous child who prays for him", icon: "child", c: GREEN },
  ];
  return (
    <Whip t={t} dur={dur}>
      <Grid />
      <DayStrip t={t} lit={lit} y={190} at={0} scale={0.82} />
      <Head top={330}>
        <Words t={t} at={0.2} size={54} text="When a person dies, his deeds end…" />
        <Words t={t} at={2.0} size={88} weight={800} text="*except* [three.]" />
      </Head>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {/* book of deeds closing */}
        <g transform="translate(540, 1100)">
          <rect x={-250} y={-20} width={500} height={40} rx={8} fill={MAROON2} opacity={0.6} />
          <path d="M 0 0 L 250 -20 L 250 -200 L 0 -180 Z" fill={INK} opacity={0.95} />
          <g transform={`scale(${Math.cos(close * Math.PI)}, 1)`}>
            <path d="M 0 0 L -250 -20 L -250 -200 L 0 -180 Z" fill={close > 0.5 ? MAROON2 : INK} />
            {close > 0.5 && <path d="M -40 -50 L -210 -62 L -210 -150 L -40 -138 Z" fill="none" stroke={CREAM} strokeWidth={4} opacity={0.6} />}
          </g>
          <path d="M 0 0 L 0 -180" stroke={MAROON2} strokeWidth={6} />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={30} y1={-150 + i * 28} x2={210} y2={-166 + i * 28} stroke={MAROON2} strokeWidth={6} opacity={0.4 * (1 - close)} />
          ))}
          <rect x={-260} y={-210} width={520} height={240} fill={CREAM} opacity={interpolate(t, [1.7, 1.75, 2.1], [0, 0.35, 0], clamp)} />
        </g>
      </svg>
      {items.map((it, i) => {
        const p = progress(t, 2.7 + i * 0.6, 0.6);
        const x = 90 + i * 310;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 1180, width: 280, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
            <div style={{ width: 150, height: 150, borderRadius: 30, background: MAROON, border: `2px solid ${MAROON2}`, boxShadow: `0 0 ${40 * p}px ${it.c}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={110} height={110} viewBox="-55 -55 110 110">
                {it.icon === "well" && (
                  <g>
                    <rect x={-34} y={0} width={68} height={40} rx={6} fill={it.c} />
                    <rect x={-40} y={-36} width={80} height={10} rx={4} fill={CREAM} />
                    <rect x={-32} y={-30} width={8} height={32} fill={CREAM} />
                    <rect x={24} y={-30} width={8} height={32} fill={CREAM} />
                    <path d="M 0 -20 Q 10 -6 0 2 Q -10 -6 0 -20 Z" fill="#dff2ff" />
                  </g>
                )}
                {it.icon === "book" && (
                  <g>
                    <path d="M 0 30 L -44 22 L -44 -30 L 0 -22 Z" fill={it.c} />
                    <path d="M 0 30 L 44 22 L 44 -30 L 0 -22 Z" fill={INK} />
                    <circle cx={0} cy={-38} r={9} fill="#fff6dc" />
                  </g>
                )}
                {it.icon === "child" && (
                  <g>
                    <rect x={-40} y={34} width={80} height={10} rx={4} fill={MAROON2} />
                    <Figure x={0} y={34} h={84} color={it.c} arms={1} />
                  </g>
                )}
              </svg>
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: INK, textAlign: "center", lineHeight: 1.15 }}>{it.label}</div>
          </div>
        );
      })}
      <Source t={t} at={3.2} text="SAHIH MUSLIM 1631" top={1500} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1580, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 28, color: "rgba(251,243,230,0.6)", opacity: progress(t, 5.2, 0.5) }}>+ charity given on his behalf reaches him · AL-BUKHĀRĪ 1388</div>
    </Whip>
  );
};

// ---------------------------------------------------------------- 10 · the turn
const Turn: React.FC = () => {
  const t = useT();
  const dur = S.cta - S.turn;
  const dawn = progress(t, 2.6, 2.4, ease.drift);
  const reset = t > 0.9;
  const lit = reset ? [0, 0, 0, 0, 0, 0, 0] : [1, 1, 1, 1, 1, 1, 1];
  const sky = `linear-gradient(180deg, ${NIGHT} 0%, ${NIGHT} ${lerp(100, 30, dawn)}%, #6b2a3c ${lerp(100, 75, dawn)}%, #e8a36f 100%)`;
  return (
    <Whip t={t} dur={dur}>
      <AbsoluteFill style={{ background: BG }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="win">
            <path d={archPath(540, 1250, 420, 560)} />
          </clipPath>
        </defs>
        <foreignObject x={0} y={0} width={W} height={H} clipPath="url(#win)">
          <div style={{ width: W, height: H, background: sky }} />
        </foreignObject>
        <g clipPath="url(#win)">
          <Stars t={t} top={700} bottom={1100} n={14} seed="turn" />
        </g>
        <path d={archPath(540, 1250, 420, 560)} fill="none" stroke={MAROON2} strokeWidth={18} />
        <rect x={0} y={1250} width={W} height={700} fill={PLUM} />
        <rect x={330} y={1395} width={420} height={26} rx={10} fill={MAROON2} />
        <rect x={350} y={1380} width={380} height={18} rx={8} fill={GREEN} opacity={0.8} />
        <Figure x={540} y={1385} h={200} color={BLUE} arms={progress(t, 3.0, 0.7)} />
        <circle cx={540} cy={1250} r={320} fill="#e8a36f" opacity={dawn * 0.08} />
      </svg>
      <DayStrip t={t} lit={lit} y={170} scale={0.82} />
      <Head top={300}>
        <Words t={t} at={0.3} size={58} text="Their first 7 days depend on what came *before* them." out={2.6} />
      </Head>
      <Head top={330}>
        <Words t={t} at={2.9} size={76} weight={800} text="[Yours] are being written *now.*" />
      </Head>
    </Whip>
  );
};

// ---------------------------------------------------------------- 11 · CTA (loops to the arch)
const Cta: React.FC = () => {
  const t = useT();
  const dur = S.end - S.cta;
  const pull = progress(t, 0, 1.0, ease.settle);
  const fadeOut = interpolate(t, [dur - 0.4, dur], [1, 0.25], clamp);
  return (
    <Whip t={t} dur={dur} out={false}>
      <Grid />
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.25, 1, pull)})`, transformOrigin: "50% 62%" }}>
          <path d={archPath(540, 1500, 560, 760)} fill={MAROON} />
          <path d={archPath(540, 1500, 470, 680)} fill={PLUM} />
          <Lantern x={540} y={1110} t={t} glow={1} />
          <rect x={0} y={1500} width={W} height={420} fill={MAROON} opacity={0.35} />
        </svg>
        <Head top={250}>
          <Words t={t} at={0.3} size={62} text="Make du'a for someone you've *lost.*" />
          <Words t={t} at={1.2} size={58} text="Comment [“Ameen”]" />
        </Head>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 26, color: "rgba(251,243,230,0.55)", opacity: progress(t, 1.8, 0.6) }}>Sources on screen · verify with a scholar</div>
      </AbsoluteFill>
    </Whip>
  );
};

export const AfterDeath: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Sequence {...sec(S.hook, S.soul)}><Opening /></Sequence>
      <Sequence {...sec(S.soul, S.funeral)}><Soul /></Sequence>
      <Sequence {...sec(S.funeral, S.steps)}><Funeral /></Sequence>
      <Sequence {...sec(S.steps, S.grave)}><Steps /></Sequence>
      <Sequence {...sec(S.grave, S.dua)}><Grave /></Sequence>
      <Sequence {...sec(S.dua, S.mourn)}><Dua /></Sequence>
      <Sequence {...sec(S.mourn, S.deeds)}><Mourn /></Sequence>
      <Sequence {...sec(S.deeds, S.turn)}><Deeds /></Sequence>
      <Sequence {...sec(S.turn, S.cta)}><Turn /></Sequence>
      <Sequence {...sec(S.cta, S.end)}><Cta /></Sequence>
      <Vignette />
      <Grain />
      <Audio src={staticFile("after-death-sfx.wav")} />
    </AbsoluteFill>
  );
};
