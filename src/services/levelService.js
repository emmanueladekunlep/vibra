/**
 * VIBRA - Level Service
 * Module: Levels & Points Engine
 * Author: Emmanuel Adekunle Peace
 * Website: www.emmanueladekunlepeace.com
 * 
 * Handles all level and points operations:
 * - Calculate level from points
 * - Get level requirements and perks
 * - Track points history
 * - Check level upgrades
 * - VIP level locking
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const POINTS_HISTORY_KEY = 'vibra_points_history';

// Level configuration
export const LEVELS = {
  BRONZE: {
    id: 'Bronze',
    label: 'Bronze',
    emoji: '🥉',
    color: '#CD7F32',
    pointsRequired: 0,
    perks: {
      photos: 3,
      boostsPerWeek: 0,
      priorityInbox: false,
      freePremium: false,
      featuredProfile: false,
      vipEvents: false,
      maxPhotos: 3,
    },
  },
  SILVER: {
    id: 'Silver',
    label: 'Silver',
    emoji: '🥈',
    color: '#C0C0C0',
    pointsRequired: 10000,
    perks: {
      photos: 5,
      boostsPerWeek: 1,
      priorityInbox: false,
      freePremium: false,
      featuredProfile: false,
      vipEvents: false,
      maxPhotos: 5,
    },
  },
  GOLD: {
    id: 'Gold',
    label: 'Gold',
    emoji: '🥇',
    color: '#FFD700',
    pointsRequired: 25000,
    perks: {
      photos: 10,
      boostsPerWeek: 3,
      priorityInbox: true,
      freePremium: false,
      featuredProfile: false,
      vipEvents: false,
      maxPhotos: 10,
    },
  },
  PLATINUM: {
    id: 'Platinum',
    label: 'Platinum',
    emoji: '💎',
    color: '#E5E4E2',
    pointsRequired: 50000,
    perks: {
      photos: -1, // unlimited
      boostsPerWeek: 5,
      priorityInbox: true,
      freePremium: true,
      featuredProfile: true,
      vipEvents: false,
      maxPhotos: -1,
    },
  },
  DIAMOND: {
    id: 'Diamond',
    label: 'Diamond',
    emoji: '💎',
    color: '#B9F2FF',
    pointsRequired: 100000,
    perks: {
      photos: -1, // unlimited
      boostsPerWeek: 10,
      priorityInbox: true,
      freePremium: true,
      featuredProfile: true,
      vipEvents: true,
      maxPhotos: -1,
    },
  },
};

// Point earning sources
export const POINT_SOURCES = {
  REFERRAL_GIVEN: 'referral_given',
  REFERRAL_RECEIVED: 'referral_received',
  DAILY_LOGIN: 'daily_login',
  GIFT_SENT: 'gift_sent',
  LEVEL_PURCHASE: 'level_purchase',
  VIP_BONUS: 'vip_bonus',
  EVENT_HOST: 'event_host',
  EVENT_ATTEND: 'event_attend',
  DATE_COMPLETED: 'date_completed',
  BOOST_USED: 'boost_used',
};

// Point values for actions
export const POINT_VALUES = {
  [POINT_SOURCES.REFERRAL_GIVEN]: 500,
  [POINT_SOURCES.REFERRAL_RECEIVED]: 200,
  [POINT_SOURCES.DAILY_LOGIN]: 50,
  [POINT_SOURCES.GIFT_SENT]: 1, // per naira sent
  [POINT_SOURCES.LEVEL_PURCHASE]: 0, // handled separately
  [POINT_SOURCES.VIP_BONUS]: 0, // handled separately
  [POINT_SOURCES.EVENT_HOST]: 1000,
  [POINT_SOURCES.EVENT_ATTEND]: 500,
  [POINT_SOURCES.DATE_COMPLETED]: 300,
  [POINT_SOURCES.BOOST_USED]: -100,
};

/**
 * Get level from points
 * @param {number} points - Total points
 * @returns {Object} Level object
 */
export const getLevelFromPoints = (points) => {
  if (points >= LEVELS.DIAMOND.pointsRequired) return LEVELS.DIAMOND;
  if (points >= LEVELS.PLATINUM.pointsRequired) return LEVELS.PLATINUM;
  if (points >= LEVELS.GOLD.pointsRequired) return LEVELS.GOLD;
  if (points >= LEVELS.SILVER.pointsRequired) return LEVELS.SILVER;
  return LEVELS.BRONZE;
};

/**
 * Get next level from current points
 * @param {number} points - Current points
 * @returns {Object|null} Next level or null if at max
 */
export const getNextLevel = (points) => {
  const levels = Object.values(LEVELS);
  for (let i = 0; i < levels.length; i++) {
    if (points < levels[i].pointsRequired) {
      return levels[i];
    }
  }
  return null;
};

/**
 * Get progress to next level (0-100)
 * @param {number} points - Current points
 * @returns {Object} Progress info
 */
export const getLevelProgress = (points) => {
  const current = getLevelFromPoints(points);
  const next = getNextLevel(points);

  if (!next) {
    return {
      currentLevel: current,
      nextLevel: null,
      progress: 100,
      pointsNeeded: 0,
      pointsInLevel: 0,
      pointsToNext: 0,
      isMaxLevel: true,
    };
  }

  const pointsInLevel = points - current.pointsRequired;
  const pointsToNext = next.pointsRequired - current.pointsRequired;
  const progress = Math.min(100, (pointsInLevel / pointsToNext) * 100);

  return {
    currentLevel: current,
    nextLevel: next,
    progress: Math.round(progress),
    pointsNeeded: next.pointsRequired,
    pointsInLevel: pointsInLevel,
    pointsToNext: next.pointsRequired - points,
    isMaxLevel: false,
  };
};

