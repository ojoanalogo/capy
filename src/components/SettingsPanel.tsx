import { Palette } from "lucide-react";
import { PresetSelector } from "./PresetSelector";
import { Group } from "./settings/primitives";
import { SectionHeader } from "./settings/SectionHeader";
import { FeatureHelpModal } from "./settings/FeatureHelpModal";
import { StylePresetsAnim } from "./settings/animations/StylePresetsAnim";
import { PageGroupingSection } from "./settings/PageGroupingSection";
import { TextSection } from "./settings/TextSection";
import { BackgroundSection } from "./settings/BackgroundSection";
import { EffectsSection } from "./settings/EffectsSection";
import { AnimationSection } from "./settings/AnimationSection";
import { PositionSection } from "./settings/PositionSection";
import { EmphasisSection } from "./settings/EmphasisSection";

export function SettingsPanel() {
  return (
    <div className="space-y-3">
      <Group label={<SectionHeader icon={Palette} label="Style Presets">
        <FeatureHelpModal
          title="Style Presets"
          description="Quickly apply a complete caption style with one click. Each preset configures text, background, effects, animation, and position settings together."
          component={StylePresetsAnim}
        />
      </SectionHeader>}>
        <div className="px-3.5 py-2.5">
          <PresetSelector />
        </div>
      </Group>
      <PageGroupingSection />
      <TextSection />
      <BackgroundSection />
      <EffectsSection />
      <AnimationSection />
      <PositionSection />
      <EmphasisSection />
    </div>
  );
}
