import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWindowOptions, isAllowedNavigation, resolvePreloadPath } from "./window-options.js";
import { assessDevice } from "./device.js";
import { LocalAiService, NodeLlamaRuntimeAdapter } from "./local-ai-service.js";
import { sendProgressIfAvailable } from "./progress-events.js";
import { MemoryService } from "./memory-service.js";
import { findFreedomBuildUrl } from "./deep-link.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const developmentOrigin = "http://127.0.0.1:5173";
const activePrompts = new Map<string, AbortController>();
let mainWindow: BrowserWindow | undefined;

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();

function focusMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) mainWindow = createMainWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function registerAppProtocol(): void {
  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient("freedombuild", process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient("freedombuild");
  }
}

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

  mainWindow = window;
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = undefined;
  });
  return window;
}

app.on("second-instance", (_event, commandLine) => {
  if (findFreedomBuildUrl(commandLine)) focusMainWindow();
  else focusMainWindow();
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  if (findFreedomBuildUrl([url])) focusMainWindow();
});

app.whenReady().then(() => {
  registerAppProtocol();
  const localAi = new LocalAiService(
    new NodeLlamaRuntimeAdapter(),
    path.join(app.getPath("userData"), "models")
  );
  const memory = new MemoryService(path.join(app.getPath("userData"), "memory"));
  void memory.initialize();
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
      await memory.captureUserMemory(prompt);
      const promptWithMemory = await memory.buildContext(prompt);
      const response = await localAi.prompt(promptWithMemory, () => undefined, controller.signal);
      await memory.recordInteraction(prompt, response);
      return response;
    } finally {
      activePrompts.delete(requestId);
    }
  });
  ipcMain.on("model:cancel", (_event, requestId: string) => {
    activePrompts.get(requestId)?.abort();
  });
  focusMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) focusMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
