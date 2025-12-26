<template>
    <div class="booking-container">
        <div v-if="!bookingConfirmed" class="booking-form-wrapper">
            <form @submit.prevent="submitBooking" class="booking-form">
                <fieldset class="margin-bottom-2xs">
                    <legend class="form-legend">Request a Call</legend>
                    <p class="fw3-text-sm fw3-color-contrast-medium margin-bottom-md">
                        Choose a time that works best for you. You'll receive a confirmation email with the meeting link.
                    </p>

                    <div class="grid gap-sm">
                        <!-- Name -->
                        <div class="col-6@md">
                            <label class="form-label margin-bottom-2xs" for="booking-name">
                                Name
                            </label>
                            <input 
                                id="booking-name" 
                                v-model="form.name"
                                type="text" 
                                class="form-input width-100" 
                                required
                                placeholder="Your name"
                            >
                        </div>

                        <!-- Email -->
                        <div class="col-6@md">
                            <label class="form-label margin-bottom-2xs" for="booking-email">
                                Email
                            </label>
                            <input 
                                id="booking-email" 
                                v-model="form.email"
                                type="email" 
                                class="form-input width-100" 
                                required
                                placeholder="your@email.com"
                            >
                        </div>

                        <!-- Topic -->
                        <div class="col-6@md">
                            <label class="form-label margin-bottom-2xs" for="booking-topic">
                                Topic
                            </label>
                            <select 
                                id="booking-topic"
                                v-model="form.topic"
                                class="form-input width-100"
                                required
                            >
                                <option value="">Select a topic</option>
                                <option value="Website Design">Website Design</option>
                                <option value="Web Application">Web Application</option>
                                <option value="Consultation">General Consultation</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <!-- Duration -->
                        <div class="col-6@md">
                            <label class="form-label margin-bottom-2xs" for="booking-duration">
                                Duration
                            </label>
                            <select 
                                id="booking-duration"
                                v-model.number="form.duration_minutes"
                                class="form-input width-100"
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">1 hour</option>
                            </select>
                        </div>

                        <!-- Date Picker -->
                        <div class="col-6@md">
                            <label class="form-label margin-bottom-2xs" for="booking-date">
                                Date
                            </label>
                            <input 
                                id="booking-date"
                                v-model="form.date"
                                type="date" 
                                class="form-input width-100" 
                                required
                                :min="minDate"
                            >
                        </div>

                        <!-- Time Picker -->
                        <div class="col-6@md">
                            <label class="form-label margin-bottom-2xs" for="booking-time">
                                Time
                            </label>
                            <input 
                                id="booking-time"
                                v-model="form.time"
                                type="time" 
                                class="form-input width-100" 
                                required
                            >
                            <p class="fw3-text-xs fw3-color-contrast-medium fw3-margin-top-2xs">
                                Times shown in {{ timeZoneDisplay }}
                            </p>
                        </div>

                        <!-- Details -->
                        <div>
                            <label class="form-label margin-bottom-2xs" for="booking-details">
                                Details (Optional)
                            </label>
                            <textarea 
                                id="booking-details"
                                v-model="form.details"
                                class="form-input width-100" 
                                rows="4"
                                placeholder="Tell us more about your project or goals..."
                                maxlength="500"
                            ></textarea>
                            <p class="fw3-text-xs fw3-color-contrast-medium fw3-margin-top-2xs">
                                {{ form.details.length }} / 500 characters
                            </p>
                        </div>
                    </div>
                </fieldset>

                <div class="fw3-margin-top-md flex gap-sm">
                    <button
                        type="submit"
                        :disabled="isLoading || !form.name || !form.email || !form.topic || !form.date || !form.time"
                        class="btn btn--primary"
                    >
                        {{ isLoading ? 'Requesting...' : 'Request Call' }}
                    </button>
                </div>

                <!-- Error Message -->
                <div v-if="errorMessage" class="alert alert--error margin-top-md">
                    {{ errorMessage }}
                </div>
            </form>
        </div>

        <!-- Confirmation State -->
        <div v-else class="booking-confirmation">
            <div class="confirmation-card">
                <div class="confirmation-icon">✓</div>
                <h2>Request Submitted!</h2>
                <p class="confirmation-message">
                    Thanks {{ form.name }}! We've received your booking request for 
                    <strong>{{ form.topic }}</strong> on 
                    <strong>{{ formatConfirmationDate() }}</strong>.
                </p>
                <p class="confirmation-subtitle">
                    Check your email at <strong>{{ form.email }}</strong> for confirmation details and next steps.
                </p>
                
                <div v-if="icsData" class="margin-top-lg">
                    <a :href="icsLink" download="call-booking.ics" class="btn btn--secondary btn--sm">
                        Download Calendar Invite
                    </a>
                </div>

                <button 
                    @click="resetForm" 
                    class="btn btn--tertiary margin-top-md"
                >
                    Request Another Call
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import useNotification from '~/utils/useNotification.ts';

const { notify } = useNotification();

const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

const form = ref({
    name: '',
    email: '',
    topic: '',
    details: '',
    date: '',
    time: '',
    duration_minutes: 30,
    timezone: clientTimeZone
});

const isLoading = ref(false);
const errorMessage = ref('');
const bookingConfirmed = ref(false);
const icsData = ref('');

// Pre-fill date and time with 1 hour from now
onMounted(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Format date as YYYY-MM-DD
    const year = oneHourLater.getFullYear();
    const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
    const day = String(oneHourLater.getDate()).padStart(2, '0');
    form.value.date = `${year}-${month}-${day}`;
    
    // Format time as HH:MM
    const hours = String(oneHourLater.getHours()).padStart(2, '0');
    const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');
    form.value.time = `${hours}:${minutes}`;
});

