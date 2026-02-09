import { useRef, useEffect } from "react";

interface WaveformCanvasProps {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
  pxPerMs: number;
  height: number;
  color?: string;
  /** Only render peaks starting from this time (ms). Default: 0 */
  startMs?: number;
  /** Only render peaks up to this time (ms). Default: full duration */
  endMs?: number;
}

export function WaveformCanvas({
  peaks,
  duration,
  sampleRate,
  pxPerMs,
  height,
  color = "rgba(249,115,22,0.25)",
  startMs = 0,
  endMs,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const effectiveEndMs = endMs ?? duration * 1000;
  const rangeMs = effectiveEndMs - startMs;
  const totalWidth = rangeMs * pxPerMs;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.ceil(totalWidth);
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;

    const msPerPeak = 1000 / sampleRate;
    const pxPerPeak = msPerPeak * pxPerMs;

    // Only iterate peaks within the visible range
    const startPeak = Math.max(0, Math.floor((startMs / 1000) * sampleRate));
    const endPeak = Math.min(peaks.length, Math.ceil((effectiveEndMs / 1000) * sampleRate));

    for (let i = startPeak; i < endPeak; i++) {
      const peakMs = (i / sampleRate) * 1000;
      const x = (peakMs - startMs) * pxPerMs;
      const peakHeight = peaks[i]! * h * 0.9;
      const barWidth = Math.max(1, pxPerPeak - 0.5);
      const y = (h - peakHeight) / 2;
      ctx.fillRect(x, y, barWidth, peakHeight);
    }
  }, [peaks, sampleRate, pxPerMs, height, color, totalWidth, startMs, effectiveEndMs]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute left-0 pointer-events-none"
      style={{
        width: totalWidth,
        height,
        opacity: 0.8,
      }}
    />
  );
}
