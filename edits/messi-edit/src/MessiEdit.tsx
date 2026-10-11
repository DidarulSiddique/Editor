import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/permanent-marker/400.css";
import "@fontsource/oswald/700.css";

// "Blaugrana scrapbook" — a Messi edit timed to the reference song's vocal
// lines. Footage alternates with torn-paper collage cards; the palette moves
// from Barça blue/garnet to Argentina sky blue on "change my mind".
export const FPS = 60;
export const FRAMES = 11 * FPS;
const s = (sec: number) => Math.round(sec * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(0.16, 1, 0.3, 1);

const C = {
  blue: "#0b2a6f",
  garnet: "#9e1b3f",
  gold: "#f2c230",
  sky: "#7cc4ef",
  paper: "#efe8d8",
  ink: "#141414",
};
const STAMP = "Anton, sans-serif";
const HAND = "'Permanent Marker', cursive";

// Cut points (seconds). Cuts follow the vocal lines; HITS add punch on the
// song's strong onsets (tools/edit-kit/beats.py on the track).
const T = { s2: 1.54, s3: 2.3, s4: 3.3, s5: 4.25, s6: 4.92, freeze: 5.7, s7: 6.08, s8: 7.08, s9: 8.04, s10: 9.04, s11: 10.04, end: 11.0 };
const CUTS = [T.s2, T.s3, T.s4, T.s5, T.s6, T.freeze, T.s7, T.s8, T.s9, T.s10, T.s11];
const HITS = [0.26, 2.16, 4.06, 5.94, 7.85, 9.75];

// ---------------------------------------------------------------- footage

type Key = [number, number]; // [local seconds, Messi x as a fraction of the 16:9 frame]

const track = (keys: Key[], t: number) =>
  interpolate(t, keys.map((k) => k[0]), keys.map((k) => k[1]), { ...clamp, easing: Easing.inOut(Easing.quad) });

// 16:9 source framed into 9:16, panning to follow Messi.
const frameFor = (x: number, zoom: number, yFocus: number) => {
  const k = (1920 / 1080) * zoom;
  const W = 1920 * k;
  const H = 1080 * k;
  const left = Math.min(0, Math.max(1080 - W, 540 - x * W));
  const top = Math.min(0, Math.max(1920 - H, 960 - yFocus * H));
  return { W, H, left, top, messiX: left + x * W };
};

const Footage: React.FC<{
  src: string;
  start: number;
  keys: Key[];
  zoom?: number;
  yFocus?: number;
  rate?: number;
  whip?: boolean;
  children?: (messiX: number) => React.ReactNode;
}> = ({ src, start, keys, zoom = 1, yFocus = 0.5, rate = 1, whip = true, children }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const { W, H, left, top, messiX } = frameFor(track(keys, t), zoom, yFocus);
  const whipP = whip ? interpolate(f, [0, 7], [1, 0], { ...clamp, easing: out }) : 0;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${1 + whipP * 0.22})`, filter: whipP > 0.02 ? `blur(${whipP * 10}px)` : undefined }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={s(start)}
          playbackRate={rate}
          muted
          style={{ position: "absolute", left, top, width: W, height: H, filter: "contrast(1.1) saturate(1.15) brightness(1.06)" }}
        />
        <Blaugrana />
      </AbsoluteFill>
      {children?.(messiX)}
    </AbsoluteFill>
  );
};

// Split tone: blue in the shadows, warm garnet in the highlights.
const Blaugrana: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.blue}, ${C.garnet})`, mixBlendMode: "soft-light", opacity: 0.35 }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(5,10,30,0.5) 100%)" }} />
  </>
);

// ---------------------------------------------------------------- paper kit

