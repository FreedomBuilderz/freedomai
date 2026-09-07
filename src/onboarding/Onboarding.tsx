import { useState } from "react";
import { bundledModelCatalog } from "./catalog";
import { recommendModel } from "./recommendation";
import type { DeviceProfile, Recommendation, RecommendationFailure } from "./types";

interface OnboardingProps {
  assessDevice: () => Promise<DeviceProfile>;
  onUseDemo: () => void;
  onInstall?: (
    recommendation: Recommendation,
    onProgress: (progress: InstallationProgress) => void
  ) => Promise<void>;
}

export interface InstallationProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
}

function formatGigabytes(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export function Onboarding({ assessDevice, onUseDemo, onInstall }: OnboardingProps) {
  const [state, setState] = useState<"welcome" | "assessing" | "recommendation" | "installing" | "error">("welcome");
  const [device, setDevice] = useState<DeviceProfile>();
  const [result, setResult] = useState<Recommendation | RecommendationFailure>();
  const [error, setError] = useState("");
  const [showModelOptions, setShowModelOptions] = useState(false);
  const [recommendedModelId, setRecommendedModelId] = useState<string>();
  const [installProgress, setInstallProgress] = useState<InstallationProgress>();

  async function assess(): Promise<void> {
    setState("assessing");
    setError("");
    try {
      const profile = await assessDevice();
      const recommendation = recommendModel(profile, bundledModelCatalog);
      setDevice(profile);
      setResult(recommendation);
      setRecommendedModelId("model" in recommendation ? recommendation.model.id : undefined);
      setShowModelOptions(false);
      setState("recommendation");
    } catch (assessmentError) {
      setError(assessmentError instanceof Error ? assessmentError.message : "Device assessment failed.");
      setState("error");
    }
  }

  const compatibleModels = device
    ? bundledModelCatalog
        .map((model) => recommendModel(device, [model]))
        .filter((candidate): candidate is Recommendation => "model" in candidate)
    : [];

  async function install(): Promise<void> {
    if (!result || !("model" in result)) return;
    if (!onInstall) {
      setError("The model downloader is not connected in this build yet.");
      setState("error");
      return;
    }
    setState("installing");
    setInstallProgress({ totalBytes: result.model.downloadBytes, downloadedBytes: 0, percent: 0 });
    try {
      await onInstall(result, setInstallProgress);
    } catch (installError) {
      setError(installError instanceof Error ? installError.message : "Model installation failed.");
      setState("error");
    }
  }

  return (
    <main className="onboarding">
      <section className="setup-card">
        <div className="setup-brand"><span className="brand-mark">F</span> FreedomBuild</div>
        {state === "welcome" && (
          <>
            <span className="setup-kicker">LOCAL AI SETUP</span>
            <h1>Let’s find the right AI for this device.</h1>
            <p>We’ll inspect CPU, memory, graphics, and free storage locally. Hardware details never leave this computer.</p>
            <button className="primary-action" onClick={assess}>Assess this device</button>
            <button className="text-action" onClick={onUseDemo}>Continue in demo mode</button>
          </>
        )}
        {state === "assessing" && (
          <div className="assessment-progress" role="status">
            <span className="scanner" />
            <h1>Checking this device…</h1>
            <p>Measuring available memory, graphics acceleration, and storage.</p>
          </div>
        )}
        {state === "recommendation" && result && "model" in result && device && (
          <>
            <span className="setup-kicker">Recommended for this {device.platform === "windows" ? "PC" : "Mac"}</span>
            <h1>{result.model.name}</h1>
            <p>{result.reason}</p>
            {result.model.capabilitySummary && <p className="capability-summary">{result.model.capabilitySummary}</p>}
            <dl className="device-grid">
              <div><dt>Download</dt><dd>{formatGigabytes(result.model.downloadBytes)}</dd></div>
              <div><dt>Memory needed</dt><dd>{formatGigabytes(result.model.requiredMemoryBytes)}</dd></div>
              <div><dt>Acceleration</dt><dd>{result.backend.toUpperCase()}</dd></div>
              <div><dt>Available storage</dt><dd>{formatGigabytes(device.freeDiskBytes)}</dd></div>
            </dl>
            <div className="capability-section">
              <h2>What this model can do</h2>
              <ul className="capability-list">
                {result.model.capabilities?.map((capability) => <li key={capability}>{capability}</li>)}
              </ul>
            </div>
            <div className="limitations-section">
              <h2>Important limitations</h2>
              <ul>
                {result.model.limitations?.map((limitation) => <li key={limitation}>{limitation}</li>)}
              </ul>
            </div>
            {!showModelOptions ? (
              <button className="model-options-toggle" onClick={() => setShowModelOptions(true)}>
                View other compatible models
              </button>
            ) : (
              <section className="model-options" aria-labelledby="model-options-heading">
                <h2 id="model-options-heading">Choose a compatible model</h2>
                <p>Only models that fit this device’s current memory and storage are shown.</p>
                <div className="model-option-list">
                  {compatibleModels.map((candidate) => (
                    <button
                      aria-pressed={candidate.model.id === result.model.id}
                      className={candidate.model.id === result.model.id ? "model-option selected" : "model-option"}
                      key={candidate.model.id}
                      onClick={() => {
                        setResult(candidate);
                        setShowModelOptions(false);
                      }}
                    >
                      <span><strong>{candidate.model.name}</strong><small>{candidate.model.tier} · {candidate.backend.toUpperCase()}</small></span>
                      <span><strong>{formatGigabytes(candidate.model.downloadBytes)}</strong><small>{formatGigabytes(candidate.model.requiredMemoryBytes)} RAM</small></span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <button className="primary-action" onClick={install}>
              {result.model.id === recommendedModelId
                ? "Install recommended model"
                : "Install selected model"}
            </button>
            <button className="text-action" onClick={onUseDemo}>Use demo without installing</button>
          </>
        )}
        {state === "recommendation" && result && !("model" in result) && (
          <>
            <span className="setup-kicker">SETUP NEEDS ATTENTION</span>
            <h1>No safe model found</h1>
            <p>{result.message}</p>
            <button className="primary-action" onClick={assess}>Assess again</button>
            <button className="text-action" onClick={onUseDemo}>Continue in demo mode</button>
          </>
        )}
        {state === "installing" && (
          <>
            <span className="setup-kicker">LOCAL MODEL INSTALLATION</span>
            <h1>{installProgress?.percent === 100 ? "Loading your local AI…" : "Installing your local AI…"}</h1>
            <p>
              {installProgress?.percent === 100
                ? "Download complete. The model is being loaded into memory for the first time."
                : "Downloading the model to this device. Keep the application open."}
            </p>
            <div
              aria-label="Model download"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={installProgress?.percent ?? 0}
              className="download-progress"
              role="progressbar"
            >
              <span style={{ width: `${installProgress?.percent ?? 0}%` }} />
            </div>
            <div className="download-details">
              <strong>{installProgress?.percent ?? 0}% downloaded</strong>
              <span>
                {formatGigabytes(installProgress?.downloadedBytes ?? 0)} of {formatGigabytes(installProgress?.totalBytes ?? 0)}
              </span>
            </div>
            <p className="install-note">You can continue when installation and the first model load finish.</p>
          </>
        )}
        {state === "error" && (
          <>
            <span className="setup-kicker">SETUP ERROR</span>
            <h1>We couldn’t finish setup.</h1>
            <p>{error}</p>
            <button className="primary-action" onClick={assess}>Try again</button>
            <button className="text-action" onClick={onUseDemo}>Continue in demo mode</button>
          </>
        )}
      </section>
    </main>
  );
}
