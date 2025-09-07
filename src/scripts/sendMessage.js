// Store the session ID in localStorage for returning visitors
const SESSION_KEY = 'portfolio_message_session';
const API_BASE = import.meta.env.PUBLIC_API_ENDPOINT;

/**
 * Send a message to the server
 * @param {string} content - The message content
 * @param {object} options - Additional options
 * @param {string} [options.name] - User name (optional)
 * @param {string} [options.email] - User email (optional)
 * @param {string} [options.subject] - Message subject (optional)
 * @param {string} [options.threadId] - Thread ID for replies (optional)
 * @returns {Promise<object>} - Response with session ID and thread ID
 */
export async function sendMessage(content, options = {}) {
    try {
        const { name, email, subject, threadId } = options;

        console.log("Sending message:", { content, name, email, subject, threadId });
        
        
        // Get session ID from localStorage or generate new one
        const sessionId = localStorage.getItem(SESSION_KEY) || null;

        const response = await fetch(`${API_BASE}/api/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                content,
                name, 
                email,
                subject,
                threadId,
                sessionId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Store session ID for returning visitors
        if (result.sessionId) {
            localStorage.setItem(SESSION_KEY, result.sessionId);
        }
        
        return result;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

/**
 * Get recent messages for public display
 * @returns {Promise<Array>} - Array of messages
 */
export async function getMessages() {
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
    try {
        const response = await fetch(`${API_BASE}/api/messages?limit=${limit}&offset=${offset}&sort=${reverse ? 'desc' : 'asc'}`);
        
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
 * Get all threads for a user based on their session ID
 * @returns {Promise<Array>} - Array of threads
 */
export async function getUserThreads() {
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