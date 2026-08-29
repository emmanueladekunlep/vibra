/**
 * VIBRA - Merchant Service
 * Module: Merchant Portal
 * Author: Emmanuel Adekunle Peace
 * Website: www.emmanueladekunlepeace.com
 * 
 * Handles all merchant operations:
 * - Register merchant with BVN
 * - Verify BVN against Opay
 * - Process redemptions
 * - Track merchant payouts
 * - Manage merchant status
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const MERCHANTS_KEY = 'vibra_merchants';
const REDEMPTIONS_KEY = 'vibra_merchant_redemptions';

// Mock merchant database
let MOCK_MERCHANTS = {};
let MOCK_REDEMPTIONS = {};

// Load from localStorage
try {
  const saved = localStorage.getItem(MERCHANTS_KEY);
  if (saved) MOCK_MERCHANTS = JSON.parse(saved);
} catch {}

try {
  const saved = localStorage.getItem(REDEMPTIONS_KEY);
  if (saved) MOCK_REDEMPTIONS = JSON.parse(saved);
} catch {}

// Mock BVN verification (in production, call Opay API)
const MOCK_BVN_DB = {
  '12345678901': { name: 'Peace Emmanuel', bvnStatus: 'verified' },
  '10987654321': { name: 'Test Merchant', bvnStatus: 'verified' },
};

/**
 * Register a merchant
 * @param {string} name - Business name
 * @param {string} phone - Phone number
 * @param {string} location - Business location
 * @param {string} category - Business category
 * @param {string} bvn - BVN number
 * @param {string} userId - User ID (owner)
 * @returns {Promise<Object>} Merchant data
 */
export const registerMerchant = async (name, phone, location, category, bvn, userId) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Validate BVN
  const bvnValidation = await validateBVN(bvn, name);
  if (!bvnValidation.valid) {
    throw new Error(bvnValidation.message);
  }

  // Check if merchant already exists for this user
  const existing = getMerchantByUserId(userId);
  if (existing) {
    throw new Error('You are already registered as a merchant');
  }

  // Generate merchant ID
  const merchantId = `merchant_${Date.now()}`;

  const merchant = {
    id: merchantId,
    name,
    phone,
    location,
    category,
    bvn,
    userId,
    status: 'active', // active, suspended, pending
    verificationStatus: 'verified', // verified, pending, failed
    isVerified: true,
    totalRedemptions: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTrusted: false,
    trustLevel: 'new', // new, trusted, partner
  };

  MOCK_MERCHANTS[merchantId] = merchant;
  saveMerchants();

  return merchant;
};

/**
 * Validate BVN against Opay
 * @param {string} bvn - BVN number
 * @param {string} name - Business name
 * @returns {Promise<Object>} Validation result
 */
export const validateBVN = async (bvn, name) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Format validation
  if (!bvn || bvn.length !== 11 || !/^\d{11}$/.test(bvn)) {
    return { valid: false, message: 'Invalid BVN. Must be 11 digits.' };
  }

  // Check against mock database
  const record = MOCK_BVN_DB[bvn];
  if (!record) {
    return { valid: false, message: 'BVN not found. Please register with Opay.' };
  }

  if (record.bvnStatus !== 'verified') {
    return { valid: false, message: 'BVN not verified. Please verify with Opay.' };
  }

  // Name matching (simplified)
  if (name && !record.name.toLowerCase().includes(name.toLowerCase())) {
    return { valid: false, message: 'BVN name does not match business name.' };
  }

  return { valid: true, message: 'BVN verified successfully!', data: record };
};

/**
 * Get merchant by ID
 * @param {string} merchantId - Merchant ID
 * @returns {Object|null} Merchant data
 */
export const getMerchant = (merchantId) => {
  return MOCK_MERCHANTS[merchantId] || null;
};

/**
 * Get merchant by user ID
 * @param {string} userId - User ID
 * @returns {Object|null} Merchant data
 */
export const getMerchantByUserId = (userId) => {
  for (const id in MOCK_MERCHANTS) {
    if (MOCK_MERCHANTS[id].userId === userId) {
      return MOCK_MERCHANTS[id];
    }
  }
  return null;
};

/**
 * Get all merchants
 * @returns {Array} List of merchants
 */
export const getAllMerchants = () => {
  return Object.values(MOCK_MERCHANTS);
};

/**
 * Process a gift redemption
 * @param {string} merchantId - Merchant ID
 * @param {string} code - 6-digit redemption code
 * @param {number} amount - Gift amount
 * @returns {Promise<Object>} Redemption result
 */
