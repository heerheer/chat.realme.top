import type { ChatSession, ConnectionConfig, ThemeMode } from "@/lib/chat-types";

export const STORAGE_KEYS = {
  activeSessionId: "chat.activeSessionId",
  config: "chat.config",
  sessions: "chat.sessions",
  theme: "chat.theme",
} as const;

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

const canUseStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

const readJson = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: JsonValue) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const readConfig = (fallback: ConnectionConfig): ConnectionConfig => ({
  ...fallback,
  ...readJson<Partial<ConnectionConfig>>(STORAGE_KEYS.config, {}),
});

export const writeConfig = (config: ConnectionConfig) => writeJson(STORAGE_KEYS.config, config);

export const readSessions = (): ChatSession[] => readJson<ChatSession[]>(STORAGE_KEYS.sessions, []);

export const writeSessions = (sessions: ChatSession[]) => writeJson(STORAGE_KEYS.sessions, sessions);

export const readActiveSessionId = (): string => readJson<string>(STORAGE_KEYS.activeSessionId, "");

export const writeActiveSessionId = (sessionId: string) =>
  writeJson(STORAGE_KEYS.activeSessionId, sessionId);

export const readTheme = (): ThemeMode | null => readJson<ThemeMode | null>(STORAGE_KEYS.theme, null);

export const writeTheme = (theme: ThemeMode) => writeJson(STORAGE_KEYS.theme, theme);
