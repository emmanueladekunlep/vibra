/**
 * VIBRA - Level Service
 * Module: Levels & Points Engine
 * 
 * Handles all level and points operations via API.
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

// Level configuration
export const LEVELS = {
  BRONZE: {
    id: 'Bronze',
    label: 'Bronze',
    emoji: '🥉',
    color: '#CD7F32',
    pointsRequired: 0,
    perks: { photos: 3, boostsPerWeek: 0, priorityInbox: false, freePremium: false, featuredProfile: false, vipEvents: false, maxPhotos: 3 },
  },
  SILVER: {
    id: 'Silver',
    label: 'Silver',
    emoji: '🥈',
    color: '#C0C0C0',
    pointsRequired: 10000,
    perks: { photos: 5, boostsPerWeek: 1, priorityInbox: false, freePremium: false, featuredProfile: false, vipEvents: false, maxPhotos: 5 },
  },
  GOLD: {
    id: 'Gold',
    label: 'Gold',
    emoji: '🥇',
    color: '#FFD700',
    pointsRequired: 25000,
    perks: { photos: 10, boostsPerWeek: 3, priorityInbox: true, freePremium: false, featuredProfile: false, vipEvents: false, maxPhotos: 10 },
  },
  PLATINUM: {
    id: 'Platinum',
    label: 'Platinum',
    emoji: '💎',
    color: '#E5E4E2',
    pointsRequired: 50000,
    perks: { photos: -1, boostsPerWeek: 5, priorityInbox: true, freePremium: true, featuredProfile: true, vipEvents: false, maxPhotos: -1 },
  },
  DIAMOND: {
    id: 'Diamond',
    label: 'Diamond',
    emoji: '💎',
    color: '#B9F2FF',
    pointsRequired: 100000,
    perks: { photos: -1, boostsPerWeek: 10, priorityInbox: true, freePremium: true, featuredProfile: true, vipEvents: true, maxPhotos: -1 },
  },
};

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

export const getLevelFromPoints = (points) => {
  if (points >= LEVELS.DIAMOND.pointsRequired) return LEVELS.DIAMOND;
  if (points >= LEVELS.PLATINUM.pointsRequired) return LEVELS.PLATINUM;
  if (points >= LEVELS.GOLD.pointsRequired) return LEVELS.GOLD;
  if (points >= LEVELS.SILVER.pointsRequired) return LEVELS.SILVER;
  return LEVELS.BRONZE;
};

export const getNextLevel = (points) => {
  const levels = Object.values(LEVELS);
  for (let i = 0; i < levels.length; i++) {
    if (points < levels[i].pointsRequired) {
      return levels[i];
    }
  }
  return null;
};

export const getLevelProgress = (points) => {
  const current = getLevelFromPoints(points);
  const next = getNextLevel(points);

  if (!next) {
    return { currentLevel: current, nextLevel: null, progress: 100, pointsNeeded: 0, pointsInLevel: 0, pointsToNext: 0, isMaxLevel: true };
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
 * Get points history from API (database)
 */
export const getPointsHistory = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/get_points_history.php?user_id=${userId}`);
    const data = await response.json();
    if (data.success) {
      return data.history || [];
    }
    return [];
  } catch (error) {
    console.error('Get points history error:', error);
    return [];
  }
};

/**
 * Add points via API
 */
export const addPoints = async (userId, points, source, description = '') => {
  try {
    const response = await fetch(`${API_URL}/add_points.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        points: points,
        source: source,
        description: description
      })
    });
    const data = await response.json();
    if (data.success) {
      return data.user;
    }
    throw new Error(data.message || 'Failed to add points');
  } catch (error) {
    console.error('Add points error:', error);
    throw error;
  }
};

export const deductPoints = async (userId, points, source, description = '') => {
  return addPoints(userId, -points, source, description);
};

export const nairaToPoints = (naira) => naira * 2;
export const pointsToNaira = (points) => Math.floor(points / 2);
export const getLevelPerks = (levelId) => {
  const level = Object.values(LEVELS).find(l => l.id === levelId);
  return level ? level.perks : LEVELS.BRONZE.perks;
};
export const getAllLevels = () => Object.values(LEVELS).sort((a, b) => a.pointsRequired - b.pointsRequired);
export const getMaxPhotos = (levelId) => getLevelPerks(levelId).maxPhotos || 3;
export const getBoostsPerWeek = (levelId) => getLevelPerks(levelId).boostsPerWeek || 0;

export default {
  LEVELS,
  POINT_SOURCES,
  getLevelFromPoints,
  getNextLevel,
  getLevelProgress,
  addPoints,
  deductPoints,
  getPointsHistory,
  nairaToPoints,
  pointsToNaira,
  getLevelPerks,
  getAllLevels,
  getMaxPhotos,
  getBoostsPerWeek,
};