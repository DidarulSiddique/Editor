// RONALDO FOR PORTUGAL — four players, one shirt. 16-bit pixel style from the
// "What if Shevchenko…" reference. Voiceover: vidIQ (Daniel), tightened to 90.9 s.
// Facts: edits/ronaldo-portugal/storyboard.md.
import React from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Ctx, Look, P, PixelCanvas, RONALDO, ball, confetti, crowd, goal, kit, pitch, player, px, sky, spot, trophy } from "./pixel";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const END = 91.6;
export const FRAMES = Math.round(END * FPS);

const PIX = "'Press Start 2P', monospace";
let fontsReady: Promise<unknown> | null = null;
const useFonts = () => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    fontsReady ??= new FontFace("Press Start 2P", `url(${staticFile("fonts/press-start-2p.ttf")})`).load().then((f) => document.fonts.add(f));
    fontsReady.then(() => continueRender(h));
  }, [h]);
};
const cl = (v: number) => Math.max(0, Math.min(1, v));
const on = (t: number, a: number, b = 1e9) => t >= a && t < b;

// ---------------------------------------------------------------- shared scene pieces
const GREECE = kit("#f2f2f2", "#1f5fd1", "#f2f2f2", "#f2f2f2", "#e8b88f", "#1d1209", "short");
const FRANCE = kit("#1e3a8a", "#16296a", "#f2f2f2", "#c4161c", "#8a5a3c", "#120c08", "short");
const SWEDEN = kit("#f6d21c", "#1f5fd1", "#1f5fd1", "#f6d21c", "#f1c9a5", "#c9a46a", "short");
const OPP = kit("#f2f2f2", "#c9c9c9", "#1a1a1a", "#f2f2f2", "#e6b48c", "#3a2616", "short");
const EDER: Look = { ...RONALDO.y2016, skin: "#6b4430", skin2: "#4e3020", hair: "#0d0907", style: "short" as const, num: "9", band: false };
const PORT_TEAM = (u: number): Look[] => [
  { ...RONALDO.y2016, skin: "#f1c9a5", skin2: "#d3a684", hair: "#3a2616", style: "short" as const, band: false },
  { ...RONALDO.y2016, skin: "#c58c62", skin2: "#a46e48", hair: "#14100b", style: "curly" as const, band: false },
  { ...RONALDO.y2016, skin: "#e9b98f", skin2: "#c99a72", hair: "#2a1a10", style: "short" as const, band: false },
  { ...EDER },
].slice(0, u);

const stadium = (c: Ctx, t: number, cols = [P.red, P.green, P.red, P.white], seed = "pt", jump = 0) => {
  sky(c, t, 70);
  crowd(c, 40, 150, cols, t, seed, jump);
  px(c, 0, 150, PW_, 4, "#3b3f52");
  pitch(c, 154);
};
const PW_ = 180;

// ---------------------------------------------------------------- 2D overlay components
const Tag: React.FC<{ t: number; at: number; until?: number; text: string; bg?: string; x?: number; y?: number }> = ({ t, at, until = 1e9, text, bg = "#1fb3d1", x = 60, y = 170 }) =>
  on(t, at, until) ? (
    <div style={{ position: "absolute", left: x, top: y, padding: "10px 16px 8px", background: bg, color: "#0b0b14", fontFamily: PIX, fontSize: 26, letterSpacing: "0.04em", boxShadow: "6px 6px 0 #00000088" }}>{text}</div>
  ) : null;

