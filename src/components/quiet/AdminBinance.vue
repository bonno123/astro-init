<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { api } from "~/utils/api";

type Holder = { name: string; share: number; since: string };
type Move = {
  id: string;
  kind: "in" | "out";
  at: number;
  asset: string;
  amount: number;
  usdt: number | null;
  btc: number | null;
  note: string | null;
  paid: { holder: string; inr: number }[];
};
type Books = { holders: Holder[]; moves: Move[] };

/** Kept in memory only: a token in localStorage could be read by any script on the site. */
const token = ref("");
const holders = ref<Holder[]>([]);
const moves = ref<Move[]>([]);
const loaded = ref(false);
const busy = ref("");
const error = ref("");
const note = ref("");

// The split being edited: rupees per holder, as typed.
const editing = ref<string | null>(null);
const total = ref("");
const draft = reactive<Record<string, string>>({});

const newHolder = reactive({ name: "", share: "" });
const shareEdits = reactive<Record<string, string>>({});
const confirmDelete = ref<string | null>(null);

const auth = () => ({ Authorization: `Bearer ${token.value}` });
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });
const usdt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function take(b: Books) {
  holders.value = b.holders;
  moves.value = b.moves;
  for (const h of b.holders) shareEdits[h.name] = String(h.share);
  loaded.value = true;
}

/** Runs one request with a busy label, and shows its error if it fails. */
async function run<T>(label: string, f: () => Promise<T>) {
  busy.value = label;
  error.value = "";
  note.value = "";
  try {
    return await f();
  } catch (e: any) {
    error.value = e?.message || "That didn't work.";
  } finally {
    busy.value = "";
  }
}

const load = () => run("load", async () => take(await api<Books>("/api/admin/binance", { headers: auth() })));

async function sync() {
  const res = await run("sync", () =>
    api<Books & { added: number; failed: number }>("/api/admin/binance/sync", { method: "POST", headers: auth() }),
  );
  if (!res) return;
  take(res);
  const found = res.added === 0 ? "Nothing new" : res.added === 1 ? "Found 1 new record" : `Found ${res.added} new records`;
  note.value = res.failed ? `${found}, but Binance didn't answer ${res.failed} of the lists. Try again in a minute.` : `${found}.`;
}

const unsplit = computed(() => moves.value.filter((m) => !m.paid.length).length);
const shareSum = computed(() => holders.value.reduce((s, h) => s + h.share, 0));

function edit(m: Move) {
  editing.value = m.id;
  for (const k of Object.keys(draft)) delete draft[k];
  for (const h of holders.value) draft[h.name] = "";
  for (const p of m.paid) draft[p.holder] = String(p.inr);
  total.value = m.paid.length ? String(m.paid.reduce((s, p) => s + p.inr, 0)) : "";
}

/** Splits the total by the usual shares, in whole rupees; the first holder takes the rounding. */
function fillByShares() {
  const t = Number(total.value);
  if (!(t > 0) || !shareSum.value) return;
  const parts = holders.value.map((h) => Math.round((t * h.share) / shareSum.value));
  parts[0] += Math.round(t) - parts.reduce((s, n) => s + n, 0);
  holders.value.forEach((h, i) => (draft[h.name] = parts[i] > 0 ? String(parts[i]) : ""));
}

const draftSum = computed(() => Object.values(draft).reduce((s, v) => s + (Number(v) > 0 ? Number(v) : 0), 0));
const draftBad = computed(() => Object.values(draft).some((v) => v.trim() !== "" && !(Number(v) > 0)));

async function saveSplit(m: Move, clear = false) {
  const split = clear
    ? []
    : Object.entries(draft)
        .filter(([, v]) => Number(v) > 0)
        .map(([holder, v]) => ({ holder, inr: Number(v) }));
  const res = await run("split", () =>
    api<Books>("/api/admin/binance/split", { method: "POST", headers: auth(), json: { activityId: m.id, split } }),
  );
  if (!res) return;
  take(res);
  editing.value = null;
  note.value = clear ? "Split cleared." : "Saved. The /v/ page shows it on its next load.";
}

async function saveHolder(name: string, share: string) {
  const res = await run("holder", () =>
    api<Books>("/api/admin/binance/holder", { method: "POST", headers: auth(), json: { name, share: Number(share) } }),
  );
  if (!res) return;
  take(res);
  newHolder.name = "";
  newHolder.share = "";
  note.value = "Saved.";
}

async function removeHolder(name: string) {
  if (confirmDelete.value !== name) {
    confirmDelete.value = name;
    return;
  }
  confirmDelete.value = null;
  const res = await run("holder", () =>
    api<Books>("/api/admin/binance/holder/delete", { method: "POST", headers: auth(), json: { name } }),
  );
  if (res) take(res);
}
</script>

