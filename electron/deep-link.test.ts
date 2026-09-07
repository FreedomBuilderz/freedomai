import { describe, expect, it } from "vitest";
import { findFreedomBuildUrl, parseFreedomBuildUrl } from "./deep-link";

describe("FreedomBuild deep links", () => {
  it("accepts the app open link", () => {
    expect(parseFreedomBuildUrl("freedombuild://open")).toEqual({ action: "open" });
  });

  it("rejects unrelated and unsupported links", () => {
    expect(parseFreedomBuildUrl("https://freedombuild.ai")).toBeUndefined();
    expect(parseFreedomBuildUrl("freedombuild://delete-everything")).toBeUndefined();
  });

  it("finds a deep link in process arguments", () => {
    expect(findFreedomBuildUrl(["FreedomBuild.exe", "--flag", "freedombuild://open"])).toBe(
      "freedombuild://open"
    );
  });
});
