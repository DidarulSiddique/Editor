import { Composition } from "remotion";
import { FPS, FRAMES, MessiEdit } from "./MessiEdit";

export const Root = () => (
  <Composition id="MessiEdit" component={MessiEdit} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
);
