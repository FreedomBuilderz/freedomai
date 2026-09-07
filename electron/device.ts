import { execFile } from "node:child_process";
import { statfs } from "node:fs/promises";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type NativeAccelerationBackend = "metal" | "cuda" | "vulkan" | "cpu";

export interface NativeDeviceProfile {
  platform: "windows" | "macos" | "unknown";
  architecture: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  freeDiskBytes: number;
  gpuName?: string;
  gpuMemoryBytes?: number;
  supportedBackends: NativeAccelerationBackend[];
}

export interface GpuInfo {
  name: string;
  memoryBytes?: number;
}

interface CpuInfoLike {
  model: string;
}

export interface DeviceAssessmentDependencies {
  platform: () => NodeJS.Platform;
  architecture: () => string;
  cpus: () => CpuInfoLike[];
  totalMemory: () => number;
  freeMemory: () => number;
  freeDisk: () => Promise<number>;
  gpu: (platform: NodeJS.Platform) => Promise<GpuInfo | undefined>;
}

async function getFreeDiskBytes(): Promise<number> {
  const stats = await statfs(process.cwd());
  return stats.bavail * stats.bsize;
}

async function detectGpu(platform: NodeJS.Platform): Promise<GpuInfo | undefined> {
  try {
    if (platform === "win32") {
      const script = [
        "Get-CimInstance Win32_VideoController",
        "Select-Object -First 1 Name,AdapterRAM",
        "ConvertTo-Json -Compress"
      ].join(" | ");
      const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", script], {
        timeout: 8_000,
        windowsHide: true
      });
      const parsed = JSON.parse(stdout) as { Name?: string; AdapterRAM?: number };
      if (!parsed.Name) return undefined;
      return { name: parsed.Name, memoryBytes: parsed.AdapterRAM || undefined };
    }

    if (platform === "darwin") {
      const { stdout } = await execFileAsync("system_profiler", ["SPDisplaysDataType", "-json"], {
        timeout: 8_000
      });
      const parsed = JSON.parse(stdout) as {
        SPDisplaysDataType?: Array<{ sppci_model?: string; spdisplays_vram?: string }>;
      };
      const display = parsed.SPDisplaysDataType?.[0];
      if (!display?.sppci_model) return undefined;
      return { name: display.sppci_model };
    }
  } catch {
    return undefined;
  }

  return undefined;
}

const defaultDependencies: DeviceAssessmentDependencies = {
  platform: os.platform,
  architecture: os.arch,
  cpus: os.cpus,
  totalMemory: os.totalmem,
  freeMemory: os.freemem,
  freeDisk: getFreeDiskBytes,
  gpu: detectGpu
};

export async function assessDevice(
  dependencies: DeviceAssessmentDependencies = defaultDependencies
): Promise<NativeDeviceProfile> {
  const nativePlatform = dependencies.platform();
  const architecture = dependencies.architecture();
  const cpuList = dependencies.cpus();
  const gpu = await dependencies.gpu(nativePlatform);
  const supportedBackends: NativeAccelerationBackend[] = [];

  if (nativePlatform === "darwin" && architecture === "arm64") {
    supportedBackends.push("metal");
  } else if (nativePlatform === "win32" && gpu?.name.toLowerCase().includes("nvidia")) {
    supportedBackends.push("cuda");
  } else if (nativePlatform === "win32" && gpu) {
    supportedBackends.push("vulkan");
  }
  supportedBackends.push("cpu");

  return {
    platform: nativePlatform === "win32" ? "windows" : nativePlatform === "darwin" ? "macos" : "unknown",
    architecture,
    cpuModel: cpuList[0]?.model ?? "Unknown CPU",
    cpuCores: cpuList.length,
    totalMemoryBytes: dependencies.totalMemory(),
    freeMemoryBytes: dependencies.freeMemory(),
    freeDiskBytes: await dependencies.freeDisk(),
    gpuName: gpu?.name,
    gpuMemoryBytes: gpu?.memoryBytes,
    supportedBackends
  };
}
