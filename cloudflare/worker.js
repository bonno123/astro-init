export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const corsHeaders = {
            "Access-Control-Allow-Origin": "https://avikbanik.com, https://www.avikbanik.com, https://bonno123.github.io, http://localhost:4321",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };
        
        // Handle CORS preflight requests
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }
        
        // API endpoints
        try {
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
                    // Create new thread
                    const { results } = await db.prepare("INSERT INTO threads (subject) VALUES (?) RETURNING id")
                        .bind(subject || "New Message")
                        .all();
                    actualThreadId = results[0].id;
                }
                
                // 3. Save the message
                await db.prepare("INSERT INTO messages (thread_id, user_id, content) VALUES (?, ?, ?)")
                    .bind(actualThreadId, userId, content)
                    .run();
                
                // 4. Update thread's updated_at timestamp
                await db.prepare("UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    .bind(actualThreadId)
                    .run();
                
                return new Response(JSON.stringify({ 
                    result: "success", 
                    sessionId,
                    threadId: actualThreadId
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
            
            // Get recent messages (public view)
            if (request.method === "GET" && url.pathname === "/api/messages") {
                const limit = parseInt(url.searchParams.get('limit')) || 10;
                const offset = parseInt(url.searchParams.get('offset')) || 0;
                const sort = url.searchParams.get('sort') || 'desc';
                
                // Validate limit (max 50 for performance)
                const maxLimit = Math.min(limit, 50);
                const orderBy = sort === 'desc' ? 'DESC' : 'ASC';

                // Get all threads with their most recent message
                const { results } = await env.DB.prepare(`
                    WITH LatestMessages AS (
                        SELECT 
                            thread_id,
                            MAX(created_at) as latest_created_at
                        FROM messages
                        GROUP BY thread_id
                    )
                    SELECT 
                        m.id, m.content, m.created_at, m.thread_id,
                        u.name, u.email,
                        SUBSTR(u.session_id, -4) as session_id,
                        t.subject
                    FROM messages m
                    JOIN LatestMessages lm ON m.thread_id = lm.thread_id AND m.created_at = lm.latest_created_at
                    JOIN threads t ON m.thread_id = t.id
                    JOIN users u ON m.user_id = u.id
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
            return new Response("Not found", { 
                status: 404, 
                headers: corsHeaders 
            });
            
        } catch (error) {
            console.error("Error processing request:", error);
            return new Response(JSON.stringify({ error: "Internal server error" }), { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
    }
}
