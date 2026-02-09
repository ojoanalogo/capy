import { Layers } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { Slider } from "../ui/slider";
import { Group, Row, ColorCircle } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { EffectsAnim } from "./animations/EffectsAnim";

export function EffectsSection() {
  const { settings, updateCaptionConfig } = useProjectStore();
  const config = settings.captionConfig;

  return (
    <Group label={<SectionHeader icon={Layers} label="Effects">
      <FeatureHelpModal
        title="Effects"
        description="Add depth to your captions with text shadow and stroke effects. Adjust blur radius and stroke width, and pick colors that complement your style."
        component={EffectsAnim}
      />
    </SectionHeader>}>
      <Row label="Shadow">
        <div className="flex items-center gap-2">
          <ColorCircle
            color={config.shadowColor}
            onChange={(c) => updateCaptionConfig({ shadowColor: c })}
            size={20}
          />
          <div className="w-[72px]">
            <Slider
              value={config.shadowBlur}
              min={0}
              max={20}
              onChange={(v) => updateCaptionConfig({ shadowBlur: v })}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums w-3 text-right">
            {config.shadowBlur}
          </span>
        </div>
      </Row>

      <Row label="Stroke">
        <div className="flex items-center gap-2">
          <ColorCircle
            color={config.strokeColor}
            onChange={(c) => updateCaptionConfig({ strokeColor: c })}
            size={20}
          />
          <div className="w-[72px]">
            <Slider
              value={config.strokeWidth}
              min={0}
              max={10}
              onChange={(v) => updateCaptionConfig({ strokeWidth: v })}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums w-3 text-right">
            {config.strokeWidth}
          </span>
        </div>
      </Row>
    </Group>
  );
}
