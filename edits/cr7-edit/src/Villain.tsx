import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";
import "@fontsource/oswald/700.css";
import { Clip, EditProps, Grain, Layered, Particles, Vignette, clamp, easeOut, s } from "./CR7Edit";

// "Villain of Football" — a beat-synced TikTok layout. The music starts
// 5.5s in so its first big hit lands at 0.75s; every cut below sits on a
// detected hit (~103 BPM, strong accents every ~1.57s).
const MUSIC_OFFSET = 5.5;
export const VILLAIN_FRAMES = s(17);
const HITS = [0.75, 1.47, 2.98, 3.56, 4.35, 5.9, 7.48, 9.04, 10.61, 12.19, 12.58, 12.97, 13.36, 13.75, 15.33];

const RED = "#ff1f3d";
const GOLD = "#f2c14e";
const DISPLAY = "Oswald, sans-serif";

// TikTok safe zone: UI covers ~200px top, ~380px bottom, ~140px right.
const SAFE = { top: 220, bottom: 1540, left: 70, right: 940 };

// ---------- hit-driven camera ----------

const lastHit = (t: number) => {
  let h = -1;
  for (const x of HITS) if (x <= t) h = x;
  return h;
};

const useHit = () => {
  const frame = useCurrentFrame();
  const h = lastHit(frame / 30);
  const dt = h < 0 ? 99 : frame - s(h);
  const decay = Math.exp(-dt / 4);
  return {
    dt,
    shakeX: dt < 8 ? (random(`sx${frame}`) - 0.5) * 36 * decay : 0,
    shakeY: dt < 8 ? (random(`sy${frame}`) - 0.5) * 24 * decay : 0,
    punch: 1 + 0.09 * decay,
    flash: dt < 4 ? [0.75, 0.4, 0.15, 0.05][dt] : 0,
  };
};

// ---------- motion graphics ----------

// Word slams in from huge and blurred, with an RGB split that settles.
const Slam: React.FC<{
  text: string;
  at: number;
  size: number;
  color?: string;
  top: number;
  outAt?: number;
  glow?: string;
  stroke?: string;
}> = ({ text, at, size, color = "#fff", top, outAt, glow = "rgba(255,255,255,0.35)", stroke }) => {
  const f = useCurrentFrame() - s(at);
  if (f < 0) return null;
  const p = interpolate(f, [0, 6], [0, 1], { ...clamp, easing: easeOut });
  const split = interpolate(f, [0, 12], [16, 1.5], clamp);
  const jitter = f % 9 === 0 ? 6 : 0;
  const out = outAt === undefined ? 1 : interpolate(f, [s(outAt - at) - 3, s(outAt - at)], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: SAFE.left,
        width: SAFE.right - SAFE.left,
        textAlign: "center",
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        color,
        opacity: p * out,
        filter: `blur(${(1 - p) * 10}px)`,
        transform: `scale(${2.4 - 1.4 * p}) translateX(${jitter}px)`,
        ...(stroke
          ? { color: "transparent", WebkitTextStroke: `4px ${stroke}` }
          : { textShadow: `${split}px 0 rgba(255,0,60,0.85), ${-split}px 0 rgba(0,235,255,0.75), 0 0 40px ${glow}` }),
      }}
    >
      {text}
    </div>
  );
};

