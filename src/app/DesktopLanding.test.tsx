import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DesktopLanding, WINDOWS_DOWNLOAD_URL } from "./DesktopLanding";

describe("DesktopLanding", () => {
  it("offers launch and Windows installer actions", () => {
    render(<DesktopLanding platform="windows" />);

    expect(screen.getByRole("heading", { name: "Your private AI lives on your computer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open FreedomBuild" })).toHaveAttribute(
      "href",
      "freedombuild://open"
    );
    expect(screen.getByRole("link", { name: "Download for Windows" })).toHaveAttribute(
      "href",
      WINDOWS_DOWNLOAD_URL
    );
    expect(screen.getByText(/installer creates the desktop icon/i)).toBeInTheDocument();
  });

  it("does not claim a Mac installer exists yet", () => {
    render(<DesktopLanding platform="mac" />);
    expect(screen.getByRole("button", { name: "macOS version coming soon" })).toBeDisabled();
  });
});
