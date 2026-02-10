import { useMemo, useState } from "react";
import { Rows3 } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { PAGE_GROUPING_PRESETS } from "../../lib/presets";
import { computePageGroups } from "../../lib/pageGroups";
import { Slider } from "../ui/slider";
import { Group, Select } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { PageGroupingAnim } from "./animations/PageGroupingAnim";

const PRESET_OPTIONS = PAGE_GROUPING_PRESETS.map((p) => ({
  value: String(p.ms),
  label: p.label,
}));

export function PageGroupingSection() {
  const { settings, updateCaptionConfig, updateSettings, convertToStatic, restoreKaraoke, captions, karaokeCaptions } =
    useProjectStore();
  const config = settings.captionConfig;
  const captionMode = settings.captionMode;

  const [showConfirm, setShowConfirm] = useState(false);

  const pageCount = useMemo(() => {
    if (captions.length === 0) return 0;
    if (captionMode === "static") return captions.length;
    const { pageRanges } = computePageGroups(captions, config.pageCombineMs);
    return pageRanges.length;
  }, [captions, config.pageCombineMs, captionMode]);

  const activePreset = PAGE_GROUPING_PRESETS.find(
    (p) => p.ms === config.pageCombineMs,
  );

  const dropdownOptions = activePreset
    ? PRESET_OPTIONS
    : [...PRESET_OPTIONS, { value: String(config.pageCombineMs), label: `Custom (${config.pageCombineMs}ms)` }];

  const handleStaticClick = () => {
    if (captionMode === "static") return;
    if (captions.length === 0) {
      updateSettings({ captionMode: "static" });
      return;
    }
    setShowConfirm(true);
  };

  const confirmConvert = () => {
    setShowConfirm(false);
    convertToStatic();
  };

  return (
    <Group
      label={
        <SectionHeader icon={Rows3} label="Page Grouping">
          <FeatureHelpModal
            title="Caption Mode & Page Grouping"
            description="Static mode shows one phrase per page — quick and easy, fewer edits needed. Karaoke mode highlights words one by one as they're spoken, with page grouping controls to fine-tune how words are split into screens."
            component={PageGroupingAnim}
          />
        </SectionHeader>
      }
    >
      <div className="px-3.5 py-2.5 space-y-2.5">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-white/[0.04]">
          <button
            onClick={handleStaticClick}
            className={`flex-1 text-[11px] font-medium px-2 py-1 rounded transition-colors ${
              captionMode === "static"
                ? "bg-white/[0.1] text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            Static
          </button>
          <button
            onClick={() => restoreKaraoke()}
            className={`flex-1 text-[11px] font-medium px-2 py-1 rounded transition-colors ${
              captionMode === "karaoke"
                ? "bg-white/[0.1] text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            Karaoke
          </button>
        </div>

        {/* Confirmation dialog */}
        {showConfirm && (
          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <p className="text-[11px] text-amber-200/80 leading-snug">
              Each page will hold a single phrase shown for its full duration. Per-word highlighting will be disabled. You can switch back to Karaoke to restore word timing.
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={confirmConvert}
                className="flex-1 text-[11px] font-medium px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-colors"
              >
                Convert
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 text-[11px] font-medium px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-muted-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {captionMode === "static" ? (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground/60">
              One phrase per page, ready to go
            </span>
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {pageCount} {pageCount === 1 ? "page" : "pages"}
            </span>
          </div>
        ) : (
          <>
            {/* Preset dropdown */}
            <div className="flex items-center justify-between">
              <Select
                value={String(config.pageCombineMs)}
                options={dropdownOptions}
                onChange={(v) => updateCaptionConfig({ pageCombineMs: Number(v) })}
              />
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {pageCount} {pageCount === 1 ? "page" : "pages"}
              </span>
            </div>

            {/* Slider + numeric input */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={100}
                  max={5000}
                  value={config.pageCombineMs}
                  onChange={(e) => {
                    const v = Math.max(100, Math.min(5000, Number(e.target.value) || 100));
                    updateCaptionConfig({ pageCombineMs: v });
                  }}
                  className="w-[52px] h-[22px] rounded bg-white/[0.06] px-1.5 text-[12px] text-muted-foreground tabular-nums border-0 outline-none text-center"
                />
                <span className="text-[11px] text-muted-foreground/50">ms</span>
                {activePreset && (
                  <span className="text-[11px] text-muted-foreground/50"> · {activePreset.label}</span>
                )}
              </div>
              <Slider
                value={config.pageCombineMs}
                min={100}
                max={3000}
                onChange={(v) => updateCaptionConfig({ pageCombineMs: v })}
              />
            </div>
          </>
        )}
      </div>
    </Group>
  );
}
