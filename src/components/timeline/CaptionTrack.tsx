import {
  useEffect,
  useCallback,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useAudioWaveform } from "../../hooks/useAudioWaveform";
import { WaveformCanvas } from "../WaveformCanvas";
import { useTimeline } from "./TimelineContext";
import { PageBlock } from "./PageBlock";
import { computePageGroups, msToShort } from "../../lib/pageGroups";
import {
  MIN_PX_PER_MS,
  MAX_PX_PER_MS,
  TIME_RULER_HEIGHT,
  PAGE_BLOCK_HEIGHT,
} from "./timeline-types";

interface CaptionTrackProps {
  onSplitCaption: (index: number) => void;
  onDeleteSelected: () => void;
  onStartEdit: (index: number) => void;
  onCommitEdit: () => void;
  onAddCaptionAtPlayhead: () => void;
  onRequestAddCaption: (ms: number) => void;
  onBreakPage: (pageIndex: number) => void;
  onMergeWithNext: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
}

export function CaptionTrack({
  onSplitCaption,
  onDeleteSelected,
  onStartEdit,
  onCommitEdit,
  onAddCaptionAtPlayhead,
  onRequestAddCaption,
  onBreakPage,
  onMergeWithNext,
  onDeletePage,
}: CaptionTrackProps) {
  const { captions, videoSrc, settings, trimInMs, trimOutMs, videoDurationMs } =
    useProjectStore();
  const {
    pxPerMs,
    setPxPerMs,
    dragState,
    setDragState,
    snapLineMs,
    playheadLeft,
    trackWidth,
    totalMs,
    scrollRef,
    trackRef,
    selectedPageIndex,
  } = useTimeline();

  const pageCombineMs = settings.captionConfig.pageCombineMs;
  const { pageRanges } = useMemo(
    () => computePageGroups(captions, pageCombineMs),
    [captions, pageCombineMs],
  );

  // ── First-use hint bar ──────────────────────────────────────
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return localStorage.getItem("capy:timelineHintDismissed") === "true";
    } catch {
      return false;
    }
  });
  const dismissHint = useCallback(() => {
    setHintDismissed(true);
    try {
      localStorage.setItem("capy:timelineHintDismissed", "true");
    } catch {
      /* ignore */
    }
  }, []);
  // Auto-dismiss on first page interaction
  useEffect(() => {
    if (selectedPageIndex !== null && !hintDismissed) {
      dismissHint();
    }
  }, [selectedPageIndex, hintDismissed, dismissHint]);

  const waveform = useAudioWaveform(videoSrc);

  // Time markers
  const markerInterval = pxPerMs > 0.5 ? 1000 : pxPerMs > 0.1 ? 5000 : 10000;
  const markerCount = Math.ceil(totalMs / markerInterval) + 1;

  // ── Scroll wheel zoom + pan ──────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + scroll: zoom toward cursor
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const msAtMouse = (el.scrollLeft + mouseX) / pxPerMs;
        setPxPerMs((v) => {
          const next = Math.min(
            MAX_PX_PER_MS,
            Math.max(MIN_PX_PER_MS, v * factor),
          );
          requestAnimationFrame(() => {
            el.scrollLeft = msAtMouse * next - mouseX;
          });
          return next;
        });
      } else {
        // Plain scroll / trackpad swipe: horizontal pan
        el.scrollLeft += e.deltaY || e.deltaX;
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setPxPerMs, scrollRef, pxPerMs]);

  // ── Auto-scroll to playhead ──────────────────────────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || dragState) return;
    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    if (
      playheadLeft < scrollLeft + 50 ||
      playheadLeft > scrollLeft + containerWidth - 50
    ) {
      container.scrollLeft = Math.max(0, playheadLeft - containerWidth / 3);
    }
  }, [playheadLeft, dragState, scrollRef]);

  // ── Click-to-seek ────────────────────────────────────────────
  const handleTrackClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (dragState) return;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      // getBoundingClientRect() already accounts for parent scroll offset
      const clickX = e.clientX - rect.left;
      const ms = Math.max(0, Math.min(clickX / pxPerMs, videoDurationMs));
      window.dispatchEvent(new CustomEvent("seek-video", { detail: ms }));
    },
    [pxPerMs, dragState, trackRef, videoDurationMs],
  );

  // ── Double-click to add caption ──────────────────────────────
  const handleTrackDoubleClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ms = clickX / pxPerMs;
      const isOnCaption = captions.some(
        (c) => ms >= c.startMs && ms <= c.endMs,
      );
      if (isOnCaption) return;
      onRequestAddCaption(ms);
    },
    [pxPerMs, captions, trackRef, onRequestAddCaption],
  );

  // ── Trim handle mousedown ────────────────────────────────────
  const handleTrimInDown = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      setDragState({ type: "trim-in" });
    },
    [setDragState],
  );
  const handleTrimOutDown = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      setDragState({ type: "trim-out" });
    },
    [setDragState],
  );

  const trackHeight = TIME_RULER_HEIGHT + PAGE_BLOCK_HEIGHT + 20;

  const showHint = pageRanges.length > 0 && !hintDismissed;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-x-auto overflow-y-hidden min-h-0"
    >
      {/* First-use hint bar */}
      {showHint && (
        <div className="flex items-center justify-between gap-2 px-3 py-1 bg-primary/5 border-b border-primary/10">
          <span className="text-[10px] text-muted-foreground/70">
            Pages group nearby captions together. Click a page to select it.
            Adjust grouping in sidebar.
          </span>
          <button
            onClick={dismissHint}
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground shrink-0 px-1"
          >
            ✕
          </button>
        </div>
      )}
      <div
        ref={trackRef}
        className="relative cursor-crosshair"
        style={{
          width: trackWidth,
          minWidth: "100%",
          height: trackHeight,
          minHeight: "100%",
        }}
        onClick={handleTrackClick}
        onDoubleClick={handleTrackDoubleClick}
      >
        {/* Time ruler */}
        <div
          className="relative"
          style={{ height: TIME_RULER_HEIGHT, flexShrink: 0 }}
        >
          {Array.from(
            { length: markerCount },
            (_, i) => i * markerInterval,
          ).map((ms) => (
            <div
              key={ms}
              className="absolute top-0 h-full border-l border-border/20"
              style={{ left: ms * pxPerMs }}
            >
              <span className="ml-1 text-[10px] text-muted-foreground/30 select-none font-mono">
                {msToShort(ms)}
              </span>
            </div>
          ))}
        </div>

        {/* Page blocks area */}
        <div className="relative" style={{ height: PAGE_BLOCK_HEIGHT }}>
          {pageRanges.map((pr) => (
            <PageBlock
              key={pr.pageIndex}
              page={pr}
              totalPages={pageRanges.length}
              onSplitCaption={onSplitCaption}
              onDeleteSelected={onDeleteSelected}
              onStartEdit={onStartEdit}
              onCommitEdit={onCommitEdit}
              onAddCaptionAtPlayhead={onAddCaptionAtPlayhead}
              onBreakPage={onBreakPage}
              onMergeWithNext={onMergeWithNext}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>

        {/* Waveform (behind page blocks) */}
        {waveform && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ top: TIME_RULER_HEIGHT, bottom: 0 }}
          >
            <WaveformCanvas
              peaks={waveform.peaks}
              duration={waveform.duration}
              sampleRate={waveform.sampleRate}
              pxPerMs={pxPerMs}
              height={PAGE_BLOCK_HEIGHT + 20}
            />
          </div>
        )}

        {/* Time marker lines */}
        {Array.from({ length: markerCount }, (_, i) => i * markerInterval).map(
          (ms) => (
            <div
              key={`line-${ms}`}
              className="absolute border-l border-border/10 pointer-events-none"
              style={{
                left: ms * pxPerMs,
                top: TIME_RULER_HEIGHT,
                bottom: 0,
              }}
            />
          ),
        )}

        {/* Snap line */}
        {snapLineMs !== null && (
          <div
            className="absolute top-0 h-full w-px bg-blue-400 z-30 pointer-events-none"
            style={{ left: snapLineMs * pxPerMs }}
          />
        )}

        {/* Trim overlays */}
        {trimInMs !== null && (
          <>
            <div
              className="absolute top-0 bottom-0 bg-black/40 pointer-events-none z-10"
              style={{ left: 0, width: trimInMs * pxPerMs }}
            />
            <div
              className="absolute top-0 bottom-0 w-1.5 cursor-ew-resize z-20 bg-amber-400/60 hover:bg-amber-400/80"
              style={{ left: trimInMs * pxPerMs - 3 }}
              onMouseDown={handleTrimInDown}
            />
          </>
        )}
        {trimOutMs !== null && (
          <>
            <div
              className="absolute top-0 bottom-0 bg-black/40 pointer-events-none z-10"
              style={{ left: trimOutMs * pxPerMs, right: 0 }}
            />
            <div
              className="absolute top-0 bottom-0 w-1.5 cursor-ew-resize z-20 bg-amber-400/60 hover:bg-amber-400/80"
              style={{ left: trimOutMs * pxPerMs - 3 }}
              onMouseDown={handleTrimOutDown}
            />
          </>
        )}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full z-20 pointer-events-none"
          style={{ left: playheadLeft }}
        >
          <div className="absolute inset-y-0 left-0 w-0.5 bg-red-500" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-red-500" />
        </div>
      </div>
    </div>
  );
}
