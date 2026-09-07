import { describe, expect, it } from "vitest";
import { recommendModel } from "./recommendation";
import type { DeviceProfile, ModelCatalogEntry } from "./types";

const GB = 1024 ** 3;

const catalog: ModelCatalogEntry[] = [
  {
    id: "small",
    name: "Small Local",
    family: "test",
    parameterCount: "3B",
    quantization: "Q4_K_M",
    downloadBytes: 2 * GB,
    requiredMemoryBytes: 4 * GB,
    minimumContextTokens: 4096,
    tier: "limited",
    supportedBackends: ["metal", "cuda", "vulkan", "cpu"],
    modelUri: "hf:test/small.gguf"
  },
  {
    id: "standard",
    name: "Standard Local",
    family: "test",
    parameterCount: "8B",
    quantization: "Q4_K_M",
    downloadBytes: 5 * GB,
    requiredMemoryBytes: 8 * GB,
    minimumContextTokens: 8192,
    tier: "standard",
    supportedBackends: ["metal", "cuda", "vulkan", "cpu"],
    modelUri: "hf:test/standard.gguf"
  },
  {
    id: "large",
    name: "Large Local",
    family: "test",
    parameterCount: "14B",
    quantization: "Q4_K_M",
    downloadBytes: 9 * GB,
    requiredMemoryBytes: 14 * GB,
    minimumContextTokens: 8192,
    tier: "performance",
    supportedBackends: ["metal", "cuda", "cpu"],
    modelUri: "hf:test/large.gguf"
  }
];

function profile(overrides: Partial<DeviceProfile> = {}): DeviceProfile {
  return {
    platform: "windows",
    architecture: "x64",
    cpuModel: "Test CPU",
    cpuCores: 8,
    totalMemoryBytes: 16 * GB,
    freeMemoryBytes: 12 * GB,
    freeDiskBytes: 30 * GB,
    supportedBackends: ["cuda", "cpu"],
    ...overrides
  };
}

describe("recommendModel", () => {
  it("selects the highest tier that fits after reserving memory for the system", () => {
    const result = recommendModel(profile(), catalog);

    expect("model" in result && result.model.id).toBe("standard");
    expect("backend" in result && result.backend).toBe("cuda");
  });

  it("falls back to a small CPU model on limited hardware", () => {
    const result = recommendModel(
      profile({ totalMemoryBytes: 8 * GB, freeMemoryBytes: 6 * GB, supportedBackends: ["cpu"] }),
      catalog
    );

    expect("model" in result && result.model.id).toBe("small");
    expect("backend" in result && result.backend).toBe("cpu");
  });

  it("does not reject a capable device because free memory is temporarily low", () => {
    const result = recommendModel(
      profile({ totalMemoryBytes: 16 * GB, freeMemoryBytes: 2 * GB }),
      catalog
    );

    expect("model" in result && result.model.id).toBe("standard");
  });

  it("returns a disk-specific failure when compatible weights do not fit", () => {
    const result = recommendModel(profile({ freeDiskBytes: 1 * GB }), catalog);

    expect(result).toMatchObject({ reason: "insufficient-disk" });
  });

  it("prefers the smaller download when equally capable models tie", () => {
    const alternative = { ...catalog[1], id: "standard-smaller", downloadBytes: 4 * GB };
    const result = recommendModel(profile(), [...catalog, alternative]);

    expect("model" in result && result.model.id).toBe("standard-smaller");
  });
});