const Box: React.FC<{ t: number; at: number; until?: number; lines: string[]; bg?: string; fg?: string; x?: number; y?: number; size?: number; center?: boolean }> = ({ t, at, until = 1e9, lines, bg = P.gold, fg = "#141414", x = 60, y = 250, size = 44, center }) => {
  if (!on(t, at, until)) return null;
  const k = cl((t - at) / 0.12);
  const style: React.CSSProperties = center ? { left: 0, right: 0, display: "flex", justifyContent: "center" } : { left: x };
  return (
    <div style={{ position: "absolute", top: y, ...style }}>
      <div style={{ padding: `${size * 0.4}px ${size * 0.5}px ${size * 0.3}px`, background: bg, color: fg, fontFamily: PIX, fontSize: size, lineHeight: 1.35, boxShadow: "8px 8px 0 #00000099", transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: "left top", textAlign: center ? "center" : "left" }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
};

// Pixel scoreboard: [abbr, colour, score] × 2 + caption.
const Score: React.FC<{ t: number; at: number; until?: number; a: [string, string]; b: [string, string]; score: string; cap?: string; y?: number }> = ({ t, at, until = 1e9, a, b, score, cap, y = 250 }) =>
  on(t, at, until) ? (
    <div style={{ position: "absolute", left: 60, top: y, fontFamily: PIX }}>
      <div style={{ display: "flex", alignItems: "stretch", boxShadow: "8px 8px 0 #00000099" }}>
        <div style={{ background: a[1], color: "#fff", fontSize: 40, padding: "14px 16px 10px" }}>{a[0]}</div>
        <div style={{ background: "#141414", color: P.gold, fontSize: 40, padding: "14px 20px 10px" }}>{score}</div>
        <div style={{ background: b[1], color: "#fff", fontSize: 40, padding: "14px 16px 10px" }}>{b[0]}</div>
      </div>
      {cap && <div style={{ marginTop: 18, display: "inline-block", background: "#141414", border: "4px solid #f4f4f0", color: "#f4f4f0", fontSize: 24, padding: "10px 14px 8px" }}>{cap}</div>}
    </div>
  ) : null;

// Name tag over a sprite (x, y in canvas px).
const Name: React.FC<{ t: number; at?: number; until?: number; x: number; y: number; text: string; bg?: string }> = ({ t, at = 0, until = 1e9, x, y, text, bg = "#141414" }) =>
  on(t, at, until) ? (
    <div style={{ position: "absolute", left: x * 6, top: y * 6, transform: "translate(-50%, -100%)", background: bg, border: "3px solid #f4f4f0", color: "#f4f4f0", fontFamily: PIX, fontSize: 18, padding: "6px 8px 4px", whiteSpace: "nowrap" }}>{text}</div>
  ) : null;

// Subtitles: chunks of ≤3 words revealed through each voiceover segment.
// "[word]" = gold, "{word}" = red, "<word>" = green.
const SEGS: [number, number, string][] = [
  [0.3, 3.29, "The Ronaldo who won {Portugal's} first ever [trophy]…"], [3.49, 5.57, "was [not] the same player who started."],
  [5.77, 8.85, "23 years. [Four] different players."], [9.05, 10.13, "[One] shirt."],
  [10.33, 11.38, "[2003.]"], [11.58, 15.16, "An 18-year-old with [frosted] tips makes his {debut.}"], [15.36, 16.42, "Number [17.]"],
  [16.62, 18.27, "[Stepovers,] [flicks…]"], [18.47, 20.06, "…and not much end {product.}"], [20.26, 21.72, "[Euro] [2004.]"],
  [21.92, 24.88, "At home, Portugal {lose} the final to <Greece…>"], [25.08, 26.77, "…and he {cries} on the pitch."],
  [26.97, 27.77, "Then the tricks…"], [27.97, 28.96, "…get a [purpose.]"], [29.16, 30.26, "By [2008…]"], [30.46, 31.3, "…he's [captain…]"],
  [31.5, 33.02, "…and a winger who {scores.}"], [33.22, 34.09, "[Free] [kicks.]"], [34.29, 34.88, "[Headers.]"], [35.08, 36.78, "Shots from [30] yards."],
  [36.98, 37.59, "Next:"], [37.79, 38.77, "less {flash…}"], [38.97, 39.94, "…more [output.]"],
  [40.14, 44.29, "He stops beating men for fun and starts [cutting] [inside] to {finish.}"],
  [44.49, 45.24, "<Sweden.>"], [45.44, 46.86, "The World Cup [play-off:]"], [47.06, 47.85, "a [hat-trick…]"], [48.05, 49.56, "…to send {Portugal} through."],
  [49.76, 51.29, "[Euro] [2016:]"], [51.49, 53.39, "[three] goals to reach the final."], [53.59, 55.84, "Then he's {injured} after [25] minutes…"],
  [56.04, 59.35, "…and coaches from the [touchline] as <Éder> wins it."], [59.55, 61.78, "{Portugal's} first major [trophy.]"],
  [61.98, 63.24, "Then the legs change…"], [63.44, 64.9, "…so the [game] changes."], [65.1, 66.01, "Fewer {touches.}"], [66.21, 68.64, "More [movement.] He lives in the [box.]"],
  [68.84, 71.26, "A [hat-trick] in the Nations League semi-final…"], [71.46, 72.8, "…and {Portugal} win it."], [73.0, 75.83, "The all-time international scoring [record.]"],
  [76.03, 76.89, "And at [40…]"], [77.09, 78.18, "…the [equaliser…]"], [78.38, 80.39, "…in another Nations League final."],
  [80.59, 81.68, "[Three] trophies."], [81.88, 85.55, "[146] goals. And the first man to score…"], [85.75, 87.89, "…at [six] World Cups."],
  [88.09, 90.7, "Which player's evolution should we break down [next?]"],
];
type Word = { w: string; col: string };
const tok = (s: string): Word[] =>
  s.split(/\s+/).filter(Boolean).map((w) => {
    if (w.startsWith("[")) return { w: w.replace(/[[\]]/g, ""), col: P.gold };
    if (w.startsWith("{")) return { w: w.replace(/[{}]/g, ""), col: "#ff4d57" };
    if (w.startsWith("<")) return { w: w.replace(/[<>]/g, ""), col: "#4fd96a" };
    return { w, col: "#ffe9a8" };
  });
const Subs: React.FC<{ t: number }> = ({ t }) => {
  const seg = SEGS.find(([a, b]) => t >= a - 0.05 && t < b + 0.15);
  if (!seg) return null;
  const words = tok(seg[2]);
  const chunks: Word[][] = [];
  for (let i = 0; i < words.length; i += 3) chunks.push(words.slice(i, i + 3));
  const total = words.reduce((n, w) => n + w.w.length + 1, 0);
  let acc = 0;
  let ci = 0;
  for (let i = 0; i < chunks.length; i++) {
    const start = seg[0] + ((seg[1] - seg[0]) * acc) / total;
    if (t >= start - 0.05) ci = i;
    acc += chunks[i].reduce((n, w) => n + w.w.length + 1, 0);
  }
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1440, display: "flex", justifyContent: "center", flexWrap: "wrap", columnGap: 26, fontFamily: PIX, fontSize: 50, lineHeight: 1.3, textShadow: "5px 5px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000" }}>
      {chunks[ci].map((w, i) => <span key={i} style={{ color: w.col }}>{w.w.toUpperCase()}</span>)}
    </div>
  );
};

