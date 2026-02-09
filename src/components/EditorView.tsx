import { useState, useEffect, useCallback, useRef } from "react";
import { RemotionPreview } from "./RemotionPreview";
import { CaptionTimeline } from "./timeline";
import { SettingsPanel } from "./SettingsPanel";
import { ExportButton } from "./ExportButton";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "./ui/button";
import { useProjectStore } from "../stores/useProjectStore";

function usePersisted<T>(
  key: string,
  initial: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export function EditorView() {
  const reset = useProjectStore((s) => s.reset);

  const handleUndo = () => useProjectStore.temporal.getState().undo();
  const handleRedo = () => useProjectStore.temporal.getState().redo();

  // ── Collapsible sidebar ──────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = usePersisted("capy:sidebarOpen", true);

  // ── Resizable timeline ───────────────────────────────────────
  const [timelineHeight, setTimelineHeight] = usePersisted(
    "capy:timelineHeight",
    280,
  );
  const isDraggingRef = useRef(false);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      const startY = e.clientY;
      const startHeight = timelineHeight;

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const delta = startY - ev.clientY;
        const newHeight = Math.min(500, Math.max(230, startHeight + delta));
        setTimelineHeight(newHeight);
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [timelineHeight, setTimelineHeight],
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={reset}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-0.5 ml-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              title="Undo (Cmd+Z)"
              className="h-7 w-7"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              title="Redo (Cmd+Shift+Z)"
              className="h-7 w-7"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Hide settings" : "Show settings"}
            className="h-7 w-7"
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
          </Button>
          <ExportButton />
        </div>
      </div>

      {/* Main content: video + settings */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Video player with Remotion captions overlay */}
        <div className="flex-1 min-w-0">
          <RemotionPreview />
        </div>

        {/* Right: Style & highlight settings — collapsible */}
        <div
          className="shrink-0 overflow-hidden transition-all duration-200 border-l border-border"
          style={{ width: sidebarOpen ? 356 : 0 }}
        >
          <div className="w-[356px] h-full overflow-y-auto p-3">
            <SettingsPanel />
          </div>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="h-1 shrink-0 cursor-row-resize hover:bg-primary/30 transition-colors border-t border-border"
        onMouseDown={handleResizeMouseDown}
      />

      {/* Bottom: Timeline */}
      <div className="shrink-0" style={{ height: timelineHeight }}>
        <CaptionTimeline />
      </div>
    </div>
  );
}
