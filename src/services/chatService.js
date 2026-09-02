/**
 * VIBRA - Chat Service with WebSocket + Database
 * Module: Chat
 * 
 * Handles all chat operations with real-time WebSocket support.
 * Messages are stored in database, not localStorage.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';
const WS_URL = 'wss://api.vibra.ng/ws';

// Storage keys (only for cache)
const CONVERSATIONS_KEY = 'vibra_conversations_cache';
const MESSAGES_KEY = 'vibra_messages_cache';

let ws = null;
let wsCallbacks = [];
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

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

// ========== API CALLS ==========

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
    
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      senderId: String(senderId),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };
  }

  // Fallback: save to API
  try {
    const response = await fetch(`${API_URL}/send_message.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        sender_id: senderId,
        text: text.trim()
      })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.message;
    } else {
      throw new Error(data.message || 'Failed to send message');
    }
  } catch (error) {
    console.error('Send message error:', error);
    throw new Error('Failed to send message');
  }
};

export const getConversations = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/get_conversations.php?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.conversations;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Get conversations error:', error);
    return [];
  }
};

export const getMessages = async (conversationId, limit = 50, startAfter = null) => {
  try {
    let url = `${API_URL}/get_messages.php?conversation_id=${conversationId}&limit=${limit}`;
    if (startAfter) {
      url += `&start_after=${startAfter}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.messages;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Get messages error:', error);
    return [];
  }
};

export const getOrCreateConversation = async (userId1, userId2) => {
  try {
    const response = await fetch(`${API_URL}/get_conversation.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id1: userId1,
        user_id2: userId2
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.conversation;
    } else {
      throw new Error(data.message || 'Failed to create conversation');
    }
  } catch (error) {
    console.error('Get conversation error:', error);
    throw error;
  }
};

export const markAsRead = async (conversationId, userId) => {
  try {
    const response = await fetch(`${API_URL}/mark_read.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: userId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      sendReadReceipt(conversationId, userId);
      return { success: true, messagesRead: data.messagesRead || 0 };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Mark read error:', error);
    return { success: false };
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/get_unread.php?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.count || 0;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Get unread error:', error);
    return 0;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const response = await fetch(`${API_URL}/delete_conversation.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId
      })
    });
    
    const data = await response.json();
    return { success: data.success };
  } catch (error) {
    console.error('Delete conversation error:', error);
    return { success: false };
  }
};

const getConversationId = (userId1, userId2) => {
  const sorted = [String(userId1), String(userId2)].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
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