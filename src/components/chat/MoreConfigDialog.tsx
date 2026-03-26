import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MoreConfigDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function MoreConfigDialog({ onOpenChange, open }: MoreConfigDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>更多配置</DialogTitle>
        </DialogHeader>
        <div className="grid min-h-[380px] grid-cols-[190px_1fr]">
          <aside className="border-r bg-muted/40 px-3 py-4">
            <button
              className="w-full rounded-md bg-background px-3 py-2 text-left text-sm font-medium shadow-xs"
              type="button"
            >
              关于
            </button>
          </aside>
          <section className="space-y-4 px-6 py-5">
            <h3 className="text-base font-semibold">项目</h3>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="text-sm">RealMe Chat UI</p>
              <p className="text-sm text-muted-foreground">
                基于 OpenAI 兼容接口的多会话聊天客户端，支持流式响应、会话管理和提示词配置。
              </p>
            </div>
            <div className="space-y-2 rounded-xl border p-4">
              <p className="text-sm">技术栈</p>
              <p className="text-sm text-muted-foreground">Bun + React + Tailwind + shadcn/ui</p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
