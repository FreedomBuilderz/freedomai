import type { ChatMessage } from "./types";

const STORAGE_KEY = "freedombuild.conversations.v1";

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ConversationStore {
  list(): Conversation[];
  get(id: string): Conversation | undefined;
  create(title?: string): Conversation;
  append(id: string, message: ChatMessage): Conversation | undefined;
  rename(id: string, title: string): Conversation | undefined;
  delete(id: string): boolean;
}

interface StoreOptions {
  now?: () => number;
  createId?: () => string;
}

interface StorageEnvelope {
  version: 1;
  conversations: Conversation[];
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Conversation>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.createdAt === "number" &&
    typeof item.updatedAt === "number" &&
    Array.isArray(item.messages)
  );
}

export class LocalConversationStore implements ConversationStore {
  private conversations: Conversation[];
  private readonly now: () => number;
  private readonly createId: () => string;

  constructor(
    private readonly storage: Storage,
    options: StoreOptions = {}
  ) {
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? (() => crypto.randomUUID());
    this.conversations = this.read();
  }

  list(): Conversation[] {
    return [...this.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): Conversation | undefined {
    return this.conversations.find((conversation) => conversation.id === id);
  }

  create(title = "New conversation"): Conversation {
    const timestamp = this.now();
    const conversation: Conversation = {
      id: this.createId(),
      title,
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.conversations.push(conversation);
    this.write();
    return conversation;
  }

  append(id: string, message: ChatMessage): Conversation | undefined {
    return this.update(id, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, message],
      updatedAt: this.now()
    }));
  }

  rename(id: string, title: string): Conversation | undefined {
    return this.update(id, (conversation) => ({
      ...conversation,
      title,
      updatedAt: this.now()
    }));
  }

  delete(id: string): boolean {
    const next = this.conversations.filter((conversation) => conversation.id !== id);
    if (next.length === this.conversations.length) return false;
    this.conversations = next;
    this.write();
    return true;
  }

  private update(
    id: string,
    transform: (conversation: Conversation) => Conversation
  ): Conversation | undefined {
    const index = this.conversations.findIndex((conversation) => conversation.id === id);
    if (index < 0) return undefined;
    const updated = transform(this.conversations[index]);
    this.conversations[index] = updated;
    this.write();
    return updated;
  }

  private read(): Conversation[] {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const envelope = JSON.parse(raw) as Partial<StorageEnvelope>;
      if (envelope.version !== 1 || !Array.isArray(envelope.conversations)) return [];
      return envelope.conversations.filter(isConversation);
    } catch {
      return [];
    }
  }

  private write(): void {
    const envelope: StorageEnvelope = {
      version: 1,
      conversations: this.conversations
    };
    this.storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  }
}
