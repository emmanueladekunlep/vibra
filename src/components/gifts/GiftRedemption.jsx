/**
 * VIBRA - Gift Redemption Component
 * Module: Gift Store
 * 
 * Redeem gift with 6-digit code.
 * User sends WhatsApp message to admin for cash withdrawal.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as giftService from '../../services/giftService';

const WHATSAPP_NUMBER = '07032977572';
const ADMIN_OPAY = '07032977572';
const ADMIN_NAME = 'LabelReach Advertising Ltd';

const GiftRedemption = ({ type, onRedeemed, onClose }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [giftInfo, setGiftInfo] = useState(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setGiftInfo(null);
    setShowWhatsApp(false);

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

      if (gift.recipientId !== user?.userId) {
        setError('This gift was not sent to you');
        return;
      }

      setGiftInfo(gift);
      setShowWhatsApp(true);
    } catch (err) {
      setError(err.message || 'Failed to redeem gift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppWithdrawal = () => {
    if (!giftInfo || !user) return;

    const amount = parseFloat(giftInfo.price || 0);
    const fee = amount * 0.05;
    const payout = amount - fee;

    const message = `🔔 *VIBRA CASH WITHDRAWAL REQUEST*

👤 *User ID:* ${user.userId}
👤 *Name:* ${user.name || 'N/A'}
📱 *Phone:* ${user.phone || 'N/A'}
💰 *Gift:* ${giftInfo.giftName}
💵 *Amount:* ₦${amount.toLocaleString()}
📝 *Code:* ${giftInfo.redemptionCode}
📅 *Date:* ${new Date().toLocaleString()}
💳 *Fee (5%):* ₦${fee.toLocaleString()}
💸 *Payout:* ₦${payout.toLocaleString()}

📤 *Payment Details:*
Bank: Opay
Account: ${ADMIN_OPAY}
Name: ${ADMIN_NAME}
Amount: ₦${payout.toLocaleString()}

📎 *Please attach screenshot of payment receipt.*

After payment confirmation, your withdrawal will be processed.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Mark as withdrawn locally
    giftInfo.status = 'withdrawn';
    setShowWhatsApp(false);
    setSuccess('Withdrawal request sent! Please complete payment and send screenshot via WhatsApp.');
    
    if (onRedeemed) {
      onRedeemed({ success: true, manual: true, gift: giftInfo });
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            {type === 'merchant' ? 'Redeem Gift (Merchant)' : 'Withdraw Cash Gift'}
          </h3>
          {onClose && (
            <button onClick={handleClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          {type === 'merchant' 
            ? 'Enter the 6-digit gift code provided by the customer'
            : 'Enter your 6-digit gift code to withdraw cash'}
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

        {giftInfo && showWhatsApp && !success && (
          <div style={styles.giftInfo}>
            <p style={styles.giftInfoName}>{giftInfo.giftName}</p>
            <p style={styles.giftInfoPrice}>₦{parseFloat(giftInfo.price).toLocaleString()}</p>
            <p style={styles.giftInfoSender}>From: {giftInfo.senderId}</p>
            {giftInfo.message && (
              <p style={styles.giftInfoMessage}>"{giftInfo.message}"</p>
            )}
            
            <div style={styles.paymentInfo}>
              <p style={styles.paymentTitle}>📤 Payment Instructions</p>
              <p style={styles.paymentText}>Send ₦{((parseFloat(giftInfo.price) * 0.95)).toLocaleString()} to:</p>
              <div style={styles.paymentDetails}>
                <span><strong>Bank:</strong> Opay</span>
                <span><strong>Account:</strong> {ADMIN_OPAY}</span>
                <span><strong>Name:</strong> {ADMIN_NAME}</span>
              </div>
              <p style={styles.paymentNote}>After payment, click below to send confirmation via WhatsApp</p>
            </div>

            <button
              onClick={handleWhatsAppWithdrawal}
              style={styles.whatsappButton}
            >
              📱 Send Withdrawal Request via WhatsApp
            </button>
          </div>
        )}

        {!success && !showWhatsApp && (
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
                ...(type === 'merchant' ? styles.merchantButton : styles.cashButton),
              }}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Processing...' : type === 'merchant' ? 'Redeem Gift' : 'Withdraw Cash'}
            </button>
          </form>
        )}

        {!success && !showWhatsApp && type === 'merchant' && (
          <div style={styles.merchantInfo}>
            <p style={styles.merchantInfoText}>
              After redemption, the gift value will be credited instantly.
            </p>
            <p style={styles.merchantInfoNote}>
              BVN verification is required for first-time merchants.
            </p>
          </div>
        )}

        {!success && !showWhatsApp && type !== 'merchant' && (
          <div style={styles.cashInfo}>
            <p style={styles.cashInfoText}>
              Cash gifts are subject to a 5% withdrawal fee.
            </p>
            <p style={styles.cashInfoNote}>
              Funds are processed through LabelReach. Click "Withdraw Cash" to send request via WhatsApp.
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
    backgroundColor: '#721CBB',
  },
  cashButton: {
    backgroundColor: '#10964D',
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
    backgroundColor: '#721CBB',
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
    color: '#721CBB',
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
  paymentInfo: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fff8e1',
    borderRadius: '10px',
    border: '1px solid #ffe082',
  },
  paymentTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#e65100',
    margin: '0 0 8px 0',
  },
  paymentText: {
    fontSize: '13px',
    color: '#555',
    margin: '0 0 8px 0',
  },
  paymentDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '8px',
  },
  paymentNote: {
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
    margin: 0,
  },
  whatsappButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#25D366',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
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