const minDate = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
});

const icsLink = computed(() => {
    if (!icsData.value) return '';
    const blob = new Blob([icsData.value], { type: 'text/calendar' });
    return URL.createObjectURL(blob);
});

function formatConfirmationDate() {
    if (!form.value.date || !form.value.time) return '';
    const local = new Date(`${form.value.date}T${form.value.time}`);
    const tz = form.value.timezone || clientTimeZone;

    const localLabel = new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: tz
    }).format(local);

    const utcLabel = new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    }).format(local);

    return `${localLabel} (${tz}) · ${utcLabel} (UTC)`;
}

const timeZoneDisplay = computed(() => {
    try {
        const now = new Date();
        const tz = form.value.timezone || clientTimeZone;
        const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' }).formatToParts(now);
        const abbr = parts.find(p => p.type === 'timeZoneName')?.value || tz;
        return `${tz} (${abbr})`;
    } catch (e) {
        return form.value.timezone || 'UTC';
    }
});

async function submitBooking() {
    isLoading.value = true;
    errorMessage.value = '';

    try {
        const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;
        const startDateLocal = new Date(`${form.value.date}T${form.value.time}`);
        const startAtUtc = startDateLocal.toISOString();
        
        const response = await fetch(`${API_BASE}/api/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: form.value.name,
                email: form.value.email,
                topic: form.value.topic,
                details: form.value.details,
                start_at: startAtUtc,
                duration_minutes: form.value.duration_minutes,
                timezone: form.value.timezone || clientTimeZone
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessage.value = data.error || 'Failed to submit booking. Please try again.';
            notify({
                message: errorMessage.value,
                type: 'error'
            });
            return;
        }

        // Store ICS data for download
        if (data.ics) {
            icsData.value = data.ics;
        }

        bookingConfirmed.value = true;
        notify({
            message: 'Your booking request has been submitted.',
            type: 'success'
        });

    } catch (error) {
        errorMessage.value = 'Network error. Please check your connection and try again.';
        console.error('Booking error:', error);
        notify({
            message: errorMessage.value,
            type: 'error'
        });
    } finally {
        isLoading.value = false;
    }
}

function resetForm() {
    form.value = {
        name: '',
        email: '',
        topic: '',
        details: '',
        date: '',
        time: '',
        duration_minutes: 30,
        timezone: clientTimeZone
    };
    errorMessage.value = '';
    bookingConfirmed.value = false;
    icsData.value = '';
}
</script>

<style scoped>
.booking-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

.booking-form-wrapper {
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 12px;
    padding: 2rem;
}

.booking-form {
    display: flex;
    flex-direction: column;
}

.form-legend {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--clr-primary);
    margin-bottom: 0.5rem;
}

.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--clr-primary);
}

.form-input {
    padding: 0.75rem 1rem;
    border: 1px solid var(--clr-border);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    background: white;
    color: var(--clr-primary);
    transition: all 0.2s ease;
}

.form-input:focus {
    outline: none;
    border-color: var(--clr-accent);
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.1);
}

.form-input:disabled {
    background: var(--clr-border);
    cursor: not-allowed;
    opacity: 0.6;
}

select.form-input {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    padding-right: 2.5rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
}

.btn--primary {
    background: var(--clr-accent);
    color: white;
}

.btn--primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.btn--secondary {
    background: var(--clr-border);
    color: var(--clr-primary);
}

.btn--secondary:hover:not(:disabled) {
    background: var(--clr-accent);
    color: white;
}

.btn--tertiary {
    background: transparent;
    color: var(--clr-accent);
    border: 1px solid var(--clr-accent);
}

.btn--tertiary:hover:not(:disabled) {
    background: var(--clr-accent);
    color: white;
}

.btn--sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.alert {
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
}

.alert--error {
    background: rgba(220, 53, 69, 0.1);
    color: #dc3545;
    border: 1px solid rgba(220, 53, 69, 0.3);
}

.booking-confirmation {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
}

.confirmation-card {
    text-align: center;
    background: var(--clr-surface);
    border: 1px solid var(--clr-border);
    border-radius: 12px;
    padding: 3rem 2rem;
    width: 100%;
    max-width: 500px;
}

.confirmation-icon {
    font-size: 3.5rem;
    color: var(--clr-accent);
    margin-bottom: 1rem;
    animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
    from {
        transform: scale(0.5);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.confirmation-card h2 {
    font-size: 1.75rem;
    color: var(--clr-primary);
    margin-bottom: 1rem;
}

.confirmation-message {
    font-size: 1rem;
    color: var(--clr-primary);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.confirmation-subtitle {
    font-size: 0.875rem;
    color: var(--clr-contrast-medium);
    line-height: 1.5;
}

.flex {
    display: flex;
}

.gap-sm {
    gap: 0.5rem;
}

.margin-top-lg {
    margin-top: 1.5rem;
}

.margin-top-md {
    margin-top: 1rem;
}

.margin-bottom-md {
    margin-bottom: 1rem;
}

.margin-bottom-2xs {
    margin-bottom: 0.25rem;
}

.fw3-text-sm {
    font-size: 0.875rem;
}

.fw3-text-xs {
    font-size: 0.75rem;
}

.fw3-color-contrast-medium {
    color: var(--clr-contrast-medium);
}

.width-100 {
    width: 100%;
}

@media (max-width: 55em) {
    .booking-form-wrapper {
        padding: 1.5rem;
    }

    .form-legend {
        font-size: 1.25rem;
    }

    .confirmation-card {
        padding: 2rem 1.5rem;
    }

    .confirmation-icon {
        font-size: 3rem;
    }

    .confirmation-card h2 {
        font-size: 1.5rem;
    }
}
</style>
