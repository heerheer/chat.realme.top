import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatStatus } from "ai";
import {
  BotIcon,
  CheckIcon,
  CopyIcon,
  LightbulbIcon,
  MenuIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { type ChatMessage, type ChatSession, type ConnectionConfig, type ReasoningEffort } from "@/lib/chat-types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ChatPageProps {
  activeSession: ChatSession | null;
  chatStatus: ChatStatus;
  config: ConnectionConfig;
  input: string;
  modelOptions: string[];
  sessions: ChatSession[];
  sidebarOpen: boolean;
  onConfigChange: (next: ConnectionConfig) => void;
  onInputChange: (value: string) => void;
  onEditMessage: (messageId: string, text: string) => Promise<void>;
  onLogoutToAuth: () => void;
  onNewChat: () => void;
  onRetryAssistantMessage: (messageId: string) => Promise<void>;
  onSelectSession: (sessionId: string) => void;
  onSendMessage: (message: PromptInputMessage) => Promise<void>;
  onSidebarOpenChange: (open: boolean) => void;
  onStopStreaming: () => void;
}

const reasoningOptions: Array<{ label: string; value: ReasoningEffort }> = [
  { label: "不思考 · None", value: "none" },
  { label: "极低 · Minimal", value: "minimal" },
  { label: "低 · Low", value: "low" },
  { label: "中 · Medium", value: "medium" },
  { label: "高 · High", value: "high" },
  { label: "超高 · XHigh", value: "xhigh" },
];

function StreamingPlaceholder() {
  return (
    <div className="flex items-center gap-3 py-1">

      <svg
        aria-hidden="true"
        className="h-3 w-12 text-muted-foreground/80"
        viewBox="0 0 48 12"
      >
        <circle cx="6" cy="6" fill="currentColor" r="4">
          <animate attributeName="opacity" begin="0s" dur="1.1s" repeatCount="indefinite" values="0.25;1;0.25" />
          <animate attributeName="r" begin="0s" dur="1.1s" repeatCount="indefinite" values="3.2;4.4;3.2" />
        </circle>
        <circle cx="24" cy="6" fill="currentColor" r="4">
          <animate attributeName="opacity" begin="0.18s" dur="1.1s" repeatCount="indefinite" values="0.25;1;0.25" />
          <animate attributeName="r" begin="0.18s" dur="1.1s" repeatCount="indefinite" values="3.2;4.4;3.2" />
        </circle>
        <circle cx="42" cy="6" fill="currentColor" r="4">
          <animate attributeName="opacity" begin="0.36s" dur="1.1s" repeatCount="indefinite" values="0.25;1;0.25" />
          <animate attributeName="r" begin="0.36s" dur="1.1s" repeatCount="indefinite" values="3.2;4.4;3.2" />
        </circle>
      </svg>
    </div>
  );
}

function TypingMessageResponse({
  isStreaming,
  text,
}: {
  isStreaming: boolean;
  text: string;
}) {
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (text.length < displayedText.length) {
      setDisplayedText(text);
      return;
    }

    if (text === displayedText) {
      return;
    }

    const remaining = text.slice(displayedText.length);
    const chunkSize = remaining.length > 24 ? 4 : remaining.length > 12 ? 3 : 2;
    const nextText = text.slice(0, displayedText.length + chunkSize);
    const timer = window.setTimeout(() => {
      setDisplayedText(nextText);
    }, 18);

    return () => window.clearTimeout(timer);
  }, [displayedText, text]);

  if (!text && isStreaming) {
    return <StreamingPlaceholder />;
  }

  return <MessageResponse>{displayedText || "空响应。"}</MessageResponse>;
}

