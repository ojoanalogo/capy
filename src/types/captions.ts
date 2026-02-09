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
  | "bold"
  | "karaoke"
  | "retro"
  | "typewriter"
  | "gradient"
  | "outline";
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
  // Whisper settings
  whisperModel: string;
  language: string;
  beamSize: number;
  bestOf: number;
  maxLen: number;
  splitOnWord: boolean;
}

export type PipelineStage =
  | "idle"
  | "processing"
  | "transcribing"
  | "ready"
  | "exporting";

export interface PipelineProgress {
  stage: string;
  percent: number;
  message: string;
}
