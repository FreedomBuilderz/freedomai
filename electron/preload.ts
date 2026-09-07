import { contextBridge, ipcRenderer } from "electron";
import type { NativeDeviceProfile } from "./device.js";
import type { DownloadProgress, ModelInstallationResult } from "./local-ai-service.js";

export interface FreedomBuildDesktopApi {
  platform: NodeJS.Platform;
  versions: {
    electron: string;
    node: string;
  };
  assessDevice: () => Promise<NativeDeviceProfile>;
  installModel: (modelId: string) => Promise<ModelInstallationResult>;
  getInstalledModel: () => Promise<ModelInstallationResult | undefined>;
  loadInstalledModel: () => Promise<boolean>;
  promptLocal: (requestId: string, prompt: string) => Promise<string>;
  cancelLocalPrompt: (requestId: string) => void;
  onModelProgress: (callback: (progress: DownloadProgress) => void) => () => void;
}

const desktopApi: FreedomBuildDesktopApi = Object.freeze({
  platform: process.platform,
  versions: Object.freeze({
    electron: process.versions.electron,
    node: process.versions.node
  }),
  assessDevice: () => ipcRenderer.invoke("device:assess") as Promise<NativeDeviceProfile>,
  installModel: (modelId: string) =>
    ipcRenderer.invoke("model:install", modelId) as Promise<ModelInstallationResult>,
  getInstalledModel: () =>
    ipcRenderer.invoke("model:get-installed") as Promise<ModelInstallationResult | undefined>,
  loadInstalledModel: () => ipcRenderer.invoke("model:load-installed") as Promise<boolean>,
  promptLocal: (requestId: string, prompt: string) =>
    ipcRenderer.invoke("model:prompt", requestId, prompt) as Promise<string>,
  cancelLocalPrompt: (requestId: string) => ipcRenderer.send("model:cancel", requestId),
  onModelProgress: (callback: (progress: DownloadProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: DownloadProgress) => callback(progress);
    ipcRenderer.on("model:progress", listener);
    return () => ipcRenderer.removeListener("model:progress", listener);
  }
});

contextBridge.exposeInMainWorld("freedomBuildDesktop", desktopApi);
