<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { api, ApiError } from "~/utils/api";

type Mark = {
  id: number | string;
  kind: "draw" | "text";
  strokes: number[][] | null;
  text: string | null;
  name: string | null;
  place: string | null;
  replied: boolean;
  createdAt: string;
  mine?: boolean;
};

const GRID = 1000;
const MINE_KEY = "visitors-book-mine";

const marks = ref<Mark[]>([]);
const total = ref(0);
const since = ref<string | null>(null);
const loading = ref(true);
const offline = ref(false);
const more = ref(false);

/* ---------- loading the wall ---------- */
async function load(before?: number) {
  try {
    const q = new URLSearchParams({ limit: "18" });
    if (before) q.set("before", String(before));
    const res = await api<{ marks: Mark[]; total: number; since: string | null }>(`/api/marks?${q}`);
    marks.value = before ? [...marks.value, ...res.marks] : res.marks;
    total.value = res.total;
    since.value = res.since;
    more.value = res.marks.length === 18;
  } catch {
    offline.value = true;
  } finally {
    loading.value = false;
  }
}

const mine = ref<Mark[]>([]);
onMounted(() => {
  try {
    mine.value = JSON.parse(localStorage.getItem(MINE_KEY) || "[]");
  } catch {
    mine.value = [];
  }
  load();
});

// Your own marks show (to you) while they wait, until they are on the wall.
const wall = computed(() => {
  const seen = new Set(marks.value.map((m) => String(m.id)));
  return [...mine.value.filter((m) => !seen.has(String(m.id))), ...marks.value];
});

// D1 returns "YYYY-MM-DD HH:MM:SS" in UTC; Safari won't parse that without the T and Z.
const parseDb = (s: string) => new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");

const sinceLabel = computed(() =>
  since.value ? new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(parseDb(since.value)) : null,
);

function pathFor(s: number[]) {
  if (s.length === 2) return `M${s[0]} ${s[1]}l0.1 0`;
  let d = `M${s[0]} ${s[1]}`;
  for (let i = 2; i < s.length - 2; i += 2) {
    const mx = (s[i] + s[i + 2]) / 2;
    const my = (s[i + 1] + s[i + 3]) / 2;
    d += `Q${s[i]} ${s[i + 1]} ${mx} ${my}`;
  }
  return d + `L${s[s.length - 2]} ${s[s.length - 1]}`;
}

function when(iso: string) {
  const d = parseDb(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit" }).format(d);
}

/* ---------- the sheet ---------- */
const dialog = ref<HTMLDialogElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const mode = ref<"draw" | "text">("draw");
const strokes = ref<number[][]>([]);
const text = ref("");
const name = ref("");
const place = ref("");
const website = ref("");
const sending = ref(false);
const sent = ref(false);
const error = ref("");

let ctx: CanvasRenderingContext2D | null = null;
let size = 0;
let current: number[] | null = null;
const points = computed(() => strokes.value.reduce((n, s) => n + s.length / 2, 0));
const ready = computed(() => (mode.value === "draw" ? strokes.value.length > 0 : text.value.trim().length > 0));

async function open() {
  sent.value = false;
  error.value = "";
  dialog.value?.showModal();
  await nextTick();
  setupCanvas();
}

function close() {
  dialog.value?.close();
}

function setupCanvas() {
  const c = canvas.value;
  if (!c) return;
  const r = c.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  size = r.width;
  c.width = Math.round(r.width * dpr);
  c.height = Math.round(r.width * dpr);
  ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redraw();
}

function ink() {
  return getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#ece9e0";
}

function redraw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = ink();
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const k = size / GRID;
  for (const s of strokes.value) {
    ctx.beginPath();
    ctx.moveTo(s[0] * k, s[1] * k);
    if (s.length === 2) ctx.lineTo(s[0] * k + 0.1, s[1] * k);
    for (let i = 2; i < s.length - 2; i += 2) {
      ctx.quadraticCurveTo(s[i] * k, s[i + 1] * k, ((s[i] + s[i + 2]) / 2) * k, ((s[i + 1] + s[i + 3]) / 2) * k);
    }
    if (s.length > 2) ctx.lineTo(s[s.length - 2] * k, s[s.length - 1] * k);
    ctx.stroke();
  }
}

function toGrid(e: PointerEvent): [number, number] {
  const r = canvas.value!.getBoundingClientRect();
  const clamp = (v: number) => Math.max(0, Math.min(GRID, Math.round(v)));
  return [clamp(((e.clientX - r.left) / r.width) * GRID), clamp(((e.clientY - r.top) / r.height) * GRID)];
}

