<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { api } from "~/utils/api";
import type { GreetingPayload, VideoPayload } from "~/broadcast/types";

type Kind = "greeting" | "video";

type Row = {
  id: string;
  label: string;
  kind: Kind;
  payload: GreetingPayload & VideoPayload; // whichever fields its kind has
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  frequency: "once" | "session" | "always";
  dismissAfterMs: number;
  updatedAt: string;
};

const DEFAULT_COLORS = ["#e0a845", "#ece9e0", "#e07a5f", "#8fb996", "#7aa2e0"];
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Kept in memory only: a token in localStorage could be read by any script on the site. */
const token = ref("");
const rows = ref<Row[]>([]);
const liveId = ref<string | null>(null);
const serverNow = ref("");
const loaded = ref(false);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const note = ref("");
const confirmDelete = ref<string | null>(null);

const blank = (kind: Kind = "greeting") => ({
  id: null as string | null,
  label: "",
  kind,
  // greeting
  title: "",
  subtitle: "",
  effect: "confetti" as "confetti" | "none",
  colors: [...DEFAULT_COLORS],
  // video
  src: "",
  poster: "",
  caption: "",
  fit: "cover" as "cover" | "contain",
  loop: false,
  // both
  startsAt: "",
  endsAt: "",
  frequency: "once" as Row["frequency"],
  seconds: kind === "video" ? 0 : 8, // a video closes when it ends
  enabled: true,
});
const form = reactive(blank());
const editing = ref(false);

const auth = () => ({ Authorization: `Bearer ${token.value}` });

// <input type="datetime-local"> works in this device's zone; the Worker stores UTC.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const fmt = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "";

function status(r: Row) {
  if (!r.enabled) return "off";
  if (r.id === liveId.value) return "live";
  if (r.startsAt && r.startsAt > serverNow.value) return "scheduled";
  if (r.endsAt && r.endsAt <= serverNow.value) return "ended";
  return "behind another"; // in its window, but a newer one wins
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await api<{ broadcasts: Row[]; liveId: string | null; now: string }>("/api/admin/broadcasts", {
      headers: auth(),
    });
    rows.value = res.broadcasts;
    liveId.value = res.liveId;
    serverNow.value = res.now;
    loaded.value = true;
  } catch (e: any) {
    error.value = e?.message || "Could not load.";
  } finally {
    loading.value = false;
  }
}

function startNew(kind: Kind) {
  Object.assign(form, blank(kind));
  editing.value = true;
  note.value = "";
}

function edit(r: Row) {
  const p = r.payload;
  Object.assign(form, blank(r.kind), {
    id: r.id,
    label: r.label,
    title: p.title ?? "",
    subtitle: p.subtitle ?? "",
    effect: p.effect ?? "confetti",
    colors: p.colors?.length ? [...p.colors] : [...DEFAULT_COLORS],
    src: p.src ?? "",
    poster: p.poster ?? "",
    caption: p.caption ?? "",
    fit: p.fit ?? "cover",
    loop: p.loop === true,
    startsAt: toLocalInput(r.startsAt),
    endsAt: toLocalInput(r.endsAt),
    frequency: r.frequency,
    seconds: Math.round(r.dismissAfterMs / 1000),
    enabled: r.enabled,
  });
  editing.value = true;
  note.value = "";
  scrollTo({ top: 0, behavior: "smooth" });
}

const payload = computed<GreetingPayload | VideoPayload>(() =>
  form.kind === "video"
    ? {
        src: form.src.trim(),
        poster: form.poster.trim() || null,
        caption: form.caption.trim() || null,
        fit: form.fit,
        loop: form.loop,
      }
    : {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        effect: form.effect,
        colors: form.colors,
      },
);

const https = (v: string) => /^https:\/\/\S+$/i.test(v.trim());
const ready = computed(() =>
  form.kind === "video" ? https(form.src) && (!form.poster.trim() || https(form.poster)) : Boolean(form.title.trim()),
);

/** What a row is called in the list, after its label. */
const summary = (r: Row) =>
  r.kind === "video" ? r.payload.caption || decodeURIComponent(r.payload.src?.split("/").pop() || "video") : r.payload.title;

function body(r?: Row) {
  if (r)
    return {
      id: r.id,
      label: r.label,
      kind: r.kind,
      payload: r.payload,
      enabled: r.enabled,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      frequency: r.frequency,
      dismissAfterMs: r.dismissAfterMs,
    };
  return {
    id: form.id,
    label: form.label.trim(),
    kind: form.kind,
    payload: payload.value,
    enabled: form.enabled,
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
    frequency: form.frequency,
    dismissAfterMs: Math.max(0, Number(form.seconds) || 0) * 1000,
  };
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    await api("/api/admin/broadcasts", { method: "POST", headers: auth(), json: body() });
    editing.value = false;
    note.value = "Saved. Visitors see the change within a minute.";
    await load();
  } catch (e: any) {
    error.value = e?.message || "Could not save.";
  } finally {
    saving.value = false;
  }
}

