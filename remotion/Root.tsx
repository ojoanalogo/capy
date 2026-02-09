import { Composition, staticFile } from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { CaptionedClip } from "./CaptionedReel";
import type { CompositionProps } from "./types";

const FPS = 30;

const DEFAULT_PROPS: CompositionProps = {
  videoFile: "porno.mp4",
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="CaptionedClip"
        component={CaptionedClip}
        defaultProps={DEFAULT_PROPS}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={30 * FPS}
        calculateMetadata={async ({ props }) => {
          const { durationInSeconds, width, height } = await getVideoMetadata(
            staticFile(`videos/${props.videoFile}`),
          );
          return {
            durationInFrames: Math.ceil(durationInSeconds * FPS),
            width,
            height,
          };
        }}
      />
    </>
  );
};
