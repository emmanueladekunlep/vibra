/**
 * VIBRA - Gift Store Component
 * Module: Gift Store
 * 
 * Browse and purchase gifts.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as giftService from '../../services/giftService';

// Manual payout mode - admin processes withdrawals manually
// No bank details shown to users
const MANUAL_PAYOUT_MODE = true;

const GiftStore = ({ recipientId, onPurchase, onClose }) => {
  const { user } = useAuth();
  const [gifts, setGifts] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const allGifts = giftService.getGifts(selectedType);
    setGifts(allGifts);
  }, [selectedType]);

  const handlePurchase = async (gift) => {
    if (!user) {
      setError('Please login to send gifts');
      return;
    }

    if (!recipientId) {
      setError('Recipient not specified');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await giftService.purchaseGift(
        user.id,
        recipientId,
        gift.id,
        message
      );

      // Display redemption code if available
      let successMessage = '';
      if (result.redemptionCode) {
        successMessage = `Gift sent successfully!\n\nRedemption Code: ${result.redemptionCode}\n\nShare this code with the recipient.`;
      } else if (gift.type === 'cash') {
        successMessage = 'Gift sent successfully! Recipient will be notified.';
      } else {
        successMessage = result.message;
      }

      setSuccess(successMessage);

      setSelectedGift(null);
      setMessage('');

      if (onPurchase) {
        onPurchase(result);
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 10000);
    } catch (err) {
      setError(err.message || 'Failed to purchase gift');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      all: 'All Gifts',
      service: 'Service Gifts',
      cash: 'Cash Gifts',
    };
    return labels[type] || type;
  };

  const getStatusColor = (type) => {
    return type === 'cash' ? '#00B894' : '#6C3CE1';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Send a Gift</h2>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <div style={styles.filterContainer}>
          {['all', 'service', 'cash'].map((type) => (
            <button
              key={type}
              style={{
                ...styles.filterButton,
                ...(selectedType === type ? styles.filterActive : {}),
              }}
              onClick={() => setSelectedType(type)}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
        {success && (
          <div style={styles.successBox}>
            <p style={styles.successText}>{success}</p>
          </div>
        )}

        <div style={styles.giftGrid}>
          {gifts.map((gift) => (
            <div
              key={gift.id}
              style={{
                ...styles.giftCard,
                ...(selectedGift?.id === gift.id ? styles.giftCardSelected : {}),
              }}
              onClick={() => setSelectedGift(gift)}
            >
              <span style={styles.giftIcon}>{gift.icon}</span>
              <h4 style={styles.giftName}>{gift.name}</h4>
              <p style={styles.giftDescription}>{gift.description}</p>
              <div style={styles.giftFooter}>
                <span style={styles.giftPrice}>₦{gift.price.toLocaleString()}</span>
                <span
                  style={{
                    ...styles.giftType,
                    backgroundColor: getStatusColor(gift.type),
                  }}
                >
                  {gift.type === 'cash' ? 'Cash' : 'Service'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedGift && (
          <div style={styles.purchasePanel}>
            <h4 style={styles.purchaseTitle}>
              Send {selectedGift.name} (₦{selectedGift.price.toLocaleString()})
            </h4>
            
            <div style={styles.purchaseInfo}>
              <p style={styles.purchaseInfoText}>
                {selectedGift.type === 'cash' 
                  ? 'Recipient will receive cash value'
                  : 'Recipient can redeem at any Vibra merchant'}
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Message (optional)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message..."
                style={styles.input}
                maxLength="100"
              />
            </div>

            <div style={styles.buttonRow}>
              <button
                onClick={() => setSelectedGift(null)}
                style={{...styles.button, ...styles.cancelButton}}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(selectedGift)}
                style={styles.button}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : `Send ₦${selectedGift.price.toLocaleString()}`}
              </button>
            </div>

            <p style={styles.pointsInfo}>
              Cost: {selectedGift.price * 2} points (₦1 = 2 points)
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
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '22px',
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
  filterContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  filterButton: {
    padding: '6px 16px',
    borderRadius: '20px',
    border: '2px solid #e0e0e0',
    backgroundColor: 'white',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  filterActive: {
    borderColor: '#6C3CE1',
    backgroundColor: '#f0edff',
    color: '#6C3CE1',
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
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '14px',
    margin: 0,
    whiteSpace: 'pre-line',
  },
  giftGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  giftCard: {
    border: '2px solid #e8e8e8',
    borderRadius: '14px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  giftCardSelected: {
    borderColor: '#6C3CE1',
    backgroundColor: '#f5f0ff',
  },
  giftIcon: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '8px',
  },
  giftName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  giftDescription: {
    fontSize: '12px',
    color: '#888',
    margin: '0 0 10px 0',
    lineHeight: '1.3',
  },
  giftFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  giftPrice: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  giftType: {
    fontSize: '10px',
    padding: '2px 10px',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  purchasePanel: {
    borderTop: '2px solid #f0f0f0',
    paddingTop: '16px',
    marginTop: '8px',
  },
  purchaseTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  purchaseInfo: {
    backgroundColor: '#f8f8f8',
    padding: '10px 14px',
    borderRadius: '10px',
    marginBottom: '12px',
  },
  purchaseInfoText: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  formGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
  },
  button: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    color: '#555',
  },
  pointsInfo: {
    fontSize: '12px',
    color: '#888',
    margin: '8px 0 0 0',
    textAlign: 'center',
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

export default GiftStore;