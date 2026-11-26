# Broadcast shaders

A `shader` broadcast plays one of the shaders in this folder full-screen. The
broadcast stores only the shader's name (`{ "shader": "embers" }`); the code
lives here, gets reviewed like any other code, and ships with the site. A
leaked admin token can pick a shader, never write one.

`../shadertoy.ts` runs them. It follows Shadertoy's rules, so a shader from
shadertoy.com can be pasted in unchanged.

## Adding one

1. Make a folder named for it: lowercase letters, digits and dashes (`new-year-2027`).
2. Put each tab in its own file there, named for the tab:
   `image.glsl` (required), `common.glsl`, `buffer-a.glsl` … `buffer-d.glsl`,
   `sound.glsl`.
   Paste each tab's code as it is, `mainImage` and all.
3. Add an entry to `SHADERS` in `index.ts`: its title, its passes, and what
   each pass's `iChannel0..3` reads. On Shadertoy that's the row of inputs
   under each tab.

   ```ts
   "new-year-2027": {
     title: "New Year 2027",
     credit: { by: "Someone", link: "https://www.shadertoy.com/view/XXXXXX", licence: "CC BY-NC-SA 3.0" },
     stillAt: 12,            // the frame shown when motion is off
     scale: 0.75,            // optional: render at most 75% of the pixels, for a heavy one
     sound: { seconds: 48 }, // optional: it has sound.glsl, and the song loops after 48 s
     passes: {
       "buffer-a": { iChannel0: "buffer-a" },                        // reads its own last frame
       image: { iChannel0: "buffer-a", iChannel1: { src: "buffer-a", filter: "nearest" } },
     },
   },
   ```

4. Run `yarn dev`, open `/admin/broadcast/`, choose "new shader", pick it and
   press preview. A shader that doesn't compile closes at once, and the
   browser console shows the GLSL error (source 0 is the pass, 1 is Common).

The Worker checks only the name's shape, so a new shader needs a site
deploy, not a Worker one.

## What runs, and what doesn't yet

Supported: Image, Common and Buffers A–D (float, each readable by any pass,
itself included), with linear or nearest filtering and clamp or repeat
wrapping per input; and the Sound tab. All the usual uniforms are there,
including iMouse (click and drag) and iDate.

Not yet: texture, keyboard, webcam, music and video inputs; Cubemap and
Volume passes. A shader that uses any of these won't look
right until it's added to the runner. If the shader is too heavy or needs
those, record it and use a `video` broadcast instead.

## Sound

`sound.glsl` is Shadertoy's Sound tab: `vec2 mainSound(int samp, float time)`
(or the older `mainSound(float time)`) returns left and right, -1 to 1, at
44.1 kHz, with Common in front of it like every pass. The whole song is
rendered on the GPU once, ahead, a block a frame (`neon-drive`'s 52 s took
about half a second on a laptop), then loops through Web Audio.

- It starts silent, with a "sound on" button. Browsers only allow sound after
  a tap, and a song nobody asked for would be rude anyway. With motion off,
  the button shows once they press play.
- While it plays, the picture's iTime follows the audio, latency included, so
  the two stay together. Put the tempo and the song's plan in `common.glsl`
  and have both read it: then the picture can hit the kick (`neon-drive` does).
- Set `sound.seconds` to the length the picture loops at, so they stay
  together lap after lap.
- Two pictures can share one song: `sound: { from: "neon-drive" }` plays that
  shader's `sound.glsl`, puts its `common.glsl` (the song's clock) in front of
  this one's, and takes its length. `night-ride` does this.
- A Sound tab that doesn't compile costs the sound, not the picture: the
  console says why. No float rendering on the device: no sound button.
- Make a song for here, or one you have the rights to. A recreation of
  someone's song is their song.

## Taking a shader from Shadertoy

Shadertoy's default licence is CC BY-NC-SA 3.0 unless the author says
otherwise. Read what the author wrote at the top of the code, put them in
`credit` (it shows in the corner of the overlay, linked), and keep their
header comment in the file. A shader that recreates someone else's song,
artwork or characters brings their rights too, not only the shader author's.

## On the visitor's device

- It renders at most 1920×1080 pixels, and drops the resolution, down to 35%,
  when frames go under about 40 a second. It climbs back when there's room.
- It compiles in the background where the browser can, so the page doesn't
  freeze, and fades in once it's ready.
- No WebGL2, no float buffers, a compile error or a lost GPU context closes
  the overlay quietly.
- With reduced motion or the site's quiet mode, it shows the frame at
  `stillAt` with a play button.
- Time stops while the tab is hidden and carries on when it's back.
- Closing it frees the GPU at once.
