import { describe, expect, it } from "vitest";
import { electronEnvironment } from "./launch-electron";

describe("electronEnvironment", () => {
  it("removes Node compatibility mode without mutating the parent environment", () => {
    const parent = { PATH: "test", ELECTRON_RUN_AS_NODE: "1" };

    const child = electronEnvironment(parent);

    expect(child).toEqual({ PATH: "test" });
    expect(parent.ELECTRON_RUN_AS_NODE).toBe("1");
  });
});
