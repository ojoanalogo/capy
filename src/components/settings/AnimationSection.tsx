import { Sparkles } from "lucide-react";
import { AnimationSelector } from "../AnimationSelector";
import { Group } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { AnimationStyleAnim } from "./animations/AnimationStyleAnim";

export function AnimationSection() {
  return (
    <Group label={<SectionHeader icon={Sparkles} label="Animation">
      <FeatureHelpModal
        title="Animation Style"
        description="Choose how captions enter the screen. Pop, slam, shake, swipe, and fade each give a different feel. Pick 'none' for static captions."
        component={AnimationStyleAnim}
      />
    </SectionHeader>}>
      <div className="px-3.5 py-2.5">
        <AnimationSelector />
      </div>
    </Group>
  );
}
