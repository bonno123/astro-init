<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { api } from "~/utils/api";

const props = defineProps<{
  contactEmail: string;
  place: string;
  timeZone: string;
  replyWithinDays: number;
}>();

type Intent = "project" | "question" | "hello";
type Slot = "morning" | "afternoon" | "evening";

const INTENTS: { id: Intent; label: string; placeholder: string }[] = [
  { id: "project", label: "a project", placeholder: "What exists, what's broken, and what needs to happen? The messy version is fine." },
  { id: "question", label: "a question", placeholder: "Ask away. Short is fine." },
  { id: "hello", label: "just hello", placeholder: "Say what brought you here, if you like." },
];
const SLOTS: Slot[] = ["morning", "afternoon", "evening"];
const LIMIT = 2000;
const DRAFT_KEY = "sayhi-draft";

const intent = ref<Intent>("project");
const name = ref("");
const email = ref("");
const message = ref("");
const wantsCall = ref(false);
const slots = ref<Slot[]>([]);
const website = ref(""); // honeypot: people never see this field

const state = ref<"idle" | "sending" | "sent" | "failed">("idle");
const errorText = ref("");
const receipt = ref<{ no: string; about: string; call: string; sent: string; expect: string; name: string } | null>(null);
const draftSaved = ref(false);
const copied = ref<"" | "email" | "message">("");

const placeholder = computed(() => INTENTS.find((i) => i.id === intent.value)!.placeholder);
const remaining = computed(() => LIMIT - message.value.length);
const showCounter = computed(() => remaining.value < 300);
const valid = computed(
  () => name.value.trim() && /^\S+@\S+\.\S+$/.test(email.value.trim()) && message.value.trim().length >= 2 && remaining.value >= 0,
);

/* ---------- local clock ---------- */
// null until mounted, so the server-rendered HTML never disagrees with the browser's clock
const now = ref<Date | null>(null);
let tick: number | undefined;
const clock = computed(() =>
  now.value &&
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: props.timeZone }).format(now.value),
);
const status = computed(() => {
  if (!now.value) return "";
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: props.timeZone }).format(now.value));
  if (h < 7) return "probably asleep";
  if (h < 9) return "morning chai";
  if (h < 13) return "probably working";
  if (h < 14) return "lunch";
  if (h < 19) return "probably working";
  if (h < 23) return "probably reading";
  return "probably asleep";
});

/* ---------- draft ---------- */
let saveTimer: number | undefined;
onMounted(() => {
  now.value = new Date();
  tick = window.setInterval(() => (now.value = new Date()), 30_000);
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (d) {
      intent.value = d.intent ?? intent.value;
      name.value = d.name ?? "";
      email.value = d.email ?? "";
      message.value = d.message ?? "";
      wantsCall.value = !!d.wantsCall;
      slots.value = Array.isArray(d.slots) ? d.slots : [];
    }
  } catch {
    /* ignore a broken draft */
  }
});
onBeforeUnmount(() => {
  window.clearInterval(tick);
  window.clearTimeout(saveTimer);
});
watch([intent, name, email, message, wantsCall, slots], () => {
  if (state.value === "sent") return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      const empty = !name.value && !email.value && !message.value;
      if (empty) localStorage.removeItem(DRAFT_KEY);
      else
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ intent: intent.value, name: name.value, email: email.value, message: message.value, wantsCall: wantsCall.value, slots: slots.value }),
        );
      draftSaved.value = !empty;
    } catch {
      /* storage can be full or blocked */
    }
  }, 400);
}, { deep: true });

/* ---------- actions ---------- */
function toggleSlot(s: Slot) {
  slots.value = slots.value.includes(s) ? slots.value.filter((x) => x !== s) : [...slots.value, s];
}

async function copy(text: string, what: "email" | "message") {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = what;
    window.setTimeout(() => (copied.value = ""), 1800);
  } catch {
    /* clipboard blocked: the text is still selectable */
  }
}

function callLine() {
  if (!wantsCall.value) return "no";
  return slots.value.length ? `${SLOTS.filter((s) => slots.value.includes(s)).join(", ")} IST` : "any time IST";
}

function fmtDay(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(d);
}

