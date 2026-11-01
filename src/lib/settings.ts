import { promises as fs } from "node:fs";
import path from "node:path";

export type ProviderId = "griphub" | "openai" | "openrouter" | "anthropic" | "custom";

export type ProviderPreset = {
  id: ProviderId;
  label: string;
  baseUrl: string;
  apiStyle: "openai" | "anthropic";
  defaultModel: string;
  hint?: string;
};

export const providers: ProviderPreset[] = [
  {
    id: "griphub",
    label: "Griphub (OpenAI-compatible)",
    baseUrl: "https://griphubrouter.web.id/v1",
    apiStyle: "openai",
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiStyle: "openai",
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiStyle: "openai",
    defaultModel: "openai/gpt-4o-mini",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    apiStyle: "anthropic",
    defaultModel: "claude-sonnet-4-5",
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    baseUrl: "",
    apiStyle: "openai",
    defaultModel: "",
    hint: "Isi base URL endpoint yang menerima /chat/completions.",
  },
];

export type StoredSettings = {
  provider: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
  updatedAt: string;
};

export type PublicSettings = {
  configured: boolean;
  provider: ProviderId | null;
  baseUrl: string | null;
  model: string | null;
  keyPreview: string | null;
  updatedAt: string | null;
};

const DIR = path.join(process.cwd(), ".local");
const FILE = path.join(DIR, "settings.json");

export function maskKey(key: string): string {
  if (key.length <= 4) return "••••";
  return `••••••••${key.slice(-4)}`;
}

export async function readSettings(): Promise<StoredSettings | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredSettings;
    if (!parsed?.apiKey || !parsed.baseUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeSettings(settings: StoredSettings): Promise<void> {
  await fs.mkdir(DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(FILE, `${JSON.stringify(settings, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
}

export function toPublic(settings: StoredSettings | null): PublicSettings {
  if (!settings) {
    return {
      configured: false,
      provider: null,
      baseUrl: null,
      model: null,
      keyPreview: null,
      updatedAt: null,
    };
  }
  return {
    configured: true,
    provider: settings.provider,
    baseUrl: settings.baseUrl,
    model: settings.model,
    keyPreview: maskKey(settings.apiKey),
    updatedAt: settings.updatedAt,
  };
}

export function presetFor(id: ProviderId): ProviderPreset {
  return providers.find((p) => p.id === id) ?? providers[providers.length - 1];
}

/** Trims a trailing slash so `${baseUrl}/models` never doubles up. */
export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export type TestResult = { ok: boolean; message: string; status?: number };

/** Fetches the provider's own model list so the UI can offer a dropdown. */
export async function listModels(settings: {
  provider: ProviderId;
  baseUrl: string;
  apiKey: string;
}): Promise<string[]> {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const apiStyle = presetFor(settings.provider).apiStyle;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers:
        apiStyle === "anthropic"
          ? { "x-api-key": settings.apiKey, "anthropic-version": "2023-06-01" }
          : { authorization: `Bearer ${settings.apiKey}` },
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(explainStatus(res.status, text));
    }

    const payload = (await res.json()) as {
      data?: { id?: string; name?: string }[];
      models?: { id?: string; name?: string }[];
    };
    const rows = payload.data ?? payload.models ?? [];
    const ids = rows
      .map((row) => row.id ?? row.name ?? "")
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Minimal real call to the provider: the model list when the endpoint supports
 * it, otherwise one tiny chat completion. Nothing is written here.
 */
export async function testProvider(settings: {
  provider: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
}): Promise<TestResult> {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const apiStyle = presetFor(settings.provider).apiStyle;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    if (apiStyle === "anthropic") {
      const res = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": settings.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: settings.model || presetFor(settings.provider).defaultModel,
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, status: res.status, message: explainStatus(res.status, body) };
      }
      return { ok: true, status: res.status, message: "Key diterima Anthropic." };
    }

    const listRes = await fetch(`${baseUrl}/models`, {
      headers: { authorization: `Bearer ${settings.apiKey}` },
      signal: controller.signal,
    });
    if (listRes.ok) {
      return { ok: true, status: listRes.status, message: "Key valid, daftar model terbaca." };
    }

    const chatRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || presetFor(settings.provider).defaultModel,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: controller.signal,
    });

    if (chatRes.ok) {
      return { ok: true, status: chatRes.status, message: "Key valid, model bisa dipanggil." };
    }

    const body = await chatRes.text();
    return { ok: false, status: chatRes.status, message: explainStatus(chatRes.status, body) };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Timeout 20 detik — endpoint tidak menjawab."
        : `Tidak bisa menghubungi endpoint: ${error instanceof Error ? error.message : "unknown"}`;
    return { ok: false, message };
  } finally {
    clearTimeout(timeout);
  }
}

function brief(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  return trimmed.length > 220 ? `${trimmed.slice(0, 220)}…` : trimmed;
}

/** Turns an HTTP status into a sentence a human can act on, keeping the provider's own words. */
function explainStatus(status: number, body: string): string {
  const detail = brief(providerMessage(body));
  const suffix = detail ? ` — ${detail}` : "";
  if (status === 401 || status === 403) return `Key ditolak (HTTP ${status}). Cek lagi key-nya${suffix}`;
  if (status === 404) return `Endpoint tidak ketemu (404). Cek base URL-nya${suffix}`;
  if (status === 429) return `Kena rate limit (429). Tunggu sebentar lalu tes lagi${suffix}`;
  if (status >= 500) return `Provider sedang error (HTTP ${status}). Coba lagi nanti${suffix}`;
  return `Ditolak provider (HTTP ${status})${suffix}`;
}

/** Providers disagree on the shape: {error:{message}} / {error:"..."} / {message:"..."}. */
function providerMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
    if (parsed.message) return parsed.message;
  } catch {
    /* plain text body */
  }
  return body;
}
