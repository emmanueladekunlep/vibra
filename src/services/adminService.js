/**
 * VIBRA - Admin Service
 * Module: Admin Panel
 * 
 * Handles all admin operations via API.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

/**
 * Check if user is admin/founder
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if admin
 */
export const isAdmin = async (userId) => {
  if (!userId) return false;
  
  try {
    // Check real user from localStorage first
    const cachedUser = JSON.parse(localStorage.getItem('vibra_user') || '{}');
    if (cachedUser && cachedUser.isFounder === true) {
      return true;
    }
    
    // Fetch user from API
    const response = await fetch(`${API_URL}/get_user.php?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success && data.user) {
      return data.user.isFounder === true;
    }
    return false;
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (filters = {}) => {
  try {
    let url = `${API_URL}/admin_users.php`;
    const params = new URLSearchParams();
    if (filters.level) params.append('level', filters.level);
    if (filters.status) params.append('status', filters.status);
    if (filters.isVerified !== undefined && filters.isVerified !== '') {
      params.append('isVerified', filters.isVerified);
    }
    if (filters.search) params.append('search', filters.search);
    
    const query = params.toString();
    if (query) url += '?' + query;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.users || [];
    }
    return [];
  } catch (error) {
    console.error('Get all users error:', error);
    return [];
  }
};

/**
 * Get user by ID
 */
export const getUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/get_user.php?user_id=${userId}`);
    const data = await response.json();
    if (data.success) {
      return data.user;
    }
    throw new Error('User not found');
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

/**
 * Update user (admin only)
 */
export const updateUser = async (userId, updates) => {
  try {
    const response = await fetch(`${API_URL}/admin_update.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...updates })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.user;
    }
    throw new Error(data.message || 'Failed to update user');
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

/**
 * Suspend a user
 */
export const suspendUser = async (userId, reason = '') => {
  return updateUser(userId, { status: 'suspended' });
};

/**
 * Reactivate a user
 */
export const reactivateUser = async (userId) => {
  return updateUser(userId, { status: 'active' });
};

/**
 * Get platform analytics
 */
export const getAnalytics = async () => {
  try {
    // Get users from API
    const users = await getAllUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const suspendedUsers = users.filter(u => u.status === 'suspended').length;
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const founderUsers = users.filter(u => u.isFounder).length;
    
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
      vipUsers: users.filter(u => u.level === 'Diamond' || u.level === 'Platinum').length,
      levelDistribution,
      totalPoints,
      estimatedRevenue,
      totalGifts: 0,
      totalEvents: 0,
      totalReferrals: 0,
      totalRedemptions: 0,
      conversionRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : '0',
      reportDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      verifiedUsers: 0,
      founderUsers: 0,
      vipUsers: 0,
      levelDistribution: { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0, Diamond: 0 },
      totalPoints: 0,
      estimatedRevenue: 0,
      totalGifts: 0,
      totalEvents: 0,
      totalReferrals: 0,
      totalRedemptions: 0,
      conversionRate: '0',
      reportDate: new Date().toISOString(),
    };
  }
};

/**
 * Get system logs
 */
export const getSystemLogs = async (limit = 50) => {
  try {
    // Try to get logs from API
    const response = await fetch(`${API_URL}/get_logs.php?limit=${limit}`);
    const data = await response.json();
    if (data.success) {
      return data.logs || [];
    }
    return [];
  } catch (error) {
    console.error('Get logs error:', error);
    return [];
  }
};

/**
 * Log an action
 */
export const logAction = async (action, details, userId = 'system') => {
  try {
    await fetch(`${API_URL}/log_action.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, user_id: userId })
    });
  } catch (error) {
    console.error('Log action error:', error);
  }
};

/**
 * Generate VIP code (admin only)
 */
export const generateVIPCode = async (level, recipientPhone = null, generatedBy = null) => {
  try {
    const response = await fetch(`${API_URL}/generate_vip_code.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, recipient_phone: recipientPhone, created_by: generatedBy })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.code;
    }
    throw new Error(data.message || 'Failed to generate VIP code');
  } catch (error) {
    console.error('Generate VIP code error:', error);
    // Fallback: generate locally
    const prefix = level.toUpperCase().slice(0, 3);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `VIBRA-VIP-${prefix}-${random}`;
    return {
      code,
      level,
      points: { Silver: 10000, Gold: 25000, Platinum: 50000, Diamond: 100000 }[level] || 0,
      used: false,
      createdAt: new Date().toISOString(),
    };
  }
};

/**
 * Get platform settings
 */
export const getPlatformSettings = async () => {
  try {
    const response = await fetch(`${API_URL}/get_settings.php`);
    const data = await response.json();
    if (data.success) {
      return data.settings;
    }
    return getDefaultSettings();
  } catch (error) {
    return getDefaultSettings();
  }
};

const getDefaultSettings = () => ({
  maintenanceMode: false,
  registrationEnabled: true,
  giftCommission: 0.20,
  cashGiftFee: 0.05,
  pointsPerNaira: 2,
  referralBonus: 500,
  eventCommission: 0.20,
  maxLoginAttempts: 5,
  requireVerification: true,
});

/**
 * Update platform settings
 */
export const updatePlatformSettings = async (settings) => {
  try {
    const response = await fetch(`${API_URL}/update_settings.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await response.json();
    if (data.success) {
      return data.settings;
    }
    throw new Error(data.message || 'Failed to update settings');
  } catch (error) {
    console.error('Update settings error:', error);
    throw error;
  }
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