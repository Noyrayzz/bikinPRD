"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";
import { Select } from "@/components/ui/Select";

type Step = "ide" | "pertanyaan" | "hasil";
type Status = "idle" | "running" | "done" | "error";
type Question = { id: string; question: string; options: string[] };

const inputClass =
  "h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-[13.5px] text-ink transition-colors duration-150 focus:border-accent/70 focus:outline-none";
const labelClass = "mb-1.5 block text-[13px] font-medium text-ink/80";

const STACK_OPTIONS = {
  frontend: ["Next.js 16", "React + Vite", "SvelteKit", "Nuxt 3", "Astro", "Flutter", "React Native"],
  backend: ["Next.js API routes", "Node + Express", "FastAPI", "Laravel 11", "Go + Chi"],
  db: ["PostgreSQL 17", "MySQL 8", "SQLite", "MongoDB", "Supabase Postgres"],
  hosting: ["Vercel", "Railway", "Fly.io", "VPS + Docker", "Supabase"],
} as const;

const STACK_LABELS = {
  frontend: "Frontend",
  backend: "Backend",
  db: "Database",
  hosting: "Hosting",
} as const;

type StackLayer = keyof typeof STACK_OPTIONS;

export function GenerateForm() {
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("ide");
  const [idea, setIdea] = useState(params.get("idea") ?? "");
  const [detailLevel, setDetailLevel] = useState<"mvp" | "standard" | "detailed">("standard");
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [aiCodingTool, setAiCodingTool] = useState("claude_code");
  const [techMode, setTechMode] = useState<"ai" | "manual">("ai");
  const [stack, setStack] = useState<Record<StackLayer, string>>({
    frontend: "",
    backend: "",
    db: "",
    hosting: "",
  });
  const [customLayer, setCustomLayer] = useState<Record<string, boolean>>({});

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [note, setNote] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLPreElement | null>(null);

  const techStack =
    techMode === "ai"
      ? "biarkan AI merekomendasikan"
      : Object.entries(stack)
          .filter(([, value]) => value.trim())
          .map(([layer, value]) => `${layer}: ${value.trim()}`)
          .join(", ");

  async function loadQuestions() {
    if (idea.trim().length < 20) {
      setNote("Ide minimal 20 karakter.");
      return;
    }
    setLoadingQuestions(true);
    setNote("");
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea, techStack, aiCodingTool }),
      });
      const data = (await res.json()) as { questions?: Question[]; error?: string };
      if (!res.ok || !data.questions) {
        setNote(data.error ?? "Gagal menyiapkan pertanyaan.");
        return;
      }
      setQuestions(data.questions);
      setStep("pertanyaan");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Gagal menyiapkan pertanyaan.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function generate() {
    setStep("hasil");
    setStatus("running");
    setOutput("");
    setNote("");
    track("prd_started", { detail: detailLevel, language, mode: questions.length ? "klarifikasi" : "langsung" });

    const controller = new AbortController();
    abortRef.current = controller;

    const payload = {
      idea,
      detailLevel,
      language,
      aiCodingTool,
      techStack,
      answers: questions
        .map((q) => ({ question: q.question, answer: (answers[q.id] ?? "").trim() }))
        .filter((a) => a.answer.length > 0),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus("error");
        setNote(data.error ?? `Gagal generate (HTTP ${res.status}).`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setOutput(text);
        outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
      }
      setStatus("done");
      if (text.includes("> Gagal generate:")) {
        setNote("Provider mengembalikan error di tengah jalan.");
      }
      track("prd_completed", { chars: text.length });
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setStatus("error");
      setNote(error instanceof Error ? error.message : "Gagal generate.");
    }
  }

  function reset() {
    abortRef.current?.abort();
    setStep("ide");
    setQuestions([]);
    setAnswers({});
    setOutput("");
    setStatus("idle");
    setNote("");
  }

  async function copy() {
    await navigator.clipboard.writeText(output);
    setNote("PRD disalin ke clipboard.");
  }

  function download() {
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "PRD.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8">
      {step === "ide" ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="idea" className={labelClass}>
              Ide produk
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              minLength={20}
              maxLength={5000}
              placeholder="Aplikasi booking lapangan futsal buat pemilik GOR kecil: jadwal per jam, pembayaran DP, dan rekap pendapatan harian."
              className="w-full rounded-[10px] border border-line bg-bg px-3 py-2.5 text-[14px] text-ink placeholder:text-muted/60 transition-colors duration-150 focus:border-accent/70 focus:outline-none"
            />
            <p className="mt-1.5 text-[12px] text-muted">{idea.trim().length}/5000 karakter</p>
          </div>

          <div className="rounded-[12px] border border-line bg-surface p-4">
            <p className={labelClass}>Preferensi teknologi</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(
                [
                  { key: "ai", title: "Biarkan AI pilih", body: "AI rekomendasikan stack yang paling cocok." },
                  { key: "manual", title: "Pilih sendiri", body: "Tentukan frontend, backend, db, hosting." },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTechMode(option.key)}
                  aria-pressed={techMode === option.key}
                  className={`flex-1 rounded-[10px] border px-3 py-2.5 text-left transition-colors duration-150 ${
                    techMode === option.key
                      ? "border-accent/60 bg-accent/10"
                      : "border-line hover:border-white/20"
                  }`}
                >
                  <span className="block text-[13.5px] font-medium text-ink">{option.title}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">{option.body}</span>
                </button>
              ))}
            </div>

            {techMode === "manual" ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(Object.keys(STACK_OPTIONS) as StackLayer[]).map((layer) => {
                  const isCustom = customLayer[layer] === true;
                  return (
                    <label key={layer} className="text-[12.5px] text-muted">
                      {STACK_LABELS[layer]}
                      <Select
                        value={isCustom ? "__custom__" : stack[layer]}
                        onChange={(e) => {
                          const value = e.target.value;
                          const custom = value === "__custom__";
                          setCustomLayer({ ...customLayer, [layer]: custom });
                          setStack({ ...stack, [layer]: custom ? "" : value });
                        }}
                        className="mt-1"
                      >
                        <option value="">Belum ditentukan</option>
                        {STACK_OPTIONS[layer].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                        <option value="__custom__">Tulis sendiri…</option>
                      </Select>
                      {isCustom ? (
                        <input
                          value={stack[layer]}
                          onChange={(e) => setStack({ ...stack, [layer]: e.target.value })}
                          placeholder="Ketik sendiri"
                          autoFocus
                          className={`${inputClass} mt-1.5`}
                        />
                      ) : null}
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="detail" className={labelClass}>
                Kedalaman
              </label>
              <Select
                id="detail"
                value={detailLevel}
                onChange={(e) => setDetailLevel(e.target.value as typeof detailLevel)}
              >
                <option value="mvp">MVP</option>
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
              </Select>
            </div>
            <div>
              <label htmlFor="language" className={labelClass}>
                Bahasa
              </label>
              <Select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as typeof language)}
              >
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </Select>
            </div>
            <div>
              <label htmlFor="tool" className={labelClass}>
                AI coding tool
              </label>
              <Select
                id="tool"
                value={aiCodingTool}
                onChange={(e) => setAiCodingTool(e.target.value)}
              >
                <option value="claude_code">Claude Code</option>
                <option value="cursor">Cursor</option>
                <option value="windsurf">Windsurf</option>
                <option value="copilot">Copilot</option>
                <option value="generic">Generic</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadQuestions}
              disabled={loadingQuestions}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-60"
            >
              {loadingQuestions ? "Menyiapkan pertanyaan…" : "Lanjut: pertanyaan klarifikasi"}
            </button>
            <button
              type="button"
              onClick={generate}
              className="inline-flex h-11 items-center rounded-[10px] border border-line px-4 text-[13.5px] font-medium transition-colors duration-150 hover:border-white/25 hover:bg-surface"
            >
              Lewati, langsung generate
            </button>
            {note ? <span className="text-[12.5px] text-accent">{note}</span> : null}
          </div>
        </div>
      ) : null}

      {step === "pertanyaan" ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px]">Beberapa pertanyaan</h2>
              <p className="mt-1 text-[13px] text-muted">
                Biar PRD-nya lebih akurat. Kalau gak yakin, lewati saja — asumsinya dicatat di
                bagian 15.
              </p>
            </div>
            <span className="font-mono text-[11.5px] whitespace-nowrap text-muted">
              {Object.values(answers).filter((a) => a.trim()).length}/{questions.length} dijawab
            </span>
          </div>

          <ol className="space-y-3">
            {questions.map((question, index) => (
              <li key={question.id} className="rounded-[12px] border border-line bg-surface p-4">
                <p className="text-[14px] text-ink">
                  <span className="mr-2 font-mono text-[12px] text-accent">{index + 1}</span>
                  {question.question}
                </p>
                {question.options.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {question.options.map((option) => {
                      const active = answers[question.id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: active ? "" : option,
                            }))
                          }
                          aria-pressed={active}
                          className={`rounded-full border px-3 py-1 text-[12.5px] transition-colors duration-150 ${
                            active
                              ? "border-accent/60 bg-accent/10 text-ink"
                              : "border-line text-muted hover:border-white/25 hover:text-ink"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <textarea
                  value={answers[question.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Ketik jawaban…"
                  className="mt-2.5 w-full rounded-[10px] border border-line bg-bg px-3 py-2 text-[13px] text-ink placeholder:text-muted/60 focus:border-accent/70 focus:outline-none"
                />
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={generate}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
            >
              Generate PRD
            </button>
            <button
              type="button"
              onClick={() => setStep("ide")}
              className="inline-flex h-11 items-center rounded-[10px] border border-line px-4 text-[13.5px] font-medium transition-colors duration-150 hover:border-white/25 hover:bg-surface"
            >
              Ubah ide
            </button>
          </div>
        </div>
      ) : null}

      {step === "hasil" ? (
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={status === "running" ? () => abortRef.current?.abort() : generate}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
            >
              {status === "running" ? "Stop" : "Generate ulang"}
            </button>
            {status === "done" && output ? (
              <>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex h-11 items-center rounded-[10px] border border-line px-4 text-[13.5px] font-medium transition-colors duration-150 hover:border-white/25 hover:bg-surface"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="inline-flex h-11 items-center rounded-[10px] border border-line px-4 text-[13.5px] font-medium transition-colors duration-150 hover:border-white/25 hover:bg-surface"
                >
                  Unduh PRD.md
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center rounded-[10px] px-3 text-[13.5px] text-muted transition-colors duration-150 hover:text-ink"
            >
              Mulai baru
            </button>
            {note ? <span className="text-[12.5px] text-muted">{note}</span> : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-[12px] border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="font-mono text-[11.5px] text-muted">PRD.md</span>
              <span className="font-mono text-[11.5px] text-muted">
                {status === "running" ? "streaming…" : `${output.length.toLocaleString("id-ID")} karakter`}
              </span>
            </div>
            <pre
              ref={outputRef}
              className="max-h-[26rem] overflow-auto px-4 py-4 font-mono text-[12.5px] leading-[1.75] whitespace-pre-wrap text-ink/90"
            >
              {output || "Menunggu token pertama…"}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
