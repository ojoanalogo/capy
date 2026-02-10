export interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number;
}

export type CaptionStyle =
  | "comic"
  | "simple"
  | "neon"
  | "minimal"
  | "karaoke"
  | "retro"
  | "typewriter"
  | "gradient"
  | "outline"
  | "broadcast"
  | "handwritten"
  | "soft"
  | "clean";
export type AnimationStyle = "pop" | "slam" | "shake" | "swipe" | "fade" | "none";
export type VerticalAlign = "top" | "center" | "bottom";
export type HorizontalAlign = "left" | "center" | "right";

export interface CaptionConfig {
  fontSize: number;
  textColor: string;
  fontFamily: string;
  backgroundColor: string;
  backgroundColors: string[];
  showBackground: boolean;
  showDithering: boolean;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  verticalAlign: VerticalAlign;
  horizontalAlign: HorizontalAlign;
  bottomOffset: number;
  leftRightPadding: number;
  animationStyle: AnimationStyle;
  animationIntensity: number;
  rotation: boolean;
  rotationMax: number;
  highlightColor: string;
  highlightScale: number;
  uppercase: boolean;
  letterSpacing: number;
  lineHeight: number;
  fontWeight: number;
  wordSpacing: number;
  pageCombineMs: number;
}

// Legacy types kept for backward compat with CLI props
export interface ComicConfig {
  colors: string[];
  fontSize: number;
}

export interface SimpleConfig {
  fontSize: number;
  textColor: string;
  shadowColor: string;
}

export interface ProjectSettings {
  activePreset: CaptionStyle;
  captionConfig: CaptionConfig;
  highlightWords: string[];
  // Legacy — kept for backward compat during export
  captionStyle: CaptionStyle;
  comicConfig: ComicConfig;
  simpleConfig: SimpleConfig;
  // Caption mode
  captionMode: CaptionMode;
  // Whisper settings
  whisperModel: string;
  language: string;
  beamSize: number;
  bestOf: number;
  maxLen: number;
  splitOnWord: boolean;
}

export type CaptionMode = "karaoke" | "static";

export type PipelineStage =
  | "idle"
  | "processing"
  | "transcribing"
  | "choosing-mode"
  | "ready"
  | "exporting";

export interface PipelineProgress {
  stage: string;
  percent: number;
  message: string;
}
