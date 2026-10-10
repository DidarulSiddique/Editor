import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cinzel/900.css";
import "@fontsource/oswald/700.css";

// A clip lives in public/. `cut` is the same image with the background
// removed; when present, "behind" layers render between the two so text and
// effects sit behind the player. startFrom (seconds) applies to video clips.
export type Clip = {
  src: string;
  cut?: string;
  focus?: string;
  startFrom?: number;
} | null;
export type EditProps = { clips: Clip[]; music: string | null };

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Timings follow the reference edit so the cuts land on the same beats.
const SCENES = [
  { from: 0, dur: 5.6 },
  { from: 5.8, dur: 3.3 },
  { from: 9.0, dur: 3.1 },
  { from: 12.0, dur: 3.3 },
  { from: 15.2, dur: 3.0 },
  { from: 18.2, dur: 3.4 },
  { from: 21.4, dur: 3.1 },
];
export const TOTAL_FRAMES = s(24.5);

const SERIF = "Cinzel, serif";
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const SHOT_HINTS = [
  "Back to camera, arms out",
  "Seated / quiet moment",
  "Mid-air: bicycle kick",
  "Front-on, arms wide",
  "Pointing at camera",
  "Alone on the pitch",
];

// ---------- building blocks ----------

const fade = (frame: number, dur: number, inF = 8, outF = 12) =>
  interpolate(frame, [0, inF, dur - outF, dur], [0, 1, 1, 0], clamp);

const Media: React.FC<{ src: string; clip: NonNullable<Clip>; style: React.CSSProperties }> = ({
  src,
  clip,
  style,
}) =>
  /\.(png|jpe?g|webp)$/i.test(src) ? (
    <Img src={staticFile(src)} style={style} />
  ) : (
    <OffthreadVideo src={staticFile(src)} muted startFrom={s(clip.startFrom ?? 0)} style={style} />
  );

// Background, then `behind`, then the cut-out player, then `front`.
// Both image layers share one transform so they stay pixel-aligned.
const Layered: React.FC<{
  clip: Clip;
  index: number;
  dur: number;
  grade: string;
  zoom: [number, number];
  drift?: [number, number];
  rim?: string;
  bgDim?: number;
  behind?: React.ReactNode;
  front?: React.ReactNode;
}> = ({ clip, index, dur, grade, zoom, drift = [0, 0], rim, bgDim = 1, behind, front }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const transform = `translate(${drift[0] * t}px, ${drift[1] * t}px) scale(${zoom[0] + (zoom[1] - zoom[0]) * t})`;
  const imgStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: clip?.focus ?? "50% 50%",
  };
  if (!clip) {
    return (
      <AbsoluteFill
        style={{
          transform,
          background: "radial-gradient(ellipse at 50% 55%, #3a3a3a 0%, #111 60%, #000 100%)",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "Oswald, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 140, letterSpacing: 10 }}>CLIP {index + 1}</div>
        <div style={{ fontSize: 40 }}>{SHOT_HINTS[index]}</div>
        {behind}
        {front}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform }}>
        <Media src={clip.src} clip={clip} style={{ ...imgStyle, filter: `${grade} brightness(${bgDim})` }} />
      </AbsoluteFill>
      {behind}
      {clip.cut && (
        <AbsoluteFill style={{ transform }}>
          <Media
            src={clip.cut}
            clip={clip}
            style={{ ...imgStyle, filter: `${grade}${rim ? ` drop-shadow(0 0 14px ${rim})` : ""}` }}
          />
        </AbsoluteFill>
      )}
      {front}
    </AbsoluteFill>
  );
};

