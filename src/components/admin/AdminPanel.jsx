/**
 * VIBRA - Admin Panel Component
 * Module: Admin Panel
 * 
 * Main admin dashboard with analytics and navigation.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminService from '../../services/adminService';
import UserManagement from './UserManagement';
import VIPCodeGenerator from './VIPCodeGenerator';

const AdminPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      const adminStatus = await adminService.isAdmin(user.id);
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        await loadDashboardData();
      }
    } catch (err) {
      setError('Failed to check admin status');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [analyticsData, logsData] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getSystemLogs(20),
      ]);
      setAnalytics(analyticsData);
      setLogs(logsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.accessDenied}>Access denied. Admin privileges required.</p>
          <button onClick={onClose} style={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Admin Panel</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'dashboard' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'users' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'vip' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('vip')}
          >
            VIP Codes
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'logs' ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {activeTab === 'dashboard' && analytics && (
          <div style={styles.dashboard}>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{analytics.totalUsers}</span>
                <span style={styles.statLabel}>Total Users</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{analytics.activeUsers}</span>
                <span style={styles.statLabel}>Active</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>{analytics.verifiedUsers}</span>
                <span style={styles.statLabel}>Verified</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statValue}>₦{analytics.estimatedRevenue.toLocaleString()}</span>
                <span style={styles.statLabel}>Est. Revenue</span>
              </div>
            </div>

            <div style={styles.detailGrid}>
              <div style={styles.detailCard}>
                <h4 style={styles.detailTitle}>Level Distribution</h4>
                {Object.entries(analytics.levelDistribution).map(([level, count]) => (
                  <div key={level} style={styles.detailRow}>
                    <span style={styles.detailLabel}>{level}</span>
                    <span style={styles.detailValue}>{count}</span>
                  </div>
                ))}
              </div>
              <div style={styles.detailCard}>
                <h4 style={styles.detailTitle}>Platform Stats</h4>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Total Gifts</span>
                  <span style={styles.detailValue}>{analytics.totalGifts}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Total Events</span>
                  <span style={styles.detailValue}>{analytics.totalEvents}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Total Referrals</span>
                  <span style={styles.detailValue}>{analytics.totalReferrals}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Redemptions</span>
                  <span style={styles.detailValue}>{analytics.totalRedemptions}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Conversion Rate</span>
                  <span style={styles.detailValue}>{analytics.conversionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={styles.tabContent}>
            <UserManagement />
          </div>
        )}

        {activeTab === 'vip' && (
          <div style={styles.tabContent}>
            <VIPCodeGenerator />
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={styles.logsContainer}>
            <h4 style={styles.logsTitle}>System Logs</h4>
            {logs.length === 0 ? (
              <p style={styles.emptyText}>No logs available</p>
            ) : (
              <div style={styles.logsList}>
                {logs.map((log) => (
                  <div key={log.id} style={styles.logItem}>
                    <span style={styles.logTime}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span style={styles.logAction}>{log.action}</span>
                    <span style={styles.logDetails}>{log.details}</span>
                  </div>
                ))}
              </div>
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
    maxWidth: '700px',
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
    gap: '4px',
    borderBottom: '2px solid #e8e8e8',
    marginBottom: '20px',
    flexWrap: 'wrap',
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
  dashboard: {
    display: 'flex',
    flexDirection: 'column',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: '#f8f8f8',
    padding: '16px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  detailCard: {
    backgroundColor: '#f8f8f8',
    padding: '16px',
    borderRadius: '12px',
  },
  detailTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '13px',
    borderBottom: '1px solid #eee',
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tabContent: {
    minHeight: '200px',
  },
  logsContainer: {
    minHeight: '200px',
  },
  logsTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
  },
  logsList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  logItem: {
    display: 'flex',
    gap: '12px',
    padding: '8px 12px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    marginBottom: '4px',
    fontSize: '13px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  logTime: {
    color: '#888',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  logAction: {
    fontWeight: '600',
    color: '#6C3CE1',
  },
  logDetails: {
    color: '#555',
    flex: 1,
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
  accessDenied: {
    textAlign: 'center',
    color: '#c62828',
    fontSize: '16px',
    padding: '20px',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '40px',
    fontSize: '14px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '20px 0',
    fontStyle: 'italic',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    marginTop: '20px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
};

export default AdminPanel;