<script setup lang="ts">
/**
 * Bookings from the old site's "book a call" form. The new site has no
 * booking form, so this is for reviewing and approving what is already in
 * the database.
 */
import { onMounted, ref } from "vue";
import { api } from "~/utils/api";

type Booking = {
  id: string;
  name: string;
  email: string;
  topic: string;
  details: string | null;
  start_at: string;
  duration_minutes: number;
  timezone: string | null;
  status: string;
};

const TOKEN_KEY = "ADMIN_API_TOKEN"; // shared with the marks admin
const token = ref("");
const bookings = ref<Booking[]>([]);
const loading = ref(false);
const error = ref("");
const meetLinks = ref<Record<string, string>>({});

onMounted(() => {
  token.value = localStorage.getItem(TOKEN_KEY) || "";
  if (token.value) load();
});

const auth = () => ({ Authorization: `Bearer ${token.value}` });

function when(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    localStorage.setItem(TOKEN_KEY, token.value);
    bookings.value = await api<Booking[]>("/api/admin/bookings", { headers: auth() });
  } catch (e: any) {
    error.value = e?.message || "Could not load bookings.";
  } finally {
    loading.value = false;
  }
}

function forget() {
  token.value = "";
  bookings.value = [];
  localStorage.removeItem(TOKEN_KEY);
}

async function approve(b: Booking) {
  error.value = "";
  loading.value = true;
  try {
    await api("/api/admin/bookings/approve", {
      method: "POST",
      headers: auth(),
      json: { bookingId: b.id, meetLink: meetLinks.value[b.id] || "" },
    });
    await load();
  } catch (e: any) {
    error.value = e?.message || "That didn't work.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="admin">
    <h1>Bookings</h1>
    <div class="bar">
      <input v-model="token" type="password" placeholder="ADMIN_API_TOKEN" aria-label="Admin token" />
      <button type="button" @click="load" :disabled="!token || loading">{{ loading ? "loading…" : "load" }}</button>
      <button type="button" @click="forget" :disabled="!token">forget</button>
    </div>
    <p v-if="error" class="err" role="alert">{{ error }}</p>
    <p v-else-if="!bookings.length && !loading" class="meta">Nothing here.</p>
    <ul class="list">
      <li v-for="b in bookings" :key="b.id">
        <div class="head">
          <strong>{{ b.name }}</strong>
          <span class="status" :class="b.status">{{ b.status }}</span>
        </div>
        <span class="meta">{{ b.email }} · {{ b.topic }} · {{ b.duration_minutes }} min</span>
        <span>{{ when(b.start_at, b.timezone || "Asia/Kolkata") }} ({{ b.timezone || "Asia/Kolkata" }})</span>
        <p v-if="b.details" class="details">{{ b.details }}</p>
        <div v-if="b.status !== 'approved'" class="acts">
          <input v-model="meetLinks[b.id]" type="url" placeholder="Meet link (optional)" aria-label="Meet link" />
          <button type="button" :disabled="loading" @click="approve(b)">approve</button>
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
h1 {
  margin: 0;
  font-family: var(--font-serif);
  font-weight: 300;
}
.bar,
.acts {
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
button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
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
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.status {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
}
.status.approved {
  color: var(--accent);
}
.details {
  margin: 0;
  color: var(--muted);
}
.acts {
  margin-top: 6px;
}
</style>
