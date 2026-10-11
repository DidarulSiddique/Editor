import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import "@fontsource/inter/400.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";

// "Floodlights" — a faceless, loopable relatable edit. Every visual is
// procedural (no footage) and the soundtrack is synthesised by
// music/compose.py. Timings are in seconds and follow its 80 BPM grid.
export const FPS = 30;
export const FRAMES = 18 * FPS;
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.bezier(0.45, 0, 0.2, 1);

const LAMP = "#fff4d6";
const GOLD = "#ffd84a";
const FONT = "Inter, sans-serif";

// Pitch in world units: 1600 x 2600 (about 68 x 105 m).
const PW = 1600;
const PL = 2600;

// ---------- camera ----------

type Cam = { tilt: number; dolly: number; x: number; rotZ: number; lift: number };
// Each shot interpolates its own start -> end camera; a new shot is a cut.
const SHOTS: { from: number; to: number; a: Cam; b: Cam }[] = [
  { from: 0, to: 4.5, a: { tilt: 76, dolly: -300, x: 0, rotZ: 0, lift: 0 }, b: { tilt: 74, dolly: 100, x: 0, rotZ: 0, lift: 0 } },
  { from: 4.5, to: 7.5, a: { tilt: 80, dolly: 500, x: 120, rotZ: -2, lift: 160 }, b: { tilt: 77, dolly: 1100, x: 60, rotZ: 1, lift: 160 } },
  { from: 7.5, to: 8.25, a: { tilt: 82, dolly: 1500, x: -380, rotZ: -9, lift: 220 }, b: { tilt: 82, dolly: 1580, x: -400, rotZ: -10, lift: 220 } },
  { from: 8.25, to: 9.0, a: { tilt: 70, dolly: 700, x: 420, rotZ: 8, lift: 0 }, b: { tilt: 70, dolly: 780, x: 440, rotZ: 9, lift: 0 } },
  { from: 9.0, to: 9.75, a: { tilt: 62, dolly: 1300, x: 0, rotZ: 0, lift: -300 }, b: { tilt: 60, dolly: 1380, x: 0, rotZ: 0, lift: -320 } },
  { from: 9.75, to: 12.0, a: { tilt: 78, dolly: 1250, x: 0, rotZ: 0, lift: 120 }, b: { tilt: 80, dolly: 1950, x: 0, rotZ: 0, lift: 160 } },
  { from: 12.0, to: 13.5, a: { tilt: 72, dolly: 400, x: 0, rotZ: -4, lift: 0 }, b: { tilt: 74, dolly: 1150, x: 0, rotZ: 3, lift: 0 } },
  { from: 13.5, to: 15.0, a: { tilt: 79, dolly: 1350, x: 0, rotZ: 0, lift: 140 }, b: { tilt: 78, dolly: 1550, x: 0, rotZ: 0, lift: 140 } },
  { from: 15.0, to: 18.0, a: { tilt: 38, dolly: 600, x: 0, rotZ: -12, lift: -200 }, b: { tilt: 30, dolly: 800, x: 0, rotZ: 14, lift: -260 } },
];

const camAt = (t: number): Cam => {
  const shot = SHOTS.find((sh) => t >= sh.from && t < sh.to) ?? SHOTS[SHOTS.length - 1];
  const p = interpolate(t, [shot.from, shot.to], [0, 1], { ...clamp, easing: smooth });
  const mix = (k: keyof Cam) => shot.a[k] + (shot.b[k] - shot.a[k]) * p;
  return { tilt: mix("tilt"), dolly: mix("dolly"), x: mix("x"), rotZ: mix("rotZ"), lift: mix("lift") };
};

// Beat hits for shake/flash: clunks, cuts, the drop.
const HITS = [0.05, 0.55, 1.05, 4.5, 7.5, 8.25, 9.0, 12.0, 13.5];
const lastHit = (t: number) => HITS.reduce((h, x) => (x <= t ? x : h), -9);

// ---------- lights ----------

// Banks switch on with the three clunks; they flicker on "no crowd".
const lampLevel = (t: number, bank: 0 | 1 | 2) => {
  const on = [0.05, 0.55, 1.05][bank];
  if (t < on) return 0;
  const surge = interpolate(t - on, [0, 0.06, 0.4], [1.6, 1.25, 1], clamp);
  const flicker = t > 9.0 && t < 9.75 && random(`fl${bank}-${Math.floor(t * 12)}`) > 0.7 ? 0.25 : 1;
  const out = interpolate(t, [16.6, 17.8], [1, 0], clamp);
  return surge * flicker * out;
};

