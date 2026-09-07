import { describe, expect, it, vi } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { JsonInstallationRegistry, LocalAiService, type LocalAiRuntimeAdapter } from "./local-ai-service";

describe("LocalAiService", () => {
  it("downloads, loads, and prompts an allowlisted local model", async () => {
    const adapter: LocalAiRuntimeAdapter = {
      download: vi.fn().mockResolvedValue("C:/models/qwen.gguf"),
      load: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn().mockImplementation(async (_prompt, onText) => {
        onText("Hello ");
        onText("locally");
        return "Hello locally";
      })
    };
    const service = new LocalAiService(adapter, "C:/models");
    const chunks: string[] = [];

    const installation = await service.install("qwen2.5-3b-q4", vi.fn());
    const response = await service.prompt("Hi", (text) => chunks.push(text), new AbortController().signal);

    expect(installation.modelPath).toBe("C:/models/qwen.gguf");
    expect(adapter.download).toHaveBeenCalledWith(expect.stringContaining("Qwen2.5-3B"), "C:/models", expect.any(Function));
    expect(response).toBe("Hello locally");
    expect(chunks).toEqual(["Hello ", "locally"]);
  });

  it("records only completed installations and reloads them on startup", async () => {
    let saved: { modelId: string; modelPath: string } | undefined;
    const registry = {
      read: vi.fn(async () => saved),
      write: vi.fn(async (installation) => { saved = installation; })
    };
    const adapter: LocalAiRuntimeAdapter = {
      download: vi.fn().mockResolvedValue("C:/models/qwen.gguf"),
      load: vi.fn().mockResolvedValue(undefined),
      prompt: vi.fn()
    };
    const service = new LocalAiService(adapter, "C:/models", registry);

    await expect(service.getInstalled()).resolves.toBeUndefined();
    await service.install("qwen2.5-3b-q4", vi.fn());
    await expect(service.getInstalled()).resolves.toEqual({
      modelId: "qwen2.5-3b-q4",
      modelPath: "C:/models/qwen.gguf"
    });

    const restarted = new LocalAiService(adapter, "C:/models", registry);
    await expect(restarted.loadInstalled()).resolves.toBe(true);
    expect(adapter.load).toHaveBeenLastCalledWith("C:/models/qwen.gguf");
  });

  it("rejects model identifiers outside the curated catalog", async () => {
    const adapter = {} as LocalAiRuntimeAdapter;
    const service = new LocalAiService(adapter, "C:/models");

    await expect(service.install("../../untrusted", vi.fn())).rejects.toThrow("Unknown model");
  });

  it("discovers a known GGUF downloaded before manifests were introduced", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "freedombuild-models-"));
    const modelPath = path.join(directory, "Qwen2.5-7B-Instruct-Q4_K_M.gguf");
    await writeFile(modelPath, "test-model");

    const installed = await new JsonInstallationRegistry(directory).read();

    expect(installed).toEqual({ modelId: "qwen2.5-7b-q4", modelPath });
  });
});
