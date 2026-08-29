/**
 * VIBRA - Gift Service
 * Module: Gift Store
 * Author: Emmanuel Adekunle Peace
 * Website: www.emmanueladekunlepeace.com
 * 
 * Handles all gift operations:
 * - Gift catalog (service + cash gifts)
 * - Purchase gifts
 * - Generate 6-digit redemption codes
 * - Redeem gifts (service merchant or cash withdrawal)
 * - Track gift history
 * 
 * All API calls are mocked. Replace with real endpoints when available.
 */

// Storage keys
const GIFT_HISTORY_KEY = 'vibra_gift_history';
const REDEMPTION_CODES_KEY = 'vibra_redemption_codes';

// Gift catalog
export const GIFT_CATALOG = {
  // Service/Product Gifts (merchant-redeemable, cannot withdraw)
  service: [
    {
      id: 'food_3000',
      name: 'Food Gift',
      category: 'Food',
      description: 'Redeem at any restaurant, cafe, or buka on Vibra',
      price: 3000,
      type: 'service',
      icon: '🍔',
      merchantCategory: 'restaurant',
    },
    {
      id: 'food_5000',
      name: 'Food Gift Plus',
      category: 'Food',
      description: 'Premium dining experience at any Vibra restaurant',
      price: 5000,
      type: 'service',
      icon: '🍽️',
      merchantCategory: 'restaurant',
    },
    {
      id: 'drinks_2000',
      name: 'Drink Gift',
      category: 'Drinks',
      description: 'Redeem at any bar or lounge on Vibra',
      price: 2000,
      type: 'service',
      icon: '🍷',
      merchantCategory: 'bar',
    },
    {
      id: 'entertainment_4000',
      name: 'Cinema Gift',
      category: 'Entertainment',
      description: 'Movie tickets at any Vibra cinema',
      price: 4000,
      type: 'service',
      icon: '🎬',
      merchantCategory: 'cinema',
    },
    {
      id: 'shopping_5000',
      name: 'Shopping Gift',
      category: 'Shopping',
      description: 'Redeem at any fashion or accessory store on Vibra',
      price: 5000,
      type: 'service',
      icon: '🛍️',
      merchantCategory: 'shopping',
    },
    {
      id: 'data_1000',
      name: 'Data Gift',
      category: 'Data/Airtime',
      description: 'Redeem at any telecom merchant on Vibra',
      price: 1000,
      type: 'service',
      icon: '📱',
      merchantCategory: 'telecom',
    },
  ],
  
  // Cash Gifts (withdrawable to Opay)
  cash: [
    {
      id: 'cash_2000',
      name: 'Cash Gift',
      category: 'Cash',
      description: 'Instant withdrawal to Opay wallet',
      price: 2000,
      type: 'cash',
      icon: '₦',
      withdrawalFee: 0.05, // 5% fee
    },
    {
      id: 'cash_5000',
      name: 'Cash Gift Plus',
      category: 'Cash',
      description: 'Instant withdrawal to Opay wallet',
      price: 5000,
      type: 'cash',
      icon: '₦',
      withdrawalFee: 0.05,
    },
    {
      id: 'cash_10000',
      name: 'Cash Gift Premium',
      category: 'Cash',
      description: 'Instant withdrawal to Opay wallet',
      price: 10000,
      type: 'cash',
      icon: '₦',
      withdrawalFee: 0.05,
    },
  ],
};

// Commission rates
export const COMMISSION = {
  SERVICE: 0.20, // 20% commission
  CASH_FEE: 0.05, // 5% fee on cash gifts
};

/**
 * Get all gifts
 * @param {string} type - 'service', 'cash', or 'all'
 * @returns {Array} List of gifts
 */
export const getGifts = (type = 'all') => {
  if (type === 'service') return GIFT_CATALOG.service;
  if (type === 'cash') return GIFT_CATALOG.cash;
  return [...GIFT_CATALOG.service, ...GIFT_CATALOG.cash];
};

/**
 * Get gift by ID
 * @param {string} giftId - Gift ID
 * @returns {Object|null} Gift object
 */
export const getGiftById = (giftId) => {
  const all = getGifts('all');
  return all.find(g => g.id === giftId) || null;
};

