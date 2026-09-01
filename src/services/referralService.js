/**
 * VIBRA - Referral Service
 * Module: Referral System
 * 
 * Handles all referral operations:
 * - Generate standard referral codes
 * - Generate VIP codes (admin only)
 * - Validate and redeem codes
 * - Track referrals and points
 * - VIP code locking (no cash out)
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

// Point values - EXPORTED for use in components
export const POINTS = {
  STANDARD_REFERRER: 500,
  STANDARD_NEW_USER: 200,
  VIP_SILVER: 10000,
  VIP_GOLD: 25000,
  VIP_PLATINUM: 50000,
  VIP_DIAMOND: 100000,
};

/**
 * Generate a standard referral code for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Referral code data
 */
export const generateReferralCode = async (userId) => {
  // Get user from API to get referral_code
  try {
    const response = await fetch(`${API_URL}/get_user.php?user_id=${userId}`);
    const data = await response.json();
    if (data.success && data.user.referralCode) {
      return {
        code: data.user.referralCode,
        userId: userId,
        createdAt: new Date().toISOString(),
        totalReferrals: data.user.totalReferrals || 0,
        totalPoints: 0,
        redeemedBy: [],
      };
    }
  } catch (error) {
    console.error('Failed to get referral code:', error);
  }
  
  // Fallback: generate mock code
  return {
    code: String(Math.floor(100000 + Math.random() * 900000)),
    userId: userId,
    createdAt: new Date().toISOString(),
    totalReferrals: 0,
    totalPoints: 0,
    redeemedBy: [],
  };
};

/**
 * Get a user's referral code
 * @param {string} userId - User ID
 * @returns {Object|null} Referral code data
 */
export const getReferralCode = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/get_user.php?user_id=${userId}`);
    const data = await response.json();
    if (data.success && data.user.referralCode) {
      return {
        code: data.user.referralCode,
        userId: userId,
        createdAt: new Date().toISOString(),
        totalReferrals: data.user.totalReferrals || 0,
        totalPoints: 0,
        redeemedBy: [],
      };
    }
  } catch (error) {
    console.error('Failed to get referral code:', error);
  }
  return null;
};

/**
 * Redeem a referral code
 * @param {string} code - Referral code (6 digits)
 * @param {string} newUserId - New user's ID
 * @returns {Promise<Object>} Redemption result
 */
export const redeemReferralCode = async (code, newUserId) => {
  try {
    const response = await fetch(`${API_URL}/redeem_referral.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), user_id: newUserId }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        type: 'standard',
        referrerId: data.referrer_id,
        pointsEarned: data.points_earned,
        message: data.message,
      };
    } else {
      throw new Error(data.message || 'Failed to redeem code');
    }
  } catch (error) {
    console.error('Redeem referral error:', error);
    throw new Error(error.message || 'Invalid referral code');
  }
};

/**
 * Generate a VIP code (Admin only)
 * @param {string} level - VIP level (Silver, Gold, Platinum, Diamond)
 * @param {string} recipientPhone - Optional recipient phone
 * @returns {Promise<Object>} VIP code data
 */
export const generateVIPCode = async (level, recipientPhone = null) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const levels = ['Silver', 'Gold', 'Platinum', 'Diamond'];
  if (!levels.includes(level)) {
    throw new Error('Invalid VIP level. Must be Silver, Gold, Platinum, or Diamond');
  }

  const prefix = level.toUpperCase().slice(0, 3);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `VIBRA-VIP-${prefix}-${random}`;

  const vipData = {
    code,
    level,
    points: getVIPPoints(level),
    recipientPhone,
    used: false,
    usedBy: null,
    usedAt: null,
    createdAt: new Date().toISOString(),
    isVIP: true,
    canCashOut: false,
  };

  // Save to localStorage for now
  const all = getVIPCodes();
  all[code] = vipData;
  localStorage.setItem('vibra_vip_codes', JSON.stringify(all));

  return vipData;
};

/**
 * Redeem a VIP code
 * @param {string} code - VIP code
 * @param {string} newUserId - New user's ID
 * @returns {Promise<Object|null>} Redemption result or null if not VIP
 */
export const redeemVIPCode = async (code, newUserId) => {
  const vipData = getVIPCode(code);
  if (!vipData) return null;

  if (vipData.used) {
    throw new Error('This VIP code has already been used');
  }

  vipData.used = true;
  vipData.usedBy = newUserId;
  vipData.usedAt = new Date().toISOString();
  
  const all = getVIPCodes();
  all[code] = vipData;
  localStorage.setItem('vibra_vip_codes', JSON.stringify(all));

  return {
    success: true,
    type: 'vip',
    level: vipData.level,
    pointsEarned: vipData.points,
    canCashOut: false,
    message: `You are now a ${vipData.level} member!`,
  };
};

/**
 * Get VIP points for level
 */
const getVIPPoints = (level) => {
  const map = {
    Silver: POINTS.VIP_SILVER,
    Gold: POINTS.VIP_GOLD,
    Platinum: POINTS.VIP_PLATINUM,
    Diamond: POINTS.VIP_DIAMOND,
  };
  return map[level] || 0;
};

// ========== VIP CODE HELPERS ==========

export const getVIPCode = (code) => {
  try {
    const all = getVIPCodes();
    return all[code] || null;
  } catch {
    return null;
  }
};

export const getVIPCodes = () => {
  try {
    const data = localStorage.getItem('vibra_vip_codes');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const getAllVIPCodes = () => {
  return getVIPCodes();
};

// ========== UTILITY FUNCTIONS ==========

export const getShareText = (code, userName) => {
  return `Join VIBRA - Nigerian, Verified, Real Dates!

Use my referral code: ${code}

Download now: https://vibra.ng/download

#VIBRA #RealDates #Nigeria`;
};

export const isValidReferralCode = (code) => {
  if (!code) return false;
  const clean = code.replace(/\s/g, '');
  return /^\d{6}$/.test(clean);
};

export default {
  generateReferralCode,
  getReferralCode,
  redeemReferralCode,
  generateVIPCode,
  redeemVIPCode,
  getVIPCode,
  getAllVIPCodes,
  getShareText,
  isValidReferralCode,
  POINTS,
};