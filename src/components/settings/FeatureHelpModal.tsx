import { HelpCircle } from "lucide-react";
import { Player } from "@remotion/player";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ANIM_WIDTH, ANIM_HEIGHT, ANIM_FPS, ANIM_FRAMES } from "./animations/shared";

interface FeatureHelpModalProps {
  title: string;
  description: string;
  component: React.FC;
}

export function FeatureHelpModal({
  title,
  description,
  component,
}: FeatureHelpModalProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            aria-label={`${title} help`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          sideOffset={8}
          className="w-[340px] max-w-[340px] rounded-xl p-0 overflow-hidden bg-[#0a0a0a] border border-white/10"
        >
          <Player
            component={component}
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
          <div className="px-3 py-2.5 border-t border-white/[0.06]">
            <p className="text-[12px] font-medium text-white/90 mb-1">{title}</p>
            <p className="text-[11px] text-white/50 leading-relaxed">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
