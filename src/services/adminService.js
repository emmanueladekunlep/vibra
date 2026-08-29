/**
 * VIBRA - Admin Service
 * Module: Admin Panel
 * 
 * Handles all admin operations:
 * - User management (suspend, verify, change level)
 * - Platform analytics
 * - VIP code generation
 * - System settings
 * - Content moderation
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const ADMIN_SETTINGS_KEY = 'vibra_admin_settings';
const SYSTEM_LOGS_KEY = 'vibra_system_logs';

// Mock data
let MOCK_USERS = {};
let MOCK_ADMIN_SETTINGS = {};
let MOCK_SYSTEM_LOGS = [];

// Load from localStorage
try {
  const saved = localStorage.getItem(ADMIN_SETTINGS_KEY);
  if (saved) MOCK_ADMIN_SETTINGS = JSON.parse(saved);
} catch {}

try {
  const saved = localStorage.getItem(SYSTEM_LOGS_KEY);
  if (saved) MOCK_SYSTEM_LOGS = JSON.parse(saved);
} catch {}

// Mock user data (should be replaced with real user service)
const MOCK_USER_DB = {
  'user_1': {
    id: 'user_1',
    name: 'Peace Emmanuel',
    email: 'peace@vibra.ng',
    phone: '08012345678',
    location: 'Yaba, Lagos',
    level: 'Diamond',
    points: 150000,
    isVerified: true,
    isVIP: false,
    vipPointsLocked: false,
    status: 'active',
    createdAt: '2026-01-01',
    lastLogin: '2026-08-22',
    isFounder: true,
    hasWithdrawn: true,
  },
  'user_2': {
    id: 'user_2',
    name: 'Test User',
    email: 'test@vibra.ng',
    phone: '08087654321',
    location: 'Surulere, Lagos',
    level: 'Gold',
    points: 30000,
    isVerified: true,
    isVIP: false,
    vipPointsLocked: false,
    status: 'active',
    createdAt: '2026-01-15',
    lastLogin: '2026-08-21',
    isFounder: false,
    hasWithdrawn: false,
  },
  'user_3': {
    id: 'user_3',
    name: 'Chioma Okafor',
    email: 'chioma@vibra.ng',
    phone: '08011223344',
    location: 'Ikeja, Lagos',
    level: 'Platinum',
    points: 60000,
    isVerified: true,
    isVIP: true,
    vipPointsLocked: true,
    status: 'active',
    createdAt: '2026-02-01',
    lastLogin: '2026-08-22',
    isFounder: false,
    hasWithdrawn: true,
  },
  'user_4': {
    id: 'user_4',
    name: 'Tunde Bakare',
    phone: '08099887766',
    location: 'Abuja',
    level: 'Silver',
    points: 15000,
    isVerified: false,
    isVIP: false,
    vipPointsLocked: false,
    status: 'active',
    createdAt: '2026-03-01',
    lastLogin: '2026-08-20',
    isFounder: false,
    hasWithdrawn: false,
  },
  'user_5': {
    id: 'user_5',
    name: 'Amina Suleiman',
    phone: '08122334455',
    location: 'Kano',
    level: 'Gold',
    points: 28000,
    isVerified: true,
    isVIP: false,
    vipPointsLocked: false,
    status: 'active',
    createdAt: '2026-03-15',
    lastLogin: '2026-08-22',
    isFounder: false,
    hasWithdrawn: true,
  },
  'user_6': {
    id: 'user_6',
    name: 'Chidi Nwosu',
    phone: '08055667788',
    location: 'Enugu',
    level: 'Bronze',
    points: 5000,
    isVerified: false,
    isVIP: false,
    vipPointsLocked: false,
    status: 'active',
    createdAt: '2026-04-01',
    lastLogin: '2026-08-19',
    isFounder: false,
    hasWithdrawn: false,
  },
  'user_7': {
    id: 'user_7',
    name: 'Folake Adeyemi',
    phone: '08133445566',
    location: 'Ibadan',
    level: 'Silver',
    points: 12000,
    isVerified: true,
    isVIP: false,
    vipPointsLocked: false,
    status: 'active',
    createdAt: '2026-04-15',
    lastLogin: '2026-08-21',
    isFounder: false,
    hasWithdrawn: false,
  },
  'user_8': {
    id: 'user_8',
    name: 'Emeka Obi',
    phone: '08066778899',
    location: 'Port Harcourt',
    level: 'Bronze',
    points: 2000,
    isVerified: false,
    isVIP: false,
    vipPointsLocked: false,
    status: 'active',
    createdAt: '2026-05-01',
    lastLogin: '2026-08-18',
    isFounder: false,
    hasWithdrawn: false,
  },
};

// Initialize mock users
for (const id in MOCK_USER_DB) {
  MOCK_USERS[id] = MOCK_USER_DB[id];
}

/**
 * Check if user is admin/founder
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if admin
 */
