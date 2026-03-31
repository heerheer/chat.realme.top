import { LoaderCircleIcon } from "lucide-react";

export function BootPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-700 ease-out">
        <div className="h-16 w-16 rounded-3xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          <LoaderCircleIcon className="size-8 text-primary/80 animate-spin relative z-10" />
        </div>
        <div className="text-sm font-medium text-muted-foreground/80 tracking-wide flex items-center gap-1">
          正在验证连接状态<span className="animate-pulse">...</span>
        </div>
      </div>
    </div>
  );
}

