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

// A clip lives in public/. startFrom is where to start inside it, in seconds.
export type Clip = { src: string; startFrom?: number; focus?: string } | null;
export type EditProps = { clips: Clip[]; music: string | null };

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

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
  "Back to camera, arms out — the celebration",
  "Seated / quiet moment, moody light",
  "Mid-air: bicycle kick or header",
  "Front-on, arms wide, stadium behind",
  "Pointing at camera / close-up stare",
  "Wide shot, alone on the pitch",
];

// ---------- building blocks ----------

const fade = (frame: number, dur: number, inF = 8, outF = 12) =>
  interpolate(frame, [0, inF, dur - outF, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Footage: React.FC<{
  clip: Clip;
  index: number;
  filter: string;
  zoomFrom?: number;
  zoomTo?: number;
  dur: number;
}> = ({ clip, index, filter, zoomFrom = 1.04, zoomTo = 1.16, dur }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, dur], [zoomFrom, zoomTo], {
    easing: Easing.out(Easing.quad),
  });
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: clip?.focus ?? "50% 50%",
    transform: `scale(${scale})`,
    filter,
  };
  if (!clip) {
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter,
          background:
            "radial-gradient(ellipse at 50% 60%, #3a3a3a 0%, #151515 55%, #050505 100%)",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "Oswald, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 150, letterSpacing: 12 }}>CLIP {index + 1}</div>
        <div style={{ fontSize: 40, letterSpacing: 2 }}>{SHOT_HINTS[index]}</div>
      </AbsoluteFill>
    );
  }
  const src = staticFile(clip.src);
  return /\.(png|jpe?g|webp)$/i.test(clip.src) ? (
    <Img src={src} style={style} />
  ) : (
    <OffthreadVideo
      src={src}
      muted
      startFrom={s(clip.startFrom ?? 0)}
      style={style}
    />
  );
};

const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.85 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.12, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={frame % 12}
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// A word that rises out of blur, tracking in.
const RevealWord: React.FC<{
  text: string;
  at: number;
  style: React.CSSProperties;
  hold?: number;
}> = ({ text, at, style, hold }) => {
  const frame = useCurrentFrame() - s(at);
  if (frame < 0) return null;
  const p = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const out =
    hold === undefined
      ? 1
      : interpolate(frame, [s(hold), s(hold) + 8], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: SERIF,
        opacity: p * out,
        filter: `blur(${(1 - p) * 14}px)`,
        transform: `translateY(${(1 - p) * 30}px)`,
        letterSpacing: `${0.02 + (1 - p) * 0.25}em`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// ---------- scenes ----------

// 1. Back shot, desaturated, words then a gold jersey-style "LEGACY".
const SceneOne: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 10, 20) }}>
      <Footage
        clip={clip}
        index={0}
        dur={dur}
        filter="grayscale(0.7) contrast(1.25) brightness(0.6)"
      />
      <Vignette />
      <RevealWord
        text="IS HE"
        at={0.5}
        hold={1.2}
        style={{ top: 190, width: "100%", textAlign: "center", fontSize: 72, color: "#d22", textShadow: "0 0 20px rgba(0,0,0,0.9)" }}
      />
      <RevealWord
        text="THE ONE I LOST"
        at={1.4}
        hold={1.3}
        style={{ top: 190, width: "100%", textAlign: "center", fontSize: 72, color: "#d22", textShadow: "0 0 20px rgba(0,0,0,0.9)" }}
      />
      <RevealWord
        text="LEGACY"
        at={2.9}
        style={{
          top: 1180,
          width: "100%",
          textAlign: "center",
          fontFamily: "Oswald, sans-serif",
          fontSize: 230,
          color: "#c9a227",
          transform: "rotate(-6deg)",
          textShadow: "0 0 30px rgba(201,162,39,0.35)",
        }}
      />
    </AbsoluteFill>
  );
};

// 2. Red room, pocket watch, lines building on the left.
const Clock: React.FC<{ size: number; roman?: boolean; color?: string }> = ({
  size,
  roman,
  color = "#eee",
}) => {
  const frame = useCurrentFrame();
  const numerals = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
  return (
    <div style={{ position: "absolute", width: size, height: size }}>
      {numerals.map((n, i) => {
        const a = (i / 12) * 360 + (roman ? frame * 0.6 : 0);
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: size * 0.11,
              color,
              transform: `translate(-50%,-50%) rotate(${a}deg) translateY(${-size * 0.42}px)`,
              textShadow: "0 0 18px rgba(0,0,0,0.9)",
            }}
          >
            {roman ? n : "|"}
          </div>
        );
      })}
      {!roman && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 4,
            height: size * 0.35,
            background: color,
            transformOrigin: "50% 0%",
            transform: `translateX(-50%) rotate(${180 + frame * 6}deg)`,
          }}
        />
      )}
    </div>
  );
};