export const isAdmin = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  const user = MOCK_USERS[userId];
  if (!user) return false;
  
  return user.isFounder === true;
};

/**
 * Get all users (admin only)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} List of users
 */
export const getAllUsers = async (filters = {}) => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  
  let users = Object.values(MOCK_USERS);
  
  // Apply filters
  if (filters.level) {
    users = users.filter(u => u.level === filters.level);
  }
  if (filters.status) {
    users = users.filter(u => u.status === filters.status);
  }
  if (filters.isVerified !== undefined) {
    users = users.filter(u => u.isVerified === filters.isVerified);
  }
  if (filters.isFounder !== undefined) {
    users = users.filter(u => u.isFounder === filters.isFounder);
  }
  if (filters.location) {
    users = users.filter(u => 
      u.location?.toLowerCase().includes(filters.location.toLowerCase())
    );
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    users = users.filter(u => 
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.phone?.includes(search) ||
      u.location?.toLowerCase().includes(search)
    );
  }
  
  return users;
};

/**
 * Get user by ID (admin)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data
 */
export const getUser = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const user = MOCK_USERS[userId];
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
};

/**
 * Update user (admin only)
 * @param {string} userId - User ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, updates) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const user = MOCK_USERS[userId];
  if (!user) {
    throw new Error('User not found');
  }
  
  if (updates.isFounder !== undefined) {
    throw new Error('Cannot change founder status');
  }
  
  if (updates.level) {
    const validLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    if (!validLevels.includes(updates.level)) {
      throw new Error('Invalid level');
    }
  }
  
  if (updates.status) {
    const validStatus = ['active', 'suspended', 'deactivated'];
    if (!validStatus.includes(updates.status)) {
      throw new Error('Invalid status');
    }
  }
  
  MOCK_USERS[userId] = { ...user, ...updates, updatedAt: new Date().toISOString() };
  await logAction('UPDATE_USER', `Updated user ${userId}`, userId);
  
  return MOCK_USERS[userId];
};

/**
 * Suspend a user
 * @param {string} userId - User ID
 * @param {string} reason - Reason for suspension
 * @returns {Promise<Object>} Result
 */
export const suspendUser = async (userId, reason = '') => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  const user = MOCK_USERS[userId];
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.isFounder) {
    throw new Error('Cannot suspend founder');
  }
  
  MOCK_USERS[userId].status = 'suspended';
  MOCK_USERS[userId].suspensionReason = reason;
  MOCK_USERS[userId].suspendedAt = new Date().toISOString();
  
  await logAction('SUSPEND_USER', `Suspended user ${userId}: ${reason}`, userId);
  
  return { success: true, userId, reason };
};

/**
 * Reactivate a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result
 */
export const reactivateUser = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  const user = MOCK_USERS[userId];
  if (!user) {
    throw new Error('User not found');
  }
  
  MOCK_USERS[userId].status = 'active';
  MOCK_USERS[userId].suspensionReason = null;
  MOCK_USERS[userId].reactivatedAt = new Date().toISOString();
  
  await logAction('REACTIVATE_USER', `Reactivated user ${userId}`, userId);
  
  return { success: true, userId };
};

/**
 * Get platform analytics
 * @param {Object} dateRange - Optional date range
 * @returns {Promise<Object>} Analytics data
 */
