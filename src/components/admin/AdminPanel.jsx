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
  
  const [gifts, setGifts] = useState([]);
  const [giftStats, setGiftStats] = useState(null);
  const [giftFilter, setGiftFilter] = useState('all');
  const [giftSearch, setGiftSearch] = useState('');

  useEffect(() => { checkAdminStatus(); }, [user]);

  const checkAdminStatus = async () => {
    if (!user) { setIsLoading(false); return; }
    try {
      const adminStatus = await adminService.isAdmin(user.id);
      setIsAdmin(adminStatus);
      if (adminStatus) {
        await loadDashboardData();
        await loadGifts();
      }
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

  const loadGifts = async () => {
    try {
      const [giftsData, statsData] = await Promise.all([
        adminService.getAllGifts(),
        adminService.getGiftStats(),
      ]);
      setGifts(giftsData);
      setGiftStats(statsData);
    } catch (err) {
      console.error('Failed to load gifts:', err);
    }
  };

  const handleUpdateGiftStatus = async (giftId, status) => {
    if (!confirm(`Mark this gift as ${status}?`)) return;
    try {
      await adminService.updateGiftStatus(giftId, status);
      await loadGifts();
    } catch (err) {
      setError(err.message || 'Failed to update gift');
    }
  };

  const handleWithdrawWithWhatsApp = (gift) => {
    if (!confirm(`Send withdrawal notification for ${gift.gift_name} (₦${parseFloat(gift.price).toLocaleString()}) to admin?`)) return;
    
    const amount = parseFloat(gift.price || 0);
    const fee = amount * 0.05;
    const payout = amount - fee;
    
    const message = `🔔 *VIBRA WITHDRAWAL REQUEST*
    
👤 *User ID:* ${gift.recipient_id}
👤 *Name:* ${gift.recipient_name || 'N/A'}
💰 *Gift:* ${gift.gift_name}
💵 *Amount:* ₦${amount.toLocaleString()}
📝 *Code:* ${gift.redemption_code}
📅 *Date:* ${new Date(gift.created_at).toLocaleString()}
💳 *Fee (5%):* ₦${fee.toLocaleString()}
💸 *Payout:* ₦${payout.toLocaleString()}

📤 *Payment Instructions:*
Send ₦${payout.toLocaleString()} to:
Opay: 07032977572
LabelReach Advertising Ltd

After payment, mark gift as Withdrawn in admin panel.

📎 Please attach screenshot of payment receipt.`;

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = '07032977572';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const getFilteredGifts = () => {
    let filtered = gifts;
    if (giftFilter !== 'all') {
      filtered = filtered.filter(g => g.status === giftFilter);
    }
    if (giftSearch.trim()) {
      const search = giftSearch.toLowerCase().trim();
      filtered = filtered.filter(g => 
        g.redemption_code?.toLowerCase().includes(search) ||
        g.gift_name?.toLowerCase().includes(search) ||
        g.sender_id?.toLowerCase().includes(search) ||
        g.recipient_id?.toLowerCase().includes(search)
      );
    }
    return filtered;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      redeemed: '#10964D',
      withdrawn: '#721CBB',
    };
    return colors[status] || '#666';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '⏳ Pending',
      redeemed: '✅ Redeemed',
      withdrawn: '💰 Withdrawn',
    };
    return labels[status] || status;
  };

  if (isLoading) return <div style={styles.container}><div style={styles.loading}>Loading admin panel...</div></div>;
  if (!isAdmin) return (
    <div style={styles.container}>
      <div style={styles.card}><p style={styles.accessDenied}>Access denied. Admin privileges required.</p><button onClick={onClose} style={styles.closeButton}>Close</button></div>
    </div>
  );

  const filteredGifts = getFilteredGifts();

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
            { id: 'gifts', label: 'Gifts' },
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
                <div style={styles.detailRow}><span style={styles.detailLabel}>Total Gifts</span><span style={styles.detailValue}>{giftStats?.total || 0}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Pending Gifts</span><span style={styles.detailValue}>{giftStats?.pending || 0}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Total Events</span><span style={styles.detailValue}>{analytics.totalEvents}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Total Referrals</span><span style={styles.detailValue}>{analytics.totalReferrals}</span></div>
                <div style={styles.detailRow}><span style={styles.detailLabel}>Conversion Rate</span><span style={{ ...styles.detailValue, color: '#10964D' }}>{analytics.conversionRate}%</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <div style={styles.tabContent}><UserManagement /></div>}

        {activeTab === 'gifts' && (
          <div style={styles.tabContent}>
            <div style={styles.giftStatsRow}>
              <div style={styles.giftStatBox}><span style={styles.giftStatNumber}>{giftStats?.total || 0}</span><span style={styles.giftStatLabel}>Total Gifts</span></div>
              <div style={{...styles.giftStatBox, borderLeft: '3px solid #f39c12'}}><span style={styles.giftStatNumber}>{giftStats?.pending || 0}</span><span style={styles.giftStatLabel}>Pending</span></div>
              <div style={{...styles.giftStatBox, borderLeft: '3px solid #10964D'}}><span style={styles.giftStatNumber}>{giftStats?.redeemed || 0}</span><span style={styles.giftStatLabel}>Redeemed</span></div>
              <div style={{...styles.giftStatBox, borderLeft: '3px solid #721CBB'}}><span style={styles.giftStatNumber}>{giftStats?.withdrawn || 0}</span><span style={styles.giftStatLabel}>Withdrawn</span></div>
              <div style={{...styles.giftStatBox, borderLeft: '3px solid #10964D'}}><span style={styles.giftStatNumber}>₦{(giftStats?.totalValue || 0).toLocaleString()}</span><span style={styles.giftStatLabel}>Total Value</span></div>
            </div>

            <div style={styles.giftFilterRow}>
              <select value={giftFilter} onChange={(e) => setGiftFilter(e.target.value)} style={styles.giftFilterSelect}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="redeemed">Redeemed</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              <input
                type="text"
                value={giftSearch}
                onChange={(e) => setGiftSearch(e.target.value)}
                placeholder="Search by code, name, sender, recipient..."
                style={styles.giftSearchInput}
              />
              <button onClick={() => { setGiftFilter('all'); setGiftSearch(''); }} style={styles.giftClearButton}>Clear</button>
            </div>

            <div style={styles.giftList}>
              {filteredGifts.length === 0 ? (
                <p style={styles.emptyText}>No gifts found</p>
              ) : (
                filteredGifts.map((gift) => (
                  <div key={gift.id} style={styles.giftItem}>
                    <div style={styles.giftItemHeader}>
                      <span style={styles.giftItemCode}>🔑 {gift.redemption_code || 'No code'}</span>
                      <span style={{...styles.giftItemStatus, backgroundColor: getStatusColor(gift.status)}}>
                        {getStatusLabel(gift.status)}
                      </span>
                    </div>
                    <div style={styles.giftItemDetails}>
                      <span><strong>Gift:</strong> {gift.gift_name}</span>
                      <span><strong>Type:</strong> {gift.gift_type}</span>
                      <span><strong>Price:</strong> ₦{parseFloat(gift.price || 0).toLocaleString()}</span>
                      <span><strong>Sender:</strong> {gift.sender_id}</span>
                      <span><strong>Recipient:</strong> {gift.recipient_id}</span>
                      {gift.message && <span><strong>Message:</strong> "{gift.message}"</span>}
                      <span><strong>Created:</strong> {formatDate(gift.created_at)}</span>
                      {gift.redeemed_at && <span><strong>Redeemed:</strong> {formatDate(gift.redeemed_at)}</span>}
                    </div>
                    {gift.status === 'pending' && (
                      <div style={styles.giftItemActions}>
                        <button 
                          onClick={() => handleUpdateGiftStatus(gift.id, 'redeemed')} 
                          style={{...styles.giftActionButton, backgroundColor: '#10964D'}}
                        >
                          Mark Redeemed
                        </button>
                        <button 
                          onClick={() => handleWithdrawWithWhatsApp(gift)} 
                          style={{...styles.giftActionButton, backgroundColor: '#25D366'}}
                        >
                          📱 Withdraw & Notify
                        </button>
                      </div>
                    )}
                    {gift.status === 'withdrawn' && (
                      <div style={{...styles.giftItemActions, borderTop: 'none', paddingTop: 0}}>
                        <span style={{fontSize: '12px', color: '#10964D', fontWeight: '600'}}>✅ Withdrawal processed</span>
                      </div>
                    )}
                    {gift.status === 'redeemed' && (
                      <div style={{...styles.giftItemActions, borderTop: 'none', paddingTop: 0}}>
                        <span style={{fontSize: '12px', color: '#721CBB', fontWeight: '600'}}>✅ Gift redeemed</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
  giftStatsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '16px' },
  giftStatBox: { backgroundColor: '#FAF8FF', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid #F3E8FF' },
  giftStatNumber: { display: 'block', fontSize: '20px', fontWeight: '800', color: '#1a1a1a' },
  giftStatLabel: { fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' },
  giftFilterRow: { display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' },
  giftFilterSelect: { padding: '8px 12px', border: '1.5px solid #E9E3F3', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white' },
  giftSearchInput: { flex: 1, padding: '8px 12px', border: '1.5px solid #E9E3F3', borderRadius: '8px', fontSize: '13px', outline: 'none', minWidth: '150px' },
  giftClearButton: { padding: '8px 16px', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#6B7280', cursor: 'pointer' },
  giftList: { maxHeight: '400px', overflowY: 'auto' },
  giftItem: { border: '1px solid #F3E8FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '10px', backgroundColor: '#FAF8FF' },
  giftItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  giftItemCode: { fontSize: '15px', fontWeight: '700', color: '#721CBB', fontFamily: 'monospace' },
  giftItemStatus: { padding: '2px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', color: 'white' },
  giftItemDetails: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '12px', color: '#4B5563' },
  giftItemActions: { display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F3E8FF' },
  giftActionButton: { padding: '5px 14px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: 'white', cursor: 'pointer' },
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