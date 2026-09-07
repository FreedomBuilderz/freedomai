import type {
  BackendIdentity,
  ChatBackend,
  ChatChunk,
  ChatRequest
} from "./types";

export interface FakeLocalBackendOptions {
  delayMs?: number;
}

function abortError(): DOMException {
  return new DOMException("The request was cancelled.", "AbortError");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class FakeLocalBackend implements ChatBackend {
  readonly identity: BackendIdentity = {
    id: "fake-local",
    name: "Demo response engine",
    provenance: "local"
  };

  private readonly delayMs: number;

  constructor(options: FakeLocalBackendOptions = {}) {
    this.delayMs = options.delayMs ?? 20;
  }

  async *stream(
    request: ChatRequest,
    signal: AbortSignal
  ): AsyncGenerator<ChatChunk> {
    const prompt = [...request.messages]
      .reverse()
      .find((message) => message.role === "user")?.content ?? "";
    const response = `This is a local response to: ${prompt}`;
    const parts = response.match(/\S+\s*/g) ?? [response];

    for (const [index, text] of parts.entries()) {
      if (signal.aborted) {
        throw abortError();
      }

      if (this.delayMs > 0) {
        await delay(this.delayMs);
      } else {
        await Promise.resolve();
      }

      if (signal.aborted) {
        throw abortError();
      }

      yield {
        text,
        done: index === parts.length - 1,
        provenance: "local"
      };
    }
  }
}
