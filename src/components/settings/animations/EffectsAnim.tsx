import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS } from "./shared";

export const EffectsAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (0-44): shadow grows, Phase 2 (45-89): stroke appears
  const phase = frame < 45 ? 0 : 1;

  const shadowBlur = phase === 0
    ? interpolate(frame, [0, 30, 44], [0, 12, 0], { extrapolateRight: "clamp" })
    : 4;

  const strokeWidth = phase === 1
    ? spring({
        frame: frame - 45,
        fps,
        config: { damping: 10 },
        from: 0,
        to: 3,
        durationInFrames: 25,
      })
    : 0;

  const strokeOpacity = phase === 1
    ? interpolate(frame - 45, [0, 15, 35, 44], [0, 1, 1, 0], { extrapolateRight: "clamp" })
    : 0;

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      <defs>
        <filter id="shadow-filter">
          <feDropShadow
            dx={0}
            dy={2}
            stdDeviation={shadowBlur}
            floodColor={ANIM_COLORS.primary}
            floodOpacity={0.8}
          />
        </filter>
      </defs>

      {/* Caption with effects */}
      <g filter={shadowBlur > 0 ? "url(#shadow-filter)" : undefined}>
        {/* Stroke (behind text) */}
        {strokeWidth > 0 && (
          <text
            x={160}
            y={95}
            fontSize={28}
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            fill="none"
            stroke={ANIM_COLORS.primary}
            strokeWidth={strokeWidth * 2}
            strokeLinejoin="round"
            opacity={strokeOpacity}
          >
            EFFECTS
          </text>
        )}

        {/* Main text */}
        <text
          x={160}
          y={95}
          fontSize={28}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          fill={ANIM_COLORS.text}
        >
          EFFECTS
        </text>
      </g>

      {/* Phase labels */}
      <g>
        <rect
          x={70}
          y={140}
          width={80}
          height={24}
          rx={12}
          fill={phase === 0 ? ANIM_COLORS.primary : ANIM_COLORS.bgLight}
          opacity={phase === 0 ? 0.25 : 0.5}
        />
        <text
          x={110}
          y={156}
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          fill={phase === 0 ? ANIM_COLORS.primary : ANIM_COLORS.muted}
          fontWeight={phase === 0 ? "bold" : "normal"}
        >
          Shadow
        </text>

        <rect
          x={170}
          y={140}
          width={80}
          height={24}
          rx={12}
          fill={phase === 1 ? ANIM_COLORS.primary : ANIM_COLORS.bgLight}
          opacity={phase === 1 ? 0.25 : 0.5}
        />
        <text
          x={210}
          y={156}
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          fill={phase === 1 ? ANIM_COLORS.primary : ANIM_COLORS.muted}
          fontWeight={phase === 1 ? "bold" : "normal"}
        >
          Stroke
        </text>
      </g>
    </svg>
  );
};
