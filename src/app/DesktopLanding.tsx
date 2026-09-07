export const WINDOWS_DOWNLOAD_URL =
  "https://github.com/FreedomBuilderz/freedomai/releases/latest/download/FreedomBuild-Local-AI-0.1.0-x64.exe";
export const MAC_DOWNLOAD_URL = "https://github.com/FreedomBuilderz/freedomai/releases/latest";

export type BrowserPlatform = "windows" | "mac" | "other";

export function detectBrowserPlatform(userAgent = navigator.userAgent): BrowserPlatform {
  if (/windows/i.test(userAgent)) return "windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "mac";
  return "other";
}

function DownloadButton({ platform }: { platform: BrowserPlatform }) {
  if (platform === "windows") return <a className="landing-download" href={WINDOWS_DOWNLOAD_URL}>Download for Windows</a>;
  if (platform === "mac") return <a className="landing-download" href={MAC_DOWNLOAD_URL}>Download for Mac</a>;
  return <a className="landing-download" href={MAC_DOWNLOAD_URL}>View available downloads</a>;
}

const tutorialSteps = [
  ["01", "Download the app", "Get the installer selected for your operating system."],
  ["02", "Install FreedomBuild", "Approve the installer. Windows also creates your desktop shortcut."],
  ["03", "Assess your device", "FreedomBuild checks memory, processor, graphics, and storage locally."],
  ["04", "Choose your local model", "The app recommends the strongest compatible model and explains its abilities."],
  ["05", "Chat privately", "Your model and conversations stay on your computer and continue working offline."]
];

const capabilities = [
  ["Ask and understand", "Get explanations, brainstorm ideas, and work through everyday questions."],
  ["Write and improve", "Draft, rewrite, summarize, and translate without sending text to a cloud model."],
  ["Build and troubleshoot", "Get coding help, study unfamiliar concepts, and reason through technical problems."],
  ["Remember locally", "Save useful preferences and context in local memory files controlled by you."]
];

export function DesktopLanding({ platform = detectBrowserPlatform() }: { platform?: BrowserPlatform }) {
  const platformName = platform === "windows" ? "Windows" : platform === "mac" ? "macOS" : "your computer";
  return (
    <main className="desktop-landing">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="landing-brand" href="#top"><span className="brand-mark">F</span> FreedomBuild</a>
        <div className="landing-nav-links"><a href="#tutorial">How it works</a><a href="#capabilities">Capabilities</a><a href="#faq">FAQ</a></div>
      </nav>

      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <span className="setup-kicker">LOCAL AI · PRIVATE BY DEFAULT</span>
          <h1>Your AI.<br /><em>Your computer.</em></h1>
          <p>FreedomBuild installs an AI matched to your hardware. Chat, write, learn, and build locally—with no per-message token cost.</p>
          <div className="hero-actions"><DownloadButton platform={platform} /><a className="tutorial-link" href="#tutorial">See how it works ↓</a></div>
          <div className="trust-row"><span>✓ Runs locally</span><span>✓ Works offline</span><span>✓ Local memory</span></div>
        </div>
        <div className="product-preview" aria-label="FreedomBuild desktop app preview">
          <div className="preview-bar"><i /><i /><i /><span>FreedomBuild Local AI</span></div>
          <div className="preview-body">
            <div className="preview-sidebar"><b>F</b><span>New conversation</span><span className="preview-line" /><span className="preview-line short" /></div>
            <div className="preview-chat"><small>LOCAL · ON DEVICE</small><div className="preview-message user">Help me plan my week.</div><div className="preview-message ai">Absolutely. Let’s organize your priorities and build a realistic plan.</div><div className="preview-input">Ask anything… <b>↑</b></div></div>
          </div>
        </div>
      </section>

      <section className="landing-section tutorial-section" id="tutorial">
        <span className="section-label">HOW IT WORKS</span><h2>From download to private AI in five steps</h2>
        <p className="section-intro">No command line, model research, or technical setup required.</p>
        <div className="tutorial-grid">{tutorialSteps.map(([number, title, detail]) => <article className="tutorial-step" key={number}><span>{number}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
      </section>

      <section className="landing-section capability-section" id="capabilities">
        <div className="capability-heading"><span className="section-label">WHAT IT CAN DO</span><h2>Useful every day. Private by default.</h2><p>Capabilities depend on the model your computer can comfortably run. FreedomBuild explains the recommendation before downloading anything.</p></div>
        <div className="capability-grid">{capabilities.map(([title, detail], index) => <article key={title}><span className="capability-icon">{["?", "✦", "⌘", "◎"][index]}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
      </section>

      <section className="landing-section requirements-section">
        <div><span className="section-label">BUILT FOR YOUR DEVICE</span><h2>FreedomBuild does the model matching.</h2><p>On first launch, the desktop app privately examines available memory, CPU, graphics acceleration, and free storage. It then recommends a compatible text model instead of forcing one model onto every computer.</p></div>
        <div className="requirement-card"><span>Detected platform</span><strong>{platformName}</strong><hr /><span>AI location</span><strong>On your device</strong><hr /><span>Cloud account</span><strong>Not required</strong></div>
      </section>

      <section className="landing-section faq-section" id="faq">
        <span className="section-label">FAQ</span><h2>Questions before you download</h2>
        <div className="faq-list">
          <details open><summary>Does FreedomBuild work without internet?</summary><p>Yes. Internet is needed for the initial application and model downloads. After that, local chat can run offline.</p></details>
          <details><summary>Is the AI really free to use?</summary><p>The included local models have no per-message token fees. Your computer supplies the processing power.</p></details>
          <details><summary>Where are conversations and memories stored?</summary><p>They stay in FreedomBuild’s local application data on your device. Local memory is context storage, not secret cloud training.</p></details>
          <details><summary>Can I connect an online AI provider?</summary><p>Provider connections can be offered as an optional setting. The main experience remains local-first.</p></details>
          <details><summary>Can local AI make mistakes?</summary><p>Yes. Local models can invent facts or struggle with complex work. Important information should always be verified.</p></details>
        </div>
      </section>

      <section className="landing-cta">
        <span className="section-label">READY WHEN YOU ARE</span><h2>Bring AI home.</h2><p>Download FreedomBuild, install your recommended model, and keep your work where it belongs.</p><DownloadButton platform={platform} /><small>The installer asks for your approval and creates the application shortcut.</small>
      </section>
      <footer><a className="landing-brand" href="#top"><span className="brand-mark">F</span> FreedomBuild</a><p>Local intelligence. Your rules.</p><span>© 2026 FreedomBuild</span></footer>
    </main>
  );
}
