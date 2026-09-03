/**
 * VIBRA - Points History Component
 * Module: Levels & Points Engine
 * 
 * Displays points transaction history.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as levelService from '../../services/levelService';

const PointsHistory = ({ userId, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const isOwner = user?.id === userId;

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const data = await levelService.getPointsHistory(userId);
        setHistory(data);
      } catch (error) {
        console.error('Failed to load points history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOwner) {
      loadHistory();
    }
  }, [userId, isOwner]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const getSourceLabel = (source) => {
    const labels = {
      referral_given: 'Referral (You referred someone)',
      referral_received: 'Referral (Friend joined)',
      daily_login: 'Daily Login Bonus',
      gift_sent: 'Gift Sent',
      level_purchase: 'Level Purchase',
      vip_bonus: 'VIP Bonus',
      event_host: 'Hosted Event',
      event_attend: 'Attended Event',
      date_completed: 'Date Completed',
      boost_used: 'Boost Used',
    };
    return labels[source] || source;
  };

  const getSourceColor = (source) => {
    const colors = {
      referral_given: '#00B894',
      referral_received: '#00B894',
      daily_login: '#6C3CE1',
      gift_sent: '#FF6B35',
      level_purchase: '#FFD700',
      vip_bonus: '#B9F2FF',
      event_host: '#FF6B35',
      event_attend: '#6C3CE1',
      date_completed: '#00B894',
      boost_used: '#e74c3c',
    };
    return colors[source] || '#666';
  };

  const getFilteredHistory = () => {
    if (filter === 'all') return history;
    if (filter === 'earned') return history.filter(h => h.points > 0);
    if (filter === 'spent') return history.filter(h => h.points < 0);
    return history;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (msgDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (msgDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalEarned = history.reduce((sum, h) => h.points > 0 ? sum + h.points : sum, 0);
  const totalSpent = history.reduce((sum, h) => h.points < 0 ? sum + Math.abs(h.points) : sum, 0);

  if (!isOwner) {
    return (
      <div style={styles.container}>
        <div style={styles.accessDenied}>
          <p style={styles.accessDeniedText}>You cannot view this history</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading history...</div>
      </div>
    );
  }

  const filteredHistory = getFilteredHistory();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Points History</h3>
          <button onClick={handleClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.summary}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryNumber}>{history.length}</span>
            <span style={styles.summaryLabel}>Transactions</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryNumber}>{totalEarned}</span>
            <span style={styles.summaryLabel}>Earned</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryNumber}>{totalSpent}</span>
            <span style={styles.summaryLabel}>Spent</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryNumber}>{totalEarned - totalSpent}</span>
            <span style={styles.summaryLabel}>Balance</span>
          </div>
        </div>

        <div style={styles.filterContainer}>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterActive : {}),
            }}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'earned' ? styles.filterActive : {}),
            }}
            onClick={() => setFilter('earned')}
          >
            Earned
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'spent' ? styles.filterActive : {}),
            }}
            onClick={() => setFilter('spent')}
          >
            Spent
          </button>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No points transactions yet</p>
            <p style={styles.emptySubtext}>Start earning points by referring friends or using the platform</p>
          </div>
        ) : (
          <div style={styles.list}>
            {filteredHistory.map((entry, index) => (
              <div key={entry.id || index} style={styles.historyItem}>
                <div style={styles.historyLeft}>
                  <div 
                    style={{
                      ...styles.historyDot,
                      backgroundColor: getSourceColor(entry.source),
                    }}
                  />
                  <div style={styles.historyInfo}>
                    <span style={styles.historySource}>
                      {getSourceLabel(entry.source)}
                    </span>
                    {entry.description && (
                      <span style={styles.historyDescription}>
                        {entry.description}
                      </span>
                    )}
                    <span style={styles.historyTime}>
                      {formatDate(entry.created_at || entry.timestamp)}
                    </span>
                  </div>
                </div>
                <span 
                  style={{
                    ...styles.historyPoints,
                    ...(entry.points > 0 ? styles.historyPointsPositive : styles.historyPointsNegative),
                  }}
                >
                  {entry.points > 0 ? '+' : ''}{entry.points}
                </span>
              </div>
            ))}
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
    maxWidth: '500px',
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
    fontSize: '20px',
    color: '#666',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  summaryItem: {
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    padding: '12px 8px',
    borderRadius: '10px',
  },
  summaryNumber: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#888',
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
  list: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f5f5f5',
    gap: '12px',
  },
  historyLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
    minWidth: 0,
  },
  historyDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    marginTop: '4px',
  },
  historyInfo: {
    flex: 1,
    minWidth: 0,
  },
  historySource: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a1a1a',
  },
  historyDescription: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
  },
  historyTime: {
    display: 'block',
    fontSize: '11px',
    color: '#aaa',
    marginTop: '2px',
  },
  historyPoints: {
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
  },
  historyPointsPositive: {
    color: '#00B894',
  },
  historyPointsNegative: {
    color: '#e74c3c',
  },
  emptyState: {
    padding: '30px 20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '13px',
    color: '#999',
    marginTop: '4px',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '20px',
    fontSize: '14px',
  },
  accessDenied: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: '16px',
    color: '#c62828',
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

export default PointsHistory;