/**
 * Purchase a gift
 * @param {string} userId - Purchaser user ID
 * @param {string} recipientId - Recipient user ID
 * @param {string} giftId - Gift ID
 * @param {string} message - Optional message
 * @returns {Promise<Object>} Purchase result with redemption code
 */
export const purchaseGift = async (userId, recipientId, giftId, message = '') => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const gift = getGiftById(giftId);
  if (!gift) {
    throw new Error('Gift not found');
  }

  // Check if user has enough points (if paying with points)
  const user = await getUser(userId);
  if (user.points < gift.price * 2) {
    throw new Error('Insufficient points. Need ₦1 = 2 points');
  }

  // Generate 6-digit redemption code
  const redemptionCode = generateRedemptionCode();

  // Create gift record
  const giftRecord = {
    id: `gift_${Date.now()}`,
    giftId: gift.id,
    giftName: gift.name,
    giftType: gift.type,
    price: gift.price,
    senderId: userId,
    recipientId: recipientId,
    message: message,
    redemptionCode: redemptionCode,
    status: 'pending', // pending, redeemed, withdrawn
    createdAt: new Date().toISOString(),
    redeemedAt: null,
    merchantId: null,
    withdrawalId: null,
  };

  // Save to history
  await addGiftHistory(userId, giftRecord);
  await addGiftHistory(recipientId, giftRecord);

  // Save redemption code
  saveRedemptionCode(redemptionCode, giftRecord);

  // Deduct points from sender
  const pointsToDeduct = gift.price * 2;
  await deductPoints(userId, pointsToDeduct, 'gift_sent', `Sent ${gift.name} to recipient`);

  // Add points to recipient (for service gifts, points are added on redemption)
  if (gift.type === 'cash') {
    // Cash gifts don't add points immediately
  }

  return {
    success: true,
    gift: giftRecord,
    redemptionCode: redemptionCode,
    message: `Gift sent successfully! Redemption code: ${redemptionCode}`,
  };
};

/**
 * Generate a 6-digit redemption code
 * @returns {string} 6-digit code
 */
export const generateRedemptionCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Redeem a service gift (merchant)
 * @param {string} redemptionCode - 6-digit code
 * @param {string} merchantId - Merchant ID
 * @returns {Promise<Object>} Redemption result
 */
export const redeemServiceGift = async (redemptionCode, merchantId) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const giftRecord = getGiftByCode(redemptionCode);
  if (!giftRecord) {
    throw new Error('Invalid redemption code');
  }

  if (giftRecord.status !== 'pending') {
    throw new Error('Gift has already been redeemed');
  }

  if (giftRecord.giftType === 'cash') {
    throw new Error('Cash gifts cannot be redeemed by merchants');
  }

  // Verify merchant
  const merchant = await getMerchant(merchantId);
  if (!merchant) {
    throw new Error('Merchant not found');
  }

  // Check if merchant matches gift category
  const gift = getGiftById(giftRecord.giftId);
  if (gift.merchantCategory && merchant.category !== gift.merchantCategory) {
    throw new Error('This gift cannot be redeemed at this merchant');
  }

  // Update gift record
  giftRecord.status = 'redeemed';
  giftRecord.redeemedAt = new Date().toISOString();
  giftRecord.merchantId = merchantId;

  // Update recipient's points (service gift value)
  const recipient = await getUser(giftRecord.recipientId);
  await addPoints(giftRecord.recipientId, giftRecord.price, 'gift_received', `Redeemed ${giftRecord.giftName}`);

  // Pay merchant (80% of value)
  const merchantPayout = giftRecord.price * (1 - COMMISSION.SERVICE);
  await payMerchant(merchantId, merchantPayout);

  // Save updated gift
  updateGiftHistory(giftRecord);
  saveRedemptionCode(redemptionCode, giftRecord);

  return {
    success: true,
    gift: giftRecord,
    merchantPayout: merchantPayout,
    message: 'Gift redeemed successfully!',
  };
};

/**
 * Withdraw a cash gift
 * @param {string} redemptionCode - 6-digit code
 * @param {string} userId - User ID withdrawing
 * @returns {Promise<Object>} Withdrawal result
 */
