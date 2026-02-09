import type { ReactNode } from "react";
import type { AnimationStyle } from "../types/captions";
import { useProjectStore } from "../stores/useProjectStore";
import { Slider } from "./ui/slider";
import {
  Sparkles,
  ArrowDownToLine,
  ShieldAlert,
  MoveRight,
  CloudFog,
  Ban,
} from "lucide-react";

const ICON_SIZE = "h-4 w-4";

const ANIMATION_OPTIONS: { id: AnimationStyle; label: string; icon: ReactNode }[] = [
  { id: "pop", label: "Pop", icon: <Sparkles className={ICON_SIZE} /> },
  { id: "slam", label: "Slam", icon: <ArrowDownToLine className={ICON_SIZE} /> },
  { id: "shake", label: "Shake", icon: <ShieldAlert className={ICON_SIZE} /> },
  { id: "swipe", label: "Swipe", icon: <MoveRight className={ICON_SIZE} /> },
  { id: "fade", label: "Fade", icon: <CloudFog className={ICON_SIZE} /> },
  { id: "none", label: "None", icon: <Ban className={ICON_SIZE} /> },
];

export function AnimationSelector() {
  const { settings, updateCaptionConfig } = useProjectStore();
  const config = settings.captionConfig;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {ANIMATION_OPTIONS.map((opt) => {
          const isActive = config.animationStyle === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => updateCaptionConfig({ animationStyle: opt.id })}
              className={`flex flex-col items-center rounded-lg border py-2.5 px-1 text-center transition-all ${
                isActive
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                {opt.icon}
              </span>
              <span className="text-[11px] mt-1 font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Intensity slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px]">Intensity</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {config.animationIntensity}%
          </span>
        </div>
        <Slider
          value={config.animationIntensity}
          min={0}
          max={100}
          onChange={(v) => updateCaptionConfig({ animationIntensity: v })}
        />
      </div>

      {/* Rotation max angle slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px]">Rotation</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {config.rotationMax ?? 0}°
          </span>
        </div>
        <Slider
          value={config.rotationMax ?? 0}
          min={-10}
          max={10}
          onChange={(v) =>
            updateCaptionConfig({
              rotationMax: v,
              rotation: v !== 0,
            })
          }
        />
      </div>
    </div>
  );
}
