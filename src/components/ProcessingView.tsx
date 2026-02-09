import {
  AlertCircle,
  Download,
  Film,
  AudioLines,
  type LucideIcon,
} from "lucide-react";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { useProjectStore } from "../stores/useProjectStore";

const STAGES: Record<string, { label: string; icon: LucideIcon }> = {
  importing: { label: "Importing video", icon: Download },
  processing: { label: "Re-encoding video (ffmpeg)", icon: Film },
  transcribing: { label: "Transcribing audio (Whisper)", icon: AudioLines },
  error: { label: "Error", icon: AlertCircle },
};

export function ProcessingView() {
  const progress = useProjectStore((s) => s.progress);
  const reset = useProjectStore((s) => s.reset);
  const isError = progress.stage === "error";
  const stage = STAGES[progress.stage];
  const stageLabel = stage?.label ?? progress.stage;
  const Icon = stage?.icon ?? Download;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Icon
        className={`h-12 w-12 ${isError ? "text-destructive" : "animate-pulse text-primary"}`}
      />

      <div className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{stageLabel}</span>
          {!isError && (
            <span className="text-muted-foreground">
              {progress.percent > 0 ? `${Math.round(progress.percent)}%` : ""}
            </span>
          )}
        </div>
        {!isError && <Progress value={progress.percent} />}
        {progress.message && (
          <p
            className={`text-xs ${isError ? "whitespace-pre-wrap text-destructive" : "truncate text-muted-foreground"}`}
          >
            {progress.message}
          </p>
        )}
      </div>

      {isError && (
        <Button variant="outline" onClick={reset}>
          Back to start
        </Button>
      )}
    </div>
  );
}