export const withdrawCashGift = async (redemptionCode, userId) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const giftRecord = getGiftByCode(redemptionCode);
  if (!giftRecord) {
    throw new Error('Invalid redemption code');
  }

  if (giftRecord.status !== 'pending') {
    throw new Error('Gift has already been redeemed');
  }

  if (giftRecord.giftType !== 'cash') {
    throw new Error('Only cash gifts can be withdrawn');
  }

  if (giftRecord.recipientId !== userId) {
    throw new Error('You are not the recipient of this gift');
  }

  // Calculate fee
  const fee = giftRecord.price * COMMISSION.CASH_FEE;
  const amount = giftRecord.price - fee;

  // Update gift record
  giftRecord.status = 'withdrawn';
  giftRecord.redeemedAt = new Date().toISOString();
  giftRecord.withdrawalId = `wd_${Date.now()}`;

  // Add points to recipient (cash gift value)
  await addPoints(userId, giftRecord.price, 'gift_received', `Withdrew ${giftRecord.giftName}`);

  // Save updated gift
  updateGiftHistory(giftRecord);
  saveRedemptionCode(redemptionCode, giftRecord);

  return {
    success: true,
    gift: giftRecord,
    amount: amount,
    fee: fee,
    message: `Cash gift withdrawn successfully! Amount: ₦${amount}`,
  };
};

/**
 * Get gift by redemption code
 * @param {string} code - 6-digit code
 * @returns {Object|null} Gift record
 */
export const getGiftByCode = (code) => {
  try {
    const data = localStorage.getItem(`${REDEMPTION_CODES_KEY}_${code}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Save redemption code
 */
const saveRedemptionCode = (code, giftRecord) => {
  try {
    localStorage.setItem(`${REDEMPTION_CODES_KEY}_${code}`, JSON.stringify(giftRecord));
  } catch (error) {
    console.warn('Failed to save redemption code:', error);
  }
};

/**
 * Get gift history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Gift history
 */
export const getGiftHistory = async (userId) => {
  try {
    const data = localStorage.getItem(`${GIFT_HISTORY_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Add gift to history
 */
const addGiftHistory = async (userId, giftRecord) => {
  const history = await getGiftHistory(userId);
  history.unshift(giftRecord);
  saveGiftHistory(userId, history);
};

/**
 * Update gift in history
 */
const updateGiftHistory = (giftRecord) => {
  // Update for sender and recipient
  [giftRecord.senderId, giftRecord.recipientId].forEach(async (userId) => {
    const history = await getGiftHistory(userId);
    const index = history.findIndex(g => g.id === giftRecord.id);
    if (index !== -1) {
      history[index] = giftRecord;
      saveGiftHistory(userId, history);
    }
  });
};

/**
 * Save gift history
 */
const saveGiftHistory = (userId, history) => {
  try {
    localStorage.setItem(`${GIFT_HISTORY_KEY}_${userId}`, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save gift history:', error);
  }
};

/**
 * Get gift stats for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Gift stats
 */
export const getGiftStats = async (userId) => {
  const history = await getGiftHistory(userId);
  
  const sent = history.filter(g => g.senderId === userId);
  const received = history.filter(g => g.recipientId === userId);
  
  const totalSent = sent.reduce((sum, g) => sum + g.price, 0);
  const totalReceived = received.reduce((sum, g) => sum + g.price, 0);
  
  return {
    totalSent,
    totalReceived,
    sentCount: sent.length,
    receivedCount: received.length,
    pendingCount: history.filter(g => g.status === 'pending').length,
    redeemedCount: history.filter(g => g.status === 'redeemed' || g.status === 'withdrawn').length,
  };
};

// ========== MOCK HELPERS ==========

async function getUser(userId) {
  return {
    id: userId,
    points: 1000,
    level: 'Bronze',
    name: 'User',
  };
}

async function getMerchant(merchantId) {
  return {
    id: merchantId,
    name: 'Merchant',
    category: 'restaurant',
    verified: true,
  };
}

async function addPoints(userId, points, source, description) {
  // Mock adding points
  return { success: true };
}

async function deductPoints(userId, points, source, description) {
  // Mock deducting points
  return { success: true };
}

async function payMerchant(merchantId, amount) {
  // Mock payment
  return { success: true };
}

export default {
  GIFT_CATALOG,
  COMMISSION,
  getGifts,
  getGiftById,
  purchaseGift,
  generateRedemptionCode,
  redeemServiceGift,
  withdrawCashGift,
  getGiftByCode,
  getGiftHistory,
  getGiftStats,
};