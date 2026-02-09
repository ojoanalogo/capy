import { useCurrentFrame, interpolate } from "remotion";
import { ANIM_COLORS, MockCaptionBox } from "./shared";

export const TextAnim: React.FC = () => {
  const frame = useCurrentFrame();

  // 3 phases: font size change, color change, uppercase toggle
  const phase = Math.floor(frame / 30) % 3;

  const fontSize = phase === 0
    ? interpolate(frame % 30, [0, 15, 30], [14, 22, 14])
    : 16;

  const textColor = phase === 1
    ? interpolate(
        frame % 30,
        [0, 10, 20, 30],
        [0, 1, 2, 0],
        { extrapolateRight: "clamp" },
      )
    : 0;

  const colors = [ANIM_COLORS.text, ANIM_COLORS.primary, ANIM_COLORS.secondary];
  const currentColor = colors[Math.round(textColor)];

  const isUppercase = phase === 2 && (frame % 30) > 10 && (frame % 30) < 25;

  const displayText = isUppercase ? "CAPTION TEXT" : "Caption Text";

  const labelTexts = ["Font Size", "Text Color", "Uppercase"];

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Caption box */}
      <MockCaptionBox x={60} y={60} width={200} height={50} fill={ANIM_COLORS.bgLight} />
      <rect x={60} y={60} width={200} height={50} rx={6} fill="none" stroke={ANIM_COLORS.muted} strokeWidth={1} opacity={0.3} />

      {/* Animated text */}
      <text
        x={160}
        y={92}
        fill={phase === 1 ? currentColor : ANIM_COLORS.text}
        fontSize={fontSize}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
      >
        {displayText}
      </text>

      {/* Phase indicator */}
      {labelTexts.map((label, i) => (
        <g key={i}>
          <rect
            x={40 + i * 90}
            y={140}
            width={75}
            height={22}
            rx={11}
            fill={phase === i ? ANIM_COLORS.primary : ANIM_COLORS.bgLight}
            opacity={phase === i ? 0.3 : 0.5}
          />
          <text
            x={40 + i * 90 + 37.5}
            y={155}
            fill={phase === i ? ANIM_COLORS.primary : ANIM_COLORS.muted}
            fontSize={10}
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            fontWeight={phase === i ? "bold" : "normal"}
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
};