// Number that rolls up to its target with a slam at the end.
const Counter: React.FC<{ to: number; at: number; dur: number; suffix: string; label: string; top: number; color: string }> = ({
  to,
  at,
  dur,
  suffix,
  label,
  top,
  color,
}) => {
  const f = useCurrentFrame() - s(at);
  if (f < 0) return null;
  const p = interpolate(f, [0, s(dur)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const value = Math.round(to * p);
  const landed = f >= s(dur);
  const pop = landed ? 1 + 0.12 * Math.exp(-(f - s(dur)) / 3) : 1;
  return (
    <div style={{ position: "absolute", top, left: SAFE.left, width: SAFE.right - SAFE.left, textAlign: "center" }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 260,
          lineHeight: 0.9,
          color,
          fontVariantNumeric: "tabular-nums",
          transform: `scale(${pop})`,
          textShadow: `0 0 50px ${color}88, 4px 0 rgba(255,0,60,0.6), -4px 0 rgba(0,235,255,0.5)`,
        }}
      >
        {value}
        {suffix}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 76,
          letterSpacing: "0.18em",
          color: "#fff",
          opacity: interpolate(f, [4, 12], [0, 1], clamp),
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Radial speed lines that flicker every couple of frames.
const SpeedLines: React.FC<{ opacity?: number; color?: string }> = ({ opacity = 0.35, color = "#fff" }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{ opacity }}>
      <svg width="1080" height="1920" viewBox="-540 -960 1080 1920">
        {new Array(60).fill(0).map((_, i) => {
          const a = (i / 60) * Math.PI * 2 + random(`a${seed}-${i}`) * 0.08;
          const r0 = 420 + random(`r${seed}-${i}`) * 260;
          const r1 = 1300;
          const w = 2 + random(`w${seed}-${i}`) * 7;
          return (
            <line
              key={i}
              x1={Math.cos(a) * r0}
              y1={Math.sin(a) * r0}
              x2={Math.cos(a) * r1}
              y2={Math.sin(a) * r1}
              stroke={color}
              strokeWidth={w}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Shockwave rings expanding from a point.
const Rings: React.FC<{ cx: number; cy: number; color: string; count?: number }> = ({ cx, cy, color, count = 3 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {new Array(count).fill(0).map((_, i) => {
        const f = frame - i * 7;
        if (f < 0) return null;
        const r = 80 + f * 28;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `${Math.max(2, 14 - f * 0.4)}px solid ${color}`,
              opacity: interpolate(f, [0, 30], [0.9, 0], clamp),
              boxShadow: `0 0 30px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Rows of outlined text scrolling in alternating directions.
const Marquee: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", gap: 0, transform: "rotate(-8deg) scale(1.3)" }}>
      {new Array(7).fill(0).map((_, row) => (
        <div
          key={row}
          style={{
            whiteSpace: "nowrap",
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 230,
            lineHeight: 1.05,
            color: row % 3 === 1 ? color : "transparent",
            WebkitTextStroke: `3px ${color}`,
            opacity: row % 3 === 1 ? 0.9 : 0.5,
            transform: `translateX(${(row % 2 ? -1 : 1) * frame * 14 - 800}px)`,
          }}
        >
          {`${text} `.repeat(6)}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// Red duotone wash; put it in a Layered `behind` slot so only the
// background turns red and the cut-out player pops against it.
const RedWash: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <AbsoluteFill style={{ background: RED, mixBlendMode: "multiply", opacity: strength }} />
);

const ScanLines: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)",
      mixBlendMode: "multiply",
    }}
  />
);

// Persistent top caption, the "static text overlay" the viral template uses.
const TopCaption: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      top: SAFE.top,
      width: "100%",
      textAlign: "center",
      fontFamily: "Inter, sans-serif",
      fontWeight: 800,
      fontSize: 50,
      color: "#fff",
      textShadow: "0 3px 12px rgba(0,0,0,0.95)",
    }}
  >
    {text}
  </div>
);

// ---------- shots ----------

type ShotProps = { clips: Clip[] };
const GRADE_BW = "grayscale(1) contrast(1.35) brightness(0.62)";
const GRADE_SUBJECT = "grayscale(0.55) contrast(1.3) brightness(0.85)";

// 0–4.35 Hook: black-and-white, slow push, "THEY CALLED HIM ... THE VILLAIN".
const Hook: React.FC<ShotProps> = ({ clips }) => {
  const frame = useCurrentFrame();
  const flicker = frame >= s(3.56) && random(`vf${Math.floor(frame / 2)}`) > 0.82 ? 0.3 : 1;
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [0, 8], [0, 1], clamp) }}>
      <Layered
        clip={clips[1]}
        index={1}
        dur={s(4.35)}
        zoom={[1.18, 1.05]}
        grade={GRADE_BW}
        bgDim={0.7}
        rim="rgba(255,30,60,0.55)"
        behind={
          <>
            <AbsoluteFill style={{ opacity: flicker }}>
              <Slam text="VILLAIN" at={3.56} size={300} color={RED} top={440} glow="rgba(255,20,50,0.8)" />
            </AbsoluteFill>
          </>
        }
        front={
          <>
            <Slam text="They called him" at={0.75} size={96} top={300} outAt={2.9} />
            <Slam text="the" at={2.98} size={90} top={330} />
            <Slam text="VILLAIN" at={3.56} size={300} top={440} stroke={RED} />
            <Particles seed="hookember" count={26} color={RED} size={[3, 9]} speed={1.4} opacity={0.7} />
          </>
        }
      />
      <ScanLines />
    </AbsoluteFill>
  );
};

// One-word beat shot: background turns red, player stays monochrome.
const WordShot: React.FC<ShotProps & { idx: number; word: string; color?: string; lines?: boolean; focusY?: number }> = ({
  clips,
  idx,
  word,
  color = "#fff",
  lines,
}) => (
  <AbsoluteFill>
    <Layered
      clip={clips[idx]}
      index={idx}
      dur={s(1.6)}
      zoom={[1.12, 1.02]}
      grade={GRADE_SUBJECT}
      bgDim={0.8}
      rim="rgba(255,40,70,0.6)"
      behind={
        <>
          <RedWash />
          {lines && <SpeedLines opacity={0.25} />}
          <Slam text={word} at={0} size={290} color={color} top={560} glow="rgba(255,30,60,0.6)" />
        </>
      }
      front={<Slam text={word} at={0} size={290} top={560} stroke={color} />}
    />
  </AbsoluteFill>
);

const StatShot: React.FC<ShotProps & { idx: number; to: number; suffix: string; label: string; color: string; ringY: number }> = ({
  clips,
  idx,
  to,
  suffix,
  label,
  color,
  ringY,
}) => (
  <AbsoluteFill>
    <Layered
      clip={clips[idx]}
      index={idx}
      dur={s(1.6)}
      zoom={[1.1, 1.0]}
      grade={GRADE_SUBJECT}
      bgDim={0.7}
      rim={`${color}aa`}
      behind={
        <>
          <RedWash strength={0.6} />
          <Rings cx={540} cy={ringY} color={color} />
          <SpeedLines opacity={0.18} />
        </>
      }
      front={<Counter to={to} at={0.05} dur={0.9} suffix={suffix} label={label} top={1150} color={color} />}
    />
  </AbsoluteFill>
);

// 12.19–13.75 Rapid montage: cut-outs over a scrolling CR7 marquee, one per half-beat.
const Montage: React.FC<ShotProps> = ({ clips }) => {
  const frame = useCurrentFrame();
  const order = [3, 2, 0, 5];
  const step = s(0.39);
  const i = Math.min(order.length - 1, Math.floor(frame / step));
  const clip = clips[order[i]];
  const local = frame - i * step;
  return (
    <AbsoluteFill style={{ background: "#0a0000" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, ${RED} 0%, #5a0010 45%, #0a0000 80%)` }} />
      <Marquee text="CR7 • GOAT •" color="#ffffff" />
      {clip?.cut && (
        <AbsoluteFill style={{ transform: `scale(${1.08 - local * 0.006})` }}>
          <Img
            src={staticFile(clip.cut)}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: clip.focus ?? "50% 50%",
              filter: "grayscale(0.4) contrast(1.3) drop-shadow(0 0 24px rgba(0,0,0,0.9))",
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// 13.75–17 Outro: "VILLAIN?" → "OR GOAT?" plus a comment prompt, fading
// to black so the loop back into the hook is seamless.
const Outro: React.FC<ShotProps> = ({ clips }) => {
  const frame = useCurrentFrame();
  const clip = clips[4];
  const cta = interpolate(frame, [s(2.0), s(2.3)], [0, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [s(2.8), s(3.25)], [1, 0], clamp) }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 60%, #3a0008 0%, #000 70%)" }} />
      <Rings cx={540} cy={900} color={RED} count={2} />
      <Slam text="Villain?" at={0} size={210} color="#fff" top={330} />
      <AbsoluteFill style={{ transform: `scale(${interpolate(frame, [0, s(3.25)], [1.02, 1.12])})` }}>
        {clip?.cut && (
          <Img
            src={staticFile(clip.cut)}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: clip.focus ?? "50% 50%",
              filter: "grayscale(0.5) contrast(1.3) brightness(0.9) drop-shadow(0 0 20px rgba(255,30,60,0.55))",
            }}
          />
        )}
      </AbsoluteFill>
      <Slam text="Villain?" at={0} size={210} top={330} stroke="#fff" />
      <Slam text="or GOAT?" at={1.58} size={170} color={GOLD} top={1170} glow="rgba(242,193,78,0.7)" />
      <div
        style={{
          position: "absolute",
          top: 1400,
          left: "50%",
          transform: `translateX(-50%) scale(${0.8 + cta * 0.2})`,
          opacity: cta,
          padding: "18px 40px",
          borderRadius: 60,
          background: "rgba(0,0,0,0.65)",
          border: "2px solid rgba(255,255,255,0.4)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 44,
          color: "#fff",
          whiteSpace: "nowrap",
        }}
      >
        comment below 👇
      </div>
      <Particles seed="outro" count={30} color={RED} size={[3, 9]} speed={1.5} opacity={0.6} />
    </AbsoluteFill>
  );
};

// ---------- timeline ----------

const SHOTS: { from: number; to: number; render: (c: Clip[]) => React.ReactNode }[] = [
  { from: 0, to: 4.35, render: (c) => <Hook clips={c} /> },
  { from: 4.35, to: 5.9, render: (c) => <WordShot clips={c} idx={4} word="Hated." /> },
  { from: 5.9, to: 7.48, render: (c) => <WordShot clips={c} idx={3} word="Feared." color={RED} lines /> },
  {
    from: 7.48,
    to: 9.04,
    render: (c) => <StatShot clips={c} idx={0} to={5} suffix="×" label="BALLON D'OR" color={GOLD} ringY={560} />,
  },
  {
    from: 9.04,
    to: 10.61,
    render: (c) => <StatShot clips={c} idx={2} to={900} suffix="+" label="CAREER GOALS" color="#ffffff" ringY={700} />,
  },
  { from: 10.61, to: 12.19, render: (c) => <WordShot clips={c} idx={5} word="Still here." /> },
  { from: 12.19, to: 13.75, render: (c) => <Montage clips={c} /> },
  { from: 13.75, to: 17, render: (c) => <Outro clips={c} /> },
];

export const Villain: React.FC<EditProps> = ({ clips, music }) => {
  const frame = useCurrentFrame();
  const hit = useHit();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `translate(${hit.shakeX}px, ${hit.shakeY}px) scale(${hit.punch})` }}>
        {SHOTS.map((shot, i) => (
          <Sequence key={i} from={s(shot.from)} durationInFrames={s(shot.to) - s(shot.from)}>
            {shot.render(clips)}
          </Sequence>
        ))}
      </AbsoluteFill>
      <Vignette strength={0.7} />
      <AbsoluteFill style={{ background: "#fff", opacity: hit.flash, mixBlendMode: "screen" }} />
      {t >= 4.35 && t < 13.75 && <TopCaption text="the villain of football 😈" />}
      <Grain />
      {music && (
        <Audio
          src={staticFile(music)}
          trimBefore={s(MUSIC_OFFSET)}
          volume={(f) => interpolate(f, [0, 4, VILLAIN_FRAMES - 30, VILLAIN_FRAMES], [0, 1, 1, 0], clamp)}
        />
      )}
    </AbsoluteFill>
  );
};
