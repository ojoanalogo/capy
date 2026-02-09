import { Highlighter } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { HighlightWordsInput } from "../HighlightWordsInput";
import { Group, Row, SliderRow, ColorCircle, Switch } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { EmphasisAnim } from "./animations/EmphasisAnim";

export function EmphasisSection() {
  const { settings, updateCaptionConfig } = useProjectStore();
  const config = settings.captionConfig;

  return (
    <Group label={<SectionHeader icon={Highlighter} label="Emphasis">
      <FeatureHelpModal
        title="Emphasis"
        description="Highlight key words in your captions with a different color and scale effect. Add specific words to emphasize, and toggle dithering for extra flair."
        component={EmphasisAnim}
      />
    </SectionHeader>}>
      <div className="px-3.5 py-2.5">
        <HighlightWordsInput />
      </div>

      <Row label="Highlight Color">
        <ColorCircle
          color={config.highlightColor}
          onChange={(c) => updateCaptionConfig({ highlightColor: c })}
        />
      </Row>

      <SliderRow
        label="Highlight Scale"
        value={config.highlightScale * 100}
        display={`${config.highlightScale.toFixed(2)}x`}
        min={100}
        max={200}
        onChange={(v) => updateCaptionConfig({ highlightScale: v / 100 })}
      />

      <Row label="Dithering">
        <Switch
          checked={config.showDithering}
          onChange={(v) => updateCaptionConfig({ showDithering: v })}
        />
      </Row>
    </Group>
  );
}
