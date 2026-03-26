import { MessageResponse } from "@/components/ai-elements/message";
import { useEffect, useState } from "react";

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

interface TypingMessageResponseProps {
  isStreaming: boolean;
  text: string;
}

export function TypingMessageResponse({ isStreaming, text }: TypingMessageResponseProps) {
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
