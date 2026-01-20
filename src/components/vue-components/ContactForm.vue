<template>
    <div class="contact-form-container">
        <!-- Tab Button Group for switching between modes -->
        <div class="form-mode-tabs">
            <button
                type="button"
                :class="['tab-button', { active: activeMode === 'booking' }]"
                @click="activeMode = 'booking'"
            >
                Schedule a Call
            </button>
            <button
                type="button"
                :class="['tab-button', { active: activeMode === 'message' }]"
                @click="activeMode = 'message'"
            >
                Send a Message
            </button>
        </div>

        <!-- BOOKING FORM -->
        <div v-if="activeMode === 'booking'" class="form-wrapper booking-form-wrapper">
            <div v-if="!bookingConfirmed" class="booking-form-content">
                <form @submit.prevent="submitBooking" class="booking-form">
                    <fieldset class="margin-bottom-2xs">
                        <legend class="form-legend">Request a Call</legend>
                        <p class="fw3-text-sm fw3-color-contrast-medium margin-bottom-md">
                            Choose a time that works best for you. You'll receive a confirmation email with the meeting link.
                        </p>

                        <div class="grid gap-sm">
                            <!-- Name -->
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="booking-name">
                                    Name
                                </label>
                                <input 
                                    id="booking-name" 
                                    v-model="bookingForm.name"
                                    type="text" 
                                    class="form-input width-100" 
                                    required
                                    placeholder="Your name"
                                    inputmode="text"
                                >
                            </div>

                            <!-- Email -->
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="booking-email">
                                    Email
                                </label>
                                <input 
                                    id="booking-email" 
                                    v-model="bookingForm.email"
                                    type="email" 
                                    class="form-input width-100" 
                                    required
                                    placeholder="your@email.com"
                                    inputmode="email"
                                >
                            </div>

                            <!-- Topic -->
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="booking-topic">
                                    Topic
                                </label>
                                <select 
                                    id="booking-topic"
                                    v-model="bookingForm.topic"
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
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="booking-duration">
                                    Duration
                                </label>
                                <select 
                                    id="booking-duration"
                                    v-model.number="bookingForm.duration_minutes"
                                    class="form-input width-100"
                                >
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 hour</option>
                                </select>
                            </div>

                            <!-- Date Picker -->
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="booking-date">
                                    Date
                                </label>
                                <input 
                                    id="booking-date"
                                    v-model="bookingForm.date"
                                    type="date" 
                                    class="form-input width-100" 
                                    required
                                    :min="minDate"
                                >
                            </div>

                            <!-- Time Picker -->
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="booking-time">
                                    Time
                                </label>
                                <input 
                                    id="booking-time"
                                    v-model="bookingForm.time"
                                    type="time" 
                                    class="form-input width-100" 
                                    required
                                >
                                <p class="fw3-text-xs fw3-color-contrast-medium fw3-margin-top-2xs">
                                    Times shown in {{ timeZoneDisplay }}
                                </p>
                            </div>

                            <!-- Details -->
                            <div class="form-group-full">
                                <label class="form-label margin-bottom-2xs" for="booking-details">
                                    Details (Optional)
                                </label>
                                <textarea 
                                    id="booking-details"
                                    v-model="bookingForm.details"
                                    class="form-input width-100" 
                                    rows="4"
                                    placeholder="Tell us more about your project or goals..."
                                    maxlength="500"
                                ></textarea>
                                <p class="fw3-text-xs fw3-color-contrast-medium fw3-margin-top-2xs">
                                    {{ bookingForm.details.length }} / 500 characters
                                </p>
                            </div>
                        </div>
                    </fieldset>

                    <div class="fw3-margin-top-md flex gap-sm">
                        <button
                            type="submit"
                            :disabled="isBookingLoading || !bookingForm.name || !bookingForm.email || !bookingForm.topic || !bookingForm.date || !bookingForm.time"
                            class="btn btn--primary"
                        >
                            {{ isBookingLoading ? 'Requesting...' : 'Request Call' }}
                        </button>
                    </div>

                    <!-- Error Message -->
                    <div v-if="bookingErrorMessage" class="alert alert--error margin-top-md">
                        {{ bookingErrorMessage }}
                    </div>
                </form>
            </div>

            <!-- Booking Confirmation State -->
            <div v-else class="confirmation-card">
                <div class="confirmation-icon">✓</div>
                <h2>Request Submitted!</h2>
                <p class="confirmation-message">
                    Thanks {{ bookingForm.name }}! We've received your booking request for 
                    <strong>{{ bookingForm.topic }}</strong> on 
                    <strong>{{ formatConfirmationDate() }}</strong>.
                </p>
                <p class="confirmation-subtitle">
                    Check your email at <strong>{{ bookingForm.email }}</strong> for confirmation details and next steps.
                </p>
                
                <div v-if="icsData" class="margin-top-lg">
                    <a :href="icsLink" download="call-booking.ics" class="btn btn--secondary btn--sm">
                        Download Calendar Invite
                    </a>
                </div>

                <button 
                    @click="resetBookingForm" 
                    class="btn btn--tertiary margin-top-md"
                >
                    Request Another Call
                </button>
            </div>
        </div>

        <!-- MESSAGE FORM -->
        <div v-if="activeMode === 'message'" class="form-wrapper message-form-wrapper">
            <div v-if="!messageConfirmed" class="message-form-content">
                <form @submit.prevent="submitMessage" class="message-form">
                    <fieldset class="margin-bottom-2xs">
                        <legend class="form-legend">Send a Message</legend>
                        <p class="fw3-text-sm fw3-color-contrast-medium margin-bottom-md">
                            Have a question or just want to get in touch? Send us a message and we'll respond as soon as possible.
                        </p>

                        <div class="grid gap-sm">
                            <!-- Name -->
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="message-name">
                                    Name
                                </label>
                                <input 
                                    id="message-name" 
                                    v-model="messageForm.name"
                                    type="text" 
                                    class="form-input width-100" 
                                    required
                                    placeholder="Your name"
                                >
                            </div>

                            <!-- Email -->
                            <div class="form-group">
                                <label class="form-label margin-bottom-2xs" for="message-email">
                                    Email
                                </label>
                                <input 
                                    id="message-email" 
                                    v-model="messageForm.email"
                                    type="email" 
                                    class="form-input width-100" 
                                    required
                                    placeholder="your@email.com"
                                >
                            </div>

                            <!-- Subject -->
                            <div class="form-group-full">
                                <label class="form-label margin-bottom-2xs" for="message-subject">
                                    Subject
                                </label>
                                <input 
                                    id="message-subject"
                                    v-model="messageForm.subject"
                                    type="text" 
                                    class="form-input width-100" 
                                    required
                                    placeholder="What's this about?"
                                    maxlength="100"
                                >
                                <p class="fw3-text-xs fw3-color-contrast-medium fw3-margin-top-2xs">
                                    {{ messageForm.subject.length }} / 100 characters
                                </p>
                            </div>

                            <!-- Message -->
                            <div class="form-group-full">
                                <label class="form-label margin-bottom-2xs" for="message-content">
                                    Message
                                </label>
                                <textarea 
                                    id="message-content"
                                    v-model="messageForm.message"
                                    class="form-input width-100" 
                                    rows="6"
                                    required
                                    placeholder="Tell us what's on your mind..."
                                    maxlength="2000"
                                ></textarea>
                                <p class="fw3-text-xs fw3-color-contrast-medium fw3-margin-top-2xs">
                                    {{ messageForm.message.length }} / 2000 characters
                                </p>
                            </div>
                        </div>
                    </fieldset>

                    <div class="fw3-margin-top-md flex gap-sm">
                        <button
                            type="submit"
                            :disabled="isMessageLoading || !messageForm.name || !messageForm.email || !messageForm.subject || !messageForm.message"
                            class="btn btn--primary"
                        >
                            {{ isMessageLoading ? 'Sending...' : 'Send Message' }}
                        </button>
                    </div>

                    <!-- Error Message -->
                    <div v-if="messageErrorMessage" class="alert alert--error margin-top-md">
                        {{ messageErrorMessage }}
                    </div>
                </form>
            </div>

            <!-- Message Confirmation State -->
            <div v-else class="confirmation-card">
                <div class="confirmation-icon">✓</div>
                <h2>Message Sent!</h2>
                <p class="confirmation-message">
                    Thanks {{ messageForm.name }}! We've received your message and will get back to you shortly.
                </p>
                <p class="confirmation-subtitle">
                    We'll send a response to <strong>{{ messageForm.email }}</strong>.
                </p>

                <button 
                    @click="resetMessageForm" 
                    class="btn btn--tertiary margin-top-md"
                >
                    Send Another Message
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
const activeMode = ref<'booking' | 'message'>('booking');

