import type { ChatBackend, ChatChunk, ChatRequest } from "./types";

export interface LocalDesktopBridge {
  promptLocal(requestId: string, prompt: string): Promise<string>;
  cancelLocalPrompt(requestId: string): void;
}

function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export class ElectronLocalBackend implements ChatBackend {
  readonly identity = {
    id: "node-llama-cpp",
    name: "Installed local model",
    provenance: "local" as const
  };

  constructor(private readonly bridge: LocalDesktopBridge) {}

  async *stream(request: ChatRequest, signal: AbortSignal): AsyncGenerator<ChatChunk> {
    const prompt = [...request.messages].reverse().find((message) => message.role === "user")?.content;
    if (!prompt) return;
    const requestId = createRequestId();
    const cancel = () => this.bridge.cancelLocalPrompt(requestId);
    signal.addEventListener("abort", cancel, { once: true });
    try {
      const text = await this.bridge.promptLocal(requestId, prompt);
      yield { text, done: true, provenance: "local" };
    } finally {
      signal.removeEventListener("abort", cancel);
    }
  }
}
