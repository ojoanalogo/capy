export const ANIM_COLORS = {
  bg: "#0a0a0a",
  bgLight: "#141414",
  primary: "#f97316",
  secondary: "#fb923c",
  accent: "#fff7ed",
  muted: "#a3a3a3",
  text: "#fafafa",
} as const;

export const ANIM_WIDTH = 320;
export const ANIM_HEIGHT = 200;
export const ANIM_FPS = 30;
export const ANIM_FRAMES = 90;

export function MockCaptionBox({
  x,
  y,
  width,
  height,
  fill = ANIM_COLORS.primary,
  opacity = 1,
  rx = 6,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  opacity?: number;
  rx?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      fill={fill}
      opacity={opacity}
    />
  );
}

export function MockWord({
  x,
  y,
  text,
  fill = ANIM_COLORS.text,
  fontSize = 14,
  fontWeight = "bold",
  opacity = 1,
  textAnchor = "start" as const,
}: {
  x: number;
  y: number;
  text: string;
  fill?: string;
  fontSize?: number;
  fontWeight?: string;
  opacity?: number;
  textAnchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={fontSize}
      fontWeight={fontWeight}
      fontFamily="system-ui, sans-serif"
      opacity={opacity}
      textAnchor={textAnchor}
    >
      {text}
    </text>
  );
}

export function PhoneFrame({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill="none"
        stroke={ANIM_COLORS.muted}
        strokeWidth={2}
        opacity={0.4}
      />
      {/* Notch */}
      <rect
        x={x + width / 2 - 20}
        y={y + 4}
        width={40}
        height={6}
        rx={3}
        fill={ANIM_COLORS.muted}
        opacity={0.3}
      />
    </g>
  );
}
