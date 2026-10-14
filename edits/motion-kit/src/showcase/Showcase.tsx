import React from "react";
import { AbsoluteFill, Easing, Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "@fontsource/anton/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/instrument-serif/400-italic.css";
import {
  Atmos,
  Aura,
  Accents,
  Bracket,
  Callout,
  CharRise,
  DiagonalWipe,
  DrawPath,
  FlashIn,
  Footage,
  Glass,
  Grain,
  HitCamera,
  KitDefs,
  MaskWord,
  MorphScene,
  OutlineWord,
  Ribbons,
  Ring,
  SpokenLine,
  THEMES,
  Tracked,
  Vignette,
  Whip,
  ZoomOut,
  morphLayout,
  progress,
} from "../kit";

// Internal test composition: renders every kit component once so a change
// to the kit can be checked visually (bible §Technical: "a component is not
// done until it renders"). Not a deliverable.
export const SHOWCASE = { fps: 60, w: 1920, h: 1080, dur: 8.6 };
const th = THEMES.neon;
const [A1, A2, A3] = th.accents;

const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

// 1 — title card over footage: Footage (whip + push) · Ribbons · Accents · MaskWord · Tracked
const TitleScene: React.FC = () => {
  const t = useT();
  return (
    <Whip dur={2.2} dirIn={1} dirOut={0}>
      <Footage src="clip-a.mp4" keys={[[0, 0.1], [2.2, 1.0]]} zoom={[[0, 1.04], [2.2, 1.12]]} focus={[0.5, 0.6]} grade={th.footageFilter} whip={false} />
      <Vignette />
      <Atmos color={A1} amount={1} />
      <Ribbons t={t} label="MOTION KIT" color={A1} out={2.0} font={th.fonts.display} />
      <Accents t={t} color={A1} seed="kit" until={2.0} w={1920} h={1080} items={[{ x: 1500, y: 140, k: "plus" }, { x: 1700, y: 520, k: "ring" }, { x: 1250, y: 880, k: "zig" }, { x: 420, y: 980, k: "tri" }]} />
      <div style={{ position: "absolute", left: 90, top: 80 }}>
        <div style={{ position: "absolute", left: -40, top: -20, width: 1000, height: 300, background: "linear-gradient(90deg, rgba(8,8,14,0.92) 0%, rgba(8,8,14,0.85) 55%, rgba(8,8,14,0) 100%)" }} />
        <div style={{ position: "relative" }}>
          <Tracked text="Component showcase · 01" t={t} at={0.1} font={th.fonts.ui} size={20} />
          <MaskWord text="MOTION KIT" t={t} at={0.15} size={150} font={th.fonts.display} glowColor={A1} skew={-8} style={{ marginTop: 6 }} />
          <Tracked text="Typography · ribbons · whip" t={t} at={0.35} font={th.fonts.ui} size={24} weight={900} />
        </div>
      </div>
    </Whip>
  );
};

// 2 — freeze-frame annotation: DiagonalWipe · Footage remap freeze · Ring · DrawPath · Bracket · Callout
const AnnotateScene: React.FC = () => {
  const t = useT();
  const a = 0.45;
  return (
    <DiagonalWipe color={A3}>
      <Footage
        src="clip-b.mp4"
        keys={[[0, 0.1], [0.4, 0.3], [1.5, 0.3], [2.4, 0.95]]}
        zoom={[[0, 1.02], [0.4, 1.02], [0.75, 1.14], [1.5, 1.14], [1.9, 1.02]]}
        focus={[0.45, 0.7]}
        grade={th.footageFilter}
        whip={false}
      >
        {(lt) => (
          <AbsoluteFill style={{ opacity: lt > a - 0.05 && lt < 1.55 ? 1 : 0 }}>
            <svg width={1920} height={1080} style={{ position: "absolute" }}>
              <Ring x={794} y={840} r={42} p={progress(lt, a, 0.2)} color={A3} t={lt} />
              <DrawPath d="M830 810 Q1300 480 1700 380" p={progress(lt, a + 0.1, 0.45)} color={A3} />
              <Bracket box={[1180, 120, 1500, 760]} p={progress(lt, a + 0.5, 0.25)} color="#fff" />
            </svg>
            <Callout x={1250} y={300} text="FREEZE · ANNOTATE" p={progress(lt, a + 0.4, 0.25)} color={A3} font={th.fonts.ui} />
          </AbsoluteFill>
        )}
      </Footage>
      <Vignette />
    </DiagonalWipe>
  );
};

// 3 — morphing glass card on an aura background: morphLayout · Glass · SpokenLine · OutlineWord · ZoomOut
const CARD: MorphScene[] = [
  [-1, { cx: 960, cy: 540, w: 1600, h: 900, r: 0, ry: 0, z: 1 }, { cx: 960, cy: 540, w: 1600, h: 900, r: 0, ry: 0, z: 1 }],
  [0, { cx: 600, cy: 470, w: 900, h: 506, r: 34, ry: 10, z: 1.05 }, { cx: 600, cy: 470, w: 900, h: 506, r: 34, ry: 4, z: 1.12 }],
  [1.2, { cx: 660, cy: 540, w: 520, h: 860, r: 44, ry: -6, z: 1.3 }, { cx: 660, cy: 540, w: 520, h: 860, r: 44, ry: 0, z: 1.36 }],
];
const CardScene: React.FC = () => {
  const t = useT();
  const l = morphLayout(t, CARD, 0.42, Easing.bezier(0.7, 0, 0.18, 1), Easing.inOut(Easing.sin));
  const cover = Math.max(l.w / 1920, l.h / 1080) * l.z;
  return (
    <ZoomOut dur={2.4}>
      <AbsoluteFill style={{ background: th.bg }}>
        <Aura t={t} colors={[A2, A3]} w={1920} h={1080} />
        <OutlineWord text="KIT" t={t} at={0.1} until={2.4} font={th.fonts.display} color={A2} size={520} style={{ position: "absolute", left: 0, right: 0, top: 160 }} />
        <div
          style={{
            position: "absolute",
            left: l.cx - l.w / 2,
            top: l.cy - l.h / 2,
            width: l.w,
            height: l.h,
            borderRadius: l.r,
            overflow: "hidden",
            transform: `perspective(1600px) rotateY(${l.ry}deg)`,
            boxShadow: `0 40px 120px rgba(0,0,0,0.55), 0 0 60px ${A2}55`,
            border: "2px solid rgba(255,255,255,0.38)",
          }}
        >
          <Freeze frame={Math.round((0.4 + t * 0.6) * 60)}>
            <OffthreadVideo src={staticFile("clip-c.mp4")} muted style={{ position: "absolute", left: (l.w - 1920 * cover) * 0.45, top: (l.h - 1080 * cover) * 0.75, width: 1920 * cover, height: 1080 * cover, filter: th.footageFilter }} />
          </Freeze>
        </div>
        <div style={{ position: "absolute", left: 1130, top: 330, width: 700 }}>
          <Glass style={{ borderRadius: 999, padding: "12px 26px", display: "inline-flex", gap: 12, alignItems: "center", marginBottom: 30, opacity: progress(t, 0.2, 0.4) }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: A2 }} />
            <span style={{ fontFamily: th.fonts.ui, fontWeight: 900, fontSize: 22, letterSpacing: "0.3em", color: "#fff" }}>GLASS · MORPH · SYNC</span>
          </Glass>
          <SpokenLine
            t={t}
            ui={th.fonts.ui}
            serif={th.fonts.serif}
            accent={A2}
            size={54}
            phrases={[
              { t0: 0.35, t1: 1.2, text: "One card that *morphs*" },
              { t0: 1.25, t1: 2.1, text: "between every *layout.*" },
            ]}
          />
        </div>
      </AbsoluteFill>
    </ZoomOut>
  );
};

