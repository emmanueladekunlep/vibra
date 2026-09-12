/**
 * VIBRA - Gift Service
 * Module: Gift Store
 * 
 * Handles all gift operations via API.
 * 
 * Model: 2 points = ₦1
 * - Gifts transfer points INSTANTLY (minus admin fee)
 * - Withdrawals convert points to Naira
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

// Gift catalog (static - same as backend)
export const GIFT_CATALOG = {
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
  cash: [
    {
      id: 'cash_2000',
      name: 'Cash Gift',
      category: 'Cash',
      description: 'Instant withdrawal to Opay wallet',
      price: 2000,
      type: 'cash',
      icon: '₦',
      withdrawalFee: 0.05,
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

export const COMMISSION = {
  SERVICE: 0.20,
  CASH_FEE: 0.05,
};

// Point conversion rate: 2 points = ₦1
export const POINTS_PER_NAIRA = 2;

export const getGifts = (type = 'all') => {
  if (type === 'service') return GIFT_CATALOG.service;
  if (type === 'cash') return GIFT_CATALOG.cash;
  return [...GIFT_CATALOG.service, ...GIFT_CATALOG.cash];
};

export const getGiftById = (giftId) => {
  const all = getGifts('all');
  return all.find(g => g.id === giftId) || null;
};

/**
 * Convert Naira to points
 */
export const nairaToPoints = (naira) => Math.round(naira * POINTS_PER_NAIRA);

/**
 * Convert points to Naira
 */
export const pointsToNaira = (points) => Math.floor(points / POINTS_PER_NAIRA);

/**
 * Purchase a gift - INSTANT point transfer to recipient
 * Calls API
 */
export const purchaseGift = async (userId, recipientId, giftId, message = '') => {
  const response = await fetch(`${API_URL}/create_gift.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_id: userId,
      recipient_id: recipientId,
      gift_id: giftId,
      message: message,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to send gift');
  }

  return data;
};

/**
 * Request withdrawal - converts points to Naira
 * Points deducted instantly, WhatsApp message to admin
 */
export const requestWithdrawal = async (userId, amount) => {
  const response = await fetch(`${API_URL}/redeem_gift.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      amount: amount,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to request withdrawal');
  }

  return data;
};

/**
 * Get gift history for a user (flattened array) - calls API
 */
export const getGiftHistory = async (userId) => {
  const response = await fetch(`${API_URL}/my_gifts.php?user_id=${encodeURIComponent(userId)}`);
  const data = await response.json();

  if (data.success) {
    return [...(data.sent || []), ...(data.received || [])];
  }
  return [];
};

/**
 * Get separated sent/received gifts - calls API
 * Returns { sent: [...], received: [...] }
 */
export const getMyGifts = async (userId) => {
  const response = await fetch(`${API_URL}/my_gifts.php?user_id=${encodeURIComponent(userId)}`);
  const data = await response.json();

  if (data.success) {
    return {
      sent: data.sent || [],
      received: data.received || [],
    };
  }
  return { sent: [], received: [] };
};

/**
 * Get gift stats for a user
 */
export const getGiftStats = async (userId) => {
  const history = await getGiftHistory(userId);

  const sent = history.filter(g => String(g.sender_id) === String(userId));
  const received = history.filter(g => String(g.recipient_id) === String(userId));

  return {
    totalSent: sent.reduce((sum, g) => sum + parseFloat(g.price || 0), 0),
    totalReceived: received.reduce((sum, g) => sum + parseFloat(g.price || 0), 0),
    sentCount: sent.length,
    receivedCount: received.length,
    pendingCount: history.filter(g => g.status === 'pending').length,
    redeemedCount: history.filter(g => g.status === 'redeemed' || g.status === 'withdrawn').length,
  };
};

export const generateRedemptionCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getVIPPointsForUser = (userId) => {
  return 0;
};

export const getTotalPointsForUser = (userId) => {
  return 0;
};

export default {
  GIFT_CATALOG,
  COMMISSION,
  POINTS_PER_NAIRA,
  getGifts,
  getGiftById,
  nairaToPoints,
  pointsToNaira,
  purchaseGift,
  requestWithdrawal,
  generateRedemptionCode,
  getGiftHistory,
  getMyGifts,
  getGiftStats,
  getVIPPointsForUser,
  getTotalPointsForUser,
};