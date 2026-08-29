/**
 * VIBRA - My Gifts Component
 * Module: Gift Store
 * 
 * Displays all gifts sent and received by the user.
 * Shows redemption codes for pending gifts.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as giftService from '../../services/giftService';

const MyGifts = ({ onClose }) => {
  const { user } = useAuth();
  const [sentGifts, setSentGifts] = useState([]);
  const [receivedGifts, setReceivedGifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    loadGifts();
  }, [user]);

  const loadGifts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const history = await giftService.getGiftHistory(user.id);
      
      // Separate sent and received
      const sent = history.filter(g => g.senderId === user.id);
      const received = history.filter(g => g.recipientId === user.id);
      
      setSentGifts(sent);
      setReceivedGifts(received);
    } catch (err) {
      setError('Failed to load gifts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      redeemed: 'Redeemed',
      withdrawn: 'Withdrawn',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      redeemed: '#00B894',
      withdrawn: '#6C3CE1',
    };
    return colors[status] || '#888';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-NG', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCode = (code) => {
    if (!code) return 'No code';
    return `${code.slice(0, 3)} ${code.slice(3, 6)}`;
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Code copied to clipboard');
      })
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Code copied to clipboard');
      });
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading gifts...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>My Gifts</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'received' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('received')}
          >
            Received ({receivedGifts.length})
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'sent' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentGifts.length})
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {/* Received Gifts */}
        {activeTab === 'received' && (
          <div style={styles.listContainer}>
            {receivedGifts.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No gifts received yet</p>
                <p style={styles.emptySubtext}>When someone sends you a gift, it will appear here</p>
              </div>
            ) : (
              receivedGifts.map((gift) => (
                <div key={gift.id} style={styles.giftItem}>
                  <div style={styles.giftHeader}>
                    <span style={styles.giftName}>{gift.giftName}</span>
                    <span 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(gift.status),
                      }}
                    >
                      {getStatusLabel(gift.status)}
                    </span>
                  </div>
                  <div style={styles.giftDetails}>
                    <span>From: {gift.senderId}</span>
                    <span>₦{gift.price.toLocaleString()}</span>
                    <span>{formatDate(gift.createdAt)}</span>
                  </div>
                  {gift.message && (
                    <p style={styles.giftMessage}>"{gift.message}"</p>
                  )}
                  {gift.status === 'pending' && gift.redemptionCode && (
                    <div style={styles.codeSection}>
                      <span style={styles.codeLabel}>Redemption Code:</span>
                      <span style={styles.codeValue}>{formatCode(gift.redemptionCode)}</span>
                      <button
                        onClick={() => handleCopyCode(gift.redemptionCode)}
                        style={styles.copyButton}
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {gift.status === 'pending' && gift.giftType === 'cash' && (
                    <div style={styles.redeemHint}>
                      <span>Go to Gifts → Redeem Gift to withdraw this cash gift</span>
                    </div>
                  )}
                  {gift.status === 'pending' && gift.giftType === 'service' && (
                    <div style={styles.redeemHint}>
                      <span>Present this code at any Vibra merchant to redeem</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Sent Gifts */}
        {activeTab === 'sent' && (
          <div style={styles.listContainer}>
            {sentGifts.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No gifts sent yet</p>
                <p style={styles.emptySubtext}>Go to Gifts → Send Gift to get started</p>
              </div>
            ) : (
              sentGifts.map((gift) => (
                <div key={gift.id} style={styles.giftItem}>
                  <div style={styles.giftHeader}>
                    <span style={styles.giftName}>{gift.giftName}</span>
                    <span 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(gift.status),
                      }}
                    >
                      {getStatusLabel(gift.status)}
                    </span>
                  </div>
                  <div style={styles.giftDetails}>
                    <span>To: {gift.recipientId}</span>
                    <span>₦{gift.price.toLocaleString()}</span>
                    <span>{formatDate(gift.createdAt)}</span>
                  </div>
                  {gift.message && (
                    <p style={styles.giftMessage}>"{gift.message}"</p>
                  )}
                  {gift.status === 'pending' && gift.redemptionCode && (
                    <div style={styles.codeSection}>
                      <span style={styles.codeLabel}>Redemption Code:</span>
                      <span style={styles.codeValue}>{formatCode(gift.redemptionCode)}</span>
                      <button
                        onClick={() => handleCopyCode(gift.redemptionCode)}
                        style={styles.copyButton}
                      >
                        Copy
                      </button>
                    </div>
                  )}
                  {gift.status === 'pending' && (
                    <div style={styles.pendingHint}>
                      <span>Recipient has not redeemed this gift yet</span>
                    </div>
                  )}
                  {gift.status === 'redeemed' && (
                    <div style={styles.redeemedHint}>
                      <span>✅ This gift has been redeemed</span>
                    </div>
                  )}
                  {gift.status === 'withdrawn' && (
                    <div style={styles.withdrawnHint}>
                      <span>💰 This cash gift has been withdrawn</span>
                    </div>
                  )}
                </div>
              ))
            )}
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
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid #e8e8e8',
    marginBottom: '16px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#6C3CE1',
    borderBottomColor: '#6C3CE1',
  },
  listContainer: {
    maxHeight: '450px',
    overflowY: 'auto',
  },
  giftItem: {
    border: '1px solid #e8e8e8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#fafafa',
  },
  giftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  giftName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    fontSize: '11px',
    padding: '2px 12px',
    borderRadius: '12px',
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  giftDetails: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: '#666',
    flexWrap: 'wrap',
    marginBottom: '4px',
  },
  giftMessage: {
    fontSize: '13px',
    color: '#555',
    fontStyle: 'italic',
    margin: '4px 0',
  },
  codeSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#f0edff',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  codeLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
  },
  codeValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#6C3CE1',
    fontFamily: 'monospace',
    letterSpacing: '2px',
  },
  copyButton: {
    padding: '4px 12px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  redeemHint: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#856404',
  },
  pendingHint: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#856404',
  },
  redeemedHint: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#2e7d32',
  },
  withdrawnHint: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: '#e8f5e9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#2e7d32',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#666',
    margin: '0 0 4px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '20px',
    fontSize: '14px',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: '14px',
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

export default MyGifts;