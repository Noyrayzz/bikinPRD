import { NextResponse } from "next/server";
import {
  normalizeBaseUrl,
  presetFor,
  providers,
  readSettings,
  testProvider,
  type ProviderId,
} from "@/lib/settings";


/**
 * Only checks the connection — nothing is persisted here. The form sends the
 * values it currently shows, so "Tes koneksi" works before saving.
 */
export async function POST(request: Request) {
  const saved = await readSettings();
  let payload: { provider?: string; baseUrl?: string; apiKey?: string; model?: string } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    /* empty body is fine: fall back to what is saved */
  }

  const provider = (payload.provider as ProviderId | undefined) ?? saved?.provider;
  if (!provider || !providers.some((p) => p.id === provider)) {
    return NextResponse.json({ error: "Provider belum dipilih." }, { status: 400 });
  }

  const baseUrl = normalizeBaseUrl(payload.baseUrl ?? saved?.baseUrl ?? "");
  if (!/^https?:\/\/[^\s]+$/i.test(baseUrl)) {
    return NextResponse.json({ error: "Base URL belum valid." }, { status: 400 });
  }

  const apiKey = (payload.apiKey ?? "").trim() || saved?.apiKey || "";
  if (apiKey.length < 8) {
    return NextResponse.json({ error: "API key belum diisi." }, { status: 400 });
  }

  const model = (payload.model ?? "").trim() || saved?.model || presetFor(provider).defaultModel;
  const result = await testProvider({ provider, baseUrl, apiKey, model });
  return NextResponse.json(result);
}
