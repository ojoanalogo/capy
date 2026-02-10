import { useState } from "react";
import { useProjectStore } from "../stores/useProjectStore";
import type { CaptionMode } from "../types/captions";

/* ── Inline SVG animations ───────────────────────────────────────── */

function StaticPreview() {
  return (
    <svg viewBox="0 0 240 120" className="w-full h-auto">
      <rect width="240" height="120" rx="8" fill="#0a0a0a" />
      {/* Simulated phone frame */}
      <rect x="70" y="8" width="100" height="104" rx="10" fill="none" stroke="#555" strokeWidth="1.5" />
      <rect x="105" y="12" width="30" height="4" rx="2" fill="#333" />
      {/* Caption box */}
      <rect x="80" y="72" width="80" height="24" rx="5" fill="#3b82f6" opacity="0.15" />
      <rect x="80" y="72" width="80" height="24" rx="5" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4" />
      {/* Full phrase, all same color */}
      <text x="88" y="88" fontSize="9" fontWeight="bold" fontFamily="system-ui" fill="#fafafa">
        Hello world test
      </text>
      {/* Fade in/out to show phrase switching */}
      <rect x="80" y="72" width="80" height="24" rx="5" fill="#0a0a0a">
        <animate attributeName="opacity" values="0;0;0;1;1;0;0" dur="4s" repeatCount="indefinite" />
      </rect>
      <text x="92" y="88" fontSize="9" fontWeight="bold" fontFamily="system-ui" fill="#fafafa">
        Next phrase
        <animate attributeName="opacity" values="0;0;0;1;1;0;0" dur="4s" repeatCount="indefinite" />
      </text>
    </svg>
  );
}

function KaraokePreview() {
  return (
    <svg viewBox="0 0 240 120" className="w-full h-auto">
      <rect width="240" height="120" rx="8" fill="#0a0a0a" />
      {/* Simulated phone frame */}
      <rect x="70" y="8" width="100" height="104" rx="10" fill="none" stroke="#555" strokeWidth="1.5" />
      <rect x="105" y="12" width="30" height="4" rx="2" fill="#333" />
      {/* Caption box */}
      <rect x="80" y="72" width="80" height="24" rx="5" fill="#f97316" opacity="0.15" />
      <rect x="80" y="72" width="80" height="24" rx="5" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.4" />
      {/* Words with one highlighted */}
      <text x="88" y="88" fontSize="9" fontWeight="bold" fontFamily="system-ui" fill="#a3a3a3" opacity="0.5">
        Hello
      </text>
      <text x="113" y="88" fontSize="9" fontWeight="bold" fontFamily="system-ui" fill="#f97316">
        world
        <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
      </text>
      <text x="139" y="88" fontSize="9" fontWeight="bold" fontFamily="system-ui" fill="#a3a3a3" opacity="0.3">
        test
      </text>
      {/* Highlight indicator */}
      <line x1="113" y1="91" x2="132" y2="91" stroke="#f97316" strokeWidth="1.5" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export function CaptionModePicker() {
  const { convertToStatic, restoreKaraoke, setPipelineStage } = useProjectStore();
  const [selected, setSelected] = useState<CaptionMode>("static");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleContinue = () => {
    setIsTransitioning(true);
    if (selected === "static") {
      convertToStatic();
    } else {
      restoreKaraoke();
    }
    // Small delay for visual transition
    setTimeout(() => {
      setPipelineStage("ready");
    }, 200);
  };

  return (
    <div
      className={`flex-1 flex items-center justify-center transition-opacity duration-300 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-lg px-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Choose caption mode
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            How should captions appear in your video?
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Static card — first, recommended */}
          <button
            onClick={() => setSelected("static")}
            className={`group relative flex flex-col rounded-xl border p-3 text-left transition-all ${
              selected === "static"
                ? "border-blue-500/50 bg-blue-500/[0.06]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
            }`}
          >
            {/* Selection indicator */}
            <div
              className={`absolute top-2.5 right-2.5 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected === "static"
                  ? "border-blue-500 bg-blue-500"
                  : "border-white/20"
              }`}
            >
              {selected === "static" && (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>

            {/* Preview animation */}
            <div className="mb-2.5 rounded-lg overflow-hidden">
              <StaticPreview />
            </div>

            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[13px] font-medium text-foreground">
                Static
              </span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded">
                Easy
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground leading-snug">
              Each phrase appears all at once. Quick setup, fewer edits needed.
            </span>
          </button>

          {/* Karaoke card */}
          <button
            onClick={() => setSelected("karaoke")}
            className={`group relative flex flex-col rounded-xl border p-3 text-left transition-all ${
              selected === "karaoke"
                ? "border-orange-500/50 bg-orange-500/[0.06]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
            }`}
          >
            {/* Selection indicator */}
            <div
              className={`absolute top-2.5 right-2.5 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected === "karaoke"
                  ? "border-orange-500 bg-orange-500"
                  : "border-white/20"
              }`}
            >
              {selected === "karaoke" && (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>

            {/* Preview animation */}
            <div className="mb-2.5 rounded-lg overflow-hidden">
              <KaraokePreview />
            </div>

            <span className="text-[13px] font-medium text-foreground mb-0.5">
              Karaoke
            </span>
            <span className="text-[11px] text-muted-foreground leading-snug">
              Words highlight one by one as they're spoken. More control over timing.
            </span>
          </button>
        </div>

        {/* Info note */}
        <p className="text-[11px] text-muted-foreground/50 text-center leading-relaxed">
          You can switch modes later in the sidebar settings.
        </p>

        {/* Continue button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            className="px-6 py-2 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Continue to editor
          </button>
        </div>
      </div>
    </div>
  );
}
