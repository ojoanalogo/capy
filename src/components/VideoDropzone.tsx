import { useState, useCallback, useEffect } from "react";
import {
  Upload,
  Film,
  Settings2,
  Languages,
  Brain,
  Gauge,
  Trophy,
  Ruler,
  SplitSquareHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useProjectStore } from "../stores/useProjectStore";
import { invokeCommand, invokeWithProgress } from "../hooks/useTauriCommand";

const LANGUAGES = [
  { code: "auto", flag: "\uD83C\uDF10", label: "Auto-detect" },
  { code: "en", flag: "\uD83C\uDDFA\uD83C\uDDF8", label: "English" },
  { code: "es", flag: "\uD83C\uDDEA\uD83C\uDDF8", label: "Spanish" },
  { code: "pt", flag: "\uD83C\uDDE7\uD83C\uDDF7", label: "Portuguese" },
  { code: "fr", flag: "\uD83C\uDDEB\uD83C\uDDF7", label: "French" },
  { code: "de", flag: "\uD83C\uDDE9\uD83C\uDDEA", label: "German" },
  { code: "it", flag: "\uD83C\uDDEE\uD83C\uDDF9", label: "Italian" },
  { code: "ja", flag: "\uD83C\uDDEF\uD83C\uDDF5", label: "Japanese" },
  { code: "ko", flag: "\uD83C\uDDF0\uD83C\uDDF7", label: "Korean" },
  { code: "zh", flag: "\uD83C\uDDE8\uD83C\uDDF3", label: "Chinese" },
  { code: "ru", flag: "\uD83C\uDDF7\uD83C\uDDFA", label: "Russian" },
  { code: "ar", flag: "\uD83C\uDDF8\uD83C\uDDE6", label: "Arabic" },
  { code: "hi", flag: "\uD83C\uDDEE\uD83C\uDDF3", label: "Hindi" },
  { code: "nl", flag: "\uD83C\uDDF3\uD83C\uDDF1", label: "Dutch" },
  { code: "pl", flag: "\uD83C\uDDF5\uD83C\uDDF1", label: "Polish" },
  { code: "tr", flag: "\uD83C\uDDF9\uD83C\uDDF7", label: "Turkish" },
  { code: "sv", flag: "\uD83C\uDDF8\uD83C\uDDEA", label: "Swedish" },
  { code: "uk", flag: "\uD83C\uDDFA\uD83C\uDDE6", label: "Ukrainian" },
];

