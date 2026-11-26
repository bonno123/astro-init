// kind: shader. A full-screen Shadertoy-style shader from src/broadcast/shaders/,
// named by the broadcast; the code ships with the site and is never stored.
// It fades in once compiled, and closes quietly if this device can't run it.
// With motion off it shows one still frame and waits for a tap to play.
// One with a Sound tab starts silent, with a button for sound: browsers only
// allow sound after a tap, and a song nobody asked for would be rude anyway.
// One that answers to dragging shows a grab cursor, and tells a first-time
// visitor once: it looks like a video otherwise.

import { ICON } from "./icons";
import { createToy, PASSES, type Channel, type Toy, type ToyProgram } from "./shadertoy";
import { SHADERS, type ShaderDef } from "./shaders";
import type { Renderer, ShaderPayload } from "./types";

/** Set once a visitor has been told they can drag a shader. */
const HINT_SEEN = "bc-drag-hint";

// Each shader's code is its own chunk, fetched only when that one is shown.
const SOURCES = import.meta.glob<string>("./shaders/*/*.glsl", { query: "?raw", import: "default" });

async function load(slug: string, def: ShaderDef): Promise<ToyProgram> {
  const file = (name: string) => SOURCES[`./shaders/${slug}/${name}.glsl`];
  const names = PASSES.filter((n) => n in def.passes);
  const channels = (name: (typeof names)[number]): (Channel | null)[] => {
    const wiring = def.passes[name] ?? {};
    return ([0, 1, 2, 3] as const).map((i) => {
      const c = wiring[`iChannel${i}`];
      if (!c) return null;
      const spec = typeof c === "string" ? { src: c } : c;
      if (!(spec.src in def.passes)) throw new Error(`${slug}: ${name} reads ${spec.src}, which it doesn't have.`);
      return { src: spec.src, filter: spec.filter ?? "linear", wrap: spec.wrap ?? "clamp" };
    });
  };
  const loaders = names.map((n) => {
    const f = file(n);
    if (!f) throw new Error(`${slug}: ${n}.glsl is missing.`);
    return f;
  });
  // A song borrowed from another shader brings its common.glsl too (the song's clock), in front of this one's.
  const from = def.sound?.from;
  if (from && !Object.hasOwn(SHADERS, from)) throw new Error(`${slug}: borrows the song of ${from}, which isn't here.`);
  const commons = [from ? SOURCES[`./shaders/${from}/common.glsl`] : undefined, file("common")];
  const sound = def.sound ? SOURCES[`./shaders/${from ?? slug}/sound.glsl`] : undefined;
  if (def.sound && !sound) throw new Error(`${slug}: ${from ?? slug}/sound.glsl is missing.`);
  const [soundCode, ...codes] = await Promise.all([
    sound ? sound() : "",
    ...[...commons, ...loaders].map((f) => (f ? f() : "")),
  ]);
  const seconds = def.sound?.seconds ?? (from ? SHADERS[from].sound?.seconds : undefined) ?? 180;
  return {
    common: codes.slice(0, 2).filter(Boolean).join("\n"),
    passes: names.map((name, i) => ({
      name,
      code: codes[i + 2],
      channels: channels(name),
      optional: name !== "image" && Boolean(def.optional?.includes(name)),
      size: name !== "image" ? def.sizes?.[name] : undefined,
    })),
    sound: def.sound ? { code: soundCode, seconds } : null,
  };
}

