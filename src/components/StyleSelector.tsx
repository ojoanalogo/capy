import { useProjectStore } from "../stores/useProjectStore";

export function StyleSelector() {
  const { settings, updateSettings } = useProjectStore();

  return (
    <div>
      <label className="text-sm font-medium">Caption Style</label>
      <select
        value={settings.captionStyle}
        onChange={(e) =>
          updateSettings({
            captionStyle: e.target.value as "comic" | "simple",
          })
        }
        className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm"
      >
        <option value="comic">Comic — Bold, colorful, animated</option>
        <option value="simple">Simple — Clean white text with shadow</option>
      </select>
    </div>
  );
}
