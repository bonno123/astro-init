// kind: shader. A full-screen Shadertoy-style shader from src/broadcast/shaders/,
// named by the broadcast; the code ships with the site and is never stored.
// It fades in once compiled, and closes quietly if this device can't run it.
// With motion off it shows one still frame and waits for a tap to play.

import { createToy, PASSES, type Channel, type Toy, type ToyProgram } from "./shadertoy";
import { SHADERS, type ShaderDef } from "./shaders";
import type { Renderer, ShaderPayload } from "./types";

// Each shader's code is its own chunk, fetched only when that one is shown.
const SOURCES = import.meta.glob<string>("./shaders/*/*.glsl", { query: "?raw", import: "default" });

const PLAY = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`;

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
  const common = file("common");
  const [commonCode, ...codes] = await Promise.all([common ? common() : "", ...loaders.map((f) => f())]);
  return { common: commonCode, passes: names.map((name, i) => ({ name, code: codes[i], channels: channels(name) })) };
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
  play.innerHTML = PLAY;
  play.hidden = true;
  wrap.append(play);

  stage.append(wrap);

  let toy: Toy | null = null;
  let gone = false;

  play.addEventListener("click", () => {
    play.hidden = true;
    toy?.play();
  });

  (async () => {
    try {
      const program = await load(p.shader, def);
      if (gone) return;
      const made = await createToy(canvas, program, { scale: def.scale, onLost: () => ctx.close() });
      if (gone) return made.destroy();
      toy = made;
      if (ctx.still) {
        toy.still(def.stillAt ?? 0);
        play.hidden = false;
      } else toy.play();
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
