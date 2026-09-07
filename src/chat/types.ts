export type MessageRole = "user" | "assistant" | "system";

export type BackendProvenance = "local" | "cloud";

export interface BackendIdentity {
  id: string;
  name: string;
  provenance: BackendProvenance;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  provenance?: BackendProvenance;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatChunk {
  text: string;
  done: boolean;
  provenance: BackendProvenance;
}

export interface ChatBackend {
  readonly identity: BackendIdentity;
  stream(request: ChatRequest, signal: AbortSignal): AsyncIterable<ChatChunk>;
}