// ---------------------------------------------------------------- scenes (local time t)
const useT = () => useCurrentFrame() / FPS;
const Pix: React.FC<{ draw: (c: Ctx, t: number) => void; children?: (t: number) => React.ReactNode }> = ({ draw, children }) => {
  const t = useT();
  return (
    <AbsoluteFill>
      <PixelCanvas draw={(c) => draw(c, t)} deps={[t]} />
      {children?.(t)}
    </AbsoluteFill>
  );
};

// 1 · Hook: the Euro 2016 lift, then a glitch back to the 2003 kid; then four Ronaldos.
const Hook: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.red, P.white], "hk", t < 3.4 ? 1 : 0);
      if (t < 3.45) {
        spot(c, 90, 100, 300, 70, 1);
        player(c, 90, 236, RONALDO.y2016, "celebrate", t * 6, 4);
        trophy(c, 90, 116 - Math.round(Math.abs(Math.sin(t * 6))) * 2, "euro");
        confetti(c, t, 0.2);
      } else if (t < 5.47) {
        if (t < 3.6) for (let y = 0; y < 320; y += 6) px(c, (y * 7 + t * 900) % 180, y, 40, 3, "#ffffff55");
        player(c, 90, 236, RONALDO.y2003, "stand", 0, 4);
      } else {
        const L = [RONALDO.y2003, RONALDO.y2008, RONALDO.y2016, RONALDO.y2025];
        L.forEach((lk, i) => {
          const at = 5.6 + i * 0.55;
          if (t < at) return;
          const x = 26 + i * 43;
          const slide = Math.min(1, (t - at) / 0.25);
          player(c, x - (1 - slide) * 30, 262, lk, t > 9.0 ? "siu" : "stand", t * 5, 3);
        });
      }
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} until={3.45} text="EURO 2016" />
        <Tag t={t} at={3.45} until={5.47} text="2003" bg="#ff3d7f" />
        <Tag t={t} at={5.5} text="PORTUGAL · 2003–2026" />
        {["2003", "2008", "2016", "2025"].map((y, i) => <Name key={y} t={t} at={5.7 + i * 0.55} x={26 + i * 43} y={170} text={y} />)}
        <Box t={t} at={9.0} lines={["4 PLAYERS.", "1 SHIRT."]} y={260} />
      </>
    )}
  </Pix>
);

