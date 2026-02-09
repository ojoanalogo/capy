import { Type } from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { Group, Row, SliderRow, Select, Switch, ColorCircle } from "./primitives";
import { SectionHeader } from "./SectionHeader";
import { FeatureHelpModal } from "./FeatureHelpModal";
import { TextAnim } from "./animations/TextAnim";

const FONT_OPTIONS = [
  { value: "comic", label: "Bangers" },
  { value: "inter", label: "Inter" },
  { value: "montserrat", label: "Montserrat" },
  { value: "poppins", label: "Poppins" },
  { value: "oswald", label: "Oswald" },
  { value: "roboto", label: "Roboto" },
  { value: "raleway", label: "Raleway" },
  { value: "lato", label: "Lato" },
  { value: "nunito", label: "Nunito" },
  { value: "bebasNeue", label: "Bebas Neue" },
  { value: "alfaSlabOne", label: "Alfa Slab One" },
  { value: "permanentMarker", label: "Permanent Marker" },
  { value: "rubik", label: "Rubik" },
  { value: "spaceGrotesk", label: "Space Grotesk" },
  { value: "dmSans", label: "DM Sans" },
  { value: "archivo", label: "Archivo" },
  { value: "syne", label: "Syne" },
  { value: "lexend", label: "Lexend" },
  { value: "titilliumWeb", label: "Titillium Web" },
  { value: "anton", label: "Anton" },
  { value: "rubikMonoOne", label: "Rubik Mono One" },
  { value: "fredoka", label: "Fredoka" },
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
