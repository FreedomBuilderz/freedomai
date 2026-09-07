import { describe, expect, it } from "vitest";
import { createWindowOptions, isAllowedNavigation, resolvePreloadPath } from "./window-options";

describe("desktop window security policy", () => {
  it("creates a context-isolated renderer without direct Node.js access", () => {
    const options = createWindowOptions("C:/app/preload.js");

    expect(options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: "C:/app/preload.js"
    });
  });

  it("allows only the packaged app and configured development origin", () => {
    expect(isAllowedNavigation("file:///C:/app/index.html")).toBe(true);
    expect(isAllowedNavigation("http://127.0.0.1:5173/chat", "http://127.0.0.1:5173")).toBe(true);
    expect(isAllowedNavigation("https://malicious.example", "http://127.0.0.1:5173")).toBe(false);
  });

  it("uses a CommonJS bundle for the sandboxed preload", () => {
    expect(resolvePreloadPath("C:/app/dist-electron")).toBe("C:/app/dist-electron/preload.cjs");
  });
});