// Paper fill with fibre texture; enters with a torn edge rising from below.
const Paper: React.FC<{ color: string; seed: string; stripes?: string; children?: React.ReactNode }> = ({ color, seed, stripes, children }) => {
  const f = useCurrentFrame();
  const rise = interpolate(f, [0, 8], [1, 0], { ...clamp, easing: out });
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = (i / 24) * 100;
    const y = rise * 105 + (random(`${seed}${i}`) - 0.5) * 3;
    pts.push(`${x}% ${y}%`);
  }
  const clip = `polygon(${pts.join(",")}, 100% 100%, 0% 100%)`;
  return (
    <AbsoluteFill style={{ clipPath: rise > 0.001 ? clip : undefined }}>
      <AbsoluteFill style={{ background: color }} />
      {stripes && <AbsoluteFill style={{ background: stripes }} />}
      <AbsoluteFill style={{ opacity: 0.22, mixBlendMode: "multiply" }}>
        <svg width="1080" height="1920">
          <filter id={`fibre${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={3} seed={7} />
            <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.9 0" />
          </filter>
          <rect width="1080" height="1920" filter={`url(#fibre${seed})`} />
        </svg>
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};

// Cut-out photo with a white sticker border, a drop shadow and an offset
// halftone print of its own silhouette behind it.
const Sticker: React.FC<{
  src: string;
  w: number;
  x: number;
  y: number;
  rot?: number;
  dot?: string;
  delay?: number;
}> = ({ src, w, x, y, rot = 0, dot, delay = 0 }) => {
  const f = useCurrentFrame() - s(delay);
  const p = interpolate(f, [0, 9], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
  const drift = interpolate(f, [0, s(1.2)], [0, 1], clamp);
  const url = staticFile(src);
  const base: React.CSSProperties = { position: "absolute", left: x - w / 2, top: y, width: w };
  return (
    <div style={{ opacity: p > 0 ? 1 : 0, transform: `translateY(${-drift * 18}px) scale(${0.7 + 0.3 * p}) rotate(${rot + (1 - p) * 8}deg)`, transformOrigin: `${x}px ${y + w}px`, position: "absolute", inset: 0 }}>
      {dot && (
        <div
          style={{
            ...base,
            left: x - w / 2 + 26,
            top: y + 22,
            aspectRatio: "auto",
            height: w * 1.6,
            WebkitMaskImage: `url(${url})`,
            maskImage: `url(${url})`,
            WebkitMaskSize: "100% auto",
            maskSize: "100% auto",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            background: `radial-gradient(circle, ${dot} 38%, transparent 41%) 0 0 / 14px 14px`,
          }}
        />
      )}
      <Img
        src={url}
        style={{
          ...base,
          filter:
            "drop-shadow(6px 0 0 #fff) drop-shadow(-6px 0 0 #fff) drop-shadow(0 6px 0 #fff) drop-shadow(0 -6px 0 #fff) drop-shadow(0 22px 26px rgba(0,0,0,0.45))",
        }}
      />
    </div>
  );
};

const Tape: React.FC<{ x: number; y: number; rot: number; w?: number; delay?: number }> = ({ x, y, rot, w = 190, delay = 0 }) => {
  const f = useCurrentFrame() - s(delay);
  const p = interpolate(f, [0, 5], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w * p,
        height: 52,
        background: "rgba(236,226,196,0.82)",
        transform: `rotate(${rot}deg)`,
        clipPath: "polygon(0 8%, 4% 0, 100% 6%, 97% 50%, 100% 94%, 3% 100%, 0 60%)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      }}
    />
  );
};

// Stamped condensed word that slams in.
const Stamp: React.FC<{ text: string; at: number; x: number; y: number; size: number; color: string; rot?: number; outline?: boolean; align?: "left" | "center" }> = ({
  text,
  at,
  x,
  y,
  size,
  color,
  rot = 0,
  outline,
  align = "center",
}) => {
  const f = useCurrentFrame() - s(at);
  if (f < 0) return null;
  const p = interpolate(f, [0, 6], [0, 1], { ...clamp, easing: out });
  const split = interpolate(f, [0, 10], [10, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? 0 : x,
        width: align === "center" ? 1080 : undefined,
        top: y,
        textAlign: align,
        fontFamily: STAMP,
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: "0.01em",
        color: outline ? "transparent" : color,
        WebkitTextStroke: outline ? `4px ${color}` : undefined,
        opacity: p,
        transform: `rotate(${rot}deg) scale(${1.6 - 0.6 * p})`,
        textShadow: outline ? undefined : `${split}px 0 rgba(255,40,80,0.6), ${-split}px 0 rgba(40,200,255,0.6)`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Handwritten word written on with a left-to-right wipe.
const Hand: React.FC<{ text: string; at: number; x: number; y: number; size: number; color: string; rot?: number; dur?: number }> = ({
  text,
  at,
  x,
  y,
  size,
  color,
  rot = 0,
  dur = 0.25,
}) => {
  const f = useCurrentFrame() - s(at);
  if (f < 0) return null;
  const p = interpolate(f, [0, s(dur)], [0, 100], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontFamily: HAND,
        fontSize: size,
        color,
        transform: `rotate(${rot}deg)`,
        clipPath: `inset(-20% ${100 - p}% -20% -5%)`,
        textShadow: "0 3px 10px rgba(0,0,0,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Hand-drawn ring that draws itself around a point.
const Scribble: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number; color?: string; seed: string }> = ({
  cx,
  cy,
  rx,
  ry,
  at,
  color = C.gold,
  seed,
}) => {
  const f = useCurrentFrame() - s(at);
  if (f < 0) return null;
  const draw = interpolate(f, [0, 12], [1, 0], { ...clamp, easing: out });
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 34) * Math.PI * 2 - 1.2;
    const wob = 1 + (random(`${seed}${i}`) - 0.5) * 0.08;
    pts.push(`${cx + Math.cos(a) * rx * wob},${cy + Math.sin(a) * ry * wob}`);
  }
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={draw}
        style={{ filter: "drop-shadow(0 0 8px rgba(0,0,0,0.5))" }}
      />
    </svg>
  );
};

const Confetti: React.FC<{ colors: string[]; seed: string; count?: number }> = ({ colors, seed, count = 40 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}${i}${k}`);
        const y = -60 + ((r("y") * 1900 + f * (5 + r("v") * 7)) % 2000);
        const x = r("x") * 1080 + Math.sin(f / 18 + r("p") * 6) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 14 + r("w") * 14,
              height: 8 + r("h") * 8,
              background: colors[Math.floor(r("c") * colors.length)],
              transform: `rotate(${f * (4 + r("r") * 8) + r("a") * 360}deg) scaleY(${Math.cos(f / 6 + r("s") * 6)})`,
              opacity: 0.9,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scenes

// 0–1.54 Hook: sprint past Getafe; a ring draws around Messi on the first hit.
const S1 = () => (
  <Footage src="n5.mp4" start={2.42} keys={[[0, 0.6], [0.4, 0.6], [0.6, 0.62], [0.8, 0.66], [1.0, 0.68], [1.2, 0.7], [1.4, 0.74], [1.54, 0.75]]} zoom={1.05} yFocus={0.5} whip={false}>
    {(mx) => (
      <>
        <Scribble cx={mx} cy={1060} rx={210} ry={330} at={0.26} seed="s1" />
        <Hand text="leo." at={0.32} x={Math.min(760, Math.max(80, mx - 320))} y={560} size={120} color="#fff" rot={-8} />
        <Stamp text="10" at={0.9} x={0} y={1460} size={170} color={C.gold} outline />
      </>
    )}
  </Footage>
);

// 1.54–2.30 "the distance": boot-kiss sticker on cream paper, word behind.
const S2 = () => (
  <Paper color={C.paper} seed="p2">
    <Stamp text="DISTANCE" at={0.08} x={0} y={700} size={250} color={C.blue} rot={-4} />
    <Sticker src="785a0283-cut.png" w={880} x={560} y={470} rot={3} dot={C.garnet} delay={0.02} />
    <Hand text="the" at={0.0} x={120} y={520} size={110} color={C.garnet} rot={-10} dur={0.15} />
    <Tape x={150} y={430} rot={-18} delay={0.12} />
    <Tape x={760} y={1500} rot={14} delay={0.16} />
  </Paper>
);

// 2.30–3.30 "and the time": shirt-to-the-crowd sticker on garnet paper.
const S3 = () => (
  <Paper color={C.garnet} seed="p3">
    <Stamp text="TIME" at={0.14} x={0} y={170} size={400} color={C.gold} rot={3} />
    <Sticker src="1ffe19d4-cut.png" w={940} x={540} y={600} rot={-2} dot={C.blue} />
    <Hand text="& the" at={0.0} x={80} y={90} size={120} color="#fff" rot={-7} dur={0.2} />
    <Tape x={700} y={260} rot={20} delay={0.1} />
  </Paper>
);

// 3.30–4.25 "between us": lyric screen in Barça blue, halftone walk-away.
const S4 = () => {
  const f = useCurrentFrame();
  const lines = new Array(16).fill("THE DISTANCE AND THE TIME BETWEEN US  ");
  const swipe = interpolate(f, [s(0.45), s(0.62)], [0, 1], { ...clamp, easing: out });
  return (
    <Paper color={C.blue} seed="p4">
      <AbsoluteFill style={{ opacity: 0.16 }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: STAMP,
              fontSize: 120,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: "2px #fff",
              whiteSpace: "nowrap",
              transform: `translateX(${(i % 2 ? -1 : 1) * f * 3 - 600}px)`,
            }}
          >
            {l.repeat(3)}
          </div>
        ))}
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 380,
          top: 330,
          width: 760,
          height: 1500,
          WebkitMaskImage: `url(${staticFile("d735f99e-cut.png")})`,
          maskImage: `url(${staticFile("d735f99e-cut.png")})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          background: `radial-gradient(circle, #e0335a 48%, transparent 51%) 0 0 / 18px 18px`,
          transform: `translateY(${-f * 0.5}px)`,
        }}
      />
      <Stamp text="between" at={0.05} x={70} y={620} size={230} color="#fff" align="left" rot={-3} />
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 905,
          width: 330 * swipe,
          height: 150,
          background: C.gold,
          transform: "rotate(-3deg)",
          borderRadius: 10,
          opacity: 0.95,
        }}
      />
      <Hand text="us." at={0.45} x={120} y={880} size={170} color={C.ink} rot={-4} dur={0.2} />
    </Paper>
  );
};

