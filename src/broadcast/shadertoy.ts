// A small WebGL2 runner for Shadertoy-style shaders, so a shader written on
// shadertoy.com runs here unchanged. It keeps Shadertoy's contract:
//
//   - each pass is a `void mainImage(out vec4 fragColor, in vec2 fragCoord)`
//   - the Common tab is put in front of every pass
//   - the same uniforms: iResolution, iTime, iTimeDelta, iFrameRate, iFrame,
//     iMouse, iDate, iSampleRate, iChannelTime[4], iChannelResolution[4], iChannel0..3
//   - Buffers A-D are float textures, run in order A, B, C, D, then Image. A pass
//     reading a buffer that already ran this frame gets this frame's result;
//     reading itself or a later one gets last frame's.
//   - the Sound tab is a `vec2 mainSound(int samp, float time)` (or the older
//     `mainSound(float time)`) returning left and right, -1..1, at 44.1 kHz. It's
//     rendered once, ahead, and loops. While it plays, iTime follows the audio, so
//     the picture stays on the beat.
//
// Not yet: texture, keyboard, cubemap and volume inputs and passes.
//
// It also looks after the things a full-screen shader on a visitor's phone
// needs: it draws at most 60 frames a second, renders at a lower resolution
// when frames get slow, compiles
// without freezing the page where the browser allows, keeps time across a
// hidden tab, and frees the GPU the moment it's destroyed.

export const PASSES = ["buffer-a", "buffer-b", "buffer-c", "buffer-d", "image"] as const;
export type PassName = (typeof PASSES)[number];
export type BufferName = Exclude<PassName, "image">;

export type Channel = { src: BufferName; filter: "linear" | "nearest"; wrap: "clamp" | "repeat" };
export type ToyPass = { name: PassName; code: string; channels: (Channel | null)[] };
/** The Sound tab's code, and how long the song is before it loops (at most 180 s, Shadertoy's length). */
export type ToySound = { code: string; seconds: number };
/** Passes in run order, Image last. */
export type ToyProgram = { common: string; passes: ToyPass[]; sound?: ToySound | null };

export type ToyOptions = {
  /** At most this fraction of the screen's pixels, for heavy shaders. Default 1. */
  scale?: number;
  /** The GPU dropped the context (driver reset, too much memory). Nothing more will draw. */
  onLost: () => void;
};

export type Toy = {
  /** Runs it, carrying on from where still() left it. */
  play(): void;
  /** Draws the frame at this time and stops there. Buffer shaders get a second of frames to fill in first. */
  still(at: number): void;
  /** Stops and frees everything, the GL context included. */
  destroy(): void;
  /** Null when the shader has no Sound tab, or this device can't render one. */
  sound: ToyAudio | null;
};

export type ToyAudio = {
  /**
   * Starts the song where the picture is. Call it from the visitor's tap: browsers
   * only let sound start from one. Resolves once it's playing; the song is
   * rendered in the background from the first play(), so that's usually at once.
   */
  start(): Promise<void>;
  stop(): void;
};

/** Never render more than this many pixels, however big the screen. */
const MAX_PIXELS = 1920 * 1080;
/** How far it will drop the resolution to keep up. */
const MIN_QUALITY = 0.35;
/** The fastest it draws: one frame in this many ms. */
const FRAME = 1000 / 60;
/** Shadertoy's sample rate. The browser resamples to the device's. */
const SAMPLE_RATE = 44100;
/** The song is rendered this many samples at a time, one block a frame: 65,536, about 1.5 s of audio. */
const SOUND_W = 512;
const SOUND_H = 128;

const VERT = `#version 300 es
void main() {
  // one triangle that covers the screen
  gl_Position = vec4(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform float iFrameRate;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iSampleRate;
uniform float iChannelTime[4];
uniform vec3 iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
out vec4 st_fragColor;
`;

