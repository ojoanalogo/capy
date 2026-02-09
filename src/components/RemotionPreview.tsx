import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { CaptionsOverlay } from "../../remotion/captions/CaptionsOverlay";
import type { CaptionsOverlayProps } from "../../remotion/captions/CaptionsOverlay";
import { useProjectStore } from "../stores/useProjectStore";
import { usePlaybackStore } from "../stores/usePlaybackStore";

const FPS = 30;

// ─── Video metadata probe ────────────────────────────────────────────
interface VideoMeta {
  width: number;
  height: number;
  durationS: number;
}

function useVideoMeta(src: string | null): VideoMeta | null {
  const [meta, setMeta] = useState<VideoMeta | null>(null);

  useEffect(() => {
    if (!src) return;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = src;
    const onLoaded = () => {
      setMeta({
        width: video.videoWidth || 1080,
        height: video.videoHeight || 1920,
        durationS: Number.isFinite(video.duration) ? video.duration : 60,
      });
    };
    const onError = () => {
      console.error("[RemotionPreview] meta probe failed, using defaults");
      setMeta({ width: 1080, height: 1920, durationS: 60 });
    };
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
    video.load();
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
    };
  }, [src]);

  return meta;
}

// ─── Main component ──────────────────────────────────────────────────
export function RemotionPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    videoSrc,
    captions,
    settings,
    setCurrentTimeMs,
    setVideoDurationMs,
  } = useProjectStore();

  const {
    isPlaying,
    isMuted,
    volume,
    isLooping,
    setIsPlaying,
    setIsMuted,
    setVolume,
  } = usePlaybackStore();

  const meta = useVideoMeta(videoSrc);

  // Push video duration to store once metadata loads
  useEffect(() => {
    if (meta?.durationS) {
      setVideoDurationMs(meta.durationS * 1000);
    }
  }, [meta?.durationS, setVideoDurationMs]);

  const [currentTime, setCurrentTime] = useState(0);
  const durationS = meta?.durationS ?? 0;
  const durationFrames = Math.max(1, Math.ceil(durationS * FPS));

  // ── Sync HTML5 video → store + Player ──────────────────────────
  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const ms = v.currentTime * 1000;
    setCurrentTime(v.currentTime);
    setCurrentTimeMs(ms);

    // Sync Remotion Player to match the video time
    const frame = Math.round((v.currentTime / durationS) * durationFrames);
    if (playerRef.current && !isPlaying) {
      playerRef.current.seekTo(Math.min(frame, durationFrames - 1));
    }
  }, [setCurrentTimeMs, durationS, durationFrames, isPlaying]);

  // ── Core playback methods ────────────────────────────────────
  const play = useCallback(() => {
    videoRef.current?.play();
    playerRef.current?.play();
    setIsPlaying(true);
  }, [setIsPlaying]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    playerRef.current?.pause();
    setIsPlaying(false);
  }, [setIsPlaying]);

  const seekTo = useCallback(
    (timeS: number) => {
      const v = videoRef.current;
      if (v) v.currentTime = timeS;
      const frame = Math.round((timeS / durationS) * durationFrames);
      playerRef.current?.seekTo(Math.min(frame, durationFrames - 1));
      setCurrentTime(timeS);
      setCurrentTimeMs(timeS * 1000);
    },
    [durationS, durationFrames, setCurrentTimeMs],
  );

  // ── Keep Player in sync during playback ────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const v = videoRef.current;
      const p = playerRef.current;
      if (!v || !p) return;
      const targetFrame = Math.round(v.currentTime * FPS);
      const currentFrame = p.getCurrentFrame();
      if (Math.abs(targetFrame - currentFrame) > 3) {
        p.seekTo(Math.min(targetFrame, durationFrames - 1));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, durationFrames]);

  // ── Listen for events from timeline/keyboard ───────────────────
  useEffect(() => {
    const onSeek = (e: Event) => {
      const ms = (e as CustomEvent<number>).detail;
      seekTo(ms / 1000);
    };
    const onTogglePlay = () => {
      if (usePlaybackStore.getState().isPlaying) pause();
      else play();
    };
    const onPlay = () => play();
    const onPause = () => pause();
    const onSkipBack = () => {
      const v = videoRef.current;
      if (v) seekTo(Math.max(0, v.currentTime - 5));
    };
    const onSkipForward = () => {
      const v = videoRef.current;
      if (v) seekTo(Math.min(durationS, v.currentTime + 5));
    };
    const onVolumeChange = (e: Event) => {
      const newVol = (e as CustomEvent<number>).detail;
      setVolume(newVol);
      const v = videoRef.current;
      if (v) {
        v.volume = newVol / 100;
        if (newVol === 0) {
          v.muted = true;
          setIsMuted(true);
        } else if (usePlaybackStore.getState().isMuted) {
          v.muted = false;
          setIsMuted(false);
        }
      }
    };
    const onToggleMute = () => {
      const v = videoRef.current;
      if (v) v.muted = !v.muted;
      setIsMuted(!usePlaybackStore.getState().isMuted);
    };

    window.addEventListener("seek-video", onSeek);
    window.addEventListener("toggle-play", onTogglePlay);
    window.addEventListener("play-video", onPlay);
    window.addEventListener("pause-video", onPause);
    window.addEventListener("skip-back", onSkipBack);
    window.addEventListener("skip-forward", onSkipForward);
    window.addEventListener("volume-change", onVolumeChange);
    window.addEventListener("toggle-mute", onToggleMute);
    return () => {
      window.removeEventListener("seek-video", onSeek);
      window.removeEventListener("toggle-play", onTogglePlay);
      window.removeEventListener("play-video", onPlay);
      window.removeEventListener("pause-video", onPause);
      window.removeEventListener("skip-back", onSkipBack);
      window.removeEventListener("skip-forward", onSkipForward);
      window.removeEventListener("volume-change", onVolumeChange);
      window.removeEventListener("toggle-mute", onToggleMute);
    };
  }, [seekTo, play, pause, durationS, setVolume, setIsMuted]);

  // ── Apply volume/mute from store to video element ───────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
    v.volume = volume / 100;
  }, [isMuted, volume]);

  // ── Handle video end ───────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => {
      if (isLooping) {
        seekTo(0);
        play();
      } else {
        setIsPlaying(false);
        playerRef.current?.pause();
      }
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [isLooping, seekTo, play, setIsPlaying]);

  // ── Captions data for the overlay ──────────────────────────────
  const captionsData = useMemo(
    () =>
      captions.map((c) => ({
        text: c.text,
        startMs: c.startMs,
        endMs: c.endMs,
        timestampMs: c.timestampMs,
        confidence: c.confidence,
      })),
    [captions],
  );

  const overlayProps: CaptionsOverlayProps = useMemo(
    () => ({
      captionsData,
      captionStyle: settings.captionStyle,
      highlightWords: settings.highlightWords,
      captionConfig: settings.captionConfig,
      comicConfig: settings.comicConfig,
      simpleConfig: settings.simpleConfig,
    }),
    [captionsData, settings],
  );

  // ── Loading state ──────────────────────────────────────────────
  if (!meta || !videoSrc) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading video...
      </div>
    );
  }

  const aspectRatio = meta.width / meta.height;

  return (
    <div className="flex flex-col h-full">
      {/* Video + captions overlay container — now fills entire area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden bg-black"
      >
        <div
          style={{
            position: "relative",
            aspectRatio: `${meta.width} / ${meta.height}`,
            maxWidth: "100%",
            maxHeight: "100%",
            width: aspectRatio < 1 ? "auto" : "100%",
            height: aspectRatio < 1 ? "100%" : "auto",
          }}
        >
          {/* HTML5 video — reliable with Tauri asset protocol */}
          <video
            ref={videoRef}
            src={videoSrc}
            onTimeUpdate={onTimeUpdate}
            playsInline
            muted={isMuted}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* Remotion captions overlay — exact styles matching export */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <Player
              ref={playerRef}
              component={CaptionsOverlay}
              inputProps={overlayProps}
              durationInFrames={durationFrames}
              compositionWidth={meta.width}
              compositionHeight={meta.height}
              fps={FPS}
              style={{
                width: "100%",
                height: "100%",
              }}
              autoPlay={false}
              controls={false}
              acknowledgeRemotionLicense
              errorFallback={({ error }) => {
                console.error("[RemotionPreview] Player error:", error);
                return (
                  <div
                    style={{
                      color: "#f87171",
                      fontSize: 12,
                      padding: 8,
                    }}
                  >
                    Caption error: {error.message}
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
