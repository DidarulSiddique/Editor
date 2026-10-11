import { Composition } from "remotion";
import { FPS, FRAMES, MessiEdit } from "./MessiEdit";
import { MessiV2 } from "./MessiV2";

export const Root = () => (
  <>
    <Composition id="MessiEdit" component={MessiEdit} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="MessiV2" component={MessiV2} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
  </>
);
