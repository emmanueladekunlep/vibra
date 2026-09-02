/**
 * VIBRA - Auth Service
 * Module: Authentication
 * 
 * This service handles all authentication operations including:
 * - Phone login (connects to PHP backend)
 * - PIN verification
 * - PIN setup
 * - User ID generation
 * - Local caching of user data
 * - Session management
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';
const STORAGE_KEY = 'vibra_user';
const SESSION_KEY = 'vibra_session';

let MOCK_USERS = [];

try {
  const saved = localStorage.getItem('vibra_mock_users');
  if (saved) MOCK_USERS = JSON.parse(saved);
} catch {}

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

export const getUserByUserId = (userId) => {
  return MOCK_USERS.find(u => u.userId === userId) || null;
};

export const loginWithOpay = async (phone, pin = null) => {
  try {
    const body = { 
      phone: phone, 
      name: `User ${phone.slice(-4)}`,
    };
    
    if (pin !== null && pin !== undefined && pin !== '') {
      body.pin = pin;
    }
    
    const response = await fetch(`${API_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (data.success) {
      cacheUserData(data.user);
      return { 
        success: true, 
        user: data.user,
        requiresPin: data.requiresPin || false,
        pinEnabled: data.user?.pinEnabled || false,
      };
    } else {
      // If PIN required, return special response
      if (data.message === 'PIN required') {
        return { 
          success: true, 
          requiresPin: true,
          user: null,
          error: 'PIN required'
        };
      }
      return { success: false, error: data.message || 'Login failed' };
    }
  } catch (error) {
    console.warn('API login failed, falling back to mock:', error);
    return fallbackLogin(phone);
  }
};

export const setPin = async (userId, pin) => {
  try {
    const response = await fetch(`${API_URL}/set_pin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, pin: pin })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update cached user
      const cached = getCachedUser();
      if (cached) {
        cached.pinEnabled = true;
        cacheUserData(cached);
      }
      return { success: true, message: data.message };
    } else {
      return { success: false, error: data.message || 'Failed to set PIN' };
    }
  } catch (error) {
    console.error('Set PIN error:', error);
    return { success: false, error: error.message };
  }
};

export const resetPin = async (phone, newPin) => {
  try {
    const response = await fetch(`${API_URL}/reset_pin.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, pin: newPin })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Reset PIN error:', error);
    return { success: false, message: error.message };
  }
};

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
      pinEnabled: false,
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
    requiresPin: false,
    pinEnabled: user.pinEnabled || false,
    token: `mock_token_${Date.now()}`,
  };
};

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

export const getCachedUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to read cached user:', error);
    return null;
  }
};

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

export const logout = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('Failed to logout:', error);
  }
};

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

export const checkOpayStatus = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return Math.random() < 0.9;
};

export default {
  loginWithOpay,
  setPin,
  resetPin,
  getCachedUser,
  isLoggedIn,
  logout,
  updateCachedUser,
  checkOpayStatus,
  generateUserId,
  getUserByUserId,
};