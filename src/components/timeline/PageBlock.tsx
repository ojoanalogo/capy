import { useCallback, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTimeline } from "./TimelineContext";
import type { PageRange } from "../../lib/pageGroups";
import type { CaptionMode } from "../../types/captions";
import { msToShort } from "../../lib/pageGroups";
import { Pencil, Scissors, Trash2, X, Link, Plus } from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "../ui/context-menu";

/* ── Internal constants ─────────────────────────────────────── */

const HEADER_H = 16;
const BAR_AREA_TOP = HEADER_H + 2;
const BAR_INSET = 3;
const CAP_HANDLE_W = 8;
const PAGE_EDGE_W = 8;

/* ── Helper ─────────────────────────────────────────────────── */

function getCursorForPosition(
  e: ReactMouseEvent,
  el: HTMLElement,
): "w-resize" | "e-resize" | "grab" {
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < CAP_HANDLE_W) return "w-resize";
  if (x > rect.width - CAP_HANDLE_W) return "e-resize";
  return "grab";
}

/* ── Props ──────────────────────────────────────────────────── */

interface PageBlockProps {
  page: PageRange;
  totalPages: number;
  captionMode: CaptionMode;
  onSplitCaption: (index: number) => void;
  onDeleteSelected: () => void;
  onStartEdit: (index: number) => void;
  onCommitEdit: () => void;
  onAddCaptionAtPlayhead?: () => void;
  onBreakPage: (pageIndex: number) => void;
  onMergeWithNext: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
}

/* ── Component ──────────────────────────────────────────────── */

