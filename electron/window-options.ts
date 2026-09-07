export interface SecureWindowOptions {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  show: boolean;
  backgroundColor: string;
  webPreferences: {
    contextIsolation: true;
    nodeIntegration: false;
    sandbox: true;
    preload: string;
  };
}

export function createWindowOptions(preloadPath: string): SecureWindowOptions {
  return {
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    show: false,
    backgroundColor: "#171b18",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: preloadPath
    }
  };
}

export function resolvePreloadPath(compiledDirectory: string): string {
  return `${compiledDirectory.replace(/[\\/]$/, "")}/preload.cjs`;
}

export function isAllowedNavigation(url: string, developmentOrigin?: string): boolean {
  if (url.startsWith("file://")) return true;
  if (!developmentOrigin) return false;

  try {
    return new URL(url).origin === new URL(developmentOrigin).origin;
  } catch {
    return false;
  }
}
