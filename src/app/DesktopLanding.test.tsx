import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DesktopLanding,
  MAC_ARM64_DOWNLOAD_URL,
  MAC_X64_DOWNLOAD_URL,
  WINDOWS_DOWNLOAD_URL
} from "./DesktopLanding";

describe("DesktopLanding", () => {
  it("offers only the Windows installer on Windows", () => {
    render(<DesktopLanding platform="windows" />);

    expect(screen.getByRole("heading", { name: "Your AI. Your computer." })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Download for Windows" })[0]).toHaveAttribute(
      "href",
      WINDOWS_DOWNLOAD_URL
    );
    expect(screen.queryByText("Open FreedomBuild")).not.toBeInTheDocument();
    expect(screen.queryByText("Download for Mac")).not.toBeInTheDocument();
    expect(screen.getByText(/creates your desktop shortcut/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From download to private AI in five steps" })).toBeInTheDocument();
    expect(screen.getByText("Assess your device")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Useful every day. Private by default." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Questions before you download" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Download for Windows" })).toHaveLength(2);
  });

  it("offers Apple Silicon and Intel downloads only on macOS", () => {
    render(<DesktopLanding platform="mac" />);
    expect(screen.getAllByRole("link", { name: "Download for Apple Silicon" })[0]).toHaveAttribute(
      "href",
      MAC_ARM64_DOWNLOAD_URL
    );
    expect(screen.getAllByRole("link", { name: "Download for Intel Mac" })[0]).toHaveAttribute(
      "href",
      MAC_X64_DOWNLOAD_URL
    );
    expect(screen.getByText(/Apple menu.*About This Mac/i)).toBeInTheDocument();
    expect(screen.queryByText("Download for Windows")).not.toBeInTheDocument();
  });
});
