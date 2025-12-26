# Booking System Setup Guide

## Overview

The booking system allows users to request calls with you. Requests are stored in Cloudflare D1 and require admin approval before confirmation.

## Components

### 1. Database Schema

**Location:** `migrations/0003_create_bookings_table.sql`

Tables:

- `bookings`: Stores call booking requests

  - `id`: UUID primary key
  - `name`, `email`, `topic`: User info and topic
  - `details`: Optional project details
  - `status`: 'pending' | 'approved' | 'declined'
  - `start_at`: Requested call time (ISO format)
  - `duration_minutes`: Call length (default 30)
  - `meet_link`: Google Meet/Zoom link (added when approved)
  - `created_at`, `updated_at`: Timestamps

- `availability_slots`: (optional) Pre-configured working hours

### 2. API Endpoints

#### POST `/api/book` - Submit Booking Request

```javascript
// Request
{
  "name": "John Doe",
  "email": "john@example.com",
  "topic": "Website Design",
  "details": "Need a portfolio website",
  "start_at": "2024-01-15T14:00:00Z",
  "duration_minutes": 30
}

// Response (201)
{
  "success": true,
  "bookingId": "uuid-string",
  "message": "Booking request submitted. You'll receive a confirmation email shortly.",
  "ics": "ICS calendar format string"
}

// Error Response (409 - Time conflict)
{
  "error": "This time slot is already booked. Please select another time."
}
```

Features:

- ✅ Validates required fields
- ✅ Checks for time conflicts (overlapping pending/approved bookings)
- ✅ Generates ICS calendar invite
- ✅ Sends admin notification email
- ✅ Stores booking with 'pending' status

#### GET `/api/booking-slots` - Available Time Slots

```javascript
// Request
GET /api/booking-slots?days=7&duration=30

// Response
[
  {
    "start": "2024-01-15T09:00:00Z",
    "end": "2024-01-15T09:30:00Z",
    "label": "1/15/2024, 9:00 AM"
  },
  ...
]
```

Features:

- 📅 Generates slots for next N days
- ⏰ Skips weekends and outside working hours (9 AM - 5 PM)
- 🚫 Excludes already-booked times

#### POST `/api/admin/bookings/approve` - Approve Booking (Protected)

```javascript
// Request (requires Authorization header with ADMIN_API_TOKEN)
{
  "bookingId": "uuid-string",
  "meetLink": "https://meet.google.com/..."
}

// Response
{
  "success": true,
  "booking": { ... updated booking ... }
}
```

Features:

- 🔐 Protected by ADMIN_API_TOKEN
- 📧 Sends confirmation email to user with meeting link
- ✅ Sets status to 'approved'

#### GET `/api/admin/bookings` - List All Bookings (Protected)

```javascript
// Request (requires Authorization header with ADMIN_API_TOKEN)
GET /api/admin/bookings

// Response
[
  {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "topic": "Website Design",
    "status": "pending",
    "start_at": "2024-01-15T14:00:00Z",
    ...
  },
  ...
]
```

### 3. Frontend Components

#### BookingForm.vue

Location: `src/components/vue-components/BookingForm.vue`

Features:

- 📝 Form fields: Name, Email, Topic (select), Details (textarea), Date, Time, Duration
- 📅 Date picker (min: tomorrow)
- 🎯 Topic options: Website Design, Web Application, Consultation, Other
- ⏱️ Duration options: 15, 30, 45 minutes, 1 hour
- ✨ Success confirmation with calendar invite download
- ❌ Error handling with user-friendly messages
- 📱 Responsive design

Props: None (client-side component)

### 4. Environment Variables

Add to `wrangler.toml`:

```toml
[env.production.vars]
ADMIN_EMAIL = "avik@avikb.dev"
ADMIN_API_TOKEN = "your-secret-token-here"
MAIL_API_URL = "https://your-email-api-endpoint"
MAIL_API_KEY = "your-email-api-key"
```

## Setup Steps

### 1. Create Database Tables

```bash
npx wrangler d1 execute portfolio-messages-db --file=migrations/0003_create_bookings_table.sql
```

### 2. Configure Environment Variables

Update `wrangler.toml` with:

- `ADMIN_EMAIL`: Your email (avik@avikb.dev)
- `ADMIN_API_TOKEN`: Secret token for admin endpoints (generate random string)
- `MAIL_API_URL`: Email service API endpoint
- `MAIL_API_KEY`: Email service API key

Options for email service:

- **Hostinger SMTP**: Use Resend or Postmark wrapper
- **Resend**: `https://api.resend.com/emails` (recommended for Cloudflare)
- **Postmark**: `https://api.postmarkapp.com/email`
- **SendGrid**: `https://api.sendgrid.com/v3/mail/send`

### 3. Deploy Worker

```bash
npm run deploy
```

### 4. Create Admin Dashboard (Optional)

To manage bookings, create a protected admin page at `src/pages/admin/bookings.astro` with:

- List of pending bookings
- "Approve" button (calls `/api/admin/bookings/approve`)
- "Decline" button (updates status to 'declined')
- Calendar view of approved bookings

## Email Notifications

### Admin Notification (on new booking)

Sent to: `ADMIN_EMAIL` (avik@avikb.dev)
Subject: "New call booking request from {name}"
Content: Booking details + link to admin dashboard

### User Confirmation (on approval)

Sent to: User's email
Subject: "Call Confirmed - {topic}"
Content: Confirmation details + meeting link

## Security Notes

⚠️ **Important:**

1. **Admin Token**: Generate a secure random token (32+ characters)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **CORS**: Worker already includes CORS headers for `avikb.dev` domain

3. **Email Service**: Keep `MAIL_API_KEY` secret in Wrangler secrets, never commit to GitHub

   ```bash
   npx wrangler secret put MAIL_API_KEY
   ```

4. **Rate Limiting** (Optional): Add to prevent spam
   ```javascript
   // Check IP-based rate limits before processing booking
   const clientIP = request.headers.get("CF-Connecting-IP");
   // Implement Cloudflare Rate Limiting API
   ```

## Testing

### Test Booking Submission

```bash
curl -X POST http://localhost:8787/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "topic": "Website Design",
    "details": "Test booking",
    "start_at": "2024-01-15T14:00:00Z",
    "duration_minutes": 30
  }'
```

### Test Admin Approval

```bash
curl -X POST http://localhost:8787/api/admin/bookings/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "bookingId": "booking-id-from-response",
    "meetLink": "https://meet.google.com/abc-defg-hij"
  }'
```

### Test Available Slots

```bash
curl http://localhost:8787/api/booking-slots?days=7&duration=30
```

## Troubleshooting

### Email not sending?

- Check `MAIL_API_URL` and `MAIL_API_KEY` are set in `wrangler.toml`
- Verify email service is active and has remaining quota
- Check Cloudflare Worker logs: `npx wrangler tail`

### Bookings showing as available when they shouldn't?

- Check conflict detection logic in `/api/book` endpoint
- Verify database indexes on `start_at` and `status`
- Query DB directly: `SELECT * FROM bookings WHERE status IN ('pending', 'approved')`

### Date/time picker not showing?

- Ensure browser supports HTML5 `<input type="date">` and `<input type="time">`
- Check browser console for JavaScript errors
- Verify `client:load` directive is present in contact.astro

## Future Enhancements

- ⏰ Timezone support (currently UTC)
- 🔔 SMS notifications instead of email
- 📱 Calendar sync (Google Calendar, iCal)
- 🤖 Auto-confirmation for booked slots
- 📊 Admin dashboard with analytics
- 💳 Stripe integration for paid consultations
- 🔐 Two-factor auth for admin endpoint
