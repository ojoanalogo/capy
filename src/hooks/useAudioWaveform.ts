import { useState, useEffect } from "react";

interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

const PEAKS_PER_SECOND = 200;

export function useAudioWaveform(videoSrc: string | null): WaveformData | null {
  const [data, setData] = useState<WaveformData | null>(null);

  useEffect(() => {
    if (!videoSrc) {
      setData(null);
      return;
    }

    let cancelled = false;

    async function decode() {
      try {
        let arrayBuffer: ArrayBuffer;

        try {
          const res = await fetch(videoSrc!);
          arrayBuffer = await res.arrayBuffer();
        } catch {
          // Tauri asset:// URLs may fail fetch — try plugin-fs as fallback
          try {
            const { readFile } = await import("@tauri-apps/plugin-fs");
            const bytes = await readFile(videoSrc!.replace("asset://localhost/", ""));
            arrayBuffer = bytes.buffer as ArrayBuffer;
          } catch {
            console.warn("[useAudioWaveform] Could not fetch audio data");
            return;
          }
        }

        if (cancelled) return;

        const audioCtx = new AudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        await audioCtx.close();

        if (cancelled) return;

        const channelData = audioBuffer.getChannelData(0);
        const duration = audioBuffer.duration;
        const totalPeaks = Math.ceil(duration * PEAKS_PER_SECOND);
        const samplesPerPeak = Math.floor(channelData.length / totalPeaks);
        const peaks = new Float32Array(totalPeaks);

        for (let i = 0; i < totalPeaks; i++) {
          let max = 0;
          const start = i * samplesPerPeak;
          const end = Math.min(start + samplesPerPeak, channelData.length);
          for (let j = start; j < end; j++) {
            const abs = Math.abs(channelData[j]!);
            if (abs > max) max = abs;
          }
          peaks[i] = max;
        }

        if (!cancelled) {
          setData({ peaks, duration, sampleRate: PEAKS_PER_SECOND });
        }
      } catch (err) {
        console.warn("[useAudioWaveform] Decode error:", err);
      }
    }

    decode();

    return () => {
      cancelled = true;
    };
  }, [videoSrc]);

  return data;
}
