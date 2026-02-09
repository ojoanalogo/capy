import React from "react";
import { AbsoluteFill } from "remotion";
import { CaptionedVideo } from "./captions";
import type { CompositionProps } from "./types";

export const CaptionedClip: React.FC<CompositionProps> = ({
  videoFile,
  videoSrc,
  captionsData,
  captionStyle,
  highlightWords,
  captionConfig,
  comicConfig,
  simpleConfig,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CaptionedVideo
        videoFile={videoFile}
        videoSrc={videoSrc}
        captionsData={captionsData}
        captionStyle={captionStyle}
        highlightWords={highlightWords}
        captionConfig={captionConfig}
        comicConfig={comicConfig}
        simpleConfig={simpleConfig}
      />
    </AbsoluteFill>
  );
};
