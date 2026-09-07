import { describe, expect, it } from "vitest";
import { FakeLocalBackend } from "./fake-local-backend";

describe("FakeLocalBackend", () => {
  it("streams ordered response chunks with local provenance", async () => {
    const backend = new FakeLocalBackend({ delayMs: 0 });
    const chunks = [];

    for await (const chunk of backend.stream(
      { messages: [{ id: "m1", role: "user", content: "Hello", createdAt: 1 }] },
      new AbortController().signal
    )) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.provenance === "local")).toBe(true);
    expect(chunks.map((chunk) => chunk.text).join("")).toBe(
      "This is a local response to: Hello"
    );
    expect(chunks.at(-1)?.done).toBe(true);
  });

  it("stops streaming when the request is cancelled", async () => {
    const backend = new FakeLocalBackend({ delayMs: 0 });
    const controller = new AbortController();
    const stream = backend.stream(
      { messages: [{ id: "m1", role: "user", content: "Stop now", createdAt: 1 }] },
      controller.signal
    );

    await stream.next();
    controller.abort();

    await expect(stream.next()).rejects.toMatchObject({ name: "AbortError" });
  });
});
