import "./index.css";
import type { ChatStatus } from "ai";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiKeyStats, ChatMessage, ChatSession, ConnectionConfig, ReasoningEffort } from "@/lib/chat-types";
import { fetchApiKeyStats, fetchModels, streamResponse } from "@/lib/openai";
import {
  readActiveSessionId,
  readConfig,
  readSessions,
  writeActiveSessionId,
  writeConfig,
  writeSessions,
} from "@/lib/storage";
import { AuthPage } from "@/pages/AuthPage";
import { BootPage } from "@/pages/BootPage";
import { ChatPage } from "@/pages/ChatPage";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

type RoutePath = "/auth" | "/chat";

const FALLBACK_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_BASE_URL = process.env.BUN_PUBLIC_OPENAI_BASE_URL || FALLBACK_BASE_URL;
const NEW_CHAT_TITLE = "新会话";
const DEFAULT_REASONING_EFFORT: ReasoningEffort = "low";

const createId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();

const getRoute = (): RoutePath =>
  typeof window !== "undefined" && window.location.pathname === "/chat" ? "/chat" : "/auth";

const navigate = (route: RoutePath, replace = false) => {
  if (typeof window === "undefined") {
    return;
  }
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", route);
};

const createSession = (): ChatSession => {
  const createdAt = nowIso();
  return {
    createdAt,
    id: createId(),
    messages: [],
    title: NEW_CHAT_TITLE,
    updatedAt: createdAt,
  };
};

const trimTitle = (text: string, max = 28) => (text.length > max ? `${text.slice(0, max)}...` : text);

const makeSessionTitle = (messages: ChatMessage[]) => {
  const firstUser = messages.find((message) => message.role === "user" && message.text.trim().length > 0);
  return firstUser ? trimTitle(firstUser.text.trim()) : NEW_CHAT_TITLE;
};

const updateSessionList = (
  prev: ChatSession[],
  sessionId: string,
  updater: (session: ChatSession) => ChatSession
) => {
  let found = false;
  const next = prev.map((session) => {
    if (session.id !== sessionId) {
      return session;
    }
    found = true;
    return updater(session);
  });
  return found ? next : prev;
};

const truncateMessages = (messages: ChatMessage[], targetMessageId: string) => {
  const index = messages.findIndex((message) => message.id === targetMessageId);
  if (index === -1) {
    return messages;
  }
  return messages.slice(0, index + 1);
};