// In compile errors, source 1 is the Common tab and source 0 is the pass, each from line 1.
const fragment = (common: string, pass: ToyPass) =>
  `${HEAD}
${common ? `#line 1 1\n${common}\n` : ""}#line 1 0
${pass.code}
void main() {
  st_fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  mainImage(st_fragColor, gl_FragCoord.xy);${pass.name === "image" ? "\n  st_fragColor.a = 1.0;" : ""}
}`;

// One block of samples a draw: each pixel is one sample, left in red and right in green.
const soundFragment = (common: string, code: string) => {
  const call = /mainSound\s*\(\s*(in\s+)?float/.test(code) ? "mainSound(time)" : "mainSound(samp, time)";
  return `${HEAD}uniform int st_offset;
${common ? `#line 1 1\n${common}\n` : ""}#line 1 0
${code}
void main() {
  int samp = st_offset + int(gl_FragCoord.y) * ${SOUND_W} + int(gl_FragCoord.x);
  float time = float(samp) / iSampleRate;
  st_fragColor = vec4(clamp(${call}, -1.0, 1.0), 0.0, 1.0);
}`;
};

const UNIFORMS = [
  "iResolution",
  "iTime",
  "iTimeDelta",
  "iFrameRate",
  "iFrame",
  "iMouse",
  "iDate",
  "iSampleRate",
  "iChannelTime",
  "iChannelResolution",
] as const;

type Built = { pass: ToyPass; prog: WebGLProgram; fs: WebGLShader; u: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null> };
type Target = { tex: WebGLTexture[]; fbo: WebGLFramebuffer[]; read: number };

const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));

export async function createToy(canvas: HTMLCanvasElement, program: ToyProgram, opts: ToyOptions): Promise<Toy> {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error("WebGL2 isn't available here.");
  const lose = gl.getExtension("WEBGL_lose_context");

  let lost = false;
  const onLost = () => {
    lost = true;
    opts.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  try {
    return await build(gl, canvas, program, opts, () => lost, () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      lose?.loseContext();
    });
  } catch (e) {
    canvas.removeEventListener("webglcontextlost", onLost);
    lose?.loseContext();
    throw e;
  }
}

async function build(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
  program: ToyProgram,
  opts: ToyOptions,
  isLost: () => boolean,
  release: () => void,
): Promise<Toy> {
  const buffers = program.passes.filter((p): p is ToyPass & { name: BufferName } => p.name !== "image");
  // Shadertoy's buffers are 32-bit float. Without linear filtering for those, 16-bit, which always filters.
  let format: number = gl.RGBA32F;
  const floats = Boolean(gl.getExtension("EXT_color_buffer_float"));
  if (buffers.length) {
    if (!floats) throw new Error("This GPU can't render to float buffers.");
    if (!gl.getExtension("OES_texture_float_linear")) format = gl.RGBA16F;
  }
  // The song is read back as floats too. Without them it plays silent rather than not at all.
  const song = program.sound && floats && typeof AudioBuffer === "function" ? program.sound : null;

  // ---- compile and link every pass, then wait for all of them at once ----

  const shaders: WebGLShader[] = [];
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    shaders.push(s);
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const built: Built[] = program.passes.map((pass) => {
    const fs = compile(gl.FRAGMENT_SHADER, fragment(program.common, pass));
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return { pass, prog, fs, u: {} as Built["u"] };
  });
  let soundProg: WebGLProgram | null = null;
  let soundFs: WebGLShader | null = null;
  if (song) {
    soundFs = compile(gl.FRAGMENT_SHADER, soundFragment(program.common, song.code));
    soundProg = gl.createProgram()!;
    gl.attachShader(soundProg, vs);
    gl.attachShader(soundProg, soundFs);
    gl.linkProgram(soundProg);
  }
  const programs = [...built.map((b) => b.prog), ...(soundProg ? [soundProg] : [])];

  // Where supported, the driver compiles in the background and the page keeps running.
  const par = gl.getExtension("KHR_parallel_shader_compile");
  if (par) {
    const started = performance.now();
    while (!programs.every((p) => gl.getProgramParameter(p, par.COMPLETION_STATUS_KHR))) {
      if (performance.now() - started > 30_000) throw new Error("The shader took too long to compile.");
      await nextFrame();
    }
  }
  if (isLost()) throw new Error("The GL context was lost.");
  for (const b of built) {
    if (gl.getProgramParameter(b.prog, gl.LINK_STATUS)) continue;
    const log = gl.getShaderInfoLog(b.fs) || gl.getProgramInfoLog(b.prog) || "no log";
    throw new Error(`${b.pass.name} didn't compile (source 0 is the pass, 1 is Common):\n${log}`);
  }
  // A Sound tab that doesn't compile costs the sound, not the picture. The console says why.
  if (soundProg && !gl.getProgramParameter(soundProg, gl.LINK_STATUS)) {
    const log = gl.getShaderInfoLog(soundFs!) || gl.getProgramInfoLog(soundProg) || "no log";
    console.error(`sound didn't compile (source 0 is the pass, 1 is Common):\n${log}`);
    gl.deleteProgram(soundProg);
    soundProg = null;
  }
  for (const b of built) {
    for (const name of UNIFORMS) b.u[name] = gl.getUniformLocation(b.prog, name);
    gl.useProgram(b.prog);
    for (let i = 0; i < 4; i++) gl.uniform1i(gl.getUniformLocation(b.prog, `iChannel${i}`), i);
  }

  // Drawing without vertex buffers still needs a vertex array bound.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // What an unconnected channel reads: one black pixel.
  const blank = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Filter and wrap belong to the input, not the texture, as on Shadertoy: one sampler object per combination.
  const samplers = new Map<string, WebGLSampler>();
  const sampler = (c: Channel) => {
    const key = `${c.filter}/${c.wrap}`;
    let s = samplers.get(key);
    if (!s) {
      s = gl.createSampler()!;
      const f = c.filter === "nearest" ? gl.NEAREST : gl.LINEAR;
      const w = c.wrap === "repeat" ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.samplerParameteri(s, gl.TEXTURE_MIN_FILTER, f);
      gl.samplerParameteri(s, gl.TEXTURE_MAG_FILTER, f);
      gl.samplerParameteri(s, gl.TEXTURE_WRAP_S, w);
      gl.samplerParameteri(s, gl.TEXTURE_WRAP_T, w);
      samplers.set(key, s);
    }
    return s;
  };

  // ---- buffers: two textures each, one read while the other is written ----

  const targets = new Map<BufferName, Target>();
  const pair = (w: number, h: number): Pick<Target, "tex" | "fbo"> => {
    const tex: WebGLTexture[] = [];
    const fbo: WebGLFramebuffer[] = [];
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, format, w, h, 0, gl.RGBA, gl.FLOAT, null); // starts at zero
      const f = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error("This GPU can't use the float buffers this shader needs.");
      }
      tex.push(t);
      fbo.push(f);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo };
  };
  const drop = (t: Pick<Target, "tex" | "fbo">) => {
    t.tex.forEach((x) => gl.deleteTexture(x));
    t.fbo.forEach((x) => gl.deleteFramebuffer(x));
  };

  // ---- size: the canvas's CSS size, times the device's pixel ratio, times quality ----

  let W = 0;
  let H = 0;
  let quality = 1;

  function fit(): boolean {
    const cw = Math.max(1, canvas.clientWidth);
    const ch = Math.max(1, canvas.clientHeight);
    let s = Math.min(devicePixelRatio || 1, 2) * Math.min(1, opts.scale ?? 1) * quality;
    s = Math.min(s, Math.sqrt(MAX_PIXELS / (cw * ch)));
    const w = Math.max(1, Math.round(cw * s));
    const h = Math.max(1, Math.round(ch * s));
    if (w === W && h === H) return false;
    canvas.width = w;
    canvas.height = h;
    for (const b of buffers) {
      const next = pair(w, h);
      const old = targets.get(b.name);
      if (old) {
        // Keep what's there, stretched, so a feedback shader doesn't start over on a resize.
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, old.fbo[old.read]);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, next.fbo[0]);
        gl.blitFramebuffer(0, 0, W, H, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        drop(old);
      }
      targets.set(b.name, { ...next, read: 0 });
    }
    W = w;
    H = h;
    return true;
  }
  fit();

  // ---- iMouse, as Shadertoy has it: xy while down, zw where it went down; z < 0 once up, w > 0 on the first frame only ----

  const mouse = [0, 0, 0, 0];
  let fresh = false;
  const at = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) * W) / r.width, ((r.bottom - e.clientY) * H) / r.height];
  };
  const onDown = (e: PointerEvent) => {
    const [x, y] = at(e);
    mouse.splice(0, 4, x, y, x, y);
    fresh = true;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (mouse[2] <= 0) return;
    const [x, y] = at(e);
    mouse[0] = x;
    mouse[1] = y;
  };
  const onUp = () => {
    mouse[2] = -Math.abs(mouse[2]);
    mouse[3] = -Math.abs(mouse[3]);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // ---- one frame: every pass in order ----

  let time = 0;
  let frame = 0;
  let fps = 60;
  const res = new Float32Array(12);
  const chTime = new Float32Array(4);

  function draw(t: number, dt: number) {
    const d = new Date();
    const secs = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
    chTime.fill(t);
    for (const b of built) {
      const target = b.pass.name === "image" ? null : targets.get(b.pass.name)!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo[1 - target.read] : null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(b.prog);
      for (let i = 0; i < 4; i++) {
        const c = b.pass.channels[i];
        gl.activeTexture(gl.TEXTURE0 + i);
        const src = c && targets.get(c.src);
        if (c && src) {
          gl.bindTexture(gl.TEXTURE_2D, src.tex[src.read]);
          gl.bindSampler(i, sampler(c));
          res.set([W, H, 1], i * 3);
        } else {
          gl.bindTexture(gl.TEXTURE_2D, blank);
          gl.bindSampler(i, null);
          res.set([1, 1, 1], i * 3);
        }
      }
      const u = b.u;
      gl.uniform3f(u.iResolution, W, H, 1);
      gl.uniform1f(u.iTime, t);
      gl.uniform1f(u.iTimeDelta, dt);
      gl.uniform1f(u.iFrameRate, fps);
      gl.uniform1i(u.iFrame, frame);
      gl.uniform4f(u.iMouse, mouse[0], mouse[1], mouse[2], fresh ? mouse[3] : -Math.abs(mouse[3]));
      gl.uniform4f(u.iDate, d.getFullYear(), d.getMonth(), d.getDate(), secs);
      gl.uniform1f(u.iSampleRate, 44100);
      gl.uniform1fv(u.iChannelTime, chTime);
      gl.uniform3fv(u.iChannelResolution, res);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (target) target.read = 1 - target.read;
    }
    fresh = false;
    frame++;
  }

  // ---- the loop, and keeping up: measure 30 frames at a time, and trade resolution for speed ----

  let raf = 0;
  let last = 0; // when the last frame was drawn
  let seen = 0; // when the browser last offered one
  let owed = 0; // ms of frames due at 60 a second, not yet drawn
  let mode: "idle" | "playing" | "still" = "idle";
  let stillAt = 0;
  let windowN = 0;
  let windowSum = 0;
  let goodWindows = 0;
  let settle = 0; // frames to ignore after a resize, which costs a frame or two itself

  function resized() {
    if (!fit()) return;
    settle = 10;
    if (mode === "still") renderStill(); // a resize clears the canvas
  }

  function adapt(dt: number) {
    if (pumping) settle = 10; // rendering the song costs frames that aren't the shader's
    if (settle > 0) return void settle--;
    if (dt >= 0.1) return; // a hitch (a tab switch, a GC), not the steady rate
    windowSum += dt;
    if (++windowN < 30) return;
    const avg = windowSum / windowN;
    windowN = 0;
    windowSum = 0;
    fps = 1 / avg;
    if (avg > 1 / 40 && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality * 0.8);
      goodWindows = 0;
      resized();
    } else if (avg < 1 / 55 && quality < 1) {
      // Climb back slowly, only after a couple of seconds of headroom, so it doesn't see-saw.
      if (++goodWindows >= 4) {
        quality = Math.min(1, quality * 1.12);
        goodWindows = 0;
        resized();
      }
    } else goodWindows = 0;
  }

  function tick(now: number) {
    raf = requestAnimationFrame(tick);
    // At most 60 frames a second. A 90 or 120 Hz screen offers more, and drawing
    // them all would double the GPU's work (and the fan, and the battery) for a
    // picture that moves like film anyway. Keeping count, rather than just
    // skipping every other one, gets 60 out of a 90 Hz screen too, not 45.
    owed = Math.min(owed + (seen ? now - seen : FRAME), FRAME);
    seen = now;
    if (owed < FRAME - 2) return;
    owed -= FRAME;
    // A hidden tab gets no frames; when it's back, time carries on instead of jumping.
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    const was = time;
    time += dt;
    // While the song plays, follow it. Gently: the audio clock moves in steps, and the picture shouldn't.
    const heard = clock();
    if (heard !== null) {
      const off = heard - time;
      time = Math.abs(off) > 0.25 ? heard : time + off * 0.1;
    }
    draw(time, Math.min(0.1, Math.max(0, time - was)));
    adapt(dt);
  }

  function renderStill() {
    const frames = buffers.length ? 60 : 1;
    frame = 0;
    for (let i = 0; i < frames; i++) draw(Math.max(0, stillAt - (frames - 1 - i) / 60), 1 / 60);
    time = stillAt;
  }

  const ro = new ResizeObserver(() => resized());
  ro.observe(canvas);

  let destroyed = false;

  // ---- the Sound tab: rendered ahead, a block a frame, then looped through Web Audio ----

  /** The song's time while it's heard, which the picture follows; null when it isn't playing. */
  let clock: () => number | null = () => null;
  /** Rendering the song now. */
  let pumping = false;
  /** Starts rendering the song, the first time it's called. */
  let prepare = () => {};
  let freeSound = () => {};
  const audio = soundProg && song ? soundSetup(soundProg, song) : null;

  function soundSetup(sp: WebGLProgram, s: ToySound): ToyAudio | null {
    const total = Math.round(Math.min(180, Math.max(1, s.seconds)) * SAMPLE_RATE);
    const BLOCK = SOUND_W * SOUND_H;
    let buf: AudioBuffer;
    try {
      buf = new AudioBuffer({ length: total, numberOfChannels: 2, sampleRate: SAMPLE_RATE });
    } catch {
      return null;
    }
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, SOUND_W, SOUND_H, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Read back through a buffer and a fence, so the page never waits on the GPU.
    const pbo = gl.createBuffer()!;
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, BLOCK * 16, gl.STREAM_READ);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    const px = new Float32Array(BLOCK * 4);
    const uOffset = gl.getUniformLocation(sp, "st_offset");
    gl.useProgram(sp);
    gl.uniform1f(gl.getUniformLocation(sp, "iSampleRate"), SAMPLE_RATE);
    for (let i = 0; i < 4; i++) gl.uniform1i(gl.getUniformLocation(sp, `iChannel${i}`), i);

    let next = 0;
    let pending: { sync: WebGLSync; at: number } | null = null;
    let pumpRaf = 0;
    let started = false;
    let resolveReady!: () => void;
    let rejectReady!: (e: Error) => void;
    const ready = new Promise<void>((res, rej) => {
      resolveReady = res;
      rejectReady = rej;
    });
    ready.catch(() => {}); // nobody may be waiting

    const fail = (why: string) => {
      pumping = false;
      rejectReady(new Error(why));
    };

    function pump() {
      pumpRaf = 0;
      if (destroyed) return;
      if (isLost()) return fail("The GL context was lost.");
      if (pending) {
        const st = gl.clientWaitSync(pending.sync, 0, 0);
        if (st === gl.WAIT_FAILED) return fail("Reading the song back failed.");
        if (st === gl.TIMEOUT_EXPIRED) return void (pumpRaf = requestAnimationFrame(pump));
        gl.deleteSync(pending.sync);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        const n = Math.min(BLOCK, total - pending.at);
        for (let i = 0; i < n; i++) {
          left[pending.at + i] = px[i * 4];
          right[pending.at + i] = px[i * 4 + 1];
        }
        pending = null;
      }
      if (next < total) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, SOUND_W, SOUND_H);
        gl.useProgram(sp);
        for (let i = 0; i < 4; i++) {
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, blank);
          gl.bindSampler(i, null);
        }
        gl.uniform1i(uOffset, next);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
        gl.readPixels(0, 0, SOUND_W, SOUND_H, gl.RGBA, gl.FLOAT, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        pending = { sync: gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!, at: next };
        gl.flush();
        next += BLOCK;
      }
      if (pending) pumpRaf = requestAnimationFrame(pump);
      else {
        pumping = false;
        resolveReady();
      }
    }

    prepare = () => {
      if (started) return;
      started = true;
      if (!complete) return fail("This GPU can't render the song.");
      pumping = true;
      pumpRaf = requestAnimationFrame(pump);
    };

    let ac: AudioContext | null = null;
    let src: AudioBufferSourceNode | null = null;
    let out: GainNode | null = null;
    let on = false;
    let anchor: { base: number; at: number; lat: number } | null = null;

    clock = () => (anchor && ac?.state === "running" ? anchor.base + (ac.currentTime - anchor.at - anchor.lat) : null);

    // A quick fade, so stopping doesn't click.
    const halt = () => {
      if (ac && src && out) {
        const now = ac.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + 0.08);
        src.stop(now + 0.1);
      }
      src = null;
      out = null;
      anchor = null;
    };

    // Starts it so that what's heard is where the picture is: a moment ahead, plus the output's latency.
    const begin = (a: AudioContext) => {
      halt();
      const lead = 0.05;
      const lat = (a.outputLatency || 0) + (a.baseLatency || 0);
      const at = a.currentTime + lead;
      const base = time + lead + lat;
      out = a.createGain();
      out.gain.setValueAtTime(0, at);
      out.gain.linearRampToValueAtTime(1, at + 0.06);
      out.connect(a.destination);
      src = a.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.connect(out);
      src.start(at, base % buf.duration);
      anchor = { base, at, lat };
    };

    // A hidden tab stops the picture; the song waits with it.
    const onVis = () => {
      if (!ac || !on) return;
      void (document.hidden ? ac.suspend() : ac.resume());
    };
    document.addEventListener("visibilitychange", onVis);

    freeSound = () => {
      on = false;
      cancelAnimationFrame(pumpRaf);
      document.removeEventListener("visibilitychange", onVis);
      halt();
      const a = ac;
      if (a) setTimeout(() => void a.close().catch(() => {}), 120);
      if (!isLost()) {
        if (pending) gl.deleteSync(pending.sync);
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(tex);
        gl.deleteBuffer(pbo);
        gl.deleteProgram(sp);
      }
      fail("It was closed.");
    };

    return {
      start() {
        if (destroyed || isLost()) return Promise.reject(new Error("It's closed."));
        on = true;
        // iOS: sound the visitor asked for plays with the ringer switch off, as a video's does.
        const session = (navigator as any).audioSession;
        try {
          if (session && session.type !== "playback") session.type = "playback";
        } catch {
          /* older Safari */
        }
        const a = (ac ??= new AudioContext());
        const resumed = a.resume(); // now, inside the tap, or the browser refuses
        prepare();
        return Promise.all([ready, resumed]).then(() => {
          if (on && !destroyed) begin(a);
        });
      },
      stop() {
        on = false;
        halt();
        const a = ac;
        // Once the fade is done, let the audio hardware rest.
        if (a) setTimeout(() => !on && a.state === "running" && void a.suspend(), 200);
      },
    };
  }
  return {
    sound: audio,
    play() {
      if (destroyed || isLost() || mode === "playing") return;
      mode = "playing";
      last = 0;
      seen = 0;
      owed = 0;
      raf = requestAnimationFrame(tick);
      prepare(); // so the sound is ready by the time someone asks for it
    },
    still(t) {
      if (destroyed || isLost()) return;
      cancelAnimationFrame(raf);
      mode = "still";
      stillAt = Math.max(0, t);
      renderStill();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      if (!isLost()) {
        targets.forEach(drop);
        samplers.forEach((s) => gl.deleteSampler(s));
        built.forEach((b) => gl.deleteProgram(b.prog));
        shaders.forEach((s) => gl.deleteShader(s));
        gl.deleteTexture(blank);
        gl.deleteVertexArray(vao);
      }
      freeSound();
      release(); // loses the context, so the GPU memory goes now rather than at the next GC
    },
  };
}
