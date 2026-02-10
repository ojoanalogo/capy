import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useVideoConfig,
  delayRender,
  continueRender,
} from "remotion";
import { Video } from "@remotion/media";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import type { CaptionConfig, CaptionMode } from "../../src/types/captions";
import { ComicCaption } from "./ComicCaption";
import { SimpleCaption } from "./SimpleCaption";
import { DitheringPattern } from "./DitheringPattern";
import { captionsToSyntheticPages } from "./CaptionsOverlay";
import { PAGE_COMBINE_MS } from "../../src/lib/constants";

export interface CaptionedVideoProps extends Record<string, unknown> {
  videoFile: string;
  videoSrc?: string;
  captionsData?: Caption[];
  captionStyle?: "comic" | "simple";
  highlightWords?: string[];
  captionConfig?: CaptionConfig;
  captionMode?: CaptionMode;
  comicConfig?: { colors?: string[]; fontSize?: number };
  simpleConfig?: {
    fontSize?: number;
    textColor?: string;
    shadowColor?: string;
  };
}

function getRotation(pageIndex: number, maxDeg = 2): number {
  if (maxDeg === 0) return 0;
  // Deterministic pseudo-random pattern scaled to maxDeg
  const pattern = [-0.75, 0.5, -1, 0.25, 0.75, -0.5, 1, -0.25];
  return pattern[pageIndex % pattern.length]! * maxDeg;
}

export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({
  videoFile,
  videoSrc: videoSrcProp,
  captionsData,
  captionStyle = "comic",
  highlightWords = [],
  captionConfig,
  captionMode = "karaoke",
  comicConfig,
  simpleConfig,
}) => {
  const { fps } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[]>(captionsData ?? []);
  const needsFetch = !captionsData;
  const [handle] = useState(() =>
    needsFetch ? delayRender(`Loading captions for ${videoFile}`) : null,
  );

  const captionBaseName = videoFile.replace(/\.[^.]+$/, "");

  useEffect(() => {
    if (captionsData) {
      setCaptions(captionsData);
    }
  }, [captionsData]);

  useEffect(() => {
    if (!needsFetch || handle === null) return;
    const url = staticFile(`videos/captions/${captionBaseName}.json`);

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          setCaptions([]);
          continueRender(handle);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setCaptions(data as Caption[]);
        continueRender(handle);
      })
      .catch(() => {
        setCaptions([]);
        continueRender(handle);
      });
  }, [captionBaseName, handle, needsFetch]);

  const resolvedVideoSrc = videoSrcProp || staticFile(`videos/${videoFile}`);

  const pageCombineMs = captionConfig?.pageCombineMs ?? PAGE_COMBINE_MS;

  const pages = useMemo(
    () =>
      captionMode === "static"
        ? captionsToSyntheticPages(captions)
        : createTikTokStyleCaptions({
            captions,
            combineTokensWithinMilliseconds: pageCombineMs,
          }).pages,
    [captions, pageCombineMs, captionMode],
  );

  // Determine effective style
  const effectiveStyle = captionConfig
    ? captionConfig.fontFamily === "comic"
      ? "comic"
      : "simple"
    : captionStyle;

  const showDithering = captionConfig
    ? captionConfig.showDithering
    : effectiveStyle === "comic";

  return (
    <AbsoluteFill>
      <Video
        src={resolvedVideoSrc}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {showDithering && <DitheringPattern />}
      {pages.map((page, i) => {
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const lastToken = page.tokens[page.tokens.length - 1];
        const actualEndMs = lastToken
          ? lastToken.toMs
          : page.startMs + page.durationMs;
        const actualDurationMs = actualEndMs - page.startMs;
        const durationFrames = Math.max(
          1,
          Math.round((actualDurationMs / 1000) * fps),
        );
        return (
          <Sequence key={i} from={startFrame} durationInFrames={durationFrames}>
            {effectiveStyle === "simple" ? (
              <SimpleCaption
                tokens={page.tokens}
                startMs={page.startMs}
                pageIndex={i}
                highlightWords={highlightWords}
                captionConfig={captionConfig}
                config={simpleConfig}
              />
            ) : (
              <ComicCaption
                tokens={page.tokens}
                startMs={page.startMs}
                rotation={
                  captionConfig?.rotation
                    ? getRotation(i, captionConfig.rotationMax ?? 2)
                    : effectiveStyle === "comic"
                      ? getRotation(i, 2)
                      : 0
                }
                pageIndex={i}
                highlightWords={highlightWords}
                captionConfig={captionConfig}
                config={comicConfig}
              />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