export function App() {
  const [route, setRoute] = useState<RoutePath>(() => getRoute());
  const [booting, setBooting] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [config, setConfig] = useState<ConnectionConfig>(() =>
    readConfig({
      apiKey: "",
      baseUrl: DEFAULT_BASE_URL,
      model: "",
      reasoningEffort: DEFAULT_REASONING_EFFORT,
    })
  );
  const [models, setModels] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = readSessions();
    return saved.length > 0 ? saved : [createSession()];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => readActiveSessionId());
  const [input, setInput] = useState("");
  const [statusText, setStatusText] = useState("请先验证 OPENAI_BASE_URL 与 API Key。");
  const [chatStatus, setChatStatus] = useState<ChatStatus>("ready");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiKeyStats, setApiKeyStats] = useState<ApiKeyStats | null>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || sessions[0] || null,
    [sessions, activeSessionId]
  );

  const connectMutation = useMutation({
    mutationFn: fetchModels,
  });

  const ensureChatRoute = (replace = false) => {
    navigate("/chat", replace);
    setRoute("/chat");
  };

  const ensureAuthRoute = (replace = false) => {
    navigate("/auth", replace);
    setRoute("/auth");
  };

  const validateConnection = async (nextConfig: ConnectionConfig) => {
    const [modelIds, stats] = await Promise.all([
      connectMutation.mutateAsync(nextConfig),
      fetchApiKeyStats(nextConfig).catch(() => null),
    ]);
    const nextModel = modelIds.includes(nextConfig.model) ? nextConfig.model : modelIds[0] || "";
    setModels(modelIds);
    setApiKeyStats(stats);
    setConfig((prev) => ({ ...prev, ...nextConfig, model: nextModel }));
    setIsAuthorized(true);
    setStatusText(`验证通过，可用模型 ${modelIds.length} 个。`);
  };

  const refreshApiKeyStats = async (nextConfig: ConnectionConfig) => {
    try {
      const stats = await fetchApiKeyStats(nextConfig);
      setApiKeyStats(stats);
    } catch {
      // Stats is supplementary UI data, so keep chat usable if this request fails.
    }
  };

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (!activeSession) {
      const created = createSession();
      setSessions([created]);
      setActiveSessionId(created.id);
      return;
    }
    if (activeSession.id !== activeSessionId) {
      setActiveSessionId(activeSession.id);
    }
  }, [activeSession, activeSessionId]);

  useEffect(() => {
    writeConfig(config);
  }, [config]);

  useEffect(() => {
    writeSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      writeActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    let cancelled = false;

    const runBootstrap = async () => {
      const hasSavedKey = config.apiKey.trim().length > 0;
      const hasSavedUrl = config.baseUrl.trim().length > 0;

      if (!hasSavedKey || !hasSavedUrl) {
        setIsAuthorized(false);
        ensureAuthRoute(true);
        setBooting(false);
        return;
      }

      try {
        await validateConnection(config);
        if (!cancelled) {
          ensureChatRoute(true);
        }
      } catch (error) {
        if (!cancelled) {
          setIsAuthorized(false);
          setStatusText(error instanceof Error ? error.message : "验证失败，请重新输入。");
          ensureAuthRoute(true);
        }
      } finally {
        if (!cancelled) {
          setBooting(false);
        }
      }
    };

    runBootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSubmit = async () => {
    if (!config.baseUrl.trim()) {
      setStatusText("请填写 OPENAI_BASE_URL。");
      return;
    }
    if (!config.apiKey.trim()) {
      setStatusText("请填写 API Key。");
      return;
    }

    try {
      await validateConnection(config);
      ensureChatRoute();
    } catch (error) {
      setIsAuthorized(false);
      setStatusText(error instanceof Error ? error.message : "验证失败，请检查配置。");
    }
  };

  const handleNewChat = () => {
    const created = createSession();
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
    setInput("");
    setSidebarOpen(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const nextSessions = prev.filter((session) => session.id !== sessionId);

      if (nextSessions.length === 0) {
        const created = createSession();
        setActiveSessionId(created.id);
        setInput("");
        return [created];
      }

      if (activeSessionId === sessionId) {
        setActiveSessionId(nextSessions[0].id);
        setInput("");
      }

      return nextSessions;
    });
  };

  const stopStreaming = () => {
    streamControllerRef.current?.abort();
  };

  const runConversation = async (
    sessionId: string,
    baseMessages: ChatMessage[],
    userText: string
  ) => {
    if (!config.baseUrl.trim() || !config.apiKey.trim() || !config.model.trim()) {
      setIsAuthorized(false);
      setStatusText("当前连接信息不完整，请先回到验证页重新验证。");
      ensureAuthRoute();
      return;
    }

    const assistantMessage: ChatMessage = {
      id: createId(),
      role: "assistant",
      status: "streaming",
      text: "",
    };
    const nextMessages = [...baseMessages, assistantMessage];

    setSessions((prev) =>
      updateSessionList(prev, sessionId, (session) => ({
        ...session,
        messages: nextMessages,
        title: makeSessionTitle(nextMessages),
        updatedAt: nowIso(),
      }))
    );

    setInput("");
    setChatStatus("streaming");
    setStatusText("回复生成中...");
    const controller = new AbortController();
    streamControllerRef.current = controller;
    let hasFailure = false;

    try {
      await streamResponse({
        config,
        messages: nextMessages.filter((item) => item.status !== "error"),
        onDelta: (delta) => {
          setSessions((prev) =>
            updateSessionList(prev, sessionId, (session) => ({
              ...session,
              messages: session.messages.map((item) =>
                item.id === assistantMessage.id ? { ...item, text: item.text + delta } : item
              ),
              updatedAt: nowIso(),
            }))
          );
        },
        onReasoningDelta: (reasoningText) => {
          setSessions((prev) =>
            updateSessionList(prev, sessionId, (session) => ({
              ...session,
              messages: session.messages.map((item) =>
                item.id === assistantMessage.id ? { ...item, reasoningText } : item
              ),
              updatedAt: nowIso(),
            }))
          );
        },
        signal: controller.signal,
      });

      setSessions((prev) =>
        updateSessionList(prev, sessionId, (session) => ({
          ...session,
          messages: session.messages.map((item) =>
            item.id === assistantMessage.id
              ? { ...item, status: item.text.trim() ? "done" : "error", text: item.text || "空响应。" }
              : item
          ),
          updatedAt: nowIso(),
        }))
      );

      setChatStatus("ready");
      setStatusText("已完成。");
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      const messageText = aborted ? "已停止生成。" : error instanceof Error ? error.message : "流式响应失败。";
      hasFailure = !aborted;

      setSessions((prev) =>
        updateSessionList(prev, sessionId, (session) => ({
          ...session,
          messages: session.messages.map((item) =>
            item.id === assistantMessage.id
              ? {
                  ...item,
                  status: aborted ? "done" : "error",
                  text: item.text.trim().length > 0 ? item.text : messageText,
                }
              : item
          ),
          updatedAt: nowIso(),
        }))
      );

      setChatStatus(aborted ? "ready" : "error");
      setStatusText(messageText);
      if (!aborted && messageText.includes("认证失败")) {
        setIsAuthorized(false);
        ensureAuthRoute();
      }
    } finally {
      streamControllerRef.current = null;
      void refreshApiKeyStats(config);
      if (!hasFailure) {
        setChatStatus("ready");
      }
    }
  };

  const sendMessage = async (message: PromptInputMessage) => {
    if (chatStatus === "streaming") {
      return;
    }

    const userText = message.text.trim();
    if (!userText) {
      return;
    }

    let targetSessionId = activeSessionId;
    let existingMessages = activeSession?.messages || [];

    if (!targetSessionId || !activeSession) {
      const created = createSession();
      targetSessionId = created.id;
      existingMessages = [];
      setSessions((prev) => [created, ...prev]);
      setActiveSessionId(created.id);
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      status: "done",
      text: userText,
    };

    setInput("");
    await runConversation(targetSessionId, [...existingMessages, userMessage], userText);
  };

  const handleEditMessage = async (messageId: string, text: string) => {
    if (!activeSession || chatStatus === "streaming") {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    const truncated: ChatMessage[] = truncateMessages(activeSession.messages, messageId).map((message) =>
      message.id === messageId ? { ...message, text: trimmed, status: "done" as const } : message
    );

    await runConversation(activeSession.id, truncated, trimmed);
  };

  const handleRetryAssistantMessage = async (messageId: string) => {
    if (!activeSession || chatStatus === "streaming") {
      return;
    }

    const truncated = truncateMessages(activeSession.messages, messageId).slice(0, -1);
    const lastUserMessage = [...truncated].reverse().find((message) => message.role === "user");
    if (!lastUserMessage) {
      return;
    }

    await runConversation(activeSession.id, truncated, lastUserMessage.text);
  };

  const handleLogoutToAuth = () => {
    setIsAuthorized(false);
    setApiKeyStats(null);
    setChatStatus("ready");
    setStatusText("请重新验证 API Key。");
    ensureAuthRoute();
  };

  const modelOptions = models.length > 0 ? models : config.model ? [config.model] : [];

  if (booting) {
    return <BootPage />;
  }

  if (route !== "/chat" || !isAuthorized) {
    return (
      <AuthPage
        config={config}
        onConfigChange={setConfig}
        onSubmit={handleAuthSubmit}
        statusText={statusText}
        validating={connectMutation.isPending}
      />
    );
  }

  return (
    <ChatPage
      activeSession={activeSession}
      chatStatus={chatStatus}
      config={config}
      input={input}
      modelOptions={modelOptions}
      apiKeyStats={apiKeyStats}
      onConfigChange={setConfig}
      onDeleteSession={handleDeleteSession}
      onInputChange={setInput}
      onLogoutToAuth={handleLogoutToAuth}
      onNewChat={handleNewChat}
      onEditMessage={handleEditMessage}
      onRetryAssistantMessage={handleRetryAssistantMessage}
      onSelectSession={setActiveSessionId}
      onSendMessage={sendMessage}
      onSidebarOpenChange={setSidebarOpen}
      onStopStreaming={stopStreaming}
      sessions={sessions}
      sidebarOpen={sidebarOpen}
    />
  );
}

export default App;
