import { describe, expect, it, vi } from "vitest";
import { ElectronLocalBackend } from "./electron-local-backend";

describe("ElectronLocalBackend", () => {
  it("returns AI output from the protected desktop bridge", async () => {
    const promptLocal = vi.fn().mockResolvedValue("I am your local AI assistant.");
    const backend = new ElectronLocalBackend({ promptLocal, cancelLocalPrompt: vi.fn() });
    const chunks = [];

    for await (const chunk of backend.stream(
      { messages: [{ id: "1", role: "user", content: "Who are you?", createdAt: 1 }] },
      new AbortController().signal
    )) chunks.push(chunk);

    expect(promptLocal).toHaveBeenCalledWith(expect.any(String), "Who are you?");
    expect(chunks).toEqual([{ text: "I am your local AI assistant.", done: true, provenance: "local" }]);
  });
});
