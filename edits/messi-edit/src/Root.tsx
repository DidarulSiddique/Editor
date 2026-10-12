import { Composition } from "remotion";
import { FPS, FRAMES, MessiEdit } from "./MessiEdit";
import { MessiV2 } from "./MessiV2";
import * as V3 from "./MessiV3";

export const Root = () => (
  <>
    <Composition id="MessiEdit" component={MessiEdit} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="MessiV2" component={MessiV2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="MessiV3" component={V3.MessiV3} durationInFrames={V3.FRAMES} fps={V3.FPS} width={V3.W} height={V3.H} />
  </>
);
