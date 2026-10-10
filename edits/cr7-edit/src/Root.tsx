import { Composition } from "remotion";
import { CR7Edit, TOTAL_FRAMES, EditProps } from "./CR7Edit";
import clips from "./clips.json";

export const Root = () => (
  <Composition
    id="CR7Edit"
    component={CR7Edit}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={clips as EditProps}
  />
);
