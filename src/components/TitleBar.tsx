import { useEffect, useState } from "react";
import { Minus, Square, X } from "lucide-react";
import { useProjectStore } from "../stores/useProjectStore";

const isTauri = "__TAURI_INTERNALS__" in window;
const isMac = navigator.platform.startsWith("Mac");

function MacControls({
  onClose,
  onMinimize,
  onMaximize,
}: {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClose}
        className="h-3 w-3 rounded-full bg-[#ff5f57] flex items-center justify-center transition-opacity"
        aria-label="Close"
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 6 6">
            <path
              d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <button
        onClick={onMinimize}
        className="h-3 w-3 rounded-full bg-[#febc2e] flex items-center justify-center transition-opacity"
        aria-label="Minimize"
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 6 6">
            <path
              d="M0.5 3H5.5"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <button
        onClick={onMaximize}
        className="h-3 w-3 rounded-full bg-[#28c840] flex items-center justify-center transition-opacity"
        aria-label="Maximize"
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 8 8">
            <path
              d="M1.5 5.5L4 1.5L6.5 5.5"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

function WinControls({
  onClose,
  onMinimize,
  onMaximize,
}: {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}) {
  return (
    <div className="flex items-center">
      <button
        onClick={onMinimize}
        className="h-8 w-11 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Minimize"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button
        onClick={onMaximize}
        className="h-8 w-11 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Maximize"
      >
        <Square className="h-3 w-3" strokeWidth={1.5} />
      </button>
      <button
        onClick={onClose}
        className="h-8 w-11 flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function TitleBar() {
  const [windowModule, setWindowModule] = useState<
    typeof import("@tauri-apps/api/window") | null
  >(null);

  useEffect(() => {
    if (isTauri) {
      import("@tauri-apps/api/window").then(setWindowModule);
    }
  }, []);

  const videoFile = useProjectStore((s) => s.videoFile);
  const videoName = videoFile ? videoFile.split(/[/\\]/).pop() : null;

  const handleClose = () => windowModule?.getCurrentWindow().close();
  const handleMinimize = () => windowModule?.getCurrentWindow().minimize();
  const handleMaximize = () =>
    windowModule?.getCurrentWindow().toggleMaximize();

  const controls = { onClose: handleClose, onMinimize: handleMinimize, onMaximize: handleMaximize };

  return (
    <div
      data-tauri-drag-region
      className="flex h-9 shrink-0 items-center border-b border-border bg-background select-none"
      style={{ paddingLeft: isMac ? 8 : 16, paddingRight: isMac ? 16 : 0 }}
    >
      {/* macOS: traffic lights on the left */}
      <div className="flex items-center w-16">
        {isTauri && isMac && <MacControls {...controls} />}
      </div>

      {/* Center: app name */}
      <span
        data-tauri-drag-region
        className="text-xs font-medium text-muted-foreground pointer-events-none flex-1 text-center"
      >
        Capy{videoName ? ` — ${videoName}` : ""}
      </span>

      {/* Windows/Linux: controls on the right */}
      <div className="flex items-center w-16 justify-end">
        {isTauri && !isMac && <WinControls {...controls} />}
      </div>
    </div>
  );
}
