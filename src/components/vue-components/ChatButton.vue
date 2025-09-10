<template>
    <div class="floating-chat" :class="{ enter: true, expand: isChatOpen }">
        <button 
            v-if="!isChatOpen" 
            @click="isChatOpen = true" 
            class="open-chat-button" 
            :class="{ 'unread-badge': unReadMessageCount > 0 }"
            :style="{ '--unread-count': unreadCountDisplay }"
            aria-label="Open chat"
        >
            <svg viewBox="0 0 24 24" 
            height="24" width="24"
            fill="none" xmlns="http://www.w3.org/2000/svg"
            ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
                <path
                d="M13.0867 21.3877L13.7321 21.7697L13.0867 21.3877ZM13.6288 20.4718L12.9833 20.0898L13.6288 20.4718ZM10.3712 20.4718L9.72579 20.8539H9.72579L10.3712 20.4718ZM10.9133 21.3877L11.5587 21.0057L10.9133 21.3877ZM2.3806 15.9134L3.07351 15.6264V15.6264L2.3806 15.9134ZM7.78958 18.9915L7.77666 19.7413L7.78958 18.9915ZM5.08658 18.6194L4.79957 19.3123H4.79957L5.08658 18.6194ZM21.6194 15.9134L22.3123 16.2004V16.2004L21.6194 15.9134ZM16.2104 18.9915L16.1975 18.2416L16.2104 18.9915ZM18.9134 18.6194L19.2004 19.3123H19.2004L18.9134 18.6194ZM19.6125 2.7368L19.2206 3.37628L19.6125 2.7368ZM21.2632 4.38751L21.9027 3.99563V3.99563L21.2632 4.38751ZM4.38751 2.7368L3.99563 2.09732V2.09732L4.38751 2.7368ZM2.7368 4.38751L2.09732 3.99563H2.09732L2.7368 4.38751ZM9.40279 19.2098L9.77986 18.5615L9.77986 18.5615L9.40279 19.2098ZM13.7321 21.7697L14.2742 20.8539L12.9833 20.0898L12.4412 21.0057L13.7321 21.7697ZM9.72579 20.8539L10.2679 21.7697L11.5587 21.0057L11.0166 20.0898L9.72579 20.8539ZM12.4412 21.0057C12.2485 21.3313 11.7515 21.3313 11.5587 21.0057L10.2679 21.7697C11.0415 23.0767 12.9585 23.0767 13.7321 21.7697L12.4412 21.0057ZM10.5 2.75H13.5V1.25H10.5V2.75ZM21.25 10.5V11.5H22.75V10.5H21.25ZM2.75 11.5V10.5H1.25V11.5H2.75ZM1.25 11.5C1.25 12.6546 1.24959 13.5581 1.29931 14.2868C1.3495 15.0223 1.45323 15.6344 1.68769 16.2004L3.07351 15.6264C2.92737 15.2736 2.84081 14.8438 2.79584 14.1847C2.75041 13.5189 2.75 12.6751 2.75 11.5H1.25ZM7.8025 18.2416C6.54706 18.2199 5.88923 18.1401 5.37359 17.9265L4.79957 19.3123C5.60454 19.6457 6.52138 19.7197 7.77666 19.7413L7.8025 18.2416ZM1.68769 16.2004C2.27128 17.6093 3.39066 18.7287 4.79957 19.3123L5.3736 17.9265C4.33223 17.4951 3.50486 16.6678 3.07351 15.6264L1.68769 16.2004ZM21.25 11.5C21.25 12.6751 21.2496 13.5189 21.2042 14.1847C21.1592 14.8438 21.0726 15.2736 20.9265 15.6264L22.3123 16.2004C22.5468 15.6344 22.6505 15.0223 22.7007 14.2868C22.7504 13.5581 22.75 12.6546 22.75 11.5H21.25ZM16.2233 19.7413C17.4786 19.7197 18.3955 19.6457 19.2004 19.3123L18.6264 17.9265C18.1108 18.1401 17.4529 18.2199 16.1975 18.2416L16.2233 19.7413ZM20.9265 15.6264C20.4951 16.6678 19.6678 17.4951 18.6264 17.9265L19.2004 19.3123C20.6093 18.7287 21.7287 17.6093 22.3123 16.2004L20.9265 15.6264ZM13.5 2.75C15.1512 2.75 16.337 2.75079 17.2619 2.83873C18.1757 2.92561 18.7571 3.09223 19.2206 3.37628L20.0044 2.09732C19.2655 1.64457 18.4274 1.44279 17.4039 1.34547C16.3915 1.24921 15.1222 1.25 13.5 1.25V2.75ZM22.75 10.5C22.75 8.87781 22.7508 7.6085 22.6545 6.59611C22.5572 5.57256 22.3554 4.73445 21.9027 3.99563L20.6237 4.77938C20.9078 5.24291 21.0744 5.82434 21.1613 6.73809C21.2492 7.663 21.25 8.84876 21.25 10.5H22.75ZM19.2206 3.37628C19.7925 3.72672 20.2733 4.20752 20.6237 4.77938L21.9027 3.99563C21.4286 3.22194 20.7781 2.57144 20.0044 2.09732L19.2206 3.37628ZM10.5 1.25C8.87781 1.25 7.6085 1.24921 6.59611 1.34547C5.57256 1.44279 4.73445 1.64457 3.99563 2.09732L4.77938 3.37628C5.24291 3.09223 5.82434 2.92561 6.73809 2.83873C7.663 2.75079 8.84876 2.75 10.5 2.75V1.25ZM2.75 10.5C2.75 8.84876 2.75079 7.663 2.83873 6.73809C2.92561 5.82434 3.09223 5.24291 3.37628 4.77938L2.09732 3.99563C1.64457 4.73445 1.44279 5.57256 1.34547 6.59611C1.24921 7.6085 1.25 8.87781 1.25 10.5H2.75ZM3.99563 2.09732C3.22194 2.57144 2.57144 3.22194 2.09732 3.99563L3.37628 4.77938C3.72672 4.20752 4.20752 3.72672 4.77938 3.37628L3.99563 2.09732ZM11.0166 20.0898C10.8136 19.7468 10.6354 19.4441 10.4621 19.2063C10.2795 18.9559 10.0702 18.7304 9.77986 18.5615L9.02572 19.8582C9.07313 19.8857 9.13772 19.936 9.24985 20.0898C9.37122 20.2564 9.50835 20.4865 9.72579 20.8539L11.0166 20.0898ZM7.77666 19.7413C8.21575 19.7489 8.49387 19.7545 8.70588 19.7779C8.90399 19.7999 8.98078 19.832 9.02572 19.8582L9.77986 18.5615C9.4871 18.3912 9.18246 18.3215 8.87097 18.287C8.57339 18.2541 8.21375 18.2487 7.8025 18.2416L7.77666 19.7413ZM14.2742 20.8539C14.4916 20.4865 14.6287 20.2564 14.7501 20.0898C14.8622 19.936 14.9268 19.8857 14.9742 19.8582L14.2201 18.5615C13.9298 18.7304 13.7204 18.9559 13.5379 19.2063C13.3646 19.4441 13.1864 19.7468 12.9833 20.0898L14.2742 20.8539ZM16.1975 18.2416C15.7862 18.2487 15.4266 18.2541 15.129 18.287C14.8175 18.3215 14.5129 18.3912 14.2201 18.5615L14.9742 19.8582C15.0192 19.832 15.096 19.7999 15.2941 19.7779C15.5061 19.7545 15.7842 19.7489 16.2233 19.7413L16.1975 18.2416Z"
                fill="#FFF"></path>
            </g></svg>
        </button>

        <div class="chat" v-if="isChatOpen" :class="{ enter: isChatOpen }">
            <div class="header">
                <span class="title">
                    Troll section
                </span>

                <button @click="isChatOpen = false">
                    <svg
                        height="18"
                        width="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        stroke="#ffffff"
                    ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                            id="SVGRepo_tracerCarrier"
                            stroke-linecap="round"
                            stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier">
                            <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M10.9393 12L6.9696 15.9697L8.03026 17.0304L12 13.0607L15.9697 17.0304L17.0304 15.9697L13.0607 12L17.0303 8.03039L15.9696 6.96973L12 10.9393L8.03038 6.96973L6.96972 8.03039L10.9393 12Z"
                            fill="#ffffff"></path>
                        </g>
                    </svg>
                </button>
            </div>

            <ul 
                v-if="messages" 
                class="messages" 
                ref="messagesContainer"
            >
                <li 
                    v-for="(message, index) in messages" 
                    :class="getChatMessageClass(message)"
                    :style="{ color: getMessageColor(message.session_id) }"
                    :key="index + (message.session_id ?? '')"
                > 
                    <span class="username">{{ message.username ? message.username : `Guest_${message.session_id ? message.session_id : 'unknown'}` }}:</span>
                    <span class="wrap">{{ message.content }}</span>
                </li>
            </ul>

            <div class="footer">
                <input class="text-box" type="text" v-model="userMessage" placeholder="your message...">
                <button id="sendMessage" @click="prepareSubmit">send</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import {
    sendMessage,
    getMessages,
    getUserThreads,
    getThreadMessages,
    hasSession,
    getRecentMessages,
    startSSE
} from "~/scripts/sendMessage";
import useNotification from '~/utils/useNotification';

  interface Message {
    id: number;
    thread_id: number;
    user_id: number;
    content: string;
    is_read: boolean;
    created_at: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    session_id?: string | null;
  }
  
