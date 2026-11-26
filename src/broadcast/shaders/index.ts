// The shaders a broadcast can play. A broadcast only names one of these by its
// key; the code itself lives here in the repo, next to this file, and ships
// with the site. See README.md in this folder for how to add one.

import type { BufferName, PassName } from "../shadertoy";

/** A buffer by name, or with its sampling spelled out. Defaults: linear, clamp (Shadertoy's for buffers). */
export type ChannelDef = BufferName | { src: BufferName; filter?: "linear" | "nearest"; wrap?: "clamp" | "repeat" };
/** What each of a pass's iChannel0..3 reads. Leave a channel out for none. */
export type PassDef = Partial<Record<"iChannel0" | "iChannel1" | "iChannel2" | "iChannel3", ChannelDef>>;

export type ShaderDef = {
  /** What the admin page lists it as. */
  title: string;
  /** Shown small in the corner. Needed for anything that isn't ours (Shadertoy's default licence asks for it). */
  credit?: { by: string; link?: string; licence?: string };
  /** Each pass it has, by its .glsl file's name, and what it reads. A common.glsl, if present, goes in front of all of them. */
  passes: Partial<Record<Exclude<PassName, "image">, PassDef>> & { image: PassDef };
  /** The moment shown when motion is off, in seconds. Default 0. */
  stillAt?: number;
  /**
   * It answers to dragging (iMouse): the cursor over it is a hand that can grab,
   * a first-time visitor gets a hint, and it can be dragged while it's a still picture.
   */
  drag?: boolean;
  /**
   * Buffers it can do without. A device that can't render float buffers leaves
   * these out (what reads one gets black) and still shows the rest, instead of nothing.
   */
  optional?: BufferName[];
  /**
   * It leans toward a mouse resting over it (iHover: xy -1..1 from the middle, z
   * how much it's there), as a window does when you move your head. A mouse only:
   * touch has no hover. Off with reduced motion, where it stays at zero.
   */
  hover?: boolean;
  /**
   * Buffers of a fixed size in pixels, [width, height], instead of the picture's:
   * for one that keeps a few numbers rather than an image. Never resized, so a
   * value stays at its pixel. iResolution in it is still the picture's.
   */
  sizes?: Partial<Record<BufferName, [number, number]>>;
  /** At most this fraction of the screen's pixels, for heavy shaders (0.5 = half). Default 1. */
  scale?: number;
  /**
   * It has a Sound tab, sound.glsl, and the song loops after this many seconds (default 180, at most 180).
   * Make it the same length the picture loops at, so the two stay together lap after lap.
   */
  sound?: {
    seconds?: number;
    /** Play another shader's song instead of a sound.glsl of its own. Its common.glsl (the song's clock) comes too, in front of this one's, and its length unless `seconds` says otherwise. */
    from?: string;
  };
};

export const SHADERS: Record<string, ShaderDef> = {
  aurora: {
    title: "Aurora",
    stillAt: 42,
    passes: { image: {} },
  },
  "neon-drive": {
    title: "Neon Drive",
    stillAt: 31,
    // 24 bars of 4 beats at 110 bpm: SONG in common.glsl
    sound: { seconds: (24 * 4 * 60) / 110 },
    passes: { image: {} },
  },
  "night-ride": {
    title: "Night Ride",
    stillAt: 31,
    // Neon Drive's song, and its clock: a streetlight passes on every beat
    sound: { from: "neon-drive" },
    // drag to swing the camera round the bike; buffer-a keeps that camera,
    // and without it, it's the director's cuts alone
    drag: true,
    // and the camera leans a little toward a mouse resting over it
    hover: true,
    optional: ["buffer-a"],
    sizes: { "buffer-a": [4, 1] }, // four slots of camera state, not a picture
    passes: {
      "buffer-a": { iChannel0: "buffer-a" },
      image: { iChannel0: "buffer-a" },
    },
  },
  embers: {
    title: "Embers",
    stillAt: 9,
    passes: {
      "buffer-a": { iChannel0: "buffer-a" },
      image: { iChannel0: "buffer-a" },
    },
  },
};

export const shaderTitle = (slug: string) => (Object.hasOwn(SHADERS, slug) ? SHADERS[slug].title : slug);