async function toggle(r: Row) {
  error.value = "";
  try {
    await api("/api/admin/broadcasts", { method: "POST", headers: auth(), json: { ...body(r), enabled: !r.enabled } });
    await load();
  } catch (e: any) {
    error.value = e?.message || "That didn't work.";
  }
}

async function remove(r: Row) {
  if (confirmDelete.value !== r.id) {
    confirmDelete.value = r.id;
    return;
  }
  confirmDelete.value = null;
  error.value = "";
  try {
    await api("/api/admin/broadcasts/delete", { method: "POST", headers: auth(), json: { id: r.id } });
    if (form.id === r.id) editing.value = false;
    await load();
  } catch (e: any) {
    error.value = e?.message || "That didn't work.";
  }
}

/** The real overlay, right here, from the unsaved form (or a saved row). */
async function preview(r?: Row) {
  const { showBroadcast } = await import("~/broadcast/show");
  const b = body(r);
  await showBroadcast({ kind: b.kind, payload: b.payload, dismissAfterMs: b.dismissAfterMs });
}
</script>

<template>
  <div class="admin">
    <h1>Broadcast</h1>
    <p class="meta">A full-screen greeting over the home page. Times are in {{ tz }}.</p>

    <form class="bar" @submit.prevent="load">
      <!-- lets the browser's password manager save and fill the token; it is never stored by the page -->
      <input type="text" name="username" value="admin" autocomplete="username" hidden />
      <input v-model="token" type="password" name="token" autocomplete="current-password" placeholder="ADMIN_API_TOKEN" aria-label="Admin token" />
      <button type="submit" :disabled="!token || loading">{{ loading ? "loading…" : "load" }}</button>
    </form>

    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="note" class="ok" role="status">{{ note }}</p>

    <template v-if="loaded">
      <div v-if="!editing" class="acts">
        <button class="primary" @click="startNew('greeting')">new greeting</button>
        <button class="primary" @click="startNew('video')">new video</button>
      </div>

      <form v-else class="edit" @submit.prevent="save">
        <h2>{{ form.id ? "Edit" : "New" }} {{ form.kind }}</h2>

        <template v-if="form.kind === 'video'">
          <label>
            <span>Video link <em>https, .mp4 or .webm</em></span>
            <input v-model="form.src" type="url" inputmode="url" required placeholder="https://…/diwali.mp4" />
          </label>
          <label>
            <span>Poster image <em>optional, shown before it plays</em></span>
            <input v-model="form.poster" type="url" inputmode="url" placeholder="https://…/diwali.jpg" />
          </label>
          <label>
            <span>Caption <em>optional</em></span>
            <input v-model="form.caption" maxlength="120" placeholder="Happy Diwali" />
          </label>
          <fieldset>
            <legend>Fit</legend>
            <label class="inline"><input v-model="form.fit" type="radio" value="cover" /> fill the screen</label>
            <label class="inline"><input v-model="form.fit" type="radio" value="contain" /> show it whole</label>
          </fieldset>
          <label class="inline"><input v-model="form.loop" type="checkbox" /> loop <em>otherwise it closes when the video ends</em></label>
        </template>

        <template v-else>
          <label>
            <span>Title</span>
            <input v-model="form.title" required maxlength="80" placeholder="Happy New Year 2027" />
          </label>
          <label>
            <span>Smaller line <em>optional</em></span>
            <input v-model="form.subtitle" maxlength="200" placeholder="Thanks for stopping by this year." />
          </label>

          <fieldset>
            <legend>Effect</legend>
            <label class="inline"><input v-model="form.effect" type="radio" value="confetti" /> confetti</label>
            <label class="inline"><input v-model="form.effect" type="radio" value="none" /> just the words</label>
          </fieldset>

          <fieldset v-if="form.effect === 'confetti'" class="colors">
            <legend>Confetti colours</legend>
            <span v-for="(c, i) in form.colors" :key="i" class="swatch">
              <input v-model="form.colors[i]" type="color" :aria-label="`Colour ${i + 1}`" />
              <button v-if="form.colors.length > 1" type="button" class="x" :aria-label="`Remove colour ${i + 1}`" @click="form.colors.splice(i, 1)">×</button>
            </span>
            <button v-if="form.colors.length < 6" type="button" @click="form.colors.push('#ffffff')">+ colour</button>
          </fieldset>
        </template>

        <div class="two">
          <label>
            <span>Starts <em>empty = now</em></span>
            <input v-model="form.startsAt" type="datetime-local" />
          </label>
          <label>
            <span>Ends <em>empty = until off</em></span>
            <input v-model="form.endsAt" type="datetime-local" />
          </label>
        </div>

        <div class="two">
          <label>
            <span>Show it</span>
            <select v-model="form.frequency">
              <option value="once">once per visitor</option>
              <option value="session">once per visit</option>
              <option value="always">every page load</option>
            </select>
          </label>
          <label>
            <span>Closes after <em>seconds, 0 = {{ form.kind === "video" && !form.loop ? "when it ends" : "never" }}</em></span>
            <input v-model.number="form.seconds" type="number" min="0" max="120" inputmode="numeric" />
          </label>
        </div>

        <label class="inline"><input v-model="form.enabled" type="checkbox" /> on</label>
        <p v-if="form.id && form.frequency === 'once'" class="meta">
          Anyone who has already closed this one won't see it again after you edit it. Make a new one to show everybody.
        </p>

        <input v-model="form.label" maxlength="60" placeholder="Name in this list (optional)" aria-label="Name in this list" />

        <div class="acts">
          <button type="button" :disabled="!ready" @click="preview()">preview</button>
          <button type="submit" class="primary" :disabled="saving || !ready">{{ saving ? "saving…" : "save" }}</button>
          <button type="button" @click="editing = false">cancel</button>
        </div>
      </form>

      <p v-if="!rows.length" class="meta">None yet.</p>
      <ul class="list">
        <li v-for="r in rows" :key="r.id">
          <div class="head">
            <strong>{{ r.label }}</strong>
            <span class="badge" :class="status(r).replace(' ', '-')">{{ status(r) }}</span>
          </div>
          <p class="title"><span class="kind">{{ r.kind }}</span> {{ summary(r) }}</p>
          <p class="meta">
            {{ r.startsAt ? fmt(r.startsAt) : "from saving" }} → {{ r.endsAt ? fmt(r.endsAt) : "until off" }}
            · {{ { once: "once per visitor", session: "once per visit", always: "every load" }[r.frequency] }}
          </p>
          <div class="acts">
            <button @click="preview(r)">preview</button>
            <button @click="edit(r)">edit</button>
            <button @click="toggle(r)">{{ r.enabled ? "turn off" : "turn on" }}</button>
            <button :class="{ danger: confirmDelete === r.id }" @click="remove(r)" @blur="confirmDelete = null">
              {{ confirmDelete === r.id ? "tap again to delete" : "delete" }}
            </button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.admin {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px var(--pad);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
h1 {
  font-family: var(--font-serif);
  font-weight: 300;
  font-size: 36px;
}
h2 {
  font-size: 14px;
  font-family: var(--font-mono);
  font-weight: 400;
  color: var(--muted);
}
.bar {
  display: flex;
  gap: 8px;
}
input:not([type="radio"], [type="checkbox"], [type="color"]),
select {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 16px; /* under 16px, iOS zooms in on focus */
}
.bar input {
  flex: 1;
}
select option {
  background: var(--bg);
}
button {
  padding: 9px 14px;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background: none;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}
button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
button.primary {
  align-self: flex-start;
  border-color: var(--accent);
  color: var(--accent);
}
button.danger {
  border-color: var(--danger);
  color: var(--danger);
}
.meta {
  color: var(--muted);
  font-size: 13px;
}
.err {
  color: var(--danger);
}
.ok {
  color: var(--accent);
}
.edit {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--bg-raised);
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
label > span {
  font-size: 13px;
  color: var(--ink-soft);
}
em {
  font-style: normal;
  color: var(--muted);
}
label.inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0;
  padding: 0;
  border: 0;
}
legend {
  width: 100%;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--ink-soft);
}
.colors {
  align-items: center;
  gap: 10px;
}
.swatch {
  position: relative;
}
input[type="color"] {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: none;
  cursor: pointer;
}
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 3px;
}
input[type="color"]::-webkit-color-swatch {
  border: 0;
  border-radius: 50%;
}
.x {
  position: absolute;
  top: -6px;
  right: -8px;
  padding: 0 5px;
  line-height: 16px;
  background: var(--bg);
}
.two {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 560px) {
  .two {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.list li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.title {
  font-family: var(--font-serif), var(--font-bangla);
  font-size: 20px;
}
.kind {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  vertical-align: middle;
}
.badge {
  padding: 2px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}
.badge.live {
  border-color: var(--accent);
  color: var(--accent);
}
.badge.scheduled {
  color: var(--ink-soft);
}
</style>
