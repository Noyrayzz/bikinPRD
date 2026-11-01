import type { Metadata } from "next";
import Link from "next/link";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { connection } from "next/server";
import { providers, readSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pengaturan",
  description: "API key untuk generate PRD, disimpan lokal.",
};

// Reads the API key at request time; blocking is fine for a local single-user app.
export const instant = false;

export default async function SettingsPage() {
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
          href={siteConfig.links.app}
          className="rounded-md text-[13.5px] text-muted transition-colors duration-150 hover:text-ink"
        >
          Buka app
        </Link>
      </div>

      <div className="mt-12 max-w-xl">
        <h1 className="text-[32px] leading-tight md:text-[40px]">Pengaturan</h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
          App ini jalan lokal di mesin kamu, tanpa login. Isi API key sekali di sini dan
          generator PRD akan memakainya untuk semua PRD berikutnya.
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-[12px] border border-line bg-surface px-4 py-3 text-[13px] text-muted">
          <span
            aria-hidden
            className={`mt-[7px] size-2 shrink-0 rounded-full ${settings ? "bg-accent" : "bg-white/30"}`}
          />
          <span>
            Status:{" "}
            {settings ? (
              <span className="text-ink">
                key tersimpan untuk {settings.model} · {settings.baseUrl}
              </span>
            ) : (
              <span className="text-ink">belum ada key — belum bisa generate PRD</span>
            )}
          </span>
        </div>

        <SettingsForm presets={providers} />
      </div>
    </main>
  );
}
