import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import electronPath from "electron";

export function electronEnvironment(
  parent: Record<string, string | undefined>
): Record<string, string | undefined> {
  const child = { ...parent };
  delete child.ELECTRON_RUN_AS_NODE;
  return child;
}

function launch(): void {
  const child = spawn(electronPath as unknown as string, ["."], {
    env: electronEnvironment(process.env),
    stdio: "inherit"
  });
  child.once("exit", (code) => process.exit(code ?? 1));
  child.once("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  launch();
}
