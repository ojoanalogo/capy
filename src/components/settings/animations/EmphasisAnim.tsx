import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS } from "./shared";

export const EmphasisAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ["This", "is", "the", "key", "word"];
  const highlightIndex = 3; // "key" is highlighted

  // Pulse cycle
  const pulse = spring({
    frame: frame % 45,
    fps,
    config: { damping: 6, mass: 0.5 },
    from: 1,
    to: 1.25,
    durationInFrames: 20,
  });

  const glowOpacity = interpolate(
    frame % 45,
    [0, 10, 20, 35, 44],
    [0, 0.8, 0.6, 0.3, 0],
    { extrapolateRight: "clamp" },
  );

  const glowRadius = interpolate(
    frame % 45,
    [0, 15, 44],
    [2, 8, 2],
    { extrapolateRight: "clamp" },
  );

  // Word positions
  let currentX = 45;
  const wordPositions = words.map((word) => {
    const x = currentX;
    currentX += word.length * 10 + 14;
    return { word, x };
  });

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      <defs>
        <filter id="glow-filter">
          <feGaussianBlur stdDeviation={glowRadius} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Caption background */}
      <rect x={30} y={65} width={260} height={45} rx={8} fill={ANIM_COLORS.bgLight} opacity={0.5} />

      {/* Words */}
      {wordPositions.map(({ word, x }, i) => {
        const isHighlighted = i === highlightIndex;
        const centerX = x + (word.length * 10) / 2;
        const y = 95;

        if (isHighlighted) {
          return (
            <g key={i}>
              {/* Glow behind highlighted word */}
              <text
                x={centerX}
                y={y}
                fontSize={20}
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
                textAnchor="middle"
                fill={ANIM_COLORS.primary}
                opacity={glowOpacity}
                filter="url(#glow-filter)"
              >
                {word}
              </text>

              {/* Highlighted word with scale */}
              <g transform={`translate(${centerX}, ${y})`}>
                <g transform={`scale(${pulse})`}>
                  <text
                    x={0}
                    y={0}
                    fontSize={20}
                    fontWeight="bold"
                    fontFamily="system-ui, sans-serif"
                    textAnchor="middle"
                    fill={ANIM_COLORS.primary}
                  >
                    {word}
                  </text>
                </g>
              </g>
            </g>
          );
        }

        return (
          <text
            key={i}
            x={centerX}
            y={y}
            fontSize={20}
            fontWeight="bold"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            fill={ANIM_COLORS.text}
            opacity={0.7}
          >
            {word}
          </text>
        );
      })}

      {/* Arrow pointing to highlighted word */}
      <g opacity={interpolate(frame % 45, [0, 10, 35, 44], [0, 0.8, 0.8, 0], { extrapolateRight: "clamp" })}>
        <line
          x1={wordPositions[highlightIndex].x + 15}
          y1={125}
          x2={wordPositions[highlightIndex].x + 15}
          y2={112}
          stroke={ANIM_COLORS.primary}
          strokeWidth={1.5}
          opacity={0.6}
        />
        <text
          x={wordPositions[highlightIndex].x + 15}
          y={140}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          fill={ANIM_COLORS.primary}
          opacity={0.7}
        >
          emphasized
        </text>
      </g>
    </svg>
  );
};
