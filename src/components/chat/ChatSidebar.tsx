import { Button } from "@/components/ui/button";
import { type ApiKeyStats, type ChatSession } from "@/lib/chat-types";
import { cn } from "@/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCheckIcon,
  Trash2Icon,
  PlusIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useState } from "react";

interface ChatSidebarProps {
  activeSession: ChatSession | null;
  apiKeyStats: ApiKeyStats | null;
  onLogoutToAuth: () => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
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
  onLogoutToAuth,
  onNewChat,
  onDeleteSession,
  onSelectSession,
  onSidebarOpenChange,
  sessions,
  sidebarOpen,
}: ChatSidebarProps) {
  const totalTokens = (apiKeyStats?.inputToken ?? 0) + (apiKeyStats?.outputToken ?? 0);
  const [menuState, setMenuState] = useState<{
    sessionId: string;
    x: number;
    y: number;
  } | null>(null);

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
        "fixed flex flex-col inset-y-0 left-0 z-40 w-[86vw] max-w-[320px] border-r bg-card p-4 transition-transform md:sticky md:top-0 md:z-10 md:h-screen md:w-72 md:max-w-none md:shrink-0 md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-sm font-medium tracking-wide">小赫的AI Chat</h1>
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

      <div className="mt-4 flex  flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
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
          className="fixed z-50 min-w-36 rounded-xl border border-border bg-popover p-1 shadow-lg"
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
          style={{
            left: Math.min(menuState.x, window.innerWidth - 168),
            top: Math.min(menuState.y, window.innerHeight - 56),
          }}
        >
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
    </aside>
  );
}