// Detect query param to expand message by default
onMounted(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expand') === 'message') {
        activeMode.value = 'message';
    }
});

// BOOKING FORM DATA
const bookingForm = ref({
    name: '',
    email: '',
    topic: '',
    details: '',
    date: '',
    time: '',
    duration_minutes: 30,
    timezone: clientTimeZone
});

const isBookingLoading = ref(false);
const bookingErrorMessage = ref('');
const bookingConfirmed = ref(false);
const icsData = ref('');

// Pre-fill date and time with 1 hour from now
onMounted(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const year = oneHourLater.getFullYear();
    const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
    const day = String(oneHourLater.getDate()).padStart(2, '0');
    bookingForm.value.date = `${year}-${month}-${day}`;
    
    const hours = String(oneHourLater.getHours()).padStart(2, '0');
    const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');
    bookingForm.value.time = `${hours}:${minutes}`;
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
    if (!bookingForm.value.date || !bookingForm.value.time) return '';
    const local = new Date(`${bookingForm.value.date}T${bookingForm.value.time}`);
    const tz = bookingForm.value.timezone || clientTimeZone;

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
        const tz = bookingForm.value.timezone || clientTimeZone;
        const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' }).formatToParts(now);
        const abbr = parts.find(p => p.type === 'timeZoneName')?.value || tz;
        return `${tz} (${abbr})`;
    } catch (e) {
        return bookingForm.value.timezone || 'UTC';
    }
});