const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.85 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.13, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// Drifting dust / embers / petals. Deterministic per seed.
const Particles: React.FC<{
  seed: string;
  count: number;
  color: string;
  size: [number, number];
  speed: number;
  petals?: boolean;
  opacity?: number;
}> = ({ seed, count, color, size, speed, petals, opacity = 0.7 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const depth = r("d");
        const sz = size[0] + (size[1] - size[0]) * depth;
        const x = r("x") * width + Math.sin(frame / 25 + r("p") * 6) * 30;
        const travel = frame * speed * (0.4 + depth);
        const y = petals
          ? ((r("y") * height + travel) % (height + 200)) - 100
          : height - (((r("y") * height + travel) % (height + 200)) - 100);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: sz,
              height: petals ? sz * 0.6 : sz,
              borderRadius: petals ? "60% 40% 60% 40%" : "50%",
              background: color,
              opacity: opacity * (0.4 + depth * 0.6),
              filter: `blur(${(1 - depth) * 6}px)`,
              transform: `rotate(${frame * 3 * (r("r") - 0.5) + r("a") * 360}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Letters slide in one by one from the side.
const SlideText: React.FC<{
  text: string;
  at: number;
  from?: number;
  outAt?: number;
  stagger?: number;
  style: React.CSSProperties;
}> = ({ text, at, from = -120, outAt, stagger = 2, style }) => {
  const frame = useCurrentFrame() - s(at);
  if (frame < 0) return null;
  const out = outAt === undefined ? 1 : interpolate(frame, [s(outAt - at), s(outAt - at) + 8], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", fontFamily: SERIF, whiteSpace: "nowrap", opacity: out, ...style }}>
      {text.split("").map((ch, i) => {
        const p = interpolate(frame - i * stagger, [0, 12], [0, 1], { ...clamp, easing: easeOut });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateX(${(1 - p) * from}px)`,
              filter: `blur(${(1 - p) * 8}px)`,
              minWidth: ch === " " ? "0.3em" : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// A word that rises out of blur while its tracking tightens.
const RevealWord: React.FC<{
  text: string;
  at: number;
  style: React.CSSProperties;
  hold?: number;
}> = ({ text, at, style, hold }) => {
  const frame = useCurrentFrame() - s(at);
  if (frame < 0) return null;
  const p = interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: easeOut });
  const out = hold === undefined ? 1 : interpolate(frame, [s(hold), s(hold) + 8], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: SERIF,
        opacity: p * out,
        filter: `blur(${(1 - p) * 14}px)`,
        transform: `translateY(${(1 - p) * 30}px) scale(${1.15 - 0.15 * p})`,
        letterSpacing: `${0.02 + (1 - p) * 0.3}em`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// Roman-numeral ring lying in a tilted plane, spinning.
const NUMERALS = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const ClockRing: React.FC<{ size: number; tilt: number; spin: number; color?: string }> = ({
  size,
  tilt,
  spin,
  color = "#f4f4f4",
}) => (
  <div style={{ width: size, height: size, perspective: 1400 }}>
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        transform: `rotateX(${tilt}deg) rotateZ(${spin}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {NUMERALS.map((n, i) => (
        <div
          key={n}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: size * 0.1,
            color,
            transform: `translate(-50%,-50%) rotate(${(i / 12) * 360}deg) translateY(${-size * 0.42}px)`,
            textShadow: "0 0 20px rgba(255,255,255,0.45), 0 4px 12px rgba(0,0,0,0.9)",
          }}
        >
          {n}
        </div>
      ))}
    </div>
  </div>
);

// Pocket watch on a chain, swinging.
const PocketWatch: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  const swing = Math.sin(frame / 14) * 14;
  return (
    <div style={{ transformOrigin: "50% 0%", transform: `rotate(${swing}deg)` }}>
      <div style={{ width: 3, height: size * 1.1, margin: "0 auto", background: "linear-gradient(#999,#555)" }} />
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: "50%",
          border: `${size * 0.05}px solid #b8b8b8`,
          background: "radial-gradient(circle at 40% 35%, #f6f2e8, #b9b2a2)",
          boxShadow: "0 0 30px rgba(0,0,0,0.8)",
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 3,
              height: size * 0.08,
              background: "#222",
              transform: `translate(-50%,-50%) rotate(${i * 30}deg) translateY(${-size * 0.36}px)`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 4,
            height: size * 0.32,
            background: "#111",
            transformOrigin: "50% 0%",
            transform: `translateX(-50%) rotate(${180 + frame * 6}deg)`,
          }}
        />
      </div>
    </div>
  );
};

