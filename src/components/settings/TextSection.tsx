import { Type } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { Group, Row, SliderRow, Select, Switch, ColorCircle } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { TextAnim } from "./animations/TextAnim";

const FONT_OPTIONS = [
  { value: "inter", label: "Inter" },
  { value: "plusJakartaSans", label: "Plus Jakarta Sans" },
  { value: "outfit", label: "Outfit" },
  { value: "montserrat", label: "Montserrat" },
  { value: "poppins", label: "Poppins" },
  { value: "quicksand", label: "Quicksand" },
  { value: "lexend", label: "Lexend" },
  { value: "dmSans", label: "DM Sans" },
  { value: "roboto", label: "Roboto" },
  { value: "lato", label: "Lato" },
  { value: "nunito", label: "Nunito" },
  { value: "rubik", label: "Rubik" },
  { value: "raleway", label: "Raleway" },
  { value: "oswald", label: "Oswald" },
  { value: "spaceGrotesk", label: "Space Grotesk" },
  { value: "archivo", label: "Archivo" },
  { value: "syne", label: "Syne" },
  { value: "titilliumWeb", label: "Titillium Web" },
  { value: "fredoka", label: "Fredoka" },
  { value: "caveat", label: "Caveat" },
  { value: "comic", label: "Bangers" },
  { value: "permanentMarker", label: "Permanent Marker" },
  { value: "bebasNeue", label: "Bebas Neue" },
  { value: "alfaSlabOne", label: "Alfa Slab One" },
  { value: "anton", label: "Anton" },
  { value: "rubikMonoOne", label: "Rubik Mono One" },
];

export function TextSection() {
  const { settings, updateCaptionConfig } = useProjectStore();
  const config = settings.captionConfig;

  return (
    <Group label={<SectionHeader icon={Type} label="Text">
      <FeatureHelpModal
        title="Text Settings"
        description="Customize the font family, size, color, and spacing of your caption text. Toggle uppercase for a bolder look, or fine-tune line height and letter spacing for readability."
        component={TextAnim}
      />
    </SectionHeader>}>
      <Row label="Font">
        <Select
          value={config.fontFamily}
          options={FONT_OPTIONS}
          onChange={(v) => updateCaptionConfig({ fontFamily: v })}
        />
      </Row>

      <SliderRow
        label="Size"
        value={config.fontSize}
        display={`${config.fontSize}px`}
        min={30}
        max={90}
        onChange={(v) => updateCaptionConfig({ fontSize: v })}
      />

      <SliderRow
        label="Weight"
        value={config.fontWeight}
        display={config.fontWeight}
        min={300}
        max={900}
        onChange={(v) => updateCaptionConfig({ fontWeight: Math.round(v / 100) * 100 })}
      />

      <Row label="Color">
        <ColorCircle
          color={config.textColor}
          onChange={(c) => updateCaptionConfig({ textColor: c })}
        />
      </Row>

      <Row label="Uppercase">
        <Switch
          checked={config.uppercase}
          onChange={(v) => updateCaptionConfig({ uppercase: v })}
        />
      </Row>

      <SliderRow
        label="Line Height"
        value={config.lineHeight * 100}
        display={config.lineHeight.toFixed(2)}
        min={80}
        max={200}
        onChange={(v) => updateCaptionConfig({ lineHeight: v / 100 })}
      />

      <SliderRow
        label="Letter Spacing"
        value={config.letterSpacing * 10}
        display={`${config.letterSpacing.toFixed(1)}px`}
        min={-10}
        max={50}
        onChange={(v) => updateCaptionConfig({ letterSpacing: v / 10 })}
      />

      <SliderRow
        label="Word Gap"
        value={config.wordSpacing}
        display={`${config.wordSpacing}px`}
        min={0}
        max={30}
        onChange={(v) => updateCaptionConfig({ wordSpacing: v })}
      />
    </Group>
  );
}
