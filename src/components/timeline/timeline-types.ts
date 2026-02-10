import type { RefObject, MouseEvent as ReactMouseEvent } from "react";

/* ── Constants ─────────────────────────────────────────────────── */

export const MIN_PX_PER_MS = 0.05;
export const MAX_PX_PER_MS = 2;
export const DEFAULT_PX_PER_MS = 0.15;
export const DRAG_HANDLE_WIDTH = 12;
export const SNAP_THRESHOLD_PX = 6;
export const NUDGE_MS = 50;
export const MINIMAP_HEIGHT = 20;
export const PAGE_BLOCK_HEIGHT = 68;
export const TIME_RULER_HEIGHT = 20;
export const MIN_CAPTION_DURATION_MS = 100;
export const DEFAULT_CAPTION_COLOR = "#F97316";

/* ── Types ─────────────────────────────────────────────────────── */

export type DragState =
  | null
  | { type: "move"; index: number; offsetMs: number }
  | { type: "resize-start"; index: number }
  | { type: "resize-end"; index: number }
  | { type: "trim-in" }
  | { type: "trim-out" };

/** Stable context – only changes on user interaction (zoom, select, edit, drag) */
export interface TimelineContextValue {
  // Zoom
  pxPerMs: number;
  setPxPerMs: (v: number | ((prev: number) => number)) => void;

  // Selection
  selectedIndices: number[];
  setSelectedIndices: (v: number[] | ((prev: number[]) => number[])) => void;
  selectCaption: (index: number, e?: ReactMouseEvent) => void;

  // Page tracking (derived from playhead, used for toolbar/navigation)
  selectedPageIndex: number | null;
  setSelectedPageIndex: (v: number | null) => void;
  isAutoFollowing: boolean;
  setIsAutoFollowing: (v: boolean) => void;

  // Editing
  editingIndex: number | null;
  setEditingIndex: (v: number | null) => void;
  editText: string;
  setEditText: (v: string) => void;

  // Drag
  dragState: DragState;
  setDragState: (v: DragState) => void;
  snapLineMs: number | null;
  setSnapLineMs: (v: number | null) => void;

  // Hover
  hoveredIndex: number | null;
  setHoveredIndex: (v: number | null) => void;

  // Refs
  scrollRef: RefObject<HTMLDivElement | null>;
  trackRef: RefObject<HTMLDivElement | null>;

  // Derived (stable – only change when captions/zoom change)
  totalMs: number;
  snapTargets: number[];
}

/** Volatile context – changes every frame during playback */
export interface PlayheadContextValue {
  playheadLeft: number;
  trackWidth: number;
  snapThresholdMs: number;
}

/* ── Helpers ───────────────────────────────────────────────────── */

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function findSnap(
  ms: number,
  targets: number[],
  thresholdMs: number,
): number | null {
  let closest: number | null = null;
  let closestDist = Infinity;
  for (const t of targets) {
    const dist = Math.abs(ms - t);
    if (dist < thresholdMs && dist < closestDist) {
      closest = t;
      closestDist = dist;
    }
  }
  return closest;
}

/**
 * Clamp a caption's new start/end to prevent overlaps with adjacent captions.
 * Enforces minimum duration.
 */
export function clampCaption(
  index: number,
  newStart: number,
  newEnd: number,
  captions: { startMs: number; endMs: number }[],
): { startMs: number; endMs: number } {
  let s = Math.max(0, newStart);
  let e = newEnd;

  // Clamp against previous caption
  const prev = captions[index - 1];
  if (prev) {
    s = Math.max(s, prev.endMs);
  }

  // Clamp against next caption
  const next = captions[index + 1];
  if (next) {
    e = Math.min(e, next.startMs);
  }

  // Enforce minimum duration
  if (e - s < MIN_CAPTION_DURATION_MS) {
    if (e - newStart < MIN_CAPTION_DURATION_MS) {
      s = e - MIN_CAPTION_DURATION_MS;
    }
    if (newEnd - s < MIN_CAPTION_DURATION_MS) {
      e = s + MIN_CAPTION_DURATION_MS;
    }
  }

  return { startMs: Math.max(0, s), endMs: e };
}