// ---------- world pieces ----------

const PitchMarkings: React.FC = () => {
  const m = 60;
  const w = PW - 2 * m;
  const l = PL - 2 * m;
  const pa = { w: 947, d: 409 };
  const ga = { w: 430, d: 136 };
  const stroke = { stroke: "rgba(255,255,255,0.85)", strokeWidth: 9, fill: "none" };
  const end = (y: number, dir: 1 | -1) => (
    <>
      <rect x={PW / 2 - pa.w / 2} y={dir === 1 ? y : y - pa.d} width={pa.w} height={pa.d} {...stroke} />
      <rect x={PW / 2 - ga.w / 2} y={dir === 1 ? y : y - ga.d} width={ga.w} height={ga.d} {...stroke} />
      <circle cx={PW / 2} cy={y + dir * 272} r={8} fill="rgba(255,255,255,0.9)" />
      <path
        d={`M ${PW / 2 - 175} ${y + dir * pa.d} A 215 215 0 0 ${dir === 1 ? 0 : 1} ${PW / 2 + 175} ${y + dir * pa.d}`}
        {...stroke}
      />
    </>
  );
  return (
    <svg width={PW} height={PL} style={{ position: "absolute", inset: 0 }}>
      <rect x={m} y={m} width={w} height={l} {...stroke} />
      <line x1={m} y1={PL / 2} x2={PW - m} y2={PL / 2} {...stroke} />
      <circle cx={PW / 2} cy={PL / 2} r={215} {...stroke} />
      <circle cx={PW / 2} cy={PL / 2} r={9} fill="rgba(255,255,255,0.9)" />
      {end(m, 1)}
      {end(PL - m, -1)}
    </svg>
  );
};

// Upright element standing on the pitch at (x, y), facing the camera.
const Standing: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode }> = ({ x, y, w, h, children }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h,
      width: w,
      height: h,
      transformOrigin: "50% 100%",
      transform: "rotateX(-90deg)",
      transformStyle: "preserve-3d",
    }}
  >
    {children}
  </div>
);

const Goal: React.FC = () => (
  <svg width={260} height={95} viewBox="0 0 260 95" style={{ overflow: "visible" }}>
    {new Array(14).fill(0).map((_, i) => (
      <line key={`v${i}`} x1={10 + i * 18.5} y1={8} x2={10 + i * 18.5} y2={95} stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} />
    ))}
    {new Array(6).fill(0).map((_, i) => (
      <line key={`h${i}`} x1={10} y1={8 + i * 15} x2={250} y2={8 + i * 15} stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} />
    ))}
    <path d="M 6 95 L 6 6 L 254 6 L 254 95" stroke="#fff" strokeWidth={8} fill="none" />
  </svg>
);

// Rows of empty seats rising behind the far goal.
const Stands: React.FC<{ glow: number }> = ({ glow }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      background: `repeating-linear-gradient(0deg, #0d1218 0 26px, #1b2430 26px 34px),
        repeating-linear-gradient(90deg, transparent 0 30px, rgba(0,0,0,0.5) 30px 34px)`,
      backgroundBlendMode: "multiply",
      filter: `brightness(${0.5 + glow * 0.6})`,
      boxShadow: "inset 0 -60px 80px rgba(0,0,0,0.8)",
    }}
  />
);

const Tower: React.FC<{ level: number }> = ({ level }) => (
  <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <div style={{ position: "absolute", left: "46%", width: "8%", top: 120, bottom: 0, background: "linear-gradient(#2b3138, #0b0e12)" }} />
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 130,
        borderRadius: 8,
        background: "#15191e",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        padding: 10,
      }}
    >
      {new Array(12).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: "50%",
            background: level > 0 ? LAMP : "#2a2f36",
            opacity: Math.min(1, level),
            boxShadow: level > 0 ? `0 0 ${30 * level}px ${10 * level}px rgba(255,244,214,${0.7 * Math.min(level, 1)})` : "none",
          }}
        />
      ))}
    </div>
  </div>
);

// Volumetric beam: an upright slanted cone from the lamp head down toward
// the middle of the pitch. `inward` = 1 slants right, -1 slants left.
const Beam: React.FC<{ level: number; inward: 1 | -1 }> = ({ level, inward }) =>
  level <= 0 ? null : (
    <div
      style={{
        width: "100%",
        height: "100%",
        opacity: Math.min(1, level) * 0.55,
        mixBlendMode: "screen",
        filter: "blur(18px)",
        background: "linear-gradient(180deg, rgba(255,246,220,0.95) 0%, rgba(255,240,205,0.35) 45%, rgba(255,240,205,0) 100%)",
        clipPath:
          inward === 1
            ? "polygon(0% 0%, 12% 0%, 100% 100%, 30% 100%)"
            : "polygon(88% 0%, 100% 0%, 70% 100%, 0% 100%)",
      }}
    />
  );

