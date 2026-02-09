import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { TikTokToken } from "@remotion/captions";
import type { CaptionConfig, AnimationStyle } from "../../src/types/captions";
import { comicFont } from "./fonts";
import { DITHERING_PATTERN_ID } from "./DitheringPattern";

interface ComicCaptionProps {
  tokens: TikTokToken[];
  startMs: number;
  rotation?: number;
  pageIndex?: number;
  highlightWords?: string[];
  captionConfig?: CaptionConfig;
  config?: { colors?: string[]; fontSize?: number };
}

const CAPTION_COLORS = ["#FFD700", "#3B82F6", "#EF4444", "#22C55E"];

const REFERENCE_WIDTH = 1080;
const BASE_FONT_SIZE = 62;
const MIN_FONT_SIZE = 38;
const LONG_TEXT_THRESHOLD = 35;

const CYCLING_ANIMATIONS: AnimationStyle[] = ["pop", "slam", "shake", "swipe"];

function getFontSize(text: string, scale: number, baseSize: number = BASE_FONT_SIZE): number {
  const len = text.length;
  const base = len <= LONG_TEXT_THRESHOLD
    ? baseSize
    : Math.max(MIN_FONT_SIZE, Math.round(baseSize * (LONG_TEXT_THRESHOLD / len)));
  return Math.round(base * scale);
}

function getEntrance(pageIndex: number, configStyle?: AnimationStyle): AnimationStyle {
  if (configStyle && configStyle !== "none") return configStyle;
  if (configStyle === "none") return "none";
  return CYCLING_ANIMATIONS[pageIndex % CYCLING_ANIMATIONS.length]!;
}

export const ComicCaption: React.FC<ComicCaptionProps> = ({
  tokens,
  startMs,
  rotation = 0,
  pageIndex = 0,
  highlightWords = [],
  captionConfig,
  config = {},
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const s = width / REFERENCE_WIDTH;

  const fullText = tokens.map((t) => t.text).join("");
  const configFontSize = captionConfig?.fontSize ?? config.fontSize ?? BASE_FONT_SIZE;
  const fontSize = getFontSize(fullText, s, configFontSize);
  const colors = captionConfig?.backgroundColors?.length
    ? captionConfig.backgroundColors
    : config.colors ?? CAPTION_COLORS;
  const bgColor = colors[pageIndex % colors.length] ?? CAPTION_COLORS[0]!;
  const highlightSet = new Set(highlightWords.map((w) => w.toLowerCase()));
  const entrance = getEntrance(pageIndex, captionConfig?.animationStyle);
  const intensity = (captionConfig?.animationIntensity ?? 100) / 100;

  const textColor = captionConfig?.textColor ?? "#FFFFFF";
  const strokeColor = captionConfig?.strokeColor ?? "#000000";
  const strokeWidth = captionConfig?.strokeWidth ?? 4;
  const highlightColor = captionConfig?.highlightColor ?? "#FF6B35";
  const highlightScale = captionConfig?.highlightScale ?? 1.3;
  const uppercase = captionConfig?.uppercase ?? true;
  const showBackground = captionConfig?.showBackground ?? true;
  const showDithering = captionConfig?.showDithering ?? true;
  const bottomOffset = captionConfig?.bottomOffset ?? 15;
  const leftRightPadding = captionConfig?.leftRightPadding ?? 7.5;
  const verticalAlign = captionConfig?.verticalAlign ?? "bottom";
  const horizontalAlign = captionConfig?.horizontalAlign ?? "center";
  const shadowBlur = captionConfig?.shadowBlur ?? 0;
  const shadowColor = captionConfig?.shadowColor ?? "#000000";
  const letterSpacing = captionConfig?.letterSpacing ?? 1;
  const lineHeight = captionConfig?.lineHeight ?? 1.3;
  const wordSpacing = captionConfig?.wordSpacing ?? 10;

  // --- Entrance animation ---
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.8 },
  });

  let entranceTransform = "";
  let entranceOpacity = entranceProgress;

  if (entrance !== "none") {
    switch (entrance) {
      case "pop":
        entranceTransform = `scale(${interpolate(entranceProgress, [0, 1], [1 - 0.7 * intensity, 1])})`;
        break;
      case "slam": {
        const slamY = interpolate(entranceProgress, [0, 1], [-60 * intensity, 0]);
        const slamScale = interpolate(entranceProgress, [0, 1], [1 + 0.4 * intensity, 1]);
        entranceTransform = `translateY(${slamY}px) scale(${slamScale})`;
        break;
      }
      case "shake": {
        const shakeDecay = Math.max(0, 1 - entranceProgress);
        const shakeX = Math.sin(frame * 2.5) * 8 * shakeDecay * intensity;
        entranceTransform = `translateX(${shakeX}px) scale(${interpolate(entranceProgress, [0, 1], [1 - 0.5 * intensity, 1])})`;
        break;
      }
      case "swipe": {
        const swipeX = interpolate(entranceProgress, [0, 1], [120 * intensity, 0]);
        entranceTransform = `translateX(${swipeX}px)`;
        break;
      }
      case "fade":
        entranceTransform = "";
        break;
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
        filter: `drop-shadow(${6 * s}px ${6 * s}px 0px rgba(0,0,0,0.3))`,
      }}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: showBackground ? bgColor : "transparent",
          border: showBackground ? `${Math.round(strokeWidth * s)}px solid ${strokeColor}` : "none",
          borderRadius: Math.round(12 * s),
          padding: showBackground ? `${Math.round(16 * s)}px ${Math.round(24 * s)}px` : 0,
          overflow: "hidden",
          maxWidth: "100%",
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {showDithering && (
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#${DITHERING_PATTERN_ID})`}
            />
          </svg>
        )}

        <div
          style={{
            position: "relative",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: `0 ${Math.round(wordSpacing * s)}px`,
          }}
        >
          {tokens.map((token, i) => {
            const isActive =
              currentTimeMs >= token.fromMs - startMs &&
              currentTimeMs < token.toMs - startMs;

            const word = token.text.trim().toLowerCase();
            const isHighlighted = highlightSet.has(word);

            const textShadowParts = [
              `${3 * s}px ${3 * s}px 0 ${strokeColor}`,
              `${-1 * s}px ${-1 * s}px 0 ${strokeColor}`,
              `${1 * s}px ${-1 * s}px 0 ${strokeColor}`,
              `${-1 * s}px ${1 * s}px 0 ${strokeColor}`,
            ];
            if (shadowBlur > 0) {
              textShadowParts.push(`0 0 ${shadowBlur * s}px ${shadowColor}`);
            }

            return (
              <span
                key={i}
                style={{
                  fontFamily: comicFont,
                  fontSize,
                  color: textColor,
                  textShadow: textShadowParts.join(", "),
                  textTransform: uppercase ? "uppercase" : "none",
                  opacity: isActive ? 1 : 0.7,
                  transform: isHighlighted && isActive ? `scale(${highlightScale})` : isActive ? "scale(1.15)" : "scale(1)",
                  lineHeight,
                  letterSpacing: letterSpacing * s,
                  ...(isHighlighted && isActive
                    ? { color: highlightColor, filter: `drop-shadow(0 0 ${6 * s}px ${highlightColor}99)` }
                    : {}),
                }}
              >
                {token.text.trim()}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
