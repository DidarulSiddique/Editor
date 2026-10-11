import { Composition } from "remotion";
import { Floodlights, FPS, FRAMES } from "./Floodlights";

export const Root = () => (
  <Composition id="Floodlights" component={Floodlights} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
);
