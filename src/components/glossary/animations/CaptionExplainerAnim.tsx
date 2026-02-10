import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS, MockWord, PhoneFrame } from "../../settings/animations/shared";

/**
 * Animated illustration explaining what a "caption" is:
 * A single word or phrase with a start and end time.
 */
export const CaptionExplainerAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounceIn = spring({ frame, fps, config: { damping: 12 } });

  // Cycle through 3 words, highlighting one at a time
  const words = [
    { text: "Hello", x: 110 },
    { text: "world", x: 149 },
    { text: "today", x: 192 },
  ];
  const cycleLen = 30;
  const activeIdx = Math.floor((frame % (cycleLen * words.length)) / cycleLen);
  const activeWord = words[activeIdx]!;

  // Bracket animation around the active word
  const bracketSpring = spring({
    frame: frame % cycleLen,
    fps,
    config: { damping: 10, mass: 0.5 },
  });

  // Timeline progress
  const timelineDots = [120, 152, 194];
  const timelineProgress = interpolate(
    frame % (cycleLen * words.length),
    [0, cycleLen * words.length],
    [105, 220],
  );

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Phone frame */}
      <PhoneFrame x={105} y={10} width={110} height={130} />

      {/* Screen background */}
      <rect x={109} y={24} width={102} height={112} rx={4} fill={ANIM_COLORS.bgLight} opacity={0.3} />

      {/* Caption box at bottom of phone */}
      <g opacity={bounceIn}>
        <rect x={112} y={100} width={96} height={28} rx={5} fill={ANIM_COLORS.primary} opacity={0.12} />
        <rect x={112} y={100} width={96} height={28} rx={5} fill="none" stroke={ANIM_COLORS.primary} strokeWidth={1} opacity={0.3} />
      </g>

      {/* Words inside the caption box */}
      {words.map((w, i) => {
        const isActive = i === activeIdx;
        return (
          <g key={i}>
            {isActive && (
              <rect
                x={w.x - 3}
                y={108}
                width={w.text.length * 7.5 + 6}
                height={14}
                rx={3}
                fill={ANIM_COLORS.primary}
                opacity={0.3 * bracketSpring}
              />
            )}
            <MockWord
              x={w.x}
              y={119}
              text={w.text}
              fontSize={10}
              fill={isActive ? ANIM_COLORS.primary : ANIM_COLORS.text}
              opacity={isActive ? 1 : 0.35}
            />
          </g>
        );
      })}

      {/* Pointer line from active word down to label */}
      <line
        x1={activeWord.x + (activeWord.text.length * 7.5) / 2}
        y1={130}
        x2={160}
        y2={148}
        stroke={ANIM_COLORS.primary}
        strokeWidth={1}
        opacity={0.4 * bracketSpring}
        strokeDasharray="3 2"
      />

      {/* Label */}
      <g opacity={interpolate(bracketSpring, [0, 1], [0, 0.9])}>
        <rect x={112} y={150} width={96} height={18} rx={4} fill={ANIM_COLORS.primary} opacity={0.15} />
        <MockWord
          x={125}
          y={163}
          text={`"${activeWord.text}" = 1 caption`}
          fontSize={8}
          fill={ANIM_COLORS.primary}
          opacity={0.8}
          fontWeight="normal"
        />
      </g>

      {/* Timeline at bottom */}
      <rect x={105} y={178} width={115} height={2} rx={1} fill={ANIM_COLORS.muted} opacity={0.15} />

      {/* Word dots on timeline */}
      {timelineDots.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={179}
          r={3}
          fill={i === activeIdx ? ANIM_COLORS.primary : ANIM_COLORS.muted}
          opacity={i === activeIdx ? 0.9 : 0.25}
        />
      ))}

      {/* Playhead */}
      <line
        x1={timelineProgress}
        y1={174}
        x2={timelineProgress}
        y2={184}
        stroke={ANIM_COLORS.text}
        strokeWidth={1.5}
        opacity={0.5}
      />

      {/* Bottom label */}
      <MockWord
        x={113}
        y={196}
        text="Each word has its own timing"
        fontSize={8}
        fill={ANIM_COLORS.muted}
        opacity={0.45}
        fontWeight="normal"
      />
    </svg>
  );
};