function down(e: PointerEvent) {
  if (points.value >= 1400 || strokes.value.length >= 60) return;
  canvas.value!.setPointerCapture(e.pointerId);
  current = [...toGrid(e)];
  strokes.value = [...strokes.value, current];
  redraw();
}

function move(e: PointerEvent) {
  if (!current) return;
  const [x, y] = toGrid(e);
  const lx = current[current.length - 2], ly = current[current.length - 1];
  // Keep only points that moved a little: smaller strokes, same shape.
  if (Math.hypot(x - lx, y - ly) < 8) return;
  if (points.value >= 1400) return up();
  current.push(x, y);
  redraw();
}

function up() {
  current = null;
}

function undo() {
  strokes.value = strokes.value.slice(0, -1);
  redraw();
}

function clear() {
  strokes.value = [];
  redraw();
}

async function toggleMode() {
  mode.value = mode.value === "draw" ? "text" : "draw";
  if (mode.value === "draw") {
    await nextTick();
    setupCanvas();
  }
}

async function pin() {
  if (!ready.value || sending.value) return;
  sending.value = true;
  error.value = "";
  const body =
    mode.value === "draw"
      ? { strokes: strokes.value, name: name.value, place: place.value, website: website.value }
      : { text: text.value, name: name.value, place: place.value, website: website.value };
  try {
    const res = await api<{ id: number }>("/api/marks", { method: "POST", json: body });
    const m: Mark = {
      id: res.id ?? `local-${Date.now()}`,
      kind: mode.value,
      strokes: mode.value === "draw" ? strokes.value : null,
      text: mode.value === "text" ? text.value.trim() : null,
      name: name.value.trim() || null,
      place: place.value.trim() || null,
      replied: false,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    mine.value = [m, ...mine.value].slice(0, 5);
    try {
      localStorage.setItem(MINE_KEY, JSON.stringify(mine.value));
    } catch {
      /* ignore */
    }
    sent.value = true;
    strokes.value = [];
    text.value = "";
  } catch (e) {
    error.value =
      e instanceof ApiError && e.status !== 404 ? e.message : "The book isn't taking marks right now. Try again later.";
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="book">
    <div class="head">
      <p class="lead">People who passed through, and what they left.</p>
      <p class="meta" v-if="total">
        {{ total }} {{ total === 1 ? "mark" : "marks" }}<template v-if="sinceLabel"> · since {{ sinceLabel }}</template>
      </p>
    </div>

    <ul class="grid" v-if="wall.length" aria-label="Marks in the visitors' book">
      <li v-for="m in wall" :key="m.id" class="tile" :class="{ mine: m.mine }">
        <svg v-if="m.kind === 'draw' && m.strokes" viewBox="0 0 1000 1000" role="img" :aria-label="`A drawing${m.name ? ' by ' + m.name : ''}`">
          <path v-for="(s, i) in m.strokes" :key="i" :d="pathFor(s)" />
        </svg>
        <p v-else class="note" :lang="/[ঀ-৿]/.test(m.text || '') ? 'bn' : undefined">{{ m.text }}</p>
        <span class="who">
          <span v-if="m.replied" class="dot" title="I replied"><span class="sr-only">I replied</span></span>
          <span class="nm">{{ m.mine ? "yours · waiting" : m.name || "unsigned" }}</span>
          <span>{{ m.place ? m.place + " · " : "" }}{{ when(m.createdAt) }}</span>
        </span>
      </li>
    </ul>

    <p v-else-if="loading" class="meta">opening the book…</p>
    <p v-else class="empty">{{ offline ? "The book is resting. Leave a mark anyway, or come back later." : "The book is new. The first page is yours." }}</p>

    <div class="actions">
      <button type="button" class="mark" @click="open">leave a mark ✎</button>
      <button v-if="more" type="button" class="link" @click="load(Number(marks[marks.length - 1]?.id))">older marks</button>
    </div>

    <dialog ref="dialog" class="sheet" aria-labelledby="mark-title" @close="sent = false">
      <form method="dialog" class="sheet-in" @submit.prevent="pin">
        <div class="sheet-head">
          <h3 id="mark-title">Leave a mark</h3>
          <button type="button" class="link" @click="close">close</button>
        </div>

        <template v-if="!sent">
          <div v-if="mode === 'draw'" class="pad-wrap">
            <canvas
              ref="canvas"
              class="pad"
              aria-label="Drawing pad. Draw with your finger or mouse."
              @pointerdown.prevent="down"
              @pointermove="move"
              @pointerup="up"
              @pointercancel="up"
            ></canvas>
            <span v-if="!strokes.length" class="hint">draw here</span>
          </div>
          <label v-else class="field">
            <span class="flabel">One line</span>
            <input v-model="text" type="text" maxlength="80" placeholder="stay slow." autofocus />
            <span class="meta right">{{ 80 - text.length }}</span>
          </label>

          <div class="tools">
            <template v-if="mode === 'draw'">
              <button type="button" class="ghost" :disabled="!strokes.length" @click="undo">undo</button>
              <button type="button" class="ghost" :disabled="!strokes.length" @click="clear">clear</button>
            </template>
            <button type="button" class="ghost" @click="toggleMode">{{ mode === "draw" ? "Aa write instead" : "✎ draw instead" }}</button>
          </div>

          <fieldset class="sign">
            <legend class="flabel">Sign it · optional</legend>
            <div class="pair">
              <input v-model="name" type="text" maxlength="40" placeholder="name" autocomplete="nickname" aria-label="Your name" />
              <input v-model="place" type="text" maxlength="40" placeholder="from" aria-label="Where you're from" />
            </div>
          </fieldset>

          <label class="hp" aria-hidden="true">Website <input v-model="website" type="text" tabindex="-1" autocomplete="off" /></label>

          <p v-if="error" class="err" role="alert">{{ error }}</p>

          <button type="submit" class="send" :disabled="!ready || sending">{{ sending ? "pinning…" : "pin it to the wall" }}</button>
          <p class="meta">Marks show up after I've seen them, usually the same day.</p>
        </template>

        <div v-else class="done" role="status">
          <p class="thanks">Pinned. Thank you.</p>
          <p class="meta">It's on the wall for you now, and for everyone once I've seen it.</p>
          <button type="button" class="ghost" @click="close">back to the page</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.book {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lead {
  font-family: var(--font-serif);
  font-size: 22px;
  line-height: 1.35;
}

.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--line);
  border-left: 1px solid var(--line);
}

@media (min-width: 900px) {
  .grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.tile {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  min-width: 0;
}

.tile.mine {
  background: rgb(224 168 69 / 0.04);
}

.tile svg {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.tile path {
  fill: none;
  stroke: var(--ink-soft);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.note {
  flex: 1;
  display: flex;
  align-items: center;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 15px;
  line-height: 1.3;
  color: var(--ink-soft);
  overflow-wrap: anywhere;
  overflow: hidden;
}

.note[lang="bn"] {
  font-family: var(--font-bangla);
  font-style: normal;
}

.who {
  display: flex;
  flex-direction: column;
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.4;
  color: var(--muted);
  position: relative;
}

.who .nm {
  color: var(--ink-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dot {
  position: absolute;
  right: 0;
  top: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.empty {
  padding: 32px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  font-family: var(--font-serif);
  font-style: italic;
  color: var(--ink-body);
}

.actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.mark {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid var(--line-strong);
  border-radius: 22px;
  background: none;
  font-size: 15px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.mark:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
}

.link:hover {
  color: var(--accent);
}

/* ---------- sheet ---------- */
.sheet {
  width: min(440px, 100%);
  max-width: 100%;
  max-height: 100dvh;
  margin: auto auto 0;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
  background: var(--bg-raised);
  color: var(--ink);
}

@media (min-width: 640px) {
  .sheet {
    margin: auto;
    border-bottom: 1px solid var(--line-strong);
    border-radius: 10px;
  }
}

.sheet::backdrop {
  background: rgb(5 5 4 / 0.7);
}

.sheet[open] {
  animation: rise 0.25s ease-out;
}

@keyframes rise {
  from {
    transform: translateY(24px);
    opacity: 0;
  }
}

.sheet-in {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
}

.sheet-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.sheet-head h3 {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 22px;
}

.pad-wrap {
  position: relative;
}

.pad {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
  background-image: radial-gradient(circle, #2c2d27 1px, transparent 1.2px);
  background-size: 20px 20px;
  touch-action: none;
  cursor: crosshair;
}

.hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  font-family: var(--font-mono);
  font-size: 12px;
  color: #5d5c55;
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ghost {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--line-strong);
  border-radius: 17px;
  background: none;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
}

.ghost:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.ghost:disabled {
  opacity: 0.4;
  cursor: default;
}

.sign {
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flabel {
  padding: 0;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

input {
  width: 100%;
  padding: 8px 0;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  border-radius: 0;
  background: transparent;
  font-size: 16px;
}

.field input {
  font-family: var(--font-serif);
  font-size: 20px;
}

input:focus {
  outline: none;
  border-bottom-color: var(--accent);
}

input::placeholder {
  color: #5d5c55;
}

.right {
  text-align: right;
}

.hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.err {
  font-size: 14px;
  color: var(--danger);
}

.send {
  min-height: 48px;
  border: 1px solid var(--accent);
  border-radius: 24px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.done {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  padding: 24px 0 8px;
}

.thanks {
  font-family: var(--font-serif);
  font-size: 22px;
}
</style>
