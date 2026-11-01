import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/site";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "bikinPRD — ide jadi PRD siap dikoding",
    template: "%s · bikinPRD",
  },
  description:
    "Tulis ide, dapat PRD 17 bagian dengan ID requirement, acceptance criteria, dan task breakdown yang siap dieksekusi Cursor, Claude Code, dan Windsurf.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: siteConfig.name,
    title: "bikinPRD — ide jadi PRD siap dikoding",
    description:
      "Tulis ide, dapat PRD 17 bagian dengan ID requirement, acceptance criteria, dan task breakdown.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
