import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { CaptionRow } from "./CaptionRow";
import { useProjectStore } from "../stores/useProjectStore";

export function CaptionList() {
  const { captions, currentTimeMs, updateCaption, deleteCaption, addCaption } =
    useProjectStore();

  const activeIndex = useMemo(() => {
    return captions.findIndex(
      (c) => currentTimeMs >= c.startMs && currentTimeMs < c.endMs,
    );
  }, [captions, currentTimeMs]);

  const handleSeek = (ms: number) => {
    window.dispatchEvent(new CustomEvent("seek-video", { detail: ms }));
  };

  const handleAddCaption = () => {
    const lastCaption = captions[captions.length - 1];
    const startMs = lastCaption ? lastCaption.endMs : 0;
    addCaption(captions.length, {
      text: " new caption",
      startMs,
      endMs: startMs + 1000,
      timestampMs: null,
      confidence: 1,
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium">
          Captions ({captions.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={handleAddCaption}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 300px)" }}>
        {captions.map((caption, i) => (
          <CaptionRow
            key={i}
            caption={caption}
            index={i}
            isActive={i === activeIndex}
            onUpdate={updateCaption}
            onDelete={deleteCaption}
            onSeek={handleSeek}
          />
        ))}
      </div>
    </div>
  );
}
