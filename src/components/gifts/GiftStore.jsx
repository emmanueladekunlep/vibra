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

// Professional SVG Icons
const Icons = {
  Food: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#721CBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16"/>
      <path d="M12 8v11"/>
      <path d="M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3"/>
      <path d="M4 12h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z"/>
    </svg>
  ),
  Drink: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#721CBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12"/>
      <path d="M8 8v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8"/>
      <path d="M10 12h4"/>
      <path d="M12 8V4"/>
      <path d="M8 4h8"/>
    </svg>
  ),
  Entertainment: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#721CBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M8 4v2"/>
      <path d="M16 4v2"/>
      <path d="M2 10h20"/>
      <path d="M8 14h8"/>
      <path d="M8 18h4"/>
    </svg>
  ),
  Shopping: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#721CBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Data: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#721CBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z"/>
      <path d="M8 8h8"/>
      <path d="M8 12h4"/>
      <path d="M8 16h2"/>
      <path d="M16 12v4"/>
      <path d="M14 12h2"/>
    </svg>
  ),
  Cash: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10964D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12"/>
      <path d="M8 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-4a2 2 0 0 0-2 2 2 2 0 0 0 2 2h4a2 2 0 0 0 2-2"/>
    </svg>
  ),
  Cinema: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#721CBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M6 8h.01"/>
      <path d="M10 8h.01"/>
      <path d="M14 8h.01"/>
      <path d="M18 8h.01"/>
      <path d="M2 12h20"/>
      <path d="M8 16h8"/>
    </svg>
  ),
  Default: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#721CBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12v10H4V12"/>
      <path d="M2 7h20v5H2z"/>
      <path d="M12 22V7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
};

const getIcon = (giftId) => {
  const iconMap = {
    'food_3000': Icons.Food,
    'food_5000': Icons.Food,
    'drinks_2000': Icons.Drink,
    'entertainment_4000': Icons.Entertainment,
    'shopping_5000': Icons.Shopping,
    'data_1000': Icons.Data,
    'cash_2000': Icons.Cash,
    'cash_5000': Icons.Cash,
    'cash_10000': Icons.Cash,
    'cinema_4000': Icons.Cinema,
  };
  return iconMap[giftId] || Icons.Default;
};

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
      service: 'Service',
      cash: 'Cash',
    };
    return labels[type] || type;
  };

  const getStatusColor = (type) => {
    return type === 'cash' ? '#10964D' : '#721CBB';
  };

  const GiftIcon = selectedGift ? getIcon(selectedGift.id) : null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Send a Gift</h2>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              ✕
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
          {gifts.map((gift) => {
            const Icon = getIcon(gift.id);
            return (
              <div
                key={gift.id}
                style={{
                  ...styles.giftCard,
                  ...(selectedGift?.id === gift.id ? styles.giftCardSelected : {}),
                }}
                onClick={() => setSelectedGift(gift)}
              >
                <div style={styles.giftIconWrapper}>
                  <Icon />
                </div>
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
            );
          })}
        </div>

        {selectedGift && GiftIcon && (
          <div style={styles.purchasePanel}>
            <div style={styles.purchaseHeader}>
              <GiftIcon />
              <h4 style={styles.purchaseTitle}>
                {selectedGift.name} (₦{selectedGift.price.toLocaleString()})
              </h4>
            </div>
            
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
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
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
    fontSize: '18px',
    color: '#666',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  filterContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '2px solid #e8e8e8',
    backgroundColor: 'white',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  filterActive: {
    borderColor: '#721CBB',
    backgroundColor: '#f0ebf8',
    color: '#721CBB',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  giftCard: {
    border: '2px solid #f0f0f0',
    borderRadius: '14px',
    padding: '14px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  giftCardSelected: {
    borderColor: '#721CBB',
    backgroundColor: '#f5f0ff',
  },
  giftIconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '8px',
    height: '40px',
  },
  giftName: {
    fontSize: '14px',
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
    fontSize: '14px',
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
    marginTop: '4px',
  },
  purchaseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  purchaseTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
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
    border: '2px solid #e8e8e8',
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
    backgroundColor: '#721CBB',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  cancelButton: {
    backgroundColor: '#e8e8e8',
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