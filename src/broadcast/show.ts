// The full-screen shell every broadcast kind shares: a modal <dialog> with a
// close button, Esc, an optional auto-close, and focus handed back afterwards.
// A pinned one has none of those: only the returned close() takes it down.
// What goes inside comes from the kind's renderer.

import "./broadcast.css";
import type { Broadcast, Renderer, Shown } from "./types";

// One entry per kind. Each loads only when a broadcast of that kind is shown.
const RENDERERS: Record<string, () => Promise<{ default: Renderer }>> = {
  greeting: () => import("./greeting"),
  video: () => import("./video"),
};

export const KINDS = Object.keys(RENDERERS);

const isStill = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.hasAttribute("data-quiet");

type Showable = Pick<Broadcast, "kind" | "payload" | "dismissAfterMs"> & { pinned?: boolean };

/** Shows the broadcast. Resolves once it's on screen, or null if this site can't draw its kind. */
export async function showBroadcast(b: Showable): Promise<Shown | null> {
  const load = RENDERERS[b.kind];
  if (!load) return null;
  let render: Renderer;
  try {
    render = (await load()).default;
  } catch {
    return null;
  }
  const pinned = b.pinned === true;

  const still = isStill();
  const labelId = `bc-title-${Math.random().toString(36).slice(2, 8)}`;

  const dialog = document.createElement("dialog");
  dialog.className = pinned ? "bc pinned" : "bc";
  dialog.setAttribute("aria-labelledby", labelId);
  // Something has to hold focus; with no close button that's the dialog itself.
  if (pinned) {
    dialog.tabIndex = -1;
    dialog.setAttribute("closedby", "none"); // where supported, Esc doesn't even ask
  }
  const stage = document.createElement("div");
  stage.className = "bc-stage";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "bc-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>`;
  dialog.append(stage);
  if (!pinned) dialog.append(closeBtn);

  let markClosed!: () => void;
  const closed = new Promise<void>((resolve) => (markClosed = resolve));

  let cleanup: void | (() => void);
  let closing = false;
  let timer = 0;

  function close() {
    if (closing) return;
    closing = true;
    clearTimeout(timer);
    if (still) return dialog.close();
    dialog.classList.add("leaving");
    setTimeout(() => dialog.close(), 280);
  }

  dialog.addEventListener("cancel", (e) => {
    e.preventDefault(); // Esc: animate out like the button does, or nothing when pinned
    if (!pinned) close();
  });
  dialog.addEventListener("close", () => {
    if (!closing) {
      // The browser closed it itself (Chrome does on a repeated Esc). A pinned one goes straight back.
      if (pinned) return dialog.showModal();
      closing = true;
      clearTimeout(timer);
    }
    try {
      cleanup?.();
    } finally {
      dialog.remove();
      markClosed();
    }
  });
  closeBtn.addEventListener("click", close);

  // Auto-close, paused while the pointer or focus is on it or the tab is hidden.
  if (b.dismissAfterMs > 0 && !pinned) {
    let remaining = b.dismissAfterMs;
    let startedAt = 0;
    let running = false;
    const holds = new Set<string>();
    const resume = () => {
      if (closing || running || holds.size) return;
      running = true;
      startedAt = performance.now();
      timer = window.setTimeout(close, remaining);
      dialog.classList.remove("held");
    };
    const hold = (why: string) => {
      if (running) {
        running = false;
        clearTimeout(timer);
        remaining = Math.max(800, remaining - (performance.now() - startedAt));
      }
      holds.add(why);
      dialog.classList.add("held");
    };
    const release = (why: string) => {
      holds.delete(why);
      resume();
    };
    const bar = document.createElement("div");
    bar.className = "bc-timer";
    bar.style.animationDuration = `${b.dismissAfterMs}ms`;
    dialog.append(bar);
    dialog.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && hold("pointer"));
    dialog.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && release("pointer"));
    dialog.addEventListener("focusin", (e) => e.target !== closeBtn && hold("focus"));
    dialog.addEventListener("focusout", () => release("focus"));
    const onVis = () => (document.hidden ? hold("hidden") : release("hidden"));
    document.addEventListener("visibilitychange", onVis);
    dialog.addEventListener("close", () => document.removeEventListener("visibilitychange", onVis));
    requestAnimationFrame(resume);
  }

  document.body.append(dialog);
  // Open first, in the same task, so renderers can measure the stage. Nothing paints in between.
  dialog.showModal();
  try {
    cleanup = render(stage, b.payload, { still, close, labelId, pinned });
  } catch (e) {
    console.error("broadcast renderer failed", e);
    closing = true;
    clearTimeout(timer);
    dialog.close();
    return null;
  }
  (pinned ? dialog : closeBtn).focus({ preventScroll: true });
  return { close, closed };
}
