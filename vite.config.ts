import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { packagedAssetBase } from "./build-config.ts";

export default defineConfig({
  base: packagedAssetBase,
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"]
  }
});
