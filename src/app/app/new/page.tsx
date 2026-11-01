import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { GenerateForm } from "@/components/app/GenerateForm";
import { readSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bikin Plan",
  description: "Generator PRD Ngoding Pake AI.",
};

// Reads the API key at request time; blocking is fine for a local single-user app.
export const instant = false;

export default async function NewPrdPage() {
  await connection();
  const settings = await readSettings();

  return (
    <main className="shell py-14 md:py-20">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 rounded-md">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent" />
          <span className="font-heading text-[15px] font-semibold tracking-tight">
            {siteConfig.wordmark}
          </span>
        </Link>
        <Link
          href={siteConfig.links.settings}
          className="rounded-md text-[13.5px] text-muted transition-colors duration-150 hover:text-ink"
        >
          Pengaturan
        </Link>
      </div>

      <div className="mt-12 max-w-3xl">
        <h1 className="text-[32px] leading-tight md:text-[40px]">Bikin Plan</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-muted">
          Tulis ide, jawab beberapa pertanyaan klarifikasi, lalu dapat PRD 17 bagian dengan ID
          requirement, acceptance criteria, dan task breakdown yang siap dikasih ke AI coding tool.
        </p>

        {settings ? (
          <>
            <p className="mt-4 text-[12.5px] text-muted">
              Model: <span className="font-mono text-ink/80">{settings.model}</span> ·{" "}
              <Link
                href={siteConfig.links.settings}
                className="underline decoration-line underline-offset-4 hover:decoration-accent"
              >
                ganti model
              </Link>
            </p>
            <Suspense fallback={<p className="mt-8 text-[13px] text-muted">Menyiapkan form…</p>}>
              <GenerateForm />
            </Suspense>
          </>
        ) : (
          <div className="mt-8 rounded-[12px] border border-accent/40 bg-surface px-4 py-4 text-[13.5px] text-muted">
            Belum ada API key, jadi generate belum bisa jalan.{" "}
            <Link
              href={siteConfig.links.settings}
              className="text-ink underline decoration-line underline-offset-4 hover:decoration-accent"
            >
              Isi di Pengaturan
            </Link>{" "}
            dulu.
          </div>
        )}
      </div>
    </main>
  );
}