// 4.25–4.92 Dribble against Madrid (wide source, tighter crop).
const S5 = () => (
  <Footage src="n4.mp4" start={0.3} keys={[[0, 0.43], [0.67, 0.43]]} zoom={1.3} yFocus={0.32}>
    {(mx) => <Scribble cx={mx} cy={640} rx={170} ry={260} at={0.08} color="#fff" seed="s5" />}
  </Footage>
);

// 4.92–6.08 Close dribble; at 5.70 the frame freezes, the pitch fades to
// paper and Messi lifts off as a sticker under a stamped NEVER.
const S6 = () => {
  const f = useCurrentFrame();
  const freezeAt = T.freeze - T.s6;
  const frozen = f >= s(freezeAt);
  const k = interpolate(f, [s(freezeAt), s(freezeAt) + 10], [0, 1], { ...clamp, easing: out });
  const fr = frameFor(0.56, 1.1, 0.42);
  const lift = 1 + k * 0.12;
  return (
    <AbsoluteFill>
      {!frozen ? (
        <Footage src="n3.mp4" start={3.22 - (freezeAt - 0.78)} keys={[[0, 0.41], [0.4, 0.42], [0.6, 0.5], [freezeAt, 0.56]]} zoom={1.1} yFocus={0.42}>
          {(mx) => <Hand text="never" at={0.42} x={Math.max(60, Math.min(560, mx - 470))} y={330} size={130} color="#fff" rot={-6} />}
        </Footage>
      ) : (
        <AbsoluteFill style={{ background: "#000" }}>
          <Img
            src={staticFile("freeze-4.0.png")}
            style={{ position: "absolute", left: fr.left, top: fr.top, width: fr.W, height: fr.H, filter: `grayscale(${k}) brightness(${1 - 0.5 * k}) blur(${k * 8}px)` }}
          />
          <AbsoluteFill style={{ background: C.paper, opacity: k * 0.85 }} />
          <Stamp text="NEVER" at={freezeAt} x={0} y={150} size={330} color={C.garnet} rot={-5} />
          <AbsoluteFill style={{ transform: `scale(${lift}) rotate(${-4 * k}deg)`, transformOrigin: "540px 1100px" }}>
            <Img
              src={staticFile("freeze-4.0-cut.png")}
              style={{
                position: "absolute",
                left: fr.left,
                top: fr.top,
                width: fr.W,
                height: fr.H,
                filter: `drop-shadow(${7 * k}px 0 0 #fff) drop-shadow(${-7 * k}px 0 0 #fff) drop-shadow(0 ${7 * k}px 0 #fff) drop-shadow(0 ${-7 * k}px 0 #fff) drop-shadow(0 ${24 * k}px 26px rgba(0,0,0,${0.5 * k}))`,
              }}
            />
          </AbsoluteFill>
          <Stamp text="NEVER" at={freezeAt} x={0} y={150} size={330} color={C.garnet} rot={-5} outline />
          <Tape x={620} y={1430} rot={-12} delay={freezeAt + 0.08} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// 6.08–7.08 "change my mind": the turn to Argentina sky blue.
const ARG = `repeating-linear-gradient(90deg, ${C.sky} 0 180px, #f7fbff 180px 360px)`;
const S7 = () => (
  <Paper color="#f7fbff" seed="p7" stripes={ARG}>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,220,120,0.45), transparent 60%)" }} />
    <Stamp text="CHANGE" at={0.0} x={0} y={250} size={230} color={C.blue} rot={-6} />
    <Sticker src="1fa6cf3b-cut.png" w={900} x={540} y={560} rot={-3} dot={C.gold} delay={0.04} />
    <Hand text="my" at={0.5} x={90} y={1130} size={150} color={C.garnet} rot={-10} dur={0.12} />
    <Stamp text="MIND" at={0.66} x={0} y={1340} size={300} color={C.gold} rot={4} />
    <Confetti colors={[C.gold, "#fff", C.sky]} seed="c7" count={30} />
  </Paper>
);

// 7.08–8.04 Close-up from behind: MESSI, captain's armband.
const S8 = () => (
  <Footage src="n2.mp4" start={9.0} keys={[[0, 0.77], [0.96, 0.8]]} zoom={1.5} yFocus={0.55} rate={0.47}>
    {() => <Hand text="'cause" at={0.12} x={90} y={420} size={140} color="#fff" rot={-8} />}
  </Footage>
);

// 8.04–9.04 Weaving through Zaragoza defenders; "baby" runs up the side.
const S9 = () => {
  const f = useCurrentFrame();
  return (
    <Footage src="n3.mp4" start={6.0} keys={[[0, 0.53], [0.1, 0.41], [0.2, 0.33], [0.3, 0.27], [0.4, 0.27], [0.5, 0.35], [0.6, 0.4], [0.7, 0.47], [0.8, 0.52], [0.9, 0.57], [1.0, 0.56]]} zoom={1.12} yFocus={0.45}>
      {(mx) => (
        <>
          <Scribble cx={mx} cy={960} rx={200} ry={320} at={0.1} seed="s9" />
          <div
            style={{
              position: "absolute",
              left: 50,
              top: 300,
              fontFamily: STAMP,
              fontSize: 210,
              color: C.gold,
              writingMode: "vertical-rl",
              opacity: interpolate(f, [0, 6], [0, 1], clamp),
              transform: `translateY(${interpolate(f, [0, 12], [120, 0], { ...clamp, easing: out })}px)`,
              textShadow: "0 6px 24px rgba(0,0,0,0.6)",
            }}
          >
            BABY
          </div>
        </>
      )}
    </Footage>
  );
};

// 9.04–10.04 "I'd die for you": the World Cup on the crowd's shoulders.
const S10 = () => {
  const f = useCurrentFrame();
  return (
    <Paper color={C.gold} seed="p10" stripes={`repeating-linear-gradient(90deg, transparent 0 220px, rgba(124,196,239,0.55) 220px 300px)`}>
      <div style={{ position: "absolute", left: 40, top: 0, transform: `translateY(${-f * 2}px)` }}>
        {new Array(16).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              fontFamily: STAMP,
              fontSize: 130,
              lineHeight: 1,
              color: i % 3 === 0 ? C.blue : "transparent",
              WebkitTextStroke: `3px ${C.blue}`,
            }}
          >
            FOR YOU
          </div>
        ))}
      </div>
      <Sticker src="17d36584-cut.png" w={760} x={640} y={330} rot={4} dot="#fff" />
      <Hand text="i'd die" at={0.0} x={420} y={250} size={130} color={C.garnet} rot={-6} dur={0.22} />
      <Tape x={780} y={300} rot={24} delay={0.12} />
      <Confetti colors={["#fff", C.sky, C.blue]} seed="c10" count={34} />
    </Paper>
  );
};