export function VideoDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    settings,
    updateSettings,
    setPipelineStage,
    setProgress,
    setVideoFile,
    setCaptions,
  } = useProjectStore();

  const startPipeline = useCallback(
    async (filePath: string) => {
      try {
        setPipelineStage("processing");
        setProgress({
          stage: "importing",
          percent: 0,
          message: "Importing video...",
        });

        const filename = await invokeCommand<string>("import_video", {
          sourcePath: filePath,
        });

        setProgress({
          stage: "processing",
          percent: 0,
          message: "Re-encoding video...",
        });

        const videoAbsPath = await invokeWithProgress<string>(
          "process_video",
          { inputFile: filename },
          (p) => setProgress(p),
        );

        setPipelineStage("transcribing");
        setProgress({
          stage: "transcribing",
          percent: 0,
          message: "Transcribing audio...",
        });

        const captionPath = await invokeWithProgress<string>(
          "transcribe_video",
          {
            videoFile: filename,
            whisperModel: settings.whisperModel,
            language: settings.language,
            beamSize: settings.beamSize,
            bestOf: settings.bestOf,
            maxLen: settings.maxLen,
            splitOnWord: settings.splitOnWord,
          },
          (p) => setProgress(p),
        );

        console.log("[pipeline] captionPath:", captionPath);
        console.log("[pipeline] videoAbsPath:", videoAbsPath);

        const captions = await invokeCommand<
          Array<{
            text: string;
            startMs: number;
            endMs: number;
            timestampMs: number | null;
            confidence: number;
          }>
        >("read_captions", { captionPath });
        console.log("[pipeline] loaded captions:", captions.length);

        const { convertFileSrc } = await import("@tauri-apps/api/core");
        const videoSrc = convertFileSrc(videoAbsPath);
        console.log("[pipeline] videoSrc:", videoSrc);

        setVideoFile(filename, videoSrc);
        setCaptions(captions, captionPath);
        setPipelineStage("choosing-mode");
      } catch (err) {
        console.error("Pipeline failed:", err);
        setProgress({
          stage: "error",
          percent: 100,
          message: String(err),
        });
      }
    },
    [setPipelineStage, setProgress, setVideoFile, setCaptions, settings],
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { getCurrentWebviewWindow } = await import(
          "@tauri-apps/api/webviewWindow"
        );
        const webview = getCurrentWebviewWindow();
        const unlisten = await webview.onDragDropEvent((event) => {
          if (event.payload.type === "over") {
            setIsDragging(true);
          } else if (event.payload.type === "drop") {
            setIsDragging(false);
            const paths = event.payload.paths;
            if (paths.length > 0 && paths[0]) {
              startPipeline(paths[0]);
            }
          } else {
            setIsDragging(false);
          }
        });
        cleanup = unlisten;
      } catch {
        // Not in Tauri context
      }
    })();

    return () => cleanup?.();
  }, [startPipeline]);

  const handleBrowse = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const file = await open({
        multiple: false,
        filters: [
          {
            name: "Video",
            extensions: ["mp4", "mov", "webm", "mkv", "avi", "mts", "m4v"],
          },
        ],
      });
      if (file) {
        startPipeline(file);
      }
    } catch (err) {
      console.error("Browse failed:", err);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        {/* Dropzone */}
        <div
          className={`flex w-full flex-col items-center gap-6 rounded-xl border-2 border-dashed p-12 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {isDragging ? (
              <Film className="h-8 w-8 text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {isDragging ? "Drop your video" : "Add a video"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag and drop a video, or click browse
            </p>
          </div>

          <Button onClick={handleBrowse} size="lg">
            Browse Files
          </Button>

          <p className="text-xs text-muted-foreground">
            Supports MP4, MOV, WebM, MKV, AVI, MTS, M4V
          </p>
        </div>

        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          Transcription Settings
          {showSettings ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {showSettings && (
          <div className="w-full rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            {/* Model */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Whisper Model</label>
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Larger models are more accurate but slower
              </p>
              <select
                value={settings.whisperModel}
                onChange={(e) =>
                  updateSettings({ whisperModel: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm"
              >
                <option value="tiny">tiny — Fast, less accurate</option>
                <option value="base">base — Basic balance</option>
                <option value="small">small — Good quality</option>
                <option value="medium">medium — Recommended</option>
                <option value="large">large — Best accuracy, slow</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Language</label>
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Language of the audio being transcribed
              </p>
              <select
                value={settings.language}
                onChange={(e) =>
                  updateSettings({ language: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              <Settings2 className="h-3 w-3" />
              Advanced Settings
              {showAdvanced ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-4 border-t border-border/50 pt-3">
                {/* Beam Size */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">
                      Beam Size: {settings.beamSize}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Higher values explore more decoding paths. Improves accuracy but slower
                  </p>
                  <Slider
                    value={settings.beamSize}
                    min={1}
                    max={10}
                    onChange={(v) => updateSettings({ beamSize: v })}
                  />
                </div>

                {/* Best Of */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">
                      Best Of: {settings.bestOf}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Generates N candidates and picks the best. Higher = better quality but slower
                  </p>
                  <Slider
                    value={settings.bestOf}
                    min={1}
                    max={10}
                    onChange={(v) => updateSettings({ bestOf: v })}
                  />
                </div>

                {/* Max Length */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">
                      Max Segment Length: {settings.maxLen} chars
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Maximum character length for each text segment
                  </p>
                  <Slider
                    value={settings.maxLen}
                    min={10}
                    max={80}
                    onChange={(v) => updateSettings({ maxLen: v })}
                  />
                </div>

                {/* Split on word */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.splitOnWord}
                    onChange={(e) =>
                      updateSettings({ splitOnWord: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <div className="flex items-center gap-2">
                    <SplitSquareHorizontal className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">Split on word boundaries</span>
                      <p className="text-xs text-muted-foreground">
                        Avoids cutting words in half when splitting segments
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