export const getAnalytics = async (dateRange = null) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  const users = Object.values(MOCK_USERS);
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const verifiedUsers = users.filter(u => u.isVerified).length;
  const founderUsers = users.filter(u => u.isFounder).length;
  const vipUsers = users.filter(u => u.isVIP).length;
  
  const levelDistribution = {};
  for (const level of ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']) {
    levelDistribution[level] = users.filter(u => u.level === level).length;
  }
  
  const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
  const estimatedRevenue = totalPoints / 2;
  
  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    verifiedUsers,
    founderUsers,
    vipUsers,
    levelDistribution,
    totalPoints,
    estimatedRevenue,
    totalGifts: 45,
    totalEvents: 12,
    totalReferrals: 89,
    totalRedemptions: 234,
    conversionRate: (verifiedUsers / totalUsers * 100).toFixed(1),
    reportDate: new Date().toISOString(),
  };
};

/**
 * Get system logs
 * @param {number} limit - Number of logs to return
 * @returns {Promise<Array>} System logs
 */
export const getSystemLogs = async (limit = 50) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  
  const logs = MOCK_SYSTEM_LOGS.slice(0, limit);
  return logs;
};

/**
 * Log an action
 * @param {string} action - Action name
 * @param {string} details - Action details
 * @param {string} userId - User ID performing action
 * @returns {Promise<void>}
 */
export const logAction = async (action, details, userId = 'system') => {
  const log = {
    id: `log_${Date.now()}`,
    action,
    details,
    userId,
    timestamp: new Date().toISOString(),
  };
  
  MOCK_SYSTEM_LOGS.unshift(log);
  
  if (MOCK_SYSTEM_LOGS.length > 1000) {
    MOCK_SYSTEM_LOGS = MOCK_SYSTEM_LOGS.slice(0, 1000);
  }
  
  try {
    localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(MOCK_SYSTEM_LOGS));
  } catch (error) {
    console.warn('Failed to save system logs:', error);
  }
};

/**
 * Generate VIP code (admin only)
 * @param {string} level - VIP level
 * @param {string} recipientPhone - Optional recipient phone
 * @param {string} generatedBy - Admin user ID
 * @returns {Promise<Object>} VIP code data
 */
export const generateVIPCode = async (level, recipientPhone = null, generatedBy = null) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const validLevels = ['Silver', 'Gold', 'Platinum', 'Diamond'];
  if (!validLevels.includes(level)) {
    throw new Error('Invalid VIP level');
  }
  
  const prefix = level.toUpperCase().slice(0, 3);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `VIBRA-VIP-${prefix}-${random}`;
  
  const pointsMap = {
    Silver: 10000,
    Gold: 25000,
    Platinum: 50000,
    Diamond: 100000,
  };
  
  const vipData = {
    code,
    level,
    points: pointsMap[level],
    recipientPhone: recipientPhone || null,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString(),
    createdBy: generatedBy,
    isVIP: true,
    canCashOut: false,
  };
  
  await logAction('GENERATE_VIP_CODE', `Generated ${level} VIP code: ${code}`, generatedBy || 'admin');
  
  return vipData;
};

/**
 * Get platform settings
 * @returns {Promise<Object>} Platform settings
 */
export const getPlatformSettings = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const defaults = {
    maintenanceMode: false,
    registrationEnabled: true,
    giftCommission: 0.20,
    cashGiftFee: 0.05,
    pointsPerNaira: 2,
    referralBonus: 500,
    eventCommission: 0.20,
    maxLoginAttempts: 5,
    requireVerification: true,
  };
  
  return { ...defaults, ...MOCK_ADMIN_SETTINGS };
};

/**
 * Update platform settings
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
export const updatePlatformSettings = async (settings) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  MOCK_ADMIN_SETTINGS = { ...MOCK_ADMIN_SETTINGS, ...settings };
  
  try {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(MOCK_ADMIN_SETTINGS));
  } catch (error) {
    console.warn('Failed to save admin settings:', error);
  }
  
  await logAction('UPDATE_SETTINGS', 'Updated platform settings', 'admin');
  
  return MOCK_ADMIN_SETTINGS;
};

export default {
  isAdmin,
  getAllUsers,
  getUser,
  updateUser,
  suspendUser,
  reactivateUser,
  getAnalytics,
  getSystemLogs,
  logAction,
  generateVIPCode,
  getPlatformSettings,
  updatePlatformSettings,
};