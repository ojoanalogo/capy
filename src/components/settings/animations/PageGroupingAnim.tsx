import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS, MockWord } from "./shared";

export const PageGroupingAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = [
    { text: "Hello", x: 20 },
    { text: "world", x: 75 },
    { text: "this", x: 155 },
    { text: "is", x: 195 },
    { text: "a", x: 225 },
    { text: "test", x: 260 },
  ];

  // Gap threshold line sweeps back and forth
  const thresholdX = interpolate(
    frame,
    [0, 45, 90],
    [130, 210, 130],
    { extrapolateRight: "clamp" },
  );

  // Group A = words left of threshold, Group B = words right
  const groupAOpacity = spring({ frame, fps, from: 0.3, to: 1, durationInFrames: 15 });
  const groupBOpacity = spring({ frame: Math.max(0, frame - 10), fps, from: 0.3, to: 1, durationInFrames: 15 });

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Timeline bar */}
      <rect x="15" y="85" width="290" height="3" rx="1.5" fill={ANIM_COLORS.muted} opacity={0.2} />

      {/* Word dots on timeline */}
      {words.map((w, i) => {
        const isGroupA = w.x + 20 < thresholdX;
        return (
          <g key={i}>
            <circle
              cx={w.x + 20}
              cy={86}
              r={4}
              fill={isGroupA ? ANIM_COLORS.primary : ANIM_COLORS.secondary}
              opacity={isGroupA ? groupAOpacity : groupBOpacity}
            />
            <MockWord
              x={w.x + 10}
              y={75}
              text={w.text}
              fontSize={11}
              fill={isGroupA ? ANIM_COLORS.primary : ANIM_COLORS.secondary}
              opacity={isGroupA ? groupAOpacity : groupBOpacity}
            />
          </g>
        );
      })}

      {/* Gap threshold line */}
      <line
        x1={thresholdX}
        y1={60}
        x2={thresholdX}
        y2={100}
        stroke={ANIM_COLORS.accent}
        strokeWidth={2}
        strokeDasharray="4 2"
        opacity={0.8}
      />
      <MockWord
        x={thresholdX}
        y={55}
        text="gap"
        fontSize={9}
        fill={ANIM_COLORS.accent}
        textAnchor="middle"
        opacity={0.7}
      />

      {/* Grouped caption boxes */}
      {(() => {
        const groupA = words.filter((w) => w.x + 20 < thresholdX);
        const groupB = words.filter((w) => w.x + 20 >= thresholdX);

        const bounceA = spring({ frame, fps, config: { damping: 12 } });
        const bounceB = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } });

        return (
          <>
            {groupA.length > 0 && (
              <g opacity={bounceA}>
                <rect
                  x={12}
                  y={115}
                  width={groupA.length * 45 + 10}
                  height={30}
                  rx={6}
                  fill={ANIM_COLORS.primary}
                  opacity={0.15}
                />
                <rect
                  x={12}
                  y={115}
                  width={groupA.length * 45 + 10}
                  height={30}
                  rx={6}
                  fill="none"
                  stroke={ANIM_COLORS.primary}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
                <MockWord
                  x={20}
                  y={135}
                  text={groupA.map((w) => w.text).join(" ")}
                  fontSize={12}
                  fill={ANIM_COLORS.text}
                />
              </g>
            )}
            {groupB.length > 0 && (
              <g opacity={bounceB}>
                <rect
                  x={groupA.length * 45 + 35}
                  y={115}
                  width={groupB.length * 40 + 10}
                  height={30}
                  rx={6}
                  fill={ANIM_COLORS.secondary}
                  opacity={0.15}
                />
                <rect
                  x={groupA.length * 45 + 35}
                  y={115}
                  width={groupB.length * 40 + 10}
                  height={30}
                  rx={6}
                  fill="none"
                  stroke={ANIM_COLORS.secondary}
                  strokeWidth={1.5}
                  opacity={0.4}
                />
                <MockWord
                  x={groupA.length * 45 + 43}
                  y={135}
                  text={groupB.map((w) => w.text).join(" ")}
                  fontSize={12}
                  fill={ANIM_COLORS.text}
                />
              </g>
            )}
          </>
        );
      })()}

      {/* Labels */}
      <MockWord x={20} y={175} text="Page 1" fontSize={10} fill={ANIM_COLORS.primary} opacity={0.6} />
      <MockWord x={160} y={175} text="Page 2" fontSize={10} fill={ANIM_COLORS.secondary} opacity={0.6} />
    </svg>
  );
};