// Era title card (shared).
const EraCard: React.FC<{ n: number; title: string[]; years: string; look: Look; extra?: (c: Ctx, t: number) => void; children?: (t: number) => React.ReactNode }> = ({ n, title, years, look, extra, children }) => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.white], `era${n}`);
      spot(c, 90, 100, 300, 80, cl(t / 0.3));
      player(c, 90, 240, look, t > 0.8 ? "point" : "stand", t * 5, 4);
      extra?.(c, t);
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text={`ERA ${n}`} />
        <Box t={t} at={0.15} lines={title} y={250} size={46} />
        <Box t={t} at={0.35} lines={[years]} bg="#141414" fg="#f4f4f0" y={250 + title.length * 62 + 70} size={28} />
        {children?.(t)}
      </>
    )}
  </Pix>
);

// 2 · Debut card
const E1Title: React.FC = () => (
  <EraCard n={1} title={["THE FLASHY", "WINGER"]} years="2003–2006" look={RONALDO.y2003}>
    {(t) => <Box t={t} at={1.3} lines={["DEBUT · 20 AUG 2003", "v KAZAKHSTAN · AGE 18"]} bg="#141414" fg={P.gold} y={530} size={24} />}
  </EraCard>
);

// 3 · Stepovers
const E1Tricks: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.white], "e1t");
      const x = 40 + Math.min(t, 3.2) * 22;
      const def = 128 - Math.max(0, t - 3.2) * 8;
      player(c, def, 268, OPP, "stand", 0, 3, true);
      const step = Math.floor(t * 5) % 2 === 0;
      player(c, x, 270, RONALDO.y2003, t < 3.2 ? "run" : "stand", t * (step ? 14 : 10), 3);
      const bx = t < 3.3 ? x + 9 : x + 9 + (t - 3.3) * 60;
      const by = t < 3.3 ? 268 : 268 - (t - 3.3) * 50;
      ball(c, bx, by);
      // stepover trail
      for (let i = 1; i < 5; i++) if (t < 3.2) px(c, x - i * 6, 266 + (i % 2) * 2, 3, 1, "#ffd23a88");
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="ERA 1 · THE FLASHY WINGER" />
        <Name t={t} x={40 + Math.min(t, 3.2) * 22} y={180} text="RONALDO 17" bg="#d7262e" />
        <Box t={t} at={0.4} until={1.2} lines={["STEPOVER!"]} x={540} y={700} size={30} />
        <Box t={t} at={1.0} until={1.8} lines={["STEPOVER!"]} x={140} y={820} size={30} />
        <Box t={t} at={1.6} until={2.6} lines={["FLICK!"]} x={600} y={900} size={30} />
        <Box t={t} at={3.4} lines={["END PRODUCT?"]} bg="#ff3d7f" fg="#fff" x={60} y={300} size={36} />
      </>
    )}
  </Pix>
);

// 4 · Euro 2004 final
const E1Euro: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.red, P.white], "e04");
      for (let i = 0; i < 4; i++) player(c, 18 + i * 22, 226 + (i % 2) * 6, GREECE, "celebrate", t * 6 + i, 2);
      player(c, 124, 244, RONALDO.y2003, t > 2.0 ? "cry" : "stand", 0, 4);
      if (t > 2.0) confetti(c, t, 2.0, [P.white, P.greece]);
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="REAL LIFE · 4 JULY 2004" />
        <Score t={t} at={0.2} a={["POR", P.red]} b={["GRE", P.greece]} score="0 - 1" cap="EURO 2004 FINAL · LISBON" />
        <Name t={t} at={2.0} x={124} y={122} text="RONALDO" bg="#d7262e" />
        <Name t={t} at={1.0} x={40} y={168} text="GREECE" bg="#1f5fd1" />
      </>
    )}
  </Pix>
);

// 5 · Era 2 card + captain armband
const E2Title: React.FC = () => (
  <EraCard n={2} title={["THE GOALSCORING", "WINGER"]} years="2007–2011" look={RONALDO.y2008}>
    {(t) => <Box t={t} at={3.45} lines={["CAPTAIN", "FROM 2008"]} bg="#141414" fg={P.gold} y={530} size={30} />}
  </EraCard>
);

