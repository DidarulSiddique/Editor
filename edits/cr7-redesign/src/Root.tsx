import { Composition } from "remotion";
import { FPS, FRAMES, H, Redesign, W } from "./Redesign";

export const Root = () => <Composition id="Redesign" component={Redesign} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />;
