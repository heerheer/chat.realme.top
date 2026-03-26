import type { ApiKeyStats, ChatMessage, ConnectionConfig } from "@/lib/chat-types";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, "");

const buildStatsUrl = (baseUrl: string) => {
  const normalized = normalizeBaseUrl(baseUrl);

  if (/\/api\/v\d+$/i.test(normalized)) {
    return `${normalized}/apikey/stats`;
  }

  if (/\/v\d+$/i.test(normalized)) {
    return `${normalized.replace(/\/v\d+$/i, "")}/api/v1/apikey/stats`;
  }

  return `${normalized}/api/v1/apikey/stats`;
};

const toReadableError = (status: number, details: string) => {
  if (status === 401 || status === 403) {
    return `认证失败（${status}）。请检查 API Key。${details}`;
  }
  if (status >= 500) {
    return `服务端错误（${status}）。请稍后再试。${details}`;
  }
  return `请求失败（${status}）。${details}`;
};

const parseErrorDetails = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { error?: { message?: string }; message?: string };
    const message = data.error?.message || data.message;
    return message ? `原因：${message}` : "";
  } catch {
    return "";
  }
};

const buildHeaders = (config: ConnectionConfig): HeadersInit => ({
  Authorization: `Bearer ${config.apiKey.trim()}`,
  "Content-Type": "application/json",
});

export const fetchModels = async (config: ConnectionConfig): Promise<string[]> => {
  const url = `${normalizeBaseUrl(config.baseUrl)}/models`;
  const response = await fetch(url, {
    headers: buildHeaders(config),
    method: "GET",
  });

  if (!response.ok) {
    const details = await parseErrorDetails(response);
    throw new Error(toReadableError(response.status, details));
  }

  const json = (await response.json()) as { data?: Array<{ id?: string }> };
  const ids = (json.data || [])
    .map((model) => model.id)
    .filter((id): id is string => Boolean(id))
    .sort((a, b) => a.localeCompare(b));

  if (ids.length === 0) {
    throw new Error("模型列表为空，请确认 OPENAI_BASE_URL 是否为兼容 OpenAI 的 /v1 服务。");
  }

  return ids;
};

export const fetchApiKeyStats = async (config: ConnectionConfig): Promise<ApiKeyStats> => {
  const response = await fetch(buildStatsUrl(config.baseUrl), {
    headers: buildHeaders(config),
    method: "GET",
  });

  if (!response.ok) {
    const details = await parseErrorDetails(response);
    throw new Error(toReadableError(response.status, details));
  }

  const json = (await response.json()) as {
    data?: {
      stats?: {
        input_token?: number;
        output_token?: number;
        request_success?: number;
        request_failed?: number;
      };
    };
  };

  const stats = json.data?.stats;

  return {
    inputToken: stats?.input_token ?? 0,
    outputToken: stats?.output_token ?? 0,
    requestFailed: stats?.request_failed ?? 0,
    requestSuccess: stats?.request_success ?? 0,
  };
};