// ---------- scenes ----------

// 1. Back shot. Camera pulls back; red words slide in behind him, then a
//    huge gold LEGACY sits behind his body.
const SceneOne: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 10, 20) }}>
      <Layered
        clip={clip}
        index={0}
        dur={dur}
        zoom={[1.3, 1.05]}
        drift={[0, 40]}
        grade="grayscale(0.75) contrast(1.3) brightness(0.62)"
        bgDim={0.8}
        behind={
          <>
            <SlideText
              text="IS HE"
              at={0.4}
              outAt={1.2}
              from={-40}
              stagger={3}
              style={{ top: 1480, width: "100%", textAlign: "center", fontSize: 130, fontWeight: 700, color: "#ff2a3d", textShadow: "0 0 30px rgba(255,30,50,0.6)" }}
            />
            <SlideText
              text="THE ONE"
              at={1.5}
              outAt={2.7}
              from={40}
              stagger={3}
              style={{ top: 1480, width: "100%", textAlign: "center", fontSize: 130, fontWeight: 700, color: "#ff2a3d", textShadow: "0 0 30px rgba(255,30,50,0.6)" }}
            />
            <RevealWord
              text="LEGACY"
              at={2.8}
              style={{
                top: 640,
                width: "100%",
                textAlign: "center",
                fontFamily: "Oswald, sans-serif",
                fontSize: 330,
                color: "#d4a92c",
                textShadow: "0 0 50px rgba(212,169,44,0.45)",
              }}
            />
          </>
        }
        front={<Particles seed="dust" count={40} color="#fff" size={[3, 10]} speed={1.2} opacity={0.5} />}
      />
      <Vignette />
    </AbsoluteFill>
  );
};

// 2. Red room. Backlight glows behind him, pocket watch swings, lines build.
//    The last frames bloom out into the next scene.
const SceneTwo: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const flicker = 0.85 + random(`f${Math.floor(frame / 3)}`) * 0.15;
  const bloom = interpolate(frame, [dur - 14, dur], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: fade(frame, dur, 10, 1),
        filter: `brightness(${1 + bloom * 1.6}) blur(${bloom * 26}px)`,
        transform: `scale(${1 + bloom * 0.35})`,
      }}
    >
      <Layered
        clip={clip}
        index={1}
        dur={dur}
        zoom={[1.12, 1.02]}
        grade="contrast(1.3) brightness(0.55) saturate(1.3)"
        bgDim={0.7}
        rim="rgba(255,40,60,0.75)"
        behind={
          <AbsoluteFill
            style={{
              background:
                "radial-gradient(circle at 55% 22%, rgba(255,40,60,0.95) 0%, rgba(200,0,30,0.5) 20%, rgba(80,0,10,0.2) 45%, transparent 70%)",
              mixBlendMode: "screen",
              opacity: flicker,
            }}
          />
        }
        front={
          <>
            <div style={{ position: "absolute", right: 110, top: -20, opacity: 0.9 }}>
              <PocketWatch size={170} />
            </div>
            {["SOMEWHERE", "ACROSS", "THE SEA"].map((w, i) => (
              <RevealWord
                key={w}
                text={w}
                at={0.3 + i * 0.6}
                style={{
                  left: 70,
                  top: 1330 + i * 105,
                  fontSize: 92,
                  color: "#ff4d63",
                  transform: "rotate(-14deg)",
                  textShadow: "0 0 6px #000, 0 0 22px rgba(0,0,0,0.95), 0 0 30px rgba(255,30,50,0.5)",
                }}
              />
            ))}
          </>
        }
      />
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

