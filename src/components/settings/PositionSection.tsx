import { AlignVerticalJustifyCenter } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { Group, SliderRow, SegmentedControl } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { PositionAnim } from "./animations/PositionAnim";

export function PositionSection() {
  const { settings, updateCaptionConfig } = useProjectStore();
  const config = settings.captionConfig;

  return (
    <Group label={<SectionHeader icon={AlignVerticalJustifyCenter} label="Position">
      <FeatureHelpModal
        title="Position"
        description="Control where captions appear on screen. Set vertical alignment (top, center, bottom), horizontal alignment, and fine-tune with offset and padding controls."
        component={PositionAnim}
      />
    </SectionHeader>}>
      <div className="px-3.5 py-2.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px]">Vertical</span>
          <SegmentedControl
            value={config.verticalAlign}
            options={[
              { value: "top", label: "Top" },
              { value: "center", label: "Center" },
              { value: "bottom", label: "Bottom" },
            ]}
            onChange={(v) =>
              updateCaptionConfig({
                verticalAlign: v as "top" | "center" | "bottom",
              })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px]">Horizontal</span>
          <SegmentedControl
            value={config.horizontalAlign}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) =>
              updateCaptionConfig({
                horizontalAlign: v as "left" | "center" | "right",
              })
            }
          />
        </div>
      </div>

      <SliderRow
        label="Offset"
        value={config.bottomOffset}
        display={`${config.bottomOffset}%`}
        min={5}
        max={50}
        onChange={(v) => updateCaptionConfig({ bottomOffset: v })}
        disabled={config.verticalAlign === "center"}
      />

      <SliderRow
        label="Side Padding"
        value={config.leftRightPadding}
        display={`${config.leftRightPadding}%`}
        min={2}
        max={30}
        onChange={(v) => updateCaptionConfig({ leftRightPadding: v })}
      />
    </Group>
  );
}
