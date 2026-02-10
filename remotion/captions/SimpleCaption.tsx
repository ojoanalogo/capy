import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { TikTokToken } from "@remotion/captions";
import type { CaptionConfig } from "../../src/types/captions";
import { getFontFamily } from "./fonts";

interface SimpleCaptionProps {
  tokens: TikTokToken[];
  startMs: number;
  pageIndex?: number;
  highlightWords?: string[];
  captionConfig?: CaptionConfig;
  config?: {
    fontSize?: number;
    textColor?: string;
    shadowColor?: string;
  };
}

const REFERENCE_WIDTH = 1080;
const BASE_FONT_SIZE = 54;

export const SimpleCaption: React.FC<SimpleCaptionProps> = ({
  tokens,
  startMs,
  pageIndex = 0,
  highlightWords = [],
  captionConfig,
  config = {},
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const s = width / REFERENCE_WIDTH;

  const fontSize = Math.round((captionConfig?.fontSize ?? config.fontSize ?? BASE_FONT_SIZE) * s);
  const textColor = captionConfig?.textColor ?? config.textColor ?? "#FFFFFF";
  const shadowColor = captionConfig?.shadowColor ?? config.shadowColor ?? "#000000";
  const shadowBlur = captionConfig?.shadowBlur ?? 4;
  const highlightColor = captionConfig?.highlightColor ?? "#FFD700";
  const highlightScale = captionConfig?.highlightScale ?? 1.05;
  const uppercase = captionConfig?.uppercase ?? false;
  const bottomOffset = captionConfig?.bottomOffset ?? 15;
  const leftRightPadding = captionConfig?.leftRightPadding ?? 7.5;
  const verticalAlign = captionConfig?.verticalAlign ?? "bottom";
  const horizontalAlign = captionConfig?.horizontalAlign ?? "center";
  const showBackground = captionConfig?.showBackground ?? false;
  const bgColors = captionConfig?.backgroundColors ?? [];
  const bgColor = bgColors.length > 0 ? bgColors[pageIndex % bgColors.length]! : captionConfig?.backgroundColor ?? "transparent";
  const strokeColor = captionConfig?.strokeColor ?? "transparent";
  const strokeWidth = captionConfig?.strokeWidth ?? 0;
  const fontFamily = captionConfig?.fontFamily ?? "inter";
  const letterSpacing = captionConfig?.letterSpacing ?? 0;
  const lineHeight = captionConfig?.lineHeight ?? 1.4;
  const fontWeight = captionConfig?.fontWeight ?? 500;
  const wordSpacing = captionConfig?.wordSpacing ?? 6;
  const animationStyle = captionConfig?.animationStyle ?? "fade";
  const animationIntensity = (captionConfig?.animationIntensity ?? 100) / 100;

  const resolvedFontFamily = getFontFamily(fontFamily);

  const highlightSet = new Set(highlightWords.map((w) => w.toLowerCase()));

  // Entrance animation
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 120, mass: 0.6 },
  });

  let entranceTransform = "";
  let entranceOpacity = entranceProgress;

  if (animationStyle !== "none") {
    switch (animationStyle) {
      case "pop":
        entranceTransform = `scale(${interpolate(entranceProgress, [0, 1], [1 - 0.5 * animationIntensity, 1])})`;
        break;
      case "slam": {
        const slamY = interpolate(entranceProgress, [0, 1], [-40 * animationIntensity, 0]);
        entranceTransform = `translateY(${slamY}px)`;
        break;
      }
      case "shake": {
        const shakeDecay = Math.max(0, 1 - entranceProgress);
        const shakeX = Math.sin(frame * 2.5) * 6 * shakeDecay * animationIntensity;
        entranceTransform = `translateX(${shakeX}px)`;
        break;
      }
      case "swipe": {
        const swipeX = interpolate(entranceProgress, [0, 1], [80 * animationIntensity, 0]);
        entranceTransform = `translateX(${swipeX}px)`;
        break;
      }
      case "fade": {
        const translateY = interpolate(entranceProgress, [0, 1], [8 * animationIntensity, 0]);
        entranceTransform = `translateY(${translateY}px)`;
        break;
      }
    }
  } else {
    entranceOpacity = 1;
  }

  return (
    <div
      style={{
        position: "absolute",
        ...(verticalAlign === "top"
          ? { top: `${bottomOffset}%` }
          : verticalAlign === "center"
            ? { top: "50%" }
            : { bottom: `${bottomOffset}%` }),
        left: `${leftRightPadding}%`,
        right: `${leftRightPadding}%`,
        zIndex: 100,
        display: "flex",
        justifyContent:
          horizontalAlign === "left"
            ? "flex-start"
            : horizontalAlign === "right"
              ? "flex-end"
              : "center",
        opacity: entranceOpacity,
        transform: [
          verticalAlign === "center" ? "translateY(-50%)" : "",
          entranceTransform,
        ].filter(Boolean).join(" ") || undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: `0 ${Math.round(wordSpacing * s)}px`,
          ...(showBackground
            ? {
                backgroundColor: bgColor,
                border: strokeWidth > 0 ? `${Math.round(strokeWidth * s)}px solid ${strokeColor}` : "none",
                borderRadius: Math.round(8 * s),
                padding: `${Math.round(10 * s)}px ${Math.round(18 * s)}px`,
              }
            : {}),
        }}
      >
        {tokens.map((token, i) => {
          const isActive =
            currentTimeMs >= token.fromMs - startMs &&
            currentTimeMs < token.toMs - startMs;

          const word = token.text.trim().toLowerCase();
          const isHighlighted = highlightSet.has(word);

          return (
            <span
              key={i}
              style={{
                fontFamily: resolvedFontFamily,
                fontSize,
                fontWeight: isHighlighted && isActive ? Math.min(900, fontWeight + 200) : fontWeight,
                color: isHighlighted && isActive ? highlightColor : textColor,
                textShadow: `1px 1px ${shadowBlur}px ${shadowColor}, -1px -1px ${shadowBlur}px ${shadowColor}, 0 0 ${shadowBlur * 2}px ${shadowColor}80`,
                textTransform: uppercase ? "uppercase" : "none",
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? `scale(${highlightScale})` : "scale(1)",
                transition: "opacity 0.1s, transform 0.1s",
                lineHeight,
                letterSpacing: letterSpacing * s,
              }}
            >
              {token.text.trim()}
            </span>
          );
        })}
      </div>
    </div>
  );
};
