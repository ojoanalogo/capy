import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS, MockWord } from "../../settings/animations/shared";

/**
 * Animated illustration explaining the timeline:
 * Where you adjust timing, reorder, and edit captions.
 */
export const TimelineExplainerAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounceIn = spring({ frame, fps, config: { damping: 12 } });

  // Playhead moves across
  const playheadX = interpolate(
    frame % 90,
    [0, 90],
    [40, 280],
  );

  // Words on timeline
  const timelineWords = [
    { text: "Hello", x: 40, w: 50, color: "#f97316" },
    { text: "world", x: 98, w: 48, color: "#f97316" },
    { text: "how", x: 168, w: 36, color: "#3b82f6" },
    { text: "are", x: 210, w: 32, color: "#3b82f6" },
    { text: "you", x: 248, w: 32, color: "#3b82f6" },
  ];

  // Highlight word under playhead
  const activeWordIdx = timelineWords.findIndex(
    (w) => playheadX >= w.x && playheadX <= w.x + w.w,
  );

  // Drag animation: one word slides right briefly
  const dragFrame = frame % 90;
  const isDragging = dragFrame > 50 && dragFrame < 70;
  const dragOffset = isDragging
    ? spring({
        frame: dragFrame - 50,
        fps,
        config: { damping: 12 },
        durationInFrames: 10,
      }) * 12
    : 0;

  // Page group brackets
  const pageGroups = [
    { startX: 40, endX: 146, y: 64, label: "Page 1", color: "#f97316" },
    { startX: 168, endX: 280, y: 64, label: "Page 2", color: "#3b82f6" },
  ];

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Title */}
      <MockWord x={115} y={22} text="Timeline" fontSize={12} fill={ANIM_COLORS.text} opacity={0.7} fontWeight="bold" />

      {/* Page group labels */}
      {pageGroups.map((pg, i) => (
        <g key={i} opacity={bounceIn * 0.6}>
          <rect x={pg.startX} y={pg.y - 4} width={pg.endX - pg.startX} height={14} rx={3} fill={pg.color} opacity={0.08} />
          <MockWord x={pg.startX + 4} y={pg.y + 7} text={pg.label} fontSize={7} fill={pg.color} opacity={0.5} fontWeight="normal" />
        </g>
      ))}

      {/* Timeline track */}
      <rect x={30} y={85} width={260} height={28} rx={4} fill={ANIM_COLORS.bgLight} opacity={0.5 * bounceIn} />

      {/* Word blocks */}
      {timelineWords.map((w, i) => {
        const isActive = i === activeWordIdx;
        const xOffset = i === 1 ? dragOffset : 0;
        return (
          <g key={i} opacity={bounceIn}>
            <rect
              x={w.x + xOffset}
              y={88}
              width={w.w}
              height={22}
              rx={4}
              fill={w.color}
              opacity={isActive ? 0.35 : 0.18}
            />
            <rect
              x={w.x + xOffset}
              y={88}
              width={w.w}
              height={22}
              rx={4}
              fill="none"
              stroke={w.color}
              strokeWidth={isActive ? 1.5 : 0.5}
              opacity={isActive ? 0.7 : 0.25}
            />
            <MockWord
              x={w.x + 6 + xOffset}
              y={103}
              text={w.text}
              fontSize={9}
              fill={ANIM_COLORS.text}
              opacity={isActive ? 1 : 0.6}
              fontWeight="normal"
            />
            {/* Drag handles */}
            {isDragging && i === 1 && (
              <g opacity={0.5}>
                <line x1={w.x + xOffset} y1={91} x2={w.x + xOffset} y2={107} stroke={w.color} strokeWidth={2} />
                <line x1={w.x + w.w + xOffset} y1={91} x2={w.x + w.w + xOffset} y2={107} stroke={w.color} strokeWidth={2} />
              </g>
            )}
          </g>
        );
      })}

      {/* Playhead */}
      <line
        x1={playheadX}
        y1={80}
        x2={playheadX}
        y2={115}
        stroke={ANIM_COLORS.text}
        strokeWidth={1.5}
        opacity={0.6}
      />
      <circle cx={playheadX} cy={80} r={3} fill={ANIM_COLORS.text} opacity={0.6} />

      {/* Feature callouts */}
      <g opacity={bounceIn * 0.6}>
        {/* Drag hint */}
        <MockWord x={50} y={138} text="Drag edges to adjust timing" fontSize={8} fill={ANIM_COLORS.muted} opacity={0.5} fontWeight="normal" />
        <line x1={42} y1={135} x2={48} y2={135} stroke={ANIM_COLORS.muted} strokeWidth={1} opacity={0.3} />

        {/* Click hint */}
        <MockWord x={50} y={152} text="Click a word to seek to it" fontSize={8} fill={ANIM_COLORS.muted} opacity={0.5} fontWeight="normal" />
        <line x1={42} y1={149} x2={48} y2={149} stroke={ANIM_COLORS.muted} strokeWidth={1} opacity={0.3} />

        {/* Page hint */}
        <MockWord x={50} y={166} text="Right-click for page actions" fontSize={8} fill={ANIM_COLORS.muted} opacity={0.5} fontWeight="normal" />
        <line x1={42} y1={163} x2={48} y2={163} stroke={ANIM_COLORS.muted} strokeWidth={1} opacity={0.3} />
      </g>

      {/* Time markers */}
      <MockWord x={30} y={126} text="0:00" fontSize={7} fill={ANIM_COLORS.muted} opacity={0.3} fontWeight="normal" />
      <MockWord x={270} y={126} text="0:05" fontSize={7} fill={ANIM_COLORS.muted} opacity={0.3} fontWeight="normal" />
    </svg>
  );
};
