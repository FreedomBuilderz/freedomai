export type PerformanceTier = "limited" | "standard" | "performance" | "high-end";
export type AccelerationBackend = "metal" | "cuda" | "vulkan" | "cpu";

export interface DeviceProfile {
  platform: "windows" | "macos" | "unknown";
  architecture: string;
  cpuModel: string;
  cpuCores: number;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  freeDiskBytes: number;
  gpuName?: string;
  gpuMemoryBytes?: number;
  supportedBackends: AccelerationBackend[];
}

export interface ModelCatalogEntry {
  id: string;
  name: string;
  family: string;
  parameterCount: string;
  quantization: string;
  downloadBytes: number;
  requiredMemoryBytes: number;
  minimumContextTokens: number;
  tier: PerformanceTier;
  supportedBackends: AccelerationBackend[];
  modelUri: string;
  capabilitySummary?: string;
  capabilities?: string[];
  limitations?: string[];
}

export interface Recommendation {
  model: ModelCatalogEntry;
  backend: AccelerationBackend;
  tier: PerformanceTier;
  reason: string;
}

export interface RecommendationFailure {
  reason: "insufficient-memory" | "insufficient-disk" | "no-compatible-model";
  message: string;
}