const Ball: React.FC<{ spin: number }> = ({ spin }) => (
  <svg width={70} height={70} viewBox="-50 -50 100 100" style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.5))" }}>
    <circle r={46} fill="#f4f4f4" stroke="#222" strokeWidth={3} />
    <g transform={`rotate(${spin})`}>
      <polygon points="0,-16 15,-5 9,13 -9,13 -15,-5" fill="#1b1b1b" />
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a}) translate(0,-38)`}>
          <polygon points="0,-9 9,-3 6,8 -6,8 -9,-3" fill="#1b1b1b" />
        </g>
      ))}
    </g>
  </svg>
);

// One camera-transformed layer. Each layer holds a single 3D object so the
// software compositor never has to depth-sort intersecting planes; layers are
// painted floor first, then upright objects far -> near.
const CamLayer: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <AbsoluteFill style={{ perspective: 1100, perspectiveOrigin: "50% 38%" }}>
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "62%",
        width: PW,
        height: PL,
        marginLeft: -PW / 2,
        marginTop: -PL / 2,
        transformStyle: "preserve-3d",
        transform: `translate3d(${cam.x}px, ${cam.lift}px, 0) rotateX(${cam.tilt}deg) rotateZ(${cam.rotZ}deg) translateY(${cam.dolly}px)`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const World: React.FC<{ t: number }> = ({ t }) => {
  const cam = camAt(t);
  const left = lampLevel(t, 0);
  const right = lampLevel(t, 1);
  const full = lampLevel(t, 2);
  const lit = Math.min(1, (left + right) / 2 + full * 0.4);
  // Ball: kicked at 4.5s from near the halfway line toward the far goal.
  const ballP = interpolate(t, [4.5, 7.4], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ballY = PL * 0.7 - ballP * 1150;
  const ballShown = t >= 4.5 && t < 12;
  const towers = [
    { x: -300, y: -150, lv: left },
    { x: PW + 300, y: -150, lv: right },
    { x: -300, y: PL + 150, lv: left },
    { x: PW + 300, y: PL + 150, lv: right },
  ];
  return (
    <AbsoluteFill>
      <CamLayer cam={cam}>
        {/* grass, mowing stripes, light pools, markings */}
        <div
          style={{
            position: "absolute",
            inset: -2500,
            background: "repeating-linear-gradient(0deg, #17431f 0 160px, #1d5126 160px 320px)",
            filter: `brightness(${0.18 + lit * 0.82})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: -400,
            opacity: lit,
            background: `radial-gradient(ellipse at 0% 0%, rgba(255,244,214,${0.35 * left}) 0%, transparent 45%),
              radial-gradient(ellipse at 100% 0%, rgba(255,244,214,${0.35 * right}) 0%, transparent 45%),
              radial-gradient(ellipse at 0% 100%, rgba(255,244,214,${0.3 * left}) 0%, transparent 45%),
              radial-gradient(ellipse at 100% 100%, rgba(255,244,214,${0.3 * right}) 0%, transparent 45%)`,
            mixBlendMode: "screen",
          }}
        />
        <div style={{ position: "absolute", inset: 0, opacity: 0.25 + lit * 0.75 }}>
          <PitchMarkings />
        </div>
      </CamLayer>
      <CamLayer cam={cam}>
        <Standing x={PW / 2} y={-260} w={PW + 900} h={520}>
          <Stands glow={lit} />
        </Standing>
      </CamLayer>
      {towers.slice(0, 2).map((tw, i) => (
        <React.Fragment key={i}>
          <CamLayer cam={cam}>
            <Standing x={tw.x} y={tw.y} w={180} h={1100}>
              <Tower level={tw.lv} />
            </Standing>
          </CamLayer>
          <CamLayer cam={cam}>
            <Standing x={i === 0 ? tw.x + 500 : tw.x - 500} y={tw.y + 40} w={1100} h={1080}>
              <Beam level={tw.lv} inward={i === 0 ? 1 : -1} />
            </Standing>
          </CamLayer>
        </React.Fragment>
      ))}
      <CamLayer cam={cam}>
        <Standing x={PW / 2} y={60} w={260} h={95}>
          <Goal />
        </Standing>
      </CamLayer>
      {ballShown && (
        <CamLayer cam={cam}>
          <Standing x={PW / 2 + 40} y={ballY} w={70} h={70}>
            <Ball spin={ballP * 1400} />
          </Standing>
        </CamLayer>
      )}
      {towers.slice(2).map((tw, i) => (
        <React.Fragment key={i}>
          <CamLayer cam={cam}>
            <Standing x={i === 0 ? tw.x + 500 : tw.x - 500} y={tw.y - 40} w={1100} h={1080}>
              <Beam level={tw.lv} inward={i === 0 ? 1 : -1} />
            </Standing>
          </CamLayer>
          <CamLayer cam={cam}>
            <Standing x={tw.x} y={tw.y} w={180} h={1100}>
              <Tower level={tw.lv} />
            </Standing>
          </CamLayer>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

// ---------- atmosphere ----------

const Sky: React.FC<{ lit: number }> = ({ lit }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 30%, rgba(60,80,110,${0.2 + 0.5 * lit}) 0%, #04070c 65%)`,
    }}
  />
);

// Haze hanging in the light, plus a soft bloom near the lamps.
const Haze: React.FC<{ lit: number }> = ({ lit }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        boxShadow: "none",
        opacity: lit * 0.55,
        background: `radial-gradient(ellipse at ${48 + Math.sin(frame / 40) * 4}% 34%, rgba(255,240,210,0.28) 0%, transparent 55%)`,
        mixBlendMode: "screen",
      }}
    />
  );
};

