<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { api, ApiError } from "~/utils/api";

type Wallet = "spot" | "funding" | "earn";
type Raw = { asset: string; wallet: Wallet; amount: number };
type Holder = { name: string; share: number; since: string };
type Move = {
  kind: "in" | "out" | "buy" | "sell" | "convert";
  at: number;
  asset: string;
  amount: number;
  usdt: number | null; // value at that minute
  inr: number | null; // rupees really paid (or received), set by hand
  note: string | null;
};
type Summary = {
  updatedAt: string;
  assets: Raw[];
  stale?: boolean;
  notice?: string;
  // The books, from D1: who owns what share, and what moved in and out.
  holders?: Holder[];
  activity?: Move[];
  putInUsdt?: number | null; // net USDT in, valued at the minute each move happened
  paidInr?: number | null; // net rupees really paid
};
type Row = Raw & { usdt: number | null };

// Public prices, fetched by the browser: Binance turns away some of Cloudflare's
// IPs, but never a visitor's. CoinGecko's USDT→INR is the Indian market rate;
// the plain USD→INR rate is the fallback.
const PRICES_URL = "https://data-api.binance.vision/api/v3/ticker/price";
const INR_URL = "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr";
const INR_FALLBACK_URL = "https://open.er-api.com/v6/latest/USD";
const STABLE = new Set(["USDT", "USDC", "FDUSD", "TUSD", "DAI", "USDP"]);
// When Binance refuses, a new request usually leaves from another IP. Try twice more.
const RETRY_MS = [2500, 6000];

const data = ref<Summary | null>(null);
const px = ref<Map<string, number>>(new Map());
const inrPerUsdt = ref<number | null>(null);
const error = ref("");
const loading = ref(false);
const retrying = ref(false);

// The token is everything after "#". Browsers never send that part to a server.
// Kept in memory only, never in localStorage.
let token = "";
let timer: ReturnType<typeof setTimeout> | undefined;

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function loadPrices() {
  const [list, inr] = await Promise.all([
    getJson(PRICES_URL).catch(() => null),
    getJson(INR_URL)
      .then((d) => d?.tether?.inr)
      .catch(() => getJson(INR_FALLBACK_URL).then((d) => d?.rates?.INR))
      .catch(() => null),
  ]);
  if (Array.isArray(list)) px.value = new Map(list.map((p: any) => [p.symbol, Number(p.price)]));
  if (typeof inr === "number" && inr > 0) inrPerUsdt.value = inr;
}

async function loadBalances(attempt = 0) {
  try {
    const res = await api<Summary>("/api/binance/summary", { headers: { Authorization: `Bearer ${token}` } });
    data.value = res;
    error.value = "";
    if (res.stale && attempt < RETRY_MS.length) return retryLater(attempt);
  } catch (e: any) {
    // 502: Binance didn't answer and nothing recent was saved. Worth asking again.
    // Anything else (a rejected key, a rotated link) is final.
    const again = e instanceof ApiError && e.status === 502 && attempt < RETRY_MS.length;
    if (again) return retryLater(attempt);
    // Keep the balances on screen only if they're a stale copy and the retries were for a fresher one.
    if (!(e instanceof ApiError && e.status === 502 && data.value?.stale)) data.value = null;
    if (!data.value) error.value = e?.message || "Couldn't load.";
  }
  retrying.value = false;
}

function retryLater(attempt: number) {
  retrying.value = true;
  timer = setTimeout(() => loadBalances(attempt + 1), RETRY_MS[attempt]);
}

async function load() {
  if (!token) {
    error.value = "This link isn't valid.";
    return;
  }
  clearTimeout(timer);
  loading.value = true;
  error.value = "";
  await Promise.all([loadBalances(), loadPrices()]);
  loading.value = false;
}

onMounted(() => {
  token = decodeURIComponent(location.hash.slice(1)).trim();
  load();
});
onBeforeUnmount(() => clearTimeout(timer));

/** USDT value of one unit of the asset, or null when there's no route to USDT. */
function unitUsdt(asset: string): number | null {
  const p = px.value;
  if (asset === "USDT") return 1;
  if (p.has(`${asset}USDT`)) return p.get(`${asset}USDT`)!;
  if (p.has(`USDT${asset}`)) return 1 / p.get(`USDT${asset}`)!;
  if (p.has(`${asset}BTC`) && p.has("BTCUSDT")) return p.get(`${asset}BTC`)! * p.get("BTCUSDT")!;
  if (STABLE.has(asset)) return 1;
  return null;
}

