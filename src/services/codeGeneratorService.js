/**
 * VIBRA - Code Generator Service
 * Module: 6-Digit Code Generator
 * Author: Emmanuel Adekunle Peace
 * Website: www.emmanueladekunlepeace.com
 * 
 * Handles all code generation operations:
 * - Generate unique 6-digit codes
 * - Validate codes
 * - Track code usage
 * - Check code status
 * - Generate codes for gifts, events, merchant redemptions
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const CODES_KEY = 'vibra_codes';

// Mock database
let MOCK_CODES = {};

// Load from localStorage
try {
  const saved = localStorage.getItem(CODES_KEY);
  if (saved) MOCK_CODES = JSON.parse(saved);
} catch {}

/**
 * Generate a unique 6-digit code
 * @param {string} type - Type of code ('gift', 'event', 'merchant', 'referral')
 * @param {string} entityId - Associated entity ID (giftId, eventId, etc.)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Code data
 */
export const generateCode = async (type = 'gift', entityId = null, metadata = {}) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Generate unique 6-digit code
  let code;
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (MOCK_CODES[code] && attempts < 10);

  if (MOCK_CODES[code]) {
    throw new Error('Failed to generate unique code');
  }

  const codeData = {
    code,
    type,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
    used: false,
    usedAt: null,
    usedBy: null,
    expiresAt: metadata.expiresAt || null,
    maxUses: metadata.maxUses || 1,
    uses: 0,
  };

  MOCK_CODES[code] = codeData;
  saveCodes();

  return codeData;
};

/**
 * Generate multiple codes at once
 * @param {number} count - Number of codes to generate
 * @param {string} type - Type of code
 * @param {string} entityId - Associated entity ID
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Array>} List of code data
 */
export const generateMultipleCodes = async (count, type = 'gift', entityId = null, metadata = {}) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = await generateCode(type, entityId, metadata);
    codes.push(code);
  }
  return codes;
};

/**
 * Validate a code
 * @param {string} code - 6-digit code
 * @returns {Promise<Object>} Validation result
 */
export const validateCode = async (code) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
    return {
      valid: false,
      error: 'Invalid code format. Must be 6 digits.',
    };
  }

  const codeData = MOCK_CODES[code];
  if (!codeData) {
    return {
      valid: false,
      error: 'Code not found',
    };
  }

  if (codeData.used && codeData.uses >= codeData.maxUses) {
    return {
      valid: false,
      error: 'Code has already been used',
    };
  }

  if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
    return {
      valid: false,
      error: 'Code has expired',
    };
  }

  return {
    valid: true,
    codeData,
  };
};

/**
 * Use a code (mark as used)
 * @param {string} code - 6-digit code
 * @param {string} usedBy - User ID or merchant ID
 * @returns {Promise<Object>} Updated code data
 */
export const useCode = async (code, usedBy) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const validation = await validateCode(code);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const codeData = validation.codeData;
  codeData.uses += 1;
  codeData.used = codeData.uses >= codeData.maxUses;
  codeData.usedAt = new Date().toISOString();
  codeData.usedBy = usedBy;

  MOCK_CODES[code] = codeData;
  saveCodes();

  return codeData;
};

/**
 * Get code data by code
 * @param {string} code - 6-digit code
 * @returns {Object|null} Code data
 */
export const getCode = (code) => {
  return MOCK_CODES[code] || null;
};

/**
 * Get all codes for an entity
 * @param {string} entityId - Entity ID (giftId, eventId, etc.)
 * @param {string} type - Optional type filter
 * @returns {Array} List of codes
 */
export const getCodesByEntity = (entityId, type = null) => {
  const codes = [];
  for (const code in MOCK_CODES) {
    const data = MOCK_CODES[code];
    if (data.entityId === entityId) {
      if (type && data.type !== type) continue;
      codes.push(data);
    }
  }
  return codes;
};

/**
 * Get all codes by type
 * @param {string} type - Code type
 * @returns {Array} List of codes
 */
export const getCodesByType = (type) => {
  const codes = [];
  for (const code in MOCK_CODES) {
    const data = MOCK_CODES[code];
    if (data.type === type) {
      codes.push(data);
    }
  }
  return codes;
};

/**
 * Check if code is valid for a specific type
 * @param {string} code - 6-digit code
 * @param {string} type - Expected code type
 * @returns {Promise<boolean>} True if valid
 */
export const isValidCodeForType = async (code, type) => {
  const validation = await validateCode(code);
  if (!validation.valid) return false;
  return validation.codeData.type === type;
};

/**
 * Revoke a code (mark as invalid)
 * @param {string} code - 6-digit code
 * @returns {Promise<Object>} Result
 */
export const revokeCode = async (code) => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const codeData = MOCK_CODES[code];
  if (!codeData) {
    throw new Error('Code not found');
  }

  codeData.used = true;
  codeData.revoked = true;
  codeData.revokedAt = new Date().toISOString();

  MOCK_CODES[code] = codeData;
  saveCodes();

  return { success: true };
};

/**
 * Get code stats
 * @param {string} type - Optional type filter
 * @returns {Object} Stats
 */
export const getCodeStats = (type = null) => {
  let codes = Object.values(MOCK_CODES);
  if (type) {
    codes = codes.filter(c => c.type === type);
  }

  const total = codes.length;
  const used = codes.filter(c => c.used).length;
  const active = codes.filter(c => !c.used && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length;
  const expired = codes.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;

  return {
    total,
    used,
    active,
    expired,
  };
};

/**
 * Save codes to localStorage
 */
const saveCodes = () => {
  try {
    localStorage.setItem(CODES_KEY, JSON.stringify(MOCK_CODES));
  } catch (error) {
    console.warn('Failed to save codes:', error);
  }
};

/**
 * Clear all codes (admin)
 * @returns {Promise<Object>} Result
 */
export const clearAllCodes = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  MOCK_CODES = {};
  saveCodes();
  return { success: true };
};

/**
 * Format code for display (adds spaces)
 * @param {string} code - 6-digit code
 * @returns {string} Formatted code
 */
export const formatCode = (code) => {
  if (!code) return '';
  const clean = code.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`;
};

/**
 * Check if code is expired
 * @param {Object} codeData - Code data
 * @returns {boolean} True if expired
 */
export const isCodeExpired = (codeData) => {
  if (!codeData.expiresAt) return false;
  return new Date(codeData.expiresAt) < new Date();
};

export default {
  generateCode,
  generateMultipleCodes,
  validateCode,
  useCode,
  getCode,
  getCodesByEntity,
  getCodesByType,
  isValidCodeForType,
  revokeCode,
  getCodeStats,
  clearAllCodes,
  formatCode,
  isCodeExpired,
};