export function ChatPage({
  activeSession,
  chatStatus,
  config,
  input,
  modelOptions,
  sessions,
  sidebarOpen,
  onConfigChange,
  onEditMessage,
  onInputChange,
  onLogoutToAuth,
  onNewChat,
  onRetryAssistantMessage,
  onSelectSession,
  onSendMessage,
  onSidebarOpenChange,
  onStopStreaming,
}: ChatPageProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const startEditing = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const submitEdit = async () => {
    if (!editingMessageId) {
      return;
    }
    await onEditMessage(editingMessageId, editingText);
    cancelEditing();
  };

  const copyAssistantMessage = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground md:flex">
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/25 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onSidebarOpenChange(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[86vw] max-w-[320px] border-r bg-card p-4 transition-transform md:sticky md:top-0 md:z-10 md:h-dvh md:w-72 md:max-w-none md:shrink-0 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-medium text-sm tracking-wide">AI Chat</h1>
          <Button className="md:hidden" onClick={() => onSidebarOpenChange(false)} size="icon-sm" variant="ghost">
            <XIcon />
          </Button>
        </div>

        <div className="flex">
          <Button className="w-full" onClick={onLogoutToAuth} size="sm" type="button" variant="outline">
            验证连接
          </Button>
        </div>

        <div className="mt-4">
          <Button className="w-full" onClick={onNewChat} type="button" variant="secondary">
            <PlusIcon />
            新会话
          </Button>
        </div>

        <div className="mt-4 flex max-h-[calc(100dvh-250px)] flex-col gap-2 overflow-y-auto pr-1">
          {sessions.map((session) => (
            <button
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                session.id === activeSession?.id ? "border-primary/35 bg-primary/10" : "border-border bg-background hover:bg-accent/70"
              )}
              key={session.id}
              onClick={() => {
                onSelectSession(session.id);
                onSidebarOpenChange(false);
              }}
              type="button"
            >
              <p className="truncate text-sm">{session.title}</p>
              <p className="mt-1 text-muted-foreground text-xs">
                {new Date(session.updatedAt).toLocaleString("zh-CN", { hour12: false })}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-background px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <Button className="md:hidden" onClick={() => onSidebarOpenChange(true)} size="icon-sm" variant="ghost">
              <MenuIcon />
            </Button>
            <div className="flex items-center gap-2">
              <BotIcon className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">{activeSession?.title || "新会话"}</span>
            </div>
          </div>
          <span className="text-muted-foreground text-xs">Light Mode</span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-5 px-3 py-4 sm:px-6">
              {activeSession && activeSession.messages.length > 0 ? (
                activeSession.messages.map((message: ChatMessage) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent className={message.status === "error" ? "text-destructive" : undefined}>
                      {editingMessageId === message.id ? (
                        <div className="flex min-w-[280px] flex-col gap-3">
                          <Textarea
                            className="min-h-24 resize-y bg-background"
                            onChange={(event) => setEditingText(event.currentTarget.value)}
                            value={editingText}
                          />
                          <div className="flex justify-end gap-2">
                            <Button onClick={cancelEditing} size="sm" type="button" variant="ghost">
                              取消
                            </Button>
                            <Button onClick={submitEdit} size="sm" type="button">
                              保存并重发
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.role === "assistant" && message.reasoningText ? (
                            <Reasoning
                              className="w-full"
                              isStreaming={message.status === "streaming"}
                            >
                              <ReasoningTrigger
                                getThinkingMessage={(isStreaming, duration) => {
                                  if (isStreaming || duration === 0) {
                                    return "思考中...";
                                  }
                                  if (duration === undefined) {
                                    return "查看思考过程";
                                  }
                                  return `思考了 ${duration} 秒`;
                                }}
                              />
                              <ReasoningContent>{message.reasoningText}</ReasoningContent>
                            </Reasoning>
                          ) : null}
                          {message.role === "assistant" ? (
                            <TypingMessageResponse
                              isStreaming={message.status === "streaming"}
                              text={message.text}
                            />
                          ) : (
                            <MessageResponse>{message.text}</MessageResponse>
                          )}
                        </>
                      )}
                    </MessageContent>
                    {editingMessageId !== message.id && message.status !== "streaming" && (
                      <MessageActions className={message.role === "user" ? "ml-auto" : undefined}>
                        {message.role === "user" ? (
                          <MessageAction
                            disabled={chatStatus === "streaming"}
                            label="编辑"
                            onClick={() => startEditing(message)}
                            tooltip="编辑并重发"
                          >
                            <PencilIcon />
                          </MessageAction>
                        ) : (
                          <>
                            <MessageAction
                              disabled={!message.text.trim()}
                              label="复制 Markdown"
                              onClick={() => copyAssistantMessage(message.text)}
                              tooltip="复制 Markdown"
                            >
                              <CopyIcon />
                            </MessageAction>
                            <MessageAction
                              disabled={chatStatus === "streaming"}
                              label="重试"
                              onClick={() => onRetryAssistantMessage(message.id)}
                              tooltip="从这里重试"
                            >
                              <RotateCcwIcon />
                            </MessageAction>
                          </>
                        )}
                      </MessageActions>
                    )}
                  </Message>
                ))
              ) : (
                <ConversationEmptyState
                  description="输入消息即可开始流式对话。"
                  icon={<MessageSquareIcon className="size-10" />}
                  title="开始新的对话"
                />
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="shrink-0 border-t bg-background px-3 py-3 sm:px-6">
            <div className="mx-auto w-full max-w-3xl">
              <PromptInput onSubmit={onSendMessage}>
                <PromptInputBody>
                  <PromptInputTextarea
                    onChange={(event) => onInputChange(event.currentTarget.value)}
                    placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                    value={input}
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputSelect
                      value={config.model || undefined}
                      onValueChange={(value) => onConfigChange({ ...config, model: value })}
                    >
                      <PromptInputSelectTrigger>
                        <PromptInputSelectValue placeholder="选择模型" />
                      </PromptInputSelectTrigger>
                      <PromptInputSelectContent>
                        {modelOptions.map((model) => (
                          <PromptInputSelectItem key={model} value={model}>
                            {model}
                          </PromptInputSelectItem>
                        ))}
                      </PromptInputSelectContent>
                    </PromptInputSelect>
                    <PromptInputSelect
                      value={config.reasoningEffort}
                      onValueChange={(value) =>
                        onConfigChange({ ...config, reasoningEffort: value as ReasoningEffort })
                      }
                    >
                      <PromptInputSelectTrigger>
                        <LightbulbIcon className="text-muted-foreground" />
                        <PromptInputSelectValue placeholder="思考强度" />
                      </PromptInputSelectTrigger>
                      <PromptInputSelectContent>
                        {reasoningOptions.map((option) => (
                          <PromptInputSelectItem key={option.value} value={option.value}>
                            {option.label}
                          </PromptInputSelectItem>
                        ))}
                      </PromptInputSelectContent>
                    </PromptInputSelect>
                    <span className="text-muted-foreground text-xs">
                      {chatStatus === "streaming" ? "流式输出中..." : "OpenAI Responses Stream"}
                    </span>
                  </PromptInputTools>
                  <PromptInputSubmit disabled={chatStatus !== "streaming" && !input.trim()} onStop={onStopStreaming} status={chatStatus} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
