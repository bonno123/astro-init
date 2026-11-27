<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { api, ApiError } from "~/utils/api";

type Wallet = "spot" | "funding" | "earn";
type Raw = { asset: string; wallet: Wallet; amount: number };
type Summary = { updatedAt: string; assets: Raw[]; stale?: boolean; notice?: string };
type Row = Raw & { usdt: number | null; inr: number | null };

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
    const usdt = unit === null ? null : r.amount * unit;
    const inr = usdt === null || inrPerUsdt.value === null ? null : usdt * inrPerUsdt.value;
    return { asset, wallet: earn ? ("earn" as const) : r.wallet, amount: r.amount, usdt, inr };
  });
  return out.sort((a, b) => (b.usdt ?? -1) - (a.usdt ?? -1));
});

const totalUsdt = computed(() => rows.value.reduce((s, r) => s + (r.usdt ?? 0), 0));
const priced = computed(() => rows.value.some((r) => r.usdt !== null) || !rows.value.length);
const totalInr = computed(() => (inrPerUsdt.value === null ? null : totalUsdt.value * inrPerUsdt.value));

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const usdt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
</script>

<template>
  <div class="holdings">
    <header>
      <p class="label">Binance sub-account</p>
      <template v-if="data">
        <p class="total">
          <template v-if="!priced">—</template>
          <template v-else-if="totalInr !== null">{{ rupees.format(totalInr) }}</template>
          <template v-else>{{ usdt.format(totalUsdt) }} USDT</template>
        </p>
        <p class="meta">
          <span v-if="priced && totalInr !== null">≈ {{ usdt.format(totalUsdt) }} USDT · </span>
          <span v-if="inrPerUsdt">₹{{ inrPerUsdt.toFixed(2) }} per USDT · </span>
          as of {{ when(data.updatedAt) }}
          <button :disabled="loading || retrying" @click="load">
            {{ loading || retrying ? "loading…" : "refresh" }}
          </button>
        </p>
        <p v-if="!priced" class="meta">Couldn't get prices just now.</p>
      </template>
    </header>

    <p v-if="data?.stale" class="note" role="status">
      {{ data.notice || "Binance didn't answer this time." }}
      {{ retrying ? "Trying again…" : `Showing the balances from ${when(data.updatedAt)}.` }}
    </p>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="!data && (loading || retrying)" class="meta">Loading…</p>
    <p v-else-if="data && !rows.length" class="meta">Nothing here yet.</p>

    <table v-if="rows.length">
      <thead>
        <tr>
          <th scope="col">asset</th>
          <th scope="col">wallet</th>
          <th scope="col" class="num">amount</th>
          <th scope="col" class="num">value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in rows" :key="a.asset + a.wallet">
          <td>{{ a.asset }}</td>
          <td class="meta">{{ a.wallet }}</td>
          <td class="num">{{ qty.format(a.amount) }}</td>
          <td class="num">
            <template v-if="a.usdt === null">—</template>
            <template v-else>
              <span v-if="a.inr !== null">{{ rupees.format(a.inr) }}</span>
              <span class="sub" :class="{ only: a.inr === null }">{{ usdt.format(a.usdt) }} USDT</span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.holdings {
  max-width: 640px;
  margin: 0 auto;
  padding: 56px var(--pad);
  display: flex;
  flex-direction: column;
  gap: 28px;
}
header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.total {
  font-family: var(--font-serif);
  font-size: clamp(40px, 9vw, 64px);
  font-weight: 300;
  line-height: 1.05;
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
table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
th {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
  text-align: left;
  padding: 0 0 10px;
}
td {
  padding: 12px 0;
  border-top: 1px solid var(--line);
  vertical-align: top;
}
th + th,
td + td {
  padding-left: 16px;
}
.num {
  text-align: right;
}
.sub {
  display: block;
  font-size: 12px;
  color: var(--muted);
}
.sub.only {
  font-size: inherit;
  color: inherit;
}
</style>
