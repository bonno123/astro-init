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
            "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "https://avikb.dev",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };
        
        // Handle CORS preflight requests
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }
        
        // API endpoints
        try {
            // Test endpoint to check API connectivity
            if (url.pathname === "/api/test") {
                return new Response(JSON.stringify({ 
                    success: true, 
                    message: "API is working correctly",
                    timestamp: new Date().toISOString(),
                    origin: origin || "unknown"
                }), { 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
            
            // SSE endpoint for real-time notifications
            if (request.method === "GET" && url.pathname === "/api/stream") {
                const headers = {
                    ...corsHeaders,
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                };

                // Get the last message ID from query params
                const lastSeenId = url.searchParams.get('lastId') || null;
                log(`SSE client connected with lastId: ${lastSeenId}`);

                const stream = new ReadableStream({
                    async start(controller) {
                        let pollInterval = 5000; // Start with 5 seconds
                        let inactiveTime = 0;
                        let lastActivityTime = Date.now();
                        let currentPoll = null;
                        let lastMessageId = lastSeenId || null;
                        let lastMessageTime = null;
                        let isPageVisible = true; // Assume visible initially
                        let noActivityPeriods = 0; // Track consecutive inactive periods

                        // Send keepalive every 60 seconds (increased since we have better activity detection)
                        const keepAlive = setInterval(() => {
                            controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
                        }, 60000);

                        // Log when a client connects
                        console.log("SSE client connected");
                        
                        // Send initial connection confirmation
                        controller.enqueue(
                            new TextEncoder().encode(`data: ${JSON.stringify({type: "connected"})}\n\n`)
                        );

                        // Optimized polling function
                        const doPoll = async () => {
                            try {
                                // Only query for messages newer than last seen
                                let query;
                                let params = [];
                                // Only query for messages newer than last seen (optimize DB query)

                                if (lastMessageId) {
                                    // Client has provided a last seen message ID
                                    query = `SELECT m.id, m.thread_id, m.user_id, 
                                            SUBSTR(m.content, 1, 200) as content, m.is_read,
                                            SUBSTR(u.session_id, -4) as session_id,
                                            datetime(m.created_at) as created_at, u.name, u.username
                                            FROM messages m
                                            JOIN users u ON m.user_id = u.id
                                            WHERE m.id > ?
                                            ORDER BY m.created_at ASC`;
                                    params = [lastMessageId];
                                } else if (lastMessageTime) {
                                    // We're polling after initial connection
                                    query = `SELECT m.id, m.thread_id, m.user_id, 
                                            SUBSTR(m.content, 1, 200) as content, m.is_read,
                                            SUBSTR(u.session_id, -4) as session_id,
                                            datetime(m.created_at) as created_at, u.name, u.username
                                            FROM messages m
                                            JOIN users u ON m.user_id = u.id
                                            WHERE m.created_at > datetime(?, '+0 seconds')
                                            ORDER BY m.created_at ASC`;
                                    params = [lastMessageTime];
                                } else {
                                    // First connection ever, no last ID
                                    query = `SELECT m.id, m.thread_id, m.user_id, 
                                            SUBSTR(m.content, 1, 200) as content, m.is_read,
                                            SUBSTR(u.session_id, -4) as session_id,
                                            datetime(m.created_at) as created_at, u.name, u.username
                                            FROM messages m
                                            JOIN users u ON m.user_id = u.id
                                            ORDER BY m.created_at DESC LIMIT 1`;
                                }

                                const result = await env.DB.prepare(query).bind(...params).all();

                                
                                // const latest = await env.DB.prepare(query)
                                //     .bind(lastMessageTime || '1970-01-01')
                                //     .first();
                                
                                if (result.results && result.results.length > 0) {
                                    // Get newest message for future reference
                                    const newestMessage = lastMessageId ? 
                                        result.results[result.results.length - 1] : 
                                        result.results[0];
                                    
                                    lastMessageId = newestMessage.id;
                                    lastMessageTime = newestMessage.created_at;
                                    lastActivityTime = Date.now();
                                    
                                    // Send all new messages to client
                                    for (const message of result.results) {
                                        console.log("Sending message via SSE:", message.id);
                                        controller.enqueue(
                                            new TextEncoder().encode(`data: ${JSON.stringify(message)}\n\n`)
                                        );
                                    }
                                }
                                } catch (e) {
                                    console.error("Error in SSE polling:", e);
                                }
                            };

                        // Enhanced adaptive polling with page visibility consideration
                        const startPolling = () => {
                            if (currentPoll) clearInterval(currentPoll);
                            
                            currentPoll = setInterval(async () => {
                                await doPoll();
                                
                                // Calculate inactivity time
                                inactiveTime = Date.now() - lastActivityTime;
                                
                                // More aggressive slowdown based on page visibility and inactivity
                                if (!isPageVisible) {
                                    // Page is hidden - use very slow polling
                                    if (pollInterval < 60000) {
                                        pollInterval = 60000; // 1 minute for hidden pages
                                        console.log("Page hidden, switching to very slow polling (1min)");
                                        startPolling();
                                    }
                                } else {
                                    // Page is visible - use activity-based polling
                                    if (inactiveTime > 60000 && pollInterval === 5000) { // 1 minute inactive
                                        pollInterval = 15000; // Switch to 15 seconds
                                        noActivityPeriods++;
                                        console.log("Switching to slow polling (15s) - inactive for 1min");
                                        startPolling();
                                    } else if (inactiveTime > 180000 && pollInterval === 15000) { // 3 minutes inactive
                                        pollInterval = 45000; // Switch to 45 seconds
                                        noActivityPeriods++;
                                        console.log("Switching to very slow polling (45s) - inactive for 3min");
                                        startPolling();
                                    } else if (inactiveTime > 600000 && pollInterval === 45000) { // 10 minutes inactive
                                        pollInterval = 120000; // Switch to 2 minutes (but still visible)
                                        noActivityPeriods++;
                                        console.log("Switching to ultra slow polling (2min) - inactive for 10min");
                                        startPolling();
                                    } else if (inactiveTime < 30000 && pollInterval > 5000) { // Activity detected
                                        pollInterval = 5000; // Back to fast polling
                                        noActivityPeriods = 0; // Reset counter
                                        console.log("Activity detected, switching to fast polling (5s)");
                                        startPolling();
                                    }
                                }
                            }, pollInterval);
                        };

                        // Start initial polling
                        startPolling();

                        // Global activity tracker for this connection
                        globalThis.updateActivity = (action, pageVisible) => {
                            console.log(`Activity update received: ${action}, visible: ${pageVisible}`);
                            lastActivityTime = Date.now();
                            isPageVisible = pageVisible !== false;
                            
                            // Send activity confirmation to client
                            controller.enqueue(
                                new TextEncoder().encode(`data: ${JSON.stringify({
                                    type: "activity_ack", 
                                    action: action, 
                                    pageVisible: isPageVisible,
                                    currentInterval: pollInterval
                                })}\n\n`)
                            );
                        };

                        request.signal?.addEventListener('abort', () => {
                            console.log("SSE client disconnected");
                            clearInterval(keepAlive);
                            if (currentPoll) clearInterval(currentPoll);
                            controller.close();
                        });
                    }
                });

                return new Response(stream, { headers });
            }

            // Handle sending a new message
            if (request.method === "POST" && url.pathname === "/api/message") {
                const data = await request.json();
                const { content, name, email, subject, threadId } = data;
                
                // Input validation
                if (!content) {
                    return new Response(JSON.stringify({ error: "Message content is required" }), { 
                        status: 400, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                // Transaction to create message and related records
                const db = env.DB;
                
                // 1. Create or get user
                let userId;
                // Generate session ID for anonymous users if not provided
                const sessionId = data.sessionId || crypto.randomUUID();
                
                // Check if user exists by session ID
                const existingUser = await db.prepare("SELECT id FROM users WHERE session_id = ?").bind(sessionId).first();
                
                if (existingUser) {
                    userId = existingUser.id;
                    // Update user info if provided
                    if (name || email) {
                        await db.prepare("UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email) WHERE id = ?")
                            .bind(name, email, userId)
                            .run();
                    }
                } else {
                    // Create new user
                    const { results } = await db.prepare("INSERT INTO users (name, email, session_id) VALUES (?, ?, ?) RETURNING id")
                        .bind(name || null, email || null, sessionId)
                        .all();
                    userId = results[0].id;
                }
                
                // 2. Create or get thread
                let actualThreadId = threadId;
                if (!actualThreadId) {
                    // Default to "Troll Section" thread (ID = 1) for public messages
                    actualThreadId = 1;
                }
                
                // 3. Save the message
                const messageResult = await db.prepare("INSERT INTO messages (thread_id, user_id, content) VALUES (?, ?, ?) RETURNING id")
                    .bind(actualThreadId, userId, content)
                    .run();
                
                // 4. Update thread's updated_at timestamp
                await db.prepare("UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    .bind(actualThreadId)
                    .run();

                console.log("New message created:", messageResult.results[0].id);
                
                return new Response(JSON.stringify({ 
                    result: "success", 
                    sessionId,
                    threadId: actualThreadId,
                    messageId: messageResult.results[0].id
                }), { 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
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
                                        <p><strong>From:</strong> ${name}</p>
                                        <p><strong>Email:</strong> ${email}</p>
                                        <p><strong>Subject:</strong> ${subject}</p>
                                        <hr>
                                        <h3>Message:</h3>
                                        <p>${message.replace(/\n/g, '<br>')}</p>
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
                                        <p>Hi ${name},</p>
                                        <p>Thank you for reaching out! We've received your message and will get back to you as soon as possible.</p>
                                        <p><strong>Your message subject:</strong> ${subject}</p>
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
            
            // Book a call endpoint
            if (request.method === "POST" && url.pathname === "/api/book") {
                const data = await request.json();
                const { name, email, topic, details, start_at, duration_minutes = 30, timezone } = data;
                const userTimeZone = timezone || env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
                
                // Input validation
                if (!name || !email || !topic || !start_at) {
                    return new Response(JSON.stringify({ 
                        error: "name, email, topic, and start_at are required" 
                    }), { 
                        status: 400, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                try {
                    const db = env.DB;
                    const bookingId = crypto.randomUUID();
                    
                    // Check for overlapping bookings (pending or approved)
                    const startDate = new Date(start_at);
                    const endDate = new Date(startDate.getTime() + duration_minutes * 60000);
                    
                    const conflicts = await db.prepare(`
                        SELECT id FROM bookings 
                        WHERE status IN ('pending', 'approved')
                        AND (
                            (start_at < ? AND datetime(start_at, '+' || duration_minutes || ' minutes') > ?)
                            OR (start_at >= ? AND start_at < ?)
                        )
                    `).bind(endDate.toISOString(), start_at, start_at, endDate.toISOString()).all();
                    
                    if (conflicts.results && conflicts.results.length > 0) {
                        return new Response(JSON.stringify({ 
                            error: "This time slot is already booked. Please select another time." 
                        }), { 
                            status: 409, 
                            headers: { ...corsHeaders, "Content-Type": "application/json" } 
                        });
                    }
                    
                    // Insert booking
                    await db.prepare(`
                        INSERT INTO bookings (id, name, email, topic, details, start_at, duration_minutes, status, timezone)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                    `).bind(bookingId, name, email, topic, details || null, start_at, duration_minutes, userTimeZone).run();
                    
                    // Send email notification to admin
                    if (env.MAIL_API_URL && env.MAIL_API_KEY) {
                        try {
                            const startDate = new Date(start_at);
                            const startDateLocal = formatInTimeZone(startDate, userTimeZone);
                            const startDateIST = formatInTimeZone(startDate, 'Asia/Kolkata');
                            const startDateUTC = formatInTimeZone(startDate, 'UTC');
                            const adminEmail = env.ADMIN_EMAIL || 'avik@avikb.dev';
                            
                            await fetch(env.MAIL_API_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${env.MAIL_API_KEY}`
                                },
                                body: JSON.stringify({
                                    from: env.ADMIN_EMAIL ? `Booking <${env.ADMIN_EMAIL}>` : 'Booking <booking@avikb.dev>',
                                    to: adminEmail,
                                    subject: `New call booking request from ${name}`,
                                    html: `
                                        <h2>New Call Booking Request</h2>
                                        <p><strong>Name:</strong> ${name}</p>
                                        <p><strong>Email:</strong> ${email}</p>
                                        <p><strong>Topic:</strong> ${topic}</p>
                                        <p><strong>Requested Time:</strong> ${startDateLocal} (${userTimeZone})</p>
                                        <p><strong>In IST:</strong> ${startDateIST}</p>
                                        <p><strong>In UTC:</strong> ${startDateUTC}</p>
                                        <p><strong>Duration:</strong> ${duration_minutes} minutes</p>
                                        <p><strong>Details:</strong> ${details || 'None'}</p>
                                        <p><strong>Requester Timezone:</strong> ${userTimeZone}</p>
                                        <p><a href="https://avikb.dev/admin/bookings">View in Admin Dashboard</a></p>
                                    `
                                })
                            });
                        } catch (e) {
                            console.error("Failed to send notification email:", e);
                        }
                    }
                    
                    // Generate ICS calendar invite
                    const icsContent = generateICS({
                        uid: bookingId,
                        summary: `Call with ${name} - ${topic}`,
                        description: `${details || ''}\nTime zone: ${userTimeZone}`,
                        startDate: new Date(start_at),
                        duration: duration_minutes,
                        attendeeEmail: email,
                        organizerEmail: env.ADMIN_EMAIL || 'avik@avikb.dev'
                    });
                    
                    return new Response(JSON.stringify({ 
                        success: true,
                        bookingId,
                        message: "Booking request submitted. You'll receive a confirmation email shortly.",
                        ics: icsContent
                    }), { 
                        status: 201,
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                    
                } catch (error) {
                    console.error("Booking error:", error);
                    return new Response(JSON.stringify({ 
                        error: "Failed to process booking: " + error.message 
                    }), { 
                        status: 500, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
            }
            
            // Get available booking slots
            if (request.method === "GET" && url.pathname === "/api/booking-slots") {
                try {
                    const db = env.DB;
                    const days = parseInt(url.searchParams.get('days')) || 7;
                    const durationMins = parseInt(url.searchParams.get('duration')) || 30;
                    
                    // Generate available slots for next N days (9 AM - 5 PM, 30 min slots)
                    const slots = [];
                    const now = new Date();
                    
                    for (let d = 1; d <= days; d++) {
                        const date = new Date(now);
                        date.setDate(date.getDate() + d);
                        
                        // Skip weekends
                        if (date.getDay() === 0 || date.getDay() === 6) continue;
                        
                        for (let hour = 9; hour < 17; hour++) {
                            for (let min = 0; min < 60; min += durationMins) {
                                const slotStart = new Date(date);
                                slotStart.setHours(hour, min, 0, 0);
                                const slotEnd = new Date(slotStart.getTime() + durationMins * 60000);
                                
                                // Check if booked
                                const conflict = await db.prepare(`
                                    SELECT id FROM bookings 
                                    WHERE status IN ('pending', 'approved')
                                    AND (
                                        (start_at < ? AND datetime(start_at, '+' || duration_minutes || ' minutes') > ?)
                                    )
                                `).bind(slotEnd.toISOString(), slotStart.toISOString()).first();
                                
                                if (!conflict) {
                                    slots.push({
                                        start: slotStart.toISOString(),
                                        end: slotEnd.toISOString(),
                                        label: slotStart.toLocaleString()
                                    });
                                }
                            }
                        }
                    }
                    
                    return new Response(JSON.stringify(slots), { 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                } catch (error) {
                    console.error("Slots error:", error);
                    return new Response(JSON.stringify({ error: "Failed to fetch slots" }), { 
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
            }
            
            // Get bookings for admin (protected)
            if (request.method === "GET" && url.pathname === "/api/admin/bookings") {
                const authHeader = request.headers.get('Authorization');
                const token = authHeader?.replace('Bearer ', '');
                
                if (token !== env.ADMIN_API_TOKEN) {
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
                
                if (token !== env.ADMIN_API_TOKEN) {
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
                                        <p>Hi ${booking.name},</p>
                                        <p>Your call request for <strong>${booking.topic}</strong> has been approved.</p>
                                        <p><strong>When:</strong> ${startDateLocal} (${bookingTz})</p>
                                        <p><strong>In IST:</strong> ${startDateIST}</p>
                                        <p><strong>In UTC:</strong> ${startDateUTC}</p>
                                        <p><strong>Duration:</strong> ${booking.duration_minutes} minutes</p>
                                        ${meetLink ? `<p><strong>Join:</strong> <a href="${meetLink}">${meetLink}</a></p>` : ''}
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

            // Helper function to generate ICS calendar file
            function generateICS(opts) {
                const { uid, summary, description, startDate, duration, attendeeEmail, organizerEmail } = opts;
                const endDate = new Date(startDate.getTime() + duration * 60000);
                
                const formatDate = (date) => {
                    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };
                
                return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Avik Banik//Call Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${summary}
DESCRIPTION:${description}
ORGANIZER;CN=Avik Banik:mailto:${organizerEmail}
ATTENDEE;CN=${attendeeEmail}:mailto:${attendeeEmail}
STATUS:TENTATIVE
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
            }
            
            // Lightweight activity ping endpoint (to reset inactivity timers)
            if (request.method === "POST" && url.pathname === "/api/activity") {
                const data = await request.json().catch(() => ({}));
                const { action = 'unknown', pageVisible = true } = data;
                
                console.log(`Activity ping received - Action: ${action}, Page Visible: ${pageVisible}`);
                
                // Try to update activity for all active SSE connections
                try {
                    if (globalThis.updateActivity) {
                        globalThis.updateActivity(action, pageVisible);
                    }
                } catch (e) {
                    console.log("Could not update activity for SSE connections:", e);
                }
                
                return new Response(JSON.stringify({ 
                    result: "activity_recorded",
                    action: action,
                    pageVisible: pageVisible,
                    timestamp: new Date().toISOString()
                }), { 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }

            // Get all threads (for admin view)
            if (request.method === "GET" && url.pathname === "/api/threads") {
                const { results } = await env.DB.prepare(`
                    SELECT t.*, 
                           COUNT(m.id) as message_count, 
                           MAX(m.created_at) as last_message_at,
                           u.name as last_sender_name
                    FROM threads t
                    LEFT JOIN messages m ON t.id = m.thread_id
                    LEFT JOIN users u ON m.user_id = u.id
                    GROUP BY t.id
                    ORDER BY t.updated_at DESC
                `).all();
                
                return new Response(JSON.stringify(results), { 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
            
            // Get messages from a specific thread
            if (request.method === "GET" && url.pathname.startsWith("/api/thread/")) {
                const threadId = url.pathname.split("/").pop();
                
                if (!threadId) {
                    return new Response(JSON.stringify({ error: "Thread ID is required" }), { 
                        status: 400, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                const { results: messages } = await env.DB.prepare(`
                    SELECT m.*, u.name, u.email
                    FROM messages m
                    JOIN users u ON m.user_id = u.id
                    WHERE m.thread_id = ?
                    ORDER BY m.created_at ASC
                `).bind(threadId).all();
                
                // Get thread details
                const thread = await env.DB.prepare("SELECT * FROM threads WHERE id = ?").bind(threadId).first();
                
                if (!thread) {
                    return new Response(JSON.stringify({ error: "Thread not found" }), { 
                        status: 404, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                return new Response(JSON.stringify({ 
                    thread,
                    messages
                }), { 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
            
            // Get recent messages (public view) - Optimized
            if (request.method === "GET" && url.pathname === "/api/messages") {
                const limit = parseInt(url.searchParams.get('limit')) || 10;
                const offset = parseInt(url.searchParams.get('offset')) || 0;
                const sort = url.searchParams.get('sort') || 'desc';
                
                // Validate limit (max 20 for performance and cost optimization)
                const maxLimit = Math.min(limit, 20);
                const orderBy = sort === 'desc' ? 'DESC' : 'ASC';

                // Optimized query - only select needed fields and truncate content
                const { results } = await env.DB.prepare(`
                    SELECT 
                        m.id, 
                        m.thread_id, 
                        m.user_id,
                        SUBSTR(m.content, 1, 500) as content,
                        m.is_read,
                        datetime(m.created_at) as created_at,
                        u.name,
                        u.username,
                        SUBSTR(u.session_id, -4) as session_id
                    FROM messages m
                    JOIN users u ON m.user_id = u.id
                    JOIN threads t ON m.thread_id = t.id
                    WHERE t.status = 'open'
                    ORDER BY m.created_at ${orderBy}
                    LIMIT ? OFFSET ?
                `).bind(maxLimit, offset).all();

                return new Response(JSON.stringify(results), { 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
            
            // Get user's threads by session ID
            if (request.method === "GET" && url.pathname === "/api/user/threads") {
                const sessionId = url.searchParams.get("sessionId");
                
                if (!sessionId) {
                    return new Response(JSON.stringify({ error: "Session ID is required" }), { 
                        status: 400, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                // Get user ID from session ID
                const user = await env.DB.prepare("SELECT id FROM users WHERE session_id = ?").bind(sessionId).first();
                
                if (!user) {
                    return new Response(JSON.stringify({ error: "User not found" }), { 
                        status: 404, 
                        headers: { ...corsHeaders, "Content-Type": "application/json" } 
                    });
                }
                
                // Get all threads where the user has participated
                const { results } = await env.DB.prepare(`
                    SELECT DISTINCT t.*
                    FROM threads t
                    JOIN messages m ON t.id = m.thread_id
                    WHERE m.user_id = ?
                    ORDER BY t.updated_at DESC
                `).bind(user.id).all();
                
                return new Response(JSON.stringify(results), { 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
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
