import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { FakeLocalBackend } from "../chat/fake-local-backend";
import { LocalConversationStore } from "../chat/conversation-store";

describe("App", () => {
  afterEach(() => {
    delete window.freedomBuildDesktop;
  });
  it("sends a prompt, streams a local response, and persists the conversation", async () => {
    const store = new LocalConversationStore(localStorage);
    const user = userEvent.setup();
    const view = render(
      <App backend={new FakeLocalBackend({ delayMs: 0 })} store={store} skipOnboarding />
    );

    expect(screen.getByText("Your AI, on your device.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Message your local AI"), "Hello");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("This is a local response to: Hello")).toBeInTheDocument();
    expect(screen.getByText("Demo mode — no AI model installed")).toBeInTheDocument();

    view.unmount();
    render(<App backend={new FakeLocalBackend({ delayMs: 0 })} store={store} skipOnboarding />);
    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });
  });

  it("sends with Enter and keeps Shift+Enter as a new line", async () => {
    const store = new LocalConversationStore(localStorage);
    const user = userEvent.setup();
    render(<App backend={new FakeLocalBackend({ delayMs: 0 })} store={store} skipOnboarding />);
    const composer = screen.getByLabelText("Message your local AI");

    expect(screen.getByText("Enter to send · Shift+Enter for a new line")).toBeInTheDocument();
    await user.type(composer, "First line{shift>}{enter}{/shift}Second line");
    expect(composer).toHaveValue("First line\nSecond line");
    await user.type(composer, "{enter}");

    expect(await screen.findByText("This is a local response to: First line Second line")).toBeInTheDocument();
  });

  it("detects and loads a completed model installation on startup", async () => {
    window.freedomBuildDesktop = {
      platform: "darwin",
      versions: { electron: "44", node: "24" },
      assessDevice: vi.fn(),
      installModel: vi.fn(),
      getInstalledModel: vi.fn().mockResolvedValue({ modelId: "qwen2.5-7b-q4", modelPath: "/models/qwen.gguf" }),
      loadInstalledModel: vi.fn().mockResolvedValue(true),
      promptLocal: vi.fn(),
      cancelLocalPrompt: vi.fn(),
      onModelProgress: vi.fn().mockReturnValue(() => undefined)
    };

    render(<App store={new LocalConversationStore(localStorage)} />);

    expect(screen.getByText("Loading installed local AI…")).toBeInTheDocument();
    expect(await screen.findByText("Installed local model")).toBeInTheDocument();
    expect(window.freedomBuildDesktop.loadInstalledModel).toHaveBeenCalledOnce();
  });
});