// 10.04–11.0 Finale: the Copa América kiss, full bleed, signed off.
const S11 = () => {
  const f = useCurrentFrame();
  const dur = s(T.end - T.s11);
  const fadeOut = interpolate(f, [dur - s(0.35), dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", opacity: fadeOut }}>
      <Img
        src={staticFile("12fbf6b3.png")}
        style={{
          position: "absolute",
          width: 1080,
          height: 1920,
          objectFit: "cover",
          transform: `scale(${interpolate(f, [0, dur], [1.08, 1.0])})`,
          filter: "contrast(1.08) saturate(1.1)",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 55%, rgba(5,15,40,0.85) 100%)" }} />
      <Hand text="Leo" at={0.1} x={330} y={1300} size={230} color="#fff" rot={-6} dur={0.35} />
      <Stamp text="MESSI · 10" at={0.4} x={0} y={1600} size={90} color={C.gold} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- timeline

const SCENES: [number, number, React.FC][] = [
  [0, T.s2, S1],
  [T.s2, T.s3, S2],
  [T.s3, T.s4, S3],
  [T.s4, T.s5, S4],
  [T.s5, T.s6, S5],
  [T.s6, T.s7, S6],
  [T.s7, T.s8, S7],
  [T.s8, T.s9, S8],
  [T.s9, T.s10, S9],
  [T.s10, T.s11, S10],
  [T.s11, T.end, S11],
];

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
      <svg width="1080" height="1920">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(f / 2) % 10} />
        </filter>
        <rect width="1080" height="1920" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const MessiEdit: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const lastCut = CUTS.reduce((a, c) => (c <= t ? c : a), -9);
  const lastHit = HITS.reduce((a, c) => (c <= t ? c : a), -9);
  const sinceCut = f - s(lastCut);
  const sinceHit = f - s(lastHit);
  const flash = sinceCut >= 0 && sinceCut < 5 ? [0.55, 0.3, 0.15, 0.06, 0][sinceCut] : 0;
  const punch = 1 + 0.035 * Math.exp(-Math.max(0, sinceHit) / 6) * (sinceHit >= 0 ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        {SCENES.map(([a, b, Scene], i) => (
          <Sequence key={i} from={s(a)} durationInFrames={s(b) - s(a)}>
            <Scene />
          </Sequence>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} />
      <Grain />
      <Audio src={staticFile("song.wav")} />
    </AbsoluteFill>
  );
};
