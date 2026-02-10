import { Download } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { Button } from "./ui/button";
import { useProjectStore } from "../stores/useProjectStore";
import { invokeCommand, invokeWithProgress } from "../hooks/useTauriCommand";

export function ExportButton() {
  const {
    videoFile,
    captions,
    captionPath,
    settings,
    trimInMs,
    trimOutMs,
    setPipelineStage,
    setProgress,
    setExportPath,
  } = useProjectStore();

  const handleExport = async () => {
    if (!videoFile || !captionPath) return;

    const outputPath = await save({
      defaultPath: videoFile.replace(/\.[^.]+$/, "-captioned.mp4"),
      filters: [{ name: "Video", extensions: ["mp4"] }],
    });
    if (!outputPath) return;

    try {
      await invokeCommand("write_captions", {
        captionPath,
        captions,
      });

      const hasTrim = trimInMs !== null || trimOutMs !== null;
      const effectiveTrimIn = trimInMs ?? 0;
      const effectiveTrimOut = trimOutMs ?? Infinity;

      const props = {
        videoFile,
        captionStyle: settings.captionStyle,
        highlightWords: settings.highlightWords,
        captionConfig: settings.captionConfig,
        captionMode: settings.captionMode,
        ...(settings.captionStyle === "comic"
          ? { comicConfig: settings.comicConfig }
          : { simpleConfig: settings.simpleConfig }),
      };

      setPipelineStage("exporting");
      setProgress({
        stage: "exporting",
        percent: 0,
        message: hasTrim ? "Trimming video..." : "Starting render...",
      });

      let renderVideoFile = videoFile;
      if (hasTrim && trimOutMs !== null) {
        const trimmedPath = outputPath.replace(/\.mp4$/, "-trimmed-tmp.mp4");
        await invokeCommand("trim_video", {
          inputPath: videoFile,
          startMs: effectiveTrimIn,
          endMs: effectiveTrimOut,
          outputPath: trimmedPath,
        });
        renderVideoFile = trimmedPath;
        setProgress({
          stage: "exporting",
          percent: 20,
          message: "Rendering captions on trimmed video...",
        });
      }

      const result = await invokeWithProgress<string>(
        "render_video",
        {
          videoFile: renderVideoFile,
          propsJson: JSON.stringify(props),
          outputPath,
        },
        (p) => setProgress(p),
      );

      setExportPath(result);
    } catch (err) {
      console.error("Export failed:", err);
      setProgress({
        stage: "error",
        percent: 0,
        message: `Export failed: ${err}`,
      });
      setPipelineStage("ready");
    }
  };

  return (
    <Button onClick={handleExport} disabled={!videoFile}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
}
