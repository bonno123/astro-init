import { handleMarks } from "./marks.js";
import { handleBroadcasts } from "./broadcasts.js";

// Durable Object classes have to be exported from the Worker's main module.
export { BroadcastHub } from "./hub.js";

/** Escape text that visitors typed before it goes into email HTML. */
function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** Only http(s) links go into emails. */
function safeLink(v) {
    try {
        const u = new URL(String(v || ""));
        return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
    } catch {
        return "";
    }
}

/** A date as "25 Nov 2026, 14:00" in the given zone; ISO if the zone is bad. */
function formatInTimeZone(date, timeZone) {
    try {
        return new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone
        }).format(date);
    } catch (e) {
        return date.toISOString();
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Define allowed origins
        const allowedOrigins = [
            "https://avikb.dev",
            "https://www.avikb.dev", 
            "https://bonno123.github.io",
            "http://localhost:4321"
        ];

        // Get the origin from the request
        const origin = request.headers.get("Origin");
        
        const corsHeaders = {
            // Any localhost port is fine for local development.
            "Access-Control-Allow-Origin":
                allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin || "") ? origin : "https://avikb.dev",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };
        
        // Handle CORS preflight requests
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }
        
        // API endpoints
        try {
            // Visitors' book
            if (url.pathname === "/api/marks" || url.pathname.startsWith("/api/admin/marks")) {
                const res = await handleMarks(request, env, url, corsHeaders);
                if (res) return res;
            }

            // Full-screen greeting on the home page
            if (url.pathname.startsWith("/api/broadcast") || url.pathname.startsWith("/api/admin/broadcasts")) {
                const res = await handleBroadcasts(request, env, url, corsHeaders);
                if (res) return res;
            }

            // Send contact message endpoint (direct message without booking)
            if (request.method === "POST" && url.pathname === "/api/contact-message") {
                const data = await request.json();
                const { name, email, subject, message } = data;
                
                // Input validation
                if (!name || !email || !subject || !message) {
                    return new Response(JSON.stringify({ 
                        error: "name, email, subject, and message are required" 
                    }), { 
                        status: 400, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                try {
                    const db = env.DB;
                    const messageId = crypto.randomUUID();
                    
                    // Insert contact message
                    await db.prepare(`
                        INSERT INTO contact_messages (id, name, email, subject, message, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `).bind(messageId, name, email, subject, message).run();
                    
                    // Send email notification to admin
                    if (env.MAIL_API_URL && env.MAIL_API_KEY) {
                        try {
                            const adminEmail = env.ADMIN_EMAIL || 'avik@avikb.dev';
                            
                            await fetch(env.MAIL_API_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${env.MAIL_API_KEY}`
                                },
                                body: JSON.stringify({
                                    from: env.ADMIN_EMAIL ? `Contact <${env.ADMIN_EMAIL}>` : 'Contact <contact@avikb.dev>',
                                    to: adminEmail,
                                    subject: `New Message: ${subject}`,
                                    html: `
                                        <h2>New Message from Contact Form</h2>
                                        <p><strong>From:</strong> ${esc(name)}</p>
                                        <p><strong>Email:</strong> ${esc(email)}</p>
                                        <p><strong>Subject:</strong> ${esc(subject)}</p>
                                        <hr>
                                        <h3>Message:</h3>
                                        <p>${esc(message).replace(/\n/g, '<br>')}</p>
                                        <hr>
                                        <p><small>Submitted at: ${new Date().toISOString()}</small></p>
                                    `
                                })
                            });
                        } catch (e) {
                            console.error("Failed to send contact notification email:", e);
                        }
                    }
                    
                    // Send confirmation email to user
                    if (env.MAIL_API_URL && env.MAIL_API_KEY) {
                        try {
                            await fetch(env.MAIL_API_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${env.MAIL_API_KEY}`
                                },
                                body: JSON.stringify({
                                    from: env.ADMIN_EMAIL ? `Contact <${env.ADMIN_EMAIL}>` : 'Contact <contact@avikb.dev>',
                                    to: email,
                                    subject: `We received your message - ${subject}`,
                                    html: `
                                        <p>Hi ${esc(name)},</p>
                                        <p>Thank you for reaching out! We've received your message and will get back to you as soon as possible.</p>
                                        <p><strong>Your message subject:</strong> ${esc(subject)}</p>
                                        <p>Best regards,<br>Avik</p>
                                    `
                                })
                            });
                        } catch (e) {
                            console.error("Failed to send confirmation email to user:", e);
                        }
                    }
                    
                    console.log("New contact message created:", messageId);
                    
                    return new Response(JSON.stringify({ 
                        success: true,
                        messageId,
                        message: "Thank you for your message! We'll get back to you shortly."
                    }), { 
                        status: 201,
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                    
                } catch (error) {
                    console.error("Contact message error:", error);
                    return new Response(JSON.stringify({ 
                        error: "Failed to send message: " + error.message 
                    }), { 
                        status: 500, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
            }
            
            // Get bookings for admin (protected)
            if (request.method === "GET" && url.pathname === "/api/admin/bookings") {
                const authHeader = request.headers.get('Authorization');
                const token = authHeader?.replace('Bearer ', '');
                
                // No secret configured means nobody gets in, not everybody.
                if (!env.ADMIN_API_TOKEN || token !== env.ADMIN_API_TOKEN) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                try {
                    const db = env.DB;
                    const { results } = await db.prepare(`
                        SELECT * FROM bookings 
                        ORDER BY start_at DESC 
                        LIMIT 50
                    `).all();
                    
                    return new Response(JSON.stringify(results), { 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                } catch (error) {
                    return new Response(JSON.stringify({ error: error.message }), { 
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
            }
            
            // Approve booking (protected)
            if (request.method === "POST" && url.pathname === "/api/admin/bookings/approve") {
                const authHeader = request.headers.get('Authorization');
                const token = authHeader?.replace('Bearer ', '');
                
                // No secret configured means nobody gets in, not everybody.
                if (!env.ADMIN_API_TOKEN || token !== env.ADMIN_API_TOKEN) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                try {
                    const data = await request.json();
                    const { bookingId, meetLink } = data;
                    
                    const db = env.DB;
                    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").bind(bookingId).first();
                    
                    if (!booking) {
                        return new Response(JSON.stringify({ error: "Booking not found" }), { 
                            status: 404,
                            headers: { ...corsHeaders, "Content-Type": "application/json" } 
                        });
                    }
                    
                    // Update booking
                    await db.prepare(`
                        UPDATE bookings 
                        SET status = 'approved', meet_link = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).bind(meetLink || null, bookingId).run();
                    
                    // Send confirmation email to user
                    if (env.MAIL_API_URL && env.MAIL_API_KEY) {
                        try {
                            const bookingTz = booking.timezone || env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
                            const startDate = new Date(booking.start_at);
                            const startDateLocal = formatInTimeZone(startDate, bookingTz);
                            const startDateIST = formatInTimeZone(startDate, 'Asia/Kolkata');
                            const startDateUTC = formatInTimeZone(startDate, 'UTC');

                            await fetch(env.MAIL_API_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${env.MAIL_API_KEY}`
                                },
                                body: JSON.stringify({
                                    from: env.ADMIN_EMAIL ? `Booking <${env.ADMIN_EMAIL}>` : 'Booking <booking@avikb.dev>',
                                    to: booking.email,
                                    subject: `Call Confirmed - ${booking.topic}`,
                                    html: `
                                        <h2>Your Call is Confirmed!</h2>
                                        <p>Hi ${esc(booking.name)},</p>
                                        <p>Your call request for <strong>${esc(booking.topic)}</strong> has been approved.</p>
                                        <p><strong>When:</strong> ${startDateLocal} (${esc(bookingTz)})</p>
                                        <p><strong>In IST:</strong> ${startDateIST}</p>
                                        <p><strong>In UTC:</strong> ${startDateUTC}</p>
                                        <p><strong>Duration:</strong> ${booking.duration_minutes} minutes</p>
                                        ${safeLink(meetLink) ? `<p><strong>Join:</strong> <a href="${esc(safeLink(meetLink))}">${esc(safeLink(meetLink))}</a></p>` : ''}
                                        <p>Looking forward to speaking with you!</p>
                                    `
                                })
                            });
                        } catch (e) {
                            console.error("Failed to send confirmation email:", e);
                        }
                    }
                    
                    return new Response(JSON.stringify({ success: true, booking }), { 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                } catch (error) {
                    return new Response(JSON.stringify({ error: error.message }), { 
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
            }

            // Default response for undefined routes
            return new Response(JSON.stringify({
                error: "Not found",
                path: url.pathname
            }), { 
                status: 404, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
            
        } catch (error) {
            console.error("Error processing request:", error);
            return new Response(JSON.stringify({ 
                error: "Internal server error",
                message: error.message 
            }), { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
    }
}