// 3. Racks into focus out of bokeh and petals; a tilted roman ring spins
//    around his waist, the far half behind him and the near half in front.
const SceneThree: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const focus = interpolate(frame, [0, 22], [30, 0], { ...clamp, easing: easeOut });
  const petals = interpolate(frame, [0, 10, 40], [1, 1, 0.35], clamp);
  const ringIn = spring({ frame: frame - 8, fps: FPS, config: { damping: 15 } });
  const ring = (half: "top" | "bottom") => (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        top: 210,
        opacity: ringIn,
        transform: `scale(${0.5 + ringIn * 0.5})`,
        clipPath: half === "top" ? "inset(0 0 50% 0)" : "inset(50% 0 0 0)",
      }}
    >
      <ClockRing size={1000} tilt={64} spin={frame * 1.4} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 1, 10) }}>
      <AbsoluteFill style={{ filter: `blur(${focus}px) brightness(${1 + focus / 25})` }}>
        <Layered
          clip={clip}
          index={2}
          dur={dur}
          zoom={[1.2, 1.06]}
          grade="contrast(1.2) brightness(0.72) saturate(1.15)"
          bgDim={0.75}
          rim="rgba(120,180,255,0.6)"
          behind={
            <>
              <AbsoluteFill style={{ background: "rgba(10,40,100,0.35)", mixBlendMode: "multiply" }} />
              {ring("top")}
            </>
          }
          front={ring("bottom")}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: petals }}>
        <Particles seed="petal" count={34} color="#c3122a" size={[14, 46]} speed={7} petals />
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// 4. Fade up from black under a spotlight; IMMORTAL glows behind his head.
const SceneFour: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const lift = interpolate(frame, [0, 28], [0, 1], clamp);
  const glow = 26 + Math.sin(frame / 4) * 10;
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 20, 12) }}>
      <AbsoluteFill style={{ opacity: lift }}>
        <Layered
          clip={clip}
          index={3}
          dur={dur}
          zoom={[1.0, 1.1]}
          grade="contrast(1.25) brightness(0.68)"
          bgDim={0.45}
          rim="rgba(70,120,255,0.65)"
          behind={
            <>
              <AbsoluteFill
                style={{
                  background: "radial-gradient(ellipse at 50% 30%, rgba(60,110,255,0.35) 0%, transparent 55%)",
                }}
              />
              <RevealWord text="A" at={0.4} hold={0.9} style={{ left: 250, top: 150, fontSize: 140, color: "#aaa" }} />
              <RevealWord text="LOVE" at={0.8} hold={0.5} style={{ left: 430, top: 150, fontSize: 140, color: "#888" }} />
              <RevealWord
                text="IMMORTAL"
                at={1.4}
                style={{
                  top: 260,
                  width: "100%",
                  textAlign: "center",
                  fontSize: 168,
                  fontWeight: 900,
                  color: "#4a7bff",
                  textShadow: `0 0 ${glow}px rgba(60,110,255,0.95), 0 0 ${glow * 2.5}px rgba(60,110,255,0.55)`,
                }}
              />
            </>
          }
          front={<Particles seed="blue" count={26} color="#9db8ff" size={[3, 9]} speed={0.8} opacity={0.6} />}
        />
      </AbsoluteFill>
      <Vignette strength={0.9} />
    </AbsoluteFill>
  );
};

