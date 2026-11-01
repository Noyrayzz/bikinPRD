import { connection, NextResponse } from "next/server";
import {
  normalizeBaseUrl,
  presetFor,
  providers,
  readSettings,
  toPublic,
  writeSettings,
  type ProviderId,
  type StoredSettings,
} from "@/lib/settings";


export async function GET() {
  await connection();
  return NextResponse.json(toPublic(await readSettings()));
}

type Payload = {
  provider?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

export async function PUT(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Body bukan JSON." }, { status: 400 });
  }

  const provider = payload.provider as ProviderId | undefined;
  if (!provider || !providers.some((p) => p.id === provider)) {
    return NextResponse.json({ error: "Provider tidak dikenal." }, { status: 400 });
  }

  const baseUrl = normalizeBaseUrl(payload.baseUrl ?? presetFor(provider).baseUrl);
  if (!/^https?:\/\/[^\s]+$/i.test(baseUrl)) {
    return NextResponse.json(
      { error: "Base URL harus diawali http:// atau https://." },
      { status: 400 },
    );
  }

  const previous = await readSettings();
  const apiKey = (payload.apiKey ?? "").trim() || previous?.apiKey || "";
  if (apiKey.length < 8) {
    return NextResponse.json({ error: "API key kelihatan terlalu pendek." }, { status: 400 });
  }

  const model = (payload.model ?? "").trim() || presetFor(provider).defaultModel;
  if (!model) {
    return NextResponse.json({ error: "Nama model wajib diisi." }, { status: 400 });
  }

  const settings: StoredSettings = {
    provider,
    baseUrl,
    apiKey,
    model,
    updatedAt: new Date().toISOString(),
  };

  try {
    await writeSettings(settings);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Gagal menulis .local/settings.json: ${
          error instanceof Error ? error.message : "unknown"
        }`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(toPublic(settings));
}