async function submitBooking() {
    isBookingLoading.value = true;
    bookingErrorMessage.value = '';

    try {
        const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;
        const startDateLocal = new Date(`${bookingForm.value.date}T${bookingForm.value.time}`);
        const startAtUtc = startDateLocal.toISOString();
        
        const response = await fetch(`${API_BASE}/api/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: bookingForm.value.name,
                email: bookingForm.value.email,
                topic: bookingForm.value.topic,
                details: bookingForm.value.details,
                start_at: startAtUtc,
                duration_minutes: bookingForm.value.duration_minutes,
                timezone: bookingForm.value.timezone || clientTimeZone
            })
        });

        const data = await response.json();

        if (!response.ok) {
            bookingErrorMessage.value = data.error || 'Failed to submit booking. Please try again.';
            notify({
                message: bookingErrorMessage.value,
                type: 'error'
            });
            return;
        }

        if (data.ics) {
            icsData.value = data.ics;
        }

        bookingConfirmed.value = true;
        notify({
            message: 'Your booking request has been submitted.',
            type: 'success'
        });

    } catch (error) {
        bookingErrorMessage.value = 'Network error. Please check your connection and try again.';
        console.error('Booking error:', error);
        notify({
            message: bookingErrorMessage.value,
            type: 'error'
        });
    } finally {
        isBookingLoading.value = false;
    }
}

function resetBookingForm() {
    bookingForm.value = {
        name: '',
        email: '',
        topic: '',
        details: '',
        date: '',
        time: '',
        duration_minutes: 30,
        timezone: clientTimeZone
    };
    bookingErrorMessage.value = '';
    bookingConfirmed.value = false;
    icsData.value = '';
    
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const year = oneHourLater.getFullYear();
    const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
    const day = String(oneHourLater.getDate()).padStart(2, '0');
    bookingForm.value.date = `${year}-${month}-${day}`;
    
    const hours = String(oneHourLater.getHours()).padStart(2, '0');
    const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');
    bookingForm.value.time = `${hours}:${minutes}`;
}

// MESSAGE FORM DATA
const messageForm = ref({
    name: '',
    email: '',
    subject: '',
    message: ''
});

const isMessageLoading = ref(false);
const messageErrorMessage = ref('');
const messageConfirmed = ref(false);

async function submitMessage() {
    isMessageLoading.value = true;
    messageErrorMessage.value = '';

    try {
        const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;
        
        const response = await fetch(`${API_BASE}/api/contact-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: messageForm.value.name,
                email: messageForm.value.email,
                subject: messageForm.value.subject,
                message: messageForm.value.message
            })
        });

        const data = await response.json();

        if (!response.ok) {
            messageErrorMessage.value = data.error || 'Failed to send message. Please try again.';
            notify({
                message: messageErrorMessage.value,
                type: 'error'
            });
            return;
        }

        messageConfirmed.value = true;
        notify({
            message: 'Your message has been sent successfully!',
            type: 'success'
        });

    } catch (error) {
        messageErrorMessage.value = 'Network error. Please check your connection and try again.';
        console.error('Message error:', error);
        notify({
            message: messageErrorMessage.value,
            type: 'error'
        });
    } finally {
        isMessageLoading.value = false;
    }
}

