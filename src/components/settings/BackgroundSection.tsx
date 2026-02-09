import { PaintBucket } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { ColorPaletteEditor } from "../ColorPaletteEditor";
import { Group, Row, Switch } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { BackgroundAnim } from "./animations/BackgroundAnim";

export function BackgroundSection() {
  const { settings, updateCaptionConfig } = useProjectStore();
  const config = settings.captionConfig;

  return (
    <Group label={<SectionHeader icon={PaintBucket} label="Background">
      <FeatureHelpModal
        title="Background"
        description="Toggle a colored background behind your captions for better readability. Choose from a palette of colors that match your video's style."
        component={BackgroundAnim}
      />
    </SectionHeader>}>
      <Row label="Background">
        <Switch
          checked={config.showBackground}
          onChange={(v) => updateCaptionConfig({ showBackground: v })}
        />
      </Row>

      {config.showBackground && (
        <div className="px-3.5 py-2.5">
          <ColorPaletteEditor />
        </div>
      )}
    </Group>
  );
}
