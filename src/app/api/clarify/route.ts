import { connection } from "next/server";
import { readSettings } from "@/lib/settings";
import { askClarifications } from "@/lib/clarify";

export async function POST(request: Request) {
  await connection();

  let body: { idea?: string; productType?: string; techStack?: string; aiCodingTool?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body bukan JSON." }, { status: 400 });
  }

  const idea = (body.idea ?? "").trim();
  if (idea.length < 20) {
    return Response.json(
      { error: "Ide minimal 20 karakter biar pertanyaannya nyambung." },
      { status: 400 },
    );
  }

  const settings = await readSettings();
  if (!settings) {
    return Response.json({ error: "Isi API key di /settings dulu." }, { status: 400 });
  }

  try {
    const questions = await askClarifications(settings, {
      idea,
      productType: body.productType,
      techStack: body.techStack,
      aiCodingTool: body.aiCodingTool,
    });
    return Response.json({ questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyiapkan pertanyaan.";
    return Response.json({ error: message }, { status: 502 });
  }
}
