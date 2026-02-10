import { useMemo } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import {
  computePageGroups,
  computeStaticPageGroups,
  type PageRange,
} from "../lib/pageGroups";

/**
 * Single source of truth for page ranges.
 * Memoized on (captions, pageCombineMs, captionMode).
 */
export function usePageRanges(): { pageRanges: PageRange[] } {
  const captions = useProjectStore((s) => s.captions);
  const settings = useProjectStore((s) => s.settings);
  const pageCombineMs = settings.captionConfig.pageCombineMs;
  const captionMode = settings.captionMode;

  const { pageRanges } = useMemo(
    () =>
      captionMode === "static"
        ? computeStaticPageGroups(captions)
        : computePageGroups(captions, pageCombineMs),
    [captions, pageCombineMs, captionMode],
  );

  return { pageRanges };
}
