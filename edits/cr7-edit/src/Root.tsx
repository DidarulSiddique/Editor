import { Composition } from "remotion";
import { CR7Edit, TOTAL_FRAMES, EditProps } from "./CR7Edit";
import { Villain, VILLAIN_FRAMES } from "./Villain";
import clips from "./clips.json";

export const Root = () => (
  <>
    <Composition
      id="CR7Edit"
      component={CR7Edit}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={clips as EditProps}
    />
    <Composition
      id="Villain"
      component={Villain}
      durationInFrames={VILLAIN_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={clips as EditProps}
    />
  </>
);
