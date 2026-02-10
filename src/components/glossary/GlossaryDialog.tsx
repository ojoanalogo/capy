import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Player } from "@remotion/player";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ANIM_WIDTH, ANIM_HEIGHT, ANIM_FPS, ANIM_FRAMES } from "../settings/animations/shared";
import { CaptionExplainerAnim } from "./animations/CaptionExplainerAnim";
import { PageExplainerAnim } from "./animations/PageExplainerAnim";
import { TimelineExplainerAnim } from "./animations/TimelineExplainerAnim";

const ENTRIES = [
  {
    id: "caption",
    title: "What's a caption?",
    description:
      "A caption is a single word (in karaoke mode) or phrase (in static mode) with a start and end time. Each caption maps to one highlighted element in the video.",
    component: CaptionExplainerAnim,
  },
  {
    id: "page",
    title: "What's a page?",
    description:
      "A page is a group of captions displayed on screen at the same time. In karaoke mode, words within a page highlight one by one. In static mode, each phrase is its own page.",
    component: PageExplainerAnim,
  },
  {
    id: "timeline",
    title: "Using the timeline",
    description:
      "The timeline at the bottom lets you see and adjust caption timing. Drag word edges to fine-tune start/end times, click to seek, and right-click a page for actions like merge or break.",
    component: TimelineExplainerAnim,
  },
] as const;

export function GlossaryDialog() {
  const [activeEntry, setActiveEntry] = useState(0);
  const entry = ENTRIES[activeEntry]!;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Glossary"
          className="h-7 w-7"
        >
          <BookOpen className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">Glossary</DialogTitle>
        </DialogHeader>

        {/* Tab pills */}
        <div className="flex gap-1 px-4 pb-2">
          {ENTRIES.map((e, i) => (
            <button
              key={e.id}
              onClick={() => setActiveEntry(i)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                i === activeEntry
                  ? "bg-white/[0.1] text-foreground"
                  : "text-muted-foreground hover:text-foreground/70 hover:bg-white/[0.04]"
              }`}
            >
              {e.title}
            </button>
          ))}
        </div>

        {/* Animation */}
        <div className="border-t border-white/[0.06]">
          <Player
            key={entry.id}
            component={entry.component}
            compositionWidth={ANIM_WIDTH}
            compositionHeight={ANIM_HEIGHT}
            durationInFrames={ANIM_FRAMES}
            fps={ANIM_FPS}
            loop
            autoPlay
            style={{
              width: "100%",
              aspectRatio: `${ANIM_WIDTH} / ${ANIM_HEIGHT}`,
            }}
          />
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <p className="text-[12px] font-medium text-white/90 mb-1">
            {entry.title}
          </p>
          <p className="text-[11px] text-white/50 leading-relaxed">
            {entry.description}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
