import type { LlamaChatSession, LlamaContext, LlamaModel } from "node-llama-cpp";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
}

export interface ModelInstallationResult {
  modelId: string;
  modelPath: string;
}

export interface InstallationRegistry {
  read(): Promise<ModelInstallationResult | undefined>;
  write(installation: ModelInstallationResult): Promise<void>;
}

export class JsonInstallationRegistry implements InstallationRegistry {
  private readonly manifestPath: string;

  constructor(private readonly modelsDirectory: string) {
    this.manifestPath = path.join(modelsDirectory, "installation.json");
  }

  async read(): Promise<ModelInstallationResult | undefined> {
    try {
      const parsed = JSON.parse(await readFile(this.manifestPath, "utf8")) as Partial<ModelInstallationResult>;
      if (typeof parsed.modelId !== "string" || typeof parsed.modelPath !== "string") return undefined;
      await access(parsed.modelPath);
      return { modelId: parsed.modelId, modelPath: parsed.modelPath };
    } catch {
      return this.discoverLegacyModel();
    }
  }

  private async discoverLegacyModel(): Promise<ModelInstallationResult | undefined> {
    try {
      const files = await readdir(this.modelsDirectory);
      const knownNames: Array<[string, string]> = [
        ["qwen2.5-14b-instruct", "qwen2.5-14b-q4"],
        ["qwen2.5-7b-instruct", "qwen2.5-7b-q4"],
        ["qwen2.5-3b-instruct", "qwen2.5-3b-q4"]
      ];
      for (const [fragment, modelId] of knownNames) {
        const fileName = files.find(
          (file) => file.toLowerCase().includes(fragment) && file.toLowerCase().endsWith(".gguf")
        );
        if (!fileName) continue;
        const installation = { modelId, modelPath: path.join(this.modelsDirectory, fileName) };
        await this.write(installation);
        return installation;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  async write(installation: ModelInstallationResult): Promise<void> {
    await mkdir(this.modelsDirectory, { recursive: true });
    await writeFile(this.manifestPath, JSON.stringify(installation, null, 2), "utf8");
  }
}

export interface LocalAiRuntimeAdapter {
  download(
    modelUri: string,
    directory: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<string>;
  load(modelPath: string): Promise<void>;
  prompt(
    prompt: string,
    onText: (text: string) => void,
    signal: AbortSignal
  ): Promise<string>;
}

const curatedModels: Record<string, string> = {
  "qwen2.5-3b-q4": "hf:bartowski/Qwen2.5-3B-Instruct-GGUF:Q4_K_M",
  "qwen2.5-7b-q4": "hf:bartowski/Qwen2.5-7B-Instruct-GGUF:Q4_K_M",
  "qwen2.5-14b-q4": "hf:bartowski/Qwen2.5-14B-Instruct-GGUF:Q4_K_M"
};

export class NodeLlamaRuntimeAdapter implements LocalAiRuntimeAdapter {
  private model?: LlamaModel;
  private context?: LlamaContext;
  private session?: LlamaChatSession;

  async download(
    modelUri: string,
    directory: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<string> {
    const { createModelDownloader } = await import("node-llama-cpp");
    const downloader = await createModelDownloader({
      modelUri,
      dirPath: directory,
      showCliProgress: false,
      onProgress: ({ totalSize, downloadedSize }) => {
        onProgress({
          totalBytes: totalSize,
          downloadedBytes: downloadedSize,
          percent: totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0
        });
      }
    });
    return downloader.download();
  }

  async load(modelPath: string): Promise<void> {
    const { getLlama, LlamaChatSession } = await import("node-llama-cpp");
    const llama = await getLlama();
    this.model = await llama.loadModel({ modelPath });
    this.context = await this.model.createContext({ contextSize: 4096 });
    this.session = new LlamaChatSession({ contextSequence: this.context.getSequence() });
  }

  async prompt(
    prompt: string,
    onText: (text: string) => void,
    signal: AbortSignal
  ): Promise<string> {
    if (!this.session) throw new Error("No local model is loaded.");
    return this.session.prompt(prompt, {
      signal,
      stopOnAbortSignal: true,
      maxTokens: 1024,
      temperature: 0.7,
      onTextChunk: onText
    });
  }
}

export class LocalAiService {
  private readonly registry: InstallationRegistry;

  constructor(
    private readonly adapter: LocalAiRuntimeAdapter,
    private readonly modelsDirectory: string,
    registry?: InstallationRegistry
  ) {
    this.registry = registry ?? new JsonInstallationRegistry(modelsDirectory);
  }

  async install(
    modelId: string,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<ModelInstallationResult> {
    const modelUri = curatedModels[modelId];
    if (!modelUri) throw new Error("Unknown model. Only curated models can be installed.");
    const modelPath = await this.adapter.download(modelUri, this.modelsDirectory, onProgress);
    await this.adapter.load(modelPath);
    const installation = { modelId, modelPath };
    await this.registry.write(installation);
    return installation;
  }

  getInstalled(): Promise<ModelInstallationResult | undefined> {
    return this.registry.read();
  }

  async loadInstalled(): Promise<boolean> {
    const installation = await this.registry.read();
    if (!installation) return false;
    await this.adapter.load(installation.modelPath);
    return true;
  }

  prompt(
    prompt: string,
    onText: (text: string) => void,
    signal: AbortSignal
  ): Promise<string> {
    return this.adapter.prompt(prompt, onText, signal);
  }
}
