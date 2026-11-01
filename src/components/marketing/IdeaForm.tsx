"use client";

import { track } from "@/lib/analytics";

/**
 * Native GET form: the browser builds /app/new?idea=… on its own, so the hero
 * keeps working with JS disabled. The handler only records the event.
 */
export function IdeaForm() {
  return (
    <form
      action="/app/new"
      method="get"
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const idea = String(data.get("idea") ?? "").trim();
        track("submit_idea_hero", { length: idea.length });
      }}
      className="flex w-full flex-col gap-2.5 sm:flex-row"
    >
      <label htmlFor="hero-idea" className="sr-only">
        Ide yang mau kamu bangun
      </label>
      <input
        id="hero-idea"
        name="idea"
        type="text"
        maxLength={5000}
        autoComplete="off"
        placeholder="Aplikasi booking lapangan futsal buat pemilik GOR kecil…"
        className="h-12 w-full rounded-[12px] border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-muted/70 transition-colors duration-150 hover:border-white/20 focus:border-accent/70 focus:outline-none sm:h-[52px]"
      />
      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-[12px] bg-accent px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-accent-hover sm:h-[52px]"
      >
        Mulai Bikin Plan
      </button>
    </form>
  );
}