const SceneTwo: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const flicker = 0.85 + random(`f${Math.floor(frame / 3)}`) * 0.15;
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur) }}>
      <Footage
        clip={clip}
        index={1}
        dur={dur}
        zoomFrom={1.1}
        zoomTo={1.02}
        filter="contrast(1.3) brightness(0.55) saturate(1.4)"
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 62% 8%, rgba(255,40,60,0.95) 0%, rgba(200,0,30,0.45) 22%, rgba(80,0,10,0.35) 50%, rgba(0,0,0,0.6) 100%)",
          mixBlendMode: "screen",
          opacity: flicker,
        }}
      />
      <Vignette strength={0.9} />
      <div style={{ position: "absolute", right: 90, top: 170, width: 220, height: 220, opacity: 0.8 }}>
        <Clock size={230} />
      </div>
      {["SOMEWHERE", "ACROSS", "THE SEA"].map((w, i) => (
        <RevealWord
          key={w}
          text={w}
          at={0.3 + i * 0.7}
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
    </AbsoluteFill>
  );
};

// 3. Whip in from blur, roman-numeral ring spinning around the subject.
const SceneThree: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const whip = interpolate(frame, [0, 9], [40, 0], { extrapolateRight: "clamp" });
  const ringIn = spring({ frame: frame - 6, fps: FPS, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 1, 10) }}>
      <AbsoluteFill style={{ filter: `blur(${whip}px)` }}>
        <Footage
          clip={clip}
          index={2}
          dur={dur}
          zoomFrom={1.25}
          zoomTo={1.08}
          filter="contrast(1.2) brightness(0.75) hue-rotate(-8deg) saturate(1.1)"
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "rgba(10,40,90,0.35)", mixBlendMode: "multiply" }} />
      <Vignette />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: ringIn,
          transform: `scale(${0.6 + ringIn * 0.4})`,
        }}
      >
        <div style={{ position: "relative", width: 900, height: 900, top: 150 }}>
          <Clock size={900} roman />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 4. Fade up from black, "A LOVE" then glowing "IMMORTAL".
const SceneFour: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const lift = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const glow = 20 + Math.sin(frame / 4) * 8;
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 20, 12) }}>
      <AbsoluteFill style={{ opacity: lift }}>
        <Footage
          clip={clip}
          index={3}
          dur={dur}
          zoomFrom={1.0}
          zoomTo={1.1}
          filter="contrast(1.2) brightness(0.65)"
        />
      </AbsoluteFill>
      <Vignette strength={0.95} />
      <RevealWord text="A" at={0.4} hold={0.9} style={{ left: 250, top: 110, fontSize: 130, color: "#aaa" }} />
      <RevealWord text="LOVE" at={0.8} hold={0.5} style={{ left: 420, top: 110, fontSize: 130, color: "#777" }} />
      <RevealWord
        text="IMMORTAL"
        at={1.4}
        style={{
          top: 120,
          width: "100%",
          textAlign: "center",
          fontSize: 138,
          fontWeight: 700,
          color: "#3a6cff",
          textShadow: `0 0 ${glow}px rgba(60,110,255,0.9), 0 0 ${glow * 2.5}px rgba(60,110,255,0.5)`,
        }}
      />
    </AbsoluteFill>
  );
};

// 5. Pointing at camera, white "MINE", one flash/glitch hit.
const SceneFive: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const hit = s(1.8);
  const flash = interpolate(frame, [hit, hit + 2, hit + 7], [0, 0.9, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shake = frame >= hit && frame < hit + 6 ? (random(`x${frame}`) - 0.5) * 40 : 0;
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 3, 14) }}>
      <AbsoluteFill style={{ transform: `translateX(${shake}px)` }}>
        <Footage
          clip={clip}
          index={4}
          dur={dur}
          zoomFrom={1.12}
          zoomTo={1.2}
          filter="grayscale(0.35) contrast(1.35) brightness(0.7)"
        />
      </AbsoluteFill>
      <Vignette />
      <RevealWord
        text="MINE"
        at={0.15}
        style={{
          left: 0, width: "100%", textAlign: "center",
          top: 1430,
          fontSize: 220,
          fontWeight: 700,
          color: "#fff",
          textShadow: "0 0 30px rgba(255,255,255,0.8)",
        }}
      />
      <AbsoluteFill style={{ background: "#cfe8ff", opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

// 6. Wide shot, red 3D "WILL" swings in, "COME" above.
const SceneSix: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const frame = useCurrentFrame();
  const swing = spring({ frame: frame - s(0.5), fps: FPS, config: { damping: 12, mass: 0.8 } });
  const comeIn = spring({ frame: frame - s(1.6), fps: FPS, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ opacity: fade(frame, dur, 6, 20) }}>
      <Footage
        clip={clip}
        index={5}
        dur={dur}
        zoomFrom={1.0}
        zoomTo={1.18}
        filter="contrast(1.3) brightness(0.6) saturate(1.2)"
      />
      <Vignette />
      <AbsoluteFill style={{ perspective: 1200, alignItems: "center", paddingTop: 1380 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 250,
            color: "#d0141f",
            opacity: swing,
            transform: `rotateY(${(1 - swing) * -75}deg) rotateZ(-6deg)`,
            textShadow: "0 8px 0 #6d0008, 0 0 40px rgba(255,0,20,0.5)",
          }}
        >
          WILL
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
          fontFamily: SERIF,
          fontSize: 110,
          letterSpacing: "0.15em",
          color: "#f2f2f2",
          opacity: comeIn,
          transform: `translateY(${(1 - comeIn) * -40}px)`,
        }}
      >
        COME
      </div>
    </AbsoluteFill>
  );
};

// 7. End card.
const EndCard: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const spread = interpolate(frame, [0, dur], [0.35, 0.8]);
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        alignItems: "center",
        justifyContent: "center",
        opacity: fade(frame, dur, 15, 25),
      }}
    >
      <div style={{ fontFamily: SERIF, fontSize: 120, color: "#eee", letterSpacing: `${spread}em` }}>
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
          volume={(f) =>
            interpolate(f, [TOTAL_FRAMES - fps * 1.5, TOTAL_FRAMES], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      )}
    </AbsoluteFill>
  );
};
