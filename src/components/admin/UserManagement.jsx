/**
 * VIBRA - User Management Component - FIXED
 * Brand: #721CBB purple, #10964D green, no old #6C3CE1
 * All suspend/reactivate/points/VIP logic kept
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminService from '../../services/adminService';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.vibra.ng/api';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({ level: '', status: '', isVerified: '', search: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true); setError(null);
    try { const data = await adminService.getAllUsers(filters); setUsers(data); }
    catch (err) { setError('Failed to load users'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadUsers(); }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResult(null); return; }
    setSearching(true); setError(null);
    try {
      const response = await fetch(`${API_URL}/admin_users.php?search=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      if (data.success && data.users && data.users.length > 0) {
        const exactMatch = data.users.find(u => u.userId === searchQuery.trim().toUpperCase() || u.phone === searchQuery.trim());
        setSearchResult(exactMatch || data.users[0]);
      } else { setSearchResult(null); setError('User not found'); }
    } catch (err) { setError('Failed to search user'); }
    finally { setSearching(false); }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };
  const isCurrentUser = (userId) => String(userId) === String(user?.id);

  const handleSuspend = async (userId, reason) => {
    if (isCurrentUser(userId)) { setError('You cannot suspend your own account.'); return; }
    if (!confirm('Suspend this user?')) return;
    try { await adminService.suspendUser(userId, reason); setSuccess('User suspended'); await loadUsers(); setSearchResult(null); setSearchQuery(''); }
    catch (err) { setError(err.message || 'Failed to suspend user'); }
  };
  const handleReactivate = async (userId) => {
    if (isCurrentUser(userId)) { setError('You cannot reactivate your own account.'); return; }
    if (!confirm('Reactivate this user?')) return;
    try { await adminService.reactivateUser(userId); setSuccess('User reactivated'); await loadUsers(); setSearchResult(null); setSearchQuery(''); }
    catch (err) { setError(err.message || 'Failed to reactivate user'); }
  };
  const handleChangeLevel = async (userId, level) => {
    if (isCurrentUser(userId)) { setError('You cannot change your own level.'); return; }
    if (!confirm(`Change level to ${level}?`)) return;
    try { await adminService.updateUser(userId, { level }); setSuccess(`Level updated to ${level}`); await loadUsers(); setSearchResult(null); setSearchQuery(''); }
    catch (err) { setError(err.message || 'Failed to update level'); }
  };
  const handleAddPoints = async (userId) => {
    if (isCurrentUser(userId)) { setError('You cannot add points to yourself.'); return; }
    const points = prompt('Enter points to add (positive number):'); if (points === null) return;
    const numPoints = parseInt(points); if (isNaN(numPoints) || numPoints <= 0) { setError('Please enter a valid positive number'); return; }
    try {
      const response = await fetch(`${API_URL}/get_user.php?user_id=${userId}`); const data = await response.json();
      if (data.success) {
        const currentPoints = data.user.points || 0; const newPoints = currentPoints + numPoints;
        await adminService.updateUser(userId, { points: newPoints }); setSuccess(`Added ${numPoints} points (now ${newPoints})`); await loadUsers(); setSearchResult(null); setSearchQuery('');
      }
    } catch (err) { setError(err.message || 'Failed to add points'); }
  };
  const handleDeductPoints = async (userId) => {
    if (isCurrentUser(userId)) { setError('You cannot deduct points from yourself.'); return; }
    const points = prompt('Enter points to deduct:'); if (points === null) return;
    const numPoints = parseInt(points); if (isNaN(numPoints) || numPoints <= 0) { setError('Please enter a valid positive number'); return; }
    try {
      const response = await fetch(`${API_URL}/get_user.php?user_id=${userId}`); const data = await response.json();
      if (data.success) {
        const currentPoints = data.user.points || 0; const newPoints = Math.max(0, currentPoints - numPoints);
        await adminService.updateUser(userId, { points: newPoints }); setSuccess(`Deducted ${numPoints} points (now ${newPoints})`); await loadUsers(); setSearchResult(null); setSearchQuery('');
      }
    } catch (err) { setError(err.message || 'Failed to deduct points'); }
  };
  const handleVerify = async (userId) => {
    if (!confirm('Verify this user?')) return;
    try { await adminService.updateUser(userId, { isVerified: true }); setSuccess('User verified'); await loadUsers(); }
    catch (err) { setError(err.message || 'Failed to verify'); }
  };
  const handleUnverify = async (userId) => {
    if (!confirm('Unverify this user?')) return;
    try { await adminService.updateUser(userId, { isVerified: false }); setSuccess('User unverified'); await loadUsers(); }
    catch (err) { setError(err.message || 'Failed to unverify'); }
  };

  return (
    <div style={styles.container}>
      {error && <div style={styles.errorBox}><p style={styles.errorText}>{error}</p></div>}
      {success && <div style={styles.successBox}><p style={styles.successText}>{success}</p></div>}

      <div style={styles.searchContainer}>
        <div style={styles.searchRow}>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder="Search by User ID or Phone..." style={styles.searchInput} />
          <button onClick={handleSearch} style={styles.searchButton} disabled={searching}>{searching ? '...' : 'Search'}</button>
        </div>
        {searchResult && (
          <div style={styles.searchResult}>
            <div style={styles.searchResultHeader}>
              <span style={styles.searchResultTitle}>{searchResult.name}</span>
              <span style={styles.searchResultId}>{searchResult.userId}</span>
            </div>
            <div style={styles.searchResultDetails}>
              <span>📞 {searchResult.phone}</span><span>Level: {searchResult.level}</span><span>Points: {searchResult.points}</span>
            </div>
            <div style={styles.searchResultActions}>
              <button onClick={() => handleChangeLevel(searchResult.userId, 'Diamond')} style={styles.vipSelect}>Make Diamond</button>
              <button onClick={() => handleAddPoints(searchResult.userId)} style={styles.pointsButton}>+ Points</button>
              <button onClick={() => handleDeductPoints(searchResult.userId)} style={styles.deductButton}>- Points</button>
              <button onClick={() => handleSuspend(searchResult.userId, 'Admin action')} style={styles.suspendButton}>Suspend</button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.filters}>
        <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Filter by name..." style={styles.filterInput} />
        <select name="level" value={filters.level} onChange={handleFilterChange} style={styles.filterSelect}>
          <option value="">All Levels</option><option value="Bronze">Bronze</option><option value="Silver">Silver</option><option value="Gold">Gold</option><option value="Platinum">Platinum</option><option value="Diamond">Diamond</option>
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange} style={styles.filterSelect}>
          <option value="">All Status</option><option value="active">Active</option><option value="suspended">Suspended</option>
        </select>
      </div>

      {isLoading ? <p style={styles.loading}>Loading users...</p> : (
        <div style={styles.userList}>
          {users.length === 0 ? <p style={styles.emptyText}>No users found</p> : users.map(u => (
            <div key={u.userId} style={styles.userItem}>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{u.name} <span style={styles.userIdTag}>{u.userId}</span> {isCurrentUser(u.userId) && <span style={styles.selfBadge}>YOU</span>} {u.level === 'Diamond' && <span style={styles.vipBadge}>◆ Diamond</span>} {u.isVerified && <span style={styles.verifiedBadge}>✓</span>}</span>
                <span style={styles.userDetails}>{u.phone} • {u.level} • {u.points} pts</span>
              </div>
              <div style={styles.userActions}>
                <select onChange={(e) => { if (e.target.value) { handleChangeLevel(u.userId, e.target.value); e.target.value = ''; } }} style={styles.actionSelect} defaultValue="">
                  <option value="">Level</option><option value="Bronze">Bronze</option><option value="Silver">Silver</option><option value="Gold">Gold</option><option value="Platinum">Platinum</option><option value="Diamond">Diamond</option>
                </select>
                <button onClick={() => handleAddPoints(u.userId)} style={styles.pointsButton}>+</button>
                <button onClick={() => handleDeductPoints(u.userId)} style={styles.deductButton}>-</button>
                {u.isVerified ? <button onClick={() => handleUnverify(u.userId)} style={styles.unverifyButton}>Unverify</button> : <button onClick={() => handleVerify(u.userId)} style={styles.verifyButton}>Verify</button>}
                {u.status === 'suspended' ? <button onClick={() => handleReactivate(u.userId)} style={styles.reactivateButton}>Activate</button> : <button onClick={() => handleSuspend(u.userId, 'Admin')} style={styles.suspendButton}>Suspend</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={styles.credit}>Powered by LabelReach</p>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'Inter, Poppins, sans-serif' },
  searchContainer: { marginBottom: '14px' },
  searchRow: { display: 'flex', gap: '8px' },
  searchInput: { flex: 1, padding: '10px 14px', fontSize: '13px', border: '1.5px solid #E9E3F3', borderRadius: '10px', outline: 'none', backgroundColor: '#FAFAFF' },
  searchButton: { padding: '10px 18px', backgroundColor: '#721CBB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  searchResult: { marginTop: '10px', padding: '12px', backgroundColor: '#F5F0FF', borderRadius: '12px', border: '1.5px solid #E9D5FF' },
  searchResultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  searchResultTitle: { fontSize: '14px', fontWeight: '700', color: '#1a1a1a' },
  searchResultId: { fontSize: '13px', fontWeight: '700', color: '#721CBB', fontFamily: 'monospace', backgroundColor: 'white', padding: '2px 8px', borderRadius: '6px' },
  searchResultDetails: { display: 'flex', gap: '12px', fontSize: '12px', color: '#6B7280', marginBottom: '10px', flexWrap: 'wrap' },
  searchResultActions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  filters: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
  filterInput: { flex: 1, minWidth: '150px', padding: '9px 12px', fontSize: '13px', border: '1.5px solid #E9E3F3', borderRadius: '10px', outline: 'none', backgroundColor: 'white' },
  filterSelect: { padding: '9px 12px', fontSize: '13px', border: '1.5px solid #E9E3F3', borderRadius: '10px', outline: 'none', backgroundColor: 'white' },
  userList: { maxHeight: '420px', overflowY: 'auto' },
  userItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#FAF8FF', borderRadius: '12px', marginBottom: '6px', flexWrap: 'wrap', gap: '8px', border: '1px solid #F3E8FF' },
  userInfo: { flex: 1, minWidth: '200px' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  userIdTag: { fontSize: '10px', fontWeight: '700', color: '#721CBB', backgroundColor: '#F5F0FF', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace', border: '1px solid #E9D5FF' },
  selfBadge: { fontSize: '9px', padding: '2px 8px', backgroundColor: '#FEF08A', color: '#1a1a1a', borderRadius: '4px', fontWeight: '800' },
  vipBadge: { fontSize: '9px', padding: '2px 8px', backgroundColor: '#721CBB', color: 'white', borderRadius: '4px', fontWeight: '700' },
  verifiedBadge: { fontSize: '12px', color: '#10964D', fontWeight: '700' },
  userDetails: { display: 'block', fontSize: '12px', color: '#6B7280', marginTop: '2px' },
  userActions: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' },
  actionSelect: { padding: '6px 10px', fontSize: '11px', border: '1.5px solid #E9E3F3', borderRadius: '8px', backgroundColor: 'white' },
  vipSelect: { padding: '6px 12px', fontSize: '11px', border: '1.5px solid #721CBB', borderRadius: '8px', backgroundColor: '#F5F0FF', fontWeight: '700', color: '#721CBB', cursor: 'pointer' },
  pointsButton: { padding: '6px 12px', backgroundColor: '#721CBB', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  deductButton: { padding: '6px 12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  verifyButton: { padding: '6px 12px', backgroundColor: '#10964D', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  unverifyButton: { padding: '6px 12px', backgroundColor: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  suspendButton: { padding: '6px 12px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  reactivateButton: { padding: '6px 12px', backgroundColor: '#10964D', color: 'white', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px', border: '1px solid #FECACA' },
  errorText: { color: '#DC2626', fontSize: '12px', margin: 0 },
  successBox: { backgroundColor: '#ECFDF5', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px', border: '1px solid #A7F3D0' },
  successText: { color: '#065F46', fontSize: '12px', margin: 0 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: '20px 0', fontSize: '13px' },
  loading: { textAlign: 'center', color: '#721CBB', padding: '20px', fontSize: '13px', fontWeight: '600' },
  credit: { textAlign: 'center', fontSize: '10px', color: '#C4B5D6', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F9F5FF' },
};

export default UserManagement;