<template>
  <div class="admin">
    <h1>Binance books</h1>
    <p class="meta">
      Who paid for each move into the sub-account. The <a href="/v/">/v/</a> page splits the account by it: each person
      owns the BTC their rupees bought.
    </p>

    <form class="bar" @submit.prevent="load">
      <!-- lets the browser's password manager save and fill the token; it is never stored by the page -->
      <input type="text" name="username" value="admin" autocomplete="username" hidden />
      <input v-model="token" type="password" name="token" autocomplete="current-password" placeholder="ADMIN_API_TOKEN" aria-label="Admin token" />
      <button type="submit" :disabled="!token || !!busy">{{ busy === "load" ? "loading…" : "load" }}</button>
    </form>

    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-if="note" class="ok" role="status">{{ note }}</p>

    <template v-if="loaded">
      <section>
        <div class="head">
          <h2>Moves in and out</h2>
          <button :disabled="!!busy" @click="sync">{{ busy === "sync" ? "asking Binance…" : "check Binance now" }}</button>
        </div>
        <p class="meta">
          After a new investment, move the coins to the sub-account, press "check Binance now", then split it.
          <template v-if="unsplit"><br /><span class="warn">{{ unsplit }} not split yet.</span></template>
        </p>

        <p v-if="!moves.length" class="meta">None yet.</p>
        <ul class="list">
          <li v-for="m in moves" :key="m.id">
            <div class="head">
              <strong>{{ m.kind === "in" ? "+" : "−" }}{{ qty.format(m.amount) }} {{ m.asset }}</strong>
              <span class="badge" :class="{ warn: !m.paid.length }">{{ m.paid.length ? "split" : "not split" }}</span>
            </div>
            <p class="meta">
              {{ when(m.at) }} · {{ m.note }}
              <template v-if="m.usdt !== null"> · worth {{ usdt.format(m.usdt) }} USDT then</template>
            </p>
            <p v-if="m.paid.length && editing !== m.id">
              {{ m.paid.map((p) => `${p.holder} ${rupees.format(p.inr)}`).join(" · ") }}
              <span class="meta"> = {{ rupees.format(m.paid.reduce((s, p) => s + p.inr, 0)) }} {{ m.kind === "in" ? "paid" : "received" }}</span>
            </p>

            <form v-if="editing === m.id" class="edit" @submit.prevent="saveSplit(m)">
              <label>
                <span>Total {{ m.kind === "in" ? "paid" : "received" }}, ₹ <em>fills the split by the usual shares</em></span>
                <input v-model="total" type="number" min="0" step="0.01" inputmode="decimal" placeholder="5000" @input="fillByShares" />
              </label>
              <div class="split">
                <label v-for="h in holders" :key="h.name">
                  <span>{{ h.name }} <em>usual {{ h.share }}</em></span>
                  <input v-model="draft[h.name]" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0" />
                </label>
              </div>
              <p class="meta">Adds up to {{ rupees.format(draftSum) }}. Leave someone empty if they didn't pay.</p>
              <div class="acts">
                <button type="submit" class="primary" :disabled="!!busy || draftBad || !draftSum">{{ busy === "split" ? "saving…" : "save" }}</button>
                <button type="button" @click="editing = null">cancel</button>
                <button v-if="m.paid.length" type="button" :disabled="!!busy" @click="saveSplit(m, true)">clear split</button>
              </div>
            </form>
            <div v-else class="acts">
              <button @click="edit(m)">{{ m.paid.length ? "edit split" : "split" }}</button>
            </div>
          </li>
        </ul>
      </section>

      <section>
        <h2>Holders</h2>
        <p class="meta">The usual share only fills in a new split. Ownership comes from what each person paid.</p>
        <ul class="list">
          <li v-for="h in holders" :key="h.name" class="row">
            <strong>{{ h.name }}</strong>
            <form class="inline-form" @submit.prevent="saveHolder(h.name, shareEdits[h.name])">
              <input v-model="shareEdits[h.name]" type="number" min="0" step="any" inputmode="decimal" :aria-label="`${h.name}'s usual share`" />
              <button type="submit" :disabled="!!busy || Number(shareEdits[h.name]) === h.share">save</button>
              <button type="button" :class="{ danger: confirmDelete === h.name }" @click="removeHolder(h.name)" @blur="confirmDelete = null">
                {{ confirmDelete === h.name ? "tap again" : "remove" }}
              </button>
            </form>
          </li>
        </ul>
        <form class="inline-form" @submit.prevent="saveHolder(newHolder.name, newHolder.share)">
          <input v-model="newHolder.name" maxlength="40" placeholder="New holder's name" aria-label="New holder's name" />
          <input v-model="newHolder.share" type="number" min="0" step="any" inputmode="decimal" placeholder="share" aria-label="Usual share" />
          <button type="submit" :disabled="!!busy || !newHolder.name.trim() || !(Number(newHolder.share) > 0)">add</button>
        </form>
      </section>
    </template>
  </div>
</template>

<style scoped>
.admin {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px var(--pad) 80px;
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
section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
a {
  color: inherit;
}
.bar,
.inline-form {
  display: flex;
  gap: 8px;
  align-items: center;
}
input {
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
.inline-form input[type="number"] {
  width: 96px;
  flex: none;
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
.warn {
  color: var(--accent);
}
.edit {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 6px;
  padding: 18px;
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
.split {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
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
  gap: 8px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}
.list li.row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
strong {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.badge {
  padding: 2px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}
.badge.warn {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
