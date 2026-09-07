import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesktopLanding, MAC_DOWNLOAD_URL, WINDOWS_DOWNLOAD_URL } from "./DesktopLanding";

describe("DesktopLanding", () => {
  it("offers only the Windows installer on Windows", () => {
    render(<DesktopLanding platform="windows" />);

    expect(screen.getByRole("heading", { name: "Your private AI lives on your computer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download for Windows" })).toHaveAttribute(
      "href",
      WINDOWS_DOWNLOAD_URL
    );
    expect(screen.queryByText("Open FreedomBuild")).not.toBeInTheDocument();
    expect(screen.queryByText("Download for Mac")).not.toBeInTheDocument();
    expect(screen.getByText(/installer creates the desktop icon/i)).toBeInTheDocument();
  });

  it("offers only the Mac download on macOS", () => {
    render(<DesktopLanding platform="mac" />);
    expect(screen.getByRole("link", { name: "Download for Mac" })).toHaveAttribute("href", MAC_DOWNLOAD_URL);
    expect(screen.queryByText("Download for Windows")).not.toBeInTheDocument();
  });
});
