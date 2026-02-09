import { useState, useEffect, useCallback, useMemo, type MouseEvent as ReactMouseEvent } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTimeline } from "./TimelineContext";
import type { PageRange } from "../../lib/pageGroups";
import { MINIMAP_HEIGHT } from "./timeline-types";

interface TimelineMinimapProps {
  pageRanges: PageRange[];
}

export function TimelineMinimap({ pageRanges }: TimelineMinimapProps) {
  const { currentTimeMs } = useProjectStore();
  const { totalMs, trackWidth, scrollRef, setSelectedPageIndex, setIsAutoFollowing } = useTimeline();

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

  return (
    <div
      className="relative bg-muted/30 cursor-pointer border-b border-border/30"
      style={{ height: MINIMAP_HEIGHT }}
      onClick={handleMinimapClick}
    >
      {/* Page-colored blocks */}
      {pageRanges.map((pr) => {
        const left = (pr.startMs / totalMs) * 100;
        const width = Math.max(
          0.5,
          ((pr.endMs - pr.startMs) / totalMs) * 100,
        );
        return (
          <div
            key={pr.pageIndex}
            className="absolute"
            style={{
              left: `${left}%`,
              width: `${width}%`,
              top: 4,
              bottom: 4,
              borderRadius: 1,
              backgroundColor: pr.color + "40",
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
