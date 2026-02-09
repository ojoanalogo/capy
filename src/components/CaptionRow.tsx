import { useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { Caption } from "../types/captions";

interface CaptionRowProps {
  caption: Caption;
  index: number;
  isActive: boolean;
  onUpdate: (index: number, partial: Partial<Caption>) => void;
  onDelete: (index: number) => void;
  onSeek: (ms: number) => void;
}

function msToTimecode(ms: number): string {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  const frac = Math.floor((ms % 1000) / 10);
  return `${m}:${s.toString().padStart(2, "0")}.${frac.toString().padStart(2, "0")}`;
}

function timecodeToMs(tc: string): number | null {
  const match = tc.match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const m = parseInt(match[1]!, 10);
  const s = parseInt(match[2]!, 10);
  const ms = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;
  return m * 60000 + s * 1000 + ms;
}

export function CaptionRow({
  caption,
  index,
  isActive,
  onUpdate,
  onDelete,
  onSeek,
}: CaptionRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active caption
  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  return (
    <div
      ref={rowRef}
      className={`flex items-start gap-2 rounded-lg border p-2 transition-colors ${
        isActive ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
      }`}
      onClick={() => onSeek(caption.startMs)}
    >
      <span className="mt-1.5 min-w-[20px] text-xs text-muted-foreground">
        {index + 1}
      </span>

      <div className="flex flex-1 flex-col gap-1">
        <input
          type="text"
          value={caption.text}
          onChange={(e) => onUpdate(index, { text: e.target.value })}
          className="w-full bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring rounded px-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex items-center gap-2">
          <Input
            value={msToTimecode(caption.startMs)}
            onChange={(e) => {
              const ms = timecodeToMs(e.target.value);
              if (ms !== null) onUpdate(index, { startMs: ms });
            }}
            className="h-6 w-24 text-xs"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            value={msToTimecode(caption.endMs)}
            onChange={(e) => {
              const ms = timecodeToMs(e.target.value);
              if (ms !== null) onUpdate(index, { endMs: ms });
            }}
            className="h-6 w-24 text-xs"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(index);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
