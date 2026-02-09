import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useProjectStore } from "../stores/useProjectStore";

export function HighlightWordsInput() {
  const [inputValue, setInputValue] = useState("");
  const { settings, updateSettings } = useProjectStore();
  const words = settings.highlightWords;

  const addWord = (word: string) => {
    const trimmed = word.trim().toLowerCase();
    if (trimmed && !words.includes(trimmed)) {
      updateSettings({ highlightWords: [...words, trimmed] });
    }
    setInputValue("");
  };

  const removeWord = (word: string) => {
    updateSettings({
      highlightWords: words.filter((w) => w !== word),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addWord(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && words.length > 0) {
      removeWord(words[words.length - 1]!);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-foreground">Highlight Words</span>
        <span className="text-[10px] text-muted-foreground/50">
          {words.length > 0 ? `${words.length} word${words.length > 1 ? "s" : ""}` : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2 min-h-[36px]">
        {words.map((word) => (
          <Badge key={word} variant="secondary" className="gap-1 pr-1 rounded-md text-[11px]">
            {word}
            <button
              onClick={() => removeWord(word)}
              className="ml-0.5 rounded-sm hover:bg-foreground/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addWord(inputValue)}
          placeholder={words.length === 0 ? "Type a word + Enter" : "Add more..."}
          className="h-6 flex-1 border-0 p-0 shadow-none focus-visible:ring-0 text-[12px] bg-transparent"
        />
      </div>
    </div>
  );
}
