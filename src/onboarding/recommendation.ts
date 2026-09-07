import type {
  AccelerationBackend,
  DeviceProfile,
  ModelCatalogEntry,
  PerformanceTier,
  Recommendation,
  RecommendationFailure
} from "./types";

const GB = 1024 ** 3;
const tierRank: Record<PerformanceTier, number> = {
  limited: 1,
  standard: 2,
  performance: 3,
  "high-end": 4
};
const backendPreference: AccelerationBackend[] = ["metal", "cuda", "vulkan", "cpu"];

function bestBackend(
  device: DeviceProfile,
  model: ModelCatalogEntry
): AccelerationBackend | undefined {
  return backendPreference.find(
    (backend) =>
      device.supportedBackends.includes(backend) && model.supportedBackends.includes(backend)
  );
}

export function recommendModel(
  device: DeviceProfile,
  catalog: ModelCatalogEntry[]
): Recommendation | RecommendationFailure {
  const systemReserve = device.totalMemoryBytes >= 16 * GB ? 4 * GB : 2 * GB;
  const usableMemory = Math.max(0, device.totalMemoryBytes - systemReserve);
  const compatible = catalog
    .map((model) => ({ model, backend: bestBackend(device, model) }))
    .filter(
      (candidate): candidate is { model: ModelCatalogEntry; backend: AccelerationBackend } =>
        candidate.backend !== undefined
    );

  if (compatible.length === 0) {
    return {
      reason: "no-compatible-model",
      message: "No catalog model supports this device's available inference backends."
    };
  }

  const memoryCompatible = compatible.filter(
    ({ model }) => model.requiredMemoryBytes <= usableMemory
  );
  if (memoryCompatible.length === 0) {
    return {
      reason: "insufficient-memory",
      message: "This device does not currently have enough available memory for a supported model."
    };
  }

  const diskCompatible = memoryCompatible.filter(
    ({ model }) => model.downloadBytes + GB <= device.freeDiskBytes
  );
  if (diskCompatible.length === 0) {
    return {
      reason: "insufficient-disk",
      message: "Free at least the model download size plus 1 GB of installation space."
    };
  }

  diskCompatible.sort((a, b) => {
    const tierDifference = tierRank[b.model.tier] - tierRank[a.model.tier];
    if (tierDifference !== 0) return tierDifference;
    return a.model.downloadBytes - b.model.downloadBytes;
  });

  const selected = diskCompatible[0];
  return {
    model: selected.model,
    backend: selected.backend,
    tier: selected.model.tier,
    reason: `${selected.model.name} is the highest validated tier that fits while preserving system resources.`
  };
}
