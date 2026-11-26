// The power button by ধীরে: plays a broadcast whenever the visitor wants one,
// live or not, and switches it on like an old TV. This file loads with the
// page, so it stays small: the overlay and the shader load on the first press
// (or as the pointer comes near it).
//
// What it plays is decided in pick(). For now that's Night Ride, chosen here.
// Later it can ask the Worker (the latest broadcast, or one marked for it) and
// nothing else here needs to change.

import type { Showable } from "./show";

type Pick = { title: string; broadcast: Showable };

const NIGHT_RIDE: Pick = {
  title: "Night Ride",
  broadcast: { kind: "shader", payload: { shader: "night-ride" }, dismissAfterMs: 0 },
};

/** The one place that chooses what the button plays. */
async function pick(): Promise<Pick> {
  return NIGHT_RIDE;
}

/** Sets up the [data-replay] button: shows it, labels it, and plays on a press. */
export function wireReplay(button: HTMLButtonElement | null) {
  if (!button || !("WebGL2RenderingContext" in window)) return; // it would only close again
  let busy = false;

  void pick().then(({ title }) => {
    button.setAttribute("aria-label", `Play ${title}`);
    button.title = `play · ${title.toLowerCase()}`;
    button.hidden = false;
  });

  // Fetch the overlay's code as the pointer heads for the button, so the press feels instant.
  const warm = () => void import("./show");
  button.addEventListener("pointerenter", warm, { once: true });
  button.addEventListener("focus", warm, { once: true });

  button.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    button.dataset.on = "";
    try {
      const [{ showBroadcast }, { broadcast }] = await Promise.all([import("./show"), pick()]);
      const shown = await showBroadcast(broadcast, { look: "tv", asked: true });
      if (shown) await shown.closed;
    } catch (e) {
      console.error("replay failed", e);
    } finally {
      delete button.dataset.on;
      busy = false;
    }
  });
}
