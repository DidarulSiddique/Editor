import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/inter/600.css";

// v2 — velocity edit with editorial typography. Footage is time-remapped
// (speed ramps) via <Freeze>, photos get 2.5D parallax with type between the
// depth layers, and every hit gets punch + shake + RGB split.
export const FPS = 60;
export const FRAMES = 11 * FPS;
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);

const SERIF = "'Instrument Serif', serif";
const DISPLAY = "'Bebas Neue', sans-serif";
const LABEL = "Inter, sans-serif";
const GOLD = "#f4c542";
const SKY = "#8fd0f5";

const T = { s2: 1.5, s3: 2.3, s4: 3.3, s5: 4.25, s5b: 4.92, s5c: 5.7, s6: 6.08, s7: 7.08, s8: 8.04, s9: 9.04, s10: 10.04, end: 11.0 };
const CUTS = [T.s2, T.s3, T.s4, T.s5, T.s5b, T.s5c, T.s6, T.s7, T.s8, T.s9, T.s10];
// Strong onsets of the track (tools/edit-kit/beats.py).
const HITS = [0.26, 2.16, 4.06, 5.94, 7.85, 9.75];

// ---------------------------------------------------------------- footage

type Key = [number, number]; // [source seconds, Messi x as a fraction of 16:9]
type Rate = [number, number]; // [local seconds, playback rate from here on]

const sourceTime = (frame: number, start: number, rates: Rate[]) => {
  let t = start;
  for (let i = 0; i < frame; i++) {
    const lt = i / FPS;
    let r = rates[0][1];
    for (const [at, rate] of rates) if (lt >= at) r = rate;
    t += r / FPS;
  }
  return t;
};

const track = (keys: Key[], t: number) =>
  interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), { ...clamp, easing: Easing.inOut(Easing.quad) });

const frameFor = (x: number, zoom: number, yFocus: number) => {
  const k = (1920 / 1080) * zoom;
  const W = 1920 * k;
  const H = 1080 * k;
  const left = Math.min(0, Math.max(1080 - W, 540 - x * W));
  const top = Math.min(0, Math.max(1920 - H, 960 - yFocus * H));
  return { W, H, left, top, messiX: left + x * W };
};

const FOOTAGE_FILTER = "url(#sharpen) contrast(1.14) saturate(1.12) brightness(1.12)";

// Speed-ramped, Messi-tracked vertical crop of a 16:9 clip.
const Ramp: React.FC<{
  src: string;
  start: number;
  rates: Rate[];
  keys: Key[];
  zoom?: number;
  yFocus?: number;
  bright?: number;
  children?: (mx: number) => React.ReactNode;
}> = ({ src, start, rates, keys, zoom = 1.1, yFocus = 0.5, bright = 1, children }) => {
  const f = useCurrentFrame();
  const st = sourceTime(f, start, rates);
  const { W, H, left, top, messiX } = frameFor(track(keys, st), zoom, yFocus);
  const whip = interpolate(f, [0, 6], [1, 0], { ...clamp, easing: out });
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + whip * 0.18})`, filter: whip > 0.05 ? `blur(${whip * 8}px)` : undefined }}>
        <Freeze frame={Math.round(st * FPS)}>
          <OffthreadVideo src={staticFile(src)} muted style={{ position: "absolute", left, top, width: W, height: H, filter: `${FOOTAGE_FILTER} brightness(${bright})` }} />
        </Freeze>
        <Grade />
      </AbsoluteFill>
      {children?.(messiX)}
    </AbsoluteFill>
  );
};

// Teal shadows, warm highlights, crushed corners.
const Grade: React.FC<{ warm?: boolean }> = ({ warm }) => (
  <>
    <AbsoluteFill
      style={{
        background: warm ? "linear-gradient(180deg, #2a5f8f, #e0a040)" : "linear-gradient(180deg, #123a63, #b4542a)",
        mixBlendMode: "soft-light",
        opacity: 0.28,
      }}
    />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 46%, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
  </>
);

// ---------------------------------------------------------------- photos

// 2.5D parallax: blurred background plate, type between, cut-out in front.
const Depth: React.FC<{
  src: string;
  cut: string;
  focus: string;
  dur: number;
  push?: [number, number];
  behind?: React.ReactNode;
  front?: React.ReactNode;
  warm?: boolean;
}> = ({ src, cut, focus, dur, push = [1.0, 1.1], behind, front, warm }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const enter = interpolate(f, [0, 8], [1, 0], { ...clamp, easing: out });
  const img: React.CSSProperties = { position: "absolute", width: 1080, height: 1920, objectFit: "cover", objectPosition: focus };
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1.08 + p * 0.04 + enter * 0.1})` }}>
        <Img src={staticFile(src)} style={{ ...img, filter: "blur(3px) brightness(0.62) saturate(1.15) contrast(1.1)" }} />
        <Grade warm={warm} />
      </AbsoluteFill>
      {behind}
      <AbsoluteFill style={{ transform: `scale(${push[0] + (push[1] - push[0]) * p + enter * 0.2}) translateY(${(1 - p) * 20}px)`, transformOrigin: "50% 62%" }}>
        <Img
          src={staticFile(cut)}
          style={{ ...img, filter: "contrast(1.08) saturate(1.1) drop-shadow(0 0 22px rgba(255,255,255,0.28)) drop-shadow(0 30px 40px rgba(0,0,0,0.55))" }}
        />
      </AbsoluteFill>
      {front}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- type

