/**
 * VIBRA - Admin Panel Component - FIXED
 * Brand: #721CBB purple, #10964D green, pulsing logo
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminService from '../../services/adminService';
import UserManagement from './UserManagement';
import VIPCodeGenerator from './VIPCodeGenerator';

const MiniLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <span style={{ color: '#721CBB', fontWeight: 900, fontSize: 16 }}>VIB</span>
    <div style={{ width: 36, height: 12, margin: '0 -2px' }}>
      <svg width="100%" height="100%" viewBox="0 0 80 20" preserveAspectRatio="none">
        <path d="M0 10 L20 10 L24 2 L28 18 L32 10 L40 10 L48 10 L52 3 L56 17 L60 10 L80 10" stroke="#721CBB" strokeWidth="2.2" fill="none" strokeDasharray="14 160" className="adminPulse"/>
      </svg>
    </div>
    <span style={{ color: '#10964D', fontWeight: 900, fontSize: 16 }}>RA</span>
    <style>{`@keyframes adminP{0%{stroke-dashoffset:120}100%{stroke-dashoffset:-120}} .adminPulse{animation:adminP 1.3s linear infinite}`}</style>
  </div>
);

const AdminPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => { checkAdminStatus(); }, [user]);

  const checkAdminStatus = async () => {
    if (!user) { setIsLoading(false); return; }
    try {
      const adminStatus = await adminService.isAdmin(user.id);
      setIsAdmin(adminStatus);
      if (adminStatus) await loadDashboardData();
    } catch (err) { setError('Failed to check admin status'); }
    finally { setIsLoading(false); }
  };

  const loadDashboardData = async () => {
    try {
      const [analyticsData, logsData] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getSystemLogs(20),
      ]);
      setAnalytics(analyticsData);
      setLogs(logsData);
    } catch (err) { setError('Failed to load dashboard data'); }
  };

  if (isLoading) return <div style={styles.container}><div style={styles.loading}>Loading admin panel...</div></div>;
  if (!isAdmin) return (
    <div style={styles.container}>
      <div style={styles.card}><p style={styles.accessDenied}>Access denied. Admin privileges required.</p><button onClick={onClose} style={styles.closeButton}>Close</button></div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MiniLogo />
            <h3 style={styles.title}>Admin Panel</h3>
          </div>
          {onClose && <button onClick={onClose} style={styles.closeButton}>Close</button>}
        </div>

        <div style={styles.tabs}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'users', label: 'Users' },
            { id: 'vip', label: 'VIP Codes' },
            { id: 'logs', label: 'Logs' },
          ].map(t => (
            <button key={t.id} style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {error && <div style={styles.errorBox}><p style={styles.errorText}>{error}</p></div>}

        {activeTab === 'dashboard' && analytics && (
          <div style={styles.dashboard}>
            <div style={styles.statsGrid}>
              <div style={{ ...styles.statCard, borderLeft: '3px solid #721CBB' }}><span style={styles.statValue}>{analytics.totalUsers}</span><span style={styles.statLabel}>Total Users</span></div>
              <div style={{ ...styles.statCard, borderLeft: '3px solid #10964D' }}><span style={styles.statValue}>{analytics.activeUsers}</span><span style={styles.statLabel}>Active</span></div>
              <div style={{ ...styles.statCard, borderLeft: '3px solid #721CBB' }}><span style={styles.statValue}>{analytics.verifiedUsers}</span><span style={styles.statLabel}>Verified</span></div>
              <div style={{ ...styles.statCard, borderLeft: '3px solid #10964D' }}><span style={styles.statValue}>₦{analytics.estimatedRevenue.toLocaleString()}</span><span style={styles.statLabel}>Est. Revenue</span></div>
            </div>
            <div style={styles.detailGrid}>
              <div style={styles.detailCard}>
                <h4 style={styles.detailTitle}>Level Distribution</h4>
                {Object.entries(analytics.levelDistribution).map(([level, count]) => (
                  <div key={level} style={styles.detailRow}><span style={styles.detailLabel}>{level}</span><span style={styles.detailValue}>{count}</span></div>
                ))}
              </div>
              <div style={styles.detailCard}>
                <h4 style={styles.detailTitle}>Platform Stats</h4>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Total Gifts</span><span style={styles.detailValue}>{analytics.totalGifts}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Total Events</span><span style={styles.detailValue}>{analytics.totalEvents}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Total Referrals</span><span style={styles.detailValue}>{analytics.totalReferrals}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Redemptions</span><span style={styles.detailValue}>{analytics.totalRedemptions}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Conversion Rate</span><span style={{ ...styles.detailValue, color: '#10964D' }}>{analytics.conversionRate}%</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <div style={styles.tabContent}><UserManagement /></div>}
        {activeTab === 'vip' && <div style={styles.tabContent}><VIPCodeGenerator /></div>}
        {activeTab === 'logs' && (
          <div style={styles.logsContainer}>
            <h4 style={styles.logsTitle}>System Logs</h4>
            {logs.length === 0 ? <p style={styles.emptyText}>No logs available</p> : (
              <div style={styles.logsList}>
                {logs.map((log) => (
                  <div key={log.id} style={styles.logItem}>
                    <span style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</span>
                    <span style={styles.logAction}>{log.action}</span>
                    <span style={styles.logDetails}>{log.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <p style={styles.credit}>Powered by LabelReach</p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '16px', fontFamily: 'Inter, Poppins, sans-serif', backgroundColor: '#f8f7fb', minHeight: '100vh' },
  card: { backgroundColor: 'white', borderRadius: '20px', padding: '20px', maxWidth: '760px', width: '100%', boxShadow: '0 8px 32px rgba(114,28,187,0.08)', border: '1px solid #F3E8FF' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { fontSize: '18px', fontWeight: '800', color: '#1a1a1a', margin: 0 },
  closeButton: { background: '#F5F0FF', border: 'none', color: '#721CBB', fontSize: '13px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px', fontWeight: '600' },
  tabs: { display: 'flex', gap: '6px', borderBottom: '2px solid #F3E8FF', marginBottom: '18px', flexWrap: 'wrap' },
  tab: { padding: '10px 16px', backgroundColor: 'transparent', border: 'none', color: '#6B7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderBottom: '3px solid transparent', marginBottom: '-2px' },
  tabActive: { color: '#721CBB', borderBottomColor: '#721CBB', backgroundColor: '#F5F0FF', borderRadius: '8px 8px 0 0' },
  dashboard: { display: 'flex', flexDirection: 'column' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' },
  statCard: { backgroundColor: '#FAF8FF', padding: '14px', borderRadius: '12px', textAlign: 'center', border: '1px solid #F3E8FF' },
  statValue: { display: 'block', fontSize: '22px', fontWeight: '800', color: '#1a1a1a' },
  statLabel: { fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  detailCard: { backgroundColor: '#FAF8FF', padding: '14px', borderRadius: '12px', border: '1px solid #F3E8FF' },
  detailTitle: { fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px 0' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', borderBottom: '1px solid #F3E8FF' },
  detailLabel: { color: '#6B7280' },
  detailValue: { fontWeight: '700', color: '#1a1a1a' },
  tabContent: { minHeight: '200px' },
  logsContainer: { minHeight: '200px' },
  logsTitle: { fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px 0' },
  logsList: { maxHeight: '400px', overflowY: 'auto' },
  logItem: { display: 'flex', gap: '10px', padding: '8px 10px', backgroundColor: '#FAF8FF', borderRadius: '8px', marginBottom: '4px', fontSize: '12px', flexWrap: 'wrap' },
  logTime: { color: '#9CA3AF', fontSize: '10px' },
  logAction: { fontWeight: '700', color: '#721CBB' },
  logDetails: { color: '#4B5563', flex: 1 },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', border: '1px solid #FECACA' },
  errorText: { color: '#DC2626', fontSize: '13px', margin: 0 },
  accessDenied: { textAlign: 'center', color: '#DC2626', fontSize: '15px', padding: '20px', margin: 0 },
  loading: { textAlign: 'center', color: '#721CBB', padding: '40px', fontSize: '14px', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: '20px 0', fontSize: '13px' },
  credit: { textAlign: 'center', fontSize: '10px', color: '#C4B5D6', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid #F9F5FF' },
};

export default AdminPanel;