const rows = computed<Row[]>(() => {
  const out = (data.value?.assets ?? []).map((r) => {
    // "LDBTC" in spot is BTC in Simple Earn (flexible). "LDO" is a coin of its own.
    const earn = r.asset.startsWith("LD") && unitUsdt(r.asset) === null && unitUsdt(r.asset.slice(2)) !== null;
    const asset = earn ? r.asset.slice(2) : r.asset;
    const unit = unitUsdt(asset);
    return { asset, wallet: earn ? ("earn" as const) : r.wallet, amount: r.amount, usdt: unit === null ? null : r.amount * unit };
  });
  return out.sort((a, b) => (b.usdt ?? -1) - (a.usdt ?? -1));
});

const totalUsdt = computed(() => rows.value.reduce((s, r) => s + (r.usdt ?? 0), 0));
const priced = computed(() => rows.value.some((r) => r.usdt !== null) || !rows.value.length);
const onlyBtc = computed(() => rows.value.every((r) => r.asset === "BTC"));

/** The whole account in BTC: exact when it's all BTC, otherwise at today's price. */
const totalBtc = computed(() => {
  if (onlyBtc.value) return rows.value.reduce((s, r) => s + r.amount, 0);
  const btc = px.value.get("BTCUSDT");
  return btc && priced.value ? totalUsdt.value / btc : null;
});

/** Where the rupees went: paid → lost buying → market since → worth now. */
const story = computed(() => {
  const rate = inrPerUsdt.value;
  const putIn = data.value?.putInUsdt;
  if (rate === null || !priced.value || putIn == null) return null;
  const paid = data.value?.paidInr ?? null;
  const arrived = putIn * rate;
  const now = totalUsdt.value * rate;
  return { paid, arrived, lost: paid === null ? null : arrived - paid, market: now - arrived, now };
});

/** Each holder's part of the BTC, of what was paid, and of what it's worth now. */
const holders = computed(() => {
  const list = data.value?.holders ?? [];
  const sum = list.reduce((s, h) => s + h.share, 0);
  if (!sum) return [];
  const rate = inrPerUsdt.value;
  const paid = data.value?.paidInr ?? (data.value?.putInUsdt != null && rate !== null ? data.value.putInUsdt * rate : null);
  return list.map((h) => {
    const part = h.share / sum;
    return {
      ...h,
      part,
      btc: totalBtc.value === null ? null : totalBtc.value * part,
      paid: paid === null ? null : paid * part,
      now: priced.value ? totalUsdt.value * part : null,
    };
  });
});

const activity = computed(() =>
  (data.value?.activity ?? []).map((m) => {
    const title = { in: m.note, out: m.note, buy: `Bought ${m.asset}`, sell: `Sold ${m.asset}`, convert: `Converted to ${m.asset}` }[m.kind];
    const detail = m.kind === "in" || m.kind === "out" ? null : m.note;
    const sign = m.kind === "out" || m.kind === "sell" ? "−" : "+";
    return { ...m, title: title ? title[0].toUpperCase() + title.slice(1) : m.kind, detail, sign };
  }),
);

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const change = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0, signDisplay: "exceptZero" });
const usdt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });
const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });

/** USDT as ₹ at today's rate, or as USDT while the rate is missing. */
const money = (v: number | null) =>
  v === null ? "—" : inrPerUsdt.value === null ? `${usdt.format(v)} USDT` : rupees.format(v * inrPerUsdt.value);
const when = (t: string | number) =>
  new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
</script>