// Lyric line: italic serif, words rise out of blur on their sung times.
const Lyric: React.FC<{ words: [string, number][]; y: number; size?: number; until?: number; color?: string }> = ({
  words,
  y,
  size = 104,
  until,
  color = "#fff",
}) => {
  const f = useCurrentFrame();
  const fade = until === undefined ? 1 : interpolate(f, [s(until) - 6, s(until)], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: SERIF,
        fontStyle: "italic",
        fontSize: size,
        lineHeight: 1.05,
        color,
        opacity: fade,
        textShadow: "0 0 28px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.6)",
      }}
    >
      {words.map(([w, at], i) => {
        const p = interpolate(f - s(at), [0, 10], [0, 1], { ...clamp, easing: out });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.22em",
              opacity: p,
              transform: `translateY(${(1 - p) * 22}px)`,
              filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// Ultra-condensed display word; slams in, then drifts.
const Display: React.FC<{
  text: string;
  at?: number;
  y: number;
  size: number;
  color?: string;
  outline?: boolean;
  track?: number;
  dur?: number;
}> = ({ text, at = 0, y, size, color = "#fff", outline, track = 0.01, dur = 1 }) => {
  const f = useCurrentFrame() - s(at);
  if (f < 0) return null;
  const p = interpolate(f, [0, 7], [0, 1], { ...clamp, easing: out });
  const drift = interpolate(f, [0, s(dur)], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: -200,
        right: -200,
        textAlign: "center",
        fontFamily: DISPLAY,
        fontSize: size,
        lineHeight: 0.85,
        letterSpacing: `${track + (1 - p) * 0.12}em`,
        color: outline ? "transparent" : color,
        WebkitTextStroke: outline ? `3px ${color}` : undefined,
        opacity: p,
        transform: `scale(${(1.25 - 0.25 * p) * (1 + drift * 0.05)})`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Tiny tracked caps with hairlines either side.
const Label: React.FC<{ text: string; y: number; opacity?: number }> = ({ text, y, opacity = 0.85 }) => (
  <div style={{ position: "absolute", top: y, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 22, opacity }}>
    <div style={{ width: 70, height: 2, background: "rgba(255,255,255,0.7)" }} />
    <div style={{ fontFamily: LABEL, fontWeight: 600, fontSize: 25, letterSpacing: "0.42em", color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>{text}</div>
    <div style={{ width: 70, height: 2, background: "rgba(255,255,255,0.7)" }} />
  </div>
);

const Letterbox: React.FC<{ on: number }> = ({ on }) => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 250 * on, background: "#000" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 250 * on, background: "#000" }} />
  </>
);

const LightLeak: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, dur], [-30, 130]);
  const o = interpolate(f, [0, 6, dur - 10, dur], [0, 0.85, 0.5, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        opacity: o,
        background: `radial-gradient(ellipse 45% 70% at ${x}% 30%, rgba(255,170,60,0.85), rgba(255,90,30,0.35) 45%, transparent 75%)`,
      }}
    />
  );
};

