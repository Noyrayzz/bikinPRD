import { IdeaForm } from "./IdeaForm";
import { TrackedLink } from "./TrackedLink";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-56 h-[520px] bg-[radial-gradient(58%_58%_at_50%_38%,rgba(255,90,54,0.15),transparent_72%)]"
      />
      <div className="shell relative pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="hero-seq max-w-3xl">
          <h1 className="text-[36px] leading-[1.08] font-bold md:text-[56px]">
            Ide mentah jadi PRD siap dikoding.
          </h1>

          <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-muted md:text-[19px]">
            Tulis idemu, dapat PRD 17 bagian dengan acceptance criteria dan task breakdown
            yang bisa langsung dikerjakan AI coding tool.
          </p>

          <div className="mt-8 max-w-2xl">
            <IdeaForm />
            <p className="mt-3 text-[13px] text-muted">
              Isi idemu langsung, atau buka generator dan isi form-nya di sana.
            </p>
          </div>

          <div className="mt-7">
            <TrackedLink
              href={siteConfig.links.settings}
              event="click_hero_secondary"
              className="rounded-md text-[14px] text-muted underline decoration-white/25 underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-accent"
            >
              Atur API key dulu
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
