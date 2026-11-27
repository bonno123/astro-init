<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api } from "~/utils/api";

type Asset = { asset: string; wallet: "spot" | "funding" | "earn"; amount: number; usdt: number | null };
type Summary = { updatedAt: string; totalUsdt: number; assets: Asset[] };

const data = ref<Summary | null>(null);
const error = ref("");
const loading = ref(false);

// The token is everything after "#". Browsers never send that part to a server.
// Kept in memory only, never in localStorage.
let token = "";

async function load() {
  if (!token) {
    error.value = "This link isn't valid.";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    data.value = await api<Summary>("/api/binance/summary", { headers: { Authorization: `Bearer ${token}` } });
  } catch (e: any) {
    error.value = e?.message || "Couldn't load.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  token = decodeURIComponent(location.hash.slice(1)).trim();
  load();
});

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
</script>

<template>
  <div class="holdings">
    <header>
      <p class="label">Binance sub-account</p>
      <p v-if="data" class="total">{{ usd.format(data.totalUsdt) }}</p>
      <p v-if="data" class="meta">
        approx., in USDT · as of {{ when(data.updatedAt) }}
        <button :disabled="loading" @click="load">{{ loading ? "loading…" : "refresh" }}</button>
      </p>
    </header>

    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="loading && !data" class="meta">Loading…</p>
    <p v-else-if="data && !data.assets.length" class="meta">Nothing here yet.</p>

    <table v-if="data && data.assets.length">
      <thead>
        <tr>
          <th scope="col">asset</th>
          <th scope="col">wallet</th>
          <th scope="col" class="num">amount</th>
          <th scope="col" class="num">≈ USDT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in data.assets" :key="a.asset + a.wallet">
          <td>{{ a.asset }}</td>
          <td class="meta">{{ a.wallet }}</td>
          <td class="num">{{ qty.format(a.amount) }}</td>
          <td class="num">{{ a.usdt === null ? "—" : usd.format(a.usdt) }}</td>
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
  gap: 12px;
  flex-wrap: wrap;
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
}
th + th,
td + td {
  padding-left: 16px;
}
.num {
  text-align: right;
}
</style>