// 4 — end card: CharRise · Tracked · FlashIn
const EndScene: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: th.bg, alignItems: "center", justifyContent: "center" }}>
      <Aura t={t + 3} colors={[A1, A2]} w={1920} h={1080} opacity={0.4} />
      <CharRise text="SHOWCASE" t={t} at={0.05} size={230} font={th.fonts.display} shadow={`0 0 30px ${A1}aa`} />
      <div style={{ marginTop: 16 }}>
        <Tracked text="Every kit component, rendered" t={t} at={0.5} font={th.fonts.ui} size={26} color="#ffffffcc" />
      </div>
      <FlashIn />
    </AbsoluteFill>
  );
};

export const Showcase: React.FC = () => (
  <AbsoluteFill style={{ background: th.bg }}>
    <KitDefs />
    <HitCamera hits={[2.2, 4.6, 7.0]} bigHits={[4.6]}>
      {/* scenes overlap by the incoming transition's length: a wipe must reveal over the outgoing picture, never over black */}
      <Sequence durationInFrames={Math.round(2.65 * 60)}>
        <TitleScene />
      </Sequence>
      <Sequence from={Math.round(2.2 * 60)} durationInFrames={Math.round(2.4 * 60)}>
        <AnnotateScene />
      </Sequence>
      <Sequence from={Math.round(4.6 * 60)} durationInFrames={Math.round(2.4 * 60)}>
        <CardScene />
      </Sequence>
      <Sequence from={Math.round(7.0 * 60)} durationInFrames={Math.round(1.6 * 60)}>
        <EndScene />
      </Sequence>
    </HitCamera>
    <Grain />
  </AbsoluteFill>
);
