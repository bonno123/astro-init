// Runs on the home page. After the page has loaded and gone idle it opens a
// WebSocket to the Worker's live feed (cloudflare/hub.js), which sends the
// broadcast live now and then every change: one appears the moment it's
// turned on and goes the moment it's turned off. If the feed can't connect,
// it asks once over plain HTTP instead, as it did before there was a feed.
// The page's HTML never changes, so crawlers see the same page with or without one.
// This file stays small: the overlay and its renderers load only when one is live.

import { API_BASE } from "~/utils/api";
import type { Broadcast, Shown } from "./types";

// Crawlers, link unfurlers and audit tools never get the overlay.
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|facebookexternalhit|embedly|whatsapp|telegram|discord|preview/i;
const KEY = "broadcast-seen";
// Keeps mobile networks from dropping a quiet connection. The hub answers without waking up.
const PING_MS = 30_000;
// A tab in the background this long lets go of its connection, and asks again when it's back.
const HIDDEN_MS = 60_000;

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

/** Resolves when no other dialog is open (the say-hi sheet), so this doesn't cover one the visitor opened. */
function noOtherDialog(): Promise<void> {
  if (!document.querySelector("dialog[open]")) return Promise.resolve();
  return new Promise((resolve) => {
    // close doesn't bubble, but a capturing listener on the document still sees it
    const on = () => {
      if (document.querySelector("dialog[open]")) return;
      document.removeEventListener("close", on, true);
      resolve();
    };
    document.addEventListener("close", on, true);
  });
}

const sameAs = (a: Broadcast, b: Broadcast) => a.id === b.id && a.version === b.version;

// What's on screen, the latest state the Worker sent, and what this visitor closed on this page.
let current: { b: Broadcast; shown: Shown } | null = null;
let latest = 0;
const closedHere = new Set<string>();

/** Makes the screen match what the Worker says is live. Called on every message. */
function apply(b: Broadcast | null) {
  const turn = ++latest;
  if (current && b && sameAs(current.b, b)) return; // already showing exactly this
  // An edit to the one on screen redraws it even if it was marked seen.
  const redraw = Boolean(current && b && current.b.id === b.id);
  if (current) {
    const { shown } = current;
    current = null;
    shown.close();
  }
  if (b) void show(b, turn, redraw);
}

async function show(b: Broadcast, turn: number, redraw: boolean) {
  if (closedHere.has(`${b.id}@${b.version}`)) return;
  if (!b.pinned && !redraw && hasSeen(b)) return;
  await visible();
  if (!b.pinned) await noOtherDialog();
  if (turn !== latest) return; // something newer came in while this waited
  const { showBroadcast } = await import("./show");
  if (turn !== latest) return;
  const shown = await showBroadcast(b);
  if (!shown) return;
  if (turn !== latest) return shown.close();
  markSeen(b);
  const entry = { b, shown };
  current = entry;
  shown.closed.then(() => {
    if (current !== entry) return; // taken down by the Worker, not the visitor
    current = null;
    closedHere.add(`${b.id}@${b.version}`);
  });
}

function read(data: unknown): Broadcast | null | undefined {
  try {
    const v = typeof data === "string" ? JSON.parse(data) : data;
    return v && typeof v === "object" && "broadcast" in v ? ((v as any).broadcast ?? null) : undefined;
  } catch {
    return undefined;
  }
}

/** The fallback: one plain request, as before the live feed. */
async function askOnce() {
  try {
    const res = await fetch(`${API_BASE}/api/broadcast`);
    if (!res.ok) return;
    const b = read(await res.json());
    if (b !== undefined) apply(b);
  } catch {
    /* Worker down or offline: no overlay, nothing else changes */
  }
}

function live() {
  let ws: WebSocket | null = null;
  let ping = 0;
  let retry = 0;
  let retryTimer = 0;
  let hiddenTimer = 0;
  let askedOnce = false;
  let leaving = false;
  const url = `${API_BASE.replace(/^http/, "ws")}/api/broadcast/live`;

  function connect() {
    if (ws || document.hidden || !("WebSocket" in window)) return;
    clearTimeout(retryTimer);
    let opened = false;
    const s = new WebSocket(url);
    ws = s;
    s.onopen = () => {
      opened = true;
      retry = 0;
      ping = window.setInterval(() => s.readyState === WebSocket.OPEN && s.send("ping"), PING_MS);
    };
    s.onmessage = (e) => {
      if (e.data === "pong") return;
      const b = read(e.data);
      if (b !== undefined) apply(b);
    };
    s.onclose = () => {
      clearInterval(ping);
      if (ws === s) ws = null;
      if (leaving) return;
      // Never got through (no feed, or the free quota is used up for today): ask the old way, once.
      if (!opened && !askedOnce) {
        askedOnce = true;
        void askOnce();
      }
      if (document.hidden) return; // reconnects when the tab is back
      // 2s, 4s, 8s, ... up to 5 minutes
      retry = Math.min(retry + 1, 8);
      retryTimer = window.setTimeout(connect, Math.min(300_000, 1000 * 2 ** retry));
    };
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenTimer = window.setTimeout(() => ws?.close(1000), HIDDEN_MS);
    } else {
      clearTimeout(hiddenTimer);
      connect();
    }
  });
  // Say goodbye when leaving, so the hub's count stays right and the page can go into the back/forward cache.
  addEventListener("pagehide", () => {
    leaving = true;
    clearTimeout(retryTimer);
    const s = ws;
    ws = null;
    s?.close(1000);
  });
  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    leaving = false;
    connect();
  });
  // The tab may be in the back already; connect() waits for it to come forward.
  connect();
}

export async function run() {
  if (navigator.webdriver || BOT.test(navigator.userAgent)) return;
  await settled();
  if ("WebSocket" in window) live();
  else void askOnce();
}