const messagesContainer = ref<HTMLElement | null>(null);
// Add a ref to track the last seen message when chat was open
const lastSeenMessageId = ref<number>(0);

// Add audio context and sound function
const audioContext = ref<AudioContext | null>(null);
const soundEnabled = ref(true); // Allow users to toggle sound

// Unread message count
const unReadMessageCount = ref(0);
// Function to mark messages as read when chat opens
const markMessagesAsRead = () => {
  if (messages.value.length > 0) {
    const latestMessageId = messages.value[messages.value.length - 1].id;
    lastSeenMessageId.value = latestMessageId;
    localStorage.setItem('last_seen_message_id', latestMessageId.toString());
  }
  unReadMessageCount.value = 0;
};

// Create a subtle notification sound using Web Audio API
const playNotificationSound = () => {
  if (!soundEnabled.value) return;
  
  try {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContext.value;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Create a gentle notification sound
    oscillator.frequency.setValueAtTime(800, ctx.currentTime); // Higher pitch
    oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1); // Lower pitch
    
    // Gentle volume curve
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

    oscillator.type = 'sine'; // Gentle sine wave
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
};

// Function to increment unread count
const incrementUnreadCount = () => {
  unReadMessageCount.value++;
};

const unreadCountDisplay = computed(() => {
    if (unReadMessageCount.value === 0) return '""';
    const count = unReadMessageCount.value > 99 
        ? '99+' 
        : unReadMessageCount.value.toString();
    return `"${count}"`;
});

