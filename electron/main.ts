import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWindowOptions, isAllowedNavigation, resolvePreloadPath } from "./window-options.js";
import { assessDevice } from "./device.js";
import { LocalAiService, NodeLlamaRuntimeAdapter } from "./local-ai-service.js";
import { sendProgressIfAvailable } from "./progress-events.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const developmentOrigin = "http://127.0.0.1:5173";
const activePrompts = new Map<string, AbortController>();

function createMainWindow(): BrowserWindow {
  const preloadPath = resolvePreloadPath(currentDirectory);
  const window = new BrowserWindow(createWindowOptions(preloadPath));

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    const allowedOrigin = app.isPackaged ? undefined : developmentOrigin;
    if (!isAllowedNavigation(url, allowedOrigin)) event.preventDefault();
  });

  if (app.isPackaged) {
    void window.loadFile(path.join(currentDirectory, "../dist/index.html"));
  } else {
    void window.loadURL(developmentOrigin);
  }

  return window;
}

app.whenReady().then(() => {
  const localAi = new LocalAiService(
    new NodeLlamaRuntimeAdapter(),
    path.join(app.getPath("userData"), "models")
  );
  ipcMain.handle("device:assess", () => assessDevice());
  ipcMain.handle("model:get-installed", () => localAi.getInstalled());
  ipcMain.handle("model:load-installed", () => localAi.loadInstalled());
  ipcMain.handle("model:install", (event, modelId: string) =>
    localAi.install(modelId, (progress) => sendProgressIfAvailable(event.sender, progress))
  );
  ipcMain.handle("model:prompt", async (_event, requestId: string, prompt: string) => {
    const controller = new AbortController();
    activePrompts.set(requestId, controller);
    try {
      return await localAi.prompt(prompt, () => undefined, controller.signal);
    } finally {
      activePrompts.delete(requestId);
    }
  });
  ipcMain.on("model:cancel", (_event, requestId: string) => {
    activePrompts.get(requestId)?.abort();
  });
  createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