async function send() {
  if (!valid.value || state.value === "sending") return;
  if (website.value) {
    state.value = "sent"; // quietly drop bots
    return;
  }
  state.value = "sending";
  const about = INTENTS.find((i) => i.id === intent.value)!.label;
  const call = callLine();
  const body = wantsCall.value ? `${message.value.trim()}\n\n— A call would help: ${call}` : message.value.trim();
  try {
    const res = await api<{ messageId?: string }>("/api/contact-message", {
      method: "POST",
      json: {
        name: name.value.trim(),
        email: email.value.trim(),
        subject: `Say hi · ${about}${wantsCall.value ? " · call" : ""}`,
        message: body,
      },
    });
    const sent = new Date();
    const expect = new Date(sent.getTime() + props.replyWithinDays * 86_400_000);
    receipt.value = {
      no: (res.messageId || crypto.randomUUID()).replace(/-/g, "").slice(0, 4).toUpperCase(),
      about,
      call,
      sent: `${fmtDay(sent)}, ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(sent)}`,
      expect: fmtDay(expect),
      name: name.value.trim().split(/\s+/)[0],
    };
    state.value = "sent";
    localStorage.removeItem(DRAFT_KEY);
  } catch (e: any) {
    errorText.value = e?.message || "The network dropped it.";
    state.value = "failed";
  }
}

function writeAnother() {
  message.value = "";
  wantsCall.value = false;
  slots.value = [];
  receipt.value = null;
  state.value = "idle";
}
</script>

<template>
  <div class="hi">
    <!-- Email first -->
    <div class="email">
      <p class="lead">Email is best.</p>
      <div class="pill">
        <a :href="`mailto:${contactEmail}`">{{ contactEmail }}</a>
        <button type="button" class="ghost" @click="copy(contactEmail, 'email')" :aria-label="`Copy ${contactEmail}`">
          {{ copied === "email" ? "copied" : "copy" }}
        </button>
      </div>
      <p class="meta clock">
        <span class="up">{{ place }}</span><span v-if="clock">&nbsp;{{ clock }} IST · {{ status }}</span>
      </p>
    </div>

    <!-- Receipt -->
    <div v-if="state === 'sent' && receipt" class="receipt" role="status" aria-live="polite">
      <div class="rhead">
        <span class="label">Received</span>
        <span class="meta">No. {{ receipt.no }}</span>
      </div>
      <dl>
        <div><dt>From</dt><dd>{{ name }}</dd></div>
        <div><dt>About</dt><dd>{{ receipt.about }}</dd></div>
        <div><dt>Call</dt><dd>{{ receipt.call }}</dd></div>
        <div><dt>Sent</dt><dd>{{ receipt.sent }}</dd></div>
        <div><dt>Expect</dt><dd class="accent">A reply by {{ receipt.expect }}</dd></div>
      </dl>
      <p class="thanks">Thanks, {{ receipt.name }}. I read every one of these myself.</p>
      <button type="button" class="link" @click="writeAnother">write another</button>
    </div>

    <div v-else-if="state === 'sent'" class="receipt" role="status">
      <p class="thanks">Thanks. It's on its way.</p>
    </div>

    <!-- Form -->
    <form v-else class="form" novalidate @submit.prevent="send">
      <span class="label">Or write it here</span>

      <fieldset class="chips">
        <legend class="sr-only">What is it about?</legend>
        <label v-for="i in INTENTS" :key="i.id" class="chip" :class="{ on: intent === i.id }">
          <input type="radio" name="intent" :value="i.id" v-model="intent" />
          {{ i.label }}
        </label>
      </fieldset>

      <div class="pair">
        <label class="field">
          <span class="flabel">Name</span>
          <input v-model="name" type="text" name="name" autocomplete="name" maxlength="80" required />
        </label>
        <label class="field">
          <span class="flabel">Email</span>
          <input v-model="email" type="email" name="email" autocomplete="email" inputmode="email" maxlength="120" required />
        </label>
      </div>

      <label class="field">
        <span class="flabel">What's going on</span>
        <textarea v-model="message" name="message" rows="6" :placeholder="placeholder" :maxlength="LIMIT + 200" required></textarea>
        <span class="under">
          <span>{{ draftSaved ? "draft saved on this device" : "" }}</span>
          <span v-if="showCounter" :class="{ over: remaining < 0 }">{{ remaining }}</span>
        </span>
      </label>

      <!-- honeypot -->
      <label class="hp" aria-hidden="true">
        Website <input v-model="website" type="text" name="website" tabindex="-1" autocomplete="off" />
      </label>

      <div class="call">
        <label class="switch">
          <input type="checkbox" v-model="wantsCall" role="switch" />
          <span class="track" aria-hidden="true"></span>
          <span>A call would help</span>
        </label>
        <div v-if="wantsCall" class="slots">
          <div class="chips" role="group" aria-label="Best time of day, IST">
            <button
              v-for="s in SLOTS"
              :key="s"
              type="button"
              class="chip"
              :class="{ on: slots.includes(s) }"
              :aria-pressed="slots.includes(s)"
              @click="toggleSlot(s)"
            >
              {{ s }}
            </button>
          </div>
          <p class="meta">In IST. I'll email two real slots.</p>
        </div>
      </div>

      <div v-if="state === 'failed'" class="error" role="alert">
        <span class="label">It didn't go through</span>
        <p>{{ errorText }} Your words are still here.</p>
        <div class="row">
          <button type="button" class="ghost" @click="send">try again</button>
          <button type="button" class="ghost" @click="copy(message, 'message')">
            {{ copied === "message" ? "copied" : "copy message" }}
          </button>
          <a :href="`mailto:${contactEmail}?subject=${encodeURIComponent('Say hi')}&body=${encodeURIComponent(message)}`" class="ghost">open in email</a>
        </div>
      </div>

      <div class="submit">
        <button type="submit" class="send" :disabled="!valid || state === 'sending'">
          {{ state === "sending" ? "sending…" : "send it →" }}
        </button>
        <p class="meta">No newsletter. A person reads this.</p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.hi {
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 640px;
}