// 6 · Free kick / header / long shot (three quick panels)
const E2Goals: React.FC = () => (
  <Pix
    draw={(c, t) => {
      sky(c, t, 60);
      crowd(c, 30, 110, [P.red, P.green, P.white], t, "e2g", t > 0.9 ? 1 : 0);
      pitch(c, 114);
      goal(c, 90, 150, 110, 34);
      if (t < 1.1) {
        // free kick: wall + dipping ball
        for (let i = 0; i < 4; i++) player(c, 70 + i * 13, 215, OPP, "stand", 0, 2);
        player(c, 90, 300, RONALDO.y2008, "back", 0, 3);
        const p = cl((t - 0.15) / 0.7);
        ball(c, 90 + p * 40, 280 - p * 150 + Math.sin(p * Math.PI) * -30 + p * p * 20);
      } else if (t < 1.75) {
        // header
        const p = cl((t - 1.15) / 0.45);
        player(c, 88, 230, RONALDO.y2008, "header", 0, 3);
        ball(c, 88 + p * 22, 140 + 52 - p * 40);
      } else {
        // long shot
        player(c, 60, 300, RONALDO.y2008, "kick", t * 10, 3);
        const p = cl((t - 1.85) / 0.6);
        ball(c, 66 + p * 64, 296 - p * 160);
        for (let i = 1; i < 6; i++) if (p > 0 && p < 1) px(c, 66 + (p - i * 0.04) * 64, 296 - (p - i * 0.04) * 160, 2, 2, "#ffd23a66");
      }
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="ERA 2 · THE GOALSCORING WINGER" />
        <Box t={t} at={0.85} until={1.1} lines={["GOAL!"]} center y={420} size={56} />
        <Box t={t} at={1.55} until={1.75} lines={["GOAL!"]} center y={420} size={56} />
        <Box t={t} at={2.45} lines={["GOAL!"]} center y={420} size={56} />
      </>
    )}
  </Pix>
);

// 7 · Era 3 card: less flash, more output
const E3Title: React.FC = () => (
  <EraCard n={3} title={["THE INSIDE", "FORWARD"]} years="2012–2017" look={RONALDO.y2016}>
    {(t) => (
      <div style={{ position: "absolute", left: 60, top: 530, fontFamily: PIX, fontSize: 24, color: "#f4f4f0", opacity: t > 0.8 ? 1 : 0 }}>
        <div style={{ marginBottom: 10 }}>FLASH</div>
        <div style={{ width: 360 * (1 - 0.6 * cl((t - 0.9) / 0.8)), height: 26, background: "#ff3d7f", boxShadow: "6px 6px 0 #000" }} />
        <div style={{ margin: "26px 0 10px" }}>OUTPUT</div>
        <div style={{ width: 160 + 300 * cl((t - 2.0) / 0.8), height: 26, background: "#4fd96a", boxShadow: "6px 6px 0 #000" }} />
      </div>
    )}
  </EraCard>
);

// 8 · Top-down: cutting inside from the left
const E3Cut: React.FC = () => (
  <Pix
    draw={(c, t) => {
      // top-down pitch
      for (let y = 0; y < 320; y += 16) px(c, 0, y, 180, 16, (y / 16) % 2 ? P.grass : P.grass2);
      px(c, 10, 30, 160, 1, P.line); // goal line
      px(c, 45, 30, 1, 50, P.line); px(c, 135, 30, 1, 50, P.line); px(c, 45, 80, 91, 1, P.line); // box
      px(c, 70, 30, 1, 18, P.line); px(c, 110, 30, 1, 18, P.line); px(c, 70, 48, 41, 1, P.line);
      px(c, 76, 26, 28, 4, P.white);
      px(c, 10, 30, 1, 290, P.line); px(c, 169, 30, 1, 290, P.line);
      // path: from the left wing diagonally inside, then shot
      const pts: [number, number][] = [[22, 250], [30, 190], [52, 140], [74, 100]];
      const p = cl((t - 0.3) / 2.4);
      const n = Math.floor(p * 40);
      for (let i = 0; i < n; i += 2) {
        const q = i / 40;
        const seg = Math.min(2, Math.floor(q * 3));
        const f = q * 3 - seg;
        const xx = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f;
        const yy = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f;
        px(c, xx, yy, 2, 2, P.gold);
      }
      const q = Math.min(p, 1);
      const seg = Math.max(0, Math.min(2, Math.floor(q * 3 - 1e-6)));
      const f = q * 3 - seg;
      const rx = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f;
      const ry = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f;
      px(c, rx - 3, ry - 3, 7, 7, P.red); px(c, rx - 2, ry - 2, 5, 5, "#ff6b72");
      // defenders
      [[40, 130], [70, 120], [100, 118], [126, 128]].forEach(([dx, dy]) => { px(c, dx - 3, dy - 3, 7, 7, "#f2f2f2"); });
      if (t > 2.8) {
        const s = cl((t - 2.8) / 0.4);
        for (let i = 0; i < 12; i++) if (i / 12 < s) px(c, 74 + (90 - 74) * (i / 12), 100 - (100 - 30) * (i / 12), 2, 2, "#ffffff");
      }
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="ERA 3 · INSIDE FORWARD" />
        <Box t={t} at={0.6} lines={["CUT INSIDE.", "FINISH."]} x={500} y={1100} size={34} />
      </>
    )}
  </Pix>
);

