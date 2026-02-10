import { useRef, useState, useCallback, useEffect, useMemo, memo } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { usePlaybackStore } from "../../stores/usePlaybackStore";
import { useTimeline } from "./TimelineContext";
import { msToShort } from "../../lib/pageGroups";
import { fmtTime, MIN_PX_PER_MS, MAX_PX_PER_MS } from "./timeline-types";
import type { PageRange } from "../../lib/pageGroups";
import {
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  ChevronsLeftRight,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Volume1,
  Volume2,
  VolumeX,
  Scissors,
  Link,
} from "lucide-react";

interface TimelineToolbarProps {
  onAddCaptionAtPlayhead: () => void;
  onDeleteSelected: () => void;
  onJumpToCaption: (direction: "prev" | "next") => void;
  onBreakPage?: () => void;
  onMergeWithNext?: () => void;
  onDeletePage?: () => void;
  selectedPageIndex: number | null;
  pageRanges: PageRange[];
}

export function TimelineToolbar({
  onAddCaptionAtPlayhead,
  onDeleteSelected,
  onJumpToCaption,
  onBreakPage,
  onMergeWithNext,
  onDeletePage,
  selectedPageIndex,
  pageRanges,
}: TimelineToolbarProps) {
  const currentTimeMs = useProjectStore((s) => s.currentTimeMs);
  const videoDurationMs = useProjectStore((s) => s.videoDurationMs);
  const captions = useProjectStore((s) => s.captions);
  const trimInMs = useProjectStore((s) => s.trimInMs);
  const trimOutMs = useProjectStore((s) => s.trimOutMs);
  const setTrimIn = useProjectStore((s) => s.setTrimIn);
  const setTrimOut = useProjectStore((s) => s.setTrimOut);
  const { isPlaying, isMuted, volume, isLooping, setIsLooping } =
    usePlaybackStore();
  const { pxPerMs, setPxPerMs, selectedIndices, totalMs, scrollRef } =
    useTimeline();

  const durationS = videoDurationMs / 1000;

  // O(log n) check instead of O(n) scan on every frame
  const playheadOnCaption = useMemo(() => {
    if (captions.length === 0) return false;
    // Binary search: find the last caption that starts <= currentTimeMs
    let lo = 0, hi = captions.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (captions[mid]!.startMs <= currentTimeMs) lo = mid;
      else hi = mid - 1;
    }
    const cap = captions[lo]!;
    return currentTimeMs >= cap.startMs && currentTimeMs <= cap.endMs;
  }, [captions, currentTimeMs]);

  // Merge caption dots when there are too many (cap at ~200 divs)
  const MAX_SEEK_DOTS = 200;
  const seekDots = useMemo(() => {
    if (videoDurationMs === 0) return [];
    if (captions.length <= MAX_SEEK_DOTS) {
      return captions.map((c) => (c.startMs / videoDurationMs) * 100);
    }
    // Merge: sample evenly
    const step = Math.ceil(captions.length / MAX_SEEK_DOTS);
    const dots: number[] = [];
    for (let i = 0; i < captions.length; i += step) {
      dots.push((captions[i]!.startMs / videoDurationMs) * 100);
    }
    return dots;
  }, [captions, videoDurationMs]);

  // ── Zoom ──────────────────────────────────────────────────────
  const zoomIn = useCallback(
    () => setPxPerMs((v) => Math.min(MAX_PX_PER_MS, v * 1.5)),
    [setPxPerMs],
  );
  const zoomOut = useCallback(
    () => setPxPerMs((v) => Math.max(MIN_PX_PER_MS, v / 1.5)),
    [setPxPerMs],
  );
  const zoomToFit = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const newPxPerMs = (container.clientWidth - 20) / Math.max(totalMs, 1000);
    setPxPerMs(Math.max(MIN_PX_PER_MS, Math.min(MAX_PX_PER_MS, newPxPerMs)));
    container.scrollLeft = 0;
  }, [totalMs, setPxPerMs, scrollRef]);

  // ── Seek bar ──────────────────────────────────────────────────
  const seekBarRef = useRef<HTMLDivElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekHoverX, setSeekHoverX] = useState<number | null>(null);

  const seekToPosition = useCallback(
    (clientX: number) => {
      const bar = seekBarRef.current;
      if (!bar || videoDurationMs === 0) return;
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const ms = fraction * videoDurationMs;
      window.dispatchEvent(new CustomEvent("seek-video", { detail: ms }));
    },
    [videoDurationMs],
  );

  useEffect(() => {
    if (!isSeeking) return;
    const onMove = (e: MouseEvent) => seekToPosition(e.clientX);
    const onUp = () => setIsSeeking(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isSeeking, seekToPosition]);

  const seekHoverMs = useMemo(() => {
    if (seekHoverX === null || !seekBarRef.current || videoDurationMs === 0)
      return null;
    const rect = seekBarRef.current.getBoundingClientRect();
    const fraction = Math.max(
      0,
      Math.min(1, (seekHoverX - rect.left) / rect.width),
    );
    return fraction * videoDurationMs;
  }, [seekHoverX, videoDurationMs]);

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border/50 bg-background/80">
      {/* Left: Playback controls */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("skip-back"))}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Back 5s"
      >
        <SkipBack className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-play"))}
        className="p-1 rounded hover:bg-muted text-foreground transition-colors"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("skip-forward"))}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Forward 5s"
      >
        <SkipForward className="h-3.5 w-3.5" />
      </button>

      {/* Center: Custom seek bar + time */}
      <div className="flex-1 flex items-center gap-2 mx-2">
        <div
          ref={seekBarRef}
          className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer relative group"
          onMouseDown={(e) => {
            setIsSeeking(true);
            seekToPosition(e.clientX);
          }}
          onMouseMove={(e) => setSeekHoverX(e.clientX)}
          onMouseLeave={() => setSeekHoverX(null)}
        >
          {/* Progress fill */}
          <div
            className="bg-primary rounded-full h-full absolute left-0 top-0 pointer-events-none"
            style={{
              width: `${videoDurationMs > 0 ? (currentTimeMs / videoDurationMs) * 100 : 0}%`,
            }}
          />
          {/* Caption density dots (capped at 200) */}
          {seekDots.map((leftPct, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                left: `${leftPct}%`,
                width: 2,
                height: 2,
                backgroundColor: "currentColor",
                opacity: 0.3,
              }}
            />
          ))}
          {/* Hover time tooltip */}
          {seekHoverMs !== null && seekBarRef.current && (
            <div
              className="absolute -top-7 px-1.5 py-0.5 rounded bg-popover border border-border shadow text-[10px] font-mono text-muted-foreground pointer-events-none whitespace-nowrap"
              style={{
                left: `${(seekHoverMs / videoDurationMs) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              {msToShort(seekHoverMs)}
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums font-mono min-w-[80px] text-center shrink-0">
          {fmtTime(currentTimeMs / 1000)} / {fmtTime(durationS)}
        </span>
      </div>

      {/* Right: Loop + Volume */}
      <button
        onClick={() => setIsLooping(!isLooping)}
        className={`p-1 rounded transition-colors ${
          isLooping
            ? "bg-primary/20 text-primary"
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        }`}
        title={isLooping ? "Disable loop" : "Enable loop"}
      >
        <Repeat className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-mute"))}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="h-3.5 w-3.5" />
        ) : volume < 50 ? (
          <Volume1 className="h-3.5 w-3.5" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={isMuted ? 0 : volume}
        onChange={(e) => {
          window.dispatchEvent(
            new CustomEvent("volume-change", {
              detail: Number(e.target.value),
            }),
          );
        }}
        className="w-[50px] h-1 rounded-full appearance-none bg-muted cursor-pointer accent-primary"
        title={`Volume: ${isMuted ? 0 : volume}%`}
      />

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Navigation */}
      <button
        onClick={() => onJumpToCaption("prev")}
        className="p-1 rounded hover:bg-muted text-muted-foreground"
        title="Previous caption"
      >
        <SkipBack className="h-3 w-3" />
      </button>
      <button
        onClick={() => onJumpToCaption("next")}
        className="p-1 rounded hover:bg-muted text-muted-foreground"
        title="Next caption"
      >
        <SkipForward className="h-3 w-3" />
      </button>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Zoom */}
      <div className="flex items-center gap-0">
        <button
          onClick={zoomOut}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
          title="Zoom out"
        >
          <ZoomOut className="h-3 w-3" />
        </button>
        <button
          onClick={zoomToFit}
          className="px-1.5 py-0.5 rounded hover:bg-muted text-[10px] text-muted-foreground font-medium"
          title="Fit to view"
        >
          Fit
        </button>
        <button
          onClick={zoomIn}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
          title="Zoom in"
        >
          <ZoomIn className="h-3 w-3" />
        </button>
      </div>

      <div className="w-px h-4 bg-border mx-0.5" />

      {/* Add + Trim */}
      {!playheadOnCaption && (
        <button
          onClick={onAddCaptionAtPlayhead}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
          title="Add caption at playhead"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
      <button
        onClick={() => {
          if (trimInMs !== null && trimOutMs !== null) {
            setTrimIn(null);
            setTrimOut(null);
          } else {
            setTrimIn(trimInMs ?? currentTimeMs);
            if (trimOutMs === null) setTrimOut(videoDurationMs);
          }
        }}
        className={`p-1 rounded text-muted-foreground ${
          trimInMs !== null
            ? "bg-amber-400/20 text-amber-500"
            : "hover:bg-muted"
        }`}
        title={trimInMs !== null ? "Clear trim" : "Set trim at playhead"}
      >
        <ChevronsLeftRight className="h-3 w-3" />
      </button>

      {/* Always-visible page count */}
      {pageRanges.length > 0 && (
        <>
          <div className="w-px h-4 bg-border mx-0.5" />
          <span className="text-[10px] text-muted-foreground/60 font-mono px-1 tabular-nums">
            {pageRanges.length} {pageRanges.length === 1 ? "page" : "pages"}
          </span>
        </>
      )}

      {/* Page actions */}
      {selectedPageIndex !== null && pageRanges[selectedPageIndex] && (
        <>
          <div className="w-px h-4 bg-border mx-0.5" />
          <span
            className="text-[10px] text-muted-foreground font-mono px-1 tabular-nums"
            style={{ color: pageRanges[selectedPageIndex]!.color }}
          >
            Page {selectedPageIndex + 1} ·{" "}
            {msToShort(pageRanges[selectedPageIndex]!.startMs)}–
            {msToShort(pageRanges[selectedPageIndex]!.endMs)}
          </span>
          <button
            onClick={onBreakPage}
            disabled={
              pageRanges[selectedPageIndex]!.lastCaptionIdx -
                pageRanges[selectedPageIndex]!.firstCaptionIdx <
              1
            }
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Break page"
          >
            <Scissors className="h-3 w-3" />
          </button>
          <button
            onClick={onMergeWithNext}
            disabled={selectedPageIndex >= pageRanges.length - 1}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            title="Merge with next page"
          >
            <Link className="h-3 w-3" />
          </button>
          <button
            onClick={onDeletePage}
            className="p-1 rounded hover:bg-destructive/20 text-destructive"
            title="Delete page"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}

      {/* Batch toolbar for multi-select */}
      {selectedIndices.length > 1 && (
        <>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-destructive/20 text-destructive text-[10px] font-medium"
            title={`Delete ${selectedIndices.length} captions`}
          >
            <Trash2 className="h-3 w-3" />
            {selectedIndices.length}
          </button>
        </>
      )}
    </div>
  );
}
