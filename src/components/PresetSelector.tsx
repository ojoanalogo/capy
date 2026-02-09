import { ALL_PRESETS } from "../lib/presets";
import { useProjectStore } from "../stores/useProjectStore";

export function PresetSelector() {
  const { settings, applyPreset } = useProjectStore();

  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5">
        {ALL_PRESETS.map((preset) => {
          const isActive = settings.activePreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`flex items-center gap-2 rounded-xl p-2 text-left transition-all ${
                isActive
                  ? "bg-primary/12 ring-1 ring-primary/40"
                  : "bg-white/[0.035] hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center -space-x-1 shrink-0">
                {preset.colors.slice(0, 3).map((color, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-3.5 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: "0 0 0 1.5px rgba(10,10,10,0.8)",
                      zIndex: 3 - i,
                    }}
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`text-[12px] font-medium truncate block leading-tight ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {preset.label}
                </span>
                <span className="text-[10px] text-muted-foreground/50 leading-tight line-clamp-1">
                  {preset.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