// 9 · Sweden play-off hat-trick
const E3Sweden: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, ["#f6d21c", "#1f5fd1", "#f6d21c"], "swe");
      player(c, 90, 242, RONALDO.y2016, t > 2.6 ? "siu" : "run", t * 10, 4);
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="REAL LIFE · 19 NOV 2013" />
        <Score t={t} at={0.1} a={["SWE", "#c9a400"]} b={["POR", P.red]} score="2 - 3" cap="WORLD CUP PLAY-OFF · 2ND LEG" />
        <div style={{ position: "absolute", left: 60, top: 520, display: "flex", gap: 22 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 70, height: 70, borderRadius: 0, background: t > 2.55 + i * 0.22 ? "#f4f4f0" : "#333", boxShadow: "6px 6px 0 #000", fontFamily: PIX, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#141414" }}>{i + 1}</div>
          ))}
        </div>
        <Box t={t} at={3.2} lines={["HAT-TRICK"]} bg={P.gold} y={640} size={34} />
      </>
    )}
  </Pix>
);

// 10 · Euro 2016: three goals, injury, touchline, Éder, trophy.
const E3Euro: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, "#1e3a8a", P.white], "e16", t > 9.6 ? 1 : 0);
      if (t < 3.8) {
        player(c, 90, 242, RONALDO.y2016, "celebrate", t * 6, 4);
      } else if (t < 6.3) {
        // injured: sits, head down
        player(c, 90, 246, RONALDO.y2016, "cry", 0, 4);
        px(c, 84, 223, 12, 4, "#ffffff"); // knee strapping
      } else if (t < 9.8) {
        // touchline: Ronaldo strapped, shouting; Éder shoots
        px(c, 0, 230, 180, 1, P.line);
        player(c, 34, 300, RONALDO.y2016, "point", t * 4, 3);
        px(c, 24, 282, 9, 3, "#ffffff");
        goal(c, 138, 214, 60, 22);
        const shoot = cl((t - 7.9) / 0.5);
        player(c, 104, 262, EDER, t < 7.9 ? "run" : "kick", t * 10, 2);
        if (t > 7.9) ball(c, 110 + shoot * 36, 258 - shoot * 54);
      } else {
        PORT_TEAM(4).forEach((lk, i) => player(c, 18 + i * 22 + (i > 1 ? 56 : 0), 276, lk, "celebrate", t * 6 + i, 2));
        player(c, 90, 286, RONALDO.y2016, "celebrate", t * 6, 3);
        px(c, 85, 268, 9, 3, "#ffffff");
        trophy(c, 90, 196 - Math.round(Math.abs(Math.sin(t * 6))) * 2, "euro");
        confetti(c, t, 9.8);
      }
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="EURO 2016" />
        <Box t={t} at={0.2} until={3.8} lines={["3 GOALS"]} y={250} size={48} />
        <Box t={t} at={0.9} until={3.8} lines={["2 v HUNGARY", "1 v WALES (SF)"]} bg="#141414" fg="#f4f4f0" y={380} size={24} />
        <Score t={t} at={3.8} until={9.8} a={["POR", P.red]} b={["FRA", "#1e3a8a"]} score={t < 8.4 ? "0 - 0" : "1 - 0"} cap={t < 6.3 ? "FINAL · 25' · INJURED" : t < 8.4 ? "FINAL · EXTRA TIME" : "FINAL · 109' · ÉDER"} />
        <Name t={t} at={6.3} until={9.8} x={34} y={186} text="RONALDO" bg="#d7262e" />
        <Name t={t} at={6.6} until={9.8} x={104} y={212} text="ÉDER" bg="#d7262e" />
        <Box t={t} at={9.9} lines={["PORTUGAL'S FIRST", "MAJOR TROPHY"]} y={250} size={36} />
      </>
    )}
  </Pix>
);

// 11 · Era 4 card
const E4Title: React.FC = () => (
  <EraCard n={4} title={["THE", "STRIKER"]} years="2018–2026" look={RONALDO.y2025} />
);

