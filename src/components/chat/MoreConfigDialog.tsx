import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface MoreConfigDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function MoreConfigDialog({ onOpenChange, open }: MoreConfigDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl transition-all duration-300">
        <DialogTitle className="sr-only">更多配置</DialogTitle>
        <div className="flex flex-col md:flex-row min-h-[500px] bg-background">
          {/* Left Sidebar */}
          <aside className="w-full md:w-[240px] bg-muted/30 p-4 shrink-0 flex flex-col gap-2 border-r border-border/50">
            <div className="px-4 py-4 mb-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground/90">更多配置</h2>
            </div>
            <button
              className="w-full rounded-2xl bg-background shadow-xs ring-1 ring-border/50 transition-all duration-300 px-4 py-3.5 text-left text-sm font-medium flex items-center justify-between group"
              type="button"
            >
              <span className="text-foreground">关于</span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/80 opacity-100 transition-opacity" />
            </button>
            <button
              className="w-full rounded-2xl hover:bg-muted/60 transition-all duration-300 px-4 py-3.5 text-left text-sm font-medium text-muted-foreground group"
              type="button"
            >
              <span className="transition-transform duration-300 group-hover:translate-x-0.5 inline-block">常规设置</span>
            </button>
            <button
              className="w-full rounded-2xl hover:bg-muted/60 transition-all duration-300 px-4 py-3.5 text-left text-sm font-medium text-muted-foreground group"
              type="button"
            >
              <span className="transition-transform duration-300 group-hover:translate-x-0.5 inline-block">模型参数</span>
            </button>
          </aside>

          {/* Right Content */}
          <section className="flex-1 p-8 sm:p-10 bg-background flex flex-col overflow-y-auto">
            <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
              <h3 className="text-2xl font-semibold tracking-tight mb-8 text-foreground/90">关于项目</h3>

              <div className="space-y-6">
                <div className="group rounded-3xl bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all duration-500 p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner">
                      <span className="text-2xl drop-shadow-sm">✨</span>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-foreground">RealMe Chat UI</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">VERSION 1.0.0</p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                    基于 OpenAI 兼容接口的多会话聊天客户端，致力于简单、流畅、高效的智能交互体验。现已支持流式响应、会话管理和灵活的提示词配置。
                  </p>
                </div>

                <div className="group rounded-3xl bg-muted/30 hover:bg-muted/50 border border-border/40 hover:border-border/80 transition-all duration-500 p-6 sm:p-8">
                  <h4 className="text-sm font-semibold text-foreground mb-4">核心技术栈</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {['Bun', 'React', 'Tailwind CSS', 'shadcn/ui', 'Zustand'].map((tech) => (
                      <span
                        key={tech}
                        className="px-4 py-1.5 bg-background hover:bg-primary/5 border border-border/60 hover:border-primary/20 hover:text-primary transition-colors cursor-default rounded-full text-xs font-semibold text-muted-foreground shadow-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
