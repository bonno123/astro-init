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
     drag: true,             // optional: it answers to dragging (iMouse); see Dragging below
     hover: true,            // optional: it leans toward a resting mouse (iHover); see Dragging below
     optional: ["buffer-a"], // optional: buffers it can do without where float buffers can't render
     sizes: { "buffer-a": [4, 1] }, // optional: a buffer this many pixels, for a few numbers of state
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

Beyond Shadertoy, two things for buffers. `sizes` gives one a fixed size in
pixels instead of the picture's, for a buffer that keeps state (a camera, a
score) rather than an image: a few pixels cost nothing, where a screen-sized
float buffer is about 1 ms a frame at 1440p and tens of MB of GPU memory. It's never
resized, so read it with `texelFetch` at fixed pixels; `iResolution` in it is
still the picture's. And `optional` names buffers the shader can do without:
on a device that can't render float buffers they're left out, and what reads
one gets black, instead of the shader not showing at all.

Not yet: texture, keyboard, webcam, music and video inputs; Cubemap and
Volume passes. A shader that uses any of these won't look
right until it's added to the runner. If the shader is too heavy or needs
those, record it and use a `video` broadcast instead.

## Dragging

`iMouse` follows a mouse or a finger on the picture (the page doesn't scroll
under it). Every press and release reaches the shader, one a frame, so a quick
tap or a double tap isn't lost between two frames. Set `drag: true` on a shader
that does something with it, and:

- the cursor over it is a grab hand, and a first-time visitor sees "drag to
  look around" for a few seconds (once, remembered in localStorage);
- with motion off, the still frame can be dragged too: the runner redraws that
  same moment while it's held and for 2 s after, and nothing else moves.

`night-ride` swings its camera round the bike. `buffer-a.glsl` keeps that
camera in a 4×1 buffer: the angles, a flick's momentum, how long since it was
let go. A tap does nothing, a double tap or 4 s alone hands it back to the
director's cuts, and on a still frame it stays where it's left. Without float
buffers the buffer is left out and it's the director's cuts alone, no cursor
and no hint.

Measure a drag from where it began (`iMouse.zw`), not frame to frame, or a
device with 16-bit buffers rounds its way into a slow drift.

### Hover

Shadertoy has no hover: `iMouse` only moves while a button is down. Set
`hover: true` and the runner fills `iHover`, a mouse resting over the picture,
eased over about half a second: `xy` from -1 to 1 across and up from the
middle, `z` how much it's there (0 to 1: it fades in when the mouse arrives,
and out when it leaves or presses to drag). `night-ride` slides its camera up
to 45 cm toward it, still looking at the same point, so the bike shifts
against the street behind it, like moving your head at a window. A mouse only (touch has no
hover), and off with reduced motion: that's parallax, the kind of motion it
asks to be spared. It needs no buffer, so it works on every device.

## Sound

`sound.glsl` is Shadertoy's Sound tab: `vec2 mainSound(int samp, float time)`
(or the older `mainSound(float time)`) returns left and right, -1 to 1, at
44.1 kHz, with Common in front of it like every pass. The whole song is
rendered on the GPU once, ahead, a block a frame (`neon-drive`'s 52 s took
about half a second on a laptop), then loops through Web Audio.

- It starts silent, with a sound button (an icon under the close button).
  Browsers only allow sound after a tap, and a song nobody asked for would be
  rude anyway. With motion off, the button shows once they press play.
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

- It draws at most 60 frames a second, even on a 90 or 120 Hz screen: a
  shader moves like film, and the extra frames would only double the GPU's
  work, and the fan and the battery with it.
- It renders at most 1920×1080 pixels, and drops the resolution, down to 35%,
  when frames go under about 40 a second. It climbs back when there's room.
  On a touch screen it starts at 60% (about a third of the pixels) and climbs
  from there. Frames slower than 100 ms drop it at once, without waiting for an
  average: a GPU that busy freezes the whole phone, not only the page.
- Still under about 15 a second at 35%, it gives up: it stops on a still
  picture of where it was, with no dragging, and logs why to the console. The
  song can still play over it.
- The song is rendered after the picture's first second, not as it starts, so
  it doesn't add to the heaviest frames.
- On a touch screen every pass is compiled with `#define ST_LITE 1`, so a heavy
  shader can do less on a phone: `#ifdef ST_LITE` around cheaper constants.
  `night-ride` marches 56 steps instead of 90, mirrors the city only within
  18 m, and has fewer lamps' haze and one sheet of rain fewer.
- A heavy one can still lag a slow phone for a few frames first. Measure it
  (`night-ride` takes about 13 ms a frame at 2560×1440 on the laptop it was
  made on, dragged or not) and look for the usual wins: loops over fewer lights, shorter
  marches for reflections, stopping rays that can't hit anything, long strides
  through empty space. Or set `scale`.
- Shadertoy measures the screen in picture heights, which on a phone held
  upright crops a scene to a sliver. `night-ride` uses `frameUnit()` (its
  common.glsl) instead: the height, or on a tall screen a little less than
  the width, so a phone sees most of what a laptop does.
- It compiles in the background where the browser can, so the page doesn't
  freeze, and fades in once it's ready.
- No WebGL2, a compile error or a lost GPU context closes the overlay quietly;
  so does no float rendering, for a shader with a buffer that isn't
  `optional`. Where only 16-bit float rendering is there, buffers are 16-bit.
- With reduced motion or the site's quiet mode, it shows the frame at
  `stillAt` with a play button.
- Time stops while the tab is hidden and carries on when it's back.
- Closing it frees the GPU at once.
