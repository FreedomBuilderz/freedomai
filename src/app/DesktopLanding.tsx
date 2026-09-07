export const WINDOWS_DOWNLOAD_URL =
  "https://github.com/FreedomBuilderz/freedomai/releases/latest/download/FreedomBuild-Local-AI-0.1.0-x64.exe";

export type BrowserPlatform = "windows" | "mac" | "other";

export function detectBrowserPlatform(userAgent = navigator.userAgent): BrowserPlatform {
  if (/windows/i.test(userAgent)) return "windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "mac";
  return "other";
}

export function DesktopLanding({ platform = detectBrowserPlatform() }: { platform?: BrowserPlatform }) {
  return (
    <main className="desktop-landing">
      <section className="download-card">
        <div className="setup-brand"><span className="brand-mark">F</span> FreedomBuild</div>
        <span className="setup-kicker">LOCAL AI DESKTOP APP</span>
        <h1>Your private AI lives on your computer</h1>
        <p className="download-summary">
          FreedomBuild runs its main AI locally, keeps your conversations on your device, and has no
          per-message token cost.
        </p>
        <div className="download-actions">
          <a className="primary-action action-link" href="freedombuild://open">Open FreedomBuild</a>
          {platform === "windows" ? (
            <a className="secondary-action action-link" href={WINDOWS_DOWNLOAD_URL}>Download for Windows</a>
          ) : platform === "mac" ? (
            <button className="secondary-action" disabled>macOS version coming soon</button>
          ) : (
            <a className="secondary-action action-link" href={WINDOWS_DOWNLOAD_URL}>Download Windows installer</a>
          )}
        </div>
        <div className="install-note">
          <strong>First time?</strong> Download and run the installer once. The installer creates the
          desktop icon. After installation, “Open FreedomBuild” launches the app directly.
        </div>
        <p className="privacy-note">The browser cannot silently install software. Your computer will ask you to approve installation.</p>
      </section>
    </main>
  );
}
