const SESSION_KEY = 'chat_session';

/**
 * Send a message to the backend API
 * @param {string} content - Message content (required)
 * @param {Object} options - Additional options
 * @param {string | null} options.name - User name (optional)
 * @param {string | null} options.email - User email (optional)
 * @param {string | null} options.subject - Message subject (optional)
 * @param {string | null} options.threadId - Thread ID for existing conversation (optional)
 * @param {string | null} options.sessionId - Session ID for user identification (optional)
 * @returns {Promise<Response>} - API response
 */
export async function sendMessage(content, options = {}) {
    const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;
    // console.log('Sending message to API:', API_BASE);
    
    if (!API_BASE) {
        console.error('API_BASE is undefined. Check your environment variables.');
        throw new Error('API endpoint not configured');
    }

    if (!content || typeof content !== 'string') {
        throw new Error('Message content is required and must be a string');
    }

    // Get session ID from localStorage if not provided
    const sessionId = options.sessionId || localStorage.getItem(SESSION_KEY);

    const messageData = {
        content,
        name: options.name,
        email: options.email,
        subject: options.subject,
        // threadId: options.threadId,
        sessionId
    };

    try {
        const response = await fetch(`${API_BASE}/api/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        
        // Store session ID if returned from server
        if (result.sessionId && !localStorage.getItem(SESSION_KEY)) {
            localStorage.setItem(SESSION_KEY, result.sessionId);
        }

        return result;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}


/**
 * Start Server-Sent Events (SSE) for real-time notifications with robust fallback
 * @param {string} apiBase - The API base URL
 * @param {function} onMessage - Callback for new messages
 */
export function startSSE(apiBase, onMessage) {
    if (!apiBase) {
        console.warn('API base URL is required for SSE');
        return null;
    }    

    let lastProcessedMessageTime = 0;

    // Get the last message ID from local storage
    let lastMessageId = localStorage.getItem('last_message_id') || '';

    // console.log("Starting SSE with URL:", `${apiBase}/api/stream?lastId=${lastMessageId}`);

    let es = new EventSource(`${apiBase}/api/stream?lastId=${lastMessageId}`);
    let activityTimer = null;
    let fallbackTimer = null;
    let isPageVisible = !document.hidden;
    let lastActivityTime = Date.now();
    let reconnectAttempts = 0;
    let usingFallback = false;

    // Enhanced activity ping with page visibility detection
    const sendActivityPing = (action = 'periodic') => {
        fetch(`${apiBase}/api/activity`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: action,
                pageVisible: isPageVisible,
                timestamp: Date.now()
            })
        }).catch(e => console.info('Activity ping failed:', e));
    };

    // Fallback polling mechanism when SSE fails
    const startFallbackPolling = () => {
        if (fallbackTimer) clearInterval(fallbackTimer);
        console.info("Starting fallback polling");
        usingFallback = true;
        fallbackTimer = setInterval(async () => {
            try {
                // Skip polling if Just reconnected via SSE
                if(Date.now() - lastProcessedMessageTime < 5000) {
                    console.info("Skipping fallback polling due to recent SSE activity");
                    return;
                }

                // Poll for new messages

                const messages = await getRecentMessages(5, 0, true);
                if (messages && messages.length > 0) {
                    const latestMessage = messages[0];
                    if (lastMessageId !== latestMessage.id) {
                        lastMessageId = latestMessage.id;
                        // console.log("Fallback polling found new message:", latestMessage);
                        if (typeof onMessage === 'function') {
                            onMessage(latestMessage);
                        }
                        // Show browser notification if permission granted
                        if (window.Notification && Notification.permission === 'granted') {
                            new Notification('New Message', {
                                body: latestMessage.message || 'You have a new message',
                                icon: '/favicon.svg'
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Fallback polling error:", error);
            }
        }, 10000); // Poll every 10 seconds when SSE fails
    };

    // Try to reconnect SSE with exponential backoff
    const reconnectSSE = () => {
        const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
        reconnectAttempts++;
        console.info(`Attempting to reconnect SSE in ${delay/1000} seconds (attempt ${reconnectAttempts})...`);

        setTimeout(() => {
            try {
                if (es) {
                    es.close();
                }
                es = new EventSource(`${apiBase}/api/stream`);
                setupEventHandlers();
            } catch (error) {
                console.error("Error during SSE reconnection:", error);
                if (reconnectAttempts >= 5 && !usingFallback) {
                    startFallbackPolling();
                } else {
                    reconnectSSE();
                }
            }
        }, delay);
    };

    // Track page visibility changes
    const handleVisibilityChange = () => {
        const wasVisible = isPageVisible;
        isPageVisible = !document.hidden;
        
        if (isPageVisible && !wasVisible) {
            // console.log("Page became visible - sending activity ping");
            sendActivityPing('page_visible');
            lastActivityTime = Date.now();
            
            // Refresh messages when page becomes visible
            getRecentMessages(5, 0, true)
                .then(messages => {
                    if (messages && messages.length > 0) {
                        messages.forEach(msg => {
                            if (typeof onMessage === 'function' && msg.id !== lastMessageId) {
                                onMessage(msg);
                                lastMessageId = msg.id;
                            }
                        });
                    }
                })
                .catch(err => console.error("Error refreshing messages:", err));
            
            // Try to restart SSE if using fallback
            if (usingFallback) {
                usingFallback = false;
                reconnectAttempts = 0;
                if (fallbackTimer) {
                    clearInterval(fallbackTimer);
                    fallbackTimer = null;
                }
                reconnectSSE();
            }
        } else if (!isPageVisible && wasVisible) {
            // console.log("Page became hidden - server will slow down polling");
            sendActivityPing('page_hidden');
        }
    };

    // Track user interactions to detect activity
    const handleUserActivity = () => {
        const now = Date.now();
        // Throttle activity pings to every 30 seconds max
        if (now - lastActivityTime > 30000) {
            lastActivityTime = now;
            if (isPageVisible) {
                sendActivityPing('user_activity');
            }
        }
    };

    // Setup event handlers for the EventSource
    const setupEventHandlers = () => {
        es.onopen = () => {
            // console.log("SSE connection opened successfully");
            reconnectAttempts = 0;
            usingFallback = false;
            if (fallbackTimer) {
                clearInterval(fallbackTimer);
                fallbackTimer = null;
            }
            startActivityPing();
        };

        es.onmessage = (event) => {
            // console.log("SSE message received:", event.data);
            try {
                const data = JSON.parse(event.data);
                // console.log("Parsed SSE data:", data);

                if (data.id) {
                    // Store last message ID
                    localStorage.setItem('last_message_id', data.id);
                    lastProcessedMessageTime = Date.now();

                    if (typeof onMessage === 'function') {
                        onMessage(data);
                    }
                }
            } catch (e) {
                console.error("Error parsing SSE data:", e);
            }
        };

        es.onerror = (error) => {
            console.error("SSE connection error:", error);
            if (activityTimer) {
                clearInterval(activityTimer);
                activityTimer = null;
            }
            
            // Start fallback if too many reconnect attempts
            if (reconnectAttempts >= 5 && !usingFallback) {
                startFallbackPolling();
            } else {
                reconnectSSE();
            }
        };
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for user activity (throttled)
    ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Periodic activity ping (3 minutes)
    const startActivityPing = () => {
        if (activityTimer) clearInterval(activityTimer);
        activityTimer = setInterval(() => {
            sendActivityPing('periodic');
        }, 180000);
    };

    // Initialize event handlers
    setupEventHandlers();

    // Return cleanup function and event source
    return {
        eventSource: es,
        cleanup: () => {
            if (activityTimer) clearInterval(activityTimer);
            if (fallbackTimer) clearInterval(fallbackTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
                document.removeEventListener(event, handleUserActivity);
            });
            if (es) es.close();
            console.info("SSE connection and listeners cleaned up");
        }
    };
}


/**
 * Get recent messages for public display
 * @returns {Promise<Array>} - Array of messages
 */
export async function getMessages() {
    const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;    

    try {
        const response = await fetch(`${API_BASE}/api/messages`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting messages:", error);
        throw error;
    }
}

/**
 * Get recent messages for public display (last 10 in reverse order)
 * @returns {Promise<Array>} - Array of messages
 */
export async function getRecentMessages(limit = 10, offset = 0, reverse = true) {
    const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT || 'https://d1-connect.bonno123.workers.dev';
    // console.log("Getting messages from API:", API_BASE);

    try {
        const response = await fetch(`${API_BASE}/api/messages?limit=${limit}&offset=${offset}&sort=${reverse ? 'desc' : 'asc'}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // console.log("Received messages from API:", data);
        return data;
    } catch (error) {
        console.error("Error getting messages:", error);
        throw error;
    }
}

/**
 * Get all threads for a user based on their session ID
 * @returns {Promise<Array>} - Array of threads
 */
export async function getUserThreads() {
    const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;
    try {
        const sessionId = localStorage.getItem(SESSION_KEY);
        
        if (!sessionId) {
            return [];
        }

        const response = await fetch(`${API_BASE}/api/user/threads?sessionId=${sessionId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting user threads:", error);
        throw error;
    }
}

/**
 * Get messages from a specific thread
 * @param {string} threadId - The thread ID
 * @returns {Promise<{thread: object, messages: Array}>} - Thread and messages
 */
export async function getThreadMessages(threadId) {
    const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;
    try {
        const response = await fetch(`${API_BASE}/api/thread/${threadId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error getting thread messages:", error);
        throw error;
    }
}

/**
 * Check if the user has an active session
 * @returns {boolean} - True if the user has a session
 */
export function hasSession() {
    return !!localStorage.getItem(SESSION_KEY);
}