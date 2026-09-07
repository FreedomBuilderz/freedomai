import { describe, expect, it } from "vitest";
import { assessDevice, type DeviceAssessmentDependencies } from "./device";

describe("assessDevice", () => {
  it("normalizes a Windows device and always includes CPU fallback", async () => {
    const dependencies: DeviceAssessmentDependencies = {
      platform: () => "win32",
      architecture: () => "x64",
      cpus: () => Array.from({ length: 8 }, () => ({ model: "Test CPU" })),
      totalMemory: () => 16 * 1024 ** 3,
      freeMemory: () => 10 * 1024 ** 3,
      freeDisk: async () => 100 * 1024 ** 3,
      gpu: async () => ({ name: "NVIDIA Test GPU", memoryBytes: 8 * 1024 ** 3 })
    };

    await expect(assessDevice(dependencies)).resolves.toMatchObject({
      platform: "windows",
      architecture: "x64",
      cpuModel: "Test CPU",
      cpuCores: 8,
      gpuName: "NVIDIA Test GPU",
      supportedBackends: ["cuda", "cpu"]
    });
  });

  it("selects Metal for Apple Silicon", async () => {
    const dependencies: DeviceAssessmentDependencies = {
      platform: () => "darwin",
      architecture: () => "arm64",
      cpus: () => [{ model: "Apple M3" }],
      totalMemory: () => 24 * 1024 ** 3,
      freeMemory: () => 18 * 1024 ** 3,
      freeDisk: async () => 200 * 1024 ** 3,
      gpu: async () => ({ name: "Apple M3", memoryBytes: 24 * 1024 ** 3 })
    };

    const result = await assessDevice(dependencies);

    expect(result.platform).toBe("macos");
    expect(result.supportedBackends).toEqual(["metal", "cpu"]);
  });
});