.lead {
  font-family: var(--font-serif);
  font-size: 26px;
  line-height: 1.2;
}

.email {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pill {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-height: 44px;
  padding: 0 6px 0 18px;
  border: 1px solid var(--line-strong);
  border-radius: 22px;
}

.pill a {
  font-size: 16px;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clock .up {
  text-transform: uppercase;
  letter-spacing: 0.08em;
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
  text-decoration: none;
  cursor: pointer;
}

.ghost:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--line-strong);
  border-radius: 20px;
  background: none;
  color: var(--ink-body);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.chip input {
  position: absolute;
  opacity: 0;
  inset: 0;
  margin: 0;
  cursor: pointer;
}

.chip:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.chip.on {
  border-color: var(--accent);
  color: var(--accent);
  background: rgb(224 168 69 / 0.06);
}

.pair {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 640px) {
  .pair {
    grid-template-columns: 1fr 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flabel {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

input[type="text"],
input[type="email"],
textarea {
  width: 100%;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  border-radius: 0;
  background: transparent;
  font-size: 17px;
  line-height: 1.5;
  transition: border-color 0.2s;
}

textarea {
  resize: vertical;
  min-height: 140px;
  font-family: var(--font-serif);
  font-size: 18px;
}

textarea::placeholder {
  color: #5d5c55;
  font-style: italic;
}

input:focus,
textarea:focus {
  outline: none;
  border-bottom-color: var(--accent);
}

.under {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  min-height: 1em;
}

.under .over {
  color: var(--danger);
}

.hp {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.call {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  cursor: pointer;
  min-height: 32px;
}

.switch input {
  position: absolute;
  opacity: 0;
}

.track {
  position: relative;
  width: 36px;
  height: 20px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  transition: border-color 0.2s, background 0.2s;
}

.track::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--muted);
  transition: transform 0.2s, background 0.2s;
}

.switch input:checked + .track {
  border-color: var(--accent);
}

.switch input:checked + .track::after {
  transform: translateX(16px);
  background: var(--accent);
}

.switch input:focus-visible + .track {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.slots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid rgb(224 122 95 / 0.5);
  border-radius: var(--radius);
}

.error .label {
  color: var(--danger);
}

.error p {
  font-size: 14px;
  color: var(--ink-body);
}

.error .row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.submit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
}

.send {
  min-height: 48px;
  padding: 0 26px;
  border: 1px solid var(--accent);
  border-radius: 24px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, background 0.2s, color 0.2s;
}

.send:hover:not(:disabled) {
  background: transparent;
  color: var(--accent);
}

.send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.receipt {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--bg-raised);
}

.rhead {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--line-strong);
}

.rhead .label {
  color: var(--accent);
}

dl {
  margin: 0;
  display: flex;
  flex-direction: column;
}

dl > div {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

dt {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  padding-top: 3px;
}

dd {
  margin: 0;
  font-size: 15px;
  overflow-wrap: anywhere;
}

.thanks {
  font-family: var(--font-serif);
  font-size: 20px;
  line-height: 1.4;
}

.link {
  align-self: flex-start;
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
</style>
