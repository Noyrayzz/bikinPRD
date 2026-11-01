import { normalizeBaseUrl, presetFor, type StoredSettings } from "@/lib/settings";

export type ClarifyQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type ClarifyInput = {
  idea: string;
  productType?: string;
  techStack?: string;
  aiCodingTool?: string;
};

const SYSTEM = `Kamu asisten Product Manager. Tugasmu membuat pertanyaan klarifikasi
sebelum PRD ditulis, supaya PRD-nya tidak berisi asumsi ngawur.

Aturan:
1. Buat 3 sampai 6 pertanyaan. Hanya tanyakan hal yang KRITIS dan belum dijelaskan di ide:
   pengguna utama, alur inti, monetisasi, auth, data sensitif, platform, skala, integrasi.
2. Jangan menanyakan hal teknis yang sudah dijawab di preferensi teknologi.
3. Setiap pertanyaan punya 2 sampai 4 pilihan jawaban singkat (maks 6 kata), plus user
   tetap bisa menjawab bebas.
4. Bahasa Indonesia, kalimat pendek, tanpa nomor di dalam teks pertanyaan.
5. Balas HANYA JSON valid, tanpa penjelasan, tanpa blok kode:
{"questions":[{"id":"q1","question":"...","options":["...","..."]}]}`;

type StreamSettings = Pick<StoredSettings, "provider" | "baseUrl" | "apiKey" | "model">;

export async function askClarifications(
  settings: StreamSettings,
  input: ClarifyInput,
): Promise<ClarifyQuestion[]> {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const apiStyle = presetFor(settings.provider).apiStyle;

  const brief = JSON.stringify(
    {
      idea: input.idea,
      product_type: input.productType ?? "other",
      tech_stack: input.techStack ?? "biarkan AI memilih",
      ai_coding_tool: input.aiCodingTool ?? "generic",
    },
    null,
    2,
  );

  const user = `<brief>\n${brief}\n</brief>\n\nBuat pertanyaan klarifikasinya sekarang.`;

  const res =
    apiStyle === "anthropic"
      ? await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": settings.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: settings.model,
            max_tokens: 1200,
            system: SYSTEM,
            messages: [{ role: "user", content: user }],
          }),
        })
      : await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: settings.model,
            max_tokens: 1200,
            temperature: 0.3,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: user },
            ],
          }),
        });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Provider menolak (HTTP ${res.status})${text ? `: ${text.slice(0, 160)}` : ""}`,
    );
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    content?: { type: string; text?: string }[];
  };

  const raw =
    apiStyle === "anthropic"
      ? (payload.content ?? [])
          .filter((part) => part.type === "text")
          .map((part) => part.text ?? "")
          .join("")
      : (payload.choices?.[0]?.message?.content ?? "");

  return parseQuestions(raw);
}

/** Tolerates code fences and stray prose around the JSON object. */
function parseQuestions(raw: string): ClarifyQuestion[] {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Provider tidak mengembalikan JSON.");

  let parsed: { questions?: unknown };
  try {
    parsed = JSON.parse(raw.slice(start, end + 1)) as { questions?: unknown };
  } catch {
    throw new Error("JSON dari provider tidak bisa dibaca.");
  }

  const list = Array.isArray(parsed.questions) ? parsed.questions : [];
  const questions = list
    .map((item, index) => {
      const q = item as { id?: string; question?: string; options?: unknown };
      const options = Array.isArray(q.options)
        ? q.options.filter((o): o is string => typeof o === "string").slice(0, 4)
        : [];
      return {
        id: q.id ?? `q${index + 1}`,
        question: String(q.question ?? "").trim(),
        options,
      };
    })
    .filter((q) => q.question.length > 0)
    .slice(0, 6);

  if (questions.length === 0) throw new Error("Tidak ada pertanyaan yang bisa dipakai.");
  return questions;
}
