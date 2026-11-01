import { connection } from "next/server";
import {
  listModels,
  normalizeBaseUrl,
  presetFor,
  providers,
  readSettings,
  type ProviderId,
} from "@/lib/settings";

export async function POST(request: Request) {
  await connection();

  const saved = await readSettings();
  let body: { provider?: string; baseUrl?: string; apiKey?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* empty body: use saved settings */
  }

  const provider = (body.provider as ProviderId | undefined) ?? saved?.provider;
  if (!provider || !providers.some((p) => p.id === provider)) {
    return Response.json({ error: "Provider belum dipilih." }, { status: 400 });
  }

  const baseUrl = normalizeBaseUrl(body.baseUrl ?? saved?.baseUrl ?? presetFor(provider).baseUrl);
  if (!/^https?:\/\/[^\s]+$/i.test(baseUrl)) {
    return Response.json({ error: "Base URL belum valid." }, { status: 400 });
  }

  const apiKey = (body.apiKey ?? "").trim() || saved?.apiKey || "";
  if (apiKey.length < 8) {
    return Response.json({ error: "Isi API key dulu buat ambil daftar model." }, { status: 400 });
  }

  try {
    const models = await listModels({ provider, baseUrl, apiKey });
    return Response.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil daftar model.";
    return Response.json({ error: message }, { status: 502 });
  }
}
