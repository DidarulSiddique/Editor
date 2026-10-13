import { Composition } from "remotion";
import { Dribbling, FPS, FRAMES, H, W } from "./Dribbling";

export const Root = () => <Composition id="Dribbling" component={Dribbling} durationInFrames={FRAMES} fps={FPS} width={W} height={H} />;
