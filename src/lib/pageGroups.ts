import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "../types/captions";

/* ── Constants ─────────────────────────────────────────────────── */

export const PAGE_COLORS = [
  "#F97316", // orange
  "#3B82F6", // blue
  "#22C55E", // green
  "#A855F7", // purple
  "#EF4444", // red
  "#06B6D4", // cyan
];

/* ── Types ─────────────────────────────────────────────────────── */

export interface PageRange {
  pageIndex: number;
  startMs: number;
  endMs: number;
  firstCaptionIdx: number;
  lastCaptionIdx: number;
  color: string;
}

/* ── Helpers ───────────────────────────────────────────────────── */

export function msToShort(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ds = Math.floor((ms % 1000) / 100);
  return `${m}:${s.toString().padStart(2, "0")}.${ds}`;
}

/* ── Page grouping ─────────────────────────────────────────────── */

export function computePageGroups(
  captions: Caption[],
  pageCombineMs: number,
): { captionToPage: Map<number, number>; pageRanges: PageRange[] } {
  if (captions.length === 0)
    return { captionToPage: new Map<number, number>(), pageRanges: [] };

  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: pageCombineMs,
  });

  const map = new Map<number, number>();
  const ranges: PageRange[] = [];
  let captionIdx = 0;

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi]!;
    const firstIdx = captionIdx;
    for (let ti = 0; ti < page.tokens.length; ti++) {
      map.set(captionIdx, pi);
      captionIdx++;
    }
    const lastIdx = captionIdx - 1;
    const firstCap = captions[firstIdx];
    const lastCap = captions[lastIdx];
    if (firstCap && lastCap) {
      ranges.push({
        pageIndex: pi,
        startMs: firstCap.startMs,
        endMs: lastCap.endMs,
        firstCaptionIdx: firstIdx,
        lastCaptionIdx: lastIdx,
        color: PAGE_COLORS[pi % PAGE_COLORS.length]!,
      });
    }
  }

  return { captionToPage: map, pageRanges: ranges };
}

/**
 * Static mode: each caption maps 1:1 to its own page (no word-level grouping).
 */
export function computeStaticPageGroups(
  captions: Caption[],
): { captionToPage: Map<number, number>; pageRanges: PageRange[] } {
  const map = new Map<number, number>();
  const ranges: PageRange[] = [];

  for (let i = 0; i < captions.length; i++) {
    const c = captions[i]!;
    map.set(i, i);
    ranges.push({
      pageIndex: i,
      startMs: c.startMs,
      endMs: c.endMs,
      firstCaptionIdx: i,
      lastCaptionIdx: i,
      color: PAGE_COLORS[i % PAGE_COLORS.length]!,
    });
  }

  return { captionToPage: map, pageRanges: ranges };
}
