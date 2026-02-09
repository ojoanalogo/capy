import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useProjectStore } from "../stores/useProjectStore";

export function ColorPaletteEditor() {
  const { settings, updateCaptionConfig } = useProjectStore();
  const colors = settings.captionConfig.backgroundColors;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addColor = () => {
    const newColors = [...colors, "#6366F1"];
    updateCaptionConfig({ backgroundColors: newColors });
    setEditingIndex(newColors.length - 1);
  };

  const removeColor = (index: number) => {
    if (colors.length <= 1) return;
    updateCaptionConfig({
      backgroundColors: colors.filter((_, i) => i !== index),
    });
    setEditingIndex(null);
  };

  const updateColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    updateCaptionConfig({ backgroundColors: newColors });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-foreground">Colors</span>
        <button
          onClick={addColor}
          className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] text-muted-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, i) => (
          <div key={i} className="relative group">
            <button
              onClick={() => setEditingIndex(editingIndex === i ? null : i)}
              className="w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95"
              style={{
                backgroundColor: color,
                boxShadow: "0 0 0 1.5px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(0,0,0,0.1)",
              }}
            />
            {colors.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeColor(i);
                }}
                className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-3.5 h-3.5 rounded-full bg-destructive text-white"
              >
                <X className="h-2 w-2" />
              </button>
            )}
            {editingIndex === i && (
              <input
                type="color"
                value={color}
                onChange={(e) => updateColor(i, e.target.value)}
                onBlur={() => setEditingIndex(null)}
                className="absolute top-8 left-0 z-10 w-8 h-8 cursor-pointer border-0 p-0"
                autoFocus
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
