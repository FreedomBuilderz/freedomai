import { describe, expect, it } from "vitest";
import { packagedAssetBase } from "./build-config";

describe("Vite production asset paths", () => {
  it("uses relative asset paths so the renderer loads through file:// in Electron", () => {
    expect(packagedAssetBase).toBe("./");
  });
});