// 12 · Lives in the box: fewer touches, more movement, header goal.
const E4Box: React.FC = () => (
  <Pix
    draw={(c, t) => {
      sky(c, t, 60);
      crowd(c, 30, 110, [P.red, P.green, P.white], t, "e4b", t > 2.6 ? 1 : 0);
      pitch(c, 114);
      goal(c, 90, 150, 110, 34);
      px(c, 30, 196, 120, 1, P.line); px(c, 30, 150, 1, 46, P.line); px(c, 150, 150, 1, 46, P.line);
      // movement dots: darts into the box
      const p = cl((t - 0.3) / 1.6);
      for (let i = 0; i < 8; i++) if (i / 8 < p) px(c, 130 - i * 5, 270 - i * 9, 2, 2, P.gold);
      const rx = 130 - p * 40;
      const ry = 270 - p * 72;
      player(c, rx, ry, RONALDO.y2025, t > 2.0 && t < 2.8 ? "header" : p < 1 ? "run" : "stand", t * 10, 3);
      if (t > 1.6) {
        const q = cl((t - 1.6) / 0.5);
        const r = cl((t - 2.2) / 0.3);
        ball(c, 20 + q * (rx - 20), 200 - q * 30 - Math.sin(q * Math.PI) * 20 + (r > 0 ? 0 : 0));
        if (r > 0) ball(c, rx + r * 10, ry - 36 - r * 20);
      }
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="ERA 4 · THE STRIKER" />
        <Box t={t} at={0.1} lines={["FEWER TOUCHES"]} bg="#141414" fg="#f4f4f0" y={250} size={30} />
        <Box t={t} at={1.0} lines={["MORE MOVEMENT"]} y={330} size={30} />
        <Box t={t} at={2.5} lines={["GOAL!"]} center y={460} size={56} />
      </>
    )}
  </Pix>
);

// 13 · Nations League 2019
const E4NL19: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.white], "nl19", t > 2.6 ? 1 : 0);
      if (t < 2.6) player(c, 90, 242, RONALDO.y2025, "siu", t * 6, 4);
      else {
        player(c, 90, 286, RONALDO.y2025, "celebrate", t * 6, 3);
        trophy(c, 90, 200, "nl");
        confetti(c, t, 2.6);
      }
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="NATIONS LEAGUE 2019" />
        <Score t={t} at={0.1} until={2.6} a={["POR", P.red]} b={["SUI", "#c4161c"]} score="3 - 1" cap="SEMI-FINAL · HAT-TRICK" />
        <Score t={t} at={2.6} a={["POR", P.red]} b={["NED", "#ef7d00"]} score="1 - 0" cap="FINAL · WINNERS" />
      </>
    )}
  </Pix>
);

// 14 · The record
const E4Record: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.white], "rec", t > 1.6 ? 1 : 0);
      player(c, 90, 246, RONALDO.y2025, t > 1.6 ? "siu" : "header", t * 6, 4);
    }}
  >
    {(t) => {
      const n = t < 0.8 ? 109 : t < 1.6 ? 110 : 111;
      return (
        <>
          <Tag t={t} at={0} text="REAL LIFE · 1 SEP 2021" />
          <Box t={t} at={0} lines={["INTERNATIONAL GOALS"]} bg="#141414" fg="#f4f4f0" y={250} size={26} />
          <Box t={t} at={0} lines={[`${n}`]} y={330} size={90} />
          <Box t={t} at={1.7} lines={["ALL-TIME RECORD", "(ALI DAEI: 109)"]} bg="#ff3d7f" fg="#fff" y={500} size={26} />
        </>
      );
    }}
  </Pix>
);

// 15 · Age 40, Nations League 2025 final
const E4NL25: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.white, P.spain], "nl25", t > 2.0 ? 1 : 0);
      if (t < 3.3) player(c, 90, 244, RONALDO.y2025, t > 1.0 ? "siu" : "run", t * 8, 4);
      else {
        player(c, 90, 286, RONALDO.y2025, "celebrate", t * 6, 3);
        trophy(c, 90, 200, "nl");
        confetti(c, t, 3.3);
      }
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="NATIONS LEAGUE 2025" />
        <Box t={t} at={0} until={1.0} lines={["AGE 40"]} y={250} size={60} />
        <Score t={t} at={1.0} until={3.3} a={["POR", P.red]} b={["ESP", P.spain]} score="2 - 2" cap="FINAL · RONALDO 61'" />
        <Box t={t} at={3.3} lines={["WON ON PENALTIES"]} y={250} size={34} />
      </>
    )}
  </Pix>
);