function resetMessageForm() {
    messageForm.value = {
        name: '',
        email: '',
        subject: '',
        message: ''
    };
    messageErrorMessage.value = '';
    messageConfirmed.value = false;
}
</script>

<style scoped>
.contact-form-container {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

/* Form Mode Toggle */
.form-mode-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 2rem;
    background: rgba(15, 23, 42, 0.05);
    padding: 0.4rem;
    border-radius: 8px;
}

.tab-button {
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    background: transparent;
    color: var(--color-slate-600);
    text-align: center;
    user-select: none;
}

.tab-button:hover:not(.active) {
    color: var(--color-navy);
    background: rgba(15, 23, 42, 0.08);
}

.tab-button.active {
    background: var(--color-cyan);
    color: white;
    box-shadow: 0 2px 8px rgba(6, 182, 212, 0.2);
}

.tab-button:active {
    transform: scale(0.98);
}

/* Form Wrappers */
.form-wrapper {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.booking-form-wrapper,
.message-form-wrapper {
    background: var(--color-white);
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 8px;
    padding: 2rem;
}

/* Form Styles */
.booking-form,
.message-form {
    display: flex;
    flex-direction: column;
}

.form-legend {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-navy);
    margin-bottom: 0.5rem;
}

.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-navy);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-mono);
}

.form-input {
    padding: 0.75rem 1rem;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 6px;
    font-size: 1rem;
    font-family: var(--font-body);
    background: var(--color-white);
    color: var(--color-navy);
    transition: all 0.2s ease;
}

.form-input::placeholder {
    color: var(--color-slate-600);
}

.form-input:focus {
    outline: none;
    border-color: var(--color-cyan);
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}

.form-input:disabled {
    background: rgba(15, 23, 42, 0.03);
    cursor: not-allowed;
    opacity: 0.6;
}

select.form-input {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230f172a' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    padding-right: 2.5rem;
}

textarea.form-input {
    resize: vertical;
    min-height: 6rem;
    font-family: var(--font-body);
}

/* Buttons */
.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
}

.btn--primary {
    background: var(--color-red);
    color: white;
}

.btn--primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn--secondary {
    background: rgba(15, 23, 42, 0.05);
    color: var(--color-navy);
    border: 1px solid rgba(15, 23, 42, 0.12);
}

.btn--secondary:hover:not(:disabled) {
    background: var(--color-cyan);
    color: white;
    border-color: var(--color-cyan);
}

.btn--tertiary {
    background: transparent;
    color: var(--color-cyan);
    border: 1px solid var(--color-cyan);
}

.btn--tertiary:hover:not(:disabled) {
    background: var(--color-cyan);
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

/* Alerts */
.alert {
    padding: 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
}

.alert--error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-red);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Confirmation Card */
.confirmation-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 400px;
    text-align: center;
}

.confirmation-icon {
    font-size: 3.5rem;
    color: var(--color-cyan);
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
    color: var(--color-navy);
    margin-bottom: 1rem;
}

.confirmation-message {
    font-size: 1rem;
    color: var(--color-navy);
    line-height: 1.6;
    margin-bottom: 1rem;
}

.confirmation-subtitle {
    font-size: 0.875rem;
    color: var(--color-slate-600);
    line-height: 1.5;
    margin-bottom: 0.25rem;
}

/* Utility Classes */
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
    color: var(--color-slate-600);
}

.fw3-margin-top-2xs {
    margin-top: 0.25rem;
}

.width-100 {
    width: 100%;
}

.grid {
    display: grid;
    grid-template-columns: 1fr;
}

@media (min-width: 768px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .form-group-full {
        grid-column: 1 / -1;
    }
}

/* Responsive */
@media (max-width: 55em) {
    .booking-form-wrapper,
    .message-form-wrapper {
        padding: 1.5rem;
    }

    .form-legend {
        font-size: 1.25rem;
    }

    .confirmation-card {
        min-height: 300px;
    }

    .confirmation-icon {
        font-size: 3rem;
    }

    .confirmation-card h2 {
        font-size: 1.5rem;
    }

    .form-mode-toggle {
        flex-direction: column;
        gap: 1rem;
    }

    .radio-label {
        gap: 1rem;
    }
}
</style>