import { create } from "zustand";
import { temporal } from "zundo";
import type {
  Caption,
  CaptionConfig,
  CaptionStyle,
  PipelineStage,
  PipelineProgress,
  ProjectSettings,
} from "../types/captions";
import { getPreset, COMIC_PRESET } from "../lib/presets";

interface ProjectState {
  // Video
  videoFile: string | null;
  videoSrc: string | null;

  // Captions
  captions: Caption[];
  captionPath: string | null;

  // Pipeline
  pipelineStage: PipelineStage;
  progress: PipelineProgress;

  // Playback
  currentTimeMs: number;
  videoDurationMs: number;

  // Settings
  settings: ProjectSettings;

  // Trim
  trimInMs: number | null;
  trimOutMs: number | null;

  // Export
  exportPath: string | null;

  // Actions
  setVideoFile: (file: string, src: string) => void;
  setCaptions: (captions: Caption[], path: string) => void;
  updateCaption: (index: number, caption: Partial<Caption>) => void;
  deleteCaption: (index: number) => void;
  addCaption: (index: number, caption: Caption) => void;
  setPipelineStage: (stage: PipelineStage) => void;
  setProgress: (progress: PipelineProgress) => void;
  setCurrentTimeMs: (ms: number) => void;
  setVideoDurationMs: (ms: number) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  updateCaptionConfig: (partial: Partial<CaptionConfig>) => void;
  applyPreset: (name: CaptionStyle) => void;
  setTrimIn: (ms: number | null) => void;
  setTrimOut: (ms: number | null) => void;
  setExportPath: (path: string | null) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: ProjectSettings = {
  activePreset: "comic",
  captionConfig: { ...COMIC_PRESET },
  highlightWords: [],
  // Legacy compat
  captionStyle: "comic",
  comicConfig: {
    colors: ["#FFD700", "#3B82F6", "#EF4444", "#22C55E"],
    fontSize: 62,
  },
  simpleConfig: {
    fontSize: 54,
    textColor: "#FFFFFF",
    shadowColor: "#000000",
  },
  whisperModel: "medium",
  language: "es",
  beamSize: 5,
  bestOf: 5,
  maxLen: 40,
  splitOnWord: true,
};

const INITIAL_PROGRESS: PipelineProgress = {
  stage: "",
  percent: 0,
  message: "",
};

export const useProjectStore = create<ProjectState>()(
  temporal(
    (set) => ({
      videoFile: null,
      videoSrc: null,
      captions: [],
      captionPath: null,
      pipelineStage: "idle",
      progress: INITIAL_PROGRESS,
      currentTimeMs: 0,
      videoDurationMs: 0,
      settings: DEFAULT_SETTINGS,
      trimInMs: null,
      trimOutMs: null,
      exportPath: null,

      setVideoFile: (file, src) => set({ videoFile: file, videoSrc: src }),

      setCaptions: (captions, path) => set({ captions, captionPath: path }),

      updateCaption: (index, partial) =>
        set((state) => {
          const captions = [...state.captions];
          const existing = captions[index];
          if (existing) {
            captions[index] = { ...existing, ...partial };
          }
          return { captions };
        }),

      deleteCaption: (index) =>
        set((state) => ({
          captions: state.captions.filter((_, i) => i !== index),
        })),

      addCaption: (index, caption) =>
        set((state) => {
          const captions = [...state.captions];
          captions.splice(index, 0, caption);
          return { captions };
        }),

      setPipelineStage: (stage) => set({ pipelineStage: stage }),

      setProgress: (progress) => set({ progress }),

      setCurrentTimeMs: (ms) => set({ currentTimeMs: ms }),

      setVideoDurationMs: (ms) => set({ videoDurationMs: ms }),

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      updateCaptionConfig: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            captionConfig: { ...state.settings.captionConfig, ...partial },
          },
        })),

      applyPreset: (name) =>
        set((state) => ({
          settings: {
            ...state.settings,
            activePreset: name,
            captionStyle: name,
            captionConfig: getPreset(name),
          },
        })),

      setTrimIn: (ms) => set({ trimInMs: ms }),
      setTrimOut: (ms) => set({ trimOutMs: ms }),

      setExportPath: (path) => set({ exportPath: path }),

      reset: () =>
        set({
          videoFile: null,
          videoSrc: null,
          captions: [],
          captionPath: null,
          pipelineStage: "idle",
          progress: INITIAL_PROGRESS,
          currentTimeMs: 0,
          videoDurationMs: 0,
          settings: DEFAULT_SETTINGS,
          trimInMs: null,
          trimOutMs: null,
          exportPath: null,
        }),
    }),
    {
      limit: 50,
      // Only track captions + settings changes, skip transient state
      partialize: (state) => ({
        captions: state.captions,
        settings: state.settings,
        trimInMs: state.trimInMs,
        trimOutMs: state.trimOutMs,
      }),
      // Throttle to avoid capturing every frame during drags
      handleSet: (handleSet) => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        return (state) => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            handleSet(state);
          }, 300);
        };
      },
    },
  ),
);