// 16 · Payoff: trophy shelf, 146, six World Cups.
const Payoff: React.FC = () => (
  <Pix
    draw={(c, t) => {
      // red curtains + shelf
      for (let x = 0; x < 180; x += 12) px(c, x, 0, 12, 320, (x / 12) % 2 ? "#6e1218" : "#8c1b22");
      px(c, 0, 0, 180, 6, "#3a0a0e");
      px(c, 10, 176, 160, 6, P.wood); px(c, 10, 182, 160, 3, P.wood2);
      const xs = [40, 90, 140];
      const kinds = ["euro", "nl", "nl"] as const;
      xs.forEach((x, i) => {
        const lit = t > 0.15 + i * 0.3 ? 1 : 0;
        spot(c, x, 10, 176, 34, lit);
        trophy(c, x, 176, kinds[i], lit);
      });
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="PORTUGAL · ALL-TIME" />
        {["EURO 2016", "NL 2019", "NL 2025"].map((s, i) => (
          <div key={s} style={{ position: "absolute", left: [40, 90, 140][i] * 6, top: 1150, transform: "translateX(-50%)", fontFamily: PIX, fontSize: 22, background: t > 0.15 + i * 0.3 ? P.gold : "#555", color: "#141414", padding: "8px 10px 6px", boxShadow: "5px 5px 0 #000", whiteSpace: "nowrap" }}>{s}</div>
        ))}
        <Box t={t} at={1.3} lines={["146 GOALS"]} y={250} size={56} />
        <Box t={t} at={2.0} lines={["234 CAPS"]} bg="#141414" fg="#f4f4f0" y={360} size={30} />
        {t > 5.1 && (
          <div style={{ position: "absolute", left: 60, right: 60, top: 1260, display: "flex", justifyContent: "space-between" }}>
            {["2006", "2010", "2014", "2018", "2022", "2026"].map((y, i) => (
              <div key={y} style={{ fontFamily: PIX, fontSize: 18, color: "#141414", background: t > 5.15 + i * 0.18 ? "#4fd96a" : "#333", padding: "10px 6px 8px", boxShadow: "5px 5px 0 #000" }}>{y}</div>
            ))}
          </div>
        )}
        <Box t={t} at={5.1} lines={["SCORED AT 6 WORLD CUPS"]} bg="#4fd96a" fg="#141414" y={480} size={26} />
      </>
    )}
  </Pix>
);

// 17 · CTA
const Cta: React.FC = () => (
  <Pix
    draw={(c, t) => {
      stadium(c, t, [P.red, P.green, P.white], "cta", 1);
      [RONALDO.y2003, RONALDO.y2008, RONALDO.y2016, RONALDO.y2025].forEach((lk, i) => player(c, 26 + i * 43, 262, lk, "siu", t * 5 + i, 3));
    }}
  >
    {(t) => (
      <>
        <Tag t={t} at={0} text="NEXT?" bg="#ff3d7f" />
        <Box t={t} at={0.2} lines={["WHICH PLAYER'S", "EVOLUTION NEXT?"]} center y={300} size={40} />
        <Box t={t} at={1.2} lines={["▶ COMMENT BELOW"]} bg="#141414" fg={P.gold} center y={480} size={28} />
      </>
    )}
  </Pix>
);

// ---------------------------------------------------------------- timeline
const SCENES: [number, number, React.FC][] = [
  [0, 10.25, Hook], [10.25, 16.55, E1Title], [16.55, 20.2, E1Tricks], [20.2, 26.9, E1Euro],
  [26.9, 33.15, E2Title], [33.15, 36.9, E2Goals], [36.9, 40.05, E3Title], [40.05, 44.4, E3Cut], [44.4, 49.7, E3Sweden],
  [49.7, 61.9, E3Euro], [61.9, 65.05, E4Title], [65.05, 68.8, E4Box], [68.8, 72.95, E4NL19], [72.95, 75.95, E4Record],
  [75.95, 80.5, E4NL25], [80.5, 88.0, Payoff], [88.0, END, Cta],
];
const CUTS = SCENES.slice(1).map(([a]) => a);

export const RonaldoPortugal: React.FC = () => {
  useFonts();
  const t = useCurrentFrame() / FPS;
  const flash = CUTS.reduce((m, c) => Math.max(m, t >= c && t < c + 0.1 ? 0.35 * (1 - (t - c) / 0.1) : 0), 0);
  return (
    <AbsoluteFill style={{ background: "#0d1530" }}>
      {SCENES.map(([a, b, S], i) => (
        <Sequence key={i} from={Math.round(a * FPS)} durationInFrames={Math.round((b - a) * FPS)}>
          <S />
        </Sequence>
      ))}
      {/* CRT scanlines + vignette */}
      <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 6px)" }} />
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.5) 100%)" }} />
      <Subs t={t} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
      <Audio src={staticFile("ronaldo-mix.wav")} />
    </AbsoluteFill>
  );
};
