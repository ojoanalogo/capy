import { useEffect, useRef } from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTimeline } from "./TimelineContext";
import { findSnap, clampCaption, SNAP_THRESHOLD_PX } from "./timeline-types";

/**
 * Handles all drag interactions on the timeline:
 * - Move caption (with overlap prevention + snap)
 * - Resize start/end (with overlap prevention + snap)
 * - Trim in/out handles
 *
 * Uses refs for mutable values so the effect only re-registers when
 * dragState changes (start/stop), not on every frame during drag.
 */
export function useTimelineDrag() {
  const {
    dragState,
    setDragState,
    setSnapLineMs,
    pxPerMs,
    scrollRef,
    trackRef,
    snapTargets,
    snapThresholdMs,
  } = useTimeline();

  // Keep mutable values in refs to avoid tearing down listeners mid-drag
  const pxPerMsRef = useRef(pxPerMs);
  pxPerMsRef.current = pxPerMs;
  const snapTargetsRef = useRef(snapTargets);
  snapTargetsRef.current = snapTargets;
  const snapThresholdMsRef = useRef(snapThresholdMs);
  snapThresholdMsRef.current = snapThresholdMs;

  useEffect(() => {
    if (!dragState) return;

    const onMouseMove = (e: MouseEvent) => {
      // Read current values from store/refs (NOT from closure)
      const {
        captions,
        updateCaption,
        trimInMs,
        trimOutMs,
        videoDurationMs,
        setTrimIn,
        setTrimOut,
      } = useProjectStore.getState();

      const curPxPerMs = pxPerMsRef.current;
      const curSnapTargets = snapTargetsRef.current;
      const curSnapThresholdMs = snapThresholdMsRef.current;

      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      // getBoundingClientRect() already accounts for parent scroll offset
      const mouseMs = Math.max(
        0,
        Math.min(
          (e.clientX - rect.left) / curPxPerMs,
          videoDurationMs,
        ),
      );

      if (dragState.type === "trim-in") {
        const clamped = Math.max(
          0,
          Math.min(mouseMs, (trimOutMs ?? videoDurationMs) - 500),
        );
        setTrimIn(clamped);
        setSnapLineMs(null);
        return;
      }

      if (dragState.type === "trim-out") {
        const clamped = Math.min(
          videoDurationMs,
          Math.max(mouseMs, (trimInMs ?? 0) + 500),
        );
        setTrimOut(clamped);
        setSnapLineMs(null);
        return;
      }

      const cap = captions[dragState.index];
      if (!cap) return;

      if (dragState.type === "resize-start") {
        const snapped = findSnap(mouseMs, curSnapTargets, curSnapThresholdMs);
        const rawStart = snapped ?? mouseMs;
        const clamped = clampCaption(
          dragState.index,
          rawStart,
          cap.endMs,
          captions,
        );
        setSnapLineMs(snapped);
        updateCaption(dragState.index, { startMs: clamped.startMs });
      } else if (dragState.type === "resize-end") {
        const snapped = findSnap(mouseMs, curSnapTargets, curSnapThresholdMs);
        const rawEnd = snapped ?? mouseMs;
        const clamped = clampCaption(
          dragState.index,
          cap.startMs,
          Math.min(rawEnd, videoDurationMs),
          captions,
        );
        setSnapLineMs(snapped);
        updateCaption(dragState.index, { endMs: clamped.endMs });
      } else if (dragState.type === "move") {
        const duration = cap.endMs - cap.startMs;
        let newStart = Math.max(0, mouseMs - dragState.offsetMs);
        // Clamp so end doesn't exceed video duration
        if (newStart + duration > videoDurationMs) {
          newStart = videoDurationMs - duration;
        }

        // Try snapping start edge
        const snappedStart = findSnap(
          newStart,
          curSnapTargets,
          curSnapThresholdMs,
        );
        if (snappedStart !== null) {
          newStart = snappedStart;
          setSnapLineMs(snappedStart);
        } else {
          // Try snapping end edge
          const snappedEnd = findSnap(
            newStart + duration,
            curSnapTargets,
            curSnapThresholdMs,
          );
          if (snappedEnd !== null) {
            newStart = snappedEnd - duration;
            setSnapLineMs(snappedEnd);
          } else {
            setSnapLineMs(null);
          }
        }

        const clamped = clampCaption(
          dragState.index,
          newStart,
          newStart + duration,
          captions,
        );
        updateCaption(dragState.index, {
          startMs: clamped.startMs,
          endMs: clamped.endMs,
        });
      }
    };

    const onMouseUp = () => {
      setDragState(null);
      setSnapLineMs(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // Only depend on dragState (to register/unregister) and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState, setDragState, setSnapLineMs]);
}
