import { connection } from "next/server";
import { readSettings } from "@/lib/settings";
import { streamPrd } from "@/lib/generate";

export async function POST(request: Request) {
  await connection();

  let body: {
    idea?: string;
    productType?: string;
    language?: "id" | "en";
    detailLevel?: "mvp" | "standard" | "detailed";
    aiCodingTool?: string;
    techStack?: string;
    answers?: { question: string; answer: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body bukan JSON." }, { status: 400 });
  }

  const idea = (body.idea ?? "").trim();
  if (idea.length < 20) {
    return Response.json(
      { error: "Ide minimal 20 karakter biar PRD-nya nggak ngambang." },
      { status: 400 },
    );
  }

  const settings = await readSettings();
  if (!settings) {
    return Response.json({ error: "Isi API key di /settings dulu." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamPrd(
          settings,
          {
            idea,
            productType: body.productType,
            language: body.language,
            detailLevel: body.detailLevel,
            aiCodingTool: body.aiCodingTool,
            techStack: body.techStack,
            answers: body.answers,
          },
          request.signal,
        )) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          const raw = error instanceof Error ? error.message : "unknown";
          const message = raw.includes("fetch failed")
            ? `tidak bisa menghubungi ${settings.baseUrl} — cek Base URL atau koneksi`
            : raw;
          controller.enqueue(encoder.encode(`\n\n> Gagal generate: ${message}`));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
