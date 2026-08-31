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

  // Check if user already has a code
  const existing = getReferralCode(userId);
  if (existing) {
    return existing;
  }

  // Generate unique code: VIB + user ID suffix + random
  const suffix = userId.slice(-4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `VIB-${suffix}-${random}`;

  const referralData = {
    code,
    userId,
    createdAt: new Date().toISOString(),
    totalReferrals: 0,
    totalPoints: 0,
    redeemedBy: [],
  };

  // Save to mock
  MOCK_REFERRALS[userId] = referralData;
  saveReferralData(userId, referralData);

  return referralData;
};

/**
 * Get a user's referral code
 * @param {string} userId - User ID
 * @returns {Object|null} Referral code data
 */
export const getReferralCode = (userId) => {
  try {
    const data = localStorage.getItem(`${REFERRAL_KEY}_${userId}`);
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

  // Check if it's a VIP code
  const vipResult = await redeemVIPCode(code, newUserId);
  if (vipResult) {
    return vipResult;
  }

  // Standard code redemption
  const referrerId = findReferrerByCode(code);
  if (!referrerId) {
    throw new Error('Invalid referral code');
  }

  // Check if code was already used by this user
  const referralData = getReferralCode(referrerId);
  if (referralData.redeemedBy.includes(newUserId)) {
    throw new Error('You have already used this referral code');
  }

  // Update referrer
  referralData.totalReferrals += 1;
  referralData.totalPoints += POINTS.STANDARD_REFERRER;
  referralData.redeemedBy.push(newUserId);
  saveReferralData(referrerId, referralData);

  // Update referrer's profile points
  const referrerProfile = await getProfile(referrerId);
  await updateProfile(referrerId, {
    points: (referrerProfile.points || 0) + POINTS.STANDARD_REFERRER,
  });

  // Update new user's points
  const newUserProfile = await getProfile(newUserId);
  await updateProfile(newUserId, {
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

  // Generate unique code
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
    canCashOut: false, // VIP points are locked
  };

  // Save to mock
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
  const vipData = getVIPCode(code);
  if (!vipData) return null;

  if (vipData.used) {
    throw new Error('This VIP code has already been used');
  }

  // Mark as used
  vipData.used = true;
  vipData.usedBy = newUserId;
  vipData.usedAt = new Date().toISOString();
  saveVIPCode(code, vipData);

  // Update user's profile with VIP level and points (locked)
  const userProfile = await getProfile(newUserId);
  await updateProfile(newUserId, {
    level: vipData.level,
    points: vipData.points,
    isVIP: true,
    canCashOut: false, // VIP points cannot be cashed out
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
  // Check localStorage
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
  try {
    localStorage.setItem(`${REFERRAL_KEY}_${userId}`, JSON.stringify(data));
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

/**
 * Get referral stats for a user
 */
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

/**
 * Share referral code (generates share text)
 */
export const getShareText = (code, userName) => {
  return `Join VIBRA - Nigerian, Verified, Real Dates!

Use my referral code: ${code}

Download now: https://vibra.ng/download

#VIBRA #RealDates #Nigeria`;
};

/**
 * Validate referral code format
 */
export const isValidReferralCode = (code) => {
  if (!code) return false;
  // Standard: VIB-XXXX-XXXX
  // VIP: VIBRA-VIP-XXX-XXXXXX
  const standardRegex = /^VIB-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  const vipRegex = /^VIBRA-VIP-[A-Z]{3}-[A-Z0-9]{6}$/;
  return standardRegex.test(code) || vipRegex.test(code);
};

// Mock getProfile and updateProfile (from profileService)
// These will be replaced with actual imports when integrated
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