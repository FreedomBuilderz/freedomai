import { useMemo, useRef, useState } from "react";
import type { ChatBackend, ChatMessage } from "./types";
import type { Conversation, ConversationStore } from "./conversation-store";

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function useChat(backend: ChatBackend, store: ConversationStore) {
  const initial = useMemo(() => store.list(), [store]);
  const [conversations, setConversations] = useState<Conversation[]>(initial);
  const [activeId, setActiveId] = useState<string | undefined>(initial[0]?.id);
  const [messages, setMessages] = useState<ChatMessage[]>(initial[0]?.messages ?? []);
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef<AbortController | undefined>(undefined);

  function refresh(conversationId?: string): void {
    setConversations(store.list());
    if (conversationId) {
      setMessages(store.get(conversationId)?.messages ?? []);
    }
  }

  function selectConversation(id: string): void {
    setActiveId(id);
    setMessages(store.get(id)?.messages ?? []);
  }

  function newConversation(): void {
    setActiveId(undefined);
    setMessages([]);
  }

  function stop(): void {
    controllerRef.current?.abort();
  }

  async function send(content: string): Promise<void> {
    const cleanContent = content.trim();
    if (!cleanContent || isStreaming) return;

    const conversation = activeId
      ? store.get(activeId)
      : store.create("New conversation");
    if (!conversation) return;

    setActiveId(conversation.id);
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: cleanContent,
      createdAt: Date.now()
    };
    store.append(conversation.id, userMessage);
    const requestMessages = [...conversation.messages, userMessage];
    const assistantId = createId();
    const assistantBase: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      provenance: backend.identity.provenance
    };
    setMessages([...requestMessages, assistantBase]);
    setIsStreaming(true);
    const controller = new AbortController();
    controllerRef.current = controller;
    let response = "";

    try {
      for await (const chunk of backend.stream({ messages: requestMessages }, controller.signal)) {
        response += chunk.text;
        setMessages([...requestMessages, { ...assistantBase, content: response }]);
      }
      store.append(conversation.id, { ...assistantBase, content: response });
      refresh(conversation.id);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
      setMessages(requestMessages);
    } finally {
      setIsStreaming(false);
      controllerRef.current = undefined;
    }
  }

  return {
    activeId,
    conversations,
    isStreaming,
    messages,
    newConversation,
    selectConversation,
    send,
    stop
  };
}
