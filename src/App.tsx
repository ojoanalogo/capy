import { useProjectStore } from "./stores/useProjectStore";
import { VideoDropzone } from "./components/VideoDropzone";
import { ProcessingView } from "./components/ProcessingView";
import { CaptionModePicker } from "./components/CaptionModePicker";
import { EditorView } from "./components/EditorView";
import { ExportProgress } from "./components/ExportProgress";
import { TitleBar } from "./components/TitleBar";
import { Toaster } from "sonner";

export function App() {
  const stage = useProjectStore((s) => s.pipelineStage);

  return (
    <div className="flex h-screen w-screen flex-col">
      <TitleBar />
      {stage === "idle" && <VideoDropzone />}
      {(stage === "processing" || stage === "transcribing") && (
        <ProcessingView />
      )}
      {stage === "choosing-mode" && <CaptionModePicker />}
      {stage === "ready" && <EditorView />}
      {stage === "exporting" && <ExportProgress />}
      <Toaster richColors theme="dark" position="bottom-right" />
    </div>
  );
}