export function PageBlock({
  page,
  totalPages,
  captionMode,
  onSplitCaption,
  onDeleteSelected,
  onStartEdit,
  onCommitEdit,
  onAddCaptionAtPlayhead,
  onBreakPage,
  onMergeWithNext,
  onDeletePage,
}: PageBlockProps) {
  const { captions, currentTimeMs } = useProjectStore();
  const {
    pxPerMs,
    selectedIndices,
    setSelectedIndices,
    selectCaption,
    selectedPageIndex,
    setSelectedPageIndex,
    setIsAutoFollowing,
    editingIndex,
    setEditingIndex,
    editText,
    setEditText,
    dragState,
    setDragState,
    hoveredIndex,
    setHoveredIndex,
    scrollRef,
    trackRef,
  } = useTimeline();

  // ── Page metrics ──────────────────────────────────────────
  const pageLeft = page.startMs * pxPerMs;
  const pageWidth = Math.max(40, (page.endMs - page.startMs) * pxPerMs);
  const isActive = currentTimeMs >= page.startMs && currentTimeMs < page.endMs;
  const isSelectedPage = selectedPageIndex === page.pageIndex;
  const captionCount = page.lastCaptionIdx - page.firstCaptionIdx + 1;

  const pageText = captions
    .slice(page.firstCaptionIdx, page.lastCaptionIdx + 1)
    .map((c) => c.text.trim())
    .join(" ");

  // ── Toolbar / tooltip targets ──────────────────────────────
  const toolbarIdx = (() => {
    if (editingIndex !== null || dragState || selectedIndices.length !== 1)
      return null;
    const idx = selectedIndices[0]!;
    if (idx < page.firstCaptionIdx || idx > page.lastCaptionIdx) return null;
    return idx;
  })();

  const tooltipIdx =
    hoveredIndex !== null &&
    hoveredIndex >= page.firstCaptionIdx &&
    hoveredIndex <= page.lastCaptionIdx &&
    !selectedIndices.includes(hoveredIndex) &&
    !dragState
      ? hoveredIndex
      : null;

  // ── Handlers ──────────────────────────────────────────────
  const handlePageClick = useCallback(
    (e: ReactMouseEvent) => {
      setSelectedPageIndex(page.pageIndex);
      setIsAutoFollowing(false);
    },
    [page.pageIndex, setSelectedPageIndex, setIsAutoFollowing],
  );

  const handlePageEdgeDown = useCallback(
    (e: ReactMouseEvent, edge: "start" | "end") => {
      e.stopPropagation();
      const idx = edge === "start" ? page.firstCaptionIdx : page.lastCaptionIdx;
      setDragState({
        type: edge === "start" ? "resize-start" : "resize-end",
        index: idx,
      });
    },
    [page.firstCaptionIdx, page.lastCaptionIdx, setDragState],
  );

  const isStatic = captionMode === "static";

  const handleCaptionMouseDown = useCallback(
    (e: ReactMouseEvent, index: number, captionEl: HTMLElement) => {
      e.stopPropagation();

      // In static mode, only select — no drag/resize on individual caption bars
      if (isStatic) {
        selectCaption(index, e);
        setSelectedPageIndex(page.pageIndex);
        setIsAutoFollowing(false);
        return;
      }

      const cursor = getCursorForPosition(e, captionEl);
      const cap = captions[index]!;

      if (cursor === "w-resize") {
        setDragState({ type: "resize-start", index });
      } else if (cursor === "e-resize") {
        setDragState({ type: "resize-end", index });
      } else {
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        // getBoundingClientRect() already accounts for parent scroll offset
        const clickMs = (e.clientX - rect.left) / pxPerMs;
        setDragState({
          type: "move",
          index,
          offsetMs: clickMs - cap.startMs,
        });
      }
      selectCaption(index, e);
      setSelectedPageIndex(page.pageIndex);
      setIsAutoFollowing(false);
    },
    [
      isStatic,
      captions,
      pxPerMs,
      selectCaption,
      setDragState,
      scrollRef,
      trackRef,
      page.pageIndex,
      setSelectedPageIndex,
      setIsAutoFollowing,
    ],
  );

  const selectAllInPage = useCallback(() => {
    const indices: number[] = [];
    for (let i = page.firstCaptionIdx; i <= page.lastCaptionIdx; i++)
      indices.push(i);
    setSelectedIndices(indices);
  }, [page.firstCaptionIdx, page.lastCaptionIdx, setSelectedIndices]);

  // ── Toolbar / tooltip positioning ──────────────────────────
  const toolbarLeft =
    toolbarIdx !== null
      ? ((captions[toolbarIdx]!.startMs + captions[toolbarIdx]!.endMs) / 2 -
          page.startMs) *
        pxPerMs
      : 0;

  const tooltipLeft =
    tooltipIdx !== null
      ? ((captions[tooltipIdx]!.startMs + captions[tooltipIdx]!.endMs) / 2 -
          page.startMs) *
        pxPerMs
      : 0;

  const pageRef = useRef<HTMLDivElement>(null);

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      ref={pageRef}
      className="absolute"
      style={{ left: pageLeft, width: pageWidth, top: 0, bottom: 0 }}
    >
      {/* ── Floating toolbar ──────────────────────────────── */}
      {toolbarIdx !== null && pageRef.current && (() => {
        const rect = pageRef.current!.getBoundingClientRect();
        return (
        <div
          className="fixed z-50 flex items-center gap-0.5 rounded-md border border-border bg-popover shadow-lg px-1 py-0.5"
          style={{
            top: rect.top - 4,
            left: rect.left + toolbarLeft,
            transform: "translate(-50%, -100%)",
            whiteSpace: "nowrap",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-muted-foreground font-mono px-1 tabular-nums">
            <span style={{ color: page.color, fontWeight: 600 }}>
              Page {page.pageIndex + 1}
            </span>
            {" · "}
            {msToShort(captions[toolbarIdx]!.startMs)}–
            {msToShort(captions[toolbarIdx]!.endMs)}
          </span>
          <div className="w-px h-3 bg-border mx-0.5" />
          <button
            onClick={() => onStartEdit(toolbarIdx)}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Edit text (Enter)"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onSplitCaption(toolbarIdx)}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Split at playhead"
          >
            <Scissors className="h-3 w-3" />
          </button>
          <button
            onClick={onDeleteSelected}
            className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
            title="Delete (Backspace)"
          >
            <Trash2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => setSelectedIndices([])}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground"
            title="Deselect (Esc)"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        );
      })()}

      {/* ── Hover tooltip ──────────────────────────────────── */}
      {tooltipIdx !== null && pageRef.current && (() => {
        const rect = pageRef.current!.getBoundingClientRect();
        return (
        <div
          className="fixed z-50 px-2 py-1 rounded bg-popover border border-border shadow-lg pointer-events-none"
          style={{
            top: rect.top - 4,
            left: rect.left + tooltipLeft,
            transform: "translate(-50%, -100%)",
            whiteSpace: "nowrap",
            maxWidth: 240,
          }}
        >
          <div className="text-[10px] text-muted-foreground font-mono">
            <span style={{ color: page.color, fontWeight: 600 }}>
              Page {page.pageIndex + 1}
            </span>
            {" · "}
            {msToShort(captions[tooltipIdx]!.startMs)} –{" "}
            {msToShort(captions[tooltipIdx]!.endMs)}
          </div>
          <div className="text-xs truncate text-foreground/80 mt-0.5">
            {captions[tooltipIdx]!.text.trim()}
          </div>
        </div>
        );
      })()}

      {/* ── Page context menu ──────────────────────────────── */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* Page block card */}
          <div
            className="absolute rounded-md overflow-hidden transition-all"
            style={{
              top: 3,
              bottom: 3,
              left: 0,
              right: 0,
              backgroundColor: isSelectedPage
                ? page.color + "12"
                : isActive
                  ? page.color + "0A"
                  : page.color + "06",
              borderLeft: `3px solid ${page.color}`,
              outline: isSelectedPage ? `2px solid ${page.color}60` : "none",
              outlineOffset: 0,
            }}
            onClick={handlePageClick}
          >
            {/* Page header */}
            <div
              className="flex items-center gap-1.5 px-2 select-none"
              style={{ height: HEADER_H }}
            >
              <span
                className="text-[10px] font-bold shrink-0"
                style={{ color: page.color }}
              >
                Page {page.pageIndex + 1}
              </span>
              <span className="text-[9px] text-muted-foreground/60 font-mono tabular-nums shrink-0">
                {msToShort(page.startMs)}–{msToShort(page.endMs)}
              </span>
              <span className="text-[9px] text-muted-foreground/40 truncate">
                {pageText}
              </span>
            </div>

            {/* Left page edge handle */}
            <div
              className="absolute left-0 top-0 bottom-0 cursor-ew-resize z-10 flex items-center justify-center"
              style={{ width: PAGE_EDGE_W }}
              onMouseDown={(e) => handlePageEdgeDown(e, "start")}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: isSelectedPage ? 4 : 2,
                  height: 16,
                  backgroundColor: isSelectedPage
                    ? page.color + "B3"
                    : page.color + "4D",
                }}
              />
            </div>

            {/* Right page edge handle */}
            <div
              className="absolute right-0 top-0 bottom-0 cursor-ew-resize z-10 flex items-center justify-center"
              style={{ width: PAGE_EDGE_W }}
              onMouseDown={(e) => handlePageEdgeDown(e, "end")}
            >
              <div
                className="rounded-full transition-all"
                style={{
                  width: isSelectedPage ? 4 : 2,
                  height: 16,
                  backgroundColor: isSelectedPage
                    ? page.color + "B3"
                    : page.color + "4D",
                }}
              />
            </div>

            {/* Caption bars area */}
            <div
              className="absolute left-0 right-0"
              style={{ top: BAR_AREA_TOP, bottom: 0 }}
            >
              {Array.from({ length: captionCount }, (_, localIdx) => {
                const i = page.firstCaptionIdx + localIdx;
                const cap = captions[i]!;
                const capLeft = (cap.startMs - page.startMs) * pxPerMs;
                const capWidth = Math.max(
                  20,
                  (cap.endMs - cap.startMs) * pxPerMs,
                );
                const isCapActive =
                  currentTimeMs >= cap.startMs && currentTimeMs < cap.endMs;
                const isSelected = selectedIndices.includes(i);
                const isHovered = hoveredIndex === i;
                const isEditing = editingIndex === i;
                const canSplit =
                  currentTimeMs > cap.startMs + 100 &&
                  currentTimeMs < cap.endMs - 100;
                const showSplit = isSelected && !isEditing && canSplit;
                const splitLeft = showSplit
                  ? (currentTimeMs - cap.startMs) * pxPerMs
                  : 0;

                return (
                  <ContextMenu key={i}>
                    <ContextMenuTrigger asChild>
                      <div
                        className="absolute flex items-center overflow-hidden rounded-sm text-xs font-medium select-none"
                        style={{
                          left: capLeft,
                          width: capWidth,
                          top: BAR_INSET,
                          bottom: BAR_INSET,
                          backgroundColor: isCapActive
                            ? page.color + "50"
                            : isHovered && !isSelected
                              ? page.color + "30"
                              : page.color + "18",
                          borderLeft: `2px solid ${
                            isCapActive
                              ? page.color
                              : isSelected
                                ? page.color + "90"
                                : page.color + "50"
                          }`,
                          outline: isSelected
                            ? `2px solid ${page.color}99`
                            : isHovered
                              ? `1px solid ${page.color}44`
                              : "none",
                          outlineOffset: 0,
                          cursor: isStatic ? "default" : dragState ? "grabbing" : "default",
                          transition: "background-color 150ms",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCaption(i, e);
                          setSelectedPageIndex(page.pageIndex);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          onStartEdit(i);
                        }}
                        onMouseDown={(e) =>
                          handleCaptionMouseDown(e, i, e.currentTarget)
                        }
                        onMouseMove={(e) => {
                          if (dragState || isStatic) return;
                          const c = getCursorForPosition(e, e.currentTarget);
                          e.currentTarget.style.cursor =
                            c === "grab" ? "grab" : c;
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Left resize handle (karaoke only) */}
                        {!isStatic && (
                        <div
                          className="absolute left-0 top-0 bottom-0 cursor-w-resize flex items-center justify-center"
                          style={{ width: CAP_HANDLE_W }}
                        >
                          <div
                            className="rounded-full transition-all"
                            style={{
                              width: isHovered || isSelected ? 3 : 1.5,
                              height: 12,
                              backgroundColor:
                                isHovered || isSelected
                                  ? page.color + "B3"
                                  : page.color + "4D",
                            }}
                          />
                        </div>
                        )}

                        {/* Caption text */}
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editText}
                            onChange={(ev) => setEditText(ev.target.value)}
                            onBlur={onCommitEdit}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") onCommitEdit();
                              if (ev.key === "Escape") setEditingIndex(null);
                            }}
                            className="h-full w-full bg-transparent px-2 text-xs outline-none"
                            onClick={(ev) => ev.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate px-2 text-foreground/70 text-[11px]">
                            {cap.text.trim()}
                          </span>
                        )}

                        {/* Right resize handle (karaoke only) */}
                        {!isStatic && (
                        <div
                          className="absolute right-0 top-0 bottom-0 cursor-e-resize flex items-center justify-center"
                          style={{ width: CAP_HANDLE_W }}
                        >
                          <div
                            className="rounded-full transition-all"
                            style={{
                              width: isHovered || isSelected ? 3 : 1.5,
                              height: 12,
                              backgroundColor:
                                isHovered || isSelected
                                  ? page.color + "B3"
                                  : page.color + "4D",
                            }}
                          />
                        </div>
                        )}

                        {/* Split preview line */}
                        {showSplit && (
                          <div
                            className="absolute top-0 bottom-0 w-px pointer-events-none"
                            style={{
                              left: splitLeft,
                              borderLeft: "1px dashed rgba(249,115,22,0.5)",
                            }}
                          />
                        )}
                      </div>
                    </ContextMenuTrigger>

                    {/* Caption context menu */}
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => onStartEdit(i)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit Text
                        <ContextMenuShortcut>Enter</ContextMenuShortcut>
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => onSplitCaption(i)}
                        disabled={!canSplit}
                      >
                        <Scissors className="h-3.5 w-3.5 mr-2" />
                        Split at Playhead
                      </ContextMenuItem>
                      {onAddCaptionAtPlayhead && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={onAddCaptionAtPlayhead}>
                            Add Caption at Playhead
                          </ContextMenuItem>
                        </>
                      )}
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={onDeleteSelected}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                        {selectedIndices.length > 1
                          ? ` (${selectedIndices.length})`
                          : ""}
                        <ContextMenuShortcut>Del</ContextMenuShortcut>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          </div>
        </ContextMenuTrigger>

        {/* Page context menu */}
        <ContextMenuContent>
          <ContextMenuItem
            onClick={() => onBreakPage(page.pageIndex)}
            disabled={captionCount < 2}
          >
            <Scissors className="h-3.5 w-3.5 mr-2" />
            Break Page
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onMergeWithNext(page.pageIndex)}
            disabled={page.pageIndex >= totalPages - 1}
          >
            <Link className="h-3.5 w-3.5 mr-2" />
            Merge with Next
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={selectAllInPage}>
            Select All Captions
            <ContextMenuShortcut>{captionCount}</ContextMenuShortcut>
          </ContextMenuItem>
          {onAddCaptionAtPlayhead && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={onAddCaptionAtPlayhead}>
                <Plus className="h-3.5 w-3.5 mr-2" />
                Add Caption at Playhead
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDeletePage(page.pageIndex)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete Page
            <ContextMenuShortcut>{captionCount} cap</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
