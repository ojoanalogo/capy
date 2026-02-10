import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS, MockWord, PhoneFrame } from "../../settings/animations/shared";

/**
 * Animated illustration explaining what a "page" is:
 * A group of words displayed together on one screen.
 */
export const PageExplainerAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounceIn = spring({ frame, fps, config: { damping: 12 } });

  // Two pages alternate
  const pages = [
    { words: ["Hello", "world"], color: "#f97316", label: "Page 1" },
    { words: ["how", "are", "you"], color: "#3b82f6", label: "Page 2" },
  ];

  const cycleDur = 45; // frames per page
  const pageIdx = Math.floor(frame / cycleDur) % pages.length;
  const page = pages[pageIdx]!;

  const pageTransition = spring({
    frame: frame % cycleDur,
    fps,
    config: { damping: 12, mass: 0.6 },
    durationInFrames: 15,
  });

  const fadeOut = interpolate(
    frame % cycleDur,
    [cycleDur - 10, cycleDur - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = Math.min(pageTransition, fadeOut);

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Phone frame */}
      <PhoneFrame x={105} y={8} width={110} height={130} />
      <rect x={109} y={22} width={102} height={112} rx={4} fill={ANIM_COLORS.bgLight} opacity={0.3} />

      {/* Caption box with page content */}
      <g opacity={bounceIn}>
        <rect x={112} y={96} width={96} height={34} rx={5} fill={page.color} opacity={0.12 * opacity} />
        <rect x={112} y={96} width={96} height={34} rx={5} fill="none" stroke={page.color} strokeWidth={1} opacity={0.35 * opacity} />
      </g>

      {/* Words inside the page */}
      <g opacity={opacity}>
        {(() => {
          let cx = 118;
          return page.words.map((w, i) => {
            const x = cx;
            cx += w.length * 7 + 8;
            return (
              <MockWord
                key={`${pageIdx}-${i}`}
                x={x}
                y={117}
                text={w}
                fontSize={10}
                fill={ANIM_COLORS.text}
                opacity={0.9}
              />
            );
          });
        })()}
      </g>

      {/* Page indicator badge */}
      <g opacity={opacity}>
        <rect x={112} y={86} width={42} height={12} rx={3} fill={page.color} opacity={0.2} />
        <MockWord x={117} y={95} text={page.label} fontSize={7} fill={page.color} opacity={0.8} fontWeight="normal" />
      </g>

      {/* Bracket/brace showing grouping */}
      <g opacity={0.3 * opacity}>
        <line x1={110} y1={94} x2={110} y2={132} stroke={page.color} strokeWidth={1.5} />
        <line x1={110} y1={94} x2={114} y2={94} stroke={page.color} strokeWidth={1.5} />
        <line x1={110} y1={132} x2={114} y2={132} stroke={page.color} strokeWidth={1.5} />
      </g>

      {/* Explanation area */}
      <g opacity={bounceIn}>
        {/* Page 1 block */}
        <rect x={80} y={150} width={70} height={12} rx={3} fill="#f97316" opacity={pageIdx === 0 ? 0.35 : 0.12} />
        <MockWord x={85} y={160} text="Hello world" fontSize={7} fill={ANIM_COLORS.text} opacity={pageIdx === 0 ? 0.8 : 0.3} fontWeight="normal" />

        {/* Page 2 block */}
        <rect x={158} y={150} width={82} height={12} rx={3} fill="#3b82f6" opacity={pageIdx === 1 ? 0.35 : 0.12} />
        <MockWord x={163} y={160} text="how are you" fontSize={7} fill={ANIM_COLORS.text} opacity={pageIdx === 1 ? 0.8 : 0.3} fontWeight="normal" />

        {/* Arrow between them */}
        <line x1={153} y1={156} x2={156} y2={156} stroke={ANIM_COLORS.muted} strokeWidth={1} opacity={0.3} />
      </g>

      {/* Timeline blocks */}
      <rect x={80} y={172} width={160} height={2} rx={1} fill={ANIM_COLORS.muted} opacity={0.12} />
      <rect x={80} y={169} width={70} height={8} rx={2} fill="#f97316" opacity={pageIdx === 0 ? 0.3 : 0.1} />
      <rect x={158} y={169} width={82} height={8} rx={2} fill="#3b82f6" opacity={pageIdx === 1 ? 0.3 : 0.1} />

      {/* Bottom label */}
      <MockWord
        x={88}
        y={193}
        text="A page = words shown on screen together"
        fontSize={8}
        fill={ANIM_COLORS.muted}
        opacity={0.45}
        fontWeight="normal"
      />
    </svg>
  );
};
