import { useRef, useEffect, useCallback, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useProjectStore } from "../stores/useProjectStore";

export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { videoSrc, setCurrentTimeMs } = useProjectStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const ms = video.currentTime * 1000;
    setCurrentTime(video.currentTime);
    setCurrentTimeMs(ms);
  }, [setCurrentTimeMs]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    video.currentTime = fraction * duration;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Allow external seeking from caption list
  useEffect(() => {
    const handler = (e: CustomEvent<number>) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = e.detail / 1000;
      }
    };
    window.addEventListener("seek-video" as string, handler as EventListener);
    return () =>
      window.removeEventListener(
        "seek-video" as string,
        handler as EventListener,
      );
  }, []);

  if (!videoSrc) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          src={videoSrc}
          onTimeUpdate={handleTimeUpdate}
          className="w-full"
          playsInline
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={togglePlay}>
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={restart}>
          <RotateCcw className="h-4 w-4" />
        </Button>

        <span className="min-w-[48px] text-xs text-muted-foreground">
          {formatTime(currentTime)}
        </span>

        {/* Seek bar */}
        <div
          className="relative h-2 flex-1 cursor-pointer rounded-full bg-muted"
          onClick={seekTo}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
            }}
          />
        </div>

        <span className="min-w-[48px] text-right text-xs text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
