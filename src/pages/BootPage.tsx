import { LoaderCircleIcon } from "lucide-react";

export function BootPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
        <LoaderCircleIcon className="size-4 animate-spin" />
        正在验证连接...
      </div>
    </div>
  );
}

