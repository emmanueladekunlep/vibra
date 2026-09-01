/**
 * VIBRA - Chat Service
 * Module: Chat
 * 
 * Handles all chat operations:
 * - Get conversations
 * - Send/receive messages (text only)
 * - Mark messages as read
 * - Get unread counts
 * - Real-time updates (mock with polling)
 */

// Storage keys
const CONVERSATIONS_KEY = 'vibra_conversations';
const MESSAGES_KEY = 'vibra_messages';

// Mock conversations database
let MOCK_CONVERSATIONS = {};
let MOCK_MESSAGES = {};

// Load from localStorage if available
try {
  const savedConv = localStorage.getItem(CONVERSATIONS_KEY);
  if (savedConv) MOCK_CONVERSATIONS = JSON.parse(savedConv);
} catch {}

try {
  const savedMsg = localStorage.getItem(MESSAGES_KEY);
  if (savedMsg) MOCK_MESSAGES = JSON.parse(savedMsg);
} catch {}

/**
 * Get or create a conversation between two users
 * @param {string} userId1 - Current user ID
 * @param {string} userId2 - Other user ID
 * @returns {Promise<Object>} Conversation object
 */
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

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of conversations with user details
 */
export const getConversations = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const conversations = [];
  const userIdStr = String(userId);
  
  for (const convId in MOCK_CONVERSATIONS) {
    const conv = MOCK_CONVERSATIONS[convId];
    if (conv.participants.includes(userIdStr)) {
      const otherUserId = conv.participants.find(id => id !== userIdStr);
      
      // Try to get real user data from API
      let otherUser = { id: otherUserId, name: 'User', level: 'Bronze', isVerified: false, photos: [] };
      try {
        const response = await fetch(`https://api.vibra.ng/api/get_user.php?user_id=${otherUserId}`);
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

  // Sort by last message time (most recent first)
  conversations.sort((a, b) => {
    const timeA = a.lastMessage?.timestamp || a.createdAt;
    const timeB = b.lastMessage?.timestamp || b.createdAt;
    return new Date(timeB) - new Date(timeA);
  });

  return conversations;
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Number of messages to fetch
 * @param {string} startAfter - Message ID to start after (for pagination)
 * @returns {Promise<Array>} List of messages
 */
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

/**
 * Send a message
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender user ID
 * @param {string} text - Message text (plain text only)
 * @returns {Promise<Object>} Sent message
 */
export const sendMessage = async (conversationId, senderId, text) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!text || text.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  const prohibited = ['send me money', 'give me cash', 'pay me', 'transfer'];
  if (prohibited.some(p => text.toLowerCase().includes(p))) {
    throw new Error('Message contains prohibited content');
  }

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

/**
 * Mark messages as read in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID marking as read
 * @returns {Promise<Object>} Updated conversation
 */
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

  return { success: true, messagesRead: updatedCount };
};

/**
 * Get total unread count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total unread messages
 */
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

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Result
 */
export const deleteConversation = async (conversationId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  delete MOCK_CONVERSATIONS[conversationId];
  delete MOCK_MESSAGES[conversationId];
  
  saveConversations();
  saveMessages();

  return { success: true };
};

/**
 * Get conversation ID from two user IDs
 */
const getConversationId = (userId1, userId2) => {
  const sorted = [String(userId1), String(userId2)].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
};

/**
 * Save conversations to localStorage
 */
const saveConversations = () => {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(MOCK_CONVERSATIONS));
  } catch (error) {
    console.warn('Failed to save conversations:', error);
  }
};

/**
 * Save messages to localStorage
 */
const saveMessages = () => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(MOCK_MESSAGES));
  } catch (error) {
    console.warn('Failed to save messages:', error);
  }
};

/**
 * Get user info (mock)
 */
export const getUserInfo = (userId) => {
  return { 
    id: userId, 
    name: 'User', 
    level: 'Bronze',
    isVerified: false,
    photos: []
  };
};

/**
 * Check if user has access to chat (always true - free for everyone)
 */
export const canChat = () => {
  return true;
};

/**
 * Subscribe to new messages (mock polling)
 * @param {string} conversationId - Conversation ID
 * @param {Function} callback - Callback function
 * @param {number} interval - Polling interval in ms
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMessages = (conversationId, callback, interval = 3000) => {
  let lastMessageId = null;
  const messages = MOCK_MESSAGES[conversationId] || [];
  if (messages.length > 0) {
    lastMessageId = messages[messages.length - 1].id;
  }

  const intervalId = setInterval(() => {
    const currentMessages = MOCK_MESSAGES[conversationId] || [];
    if (currentMessages.length > 0) {
      const last = currentMessages[currentMessages.length - 1];
      if (last.id !== lastMessageId) {
        lastMessageId = last.id;
        callback(currentMessages);
      }
    }
  }, interval);

  return () => clearInterval(intervalId);
};

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
  subscribeToMessages,
};