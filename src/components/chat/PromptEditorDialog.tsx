import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

interface PromptEditorDialogProps {
  description: string;
  includeGlobalPrompt?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: string, includeGlobalPrompt?: boolean) => void;
  open: boolean;
  showIncludeGlobalPromptOption: boolean;
  title: string;
  value: string;
}

export function PromptEditorDialog({
  description,
  includeGlobalPrompt = true,
  onOpenChange,
  onSave,
  open,
  showIncludeGlobalPromptOption,
  title,
  value,
}: PromptEditorDialogProps) {
  const [draft, setDraft] = useState(value);
  const [draftIncludeGlobalPrompt, setDraftIncludeGlobalPrompt] = useState(includeGlobalPrompt);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setDraftIncludeGlobalPrompt(includeGlobalPrompt);
    }
  }, [includeGlobalPrompt, open, value]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {showIncludeGlobalPromptOption ? (
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <span className="text-sm">附带全局提示词</span>
            <button
              aria-pressed={draftIncludeGlobalPrompt}
              className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-accent"
              onClick={() => setDraftIncludeGlobalPrompt((prev) => !prev)}
              type="button"
            >
              {draftIncludeGlobalPrompt ? "开启" : "关闭"}
            </button>
          </label>
        ) : null}

        <Textarea
          className="min-h-72 resize-y"
          onChange={(event) => setDraft(event.currentTarget.value)}
          placeholder="请输入提示词内容"
          value={draft}
        />

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button
            onClick={() => {
              onSave(draft, showIncludeGlobalPromptOption ? draftIncludeGlobalPrompt : undefined);
              onOpenChange(false);
            }}
            type="button"
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
