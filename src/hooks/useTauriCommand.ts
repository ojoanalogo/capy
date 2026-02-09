import { invoke, Channel } from "@tauri-apps/api/core";
import type { PipelineProgress } from "../types/captions";

export async function invokeWithProgress<T>(
  cmd: string,
  args: Record<string, unknown>,
  onProgress: (progress: PipelineProgress) => void,
): Promise<T> {
  const channel = new Channel<PipelineProgress>();
  channel.onmessage = onProgress;
  return invoke<T>(cmd, { ...args, onEvent: channel });
}

export async function invokeCommand<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  return invoke<T>(cmd, args);
}