const { notify } = useNotification();

const isChatOpen = ref(false);

const sseConnection = ref<ReturnType<typeof startSSE> | null>(null);


const messages = ref<Message[]>([]);

const userMessage = ref<string>('');

function getChatMessageClass(message: Message) {
    if (!(message.name)) {
        return 'anonymous';
    }

    return 'other';
}

function getMessageColor(session_id: string | null | undefined) {
    if (!session_id) return '#FFFFFF'; // Default color for anonymous users

    // Simple hash function to generate a color based on session_id
    let hash = 0;
    for (let i = 0; i < session_id.length; i++) {
        hash = session_id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Ensure good contrast on dark background
    // Use higher lightness (70-85%) for better readability
    const hue = hash % 360;
    const saturation = 60 + (hash % 30); // 60-90% saturation for vibrant colors
    const lightness = 70 + (hash % 16); // 70-85% lightness for readability
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    return color;
}


async function prepareSubmit() {
  if (userMessage.value.trim() === '') return;
  try {
    // console.log("Submitting message:", userMessage.value);

    const response = await sendMessage(userMessage.value, {
      name: null,
      subject: null,
      email: null,
      threadId: null,
      sessionId: localStorage.getItem('chat_session') || null,
    });
    const result: {
        messageId: number;
        threadId: number;
        sessionId: string;
    } = typeof response.json === 'function' ? await response.json() : response;    

    messages.value.push({
        id: result.messageId,
        thread_id: result.threadId,
        user_id: 0, // Replace with actual user ID if available
        content: userMessage.value,
        // last four characters
        session_id: result.sessionId?.slice(-4) ?? localStorage.getItem('chat_session')?.slice(-4),
        is_read: true,
        created_at: new Date().toISOString(),
    });

    // Store the latest message ID for future reference
    if (messages.value.length > 0) {
        localStorage.setItem('last_message_id', result.messageId.toString());
    }

    userMessage.value = '';

    nextTick(() => {
      scrollToBottom();
    });
  } catch (error) {
    // console.error("Error sending message:", error);
    notify({
      type: 'error',
      message: (error instanceof Error && error.message)
        ? error.message
        : 'Failed to send message. Please try again later.',
    });
  }
}

// Add this function to scroll to bottom
const scrollToBottom = () => {
  nextTick(() => {  
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// get user threads
async function init() {
  try {
    const messages = await getRecentMessages();

    // Store the latest message ID for future reference
    if (messages.length > 0) {
        localStorage.setItem('last_message_id', messages[0].id);
    }

    // Get last seen message ID from localStorage
    const storedLastSeen = localStorage.getItem('last_seen_message_id');
    lastSeenMessageId.value = storedLastSeen ? parseInt(storedLastSeen) : messages[messages.length - 1].id;

    // Calculate initial unread count
    const unreadMessages = messages.filter(msg => msg.id > lastSeenMessageId.value);
    unReadMessageCount.value = unreadMessages.length;

    return messages.reverse();
    } catch (error) {
        console.error('Error fetching user messages:', error);
        return [];
    }
}

onMounted(async () => {
    messages.value = await init();

    // Start SSE for real-time updates with page visibility optimization
    const apiBase = import.meta.env.PUBLIC_API_ENDPOINT || 'https://d1-connect.bonno123.workers.dev';
    // console.log("Chat component using API base:", apiBase);
    
    sseConnection.value = startSSE(apiBase, (newMessage: Message) => {
        // console.log("Received message via SSE in chat component:", newMessage);
        nextTick(() => {
            scrollToBottom();
        });

        // Show browser notification if page is not visible
        // if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        //     console.log('Notification permission:', Notification.permission);
        //     console.log('Document hidden:', document.hidden);
        //     console.log('New message:', newMessage);
    
        //     new Notification('New Message', {
        //         body: `${newMessage.name || 'Someone'}: ${newMessage.content.substring(0, 50)}...`,
        //         icon: '/favicon.ico'
        //     });
        // }

        if (!messages.value.some(m => m.id === newMessage.id)) {
            // console.log("Adding new message to chat UI:", data);
            messages.value.push({
                id: newMessage.id,
                thread_id: newMessage.thread_id || 0,
                user_id: newMessage.user_id || 0,
                content: newMessage.content,
                session_id: newMessage.session_id || null,
                is_read: true,
                created_at: newMessage.created_at,
                name: newMessage.name || null,
                email: newMessage.email || null
            });

            // Store the latest message ID for future reference
            localStorage.setItem('last_message_id', newMessage.id.toString());

            // Increment unread count only if chat is closed and it's not from current user
            const currentSessionId = localStorage.getItem('chat_session')?.slice(-4);
            const messageSessionId = newMessage.session_id?.slice(-4);
            
            if (!isChatOpen.value && messageSessionId !== currentSessionId) {
                incrementUnreadCount();

                // Play sound for new messages from others
                playNotificationSound();
            }

            if (isChatOpen.value) {
                scrollToBottom();
            }
        }
    });
});


// Handle SSE connection cleanup on component unmount
onUnmounted(() => {
    if (sseConnection.value && sseConnection.value.cleanup) {
        sseConnection.value.cleanup();
    }
});

// Also scroll to bottom when chat is opened
watch(isChatOpen, (newValue) => {
  if (newValue) {
    markMessagesAsRead();
    scrollToBottom();
  }
});

</script>


<style lang="scss" scoped>

    // Imports
// --------------------------------------
@import 'https://fonts.googleapis.com/css?family=Noto+Sans';
// Variables
// --------------------------------------
$scrollbar-width: 5px;
$chat-thread-bgd-color: rgba(25, 147, 147, 0.2);
$chat-thread-msg-arrow-size: 8px;
$chat-thread-avatar-size: 18px;
$chat-thread-offset: #{$chat-thread-avatar-size + 15px};
$default-shadow-color: rgb(0, 0, 0);
// Mixins
// --------------------------------------
@mixin fancy-background() {
    background: -moz-linear-gradient(-45deg, #70c917 0, #183850 25%, #192C46 50%, #22254C 75%, #22254C 100%);
    background: -webkit-linear-gradient(-45deg, #183850 0, #183850 25%, #192C46 50%, #22254C 75%, #22254C 100%);
    background-repeat: no-repeat;
    background-attachment: fixed;
}

@mixin fancy-scrollbar() {
    &::-webkit-scrollbar {
        width: $scrollbar-width;
    }
    &::-webkit-scrollbar-track {
        border-radius: $scrollbar-width;
        background-color: rgba(25, 147, 147, 0.1);
    }
    &::-webkit-scrollbar-thumb {
        border-radius: $scrollbar-width;
        background-color: $chat-thread-bgd-color;
    }
}

@mixin scrolling-shadows($background-color: transparent, $shadow-intensity: 0.5, $shadow-color: $default-shadow-color, $cover-size: 40px, $shadow-size: 14px) {
    background: linear-gradient($background-color 30%, rgba($background-color, 0)), linear-gradient(rgba($background-color, 0), $background-color 70%) 0 100%, radial-gradient(50% 0, farthest-side, rgba($shadow-color, $shadow-intensity), rgba($shadow-color, 0)), radial-gradient(50% 100%, farthest-side, rgba($shadow-color, $shadow-intensity), rgba($shadow-color, 0)) 0 100%;
    background: linear-gradient($background-color 30%, rgba($background-color, 0)), linear-gradient(rgba($background-color, 0), $background-color 70%) 0 100%, radial-gradient(farthest-side at 50% 0, rgba($shadow-color, $shadow-intensity), rgba($shadow-color, 0));
    background-repeat: no-repeat;
    background-color: $background-color;
    background-size: 100% $cover-size, 100% $cover-size, 100% $shadow-size, 100% $shadow-size;
    background-attachment: local, local, scroll, scroll;
}

* {
    box-sizing: border-box;
}

body {
    background: skyblue;
    font: 12px/16px 'Noto Sans', sans-serif;
}

.floating-chat {
    // z-index: 1000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    position: fixed;
    bottom: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    transform: translateY(70px);
    transition: all 250ms ease-out;
    border-radius: 50%;
    opacity: 0;
    @include fancy-background;
    &.enter:hover {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
        opacity: 1;
    }
    &.enter {
        transform: translateY(0);
        opacity: 0.6;
        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.14);
    }
    &.expand {
        width: 250px;
        max-height: 400px;
        height: 400px;
        border-radius: 5px;
        cursor: auto;
        opacity: 1;
    }
    :focus {
        outline: 0;
        box-shadow: 0 0 3pt 2pt rgba(#0EC879, 0.3);
    }
    button {
        background: transparent;
        border: 0;
        color: white;
        text-transform: uppercase;
        border-radius: 3px;
        cursor: pointer;
    }
    .chat {
        display: flex;
        flex-direction: column;
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
        border-radius: 50%;
        transition: all 250ms ease-out;
        margin: auto;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        &.enter {
            opacity: 1;
            border-radius: 0;
            margin: 10px;
            width: auto;
            height: auto;
        }
        .header {
            flex-shrink: 0;
            padding-bottom: 10px;
            display: flex;
            background: transparent;
            .title {
                flex-grow: 1;
                flex-shrink: 1;
                padding: 0 5px;
            }
            button {
                flex-shrink: 0;
            }
        }
        .messages {
            padding: 0px;
            margin: 0;
            list-style: none;
            overflow-y: scroll;
            overflow-x: hidden;
            flex-grow: 1;
            border-radius: 4px;
            background: transparent;
            @include fancy-scrollbar;
            li {
                position: relative;
                clear: both;
                display: inline-block;
                padding: 14px;
                margin: 0 0 10px 0;
                font: 12px/16px 'Noto Sans', sans-serif;
                border-radius: 10px;
                background-color: $chat-thread-bgd-color;
                word-wrap: break-word;
                max-width: 81%;
                &:before {
                    position: absolute;
                    top: 0;
                    width: $chat-thread-avatar-size;
                    height: $chat-thread-avatar-size;
                    border-radius: $chat-thread-avatar-size;
                    content: '';
                    background-size: cover;
                }
                &:after {
                    position: absolute;
                    top: $chat-thread-msg-arrow-size;
                    content: '';
                    width: 0;
                    height: 0;
                    border-top: $chat-thread-msg-arrow-size solid $chat-thread-bgd-color;
                }
                & span {
                    // font-weight: bold;
                    // color: rgb(4, 231, 208);
                    margin-right: 5px;
                }
                & .username {
                    font-weight: bold;
                    // color: rgb(4, 231, 208);
                    // margin-right: 5px;
                }
                &:first-of-type {
                    margin-top: 10px;
                }
            }
            li.self {
                animation: show-chat-odd 0.15s 1 ease-in;
                -moz-animation: show-chat-odd 0.15s 1 ease-in;
                -webkit-animation: show-chat-odd 0.15s 1 ease-in;
                float: right;
                margin-right: $chat-thread-offset;
                // color: #0AD5C1;
            }
            li.self:before {
                right: -$chat-thread-offset;
                // Placeholder avatar 1
                background-image: url(https://github.com/Thatkookooguy.png);
            }
            li.self:after {
                border-right: $chat-thread-msg-arrow-size solid transparent;
                right: -$chat-thread-msg-arrow-size;
            }
            li.other {
                animation: show-chat-even 0.15s 1 ease-in;
                -moz-animation: show-chat-even 0.15s 1 ease-in;
                -webkit-animation: show-chat-even 0.15s 1 ease-in;
                float: left;
            }
            // li.other:before {
            //     left: -$chat-thread-offset;
            //     top: 2.5px;

            //     // Placeholder avatar 2
            //     background-image: url(/public/anonymous.svg);
            // }
            // li.other:after {
            //     border-left: $chat-thread-msg-arrow-size solid transparent;
            //     left: -$chat-thread-msg-arrow-size;
            // }
            li.anonymous {
                animation: show-chat-even 0.15s 1 ease-in;
                -moz-animation: show-chat-even 0.15s 1 ease-in;
                -webkit-animation: show-chat-even 0.15s 1 ease-in;
                float: left;
                // margin-left: $chat-thread-offset;
                // color: #0EC879;
            }
            // li.anonymous:before {
            //     left: -$chat-thread-offset;
            //     top: 2.5px;

            //     // Placeholder avatar 2
            //     background-image: url(/public/anonymous.svg);
            // }
            // li.anonymous:after {
            //     border-left: $chat-thread-msg-arrow-size solid transparent;
            //     left: -$chat-thread-msg-arrow-size;
            // }
        }
        .footer {
            flex-shrink: 0;
            display: flex;
            //flex-direction: row-reverse;
            padding-top: 10px;
            max-height: 90px;
            background: transparent;
            .text-box {
                border-radius: 3px;
                background: $chat-thread-bgd-color;
                min-height: 100%;
                width: 100%;
                margin-right: 5px;
                // color: #0EC879;
                overflow-y: auto;
                padding: 2px 5px;
                @include fancy-scrollbar;
            }
        }
    }
}

// Animation
// --------------------------------------
@keyframes show-chat-even {
    0% {
        margin-left: -480px;
    }
    100% {
        margin-left: 0;
    }
}

@-moz-keyframes show-chat-even {
    0% {
        margin-left: -480px;
    }
    100% {
        margin-left: 0;
    }
}

@-webkit-keyframes show-chat-even {
    0% {
        margin-left: -480px;
    }
    100% {
        margin-left: 0;
    }
}

@keyframes show-chat-odd {
    0% {
        margin-right: -480px;
    }
    100% {
        margin-right: 0;
    }
}

@-moz-keyframes show-chat-odd {
    0% {
        margin-right: -480px;
    }
    100% {
        margin-right: 0;
    }
}

@-webkit-keyframes show-chat-odd {
    0% {
        margin-right: -480px;
    }
    100% {
        margin-right: 0;
    }
}


// add a message counter badge to the chat button when there are unread messages
.floating-chat .unread-badge::after {
    content: var(--unread-count);
    position: absolute;
    top: -5px;
    right: -5px;
    background: rgb(203, 73, 95);
    color: white;
    font-size: 10px;
    width: 16px;
    height: 16px;
    text-align: center;
    line-height: 16px;
    border-radius: 50%;
    // display: none;
}
</style>