const Confetti: React.FC<{ colors: string[]; seed: string; count?: number }> = ({ colors, seed, count = 46 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}${i}${k}`);
        const depth = r("d");
        const y = -80 + ((r("y") * 2000 + f * (4 + depth * 9)) % 2080);
        const x = r("x") * 1080 + Math.sin(f / 20 + r("p") * 6) * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 10 + depth * 18,
              height: 6 + depth * 10,
              background: colors[Math.floor(r("c") * colors.length)],
              opacity: 0.55 + depth * 0.45,
              filter: depth < 0.3 ? "blur(2px)" : undefined,
              transform: `rotate(${f * (3 + r("r") * 8) + r("a") * 360}deg) scaleY(${Math.cos(f / 7 + r("s") * 6)})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Chapter label shows only where no big display word owns the top.
const showLabel = (t: number) =>
  (t < T.s2) || (t >= T.s3 && t < T.s5c) || (t >= T.s7 && t < T.s8);

// Persistent HUD: chapter label up top, number and timecode at the bottom.
const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const arg = t >= T.s6;
  return (
    <AbsoluteFill style={{ fontFamily: LABEL, fontWeight: 600, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
      {showLabel(t) && <Label text={arg ? "ARGENTINA · 2021 — 2024" : "FC BARCELONA · 2004 — 2021"} y={262} opacity={0.8} />}
      <div style={{ position: "absolute", left: 70, top: 1520, fontSize: 24, letterSpacing: "0.3em", opacity: 0.75 }}>N°10</div>
      <div style={{ position: "absolute", right: 150, top: 1520, fontSize: 24, letterSpacing: "0.3em", opacity: 0.75 }}>
        {String(Math.floor(t)).padStart(2, "0")}:{String(f % FPS).padStart(2, "0")}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scenes

const N5: Key[] = [[2.4, 0.6], [2.8, 0.62], [3.2, 0.66], [3.6, 0.7], [3.8, 0.74], [4.0, 0.68], [4.3, 0.62]];
const N3A: Key[] = [[3.2, 0.41], [3.4, 0.42], [3.6, 0.42], [3.8, 0.5], [4.0, 0.56]];
const N3B: Key[] = [[6.0, 0.53], [6.1, 0.41], [6.2, 0.33], [6.3, 0.27], [6.4, 0.27], [6.5, 0.35], [6.6, 0.4], [6.7, 0.47], [6.8, 0.52], [6.9, 0.57], [7.0, 0.56], [7.1, 0.56]];

// 0–1.5 Hook: slow-motion sprint in letterbox, then the ramp snaps fast.
const S1 = () => {
  const f = useCurrentFrame();
  const bars = interpolate(f, [s(1.18), s(1.38)], [1, 0], { ...clamp, easing: out });
  return (
    <Ramp src="n5.mp4" start={2.42} rates={[[0, 0.45], [0.95, 2.2]]} keys={N5} zoom={1.05} bright={1.3}>
      {() => (
        <>
          <Letterbox on={bars} />
          <Lyric words={[["he", 0.15], ["left", 0.27], ["barcelona", 0.42], ["in", 0.72], ["2021.", 0.82]]} y={1230} size={88} until={1.32} />
        </>
      )}
    </Ramp>
  );
};

// 1.5–2.3 "the distance": back to camera at Camp Nou, word between layers.
const S2 = () => (
  <Depth
    src="d923c80d.png"
    cut="d923c80d-cut.png"
    focus="50% 30%"
    dur={s(0.8)}
    push={[1.0, 1.08]}
    behind={<Display text="DISTANCE" y={470} size={330} color="#fff" dur={0.8} />}
    front={
      <>
        <Display text="DISTANCE" y={470} size={330} color="#fff" outline dur={0.8} />
        <Lyric words={[["the", 0.02]]} y={330} size={120} />
      </>
    }
  />
);

// 2.3–3.3 "and the time": three stacked panels slide in on the beat.
const Panel: React.FC<{ i: number; src: string; start: number; rate: number; x: number; from: number }> = ({ i, src, start, rate, x, from }) => {
  const f = useCurrentFrame();
  const enter = interpolate(f - s(i * 0.12), [0, 9], [1, 0], { ...clamp, easing: out });
  const st = start + Math.max(0, f) * (rate / FPS);
  const top = 70 + i * 600;
  return (
    <div style={{ position: "absolute", left: 0, top, width: 1080, height: 570, overflow: "hidden", transform: `translateX(${enter * from * 1100}px)`, borderTop: "2px solid rgba(255,255,255,0.15)" }}>
      <Freeze frame={Math.round(st * FPS)}>
        <OffthreadVideo
          src={staticFile(src)}
          muted
          style={{ position: "absolute", left: Math.min(0, Math.max(1080 - 1300, 540 - x * 1300)), top: -80, width: 1300, height: 731, filter: FOOTAGE_FILTER }}
        />
      </Freeze>
      <Grade />
    </div>
  );
};
const S3 = () => (
  <AbsoluteFill style={{ background: "#050505" }}>
    <Panel i={0} src="n3.mp4" start={6.0} rate={1.5} x={0.42} from={-1} />
    <Panel i={1} src="n4.mp4" start={0.3} rate={1.2} x={0.43} from={1} />
    <Panel i={2} src="n5.mp4" start={3.0} rate={1.3} x={0.66} from={-1} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.55) 50%, transparent 62%)" }} />
    <Lyric words={[["and", 0.02], ["the", 0.14], ["time", 0.27]]} y={880} size={130} />
  </AbsoluteFill>
);

// 3.3–4.25 "between us": the MESSI shirt, slow motion, letterbox.
const S4 = () => (
  <Ramp src="n2.mp4" start={9.0} rates={[[0, 0.45]]} keys={[[9.0, 0.77], [9.45, 0.8]]} zoom={1.5} yFocus={0.55}>
    {() => (
      <>
        <Letterbox on={1} />
        <Lyric words={[["between", 0.22], ["us", 0.6]]} y={1300} size={120} />
      </>
    )}
  </Ramp>
);

// 4.25–4.92 dribble against Madrid.
const S5a = () => <Ramp src="n4.mp4" start={0.3} rates={[[0, 1.0]]} keys={[[0.3, 0.43], [1.0, 0.43]]} zoom={1.3} yFocus={0.32} />;

// 4.92–5.70 close dribble into the freeze.
const S5b = () => (
  <Ramp src="n3.mp4" start={3.22} rates={[[0, 1.0]]} keys={N3A} zoom={1.1} yFocus={0.42}>
    {() => <Lyric words={[["it'll", 0.05], ["never", 0.42]]} y={1330} size={110} />}
  </Ramp>
);

// 5.70–6.08 freeze: pitch drops away, Messi lifts off under NEVER.
const S5c = () => {
  const f = useCurrentFrame();
  const k = interpolate(f, [0, 9], [0, 1], { ...clamp, easing: out });
  const fr = frameFor(0.56, 1.1, 0.42);
  const box: React.CSSProperties = { position: "absolute", left: fr.left, top: fr.top, width: fr.W, height: fr.H };
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Img src={staticFile("freeze-4.0.png")} style={{ ...box, filter: `grayscale(${k}) brightness(${1 - 0.6 * k}) blur(${k * 10}px)` }} />
      <AbsoluteFill style={{ background: "#0d2a5c", mixBlendMode: "color", opacity: k * 0.7 }} />
      <Display text="NEVER" y={170} size={420} color="#fff" />
      <AbsoluteFill style={{ transform: `scale(${1 + k * 0.12})`, transformOrigin: "540px 1150px" }}>
        <Img
          src={staticFile("freeze-4.0-cut.png")}
          style={{
            ...box,
            filter: `url(#sharpen) drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 0 ${30 * k}px rgba(143,208,245,0.8))`,
          }}
        />
      </AbsoluteFill>
      <Display text="NEVER" y={170} size={420} color="#fff" outline />
    </AbsoluteFill>
  );
};

// 6.08–7.08 "change my mind": the turn to Argentina; flicker cuts on the
// sung words.
const S6 = () => {
  const f = useCurrentFrame();
  const flick = (at: number) => f >= s(at) && f < s(at) + 4;
  return (
    <AbsoluteFill>
      <Depth
        src="1fa6cf3b.png"
        cut="1fa6cf3b-cut.png"
        focus="50% 25%"
        dur={s(1.0)}
        push={[1.0, 1.1]}
        warm
        behind={<Display text="CHANGE" y={250} size={300} color={GOLD} dur={1} />}
        front={
          <>
            <Display text="CHANGE" y={250} size={300} color={GOLD} outline dur={1} />
            <LightLeak dur={s(1.0)} />
            <Lyric words={[["my", 0.5], ["mind", 0.66]]} y={1340} size={140} />
          </>
        }
      />
      {flick(0.5) && <Img src={staticFile("12fbf6b3.png")} style={{ position: "absolute", width: 1080, height: 1920, objectFit: "cover", objectPosition: "50% 25%" }} />}
      {flick(0.66) && <Img src={staticFile("17d36584.png")} style={{ position: "absolute", width: 1080, height: 1920, objectFit: "cover", objectPosition: "50% 25%" }} />}
    </AbsoluteFill>
  );
};

// 7.08–8.04 "'cause": face in hands, then hands on head. Slow motion.
const S7 = () => (
  <Ramp src="n1.mp4" start={5.98} rates={[[0, 0.6]]} keys={[[6.0, 0.4], [6.1, 0.37], [6.3, 0.38], [6.6, 0.4]]} zoom={1.15} yFocus={0.42}>
    {() => (
      <>
        <Letterbox on={1} />
        <Lyric words={[["'cause", 0.12]]} y={1300} size={130} />
      </>
    )}
  </Ramp>
);

// 8.04–9.04 "baby": fast in, then slow through the gap.
const S8 = () => (
  <Ramp src="n3.mp4" start={6.0} rates={[[0, 1.6], [0.5, 0.5]]} keys={N3B} zoom={1.12} yFocus={0.45}>
    {() => (
      <>
        <Display text="BABY" y={330} size={300} color="#fff" outline dur={1} />
        <Lyric words={[["baby", 0.04]]} y={1330} size={150} />
      </>
    )}
  </Ramp>
);

// 9.04–10.04 "i would die for you": on the crowd's shoulders.
const S9 = () => (
  <Depth
    src="17d36584.png"
    cut="17d36584-cut.png"
    focus="50% 30%"
    dur={s(1.0)}
    push={[1.0, 1.1]}
    warm
    behind={<Display text="10" y={200} size={760} color={SKY} outline dur={1} />}
    front={
      <>
        <Confetti colors={[GOLD, "#fff", SKY]} seed="c9" />
        <Lyric words={[["i", 0.0], ["would", 0.07], ["die", 0.16], ["for", 0.41], ["you", 0.61]]} y={1330} size={120} />
      </>
    }
  />
);

// 10.04–11.0 Copa América kiss, LEO between the layers, fade out.
const S10 = () => {
  const f = useCurrentFrame();
  const dur = s(T.end - T.s10);
  const fade = interpolate(f, [dur - s(0.35), dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <Depth
        src="12fbf6b3.png"
        cut="12fbf6b3-cut.png"
        focus="50% 30%"
        dur={dur}
        push={[1.02, 1.1]}
        warm
        front={
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 85%)" }} />
            <Display text="LEO" at={0.05} y={1080} size={400} color={GOLD} dur={1} />
            <Label text="LIONEL ANDRÉS MESSI" y={1440} />
          </>
        }
      />
    </AbsoluteFill>
  );
};

const SCENES: [number, number, React.FC][] = [
  [0, T.s2, S1],
  [T.s2, T.s3, S2],
  [T.s3, T.s4, S3],
  [T.s4, T.s5, S4],
  [T.s5, T.s5b, S5a],
  [T.s5b, T.s5c, S5b],
  [T.s5c, T.s6, S5c],
  [T.s6, T.s7, S6],
  [T.s7, T.s8, S7],
  [T.s8, T.s9, S8],
  [T.s9, T.s10, S9],
  [T.s10, T.end, S10],
];

// ---------------------------------------------------------------- master

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.08, mixBlendMode: "overlay" }}>
      <svg width="1080" height="1920">
        <filter id="grainv2">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={2} seed={Math.floor(f / 2) % 10} />
        </filter>
        <rect width="1080" height="1920" filter="url(#grainv2)" />
      </svg>
    </AbsoluteFill>
  );
};

