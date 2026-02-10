import { useState, useEffect, useCallback, useMemo, type MouseEvent as ReactMouseEvent } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTimeline, usePlayhead } from "./TimelineContext";
import type { PageRange } from "../../lib/pageGroups";
import { MINIMAP_HEIGHT } from "./timeline-types";

/* ── Merge threshold ─────────────────────────────────────────── */
const MAX_MINIMAP_BLOCKS = 100;

interface MergedBlock {
  key: number;
  startMs: number;
  endMs: number;
  color: string;
}

/** Collapse page ranges into at most MAX_MINIMAP_BLOCKS visual blocks */
function mergeMinimap(pageRanges: PageRange[]): MergedBlock[] {
  if (pageRanges.length <= MAX_MINIMAP_BLOCKS) {
    return pageRanges.map((pr) => ({
      key: pr.pageIndex,
      startMs: pr.startMs,
      endMs: pr.endMs,
      color: pr.color,
    }));
  }
  const factor = Math.ceil(pageRanges.length / MAX_MINIMAP_BLOCKS);
  const blocks: MergedBlock[] = [];
  for (let i = 0; i < pageRanges.length; i += factor) {
    const slice = pageRanges.slice(i, i + factor);
    blocks.push({
      key: i,
      startMs: slice[0]!.startMs,
      endMs: slice[slice.length - 1]!.endMs,
      color: slice[0]!.color,
    });
  }
  return blocks;
}

interface TimelineMinimapProps {
  pageRanges: PageRange[];
}

export function TimelineMinimap({ pageRanges }: TimelineMinimapProps) {
  const { currentTimeMs } = useProjectStore();
  const { totalMs, scrollRef, setSelectedPageIndex, setIsAutoFollowing } = useTimeline();
  const { trackWidth } = usePlayhead();

  const minimapScale = useMemo(() => {
    const container = scrollRef.current;
    if (!container) return 1;
    return container.clientWidth / Math.max(trackWidth, 1);
  }, [trackWidth, scrollRef]);

  const [minimapViewport, setMinimapViewport] = useState({
    left: 0,
    width: 100,
  });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const update = () => {
      const vpLeft = container.scrollLeft * minimapScale;
      const vpWidth = container.clientWidth * minimapScale;
      setMinimapViewport({ left: vpLeft, width: vpWidth });
    };
    update();
    container.addEventListener("scroll", update);
    const obs = new ResizeObserver(update);
    obs.observe(container);
    return () => {
      container.removeEventListener("scroll", update);
      obs.disconnect();
    };
  }, [minimapScale, scrollRef]);

  const handleMinimapClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const container = scrollRef.current;
      if (!container) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickFraction = (e.clientX - rect.left) / rect.width;
      container.scrollLeft =
        clickFraction * trackWidth - container.clientWidth / 2;

      // Also select the page at this position
      const clickMs = clickFraction * totalMs;
      const pageIdx = pageRanges.findIndex(
        (pr) => clickMs >= pr.startMs && clickMs < pr.endMs,
      );
      if (pageIdx !== -1) {
        setSelectedPageIndex(pageIdx);
        setIsAutoFollowing(false);
      }
    },
    [trackWidth, totalMs, scrollRef, pageRanges, setSelectedPageIndex, setIsAutoFollowing],
  );

  const mergedBlocks = useMemo(() => mergeMinimap(pageRanges), [pageRanges]);

  return (
    <div
      className="relative bg-muted/30 cursor-pointer border-b border-border/30"
      style={{ height: MINIMAP_HEIGHT }}
      onClick={handleMinimapClick}
    >
      {/* Page-colored blocks (merged when >100 pages) */}
      {mergedBlocks.map((block) => {
        const left = (block.startMs / totalMs) * 100;
        const width = Math.max(
          0.5,
          ((block.endMs - block.startMs) / totalMs) * 100,
        );
        return (
          <div
            key={block.key}
            className="absolute"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              top: 4,
              bottom: 4,
              borderRadius: 1,
              backgroundColor: block.color + "40",
            }}
          />
        );
      })}
      <div
        className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
        style={{ left: `${(currentTimeMs / totalMs) * 100}%` }}
      />
      <div
        className="absolute top-0 bottom-0 border border-foreground/20 bg-foreground/5 rounded-sm z-5"
        style={{
          left: minimapViewport.left,
          width: Math.max(minimapViewport.width, 8),
        }}
      />
    </div>
  );
}
