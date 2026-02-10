import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { ANIM_COLORS, MockWord } from "./shared";

/**
 * Animated illustration comparing Karaoke vs Static caption modes.
 * Left side: words highlight one-by-one (karaoke).
 * Right side: full phrase appears at once (static).
 */
export const PageGroupingAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Karaoke side: highlight cycles through words ──────────────
  const words = ["Hello", "world", "this"];
  const cycleLen = 30; // frames per word
  const activeWordIdx = Math.floor((frame % (cycleLen * words.length)) / cycleLen);

  const bounceIn = spring({ frame, fps, config: { damping: 12 } });

  // ── Static side: phrase fades in/out ──────────────────────────
  const phraseOpacity = interpolate(
    frame % 90,
    [0, 10, 70, 85, 89],
    [0, 1, 1, 0, 0],
    { extrapolateRight: "clamp" },
  );

  // Show second phrase briefly at end of cycle
  const showPhrase2 = frame % 90 > 78;

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {/* Divider */}
      <line x1="160" y1="30" x2="160" y2="180" stroke={ANIM_COLORS.muted} strokeWidth={1} opacity={0.15} />

      {/* ── Left: Karaoke ───────────────────────────────── */}
      <MockWord x={55} y={28} text="Karaoke" fontSize={11} fill={ANIM_COLORS.primary} fontWeight="bold" opacity={0.8} />

      {/* Caption box */}
      <g opacity={bounceIn}>
        <rect x={15} y={42} width={130} height={32} rx={6} fill={ANIM_COLORS.primary} opacity={0.1} />
        <rect x={15} y={42} width={130} height={32} rx={6} fill="none" stroke={ANIM_COLORS.primary} strokeWidth={1} opacity={0.3} />
      </g>

      {/* Words with active highlight */}
      {(() => {
        let cx = 24;
        return words.map((w, i) => {
          const x = cx;
          cx += w.length * 7.5 + 10;
          const isActive = i === activeWordIdx;

          const highlightScale = isActive
            ? spring({
                frame: frame % cycleLen,
                fps,
                config: { damping: 8, mass: 0.4 },
                from: 1,
                to: 1.15,
                durationInFrames: 12,
              })
            : 1;

          return (
            <g key={i}>
              {isActive && (
                <rect
                  x={x - 2}
                  y={50}
                  width={w.length * 7.5 + 4}
                  height={16}
                  rx={3}
                  fill={ANIM_COLORS.primary}
                  opacity={0.25}
                />
              )}
              <g transform={`translate(${x + (w.length * 7.5) / 2}, 62)`}>
                <g transform={`scale(${highlightScale})`}>
                  <MockWord
                    x={0}
                    y={0}
                    text={w}
                    fontSize={12}
                    fill={isActive ? ANIM_COLORS.primary : ANIM_COLORS.text}
                    opacity={isActive ? 1 : 0.35}
                    textAnchor="middle"
                  />
                </g>
              </g>
            </g>
          );
        });
      })()}

      {/* Description */}
      <MockWord x={22} y={96} text="Words highlight as spoken" fontSize={8} fill={ANIM_COLORS.muted} opacity={0.5} fontWeight="normal" />
      <MockWord x={22} y={108} text="More control, more editing" fontSize={8} fill={ANIM_COLORS.muted} opacity={0.4} fontWeight="normal" />

      {/* ── Right: Static ───────────────────────────────── */}
      <MockWord x={215} y={28} text="Static" fontSize={11} fill="#60a5fa" fontWeight="bold" opacity={0.8} />

      {/* Caption box */}
      <g opacity={bounceIn}>
        <rect x={175} y={42} width={130} height={32} rx={6} fill="#3b82f6" opacity={0.1} />
        <rect x={175} y={42} width={130} height={32} rx={6} fill="none" stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
      </g>

      {/* Full phrase, all same brightness */}
      <g opacity={phraseOpacity}>
        <MockWord x={187} y={62} text="Hello world this" fontSize={12} fill={ANIM_COLORS.text} opacity={1} />
      </g>

      {/* Second phrase peek */}
      {showPhrase2 && (
        <g opacity={interpolate(frame % 90, [78, 84, 89], [0, 0.9, 0], { extrapolateRight: "clamp" })}>
          <MockWord x={193} y={62} text="is a test" fontSize={12} fill={ANIM_COLORS.text} opacity={1} />
        </g>
      )}

      {/* Description */}
      <MockWord x={182} y={96} text="Full phrase appears at once" fontSize={8} fill={ANIM_COLORS.muted} opacity={0.5} fontWeight="normal" />
      <MockWord x={182} y={108} text="Quick setup, fewer edits" fontSize={8} fill={ANIM_COLORS.muted} opacity={0.4} fontWeight="normal" />

      {/* ── Bottom labels ──────────────────────────────── */}

      {/* Karaoke: timeline with word dots */}
      <rect x={15} y={130} width={130} height={3} rx={1.5} fill={ANIM_COLORS.muted} opacity={0.15} />
      {[28, 55, 82, 105, 118, 132].map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={131}
          r={3}
          fill={ANIM_COLORS.primary}
          opacity={i <= activeWordIdx ? 0.9 : 0.2}
        />
      ))}
      <MockWord x={40} y={155} text="6 words, 2 pages" fontSize={8} fill={ANIM_COLORS.primary} opacity={0.4} fontWeight="normal" />

      {/* Static: timeline with phrase blocks */}
      <rect x={175} y={130} width={130} height={3} rx={1.5} fill={ANIM_COLORS.muted} opacity={0.15} />
      <rect x={178} y={125} width={55} height={12} rx={3} fill="#3b82f6" opacity={phraseOpacity * 0.3} />
      <rect x={240} y={125} width={55} height={12} rx={3} fill="#3b82f6" opacity={showPhrase2 ? 0.3 : 0.1} />
      <MockWord x={210} y={155} text="2 phrases, 2 pages" fontSize={8} fill="#60a5fa" opacity={0.4} fontWeight="normal" />
    </svg>
  );
};
