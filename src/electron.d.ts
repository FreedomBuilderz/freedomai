import type { DeviceProfile } from "./onboarding/types";
import type { InstallationProgress } from "./onboarding/Onboarding";

declare global {
  interface Window {
    freedomBuildDesktop?: {
      platform: string;
      versions: { electron: string; node: string };
      assessDevice: () => Promise<DeviceProfile>;
      installModel: (modelId: string) => Promise<{ modelId: string; modelPath: string }>;
      getInstalledModel: () => Promise<{ modelId: string; modelPath: string } | undefined>;
      loadInstalledModel: () => Promise<boolean>;
      promptLocal: (requestId: string, prompt: string) => Promise<string>;
      cancelLocalPrompt: (requestId: string) => void;
      onModelProgress: (callback: (progress: InstallationProgress) => void) => () => void;
    };
  }
}

export {};
