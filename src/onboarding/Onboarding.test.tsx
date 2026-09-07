import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Onboarding } from "./Onboarding";
import type { DeviceProfile } from "./types";

describe("Onboarding", () => {
  it("assesses the device and presents one recommended model", async () => {
    const device: DeviceProfile = {
      platform: "windows",
      architecture: "x64",
      cpuModel: "Test CPU",
      cpuCores: 8,
      totalMemoryBytes: 16 * 1024 ** 3,
      freeMemoryBytes: 12 * 1024 ** 3,
      freeDiskBytes: 100 * 1024 ** 3,
      gpuName: "NVIDIA Test GPU",
      gpuMemoryBytes: 8 * 1024 ** 3,
      supportedBackends: ["cuda", "cpu"]
    };
    const assessDevice = vi.fn().mockResolvedValue(device);
    const user = userEvent.setup();

    render(<Onboarding assessDevice={assessDevice} onInstall={vi.fn()} onUseDemo={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Assess this device" }));

    expect(await screen.findByText("Recommended for this PC")).toBeInTheDocument();
    expect(screen.getByText("Qwen 2.5 7B Instruct")).toBeInTheDocument();
    expect(screen.getByText(/CUDA/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What this model can do" })).toBeInTheDocument();
    expect(screen.getByText("Writing and rewriting")).toBeInTheDocument();
    expect(screen.getByText("Coding assistance")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Important limitations" })).toBeInTheDocument();
    expect(screen.getByText(/can make mistakes/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View other compatible models" }));
    expect(screen.getByRole("heading", { name: "Choose a compatible model" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Qwen 2.5 3B Instruct/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Qwen 2.5 7B Instruct/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Qwen 2.5 14B Instruct/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Qwen 2.5 3B Instruct/ }));
    expect(screen.getByRole("heading", { name: "Qwen 2.5 3B Instruct" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install selected model" })).toBeEnabled();
  });

  it("does not pretend browser preview can detect or install desktop models", async () => {
    const browserDevice: DeviceProfile = {
      platform: "unknown",
      architecture: "browser",
      cpuModel: "Browser estimate",
      cpuCores: 4,
      totalMemoryBytes: 8 * 1024 ** 3,
      freeMemoryBytes: 5 * 1024 ** 3,
      freeDiskBytes: 10 * 1024 ** 3,
      supportedBackends: ["cpu"]
    };
    const user = userEvent.setup();

    render(<Onboarding assessDevice={() => Promise.resolve(browserDevice)} onUseDemo={vi.fn()} />);
    expect(screen.getByText("Browser preview — installed models cannot be detected here")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Assess this device" }));

    expect(await screen.findByText("Recommended for this device")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open the desktop app to install" })).toBeDisabled();
  });

  it("shows model download progress after installation starts", async () => {
    const device: DeviceProfile = {
      platform: "macos",
      architecture: "arm64",
      cpuModel: "Apple M2",
      cpuCores: 8,
      totalMemoryBytes: 16 * 1024 ** 3,
      freeMemoryBytes: 6 * 1024 ** 3,
      freeDiskBytes: 100 * 1024 ** 3,
      supportedBackends: ["metal", "cpu"]
    };
    const onInstall = vi.fn().mockImplementation(async (_recommendation, onProgress) => {
      onProgress({ totalBytes: 1000, downloadedBytes: 420, percent: 42 });
      await new Promise(() => undefined);
    });
    const user = userEvent.setup();

    render(<Onboarding assessDevice={() => Promise.resolve(device)} onInstall={onInstall} onUseDemo={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Assess this device" }));
    await user.click(await screen.findByRole("button", { name: "Install recommended model" }));

    expect(await screen.findByRole("progressbar", { name: "Model download" })).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText("42% downloaded")).toBeInTheDocument();
  });
});
