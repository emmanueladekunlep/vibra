/**
 * VIBRA - Chat Service with WebSocket
 * Module: Chat
 * 
 * Handles all chat operations with real-time WebSocket support.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';
const WS_URL = 'wss://api.vibra.ng:8080/chat';

// Storage keys
const CONVERSATIONS_KEY = 'vibra_conversations';
const MESSAGES_KEY = 'vibra_messages';

let ws = null;
let wsCallbacks = [];
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Mock conversations database
let MOCK_CONVERSATIONS = {};
let MOCK_MESSAGES = {};

try {
  const savedConv = localStorage.getItem(CONVERSATIONS_KEY);
  if (savedConv) MOCK_CONVERSATIONS = JSON.parse(savedConv);
} catch {}

try {
  const savedMsg = localStorage.getItem(MESSAGES_KEY);
  if (savedMsg) MOCK_MESSAGES = JSON.parse(savedMsg);
} catch {}

// ========== WEBSOCKET ==========

export const connectWebSocket = (userId) => {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  if (isConnecting) return;

  isConnecting = true;

  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnecting = false;
      reconnectAttempts = 0;
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        userId: String(userId)
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      wsCallbacks.forEach(callback => callback(data));
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      isConnecting = false;
      reconnectAttempts++;
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
          console.log('Reconnecting...');
          connectWebSocket(userId);
        }, 3000 * reconnectAttempts);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    isConnecting = false;
  }
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  wsCallbacks = [];
};

export const subscribeToMessages = (callback) => {
  wsCallbacks.push(callback);
  return () => {
    wsCallbacks = wsCallbacks.filter(cb => cb !== callback);
  };
};

export const sendTyping = (conversationId, senderId) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'typing',
      conversationId,
      senderId: String(senderId)
    }));
  }
};

export const sendReadReceipt = (conversationId, userId) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'read',
      conversationId,
      userId: String(userId)
    }));
  }
};

// ========== API CALLS (Fallback) ==========

export const sendMessage = async (conversationId, senderId, text) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  const prohibited = ['send me money', 'give me cash', 'pay me', 'transfer'];
  if (prohibited.some(p => text.toLowerCase().includes(p))) {
    throw new Error('Message contains prohibited content');
  }

  // Send via WebSocket if connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      conversationId,
      senderId: String(senderId),
      text: text.trim()
    }));
    
    // Return optimistic message
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      senderId: String(senderId),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };
  }

  // Fallback: save to localStorage
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    conversationId,
    senderId: String(senderId),
    text: text.trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  if (!MOCK_MESSAGES[conversationId]) {
    MOCK_MESSAGES[conversationId] = [];
  }
  MOCK_MESSAGES[conversationId].push(message);

  const conv = MOCK_CONVERSATIONS[conversationId];
  if (conv) {
    conv.lastMessage = message;
    conv.lastMessageTime = message.timestamp;
    conv.updatedAt = message.timestamp;
    
    const otherUserId = conv.participants.find(id => id !== String(senderId));
    if (otherUserId) {
      conv.unreadCount[otherUserId] = (conv.unreadCount[otherUserId] || 0) + 1;
    }
    
    MOCK_CONVERSATIONS[conversationId] = conv;
  }

  saveMessages();
  saveConversations();

  return message;
};

export const getConversations = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const conversations = [];
  const userIdStr = String(userId);
  
  for (const convId in MOCK_CONVERSATIONS) {
    const conv = MOCK_CONVERSATIONS[convId];
    if (conv.participants.includes(userIdStr)) {
      const otherUserId = conv.participants.find(id => id !== userIdStr);
      
      let otherUser = { id: otherUserId, name: 'User', level: 'Bronze', isVerified: false, photos: [] };
      try {
        const response = await fetch(`${API_URL}/get_user.php?user_id=${otherUserId}`);
        const data = await response.json();
        if (data.success && data.user) {
          otherUser = {
            id: data.user.id,
            userId: data.user.userId,
            name: data.user.name,
            level: data.user.level,
            isVerified: data.user.isVerified,
            photos: data.user.photos || [],
          };
        }
      } catch (err) {
        console.warn('Failed to fetch user:', err);
      }
      
      const messages = MOCK_MESSAGES[convId] || [];
      const unread = conv.unreadCount?.[userIdStr] || 0;

      conversations.push({
        ...conv,
        otherUser,
        unreadCount: unread,
        lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
      });
    }
  }

  conversations.sort((a, b) => {
    const timeA = a.lastMessage?.timestamp || a.createdAt;
    const timeB = b.lastMessage?.timestamp || b.createdAt;
    return new Date(timeB) - new Date(timeA);
  });

  return conversations;
};

export const getMessages = async (conversationId, limit = 50, startAfter = null) => {
  await new Promise((resolve) => setTimeout(resolve, 400));

  let messages = MOCK_MESSAGES[conversationId] || [];

  messages = [...messages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  if (startAfter) {
    const index = messages.findIndex(m => m.id === startAfter);
    if (index !== -1) {
      messages = messages.slice(index + 1);
    }
  }

  if (messages.length > limit) {
    messages = messages.slice(-limit);
  }

  return messages;
};

export const getOrCreateConversation = async (userId1, userId2) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const convId = getConversationId(userId1, userId2);
  
  if (MOCK_CONVERSATIONS[convId]) {
    return MOCK_CONVERSATIONS[convId];
  }

  const conversation = {
    id: convId,
    participants: [String(userId1), String(userId2)],
    lastMessage: null,
    lastMessageTime: null,
    unreadCount: { [String(userId1)]: 0, [String(userId2)]: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MOCK_CONVERSATIONS[convId] = conversation;
  MOCK_MESSAGES[convId] = [];
  saveConversations();
  saveMessages();

  return conversation;
};

export const markAsRead = async (conversationId, userId) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const conv = MOCK_CONVERSATIONS[conversationId];
  if (!conv) {
    throw new Error('Conversation not found');
  }

  const messages = MOCK_MESSAGES[conversationId] || [];
  let updatedCount = 0;
  
  messages.forEach(msg => {
    if (msg.senderId !== String(userId) && !msg.read) {
      msg.read = true;
      updatedCount++;
    }
  });

  conv.unreadCount[String(userId)] = 0;
  MOCK_CONVERSATIONS[conversationId] = conv;

  saveMessages();
  saveConversations();

  // Send read receipt via WebSocket
  sendReadReceipt(conversationId, userId);

  return { success: true, messagesRead: updatedCount };
};

export const getUnreadCount = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  let total = 0;
  const userIdStr = String(userId);
  for (const convId in MOCK_CONVERSATIONS) {
    const conv = MOCK_CONVERSATIONS[convId];
    if (conv.participants.includes(userIdStr)) {
      total += conv.unreadCount?.[userIdStr] || 0;
    }
  }
  return total;
};

export const deleteConversation = async (conversationId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  delete MOCK_CONVERSATIONS[conversationId];
  delete MOCK_MESSAGES[conversationId];
  
  saveConversations();
  saveMessages();

  return { success: true };
};

const getConversationId = (userId1, userId2) => {
  const sorted = [String(userId1), String(userId2)].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
};

const saveConversations = () => {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(MOCK_CONVERSATIONS));
  } catch (error) {
    console.warn('Failed to save conversations:', error);
  }
};

const saveMessages = () => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(MOCK_MESSAGES));
  } catch (error) {
    console.warn('Failed to save messages:', error);
  }
};

export const getUserInfo = (userId) => {
  return { 
    id: userId, 
    name: 'User', 
    level: 'Bronze',
    isVerified: false,
    photos: []
  };
};

export const canChat = () => true;

export default {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteConversation,
  getUserInfo,
  canChat,
  connectWebSocket,
  disconnectWebSocket,
  subscribeToMessages,
  sendTyping,
  sendReadReceipt,
};