// 5. MINE glows behind his head; one glitch hit flips vertical strips to
//    negative and jolts the frame.
const SceneFive: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const hit = s(1.6);
  const glitching = frame >= hit && frame < hit + 10;
  const shake = glitching ? (random(`x${frame}`) - 0.5) * 50 : 0;
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 3, 14) }}>
      <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
        <Layered
          clip={clip}
          index={4}
          dur={dur}
          zoom={[1.15, 1.04]}
          grade="grayscale(0.3) contrast(1.35) brightness(0.72)"
          bgDim={0.6}
          rim="rgba(255,255,255,0.45)"
          behind={
            <SlideText
              text="MINE"
              at={0.1}
              stagger={3}
              from={-60}
              style={{
                left: 40,
                top: 150,
                fontSize: 230,
                fontWeight: 700,
                color: "#fff",
                textShadow: "0 0 35px rgba(255,255,255,0.85)",
              }}
            />
          }
        />
      </AbsoluteFill>
      {glitching &&
        new Array(4).fill(0).map((_, i) => {
          const r = (k: string) => random(`g${Math.floor(frame / 2)}-${i}-${k}`);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${r("x") * 85}%`,
                width: `${8 + r("w") * 22}%`,
                background: "#fff",
                mixBlendMode: "difference",
                opacity: 0.85,
              }}
            />
          );
        })}
      <Vignette />
    </AbsoluteFill>
  );
};

// 6. Wide shot. Red 3D WILL swings in behind his legs, COME drops in above.
const SceneSix: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const swing = spring({ frame: frame - s(0.5), fps: FPS, config: { damping: 12, mass: 0.8 } });
  const comeIn = spring({ frame: frame - s(1.6), fps: FPS, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 6, 20) }}>
      <Layered
        clip={clip}
        index={5}
        dur={dur}
        zoom={[1.0, 1.15]}
        drift={[0, -30]}
        grade="contrast(1.3) brightness(0.6) saturate(1.15)"
        bgDim={0.6}
        rim="rgba(255,40,40,0.5)"
        behind={
          <>
            <AbsoluteFill style={{ perspective: 1200, alignItems: "center", paddingTop: 1150 }}>
              <div
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 300,
                  color: "#d0141f",
                  opacity: swing,
                  transform: `rotateY(${(1 - swing) * -80}deg) rotateZ(-6deg)`,
                  textShadow: "0 10px 0 #6d0008, 0 0 50px rgba(255,0,20,0.55)",
                }}
              >
                WILL
              </div>
            </AbsoluteFill>
            <div
              style={{
                position: "absolute",
                top: 120,
                width: "100%",
                textAlign: "center",
                fontFamily: SERIF,
                fontSize: 120,
                letterSpacing: "0.15em",
                color: "#f2f2f2",
                opacity: comeIn,
                transform: `translateY(${(1 - comeIn) * -50}px)`,
                textShadow: "0 0 20px rgba(0,0,0,0.9)",
              }}
            >
              COME
            </div>
          </>
        }
        front={<Particles seed="ember" count={30} color="#ff5a3a" size={[3, 8]} speed={1.6} opacity={0.65} />}
      />
      <Vignette />
    </AbsoluteFill>
  );
};

// 7. End card: letter-spaced CR7 with a light sweep across it.
const EndCard: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const spread = interpolate(frame, [0, dur], [0.3, 0.75]);
  const sweep = interpolate(frame, [10, 50], [-60, 160], clamp);
  return (
    <AbsoluteFill
      style={{ background: "#000", alignItems: "center", justifyContent: "center", opacity: fade(frame, dur, 15, 25) }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 150,
          letterSpacing: `${spread}em`,
          paddingLeft: `${spread}em`,
          backgroundImage: `linear-gradient(100deg, #8a8a8a ${sweep - 25}%, #ffffff ${sweep}%, #8a8a8a ${sweep + 25}%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        CR7
      </div>
    </AbsoluteFill>
  );
};

const SCENE_COMPONENTS = [SceneOne, SceneTwo, SceneThree, SceneFour, SceneFive, SceneSix];

export const CR7Edit: React.FC<EditProps> = ({ clips, music }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SCENE_COMPONENTS.map((Scene, i) => (
        <Sequence key={i} from={s(SCENES[i].from)} durationInFrames={s(SCENES[i].dur)}>
          <Scene clip={clips[i] ?? null} dur={s(SCENES[i].dur)} />
        </Sequence>
      ))}
      <Sequence from={s(SCENES[6].from)} durationInFrames={s(SCENES[6].dur)}>
        <EndCard dur={s(SCENES[6].dur)} />
      </Sequence>
      <Grain />
      {music && (
        <Audio
          src={staticFile(music)}
          volume={(f) => interpolate(f, [TOTAL_FRAMES - fps * 1.5, TOTAL_FRAMES], [1, 0], clamp)}
        />
      )}
    </AbsoluteFill>
  );
};
