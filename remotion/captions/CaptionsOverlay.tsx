import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";
import type { CaptionConfig, CaptionMode } from "../../src/types/captions";
import { ComicCaption } from "./ComicCaption";
import { SimpleCaption } from "./SimpleCaption";
import { DitheringPattern } from "./DitheringPattern";
import { PAGE_COMBINE_MS } from "../../src/lib/constants";

/** Convert static-mode captions into synthetic TikTokPages.
 *  Splits each phrase into per-word tokens (all sharing the same timing)
 *  so highlight-word matching works on individual words. */
export function captionsToSyntheticPages(captions: Caption[]): TikTokPage[] {
  return captions.map((c) => {
    const words = c.text.split(/(\s+)/);
    const tokens = words
      .filter((w) => w.trim().length > 0)
      .map((w) => ({ text: w, fromMs: c.startMs, toMs: c.endMs }));
    return {
      text: c.text,
      startMs: c.startMs,
      durationMs: c.endMs - c.startMs,
      tokens: tokens.length > 0 ? tokens : [{ text: c.text, fromMs: c.startMs, toMs: c.endMs }],
    };
  });
}

export interface CaptionsOverlayProps extends Record<string, unknown> {
  captionsData: Caption[];
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
  captionMode = "karaoke",
  comicConfig,
  simpleConfig,
}) => {
  const { fps } = useVideoConfig();

  const pageCombineMs = captionConfig?.pageCombineMs ?? PAGE_COMBINE_MS;

  const pages = useMemo(
    () =>
      captionMode === "static"
        ? captionsToSyntheticPages(captionsData)
        : createTikTokStyleCaptions({
            captions: captionsData,
            combineTokensWithinMilliseconds: pageCombineMs,
          }).pages,
    [captionsData, pageCombineMs, captionMode],
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
