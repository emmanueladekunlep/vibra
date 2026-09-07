/**
 * VIBRA - Chat Service with WebSocket + Database
 * Module: Chat
 * 
 * Handles all chat operations with real-time WebSocket support.
 * Messages are stored in database, not localStorage.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';
// WebSocket disabled for now - use polling fallback
const WS_URL = null;

let ws = null;
let wsCallbacks = [];
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Cache for user names
let userCache = {};
let pollIntervalId = null;
let isPolling = false;

// ========== WEBSOCKET ==========

export const connectWebSocket = (userId) => {
  console.log('WebSocket disabled - using polling fallback');
  if (!isPolling && userId) {
    startPolling(userId);
  }
  return;
};

export const disconnectWebSocket = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
  wsCallbacks = [];
  stopPolling();
};

export const subscribeToMessages = (callback) => {
  wsCallbacks.push(callback);
  return () => {
    wsCallbacks = wsCallbacks.filter(cb => cb !== callback);
  };
};

export const sendTyping = (conversationId, senderId) => {
  return;
};

export const sendReadReceipt = (conversationId, userId) => {
  return;
};

// ========== POLLING FOR REAL-TIME UPDATES ==========

let pollingUserId = null;
let pollingConversations = {};

const startPolling = (userId) => {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
  }
  pollingUserId = userId;
  pollIntervalId = setInterval(async () => {
    if (!pollingUserId) return;
    try {
      const convs = await getConversations(pollingUserId);
      for (const conv of convs) {
        const prevId = pollingConversations[conv.id]?.lastMessageId || 0;
        if (conv.lastMessage && conv.lastMessage.id !== prevId) {
          const msgData = {
            type: 'new_message',
            conversationId: conv.id,
            message: conv.lastMessage,
            senderId: conv.lastMessage.senderId
          };
          wsCallbacks.forEach(cb => {
            try { cb(msgData); } catch (e) {}
          });
          pollingConversations[conv.id] = {
            lastMessageId: conv.lastMessage.id,
            updatedAt: conv.updatedAt
          };
        }
      }
    } catch (e) {}
  }, 1500);
  isPolling = true;
};

const stopPolling = () => {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  isPolling = false;
  pollingUserId = null;
  pollingConversations = {};
};

// ========== USER INFO FETCH ==========

export const fetchUserInfo = async (userId) => {
  if (!userId) {
    return {
      id: userId,
      userId: userId,
      name: 'Unknown User',
      level: 'Bronze',
      isVerified: false,
      photos: [],
      phone: '',
    };
  }

  if (userCache[userId]) {
    return userCache[userId];
  }

  if (typeof userId === 'string' && userId.startsWith('user_')) {
    const fallback = {
      id: userId,
      userId: userId,
      name: 'User ' + String(userId).slice(-4),
      level: 'Bronze',
      isVerified: false,
      photos: [],
      phone: '',
    };
    userCache[userId] = fallback;
    return fallback;
  }

  try {
    const response = await fetch(`${API_URL}/get_user.php?user_id=${encodeURIComponent(userId)}`);
    const data = await response.json();
    
    if (data.success && data.user) {
      const userInfo = {
        id: data.user.id,
        userId: data.user.userId || userId,
        name: data.user.name || data.user.registration_name || 'User',
        level: data.user.level || 'Bronze',
        isVerified: data.user.isVerified || false,
        photos: data.user.photos || [],
        phone: data.user.phone || '',
      };
      userCache[userId] = userInfo;
      return userInfo;
    }
  } catch (error) {
    console.error('Fetch user info error:', error);
  }

  const fallback = {
    id: userId,
    userId: userId,
    name: 'User ' + String(userId).slice(-4),
    level: 'Bronze',
    isVerified: false,
    photos: [],
    phone: '',
  };
  userCache[userId] = fallback;
  return fallback;
};

export const fetchMultipleUsers = async (userIds) => {
  const results = {};
  const uncached = [];

  for (const id of userIds) {
    if (!id) continue;
    if (userCache[id]) {
      results[id] = userCache[id];
    } else {
      uncached.push(id);
    }
  }

  for (const id of uncached) {
    try {
      const info = await fetchUserInfo(id);
      results[id] = info;
    } catch (error) {
      results[id] = {
        id: id,
        userId: id,
        name: 'User ' + String(id).slice(-4),
        level: 'Bronze',
        isVerified: false,
        photos: [],
        phone: '',
      };
    }
  }

  return results;
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
  if (!userId) return [];
  
  try {
    const response = await fetch(`${API_URL}/get_conversations.php?user_id=${encodeURIComponent(userId)}`);
    const data = await response.json();
    
    if (data.success) {
      const conversations = data.conversations || [];
      
      const otherUserIds = conversations
        .map(conv => conv.otherUser?.id || conv.otherUser?.userId)
        .filter(id => id && id !== userId);
      
      if (otherUserIds.length > 0) {
        const userMap = await fetchMultipleUsers(otherUserIds);
        
        for (const conv of conversations) {
          const otherId = conv.otherUser?.id || conv.otherUser?.userId;
          if (otherId && userMap[otherId]) {
            conv.otherUser = {
              ...conv.otherUser,
              ...userMap[otherId],
              photos: userMap[otherId].photos || [],
            };
          }
        }
      }
      
      return conversations;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Get conversations error:', error);
    return [];
  }
};

export const getMessages = async (conversationId, limit = 50, startAfter = null) => {
  if (!conversationId) return [];
  
  try {
    let url = `${API_URL}/get_messages.php?conversation_id=${encodeURIComponent(conversationId)}&limit=${limit}`;
    if (startAfter) {
      url += `&start_after=${encodeURIComponent(startAfter)}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.messages || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error('Get messages error:', error);
    return [];
  }
};

export const getConversation = async (conversationId) => {
  if (!conversationId) {
    throw new Error('Conversation ID is required');
  }

  try {
    const response = await fetch(`${API_URL}/get_conversation.php?conversation_id=${encodeURIComponent(conversationId)}`);
    const data = await response.json();
    
    if (data.success) {
      return data.conversation;
    } else {
      throw new Error(data.message || 'Failed to get conversation');
    }
  } catch (error) {
    console.error('Get conversation error:', error);
    throw error;
  }
};

export const getOrCreateConversation = async (userId1, userId2) => {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required');
  }

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
      const conversation = data.conversation;
      
      const otherId = conversation.participants?.find(id => id != userId1);
      if (otherId) {
        const userInfo = await fetchUserInfo(otherId);
        conversation.otherUser = userInfo;
      }
      
      return conversation;
    } else {
      throw new Error(data.message || 'Failed to create conversation');
    }
  } catch (error) {
    console.error('Get conversation error:', error);
    throw error;
  }
};

export const markAsRead = async (conversationId, userId) => {
  if (!conversationId || !userId) {
    return { success: false };
  }

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
  if (!userId) return 0;
  
  try {
    const response = await fetch(`${API_URL}/get_unread.php?user_id=${encodeURIComponent(userId)}`);
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
  if (!conversationId) {
    return { success: false };
  }

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

export const getUserInfo = async (userId) => {
  return await fetchUserInfo(userId);
};

export const canChat = () => true;

export const clearUserCache = () => {
  userCache = {};
};

let pollInterval = 1500;

export const setPollInterval = (ms) => {
  pollInterval = ms;
  if (pollIntervalId && pollingUserId) {
    stopPolling();
    startPolling(pollingUserId);
  }
};

export default {
  getOrCreateConversation,
  getConversation,
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
  fetchUserInfo,
  fetchMultipleUsers,
  clearUserCache,
  setPollInterval,
};