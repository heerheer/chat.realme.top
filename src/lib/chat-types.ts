export type ThemeMode = "light" | "dark";
export type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh";

export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus = "streaming" | "done" | "error";

export interface ConnectionConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  reasoningEffort: ReasoningEffort;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  reasoningText?: string;
  text: string;
  status?: MessageStatus;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}
