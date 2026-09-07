export interface FreedomBuildDeepLink {
  action: "open";
}

export function parseFreedomBuildUrl(value: string): FreedomBuildDeepLink | undefined {
  try {
    const url = new URL(value);
    if (url.protocol === "freedombuild:" && url.hostname === "open") return { action: "open" };
  } catch {
    return undefined;
  }
  return undefined;
}

export function findFreedomBuildUrl(args: string[]): string | undefined {
  return args.find((argument) => parseFreedomBuildUrl(argument));
}