const extractCompletedText = (event: unknown): string => {
  const maybeEvent = event as {
    response?: {
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };
  };

  const chunks: string[] = [];
  for (const item of maybeEvent.response?.output || []) {
    for (const part of item.content || []) {
      if ((part.type === "output_text" || part.type === "text") && part.text) {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("");
};

const toResponseInput = (messages: ChatMessage[]) =>
  messages.map((message) => ({
    content: [
      {
        text: message.text,
        type: message.role === "assistant" ? "output_text" : "input_text",
      },
    ],
    role: message.role,
  }));

interface StreamOptions {
  config: ConnectionConfig;
  messages: ChatMessage[];
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
  onReasoningDelta?: (reasoningText: string) => void;
}

const extractCompletedReasoning = (event: unknown): string => {
  const maybeEvent = event as {
    response?: {
      output?: Array<{
        content?: Array<{
          summary?: Array<{ text?: string; type?: string }>;
          content?: Array<{ text?: string; type?: string }>;
          text?: string;
          type?: string;
        }>;
      }>;
    };
  };

  const chunks: string[] = [];
  for (const item of maybeEvent.response?.output || []) {
    for (const part of item.content || []) {
      if (part.type === "reasoning") {
        for (const summary of part.summary || []) {
          if (summary.type === "summary_text" && summary.text) {
            chunks.push(summary.text);
          }
        }
        for (const content of part.content || []) {
          if (content.type === "reasoning_text" && content.text) {
            chunks.push(content.text);
          }
        }
      }
    }
  }
  return chunks.join("\n\n");
};

export const streamResponse = async ({ config, messages, signal, onDelta, onReasoningDelta }: StreamOptions) => {
  const response = await fetch(`${normalizeBaseUrl(config.baseUrl)}/responses`, {
    body: JSON.stringify({
      input: toResponseInput(messages),
      model: config.model,
      reasoning: {
        effort: config.reasoningEffort,
      },
      stream: true,
    }),
    headers: buildHeaders(config),
    method: "POST",
    signal,
  });

  if (!response.ok) {
    const details = await parseErrorDetails(response);
    throw new Error(toReadableError(response.status, details));
  }

  if (!response.body) {
    throw new Error("响应未返回可读取的流。");
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffered = "";
  let streamed = "";
  const reasoningParts = new Map<string, string>();

  const emitReasoning = () => {
    const reasoningText = [...reasoningParts.values()].filter(Boolean).join("\n\n").trim();
    if (reasoningText && onReasoningDelta) {
      onReasoningDelta(reasoningText);
    }
  };

  const handleEventBlock = (block: string) => {
    const lines = block
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean);

    const dataLines = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
    if (dataLines.length === 0) {
      return;
    }

    const payload = dataLines.join("\n");
    if (payload === "[DONE]") {
      return;
    }

    let parsed: {
      content_index?: number;
      type?: string;
      delta?: string;
      error?: { message?: string };
      part?: { text?: string; type?: string };
      summary_index?: number;
      text?: string;
      message?: string;
      output_index?: number;
    };

    try {
      parsed = JSON.parse(payload) as {
        type?: string;
        delta?: string;
        error?: { message?: string };
        message?: string;
      };
    } catch {
      return;
    }

    if (parsed.type === "response.output_text.delta" && typeof parsed.delta === "string") {
      streamed += parsed.delta;
      onDelta(parsed.delta);
      return;
    }

    if (
      (parsed.type === "response.reasoning_text.delta" ||
        parsed.type === "response.reasoning_summary_text.delta") &&
      typeof parsed.delta === "string"
    ) {
      const key = `${parsed.type}:${parsed.output_index ?? 0}:${parsed.summary_index ?? parsed.content_index ?? 0}`;
      reasoningParts.set(key, `${reasoningParts.get(key) || ""}${parsed.delta}`);
      emitReasoning();
      return;
    }

    if (
      (parsed.type === "response.reasoning_text.done" ||
        parsed.type === "response.reasoning_summary_text.done") &&
      typeof parsed.text === "string"
    ) {
      const key = `${parsed.type.replace(".done", ".delta")}:${parsed.output_index ?? 0}:${parsed.summary_index ?? parsed.content_index ?? 0}`;
      reasoningParts.set(key, parsed.text);
      emitReasoning();
      return;
    }

    if (
      (parsed.type === "response.reasoning_summary_part.done" ||
        parsed.type === "response.reasoning_summary_part.added") &&
      parsed.part?.text
    ) {
      const key = `response.reasoning_summary_text.delta:${parsed.output_index ?? 0}:${parsed.summary_index ?? parsed.content_index ?? 0}`;
      reasoningParts.set(key, parsed.part.text);
      emitReasoning();
      return;
    }

    if (parsed.type?.includes("error")) {
      throw new Error(parsed.error?.message || parsed.message || "流式响应出现错误。");
    }

    if (parsed.type === "response.completed") {
      if (streamed.length === 0) {
        const completedText = extractCompletedText(parsed);
        if (completedText) {
          streamed += completedText;
          onDelta(completedText);
        }
      }
      if (reasoningParts.size === 0) {
        const completedReasoning = extractCompletedReasoning(parsed);
        if (completedReasoning) {
          reasoningParts.set("response.completed", completedReasoning);
          emitReasoning();
        }
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffered += decoder.decode(value, { stream: true });
    let sepIndex = buffered.indexOf("\n\n");
    while (sepIndex !== -1) {
      const block = buffered.slice(0, sepIndex);
      buffered = buffered.slice(sepIndex + 2);
      if (block.trim()) {
        handleEventBlock(block);
      }
      sepIndex = buffered.indexOf("\n\n");
    }
  }

  if (buffered.trim()) {
    handleEventBlock(buffered);
  }
};
