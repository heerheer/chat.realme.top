import { MoreConfigDialog } from "@/components/chat/MoreConfigDialog";
import { PromptEditorDialog } from "@/components/chat/PromptEditorDialog";
import { Button } from "@/components/ui/button";
import { type ApiKeyStats, type ChatSession } from "@/lib/chat-types";
import { cn } from "@/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCheckIcon,
  Edit3Icon,
  EllipsisIcon,
  ShieldQuestionIcon,
  LightbulbIcon,
  Settings2Icon,
  PlusIcon,
  Trash2Icon,
  XCircleIcon,
  XIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
} from "lucide-react";
import { type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useState } from "react";

interface ChatSidebarProps {
  activeSession: ChatSession | null;
  apiKeyStats: ApiKeyStats | null;
  globalPrompt: string;
  onDeleteSession: (sessionId: string) => void;
  onLogoutToAuth: () => void;
  onNewChat: () => void;
  onSaveGlobalPrompt: (value: string) => void;
  onSaveSessionPrompt: (sessionId: string, value: string, includeGlobalPrompt: boolean) => void;
  onSelectSession: (sessionId: string) => void;
  onSidebarOpenChange: (open: boolean) => void;
  sessions: ChatSession[];
  sidebarOpen: boolean;
}

const formatCount = (value: number) => new Intl.NumberFormat("zh-CN").format(value);

function StatsCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-linear-to-br p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex gap-0.5 text-[11px] text-muted-foreground">
            {label}
            {icon}
          </p>
          <p className="mt-1 truncate text-base font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function ChatSidebar({
  activeSession,
  apiKeyStats,
  globalPrompt,
  onDeleteSession,
  onLogoutToAuth,
  onNewChat,
  onSaveGlobalPrompt,
  onSaveSessionPrompt,
  onSelectSession,
  onSidebarOpenChange,
  sessions,
  sidebarOpen,
}: ChatSidebarProps) {
  const totalTokens = (apiKeyStats?.inputToken ?? 0) + (apiKeyStats?.outputToken ?? 0);
  const [globalPromptOpen, setGlobalPromptOpen] = useState(false);
  const [moreConfigOpen, setMoreConfigOpen] = useState(false);
  const [sessionPromptOpen, setSessionPromptOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{
    sessionId: string;
    x: number;
    y: number;
  } | null>(null);

  const editingSession = sessions.find((session) => session.id === editingSessionId) || null;

  useEffect(() => {
    if (!menuState) {
      return;
    }

    const closeMenu = () => setMenuState(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [menuState]);

  const openSessionMenu = (event: ReactMouseEvent<HTMLButtonElement>, sessionId: string) => {
    event.preventDefault();
    setMenuState({
      sessionId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-[86vw] max-w-[320px] border-r bg-card p-4 transition-all duration-300 md:sticky md:top-0 md:z-10 md:h-dvh md:w-72 md:max-w-none md:shrink-0",
        sidebarOpen ? "translate-x-0 md:ml-0" : "-translate-x-full md:-ml-72"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-sm font-medium tracking-wide">小赫的AI Chat</h1>
        <Button onClick={() => onSidebarOpenChange(false)} size="icon-sm" variant="ghost" title="收起边栏">
          <PanelLeftCloseIcon className="size-[18px] text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </div>

      <div className="flex">
        <Button className="w-full" onClick={onLogoutToAuth} size="sm" type="button" variant="outline">
          <ShieldQuestionIcon className="size-4" />验证API连接
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button className="w-full" onClick={() => setGlobalPromptOpen(true)} size="sm" type="button" variant="outline">
          <LightbulbIcon className="size-4" />全局提示词
        </Button>
        <Button className="w-full" onClick={() => setMoreConfigOpen(true)} size="icon-sm" type="button" variant="outline">
          <Settings2Icon />设置
        </Button>
      </div>

      <div className="mt-4">
        <Button className="w-full" onClick={onNewChat} type="button" variant="secondary">
          <PlusIcon />
          新会话
        </Button>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          <StatsCard
            icon={<CheckCheckIcon className="size-4" />}
            label="成功请求"
            value={formatCount(apiKeyStats?.requestSuccess ?? 0)}
          />
          <StatsCard
            icon={<XCircleIcon className="size-4" />}
            label="失败请求"
            value={formatCount(apiKeyStats?.requestFailed ?? 0)}
          />
          <StatsCard
            icon={<ArrowDownIcon className="size-4" />}
            label="输入 Tokens"
            value={formatCount(apiKeyStats?.inputToken ?? 0)}
          />
          <StatsCard
            icon={<ArrowUpIcon className="size-4" />}
            label="输出 Tokens"
            value={formatCount(apiKeyStats?.outputToken ?? 0)}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">累计消耗 Tokens：{formatCount(totalTokens)}</p>
      </div>

      <div className="mt-4 flex max-h-[calc(100dvh-500px)] flex-col gap-2 overflow-y-auto pr-1">
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
            onContextMenu={(event) => openSessionMenu(event, session.id)}
            type="button"
          >
            <p className="truncate text-sm">{session.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(session.updatedAt).toLocaleString("zh-CN", { hour12: false })}
            </p>
          </button>
        ))}
      </div>

      {menuState ? (
        <div
          className="fixed z-50 min-w-40 rounded-xl border border-border bg-popover p-1 shadow-lg"
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
          style={{
            left: Math.min(menuState.x, window.innerWidth - 176),
            top: Math.min(menuState.y, window.innerHeight - 100),
          }}
        >
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            onClick={() => {
              if (!menuState) {
                return;
              }
              setEditingSessionId(menuState.sessionId);
              setSessionPromptOpen(true);
              setMenuState(null);
            }}
            type="button"
          >
            <Edit3Icon className="size-4" />
            编辑会话提示词
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              onDeleteSession(menuState.sessionId);
              setMenuState(null);
            }}
            type="button"
          >
            <Trash2Icon className="size-4" />
            删除会话
          </button>
        </div>
      ) : null}

      <PromptEditorDialog
        description="该提示词会作为每个会话的默认系统提示词。"
        onOpenChange={setGlobalPromptOpen}
        onSave={(value) => onSaveGlobalPrompt(value)}
        open={globalPromptOpen}
        showIncludeGlobalPromptOption={false}
        title="全局提示词"
        value={globalPrompt}
      />

      <PromptEditorDialog
        description="该提示词仅作用于当前会话。"
        includeGlobalPrompt={editingSession?.includeGlobalPrompt ?? true}
        onOpenChange={(open) => {
          setSessionPromptOpen(open);
          if (!open) {
            setEditingSessionId(null);
          }
        }}
        onSave={(value, includeGlobalPrompt) => {
          if (!editingSession) {
            return;
          }
          onSaveSessionPrompt(editingSession.id, value, includeGlobalPrompt ?? true);
          setEditingSessionId(null);
        }}
        open={sessionPromptOpen}
        showIncludeGlobalPromptOption
        title="会话提示词"
        value={editingSession?.sessionPrompt || ""}
      />

      <MoreConfigDialog onOpenChange={setMoreConfigOpen} open={moreConfigOpen} />
    </aside>
  );
}
