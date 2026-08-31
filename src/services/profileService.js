/**
 * VIBRA - Profile Service (Production)
 * Module: User Profile
 * 
 * Handles all profile operations via API:
 * - Get profile data
 * - Update profile (name, bio, photos, interests)
 * - Photo upload
 * - Block/Unblock users
 * - Report users
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

/**
 * Get profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Profile data
 */
export const getProfile = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/get_profile.php?user_id=${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.profile;
    } else {
      throw new Error(data.message || 'Failed to load profile');
    }
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Update profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (userId, updates) => {
  try {
    const response = await fetch(`${API_URL}/update_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...updates })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.user;
    } else {
      throw new Error(data.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Upload profile photo
 * @param {string} userId - User ID
 * @param {File} file - Image file
 * @returns {Promise<Object>} Upload result with photo URL
 */
export const uploadPhoto = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('photo', file);
    
    const response = await fetch(`${API_URL}/upload_photo.php`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to upload photo');
    }
  } catch (error) {
    console.error('Upload photo error:', error);
    throw error;
  }
};

/**
 * Remove profile photo
 * @param {string} userId - User ID
 * @param {string} photoId - Photo ID to remove
 * @returns {Promise<Object>} Result
 */
export const removePhoto = async (userId, photoId) => {
  try {
    const response = await fetch(`${API_URL}/remove_photo.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, photo_id: photoId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to remove photo');
    }
  } catch (error) {
    console.error('Remove photo error:', error);
    throw error;
  }
};

/**
 * Update Vibra Score
 * @param {string} userId - User ID
 * @param {number} rating - Rating (1-5)
 * @returns {Promise<Object>} Updated profile
 */
export const updateVibraScore = async (userId, rating) => {
  try {
    const response = await fetch(`${API_URL}/update_score.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, rating })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.user;
    } else {
      throw new Error(data.message || 'Failed to update score');
    }
  } catch (error) {
    console.error('Update score error:', error);
    throw error;
  }
};

// ========== BLOCK / UNBLOCK ==========

/**
 * Block a user
 * @param {string} userId - User ID to block
 * @returns {Promise<Object>} Result
 */
export const blockUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/block_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to block user');
    }
  } catch (error) {
    console.error('Block user error:', error);
    throw error;
  }
};

/**
 * Unblock a user
 * @param {string} userId - User ID to unblock
 * @returns {Promise<Object>} Result
 */
export const unblockUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/unblock_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to unblock user');
    }
  } catch (error) {
    console.error('Unblock user error:', error);
    throw error;
  }
};

/**
 * Get list of blocked user IDs
 * @returns {Promise<Array>} List of blocked user IDs
 */
export const getBlockedUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/get_blocked.php`);
    const data = await response.json();
    
    if (data.success) {
      return data.blocked;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Get blocked users error:', error);
    return [];
  }
};

/**
 * Check if a user is blocked
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} True if blocked
 */
export const isUserBlocked = async (userId) => {
  const blocked = await getBlockedUsers();
  return blocked.includes(userId);
};

// ========== REPORT ==========

/**
 * Report a user
 * @param {string} userId - User ID to report
 * @param {string} reason - Reason for reporting
 * @returns {Promise<Object>} Result
 */
export const reportUser = async (userId, reason) => {
  try {
    const response = await fetch(`${API_URL}/report_user.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, reason })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to report user');
    }
  } catch (error) {
    console.error('Report user error:', error);
    throw error;
  }
};

/**
 * Get all reports (admin only)
 * @returns {Promise<Array>} List of reports
 */
export const getReports = async () => {
  try {
    const response = await fetch(`${API_URL}/get_reports.php`);
    const data = await response.json();
    
    if (data.success) {
      return data.reports;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Get reports error:', error);
    return [];
  }
};

export default {
  getProfile,
  updateProfile,
  uploadPhoto,
  removePhoto,
  updateVibraScore,
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
  reportUser,
  getReports,
};