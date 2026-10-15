import { Composition } from "remotion";
import { SHOWCASE, Showcase } from "./showcase/Showcase";
import * as PE from "./templates/player-edit/PlayerEdit";
import * as GE from "./templates/gallery-edit/GalleryEdit";

export const Root = () => (
  <>
    <Composition id="GalleryEdit" component={GE.GalleryEdit} durationInFrames={GE.FRAMES} fps={GE.FPS} width={GE.W} height={GE.H} />
    <Composition id="PlayerEdit" component={PE.PlayerEdit} durationInFrames={PE.FRAMES} fps={PE.FPS} width={PE.W} height={PE.H} />
    <Composition id="Showcase" component={Showcase} durationInFrames={Math.round(SHOWCASE.dur * SHOWCASE.fps)} fps={SHOWCASE.fps} width={SHOWCASE.w} height={SHOWCASE.h} />
  </>
);