const Rain: React.FC<{ amount: number }> = ({ amount }) => {
  const frame = useCurrentFrame();
  if (amount <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: amount }}>
      <svg width="1080" height="1920">
        {new Array(140).fill(0).map((_, i) => {
          const r = (k: string) => random(`rain-${i}-${k}`);
          const depth = r("d");
          const speed = 40 + depth * 50;
          const x = (r("x") * 1300 - 100 + frame * 6) % 1200;
          const y = ((r("y") * 2100 + frame * speed) % 2100) - 100;
          const len = 30 + depth * 60;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - len * 0.18}
              y2={y + len}
              stroke={`rgba(220,235,255,${0.15 + depth * 0.4})`}
              strokeWidth={1 + depth * 2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Horizontal anamorphic flare streak across the lamp line.
const Flare: React.FC<{ strength: number }> = ({ strength }) =>
  strength <= 0 ? null : (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: strength }}>
      <div
        style={{
          position: "absolute",
          top: "33%",
          left: "-10%",
          width: "120%",
          height: 14,
          background: "linear-gradient(90deg, transparent, rgba(120,170,255,0.7) 30%, rgba(255,255,255,1) 50%, rgba(120,170,255,0.7) 70%, transparent)",
          filter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "33%",
          left: "50%",
          width: 420,
          height: 420,
          marginLeft: -210,
          marginTop: -203,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,250,235,0.9) 0%, rgba(255,240,200,0.25) 30%, transparent 65%)",
        }}
      />
    </AbsoluteFill>
  );

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.1, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 10} />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- typography ----------

// Words rise out of blur one at a time; words wrapped in *stars* glow gold.
const Line: React.FC<{ text: string; at: number; until: number; top: number; size?: number; stagger?: number }> = ({
  text,
  at,
  until,
  top,
  size = 82,
  stagger = 0.09,
}) => {
  const t = useCurrentFrame() / FPS;
  if (t < at || t >= until) return null;
  const out = interpolate(t, [until - 0.18, until], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: "#fff",
        opacity: out,
        textShadow: "0 4px 24px rgba(0,0,0,0.85)",
      }}
    >
      {text.split(" ").map((word, i) => {
        const key = word.startsWith("*");
        const clean = word.replace(/\*/g, "");
        const p = interpolate(t, [at + i * stagger, at + i * stagger + 0.32], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.25em",
              opacity: p,
              transform: `translateY(${(1 - p) * 28}px)`,
              filter: `blur(${(1 - p) * 10}px)`,
              color: key ? GOLD : undefined,
              textShadow: key ? `0 0 28px rgba(255,216,74,0.75), 0 4px 24px rgba(0,0,0,0.85)` : undefined,
            }}
          >
            {clean}
          </span>
        );
      })}
    </div>
  );
};

