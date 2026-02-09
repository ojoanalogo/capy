import { create } from "zustand";

interface PlaybackState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isLooping: boolean;
  setIsPlaying: (v: boolean) => void;
  setIsMuted: (v: boolean) => void;
  setVolume: (v: number) => void;
  setIsLooping: (v: boolean) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  isMuted: false,
  volume: 100,
  isLooping: false,
  setIsPlaying: (v) => set({ isPlaying: v }),
  setIsMuted: (v) => set({ isMuted: v }),
  setVolume: (v) => set({ volume: v }),
  setIsLooping: (v) => set({ isLooping: v }),
}));
