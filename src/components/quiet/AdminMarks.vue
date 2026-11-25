<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { api } from "~/utils/api";

type Mark = {
  id: number;
  kind: "draw" | "text";
  strokes: number[][] | null;
  text: string | null;
  name: string | null;
  place: string | null;
  replied: boolean;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
};

const TOKEN_KEY = "ADMIN_API_TOKEN"; // shared with the bookings admin
const token = ref("");
const status = ref<Mark["status"]>("pending");
const marks = ref<Mark[]>([]);
const error = ref("");
const loading = ref(false);

onMounted(() => {
  token.value = localStorage.getItem(TOKEN_KEY) || "";
  if (token.value) load();
});

watch(status, () => token.value && load());

const auth = () => ({ Authorization: `Bearer ${token.value}` });

async function load() {
  loading.value = true;
  error.value = "";
  try {
    localStorage.setItem(TOKEN_KEY, token.value);
    const res = await api<{ marks: Mark[] }>(`/api/admin/marks?status=${status.value}`, { headers: auth() });
    marks.value = res.marks;
  } catch (e: any) {
    error.value = e?.message || "Could not load marks.";
  } finally {
    loading.value = false;
  }
}

async function review(m: Mark, action: "approve" | "reject" | "replied" | "unreplied") {
  try {
    await api("/api/admin/marks/review", { method: "POST", headers: auth(), json: { id: m.id, action } });
    if (action === "approve" || action === "reject") marks.value = marks.value.filter((x) => x.id !== m.id);
    else m.replied = action === "replied";
  } catch (e: any) {
    error.value = e?.message || "That didn't work.";
  }
}

function pathFor(s: number[]) {
  let d = `M${s[0]} ${s[1]}`;
  for (let i = 2; i < s.length; i += 2) d += `L${s[i]} ${s[i + 1]}`;
  return s.length === 2 ? d + "l0.1 0" : d;
}
</script>

<template>
  <div class="admin">
    <div class="bar">
      <input v-model="token" type="password" placeholder="ADMIN_API_TOKEN" aria-label="Admin token" />
      <button type="button" @click="load" :disabled="!token || loading">{{ loading ? "loading…" : "load" }}</button>
    </div>
    <div class="tabs" role="tablist">
      <button
        v-for="s in ['pending', 'approved', 'rejected'] as const"
        :key="s"
        role="tab"
        :aria-selected="status === s"
        :class="{ on: status === s }"
        @click="status = s"
      >
        {{ s }}
      </button>
    </div>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="!marks.length && !loading" class="meta">Nothing here.</p>
    <ul class="list">
      <li v-for="m in marks" :key="m.id">
        <svg v-if="m.kind === 'draw' && m.strokes" viewBox="0 0 1000 1000" aria-hidden="true">
          <path v-for="(s, i) in m.strokes" :key="i" :d="pathFor(s)" />
        </svg>
        <p v-else class="note">{{ m.text }}</p>
        <div class="info">
          <span>#{{ m.id }} · {{ m.name || "unsigned" }}{{ m.place ? " · " + m.place : "" }}</span>
          <span class="meta">{{ m.createdAt }} UTC</span>
          <div class="acts">
            <button v-if="m.status !== 'approved'" @click="review(m, 'approve')">approve</button>
            <button v-if="m.status !== 'rejected'" @click="review(m, 'reject')">reject</button>
            <button v-if="m.status === 'approved'" @click="review(m, m.replied ? 'unreplied' : 'replied')">
              {{ m.replied ? "unmark replied" : "mark replied" }}
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.admin {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px var(--pad);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.bar {
  display: flex;
  gap: 8px;
}
input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: transparent;
}
button {
  padding: 8px 14px;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background: none;
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
}
button:hover:not(:disabled),
button.on {
  border-color: var(--accent);
  color: var(--accent);
}
.tabs {
  display: flex;
  gap: 8px;
}
.err {
  color: var(--danger);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.list li {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}
svg {
  width: 120px;
  height: 120px;
  border: 1px solid var(--line);
}
path {
  fill: none;
  stroke: var(--ink);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
.note {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 18px;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.acts {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
</style>
