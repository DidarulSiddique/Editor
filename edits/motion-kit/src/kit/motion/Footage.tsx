import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ease, RemapKey, remap } from "../utils/time";
import { motionBlur } from "../components/Defs";

export type ZoomKey = [number, number]; // [local sec, zoom]

// A clip, time-remapped (speed ramps / freezes) and zoomed about a focus
// point. Children receive local time and are drawn INSIDE the zoom transform
// in source-frame pixels, so annotations stay pinned to the picture.
//
//   <Footage src="clip.mp4" keys={[[0,1.2],[1,1.5],[2,1.5],[3,3.0]]}  // 0.5x, freeze 1s, 1.5x
//            zoom={[[0,1.04],[1,1.2]]} focus={[0.6,0.7]} whip="x" grade={theme.footageFilter}>
//     {(t) => <Ring ... />}
//   </Footage>
export const Footage: React.FC<{
  src: string;
  keys: RemapKey[];
  zoom?: ZoomKey[];
  focus?: [number, number];
  /** source frame size in px (for children's coordinate space) */
  size?: [number, number];
  /** entry whip: directional blur + scale that settles over ~9 frames */
  whip?: "x" | "y" | false;
  grade?: string;
  /** time offset added to the local clock (when a Sequence starts mid-section) */
  t0?: number;
  style?: React.CSSProperties;
  children?: (t: number) => React.ReactNode;
}> = ({ src, keys, zoom = [[0, 1]], focus = [0.5, 0.5], size, whip = "x", grade, t0 = 0, style, children }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [sw, sh] = size ?? [width, height];
  const t = t0 + f / fps;
  const st = remap(t, keys);
  const z = zoom.length > 1 ? interpolate(t, zoom.map((k) => k[0]), zoom.map((k) => k[1]), { ...clamp, easing: ease.drift }) : zoom[0][1];
  const w = whip ? interpolate(f, [0, 9], [1, 0], { ...clamp, easing: ease.settle }) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000", ...style }}>
      <AbsoluteFill
        style={{
          transform: `scale(${z * (1 + 0.14 * w)})`,
          transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
          filter: w > 0.15 && whip ? motionBlur(w * 60, whip) : undefined,
        }}
      >
        <Freeze frame={Math.max(0, Math.round(st * fps))}>
          <OffthreadVideo src={staticFile(src)} muted style={{ width: sw, height: sh, filter: grade }} />
        </Freeze>
        {children?.(t)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
