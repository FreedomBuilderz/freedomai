import { useEffect, useState } from "react";
import type { ChatBackend } from "../chat/types";
import type { ConversationStore } from "../chat/conversation-store";
import { FakeLocalBackend } from "../chat/fake-local-backend";
import { ElectronLocalBackend } from "../chat/electron-local-backend";
import { LocalConversationStore } from "../chat/conversation-store";
import { ChatWorkspace } from "../chat/ChatWorkspace";
import { Onboarding, type InstallationProgress } from "../onboarding/Onboarding";
import type { DeviceProfile, Recommendation } from "../onboarding/types";
import "../styles/app.css";

interface AppProps {
  backend?: ChatBackend;
  store?: ConversationStore;
  skipOnboarding?: boolean;
}

async function browserAssessment(): Promise<DeviceProfile> {
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  const storage = await navigator.storage?.estimate?.();
  const memory = (navigatorWithMemory.deviceMemory ?? 8) * 1024 ** 3;
  return {
    platform: "unknown",
    architecture: "browser",
    cpuModel: "Browser estimate",
    cpuCores: navigator.hardwareConcurrency || 4,
    totalMemoryBytes: memory,
    freeMemoryBytes: memory * 0.7,
    freeDiskBytes: storage?.quota ?? 10 * 1024 ** 3,
    supportedBackends: ["cpu"]
  };
}

export function App({
  backend = new FakeLocalBackend(),
  store = new LocalConversationStore(localStorage),
  skipOnboarding = false
}: AppProps) {
  const [demoAccepted, setDemoAccepted] = useState(skipOnboarding);
  const [activeBackend, setActiveBackend] = useState<ChatBackend>(backend);
  const [checkingInstallation, setCheckingInstallation] = useState(
    !skipOnboarding && Boolean(window.freedomBuildDesktop)
  );

  useEffect(() => {
    const bridge = window.freedomBuildDesktop;
    if (skipOnboarding || !bridge) return;
    let active = true;
    void bridge.getInstalledModel()
      .then(async (installation) => {
        if (!installation) return;
        const loaded = await bridge.loadInstalledModel();
        if (loaded && active) {
          setActiveBackend(new ElectronLocalBackend(bridge));
          setDemoAccepted(true);
        }
      })
      .finally(() => {
        if (active) setCheckingInstallation(false);
      });
    return () => { active = false; };
  }, [skipOnboarding]);

  if (checkingInstallation) {
    return (
      <main className="onboarding">
        <section className="setup-card assessment-progress" role="status">
          <span className="scanner" />
          <h1>Loading installed local AI…</h1>
          <p>Verifying the model file and preparing it in memory.</p>
        </section>
      </main>
    );
  }
  async function installLocalModel(
    recommendation: Recommendation,
    onProgress: (progress: InstallationProgress) => void
  ): Promise<void> {
    const bridge = window.freedomBuildDesktop;
    if (!bridge) throw new Error("Model installation is available in the desktop application, not the browser preview.");
    const unsubscribe = bridge.onModelProgress(onProgress);
    try {
      await bridge.installModel(recommendation.model.id);
      setActiveBackend(new ElectronLocalBackend(bridge));
      setDemoAccepted(true);
    } finally {
      unsubscribe();
    }
  }
  if (!demoAccepted) {
    return (
      <Onboarding
        assessDevice={window.freedomBuildDesktop?.assessDevice ?? browserAssessment}
        onInstall={window.freedomBuildDesktop ? installLocalModel : undefined}
        onUseDemo={() => setDemoAccepted(true)}
      />
    );
  }
  return <ChatWorkspace backend={activeBackend} store={store} />;
}
