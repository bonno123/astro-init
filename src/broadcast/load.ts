// Runs on the home page. Asks the Worker whether a broadcast is live, after the
// page has loaded and gone idle, and shows it if this visitor hasn't seen it.
// The page's HTML never changes, so crawlers see the same page with or without one.
// This file stays tiny: the overlay and its renderers load only when one is live.

import { API_BASE } from "~/utils/api";
import type { Broadcast } from "./types";

// Crawlers, link unfurlers and audit tools never get the overlay.
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|facebookexternalhit|embedly|whatsapp|telegram|discord|preview/i;
const KEY = "broadcast-seen";

function store(b: Broadcast): Storage | null {
  try {
    return b.frequency === "once" ? localStorage : b.frequency === "session" ? sessionStorage : null;
  } catch {
    return null;
  }
}

function seenIds(s: Storage): string[] {
  try {
    const v = JSON.parse(s.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const hasSeen = (b: Broadcast) => {
  const s = store(b);
  return s ? seenIds(s).includes(b.id) : false;
};

function markSeen(b: Broadcast) {
  const s = store(b);
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify([b.id, ...seenIds(s).filter((id) => id !== b.id)].slice(0, 20)));
  } catch {
    /* private mode or full: it may show again, which is fine */
  }
}

/** After the load event, once the main thread is free. */
function settled(): Promise<void> {
  return new Promise((resolve) => {
    const idle = () =>
      "requestIdleCallback" in window ? requestIdleCallback(() => resolve(), { timeout: 3000 }) : setTimeout(resolve, 1500);
    if (document.readyState === "complete") idle();
    else addEventListener("load", idle, { once: true });
  });
}

/** Resolves when the tab is in front, so a background tab doesn't use it up unseen. */
function visible(): Promise<void> {
  if (!document.hidden) return Promise.resolve();
  return new Promise((resolve) => {
    const on = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", on);
      resolve();
    };
    document.addEventListener("visibilitychange", on);
  });
}

export async function run() {
  if (navigator.webdriver || BOT.test(navigator.userAgent)) return;
  await settled();

  let b: Broadcast | null = null;
  try {
    const res = await fetch(`${API_BASE}/api/broadcast`);
    if (!res.ok) return;
    b = (await res.json())?.broadcast ?? null;
  } catch {
    return; // Worker down or offline: no overlay, nothing else changes
  }
  if (!b || hasSeen(b)) return;

  await visible();
  // Don't cover a dialog the visitor already opened (the say-hi sheet).
  if (document.querySelector("dialog[open]")) return;

  const { showBroadcast } = await import("./show");
  if (await showBroadcast(b)) markSeen(b);
}
