/**
 * VIBRA - Gift Redemption Component
 * Module: Gift Store
 * 
 * Redeem gift with 6-digit code.
 * Professional design - no emojis.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as giftService from '../../services/giftService';

// Manual payout mode - admin processes withdrawals manually
const MANUAL_PAYOUT_MODE = true;

const GiftRedemption = ({ type, onRedeemed, onClose }) => {
  const { user, markHasWithdrawn } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [giftInfo, setGiftInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setGiftInfo(null);

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const gift = await giftService.getGiftByCode(code);
      if (!gift) {
        setError('Invalid redemption code');
        return;
      }

      if (gift.status !== 'pending') {
        setError('This gift has already been redeemed');
        return;
      }

      if (gift.recipientId !== user?.id) {
        setError('This gift was not sent to you');
        return;
      }

      setGiftInfo(gift);

      // MANUAL PAYOUT MODE - Admin processes payment manually
      if (MANUAL_PAYOUT_MODE && type !== 'merchant') {
        setSuccess('Withdrawal request submitted. You will be contacted within 24 hours.');
        
        // Mark user as having withdrawn (for verification discount)
        if (user && !user.hasWithdrawn) {
          await markHasWithdrawn();
        }
        
        if (onRedeemed) onRedeemed({ success: true, manual: true });
        setIsLoading(false);
        return;
      }

      if (type === 'merchant') {
        const merchantId = 'merchant_1';
        const result = await giftService.redeemServiceGift(code, merchantId);
        setSuccess(result.message);
        if (onRedeemed) onRedeemed(result);
      } else {
        const result = await giftService.withdrawCashGift(code, user.id);
        setSuccess(result.message);
        if (onRedeemed) onRedeemed(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to redeem gift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const isMerchant = type === 'merchant';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            {isMerchant ? 'Redeem Gift (Merchant)' : 'Withdraw Cash Gift'}
          </h3>
          {onClose && (
            <button onClick={handleClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          {isMerchant 
            ? 'Enter the 6-digit gift code provided by the customer'
            : 'Enter the 6-digit gift code to withdraw'}
        </p>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
        {success && (
          <div style={styles.successBox}>
            <p style={styles.successText}>{success}</p>
            <button onClick={handleClose} style={styles.doneButton}>
              Done
            </button>
          </div>
        )}

        {giftInfo && !success && (
          <div style={styles.giftInfo}>
            <p style={styles.giftInfoName}>{giftInfo.giftName}</p>
            <p style={styles.giftInfoPrice}>₦{giftInfo.price.toLocaleString()}</p>
            <p style={styles.giftInfoSender}>From: {giftInfo.senderId}</p>
            {giftInfo.message && (
              <p style={styles.giftInfoMessage}>"{giftInfo.message}"</p>
            )}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Redemption Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                placeholder="123456"
                style={styles.codeInput}
                maxLength="6"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(isMerchant ? styles.merchantButton : styles.cashButton),
              }}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Processing...' : isMerchant ? 'Redeem Gift' : 'Withdraw Cash'}
            </button>
          </form>
        )}

        {isMerchant && !success && (
          <div style={styles.merchantInfo}>
            <p style={styles.merchantInfoText}>
              After redemption, the gift value will be credited instantly.
            </p>
            <p style={styles.merchantInfoNote}>
              BVN verification is required for first-time merchants.
            </p>
          </div>
        )}

        {!isMerchant && !success && (
          <div style={styles.cashInfo}>
            <p style={styles.cashInfoText}>
              Cash gifts are subject to a 5% withdrawal fee.
            </p>
            <p style={styles.cashInfoNote}>
              Funds are processed through LabelReach.
            </p>
          </div>
        )}

        <p style={styles.credit}>
          Powered by LabelReach
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '28px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '6px',
  },
  codeInput: {
    width: '100%',
    padding: '16px',
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: '8px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  merchantButton: {
    backgroundColor: '#6C3CE1',
  },
  cashButton: {
    backgroundColor: '#00B894',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: '14px',
    margin: 0,
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #c8e6c9',
    textAlign: 'center',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  doneButton: {
    padding: '8px 24px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  giftInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  giftInfoName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  giftInfoPrice: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#6C3CE1',
    margin: '0 0 4px 0',
  },
  giftInfoSender: {
    fontSize: '13px',
    color: '#888',
    margin: '0 0 4px 0',
  },
  giftInfoMessage: {
    fontSize: '14px',
    color: '#555',
    fontStyle: 'italic',
    margin: '4px 0 0 0',
  },
  merchantInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f0edff',
    borderRadius: '10px',
  },
  merchantInfoText: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 4px 0',
    lineHeight: '1.5',
  },
  merchantInfoNote: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
  },
  cashInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#e8f5e9',
    borderRadius: '10px',
  },
  cashInfoText: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 4px 0',
    lineHeight: '1.5',
  },
  cashInfoNote: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
};

export default GiftRedemption;