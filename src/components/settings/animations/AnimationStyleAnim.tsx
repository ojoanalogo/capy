import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { ANIM_COLORS } from "./shared";

const STYLES: { label: string; id: string }[] = [
  { label: "Pop", id: "pop" },
  { label: "Slam", id: "slam" },
  { label: "Shake", id: "shake" },
  { label: "Swipe", id: "swipe" },
  { label: "Fade", id: "fade" },
  { label: "None", id: "none" },
];

function MiniCaption({
  x,
  y,
  w,
  h,
  label,
  animId,
  frame,
  fps,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  animId: string;
  frame: number;
  fps: number;
}) {
  // Each animation loops every 45 frames with a stagger
  const loopFrame = frame % 60;
  const active = loopFrame < 30;

  let tx = 0;
  let ty = 0;
  let scale = 1;
  let opacity = 1;

  if (active) {
    const f = loopFrame;
    switch (animId) {
      case "pop": {
        scale = spring({ frame: f, fps, config: { damping: 8, mass: 0.4 }, from: 0.3, to: 1, durationInFrames: 15 });
        break;
      }
      case "slam": {
        ty = spring({ frame: f, fps, config: { damping: 8, mass: 0.5 }, from: -20, to: 0, durationInFrames: 15 });
        break;
      }
      case "shake": {
        tx = f < 15 ? Math.sin(f * 2.5) * 3 : 0;
        break;
      }
      case "swipe": {
        tx = spring({ frame: f, fps, config: { damping: 12 }, from: 30, to: 0, durationInFrames: 15 });
        opacity = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
        break;
      }
      case "fade": {
        opacity = interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" });
        break;
      }
      case "none": {
        break;
      }
    }
  } else {
    opacity = interpolate(loopFrame, [30, 40], [1, 0], { extrapolateRight: "clamp" });
  }

  const cx = x + w / 2;
  const cy = y + h / 2 - 4;

  return (
    <g>
      {/* Cell background */}
      <rect x={x} y={y} width={w} height={h} rx={6} fill={ANIM_COLORS.bgLight} opacity={0.6} />

      {/* Animated text */}
      <g
        transform={`translate(${cx + tx}, ${cy + ty}) scale(${scale})`}
        opacity={opacity}
      >
        <text
          x={0}
          y={0}
          fontSize={11}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          dominantBaseline="central"
          fill={ANIM_COLORS.primary}
        >
          Aa
        </text>
      </g>

      {/* Label */}
      <text
        x={cx}
        y={y + h - 6}
        fontSize={8}
        fontFamily="system-ui, sans-serif"
        textAnchor="middle"
        fill={ANIM_COLORS.muted}
        opacity={0.6}
      >
        {label}
      </text>
    </g>
  );
}

export const AnimationStyleAnim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cols = 3;
  const cellW = 85;
  const cellH = 55;
  const gap = 10;
  const startX = (320 - (cols * cellW + (cols - 1) * gap)) / 2;
  const startY = 25;

  return (
    <svg viewBox="0 0 320 200" width="320" height="200">
      <rect width="320" height="200" fill={ANIM_COLORS.bg} />

      {STYLES.map((style, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (cellW + gap);
        const y = startY + row * (cellH + gap);
        // Stagger each cell by a few frames
        const staggeredFrame = Math.max(0, frame - i * 4);

        return (
          <MiniCaption
            key={style.id}
            x={x}
            y={y}
            w={cellW}
            h={cellH}
            label={style.label}
            animId={style.id}
            frame={staggeredFrame}
            fps={fps}
          />
        );
      })}
    </svg>
  );
};
