import Link from "next/link";
import { siteConfig } from "@/lib/site";

const links = [
  { label: "Bikin Plan", href: siteConfig.links.app },
  { label: "Pengaturan", href: siteConfig.links.settings },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent" />
          <span className="font-heading text-[15px] font-semibold tracking-tight">
            {siteConfig.wordmark}
          </span>
          <span className="text-[13px] text-muted">© 2026</span>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="rounded-md text-[13.5px] text-muted transition-colors duration-150 hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