const shader: Renderer = (stage, p: ShaderPayload, ctx) => {
  // An unknown name (an old page, or a shader since removed): throwing here closes it before anything shows.
  if (!Object.hasOwn(SHADERS, p.shader)) throw new Error(`No shader called "${p.shader}" on this site.`);
  const def = SHADERS[p.shader];

  const wrap = document.createElement("div");
  wrap.className = "bc-shader";

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");

  const heading = document.createElement("h2");
  heading.id = ctx.labelId;
  heading.className = p.caption ? "bc-caption" : "bc-sr";
  heading.textContent = p.caption || def.title;

  wrap.append(canvas, heading);

  if (def.credit) {
    const credit = document.createElement(def.credit.link ? "a" : "p");
    credit.className = "bc-credit";
    credit.textContent = `“${def.title}” by ${def.credit.by}${def.credit.licence ? ` · ${def.credit.licence}` : ""}`;
    if (credit instanceof HTMLAnchorElement && def.credit.link) {
      credit.href = def.credit.link;
      credit.target = "_blank";
      credit.rel = "noopener";
    }
    wrap.append(credit);
  }

  const play = document.createElement("button");
  play.type = "button";
  play.className = "bc-play";
  play.setAttribute("aria-label", "Play");
  play.innerHTML = ICON.play;
  play.hidden = true;
  wrap.append(play);

  const sound = document.createElement("button");
  sound.type = "button";
  sound.className = "bc-btn bc-sound";
  sound.hidden = true;
  sound.setAttribute("aria-label", "Sound");
  let heard = false;
  const syncSound = () => {
    sound.innerHTML = heard ? ICON.sound : ICON.muted;
    sound.title = heard ? "sound off" : "sound on";
    sound.setAttribute("aria-pressed", String(heard));
  };
  syncSound();
  wrap.append(sound);

  stage.append(wrap);

  let toy: Toy | null = null;
  let gone = false;

  // Once per visitor, the first time a shader they can drag is on: say so, then
  // get out of the way on the first touch, or after a few seconds.
  const hint = () => {
    try {
      if (localStorage.getItem(HINT_SEEN)) return;
      localStorage.setItem(HINT_SEEN, "1");
    } catch {
      // storage is off: show it anyway, every time
    }
    const el = document.createElement("p");
    el.className = "bc-hint";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `${ICON.orbit}<span>drag to look around</span>`;
    wrap.append(el);
    const done = () => {
      clearTimeout(show);
      clearTimeout(hide);
      canvas.removeEventListener("pointerdown", done);
      el.classList.remove("on");
      setTimeout(() => el.remove(), 600);
    };
    const show = setTimeout(() => el.classList.add("on"), 1200); // once the picture has faded in
    const hide = setTimeout(done, 6500);
    canvas.addEventListener("pointerdown", done);
  };

  play.addEventListener("click", () => {
    play.hidden = true;
    toy?.play();
    if (toy?.sound) sound.hidden = false;
  });
  sound.addEventListener("click", () => {
    const s = toy?.sound;
    if (!s) return;
    heard = !heard;
    syncSound();
    if (!heard) return s.stop();
    s.start().catch((e) => {
      console.error(`broadcast shader "${p.shader}" sound`, e);
      heard = false;
      syncSound();
      sound.hidden = true; // it won't work here; don't keep offering
    });
  });

  (async () => {
    try {
      const program = await load(p.shader, def);
      if (gone) return;
      // Leaning with the mouse is parallax, the motion reduced motion asks to be spared.
      const hover = Boolean(def.hover) && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      const made = await createToy(canvas, program, { scale: def.scale, drag: def.drag, hover, onLost: () => ctx.close() });
      if (gone) return made.destroy();
      toy = made;
      // Without its optional buffers (no float rendering here) a shader may not answer to dragging; don't offer it.
      if (def.drag && !toy.missing.length) {
        wrap.classList.add("bc-drag");
        hint();
      }
      if (ctx.still) {
        toy.still(def.stillAt ?? 0);
        play.hidden = false;
      } else {
        toy.play();
        if (toy.sound) sound.hidden = false;
      }
      wrap.classList.add("ready");
    } catch (e) {
      // No WebGL2, no float buffers, or it didn't compile: go away rather than show a black screen.
      console.error(`broadcast shader "${p.shader}"`, e);
      if (!gone) ctx.close();
    }
  })();

  return () => {
    gone = true;
    toy?.destroy();
  };
};

export default shader;