<template>
  <div class="holdings">
    <header>
      <p class="label">Binance sub-account</p>
      <template v-if="data">
        <p class="total">
          <template v-if="totalBtc === null">—</template>
          <template v-else>{{ qty.format(totalBtc) }}<span class="unit">BTC</span></template>
        </p>
        <p class="meta">
          <span v-if="priced">≈ {{ money(totalUsdt) }} · </span>
          as of {{ when(data.updatedAt) }}
          <button :disabled="loading || retrying" @click="load">
            {{ loading || retrying ? "loading…" : "refresh" }}
          </button>
        </p>
      </template>
    </header>

    <p v-if="data?.stale" class="note" role="status">
      {{ data.notice || "Binance didn't answer this time." }}
      {{ retrying ? "Trying again…" : `Showing the balances from ${when(data.updatedAt)}.` }}
    </p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="!data && (loading || retrying)" class="meta">Loading…</p>
    <p v-else-if="data && !rows.length" class="meta">Nothing here yet.</p>
    <p v-else-if="data && !priced" class="meta">Couldn't get prices just now.</p>

    <!-- Only when there's more than BTC: the headline already says it all otherwise. -->
    <ul v-if="rows.length && !onlyBtc" class="list">
      <li v-for="a in rows" :key="a.asset + a.wallet">
        <span>{{ a.asset }}<span class="sub">{{ a.wallet }}</span></span>
        <span class="num">{{ qty.format(a.amount) }}<span class="sub">{{ money(a.usdt) }}</span></span>
      </li>
    </ul>

    <section v-if="story">
      <h2 class="label">Where the money went</h2>
      <ul class="list">
        <li v-if="story.paid !== null">
          <span>Paid</span>
          <span class="num">{{ rupees.format(story.paid) }}</span>
        </li>
        <li v-if="story.lost !== null">
          <span>Lost buying<span class="sub">fees, tax and the rate on the way in</span></span>
          <span class="num" :class="story.lost < 0 ? 'down' : 'up'">
            {{ change.format(story.lost) }}<span v-if="story.paid" class="sub">{{ pct.format(Math.abs(story.lost) / story.paid) }}</span>
          </span>
        </li>
        <li v-else>
          <span>Worth when it arrived</span>
          <span class="num">{{ rupees.format(story.arrived) }}</span>
        </li>
        <li>
          <span>Market since</span>
          <span class="num" :class="story.market < 0 ? 'down' : 'up'">{{ change.format(story.market) }}</span>
        </li>
        <li class="end">
          <span>Worth now</span>
          <span class="num">{{ rupees.format(story.now) }}</span>
        </li>
      </ul>
    </section>

    <section v-if="holders.length">
      <h2 class="label">Holders</h2>
      <ul class="list">
        <li v-for="h in holders" :key="h.name">
          <span>{{ h.name }}<span class="sub">{{ pct.format(h.part) }}</span></span>
          <span class="num">
            <template v-if="h.btc !== null">{{ qty.format(h.btc) }} BTC</template>
            <span class="sub">
              <template v-if="h.paid !== null">paid {{ rupees.format(h.paid) }} · </template>now {{ money(h.now) }}
            </span>
          </span>
        </li>
      </ul>
    </section>

    <section v-if="activity.length">
      <h2 class="label">Activity</h2>
      <ul class="list">
        <li v-for="m in activity" :key="m.kind + m.at + m.asset">
          <span>{{ m.title }}<span class="sub">{{ when(m.at) }}<template v-if="m.detail"> · {{ m.detail }}</template></span></span>
          <span class="num">
            {{ m.sign }}{{ qty.format(m.amount) }} {{ m.asset }}
            <span class="sub">
              <template v-if="m.inr !== null">paid {{ rupees.format(m.inr) }} · </template>
              <template v-if="m.usdt !== null">worth {{ money(m.usdt) }} then</template>
            </span>
          </span>
        </li>
      </ul>
    </section>

    <p v-if="data && inrPerUsdt" class="foot">Prices from Binance. ₹ at {{ inrPerUsdt.toFixed(2) }} per USDT.</p>
  </div>
</template>

<style scoped>
.holdings {
  max-width: 560px;
  margin: 0 auto;
  padding: 72px var(--pad) 96px;
  display: flex;
  flex-direction: column;
  gap: 56px;
}
header,
section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.total {
  font-family: var(--font-serif);
  font-size: clamp(44px, 11vw, 72px);
  font-weight: 300;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.unit {
  margin-left: 0.25em;
  font-size: 0.4em;
  color: var(--muted);
}
.meta {
  color: var(--muted);
}
header .meta {
  display: flex;
  align-items: center;
  gap: 0 12px;
  flex-wrap: wrap;
}
header .meta span {
  white-space: pre;
}
button {
  padding: 4px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background: none;
  color: inherit;
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
}
button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.note {
  color: var(--muted);
  padding-left: 12px;
  border-left: 2px solid var(--line-strong);
}
.err {
  color: var(--danger);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-variant-numeric: tabular-nums;
}
.list li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}
.list li.end {
  border-top-color: var(--line-strong);
  font-weight: 500;
}
.num {
  text-align: right;
}
.sub {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
}
.up {
  color: var(--accent);
}
.down {
  color: var(--danger);
}
.foot {
  font-size: 12px;
  color: var(--muted);
}
</style>
