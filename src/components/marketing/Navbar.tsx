"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import { siteConfig } from "@/lib/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <nav className="shell flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md"
          aria-label={`${siteConfig.name} — beranda`}
        >
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent" />
          <span className="font-heading text-[17px] font-semibold tracking-tight whitespace-nowrap">
            {siteConfig.wordmark}
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <Link
            href={siteConfig.links.settings}
            onClick={() => track("click_nav_settings")}
            aria-label="Pengaturan"
            className="inline-flex items-center rounded-md px-2.5 py-2 text-sm whitespace-nowrap text-muted transition-colors duration-150 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" aria-hidden className="size-4 shrink-0 sm:hidden">
              <circle
                cx="10"
                cy="10"
                r="2.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 2.6v1.6M10 15.8v1.6M17.4 10h-1.6M4.2 10H2.6M15.2 4.8l-1.1 1.1M5.9 14.1l-1.1 1.1M15.2 15.2l-1.1-1.1M5.9 5.9L4.8 4.8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="hidden whitespace-nowrap sm:inline">Pengaturan</span>
          </Link>
          <Link
            href={siteConfig.links.app}
            className="inline-flex h-11 shrink-0 items-center rounded-[10px] border border-line px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 hover:border-white/25 hover:bg-surface sm:px-4"
          >
            Buka app
          </Link>
        </div>
      </nav>
    </header>
  );
}
