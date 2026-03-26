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
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { TypingMessageResponse } from "@/components/chat/TypingMessageResponse";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatStatus } from "ai";
import {
  BotIcon,
  CopyIcon,
  LightbulbIcon,
  MenuIcon,
  MessageSquareIcon,
  PencilIcon,
  RotateCcwIcon,
} from "lucide-react";
import { type ApiKeyStats, type ChatMessage, type ChatSession, type ConnectionConfig, type ReasoningEffort } from "@/lib/chat-types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChatPageProps {
  activeSession: ChatSession | null;
  apiKeyStats: ApiKeyStats | null;
  chatStatus: ChatStatus;
  config: ConnectionConfig;
  globalPrompt: string;
  input: string;
  modelOptions: string[];
  sessions: ChatSession[];
  sidebarOpen: boolean;
  onConfigChange: (next: ConnectionConfig) => void;
  onInputChange: (value: string) => void;
  onEditMessage: (messageId: string, text: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => void;
  onLogoutToAuth: () => void;
  onNewChat: () => void;
  onSaveGlobalPrompt: (value: string) => void;
  onSaveSessionPrompt: (sessionId: string, value: string, includeGlobalPrompt: boolean) => void;
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

export function ChatPage({
  activeSession,
  apiKeyStats,
  chatStatus,
  config,
  globalPrompt,
  input,
  modelOptions,
  sessions,
  sidebarOpen,
  onConfigChange,
  onDeleteSession,
  onEditMessage,
  onInputChange,
  onLogoutToAuth,
  onNewChat,
  onSaveGlobalPrompt,
  onSaveSessionPrompt,
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

      <ChatSidebar
        activeSession={activeSession}
        apiKeyStats={apiKeyStats}
        globalPrompt={globalPrompt}
        onDeleteSession={onDeleteSession}
        onLogoutToAuth={onLogoutToAuth}
        onNewChat={onNewChat}
        onSaveGlobalPrompt={onSaveGlobalPrompt}
        onSaveSessionPrompt={onSaveSessionPrompt}
        onSelectSession={onSelectSession}
        onSidebarOpenChange={onSidebarOpenChange}
        sessions={sessions}
        sidebarOpen={sidebarOpen}
      />

      <main className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-background px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <Button className="md:hidden" onClick={() => onSidebarOpenChange(true)} size="icon-sm" variant="ghost">
              <MenuIcon />
            </Button>
            <div className="flex items-center gap-2">
              <BotIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{activeSession?.title || "新会话"}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Light Mode</span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-5 px-3 py-4 sm:px-6">
              {activeSession && activeSession.messages.length > 0 ? (
                activeSession.messages.map((message: ChatMessage) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent className={message.status === "error" ? "text-destructive" : undefined}>
                      {editingMessageId === message.id ? (
                        <div className="flex min-w-70 flex-col gap-3">
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
                            <Reasoning className="w-full" isStreaming={message.status === "streaming"}>
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
                    <span className="text-xs text-muted-foreground">
                      {chatStatus === "streaming" ? "流式输出中..." : "OpenAI Responses Stream"}
                    </span>
                  </PromptInputTools>
                  <PromptInputSubmit
                    disabled={chatStatus !== "streaming" && !input.trim()}
                    onStop={onStopStreaming}
                    status={chatStatus}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
