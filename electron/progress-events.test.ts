import { describe, expect, it, vi } from "vitest";
import { sendProgressIfAvailable } from "./progress-events";

describe("sendProgressIfAvailable", () => {
  it("does not send progress to a destroyed renderer", () => {
    const target = { isDestroyed: () => true, send: vi.fn() };

    sendProgressIfAvailable(target, { totalBytes: 100, downloadedBytes: 50, percent: 50 });

    expect(target.send).not.toHaveBeenCalled();
  });
});
