/**
 * VIBRA - Profile Service
 * Module: User Profile
 * 
 * Handles all profile operations:
 * - Get profile data
 * - Update profile (name, bio, photos, interests)
 * - Photo upload (compressed locally)
 * - Points and level management
 * - Block/Unblock users
 * - Report users
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const PROFILE_KEY = 'vibra_profile';
const PHOTOS_KEY = 'vibra_photos';
const BLOCKED_KEY = 'vibra_blocked';
const REPORTS_KEY = 'vibra_reports';

// Mock profile data
const MOCK_PROFILES = {
  'user_1': {
    id: 'user_1',
    name: 'Peace Emmanuel',
    bio: 'Building VIBRA. Let\'s connect!',
    age: 25,
    gender: 'Male',
    location: 'Yaba, Lagos',
    interests: ['Tech', 'Music', 'Food'],
    photos: [],
    vibraScore: 4.5,
    level: 'Bronze',
    points: 1000,
    isVerified: true,
    phone: '08012345678',
    createdAt: '2026-01-01',
  },
  'user_2': {
    id: 'user_2',
    name: 'Test User',
    bio: 'Here for real dates.',
    age: 23,
    gender: 'Female',
    location: 'Surulere, Lagos',
    interests: ['Movies', 'Travel', 'Fashion'],
    photos: [],
    vibraScore: 4.2,
    level: 'Bronze',
    points: 500,
    isVerified: true,
    phone: '08087654321',
    createdAt: '2026-01-15',
  },
};

/**
 * Get profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Profile data
 */
export const getProfile = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const cached = getCachedProfile(userId);
  if (cached) return cached;

  const profile = MOCK_PROFILES[userId] || {
    id: userId,
    name: 'New User',
    bio: 'Tell us about yourself!',
    age: null,
    gender: null,
    location: null,
    interests: [],
    photos: [],
    vibraScore: 3.5,
    level: 'Bronze',
    points: 1000,
    isVerified: false,
    phone: null,
    createdAt: new Date().toISOString(),
  };

  cacheProfile(profile);
  return profile;
};

/**
 * Update profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (userId, updates) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const current = await getProfile(userId);
  const updated = { ...current, ...updates };

  MOCK_PROFILES[userId] = updated;
  cacheProfile(updated);

  return updated;
};

/**
 * Upload profile photo (with compression)
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<Object>} Upload result with photo URL
 */
export const uploadPhoto = async (userId, file) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const photoId = `photo_${Date.now()}`;
  const photoUrl = `https://vibra.storage/mock/${userId}/${photoId}.jpg`;

  const current = await getProfile(userId);
  const photos = current.photos || [];
  
  const maxPhotos = current.level === 'Bronze' ? 5 : 10;
  if (photos.length >= maxPhotos) {
    throw new Error(`Max ${maxPhotos} photos allowed for ${current.level} level`);
  }

  const updatedPhotos = [...photos, { id: photoId, url: photoUrl, uploadedAt: new Date().toISOString() }];
  
  await updateProfile(userId, { photos: updatedPhotos });

  return {
    success: true,
    photo: { id: photoId, url: photoUrl },
    totalPhotos: updatedPhotos.length,
  };
};

/**
 * Remove profile photo
 * @param {string} userId - User ID
 * @param {string} photoId - Photo ID to remove
 * @returns {Promise<Object>} Updated photos list
 */
export const removePhoto = async (userId, photoId) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const current = await getProfile(userId);
  const photos = current.photos || [];
  const updatedPhotos = photos.filter((p) => p.id !== photoId);

  await updateProfile(userId, { photos: updatedPhotos });
  return { success: true, photos: updatedPhotos };
};

/**
 * Update Vibra Score (after date)
 * @param {string} userId - User ID
 * @param {number} rating - Rating (1-5)
 * @returns {Promise<Object>} Updated profile
 */
export const updateVibraScore = async (userId, rating) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const current = await getProfile(userId);
  const currentScore = current.vibraScore || 3.5;
  
  const newScore = (currentScore * 0.8) + (rating * 0.2);
  const rounded = Math.round(newScore * 10) / 10;

  const updated = await updateProfile(userId, { vibraScore: rounded });
  return updated;
};

// ========== BLOCK / UNBLOCK ==========

/**
 * Block a user
 * @param {string} userId - User ID to block
 * @returns {Promise<Object>} Result
 */
export const blockUser = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  let blocked = getBlockedUsers();
  if (!blocked.includes(userId)) {
    blocked.push(userId);
    saveBlockedUsers(blocked);
  }
  
  return { success: true, blocked: true };
};

/**
 * Unblock a user
 * @param {string} userId - User ID to unblock
 * @returns {Promise<Object>} Result
 */
export const unblockUser = async (userId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  let blocked = getBlockedUsers();
  blocked = blocked.filter(id => id !== userId);
  saveBlockedUsers(blocked);
  
  return { success: true, blocked: false };
};

/**
 * Get list of blocked user IDs
 * @returns {Array} List of blocked user IDs
 */
export const getBlockedUsers = () => {
  try {
    const data = localStorage.getItem(BLOCKED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Check if a user is blocked
 * @param {string} userId - User ID to check
 * @returns {boolean} True if blocked
 */
export const isUserBlocked = (userId) => {
  const blocked = getBlockedUsers();
  return blocked.includes(userId);
};

/**
 * Save blocked users to localStorage
 * @param {Array} blocked - List of blocked user IDs
 */
const saveBlockedUsers = (blocked) => {
  try {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(blocked));
  } catch (error) {
    console.warn('Failed to save blocked users:', error);
  }
};

// ========== REPORT ==========

/**
 * Report a user
 * @param {string} userId - User ID to report
 * @param {string} reason - Reason for reporting
 * @returns {Promise<Object>} Result
 */
export const reportUser = async (userId, reason) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const report = {
    id: `report_${Date.now()}`,
    userId: userId,
    reason: reason,
    reportedBy: 'current_user', // Will be replaced with actual user ID
    timestamp: new Date().toISOString(),
    status: 'pending',
  };
  
  let reports = getReports();
  reports.unshift(report);
  saveReports(reports);
  
  // Log report (for admin)
  console.log('User reported:', report);
  
  return { success: true, report };
};

/**
 * Get all reports (admin only)
 * @returns {Array} List of reports
 */
export const getReports = () => {
  try {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save reports to localStorage
 * @param {Array} reports - List of reports
 */
const saveReports = (reports) => {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch (error) {
    console.warn('Failed to save reports:', error);
  }
};

// ========== CACHE HELPERS ==========

const cacheProfile = (profile) => {
  try {
    localStorage.setItem(`${PROFILE_KEY}_${profile.id}`, JSON.stringify(profile));
  } catch (error) {
    console.warn('Failed to cache profile:', error);
  }
};

export const getCachedProfile = (userId) => {
  try {
    const data = localStorage.getItem(`${PROFILE_KEY}_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearProfileCache = (userId) => {
  try {
    localStorage.removeItem(`${PROFILE_KEY}_${userId}`);
  } catch (error) {
    console.warn('Failed to clear profile cache:', error);
  }
};

export const compressPhoto = async (file) => {
  return file;
};

export default {
  getProfile,
  updateProfile,
  uploadPhoto,
  removePhoto,
  updateVibraScore,
  getCachedProfile,
  clearProfileCache,
  compressPhoto,
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
  reportUser,
  getReports,
};