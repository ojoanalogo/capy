import {
  createContext,
  useContext,
  useRef,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useProjectStore } from "../../stores/useProjectStore";
import {
  DEFAULT_PX_PER_MS,
  SNAP_THRESHOLD_PX,
  type DragState,
  type TimelineContextValue,
} from "./timeline-types";

const TimelineContext = createContext<TimelineContextValue | null>(null);

export function useTimeline(): TimelineContextValue {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be used within TimelineProvider");
  return ctx;
}

export function TimelineProvider({ children }: { children: ReactNode }) {
  const { captions, currentTimeMs, videoDurationMs, trimOutMs } =
    useProjectStore();

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Zoom
  const [pxPerMs, setPxPerMs] = useState(DEFAULT_PX_PER_MS);

  // Selection
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Page tracking
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(
    null,
  );
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);

  // Editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Drag
  const [dragState, setDragState] = useState<DragState>(null);
  const [snapLineMs, setSnapLineMs] = useState<number | null>(null);

  // Hover
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Derived values
  const totalMs = useMemo(() => {
    const effectiveDuration = trimOutMs ?? videoDurationMs;
    const lastCaptionEnd =
      captions.length > 0 ? captions[captions.length - 1]!.endMs : 0;
    return Math.max(effectiveDuration, lastCaptionEnd) + 1000;
  }, [captions, videoDurationMs, trimOutMs]);

  const snapTargets = useMemo(() => {
    const targets: number[] = [];
    for (const c of captions) {
      targets.push(c.startMs, c.endMs);
    }
    return targets;
  }, [captions]);

  const snapThresholdMs = SNAP_THRESHOLD_PX / pxPerMs;
  const trackWidth = totalMs * pxPerMs;
  const playheadLeft = currentTimeMs * pxPerMs;

  // Selection with shift/cmd
  const selectCaption = useCallback(
    (index: number, e?: ReactMouseEvent) => {
      if (e?.shiftKey && selectedIndices.length > 0) {
        const anchor = selectedIndices[0]!;
        const min = Math.min(anchor, index);
        const max = Math.max(anchor, index);
        const range: number[] = [];
        for (let i = min; i <= max; i++) range.push(i);
        setSelectedIndices(range);
      } else if (e?.metaKey || e?.ctrlKey) {
        setSelectedIndices((prev) =>
          prev.includes(index)
            ? prev.filter((i) => i !== index)
            : [...prev, index],
        );
      } else {
        setSelectedIndices([index]);
      }
    },
    [selectedIndices],
  );

  const value = useMemo<TimelineContextValue>(
    () => ({
      pxPerMs,
      setPxPerMs,
      selectedIndices,
      setSelectedIndices,
      selectCaption,
      selectedPageIndex,
      setSelectedPageIndex,
      isAutoFollowing,
      setIsAutoFollowing,
      editingIndex,
      setEditingIndex,
      editText,
      setEditText,
      dragState,
      setDragState,
      snapLineMs,
      setSnapLineMs,
      hoveredIndex,
      setHoveredIndex,
      scrollRef,
      trackRef,
      totalMs,
      trackWidth,
      playheadLeft,
      snapThresholdMs,
      snapTargets,
    }),
    [
      pxPerMs,
      selectedIndices,
      selectCaption,
      selectedPageIndex,
      isAutoFollowing,
      editingIndex,
      editText,
      dragState,
      snapLineMs,
      hoveredIndex,
      totalMs,
      trackWidth,
      playheadLeft,
      snapThresholdMs,
      snapTargets,
    ],
  );

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}