// "no ___." with a red strike drawn through the noun.
const Absent: React.FC<{ word: string; at: number; until: number; top: number }> = ({ word, at, until, top }) => {
  const t = useCurrentFrame() / FPS;
  if (t < at || t >= until) return null;
  const p = interpolate(t, [at, at + 0.2], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const strike = interpolate(t, [at + 0.22, at + 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: "absolute",
        top,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 120,
        letterSpacing: "-0.03em",
        color: "#fff",
        transform: `scale(${1.4 - 0.4 * p})`,
        opacity: p,
        textShadow: "0 6px 30px rgba(0,0,0,0.9)",
      }}
    >
      no{" "}
      <span style={{ position: "relative", display: "inline-block" }}>
        {word}
        <span
          style={{
            position: "absolute",
            left: -10,
            top: "52%",
            height: 12,
            width: `calc(${strike * 100}% + 20px)`,
            background: "#ff3b4a",
            borderRadius: 6,
            boxShadow: "0 0 18px rgba(255,59,74,0.8)",
          }}
        />
      </span>
    </div>
  );
};

const Love: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t < 13.5 || t >= 15.0) return null;
  const p = interpolate(t, [13.5, 13.75], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const beat = Math.exp(-(((t - 13.5) % 0.75) / 0.12));
  const out = interpolate(t, [14.82, 15.0], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 760,
        width: "100%",
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 190,
        letterSpacing: "-0.04em",
        color: GOLD,
        opacity: p * out,
        transform: `scale(${(0.6 + 0.4 * p) * (1 + beat * 0.05)})`,
        textShadow: `0 0 ${40 + beat * 40}px rgba(255,216,74,0.9), 0 0 120px rgba(255,180,40,0.5)`,
      }}
    >
      that's love.
    </div>
  );
};

const Cta: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (t < 15.0) return null;
  const p = interpolate(t, [15.0, 15.35], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const out = interpolate(t, [16.9, 17.6], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 820, width: "100%", display: "flex", justifyContent: "center", opacity: p * out }}>
      <div
        style={{
          transform: `scale(${0.85 + 0.15 * p})`,
          padding: "26px 46px",
          borderRadius: 80,
          background: "rgba(8,12,18,0.72)",
          border: "2px solid rgba(255,216,74,0.6)",
          boxShadow: "0 0 40px rgba(255,216,74,0.25)",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 50,
          color: "#fff",
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        tag the one who
        <br />
        <span style={{ color: GOLD }}>still shows up</span> ⚽
      </div>
    </div>
  );
};

// ---------- composition ----------

export const Floodlights: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const lit = Math.min(1, (lampLevel(t, 0) + lampLevel(t, 1)) / 2 + lampLevel(t, 2) * 0.3);
  const dt = (t - lastHit(t)) * FPS;
  const kick = Math.exp(-dt / 4);
  const shake = dt < 8 ? (random(`s${frame}`) - 0.5) * (t >= 12 && t < 12.3 ? 50 : 16) * kick : 0;
  const flash = t >= 12 && t < 12.15 ? interpolate(t, [12, 12.15], [0.9, 0]) : dt < 3 && t > 4 ? 0.18 * kick : 0;
  const gap = t >= 11.78 && t < 12 ? 1 : 0; // hard cut to black before the drop
  const rain = interpolate(t, [12, 12.4, 16.5, 17.5], [0, 1, 1, 0], clamp);
  const flare = t >= 12 ? interpolate(t, [12, 12.5, 14.5, 15], [1, 0.55, 0.55, 0], clamp) : interpolate(t, [1.05, 1.2, 1.7], [0, 0.8, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#020305" }}>
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px) scale(${1 + kick * 0.03})` }}>
        <Sky lit={lit} />
        <World t={t} />
        <Haze lit={lit} />
        <Rain amount={rain} />
        <Flare strength={flare * lit} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#9fb6d8", mixBlendMode: "multiply", opacity: 0.55 }} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.75) 100%), radial-gradient(ellipse at 50% 42%, transparent 35%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <Line text="you'll never make it *pro.*" at={1.4} until={2.95} top={760} size={92} />
      <Line text="and you know it." at={3.0} until={4.45} top={800} />
      <Line text="but you still lace up" at={4.5} until={7.4} top={700} />
      <Line text="every single *night.*" at={5.25} until={7.4} top={810} />
      <Absent word="scouts." at={7.5} until={9.72} top={640} />
      <Absent word="cameras." at={8.25} until={9.72} top={790} />
      <Absent word="crowd." at={9.0} until={9.72} top={940} />
      <Line text="just you, a ball," at={9.75} until={11.75} top={700} />
      <Line text="and the *floodlights.*" at={10.5} until={11.75} top={810} />
      <Line text="that's not failure." at={12.0} until={13.45} top={800} size={100} stagger={0.12} />
      <Love />
      <Cta />

      <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "#000", opacity: gap }} />
      <Grain />
      <Audio src={staticFile("floodlights.wav")} />
    </AbsoluteFill>
  );
};
