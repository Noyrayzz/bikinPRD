import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function ClosingCta() {
  return (
    <section className="border-t border-line bg-surface/30">
      <div className="shell py-16 text-center md:py-24">
        <h2 className="mx-auto max-w-2xl text-[28px] md:text-[36px]">
          Punya ide? Jadikan siap dikoding hari ini.
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={siteConfig.links.app}
            className="inline-flex h-12 w-full items-center justify-center rounded-[12px] bg-accent px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-accent-hover sm:w-auto"
          >
            Bikin Plan
          </Link>
          <Link
            href={siteConfig.links.settings}
            className="inline-flex h-12 w-full items-center justify-center rounded-[12px] border border-line px-6 text-[15px] font-medium transition-colors duration-150 hover:border-white/25 hover:bg-surface sm:w-auto"
          >
            Isi API key
          </Link>
        </div>
      </div>
    </section>
  );
}