export const processRedemption = async (merchantId, code, amount) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const merchant = getMerchant(merchantId);
  if (!merchant) {
    throw new Error('Merchant not found');
  }

  if (merchant.status !== 'active') {
    throw new Error('Merchant account is not active');
  }

  // Calculate payout (80% of gift value)
  const commission = amount * 0.20;
  const payout = amount - commission;

  // Create redemption record
  const redemption = {
    id: `redemption_${Date.now()}`,
    merchantId,
    merchantName: merchant.name,
    code,
    amount,
    commission,
    payout,
    status: 'completed', // completed, pending, failed
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  // Save redemption
  if (!MOCK_REDEMPTIONS[merchantId]) {
    MOCK_REDEMPTIONS[merchantId] = [];
  }
  MOCK_REDEMPTIONS[merchantId].unshift(redemption);
  saveRedemptions();

  // Update merchant stats
  merchant.totalRedemptions += 1;
  merchant.totalRevenue += payout;
  merchant.pendingPayouts += payout;

  // Update trust level after 5 redemptions
  if (merchant.totalRedemptions >= 5) {
    merchant.isTrusted = true;
    merchant.trustLevel = 'trusted';
  }
  if (merchant.totalRedemptions >= 20) {
    merchant.trustLevel = 'partner';
  }

  merchant.updatedAt = new Date().toISOString();
  MOCK_MERCHANTS[merchantId] = merchant;
  saveMerchants();

  // Mock instant payout to Opay
  await instantPayout(merchantId, payout);

  return {
    success: true,
    redemption,
    payout,
    commission,
  };
};

/**
 * Instant payout to merchant's Opay wallet
 * @param {string} merchantId - Merchant ID
 * @param {number} amount - Amount to pay
 * @returns {Promise<Object>} Payout result
 */
export const instantPayout = async (merchantId, amount) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // Mock payout - in production, call Opay API
  return {
    success: true,
    merchantId,
    amount,
    transactionId: `txn_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get merchant redemptions
 * @param {string} merchantId - Merchant ID
 * @param {number} limit - Limit
 * @returns {Array} Redemptions
 */
export const getMerchantRedemptions = (merchantId, limit = 50) => {
  const redemptions = MOCK_REDEMPTIONS[merchantId] || [];
  return redemptions.slice(0, limit);
};

/**
 * Get merchant stats
 * @param {string} merchantId - Merchant ID
 * @returns {Object} Stats
 */
export const getMerchantStats = (merchantId) => {
  const merchant = getMerchant(merchantId);
  if (!merchant) {
    return null;
  }

  const redemptions = MOCK_REDEMPTIONS[merchantId] || [];
  const total = redemptions.length;
  const totalRevenue = redemptions.reduce((sum, r) => sum + r.payout, 0);
  const totalCommission = redemptions.reduce((sum, r) => sum + r.commission, 0);

  // Last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentRedemptions = redemptions.filter(r => 
    new Date(r.createdAt) > sevenDaysAgo
  );
  const recentRevenue = recentRedemptions.reduce((sum, r) => sum + r.payout, 0);

  // Current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRedemptions = redemptions.filter(r => 
    new Date(r.createdAt) > monthStart
  );
  const monthRevenue = monthRedemptions.reduce((sum, r) => sum + r.payout, 0);

  return {
    merchant,
    totalRedemptions: total,
    totalRevenue,
    totalCommission,
    recentRevenue,
    monthRevenue,
    averagePayout: total > 0 ? totalRevenue / total : 0,
    trustLevel: merchant.trustLevel,
    isTrusted: merchant.isTrusted,
  };
};

/**
 * Update merchant status
 * @param {string} merchantId - Merchant ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated merchant
 */
export const updateMerchantStatus = async (merchantId, status) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const merchant = getMerchant(merchantId);
  if (!merchant) {
    throw new Error('Merchant not found');
  }

  const validStatus = ['active', 'suspended', 'pending'];
  if (!validStatus.includes(status)) {
    throw new Error('Invalid status');
  }

  merchant.status = status;
  merchant.updatedAt = new Date().toISOString();
  MOCK_MERCHANTS[merchantId] = merchant;
  saveMerchants();

  return merchant;
};

/**
 * Delete merchant
 * @param {string} merchantId - Merchant ID
 * @returns {Promise<Object>} Result
 */
export const deleteMerchant = async (merchantId) => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  delete MOCK_MERCHANTS[merchantId];
  delete MOCK_REDEMPTIONS[merchantId];
  saveMerchants();
  saveRedemptions();

  return { success: true };
};

/**
 * Save merchants to localStorage
 */
const saveMerchants = () => {
  try {
    localStorage.setItem(MERCHANTS_KEY, JSON.stringify(MOCK_MERCHANTS));
  } catch (error) {
    console.warn('Failed to save merchants:', error);
  }
};

/**
 * Save redemptions to localStorage
 */
const saveRedemptions = () => {
  try {
    localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(MOCK_REDEMPTIONS));
  } catch (error) {
    console.warn('Failed to save redemptions:', error);
  }
};

export default {
  registerMerchant,
  validateBVN,
  getMerchant,
  getMerchantByUserId,
  getAllMerchants,
  processRedemption,
  instantPayout,
  getMerchantRedemptions,
  getMerchantStats,
  updateMerchantStatus,
  deleteMerchant,
};