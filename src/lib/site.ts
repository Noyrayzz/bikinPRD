/**
 * Single place for routes and labels. This build is a local, single-user tool:
 * the only surfaces are the landing page, the generator, and the settings page
 * where the provider key lives.
 */
export const siteConfig = {
  name: "bikinPRD",
  wordmark: "bikinPRD",
  tagline: "Ide mentah jadi PRD siap dikoding.",
  links: {
    app: "/app/new",
    newPrd: "/app/new",
    settings: "/settings",
  },
} as const;

export const aiCodingTools = ["Cursor", "Claude Code", "Windsurf", "Copilot"] as const;
