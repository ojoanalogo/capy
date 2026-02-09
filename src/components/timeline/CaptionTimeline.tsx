import { useEffect, useCallback, useRef, useState } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { usePlaybackStore } from "../../stores/usePlaybackStore";
import { toast } from "sonner";
import { TimelineProvider, useTimeline } from "./TimelineContext";
import { useTimelineDrag } from "./useTimelineDrag";
import { usePageActions } from "./usePageActions";
import { TimelineMinimap } from "./TimelineMinimap";
import { TimelineToolbar } from "./TimelineToolbar";
import { CaptionTrack } from "./CaptionTrack";
import { NUDGE_MS, clampCaption } from "./timeline-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

function TimelineInner() {
  const {
    captions,
    currentTimeMs,
    updateCaption,
    deleteCaption,
    addCaption,
  } = useProjectStore();

  const { isPlaying } = usePlaybackStore();

  const {
    selectedIndices,
    setSelectedIndices,
    editingIndex,
    setEditingIndex,
    editText,
    setEditText,
    selectedPageIndex,
    setSelectedPageIndex,
    isAutoFollowing,
    setIsAutoFollowing,
  } = useTimeline();

  const selectedIndex =
    selectedIndices.length === 1 ? selectedIndices[0]! : null;

  // Register drag handler
  useTimelineDrag();

  // Page actions
  const { breakPage, mergeWithNext, deletePage, pageRanges } = usePageActions();

  // ── Auto-follow: track playhead across pages ────────────────
  const prevIsPlaying = useRef(isPlaying);
  useEffect(() => {
    // Re-enable auto-follow when playback starts
    if (isPlaying && !prevIsPlaying.current) {
      setIsAutoFollowing(true);
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying, setIsAutoFollowing]);

  useEffect(() => {
    if (!isAutoFollowing || pageRanges.length === 0) return;

    // Find which page the playhead is in
    const pageIdx = pageRanges.findIndex(
      (pr) => currentTimeMs >= pr.startMs && currentTimeMs < pr.endMs,
    );
    if (pageIdx !== -1 && pageIdx !== selectedPageIndex) {
      setSelectedPageIndex(pageIdx);
    }
  }, [
    currentTimeMs,
    pageRanges,
    isAutoFollowing,
    selectedPageIndex,
    setSelectedPageIndex,
  ]);

  // ── Clamp selectedPageIndex after caption mutations ─────────
  useEffect(() => {
    if (selectedPageIndex !== null && selectedPageIndex >= pageRanges.length) {
      setSelectedPageIndex(
        pageRanges.length > 0 ? pageRanges.length - 1 : null,
      );
    }
  }, [pageRanges.length, selectedPageIndex, setSelectedPageIndex]);

  // ── Caption text editing ──────────────────────────────────────
  const startEdit = useCallback(
    (i: number) => {
      setEditingIndex(i);
      setEditText(captions[i]!.text);
    },
    [captions, setEditingIndex, setEditText],
  );

  const commitEdit = useCallback(() => {
    if (editingIndex !== null) {
      updateCaption(editingIndex, { text: editText });
      setEditingIndex(null);
      toast("Caption updated");
    }
  }, [editingIndex, editText, updateCaption, setEditingIndex]);

  // ── Split ─────────────────────────────────────────────────────
  const splitCaption = useCallback(
    (index: number) => {
      const cap = captions[index];
      if (!cap) return;
      let splitMs = currentTimeMs;
      if (splitMs <= cap.startMs + 100 || splitMs >= cap.endMs - 100) {
        splitMs = (cap.startMs + cap.endMs) / 2;
      }
      const words = cap.text.trim().split(/\s+/);
      const ratio = (splitMs - cap.startMs) / (cap.endMs - cap.startMs);
      const splitIdx = Math.max(
        1,
        Math.min(words.length - 1, Math.round(words.length * ratio)),
      );
      const textA = " " + words.slice(0, splitIdx).join(" ");
      const textB = " " + words.slice(splitIdx).join(" ");

      updateCaption(index, { endMs: splitMs, text: textA });
      addCaption(index + 1, {
        text: textB || " ...",
        startMs: splitMs,
        endMs: cap.endMs,
        timestampMs: splitMs,
        confidence: cap.confidence,
      });
      setSelectedIndices([index + 1]);
      setEditingIndex(index + 1);
      setEditText(textB || " ...");
      toast("Caption split — edit the new caption", {
        action: {
          label: "Undo",
          onClick: () => useProjectStore.temporal.getState().undo(),
        },
      });
    },
    [captions, currentTimeMs, updateCaption, addCaption, setSelectedIndices],
  );

  // ── Delete (batch) ─────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (selectedIndices.length === 0) return;
    const count = selectedIndices.length;
    const sorted = [...selectedIndices].sort((a, b) => b - a);
    for (const idx of sorted) {
      deleteCaption(idx);
    }
    setSelectedIndices([]);
    setEditingIndex(null);
    toast(`${count === 1 ? "Caption" : `${count} captions`} deleted`, {
      action: {
        label: "Undo",
        onClick: () => useProjectStore.temporal.getState().undo(),
      },
    });
  }, [selectedIndices, deleteCaption, setSelectedIndices, setEditingIndex]);

  // ── Navigate between captions ─────────────────────────────────
  const jumpToCaption = useCallback(
    (direction: "prev" | "next") => {
      if (captions.length === 0) return;
      let idx: number;
      if (direction === "next") {
        idx = captions.findIndex((c) => c.startMs > currentTimeMs);
        if (idx === -1) idx = 0;
      } else {
        idx = -1;
        for (let i = captions.length - 1; i >= 0; i--) {
          if (captions[i]!.startMs < currentTimeMs - 100) {
            idx = i;
            break;
          }
        }
        if (idx === -1) idx = captions.length - 1;
      }
      const cap = captions[idx];
      if (cap) {
        setSelectedIndices([idx]);
        window.dispatchEvent(
          new CustomEvent("seek-video", { detail: cap.startMs }),
        );
      }
    },
    [captions, currentTimeMs, setSelectedIndices],
  );

  // ── Add caption at playhead ────────────────────────────────────
  const addCaptionAtPlayhead = useCallback(() => {
    const insertMs = currentTimeMs;
    const isOnCaption = captions.some(
      (c) => insertMs >= c.startMs && insertMs <= c.endMs,
    );
    if (isOnCaption) return;
    const insertIdx = captions.findIndex((c) => c.startMs > insertMs);
    const idx = insertIdx === -1 ? captions.length : insertIdx;
    addCaption(idx, {
      text: " New caption",
      startMs: insertMs,
      endMs: insertMs + 300,
      timestampMs: insertMs,
      confidence: 1,
    });
    setSelectedIndices([idx]);
    setEditingIndex(idx);
    setEditText(" New caption");
    toast("Caption added");
  }, [
    currentTimeMs,
    captions,
    addCaption,
    setSelectedIndices,
    setEditingIndex,
    setEditText,
  ]);

  // ── Add caption dialog (double-click) ────────────────────────
  const [addDialogMs, setAddDialogMs] = useState<number | null>(null);
  const [addDialogText, setAddDialogText] = useState("");

  const requestAddCaption = useCallback((ms: number) => {
    setAddDialogMs(ms);
    setAddDialogText("");
  }, []);

  const confirmAddCaption = useCallback(() => {
    if (addDialogMs === null || !addDialogText.trim()) return;
    const insertMs = addDialogMs;
    const insertIdx = captions.findIndex((c) => c.startMs > insertMs);
    const idx = insertIdx === -1 ? captions.length : insertIdx;
    addCaption(idx, {
      text: " " + addDialogText.trim(),
      startMs: insertMs,
      endMs: insertMs + 300,
      timestampMs: insertMs,
      confidence: 1,
    });
    setSelectedIndices([idx]);
    setEditingIndex(idx);
    setEditText(" " + addDialogText.trim());
    toast("Caption added");
    setAddDialogMs(null);
    setAddDialogText("");
  }, [
    addDialogMs,
    addDialogText,
    captions,
    addCaption,
    setSelectedIndices,
    setEditingIndex,
    setEditText,
  ]);

  // ── Page actions ──────────────────────────────────────────────
  const handleBreakPage = useCallback(() => {
    if (selectedPageIndex !== null) breakPage(selectedPageIndex);
  }, [selectedPageIndex, breakPage]);

  const handleMergeWithNext = useCallback(() => {
    if (selectedPageIndex !== null) mergeWithNext(selectedPageIndex);
  }, [selectedPageIndex, mergeWithNext]);

  const handleDeletePage = useCallback(() => {
    if (selectedPageIndex !== null) {
      deletePage(selectedPageIndex);
      setSelectedPageIndex(null);
    }
  }, [selectedPageIndex, deletePage, setSelectedPageIndex]);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // Space: toggle play
      if (e.code === "Space") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-play"));
        return;
      }

      // Cmd+Z / Cmd+Shift+Z: undo/redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useProjectStore.temporal.getState().redo();
          toast("Redone");
        } else {
          useProjectStore.temporal.getState().undo();
          toast("Undone");
        }
        return;
      }

      // ArrowUp/Down: navigate between pages
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (pageRanges.length > 0) {
          const newIdx =
            selectedPageIndex !== null
              ? Math.max(0, selectedPageIndex - 1)
              : 0;
          setSelectedPageIndex(newIdx);
          setIsAutoFollowing(false);
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (pageRanges.length > 0) {
          const newIdx =
            selectedPageIndex !== null
              ? Math.min(pageRanges.length - 1, selectedPageIndex + 1)
              : 0;
          setSelectedPageIndex(newIdx);
          setIsAutoFollowing(false);
        }
        return;
      }

      // Arrow left/right: nudge selected or skip
      if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (selectedIndices.length > 0) {
          const shift = e.shiftKey ? NUDGE_MS * 5 : NUDGE_MS;
          for (const si of selectedIndices) {
            const cap = captions[si];
            if (!cap) continue;
            const clamped = clampCaption(
              si,
              cap.startMs - shift,
              cap.endMs - shift,
              captions,
            );
            updateCaption(si, {
              startMs: clamped.startMs,
              endMs: clamped.endMs,
            });
          }
        } else {
          window.dispatchEvent(new CustomEvent("skip-back"));
        }
        return;
      }
      if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (selectedIndices.length > 0) {
          const shift = e.shiftKey ? NUDGE_MS * 5 : NUDGE_MS;
          for (const si of selectedIndices) {
            const cap = captions[si];
            if (!cap) continue;
            const clamped = clampCaption(
              si,
              cap.startMs + shift,
              cap.endMs + shift,
              captions,
            );
            updateCaption(si, {
              startMs: clamped.startMs,
              endMs: clamped.endMs,
            });
          }
        } else {
          window.dispatchEvent(new CustomEvent("skip-forward"));
        }
        return;
      }

      if (selectedIndices.length === 0) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "Enter" && selectedIndex !== null) {
        e.preventDefault();
        startEdit(selectedIndex);
      } else if (e.key === "Escape") {
        setSelectedIndices([]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectedIndices,
    selectedIndex,
    captions,
    deleteSelected,
    updateCaption,
    startEdit,
    setSelectedIndices,
    pageRanges,
    selectedPageIndex,
    setSelectedPageIndex,
    setIsAutoFollowing,
  ]);

  return (
    <div className="flex flex-col h-full select-none">
      <TimelineMinimap pageRanges={pageRanges} />
      <TimelineToolbar
        onAddCaptionAtPlayhead={addCaptionAtPlayhead}
        onDeleteSelected={deleteSelected}
        onJumpToCaption={jumpToCaption}
        onBreakPage={handleBreakPage}
        onMergeWithNext={handleMergeWithNext}
        onDeletePage={handleDeletePage}
        selectedPageIndex={selectedPageIndex}
        pageRanges={pageRanges}
      />
      <CaptionTrack
        onSplitCaption={splitCaption}
        onDeleteSelected={deleteSelected}
        onStartEdit={startEdit}
        onCommitEdit={commitEdit}
        onAddCaptionAtPlayhead={addCaptionAtPlayhead}
        onRequestAddCaption={requestAddCaption}
        onBreakPage={breakPage}
        onMergeWithNext={mergeWithNext}
        onDeletePage={handleDeletePage}
      />

      <Dialog
        open={addDialogMs !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogMs(null);
            setAddDialogText("");
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Add caption</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmAddCaption();
            }}
          >
            <Input
              autoFocus
              placeholder="Caption text…"
              value={addDialogText}
              onChange={(e) => setAddDialogText(e.target.value)}
            />
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddDialogMs(null);
                  setAddDialogText("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!addDialogText.trim()}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CaptionTimeline() {
  return (
    <TimelineProvider>
      <TimelineInner />
    </TimelineProvider>
  );
}