// Sharpen and RGB-split filters, referenced by CSS `url(#id)`.
const Filters: React.FC = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="sharpen">
        <feConvolveMatrix order="3" kernelMatrix="0 -0.55 0 -0.55 3.2 -0.55 0 -0.55 0" preserveAlpha="true" />
      </filter>
      {[14, 7].map((d) => (
        <filter id={`rgb${d}`} key={d} colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={d} result="ro" />
          <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-d} result="bo" />
          <feBlend in="ro" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="bo" mode="screen" />
        </filter>
      ))}
    </defs>
  </svg>
);

export const MessiV2: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const last = (list: number[]) => list.reduce((a, c) => (c <= t ? c : a), -9);
  const sinceCut = f - s(last(CUTS));
  const sinceHit = f - s(last(HITS));
  const near = Math.min(sinceCut, sinceHit);
  const decay = Math.exp(-near / 5);
  const shake = near < 8 ? (random(`sh${f}`) - 0.5) * 26 * decay : 0;
  const shakeY = near < 8 ? (random(`sv${f}`) - 0.5) * 18 * decay : 0;
  const punch = 1 + 0.06 * decay;
  const rgb = near < 2 ? "url(#rgb14)" : near < 5 ? "url(#rgb7)" : undefined;
  const flash = sinceCut >= 0 && sinceCut < 3 ? [0.32, 0.14, 0.05][sinceCut] : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Filters />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shakeY}px) scale(${punch})`, filter: rgb }}>
        {SCENES.map(([a, b, Scene], i) => (
          <Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)}>
            <Scene />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Hud />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} />
      <Grain />
      <Audio src={staticFile("song.wav")} />
    </AbsoluteFill>
  );
};
