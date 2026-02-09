import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";
import type { CaptionConfig } from "../../src/types/captions";
import { ComicCaption } from "./ComicCaption";
import { SimpleCaption } from "./SimpleCaption";
import { DitheringPattern } from "./DitheringPattern";
import { PAGE_COMBINE_MS } from "../../src/lib/constants";

export interface CaptionsOverlayProps extends Record<string, unknown> {
  captionsData: Caption[];
  captionStyle?: "comic" | "simple";
  highlightWords?: string[];
  captionConfig?: CaptionConfig;
  comicConfig?: { colors?: string[]; fontSize?: number };
  simpleConfig?: {
    fontSize?: number;
    textColor?: string;
    shadowColor?: string;
  };
}

function getRotation(pageIndex: number, maxDeg = 2): number {
  if (maxDeg === 0) return 0;
  const pattern = [-0.75, 0.5, -1, 0.25, 0.75, -0.5, 1, -0.25];
  return pattern[pageIndex % pattern.length]! * maxDeg;
}

/**
 * Renders only the captions overlay (no video).
 * Used by the Player preview in the editor, layered on top of an HTML5 <video>.
 */
export const CaptionsOverlay: React.FC<CaptionsOverlayProps> = ({
  captionsData,
  captionStyle = "comic",
  highlightWords = [],
  captionConfig,
  comicConfig,
  simpleConfig,
}) => {
  const { fps } = useVideoConfig();

  const pageCombineMs = captionConfig?.pageCombineMs ?? PAGE_COMBINE_MS;

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions: captionsData,
        combineTokensWithinMilliseconds: pageCombineMs,
      }),
    [captionsData, pageCombineMs],
  );

  // Determine effective style from captionConfig or legacy prop
  // Comic-like presets use ComicCaption (Bangers font, background box)
  // All others use SimpleCaption (Inter font, shadow-based)
  const effectiveStyle = captionConfig
    ? (captionConfig.fontFamily === "comic" ? "comic" : "simple")
    : captionStyle;

  const showDithering = captionConfig
    ? captionConfig.showDithering
    : effectiveStyle === "comic";

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
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
                rotation={captionConfig?.rotation ? getRotation(i, captionConfig.rotationMax ?? 2) : 0}
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
