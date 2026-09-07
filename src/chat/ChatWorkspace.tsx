import { FormEvent, KeyboardEvent, useState } from "react";
import type { ChatBackend } from "./types";
import type { ConversationStore } from "./conversation-store";
import { useChat } from "./use-chat";

interface ChatWorkspaceProps {
  backend: ChatBackend;
  store: ConversationStore;
}

export function ChatWorkspace({ backend, store }: ChatWorkspaceProps) {
  const chat = useChat(backend, store);
  const [draft, setDraft] = useState("");

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const message = draft;
    if (!message.trim()) return;
    setDraft("");
    await chat.send(message);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">F</span> FreedomBuild</div>
        <button className="new-chat" onClick={chat.newConversation}>＋ New conversation</button>
        <nav aria-label="Conversations">
          {chat.conversations.map((conversation) => (
            <button
              className={conversation.id === chat.activeId ? "conversation active" : "conversation"}
              key={conversation.id}
              onClick={() => chat.selectConversation(conversation.id)}
            >
              {conversation.title}
            </button>
          ))}
        </nav>
        <div className="local-status"><span className="status-dot" /> Demo mode — no AI model installed</div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <strong>Local Assistant</strong>
            <span>{backend.identity.name}</span>
          </div>
          <span className="privacy-pill">Local demo</span>
        </header>

        <section className="transcript" aria-live="polite">
          {chat.messages.length === 0 ? (
            <div className="empty-state">
              <span className="orb">✦</span>
              <h1>Your AI, on your device.</h1>
              <p>Private conversations. No token costs. Available even when the internet isn’t.</p>
            </div>
          ) : (
            <div className="messages">
              {chat.messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-label">
                    {message.role === "user" ? "You" : "FreedomBuild"}
                    {message.provenance === "local" && <span>Local</span>}
                  </div>
                  <p>{message.content || "Thinking…"}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <form className="composer" onSubmit={submit}>
          <textarea
            aria-label="Message your local AI"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Ask anything…"
            rows={1}
            value={draft}
          />
          {chat.isStreaming ? (
            <button aria-label="Stop response" className="send-button" onClick={chat.stop} type="button">■</button>
          ) : (
            <button aria-label="Send message" className="send-button" disabled={!draft.trim()} type="submit">↑</button>
          )}
          <div className="composer-meta">
            <small>Enter to send · Shift+Enter for a new line</small>
            <small>{backend.identity.id === "fake-local" ? "Demo mode" : "Local model"}</small>
          </div>
        </form>
      </main>
    </div>
  );
}
