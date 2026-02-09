import { useCallback, useMemo } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { computePageGroups } from "../../lib/pageGroups";
import { toast } from "sonner";

export function usePageActions() {
  const { captions, settings, updateCaption, deleteCaption } = useProjectStore();
  const pageCombineMs = settings.captionConfig.pageCombineMs;

  const { pageRanges } = useMemo(
    () => computePageGroups(captions, pageCombineMs),
    [captions, pageCombineMs],
  );

  /**
   * Break a page into two by inserting a gap > pageCombineMs
   * between two captions within the page (at the midpoint).
   */
  const breakPage = useCallback(
    (pageIndex: number) => {
      const page = pageRanges[pageIndex];
      if (!page) return;

      const captionCount =
        page.lastCaptionIdx - page.firstCaptionIdx + 1;
      if (captionCount < 2) {
        toast.error("Can't break a page with only one caption");
        return;
      }

      // Find the midpoint pair of captions
      const midIdx =
        page.firstCaptionIdx + Math.floor(captionCount / 2);
      const capBefore = captions[midIdx - 1];
      const capAfter = captions[midIdx];
      if (!capBefore || !capAfter) return;

      // Insert a gap > pageCombineMs between them
      const currentGap = capAfter.startMs - capBefore.endMs;
      const requiredGap = pageCombineMs + 50; // 50ms buffer
      if (currentGap >= requiredGap) {
        // Already has enough gap — shouldn't happen but handle gracefully
        toast("Page already broken at this point");
        return;
      }

      const halfNeeded = (requiredGap - currentGap) / 2;
      updateCaption(midIdx - 1, {
        endMs: capBefore.endMs - halfNeeded,
      });
      updateCaption(midIdx, {
        startMs: capAfter.startMs + halfNeeded,
      });

      toast("Page broken", {
        action: {
          label: "Undo",
          onClick: () => useProjectStore.temporal.getState().undo(),
        },
      });
    },
    [pageRanges, captions, pageCombineMs, updateCaption],
  );

  /**
   * Merge this page with the next by reducing the gap between
   * the last caption of this page and the first caption of the next page.
   */
  const mergeWithNext = useCallback(
    (pageIndex: number) => {
      const page = pageRanges[pageIndex];
      const nextPage = pageRanges[pageIndex + 1];
      if (!page || !nextPage) {
        toast.error("No next page to merge with");
        return;
      }

      const lastCap = captions[page.lastCaptionIdx];
      const firstCap = captions[nextPage.firstCaptionIdx];
      if (!lastCap || !firstCap) return;

      const currentGap = firstCap.startMs - lastCap.endMs;
      if (currentGap < pageCombineMs) {
        toast("Pages are already merged");
        return;
      }

      // Reduce gap to pageCombineMs / 2 (well under threshold)
      const targetGap = Math.min(pageCombineMs * 0.3, 100);
      const midpoint = (lastCap.endMs + firstCap.startMs) / 2;

      updateCaption(page.lastCaptionIdx, {
        endMs: midpoint - targetGap / 2,
      });
      updateCaption(nextPage.firstCaptionIdx, {
        startMs: midpoint + targetGap / 2,
      });

      toast("Pages merged", {
        action: {
          label: "Undo",
          onClick: () => useProjectStore.temporal.getState().undo(),
        },
      });
    },
    [pageRanges, captions, pageCombineMs, updateCaption],
  );

  const deletePage = useCallback(
    (pageIndex: number) => {
      const page = pageRanges[pageIndex];
      if (!page) return;
      // Delete from last to first to preserve indices
      for (let i = page.lastCaptionIdx; i >= page.firstCaptionIdx; i--) {
        deleteCaption(i);
      }
      toast(
        `Page ${pageIndex + 1} deleted (${page.lastCaptionIdx - page.firstCaptionIdx + 1} captions)`,
        {
          action: {
            label: "Undo",
            onClick: () => useProjectStore.temporal.getState().undo(),
          },
        },
      );
    },
    [pageRanges, deleteCaption],
  );

  return { breakPage, mergeWithNext, deletePage, pageRanges };
}
