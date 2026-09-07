import { beforeEach, describe, expect, it } from "vitest";
import { LocalConversationStore } from "./conversation-store";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("LocalConversationStore", () => {
  let storage: MemoryStorage;
  let sequence: number;

  beforeEach(() => {
    storage = new MemoryStorage();
    sequence = 0;
  });

  function createStore() {
    return new LocalConversationStore(storage, {
      now: () => 1_000 + sequence,
      createId: () => `conversation-${++sequence}`
    });
  }

  it("creates conversations and lists the most recently updated first", () => {
    const store = createStore();
    const first = store.create("First");
    const second = store.create("Second");

    expect(store.list().map(({ id }) => id)).toEqual([second.id, first.id]);
  });

  it("persists appended messages when reconstructed", () => {
    const store = createStore();
    const conversation = store.create("Local chat");
    store.append(conversation.id, {
      id: "message-1",
      role: "user",
      content: "Hello locally",
      createdAt: 2_000
    });

    const restored = createStore().get(conversation.id);

    expect(restored?.messages).toHaveLength(1);
    expect(restored?.messages[0].content).toBe("Hello locally");
  });

  it("renames and deletes a conversation", () => {
    const store = createStore();
    const conversation = store.create("Untitled");

    expect(store.rename(conversation.id, "Project notes")?.title).toBe("Project notes");
    expect(store.delete(conversation.id)).toBe(true);
    expect(store.get(conversation.id)).toBeUndefined();
  });

  it("recovers with an empty list when stored data is malformed", () => {
    storage.setItem("freedombuild.conversations.v1", "{not-json");

    expect(createStore().list()).toEqual([]);
  });
});
