import { useMemo } from "react";
import { useProjectStore } from "../stores/useProjectStore";

export function CaptionOverlay() {
  const { captions, currentTimeMs, settings } = useProjectStore();

  // Find the active caption(s) at the current time
  const activeCaption = useMemo(() => {
    return captions.find(
      (c) => currentTimeMs >= c.startMs && currentTimeMs < c.endMs,
    );
  }, [captions, currentTimeMs]);

  if (!activeCaption) return null;

  const isComic = settings.captionStyle === "comic";

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[15%]">
      <div
        className={`mx-4 max-w-[85%] px-4 py-2 text-center ${
          isComic
            ? "rounded-xl border-2 border-black bg-yellow-400 font-bold uppercase text-white"
            : "rounded-lg text-white"
        }`}
        style={
          isComic
            ? {
                fontFamily: "'Bangers', cursive",
                fontSize: "1.5rem",
                textShadow: "2px 2px 0 #000, -1px -1px 0 #000",
              }
            : {
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "1.3rem",
                textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
              }
        }
      >
        {activeCaption.text.trim()}
      </div>
    </div>
  );
}
