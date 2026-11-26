// kind: greeting. A big line of text, an optional smaller one, and confetti.
// Text is set with textContent only, never as HTML.

import type { GreetingPayload, Renderer } from "./types";

const DEFAULT_COLORS = ["#e0a845", "#ece9e0", "#e07a5f", "#8fb996", "#7aa2e0"];

const greeting: Renderer = (stage, p: GreetingPayload, ctx) => {
  const wrap = document.createElement("div");
  wrap.className = "bc-greeting";
  const h = document.createElement("h2");
  h.id = ctx.labelId;
  h.textContent = p.title;
  wrap.append(h);
  if (p.subtitle) {
    const sub = document.createElement("p");
    sub.textContent = p.subtitle;
    wrap.append(sub);
  }
  // Nothing to interact with, so a tap anywhere closes it.
  wrap.addEventListener("click", ctx.close);
  stage.append(wrap);

  if (p.effect === "none" || ctx.still) return;
  const canvas = document.createElement("canvas");
  wrap.append(canvas);
  return confetti(canvas, p.colors?.length ? p.colors : DEFAULT_COLORS);
};

export default greeting;

type Bit = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  flip: number;
  vf: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
};

/** Two cannons from the lower corners, then a second volley. Stops when the last bit falls off. */
function confetti(canvas: HTMLCanvasElement, colors: string[]): () => void {
  const g = canvas.getContext("2d");
  if (!g) return () => {};
  let W = 0;
  let H = 0;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  const bits: Bit[] = [];
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  // Fewer bits on a phone; the speed scales with the screen so they reach the middle.
  const perCannon = Math.round(Math.min(150, Math.max(60, (W * H) / 9000)));
  const reach = Math.sqrt(H) * 0.95;
  const wide = W > H * 1.2;

  function fire(fromLeft: boolean, n: number) {
    for (let i = 0; i < n; i++) {
      // up and in: steep on a phone, flatter on a wide screen so it reaches the middle
      const angle = (wide ? rand(35, 70) : rand(55, 80)) * (Math.PI / 180);
      const speed = rand(0.55, 1.05) * reach * (wide ? 1.15 : 1);
      bits.push({
        x: fromLeft ? -10 : W + 10,
        y: H + 10,
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
        vy: -Math.sin(angle) * speed,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.25, 0.25),
        flip: rand(0, Math.PI * 2),
        vf: rand(0.08, 0.2),
        w: rand(6, 11),
        h: rand(3, 6),
        color: colors[(Math.random() * colors.length) | 0],
        round: Math.random() < 0.2,
      });
    }
  }

  fire(true, perCannon);
  fire(false, perCannon);
  const volley = setTimeout(() => {
    fire(true, perCannon >> 1);
    fire(false, perCannon >> 1);
  }, 1100);

  let raf = 0;
  let last = performance.now();
  let pending = true; // the second volley hasn't fired yet
  setTimeout(() => (pending = false), 1200);

  function frame(now: number) {
    const dt = Math.min(2, (now - last) / 16.67); // in 60fps frames; caps a stalled tab
    last = now;
    g!.clearRect(0, 0, W, H);
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.vy += 0.28 * dt; // gravity
      b.vx *= Math.pow(0.985, dt); // air
      b.vy *= Math.pow(0.985, dt);
      b.x += (b.vx + Math.sin(b.flip) * 0.6) * dt; // flutter
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      b.flip += b.vf * dt;
      if (b.y > H + 40 && b.vy > 0) {
        bits.splice(i, 1);
        continue;
      }
      g!.save();
      g!.translate(b.x, b.y);
      g!.rotate(b.rot);
      g!.scale(1, Math.cos(b.flip)); // the paper turning over
      g!.fillStyle = b.color;
      if (b.round) {
        g!.beginPath();
        g!.arc(0, 0, b.h * 0.8, 0, Math.PI * 2);
        g!.fill();
      } else g!.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      g!.restore();
    }
    raf = bits.length || pending ? requestAnimationFrame(frame) : 0;
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(volley);
    removeEventListener("resize", size);
  };
}
