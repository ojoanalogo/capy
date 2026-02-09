import { useMemo } from "react";
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
  const { settings, updateCaptionConfig, captions } = useProjectStore();
  const config = settings.captionConfig;

  const pageCount = useMemo(() => {
    if (captions.length === 0) return 0;
    const { pageRanges } = computePageGroups(captions, config.pageCombineMs);
    return pageRanges.length;
  }, [captions, config.pageCombineMs]);

  const activePreset = PAGE_GROUPING_PRESETS.find(
    (p) => p.ms === config.pageCombineMs,
  );

  const dropdownOptions = activePreset
    ? PRESET_OPTIONS
    : [...PRESET_OPTIONS, { value: String(config.pageCombineMs), label: `Custom (${config.pageCombineMs}ms)` }];

  return (
    <Group
      label={
        <SectionHeader icon={Rows3} label="Page Grouping">
          <FeatureHelpModal
            title="Page Grouping"
            description="Words that appear close together in time are grouped into a single page (caption screen). The gap threshold controls how large a silence must be before starting a new page. Use presets for quick setup or the slider for a custom threshold."
            component={PageGroupingAnim}
          />
        </SectionHeader>
      }
    >
      <div className="px-3.5 py-2.5 space-y-2.5">
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
      </div>
    </Group>
  );
}
