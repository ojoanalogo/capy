import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS, MockWord } from "./shared";

export const BackgroundAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade in/out
  const bgOpacity = spring({
    frame: frame % 45,
    fps,
    config: { damping: 15 },
    durationInFrames: 20,
  });

  const showBg = frame > 10;

  // Color cycling on the box
  const hue = interpolate(frame, [0, 90], [20, 380]);

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Caption container */}
      <g>
        {/* Background box - fades in */}
        {showBg && (
          <rect
            x={60}
            y={65}
            width={200}
            height={55}
            rx={8}
            fill={`hsl(${hue}, 80%, 15%)`}
            opacity={bgOpacity * 0.8}
          />
        )}

        {/* Border */}
        <rect
          x={60}
          y={65}
          width={200}
          height={55}
          rx={8}
          fill="none"
          stroke={showBg ? ANIM_COLORS.primary : ANIM_COLORS.muted}
          strokeWidth={1.5}
          opacity={showBg ? 0.6 : 0.2}
          strokeDasharray={showBg ? "none" : "4 3"}
        />

        {/* Caption text */}
        <MockWord x={160} y={90} text="Your caption" fontSize={16} fontWeight="bold" textAnchor="middle" />
        <MockWord x={160} y={108} text="goes here" fontSize={16} fontWeight="bold" textAnchor="middle" />
      </g>

      {/* Color palette dots */}
      {[ANIM_COLORS.primary, ANIM_COLORS.secondary, "#22c55e", "#3b82f6", "#a855f7"].map(
        (color, i) => {
          const isActive = Math.floor(frame / 18) % 5 === i;
          const scale = isActive ? 1.3 : 1;
          const cx = 100 + i * 30;
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={155}
                r={8 * scale}
                fill={color}
                opacity={isActive ? 1 : 0.4}
              />
              {isActive && (
                <circle
                  cx={cx}
                  cy={155}
                  r={11}
                  fill="none"
                  stroke={ANIM_COLORS.accent}
                  strokeWidth={1.5}
                  opacity={0.6}
                />
              )}
            </g>
          );
        },
      )}

      {/* Label */}
      <MockWord x={160} y={185} text="Background Color" fontSize={10} fill={ANIM_COLORS.muted} textAnchor="middle" opacity={0.5} />
    </svg>
  );
};
