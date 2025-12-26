<template>
  <div class="admin-bookings">
    <h1 class="margin-bottom-sm">Admin: Bookings</h1>

    <div class="card margin-bottom-md">
      <label class="form-label margin-bottom-2xs" for="admin-token">Admin API Token</label>
      <input
        id="admin-token"
        v-model="token"
        type="password"
        class="form-input width-100"
        placeholder="Enter your ADMIN_API_TOKEN"
      />
      <div class="flex gap-sm margin-top-2xs">
        <button class="btn btn--secondary" @click="saveToken">Save Token</button>
        <button class="btn btn--tertiary" @click="clearToken">Clear</button>
        <button class="btn btn--primary" :disabled="!token" @click="fetchBookings">Load Bookings</button>
      </div>
      <p v-if="error" class="alert alert--error margin-top-2xs">{{ error }}</p>
    </div>

    <div class="flex horizontal-align-between vertical-align-center margin-bottom-2xs">
      <h2>Latest Bookings</h2>
      <button class="btn btn--sm" :disabled="loading || !token" @click="fetchBookings">
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="bookings.length === 0 && !loading" class="fw3-text-sm fw3-color-contrast-medium">
      No bookings yet.
    </div>

    <div v-for="b in bookings" :key="b.id" class="card margin-bottom-sm">
      <div class="flex horizontal-align-between vertical-align-center">
        <div>
          <strong>{{ b.name }}</strong> • {{ b.email }}
          <div class="fw3-text-sm fw3-color-contrast-medium">
            Topic: {{ b.topic }} • Status: <span :class="statusClass(b.status)">{{ b.status }}</span>
          </div>
        </div>
        <div class="fw3-text-sm">
          <span title="Booking ID">ID:</span> {{ b.id }}
        </div>
      </div>
      <div class="fw3-text-sm margin-top-2xs">
        When: {{ formatDate(b.start_at, b.timezone || 'Asia/Kolkata') }} ({{ b.timezone || 'Asia/Kolkata' }})
      </div>

      <div class="flex gap-sm margin-top-sm">
        <input
          v-model="meetLinks[b.id]"
          type="url"
          class="form-input"
          placeholder="Meet link (optional)"
        />
        <button
          class="btn btn--primary"
          :disabled="loading || b.status === 'approved'"
          @click="approve(b.id)"
        >
          Approve
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;
const token = ref('');
const bookings = ref<Array<any>>([]);
const loading = ref(false);
const error = ref('');
const meetLinks = ref<Record<string, string>>({});

onMounted(() => {
  const saved = localStorage.getItem('ADMIN_API_TOKEN');
  if (saved) {
    token.value = saved;
    fetchBookings();
  }
});

function saveToken() {
  localStorage.setItem('ADMIN_API_TOKEN', token.value);
}

function clearToken() {
  token.value = '';
  localStorage.removeItem('ADMIN_API_TOKEN');
}

function statusClass(status: string) {
  return status === 'approved' ? 'tag tag--success' : status === 'pending' ? 'tag tag--warning' : 'tag';
}

function formatDate(iso: string, tz: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz
    }).format(d);
  } catch {
    return iso;
  }
}

async function fetchBookings() {
  error.value = '';
  bookings.value = [];
  if (!API_BASE) {
    error.value = 'API endpoint missing (PUBLIC_API_ENDPOINT).';
    return;
  }
  if (!token.value) {
    error.value = 'Admin token is required.';
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/admin/bookings`, {
      headers: { Authorization: `Bearer ${token.value}` }
    });
    if (!res.ok) throw new Error(await res.text());
    bookings.value = await res.json();
  } catch (e: any) {
    error.value = e?.message || 'Failed to load bookings.';
  } finally {
    loading.value = false;
  }
}

async function approve(bookingId: string) {
  error.value = '';
  if (!API_BASE || !token.value) return;
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/admin/bookings/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`
      },
      body: JSON.stringify({ bookingId, meetLink: meetLinks.value[bookingId] || '' })
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchBookings();
  } catch (e: any) {
    error.value = e?.message || 'Failed to approve booking.';
  } finally {
    loading.value = false;
  }
}
</script>

<style>
.card { padding: 1rem; border: 1px solid #e2e2e2; border-radius: 8px; }
.tag { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; background: #eee; font-size: 12px; }
.tag--success { background: #d3f9d8; }
.tag--warning { background: #fff3bf; }
</style>
