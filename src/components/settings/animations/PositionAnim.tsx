import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS, PhoneFrame, MockWord } from "./shared";

export const PositionAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Positions: bottom, center, top — cycle every 30 frames
  const positions = [
    { label: "Bottom", y: 140 },
    { label: "Center", y: 90 },
    { label: "Top", y: 40 },
  ];

  const posIndex = Math.floor(frame / 30) % positions.length;
  const prevIndex = posIndex === 0 ? positions.length - 1 : posIndex - 1;

  const progress = spring({
    frame: frame % 30,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 20,
  });

  const captionY = interpolate(
    progress,
    [0, 1],
    [positions[prevIndex].y, positions[posIndex].y],
  );

  const phoneX = 120;
  const phoneY = 15;
  const phoneW = 80;
  const phoneH = 170;

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Phone silhouette */}
      <PhoneFrame x={phoneX} y={phoneY} width={phoneW} height={phoneH} />

      {/* Screen area */}
      <rect
        x={phoneX + 4}
        y={phoneY + 14}
        width={phoneW - 8}
        height={phoneH - 22}
        rx={4}
        fill={ANIM_COLORS.bgLight}
        opacity={0.4}
      />

      {/* Caption box moves */}
      <g>
        <rect
          x={phoneX + 10}
          y={phoneY + captionY - 8}
          width={phoneW - 20}
          height={20}
          rx={4}
          fill={ANIM_COLORS.primary}
          opacity={0.25}
        />
        <rect
          x={phoneX + 10}
          y={phoneY + captionY - 8}
          width={phoneW - 20}
          height={20}
          rx={4}
          fill="none"
          stroke={ANIM_COLORS.primary}
          strokeWidth={1.5}
        />
        <text
          x={phoneX + phoneW / 2}
          y={phoneY + captionY + 6}
          fontSize={7}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          fill={ANIM_COLORS.text}
        >
          Caption
        </text>
      </g>

      {/* Position labels on the right */}
      {positions.map((pos, i) => (
        <g key={i}>
          <line
            x1={phoneX + phoneW + 10}
            y1={phoneY + pos.y}
            x2={phoneX + phoneW + 25}
            y2={phoneY + pos.y}
            stroke={posIndex === i ? ANIM_COLORS.primary : ANIM_COLORS.muted}
            strokeWidth={1}
            opacity={posIndex === i ? 0.8 : 0.2}
            strokeDasharray={posIndex === i ? "none" : "2 2"}
          />
          <MockWord
            x={phoneX + phoneW + 30}
            y={phoneY + pos.y + 4}
            text={pos.label}
            fontSize={10}
            fill={posIndex === i ? ANIM_COLORS.primary : ANIM_COLORS.muted}
            opacity={posIndex === i ? 1 : 0.4}
          />
        </g>
      ))}
    </svg>
  );
};
