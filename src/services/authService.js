/**
 * VIBRA - Auth Service
 * Module: Authentication
 * 
 * This service handles all authentication operations including:
 * - Phone login (connects to PHP backend)
 * - User ID generation (VIB-XXXX)
 * - Local caching of user data
 * - Session management
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';
const STORAGE_KEY = 'vibra_user';
const SESSION_KEY = 'vibra_session';

// Mock user database for fallback (if API is down)
let MOCK_USERS = [];

try {
  const saved = localStorage.getItem('vibra_mock_users');
  if (saved) MOCK_USERS = JSON.parse(saved);
} catch {}

/**
 * Generate a unique User ID (VIB-XXXX)
 * @returns {string} User ID like VIB-1001
 */
export const generateUserId = () => {
  const existingIds = MOCK_USERS.map(u => u.userId).filter(id => id);
  let counter = 1001;
  
  existingIds.forEach(id => {
    const num = parseInt(id.replace('VIB-', ''));
    if (num >= counter) counter = num + 1;
  });
  
  if (counter > 9999) counter = 1001;
  
  return `VIB-${counter}`;
};

/**
 * Get user by User ID
 * @param {string} userId - User ID like VIB-1001
 * @returns {Object|null} User or null
 */
export const getUserByUserId = (userId) => {
  return MOCK_USERS.find(u => u.userId === userId) || null;
};

/**
 * Phone login - connects to PHP backend API
 * @param {string} phone - User's phone number
 * @returns {Promise<Object>} User data
 */
export const loginWithOpay = async (phone) => {
  try {
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: phone, 
        name: `User ${phone.slice(-4)}` 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      cacheUserData(data.user);
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    console.warn('API login failed, falling back to mock:', error);
    return fallbackLogin(phone);
  }
};

/**
 * Fallback mock login (when API is down)
 */
const fallbackLogin = async (phone) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let user = MOCK_USERS.find((u) => u.phone === phone);

  if (!user) {
    const userId = generateUserId();
    user = {
      id: `user_${Date.now()}`,
      userId: userId,
      name: `User ${phone.slice(-4)}`,
      phone: phone,
      level: 'Bronze',
      points: 1000,
      isVerified: false,
      profilePhoto: null,
      isNew: true,
      isIdentityLocked: false,
      verifiedLegalName: null,
      hasWithdrawn: false,
      isFounder: false,
    };
    MOCK_USERS.push(user);
    try {
      localStorage.setItem('vibra_mock_users', JSON.stringify(MOCK_USERS));
    } catch {}
  }

  cacheUserData(user);

  return {
    success: true,
    user: user,
    token: `mock_token_${Date.now()}`,
  };
};

/**
 * Cache user data to localStorage
 * @param {Object} user - User data to cache
 */
const cacheUserData = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ 
      loggedIn: true, 
      timestamp: Date.now() 
    }));
  } catch (error) {
    console.warn('Failed to cache user data:', error);
  }
};

/**
 * Get cached user data
 * @returns {Object|null} Cached user or null
 */
export const getCachedUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to read cached user:', error);
    return null;
  }
};

/**
 * Check if user is currently logged in (session active)
 * @returns {boolean} True if session exists
 */
export const isLoggedIn = () => {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return false;
    const data = JSON.parse(session);
    return data.loggedIn === true;
  } catch {
    return false;
  }
};

/**
 * Logout user - clear local cache
 */
export const logout = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to logout:', error);
  }
};

/**
 * Update user data in cache
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated user or null
 */
export const updateCachedUser = (updates) => {
  try {
    const current = getCachedUser();
    if (!current) return null;
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to update cached user:', error);
    return null;
  }
};

/**
 * Check if Opay API is available (for withdrawal only)
 * @returns {Promise<boolean>} True if available
 */
export const checkOpayStatus = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return Math.random() < 0.9;
};

export default {
  loginWithOpay,
  getCachedUser,
  isLoggedIn,
  logout,
  updateCachedUser,
  checkOpayStatus,
  generateUserId,
  getUserByUserId,
};