/**
 * Check if user can level up
 * @param {number} points - Current points
 * @param {string} currentLevel - Current level ID
 * @returns {boolean} True if can level up
 */
export const canLevelUp = (points, currentLevel) => {
  const newLevel = getLevelFromPoints(points);
  return newLevel.id !== currentLevel;
};

/**
 * Add points and record history
 * @param {string} userId - User ID
 * @param {number} points - Points to add
 * @param {string} source - Point source (from POINT_SOURCES)
 * @param {string} description - Optional description
 * @returns {Promise<Object>} Updated user data
 */
export const addPoints = async (userId, points, source, description = '') => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Get current user
  const user = await getUser(userId);
  const newPoints = (user.points || 0) + points;

  // Check if VIP (locked points)
  if (user.isVIP && user.vipPointsLocked) {
    throw new Error('VIP users cannot earn points');
  }

  // Update user
  const updated = await updateUser(userId, { points: newPoints });

  // Record history
  await addPointsHistory(userId, {
    points,
    source,
    description,
    newTotal: newPoints,
    timestamp: new Date().toISOString(),
  });

  // Check level upgrade
  const newLevel = getLevelFromPoints(newPoints);
  if (newLevel.id !== user.level) {
    await updateUser(userId, { level: newLevel.id });
    updated.level = newLevel.id;
  }

  return updated;
};

/**
 * Deduct points (for boosts, etc.)
 * @param {string} userId - User ID
 * @param {number} points - Points to deduct
 * @param {string} source - Point source
 * @param {string} description - Optional description
 * @returns {Promise<Object>} Updated user data
 */
export const deductPoints = async (userId, points, source, description = '') => {
  if (points <= 0) throw new Error('Points to deduct must be positive');

  const user = await getUser(userId);
  if (user.points < points) {
    throw new Error('Insufficient points');
  }

  return await addPoints(userId, -points, source, description);
};

/**
 * Add points history entry
 * @param {string} userId - User ID
 * @param {Object} entry - History entry
 */
export const addPointsHistory = async (userId, entry) => {
  const history = await getPointsHistory(userId);
  history.unshift(entry);
  savePointsHistory(userId, history);
};

/**
 * Get points history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Points history
 */
export const getPointsHistory = async (userId) => {
  try {
    const data = localStorage.getItem(`${POINTS_HISTORY_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save points history
 */
const savePointsHistory = (userId, history) => {
  try {
    localStorage.setItem(`${POINTS_HISTORY_KEY}_${userId}`, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save points history:', error);
  }
};

/**
 * Get user data (mock)
 */
async function getUser(userId) {
  return {
    id: userId,
    points: 1000,
    level: 'Bronze',
    isVIP: false,
    vipPointsLocked: false,
    name: 'User',
  };
}

/**
 * Update user data (mock)
 */
async function updateUser(userId, updates) {
  return { id: userId, ...updates };
}

/**
 * Calculate points from naira amount
 * @param {number} naira - Amount in naira
 * @returns {number} Points (₦1 = 2 points)
 */
export const nairaToPoints = (naira) => {
  return naira * 2;
};

/**
 * Calculate naira from points
 * @param {number} points - Points
 * @returns {number} Naira (2 points = ₦1)
 */
export const pointsToNaira = (points) => {
  return Math.floor(points / 2);
};

/**
 * Get level perks for a level ID
 * @param {string} levelId - Level ID
 * @returns {Object} Perks object
 */
export const getLevelPerks = (levelId) => {
  const level = Object.values(LEVELS).find(l => l.id === levelId);
  return level ? level.perks : LEVELS.BRONZE.perks;
};

/**
 * Get all levels sorted by requirement
 */
export const getAllLevels = () => {
  return Object.values(LEVELS).sort((a, b) => a.pointsRequired - b.pointsRequired);
};

/**
 * Check if user can access a feature based on level
 * @param {string} levelId - User's level ID
 * @param {string} feature - Feature name (e.g., 'photos', 'boostsPerWeek')
 * @param {number} currentValue - Current usage (for limits)
 * @returns {boolean} True if feature is accessible
 */
export const canAccessFeature = (levelId, feature, currentValue = 0) => {
  const perks = getLevelPerks(levelId);
  const limit = perks[feature];
  
  if (limit === -1) return true; // unlimited
  if (limit === undefined) return false; // feature not available
  if (typeof limit === 'boolean') return limit;
  if (typeof limit === 'number') return currentValue < limit;
  
  return false;
};

/**
 * Get max photos based on level
 * @param {string} levelId - Level ID
 * @returns {number} Max photos (-1 for unlimited)
 */
export const getMaxPhotos = (levelId) => {
  const perks = getLevelPerks(levelId);
  return perks.maxPhotos || 3;
};

/**
 * Get boosts per week based on level
 * @param {string} levelId - Level ID
 * @returns {number} Boosts per week
 */
export const getBoostsPerWeek = (levelId) => {
  const perks = getLevelPerks(levelId);
  return perks.boostsPerWeek || 0;
};

export default {
  LEVELS,
  POINT_SOURCES,
  POINT_VALUES,
  getLevelFromPoints,
  getNextLevel,
  getLevelProgress,
  canLevelUp,
  addPoints,
  deductPoints,
  getPointsHistory,
  nairaToPoints,
  pointsToNaira,
  getLevelPerks,
  getAllLevels,
  canAccessFeature,
  getMaxPhotos,
  getBoostsPerWeek,
};