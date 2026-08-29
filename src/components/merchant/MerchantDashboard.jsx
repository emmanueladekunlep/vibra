/**
 * VIBRA - Merchant Dashboard Component
 * Module: Merchant Portal
 * 
 * Merchant dashboard with redemption history and stats.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as merchantService from '../../services/merchantService';
import * as codeService from '../../services/codeGeneratorService';
import CodeVerification from '../gifts/CodeVerification';
import MerchantRegistration from './MerchantRegistration';

const MerchantDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [merchant, setMerchant] = useState(null);
  const [stats, setStats] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRedemption, setShowRedemption] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [error, setError] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  useEffect(() => {
    loadMerchantData();
  }, [user]);

  const loadMerchantData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const merchantData = await merchantService.getMerchantByUserId(user.id);
      if (!merchantData) {
        setMerchant(null);
        setStats(null);
        setRedemptions([]);
        setIsLoading(false);
        return;
      }
      
      setMerchant(merchantData);
      
      const statsData = await merchantService.getMerchantStats(merchantData.id);
      setStats(statsData);
      
      const redemptionsData = await merchantService.getMerchantRedemptions(merchantData.id);
      setRedemptions(redemptionsData);
    } catch (err) {
      setError(err.message || 'Failed to load merchant data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedemption = async (code) => {
    if (!merchant) return;
    
    setError(null);
    setRedeemSuccess(null);
    
    try {
      const validation = await codeService.validateCode(code);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      
      const amount = validation.codeData.metadata?.amount || 3000;
      
      const result = await merchantService.processRedemption(
        merchant.id,
        code,
        amount
      );
      
      setRedeemSuccess(`Redeemed successfully! Payout: ₦${result.payout.toLocaleString()}`);
      
      await loadMerchantData();
      setShowRedemption(false);
    } catch (err) {
      setError(err.message || 'Failed to process redemption');
    }
  };

  const getTrustLevelLabel = (level) => {
    const labels = {
      new: 'New Merchant',
      trusted: 'Trusted Partner',
      partner: 'Premium Partner',
    };
    return labels[level] || level;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#00B894',
      suspended: '#e74c3c',
      pending: '#f39c12',
    };
    return colors[status] || '#666';
  };

  const getTrustColor = (level) => {
    const colors = {
      new: '#666',
      trusted: '#6C3CE1',
      partner: '#FFD700',
    };
    return colors[level] || '#666';
  };

  // Show registration form
  if (showRegistration) {
    return (
      <MerchantRegistration 
        onRegistered={() => {
          setShowRegistration(false);
          loadMerchantData();
        }}
        onClose={() => setShowRegistration(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading merchant data...</div>
        </div>
      </div>
    );
  }

  // Show "Register" prompt if not a merchant
  if (!merchant) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h3 style={styles.title}>Merchant Dashboard</h3>
            {onClose && (
              <button onClick={onClose} style={styles.closeButton}>
                Close
              </button>
            )}
          </div>

          <div style={styles.registerPrompt}>
            <div style={styles.registerIcon}>🏪</div>
            <h4 style={styles.registerTitle}>Become a Merchant</h4>
            <p style={styles.registerText}>
              Register your business to accept Vibra gifts and receive instant payouts.
            </p>
            <ul style={styles.registerList}>
              <li>✓ Accept gift redemptions</li>
              <li>✓ Instant payouts to your Opay wallet</li>
              <li>✓ 80% of gift value goes to you</li>
              <li>✓ BVN verification required</li>
            </ul>
            <button
              onClick={() => setShowRegistration(true)}
              style={styles.registerButton}
            >
              Register as Merchant
            </button>
          </div>

          <p style={styles.credit}>
            Powered by LabelReach
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Merchant Dashboard</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        {merchant && (
          <div style={styles.merchantInfo}>
            <h4 style={styles.merchantName}>{merchant.name}</h4>
            <div style={styles.merchantDetails}>
              <span style={styles.merchantDetail}>
                Status: 
                <span style={{ color: getStatusColor(merchant.status), fontWeight: '600' }}>
                  {' '}{merchant.status}
                </span>
              </span>
              <span style={styles.merchantDetail}>
                Trust: 
                <span style={{ color: getTrustColor(merchant.trustLevel), fontWeight: '600' }}>
                  {' '}{getTrustLevelLabel(merchant.trustLevel)}
                </span>
              </span>
            </div>
          </div>
        )}

        {stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{stats.totalRedemptions}</span>
              <span style={styles.statLabel}>Total Redemptions</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>₦{stats.totalRevenue.toLocaleString()}</span>
              <span style={styles.statLabel}>Total Revenue</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>₦{stats.monthRevenue.toLocaleString()}</span>
              <span style={styles.statLabel}>This Month</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>₦{stats.averagePayout.toLocaleString()}</span>
              <span style={styles.statLabel}>Avg. Payout</span>
            </div>
          </div>
        )}

        <div style={styles.actionContainer}>
          <button
            onClick={() => setShowRedemption(!showRedemption)}
            style={styles.actionButton}
          >
            {showRedemption ? 'Close Redemption' : 'Redeem Gift'}
          </button>
        </div>

        {showRedemption && (
          <div style={styles.redemptionPanel}>
            <CodeVerification
              onVerified={(result) => {
                if (result && result.code) {
                  handleRedemption(result.code);
                }
              }}
              onClose={() => setShowRedemption(false)}
            />
          </div>
        )}

        {redeemSuccess && (
          <div style={styles.successBox}>
            <p style={styles.successText}>{redeemSuccess}</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <div style={styles.historyContainer}>
          <h4 style={styles.historyTitle}>Redemption History</h4>
          
          {redemptions.length === 0 ? (
            <p style={styles.emptyText}>No redemptions yet</p>
          ) : (
            <div style={styles.historyList}>
              {redemptions.map((redemption) => (
                <div key={redemption.id} style={styles.historyItem}>
                  <div style={styles.historyLeft}>
                    <span style={styles.historyCode}>{redemption.code}</span>
                    <span style={styles.historyAmount}>₦{redemption.amount.toLocaleString()}</span>
                  </div>
                  <div style={styles.historyRight}>
                    <span style={styles.historyPayout}>+₦{redemption.payout.toLocaleString()}</span>
                    <span style={styles.historyDate}>
                      {new Date(redemption.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
    maxWidth: '550px',
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
  merchantInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  merchantName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  merchantDetails: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  merchantDetail: {
    fontSize: '13px',
    color: '#666',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  statItem: {
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    padding: '10px',
    borderRadius: '10px',
  },
  statNumber: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: '11px',
    color: '#888',
  },
  actionContainer: {
    marginBottom: '12px',
  },
  actionButton: {
    width: '100%',
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
  redemptionPanel: {
    marginBottom: '16px',
  },
  historyContainer: {
    borderTop: '2px solid #f0f0f0',
    paddingTop: '16px',
    marginTop: '8px',
  },
  historyTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
  },
  historyList: {
    maxHeight: '250px',
    overflowY: 'auto',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    marginBottom: '6px',
  },
  historyLeft: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  historyCode: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#6C3CE1',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },
  historyAmount: {
    fontSize: '13px',
    color: '#888',
  },
  historyRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  historyPayout: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#00B894',
  },
  historyDate: {
    fontSize: '11px',
    color: '#aaa',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    padding: '20px 0',
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
    fontWeight: '600',
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
  // Register prompt styles
  registerPrompt: {
    textAlign: 'center',
    padding: '20px 10px',
  },
  registerIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  registerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  registerText: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
    lineHeight: '1.6',
  },
  registerList: {
    textAlign: 'left',
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#555',
    lineHeight: '2',
  },
  registerButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#00B894',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
  },
};

export default MerchantDashboard;