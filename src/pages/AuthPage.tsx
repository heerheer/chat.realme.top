import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ConnectionConfig } from "@/lib/chat-types";

interface AuthPageProps {
  config: ConnectionConfig;
  statusText: string;
  validating: boolean;
  onConfigChange: (next: ConnectionConfig) => void;
  onSubmit: () => void;
}

export function AuthPage({ config, statusText, validating, onConfigChange, onSubmit }: AuthPageProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xs">
        <h1 className="text-lg font-semibold">连接验证</h1>
        <p className="mt-1 text-muted-foreground text-sm">请输入可用的 API Key。</p>

        <div className="mt-4 flex flex-col gap-3">
          <Input
            disabled
            placeholder="OPENAI_BASE_URL"
            value={config.baseUrl}
            onChange={(event) => onConfigChange({ ...config, baseUrl: event.target.value })}
          />
          <Input
            placeholder="API Key"
            type="password"
            value={config.apiKey}
            onChange={(event) => onConfigChange({ ...config, apiKey: event.target.value })}
          />
          <Button disabled={validating} onClick={onSubmit} type="button">
            {validating ? "验证中..." : "验证并进入"}
          </Button>
        </div>

        <p className="mt-3 min-h-5 text-muted-foreground text-xs">{statusText}</p>
      </div>
    </div>
  );
}

