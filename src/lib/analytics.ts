/**
 * Local analytics: pushes to window.dataLayer (GTM-compatible) and emits a DOM
 * event other transports can subscribe to. No user content is attached.
 */
export type LandingEvent =
  | "click_nav_settings"
  | "click_hero_secondary"
  | "submit_idea_hero"
  | "prd_started"
  | "prd_completed";

type Props = Record<string, string | number | boolean | undefined>;

export function track(event: LandingEvent, props: Props = {}) {
  if (typeof window === "undefined") return;

  const payload = { event, ...props, ts: Date.now() };
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("npai:track", { detail: payload }));

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", payload);
  }
}
