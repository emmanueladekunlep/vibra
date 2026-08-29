/**
 * VIBRA - Chat Service
 * Module: Chat
 * Author: Emmanuel Adekunle Peace
 * Website: www.emmanueladekunlepeace.com
 * 
 * Handles all chat operations:
 * - Get conversations
 * - Send/receive messages (text only)
 * - Mark messages as read
 * - Get unread counts
 * - Real-time updates (mock with polling)
 * 
 * All API calls are mocked. Replace with real endpoints when available.
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

// Generate mock users for demo
const MOCK_USERS = {
  'user_1': { id: 'user_1', name: 'Peace Emmanuel', level: 'Diamond', isVerified: true, photos: [] },
  'user_2': { id: 'user_2', name: 'Test User', level: 'Bronze', isVerified: true, photos: [] },
  'user_3': { id: 'user_3', name: 'Chioma Okafor', level: 'Gold', isVerified: true, photos: [] },
  'user_4': { id: 'user_4', name: 'Tunde Bakare', level: 'Silver', isVerified: false, photos: [] },
  'user_5': { id: 'user_5', name: 'Amina Suleiman', level: 'Platinum', isVerified: true, photos: [] },
  'user_6': { id: 'user_6', name: 'Chidi Nwosu', level: 'Gold', isVerified: true, photos: [] },
  'user_7': { id: 'user_7', name: 'Folake Adeyemi', level: 'Silver', isVerified: true, photos: [] },
  'user_8': { id: 'user_8', name: 'Emeka Obi', level: 'Bronze', isVerified: false, photos: [] },
};

/**
 * Get or create a conversation between two users
 * @param {string} userId1 - Current user ID
 * @param {string} userId2 - Other user ID
 * @returns {Promise<Object>} Conversation object
 */
export const getOrCreateConversation = async (userId1, userId2) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Check if conversation exists
  const convId = getConversationId(userId1, userId2);
  
  if (MOCK_CONVERSATIONS[convId]) {
    return MOCK_CONVERSATIONS[convId];
  }

  // Create new conversation
  const conversation = {
    id: convId,
    participants: [userId1, userId2],
    lastMessage: null,
    lastMessageTime: null,
    unreadCount: { [userId1]: 0, [userId2]: 0 },
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
  
  for (const convId in MOCK_CONVERSATIONS) {
    const conv = MOCK_CONVERSATIONS[convId];
    if (conv.participants.includes(userId)) {
      const otherUserId = conv.participants.find(id => id !== userId);
      const otherUser = MOCK_USERS[otherUserId] || { 
        id: otherUserId, 
        name: 'Unknown User', 
        level: 'Bronze',
        isVerified: false,
        photos: []
      };
      
      const messages = MOCK_MESSAGES[convId] || [];
      const unread = conv.unreadCount?.[userId] || 0;

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

  // Sort by timestamp (oldest first for display)
  messages = [...messages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  if (startAfter) {
    const index = messages.findIndex(m => m.id === startAfter);
    if (index !== -1) {
      messages = messages.slice(index + 1);
    }
  }

  // Apply limit
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

  // Check for prohibited phrases (AI moderation mock)
  const prohibited = ['send me money', 'give me cash', 'pay me', 'transfer'];
  if (prohibited.some(p => text.toLowerCase().includes(p))) {
    throw new Error('Message contains prohibited content');
  }

  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    conversationId,
    senderId,
    text: text.trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  // Save message
  if (!MOCK_MESSAGES[conversationId]) {
    MOCK_MESSAGES[conversationId] = [];
  }
  MOCK_MESSAGES[conversationId].push(message);

  // Update conversation
  const conv = MOCK_CONVERSATIONS[conversationId];
  if (conv) {
    conv.lastMessage = message;
    conv.lastMessageTime = message.timestamp;
    conv.updatedAt = message.timestamp;
    
    // Increment unread count for other participants
    const otherUserId = conv.participants.find(id => id !== senderId);
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

  // Mark messages as read
  const messages = MOCK_MESSAGES[conversationId] || [];
  let updatedCount = 0;
  
  messages.forEach(msg => {
    if (msg.senderId !== userId && !msg.read) {
      msg.read = true;
      updatedCount++;
    }
  });

  // Reset unread count for this user
  conv.unreadCount[userId] = 0;
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
  for (const convId in MOCK_CONVERSATIONS) {
    const conv = MOCK_CONVERSATIONS[convId];
    if (conv.participants.includes(userId)) {
      total += conv.unreadCount?.[userId] || 0;
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
  const sorted = [userId1, userId2].sort();
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
  return MOCK_USERS[userId] || { 
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