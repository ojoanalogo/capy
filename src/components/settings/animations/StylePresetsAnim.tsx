import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { ANIM_COLORS } from "./shared";

const PRESETS = [
  { label: "Bold", color: ANIM_COLORS.primary, fontSize: 22, uppercase: true },
  { label: "Minimal", color: ANIM_COLORS.text, fontSize: 14, uppercase: false },
  { label: "Neon", color: "#22d3ee", fontSize: 18, uppercase: true },
  { label: "Warm", color: ANIM_COLORS.secondary, fontSize: 16, uppercase: false },
];

export const StylePresetsAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const presetIndex = Math.floor(frame / 22) % PRESETS.length;
  const preset = PRESETS[presetIndex];

  const transitionProgress = spring({
    frame: frame % 22,
    fps,
    config: { damping: 12 },
    durationInFrames: 15,
  });

  const textOpacity = interpolate(
    frame % 22,
    [0, 6, 16, 21],
    [0, 1, 1, 0.3],
    { extrapolateRight: "clamp" },
  );

  const captionText = preset.uppercase ? "SAMPLE TEXT" : "Sample Text";

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Caption preview area */}
      <rect x={60} y={30} width={200} height={70} rx={10} fill={ANIM_COLORS.bgLight} opacity={0.4} />

      <text
        x={160}
        y={72}
        fontSize={preset.fontSize}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
        fill={preset.color}
        opacity={textOpacity}
      >
        {captionText}
      </text>

      {/* Preset cards */}
      {PRESETS.map((p, i) => {
        const isActive = i === presetIndex;
        const cardX = 30 + i * 68;
        const cardY = 125;

        return (
          <g key={i}>
            <rect
              x={cardX}
              y={cardY}
              width={60}
              height={45}
              rx={8}
              fill={isActive ? ANIM_COLORS.primary : ANIM_COLORS.bgLight}
              opacity={isActive ? 0.2 : 0.4}
            />
            <rect
              x={cardX}
              y={cardY}
              width={60}
              height={45}
              rx={8}
              fill="none"
              stroke={isActive ? ANIM_COLORS.primary : ANIM_COLORS.muted}
              strokeWidth={isActive ? 1.5 : 0.5}
              opacity={isActive ? 0.8 : 0.2}
            />
            <text
              x={cardX + 30}
              y={cardY + 20}
              fontSize={p.uppercase ? 9 : 10}
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
              fill={p.color}
              opacity={isActive ? 1 : 0.5}
            >
              Aa
            </text>
            <text
              x={cardX + 30}
              y={cardY + 36}
              fontSize={8}
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
              fill={isActive ? ANIM_COLORS.text : ANIM_COLORS.muted}
              opacity={isActive ? 0.9 : 0.4}
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
