import type { CaptionConfig } from "../src/types/captions";

export interface CompositionProps extends Record<string, unknown> {
  videoFile: string;
  /** Direct video URL — used by Player preview (bypasses staticFile) */
  videoSrc?: string;
  /** Direct captions data — used by Player preview (bypasses file fetch) */
  captionsData?: Array<{
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number | null;
    confidence: number;
  }>;
  captionStyle?: "comic" | "simple";
  highlightWords?: string[];
  /** Unified caption config — used by editor preview */
  captionConfig?: CaptionConfig;
  // Legacy props — used by CLI render path
  comicConfig?: { colors?: string[]; fontSize?: number };
  simpleConfig?: {
    fontSize?: number;
    textColor?: string;
    shadowColor?: string;
  };
}
