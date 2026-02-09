import { CheckCircle2, FolderOpen, ArrowLeft } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { useProjectStore } from "../stores/useProjectStore";

export function ExportProgress() {
  const { progress, exportPath, setPipelineStage } = useProjectStore();
  const isDone = progress.percent >= 100 && exportPath;

  const openInFinder = async () => {
    if (!exportPath) return;
    // Use shell open to reveal in Finder
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      // On macOS, open the parent folder
      const dir = exportPath.substring(0, exportPath.lastIndexOf("/"));
      await open(dir);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      {isDone ? (
        <>
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Export Complete!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {exportPath}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={openInFinder}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open in Finder
            </Button>
            <Button
              variant="outline"
              onClick={() => setPipelineStage("ready")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Editor
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Rendering video...</span>
              <span className="text-muted-foreground">
                {progress.percent > 0
                  ? `${Math.round(progress.percent)}%`
                  : ""}
              </span>
            </div>
            <Progress value={progress.percent} />
            {progress.message && (
              <p className="truncate text-xs text-muted-foreground">
                {progress.message}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
