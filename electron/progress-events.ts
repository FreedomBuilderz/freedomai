import type { DownloadProgress } from "./local-ai-service.js";

export interface ProgressTarget {
  isDestroyed(): boolean;
  send(channel: string, progress: DownloadProgress): void;
}

export function sendProgressIfAvailable(
  target: ProgressTarget,
  progress: DownloadProgress
): void {
  if (target.isDestroyed()) return;
  target.send("model:progress", progress);
}
