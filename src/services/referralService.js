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
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const REFERRAL_KEY = 'vibra_referrals';
const VIP_CODES_KEY = 'vibra_vip_codes';

// Mock database
const MOCK_REFERRALS = {};
const MOCK_VIP_CODES = {};

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
  await new Promise((resolve) => setTimeout(resolve, 300));

  const userIdStr = String(userId);

  const existing = getReferralCode(userIdStr);
  if (existing) {
    return existing;
  }

  // Generate 6-digit numeric code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  const referralData = {
    code,
    userId: userIdStr,
    createdAt: new Date().toISOString(),
    totalReferrals: 0,
    totalPoints: 0,
    redeemedBy: [],
  };

  MOCK_REFERRALS[userIdStr] = referralData;
  saveReferralData(userIdStr, referralData);

  return referralData;
};

/**
 * Get a user's referral code
 * @param {string} userId - User ID
 * @returns {Object|null} Referral code data
 */
export const getReferralCode = (userId) => {
  const userIdStr = String(userId);
  try {
    const data = localStorage.getItem(`${REFERRAL_KEY}_${userIdStr}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Redeem a referral code
 * @param {string} code - Referral code to redeem
 * @param {string} newUserId - New user's ID
 * @returns {Promise<Object>} Redemption result
 */
export const redeemReferralCode = async (code, newUserId) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const newUserIdStr = String(newUserId);
  const cleanCode = code.replace(/\s/g, '');

  // Check if it's a VIP code
  const vipResult = await redeemVIPCode(cleanCode, newUserIdStr);
  if (vipResult) {
    return vipResult;
  }

  // Standard code redemption
  const referrerId = findReferrerByCode(cleanCode);
  if (!referrerId) {
    throw new Error('Invalid referral code');
  }

  const referralData = getReferralCode(referrerId);
  if (!referralData) {
    throw new Error('Invalid referral code');
  }

  if (referralData.redeemedBy.includes(newUserIdStr)) {
    throw new Error('You have already used this referral code');
  }

  referralData.totalReferrals += 1;
  referralData.totalPoints += POINTS.STANDARD_REFERRER;
  referralData.redeemedBy.push(newUserIdStr);
  saveReferralData(referrerId, referralData);

  const referrerProfile = await getProfile(referrerId);
  await updateProfile(referrerId, {
    points: (referrerProfile.points || 0) + POINTS.STANDARD_REFERRER,
  });

  const newUserProfile = await getProfile(newUserIdStr);
  await updateProfile(newUserIdStr, {
    points: (newUserProfile.points || 0) + POINTS.STANDARD_NEW_USER,
  });

  return {
    success: true,
    type: 'standard',
    referrerId,
    pointsEarned: POINTS.STANDARD_NEW_USER,
    message: `You earned ${POINTS.STANDARD_NEW_USER} points!`,
  };
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

  MOCK_VIP_CODES[code] = vipData;
  saveVIPCode(code, vipData);

  return vipData;
};

/**
 * Redeem a VIP code
 * @param {string} code - VIP code
 * @param {string} newUserId - New user's ID
 * @returns {Promise<Object|null>} Redemption result or null if not VIP
 */
export const redeemVIPCode = async (code, newUserId) => {
  const newUserIdStr = String(newUserId);
  const cleanCode = code.replace(/\s/g, '');
  const vipData = getVIPCode(cleanCode);
  if (!vipData) return null;

  if (vipData.used) {
    throw new Error('This VIP code has already been used');
  }

  vipData.used = true;
  vipData.usedBy = newUserIdStr;
  vipData.usedAt = new Date().toISOString();
  saveVIPCode(cleanCode, vipData);

  const userProfile = await getProfile(newUserIdStr);
  await updateProfile(newUserIdStr, {
    level: vipData.level,
    points: vipData.points,
    isVIP: true,
    canCashOut: false,
    vipLevel: vipData.level,
    vipPointsLocked: true,
  });

  return {
    success: true,
    type: 'vip',
    level: vipData.level,
    pointsEarned: vipData.points,
    canCashOut: false,
    message: ` You are now a ${vipData.level} member!`,
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

/**
 * Find referrer by code
 */
const findReferrerByCode = (code) => {
  for (const userId in MOCK_REFERRALS) {
    if (MOCK_REFERRALS[userId].code === code) {
      return userId;
    }
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(REFERRAL_KEY)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.code === code) {
          return data.userId;
        }
      } catch {}
    }
  }
  return null;
};

// ========== CACHE HELPERS ==========

const saveReferralData = (userId, data) => {
  const userIdStr = String(userId);
  try {
    localStorage.setItem(`${REFERRAL_KEY}_${userIdStr}`, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save referral data:', error);
  }
};

const saveVIPCode = (code, data) => {
  try {
    const all = getVIPCodes();
    all[code] = data;
    localStorage.setItem(VIP_CODES_KEY, JSON.stringify(all));
  } catch (error) {
    console.warn('Failed to save VIP code:', error);
  }
};

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
    const data = localStorage.getItem(VIP_CODES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

export const getAllVIPCodes = () => {
  return getVIPCodes();
};

// ========== UTILITY FUNCTIONS ==========

export const getReferralStats = async (userId) => {
  const data = getReferralCode(userId);
  if (!data) {
    return {
      code: null,
      totalReferrals: 0,
      totalPoints: 0,
    };
  }
  return {
    code: data.code,
    totalReferrals: data.totalReferrals || 0,
    totalPoints: data.totalPoints || 0,
  };
};

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

// Mock getProfile and updateProfile
async function getProfile(userId) {
  return {
    id: userId,
    name: 'User',
    points: 1000,
    level: 'Bronze',
  };
}

async function updateProfile(userId, updates) {
  return { id: userId, ...updates };
}

export default {
  generateReferralCode,
  getReferralCode,
  redeemReferralCode,
  generateVIPCode,
  redeemVIPCode,
  getVIPCode,
  getAllVIPCodes,
  getReferralStats,
  getShareText,
  isValidReferralCode,
  POINTS,
};