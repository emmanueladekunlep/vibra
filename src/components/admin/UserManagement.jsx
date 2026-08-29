/**
 * VIBRA - User Management Component
 * Module: Admin Panel
 * 
 * Manage users - suspend, verify, change levels, add points.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminService from '../../services/adminService';
import * as levelService from '../../services/levelService';
import * as authService from '../../services/authService';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    level: '',
    status: '',
    isVerified: '',
    search: '',
  });
  const [searchUserId, setSearchUserId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [actionState, setActionState] = useState({});

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getAllUsers(filters);
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchByUserId = () => {
    if (!searchUserId.trim()) {
      setSearchResult(null);
      return;
    }
    
    const result = authService.getUserByUserId(searchUserId.trim().toUpperCase());
    if (result) {
      setSearchResult(result);
      setError(null);
    } else {
      setSearchResult(null);
      setError(`User ID ${searchUserId} not found`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchByUserId();
    }
  };

  const handleSuspend = async (userId, reason) => {
    if (!confirm('Suspend this user?')) return;
    
    try {
      await adminService.suspendUser(userId, reason);
      setSuccess('User suspended');
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to suspend user');
    }
  };

  const handleReactivate = async (userId) => {
    if (!confirm('Reactivate this user?')) return;
    
    try {
      await adminService.reactivateUser(userId);
      setSuccess('User reactivated');
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to reactivate user');
    }
  };

  const handleChangeLevel = async (userId, level) => {
    if (!confirm(`Change level to ${level}?`)) return;
    
    try {
      await adminService.updateUser(userId, { level });
      setSuccess(`Level updated to ${level}`);
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to update level');
    }
  };

  const handleAddPoints = async (userId) => {
    const points = prompt('Enter points to add (positive number):');
    if (points === null) return;
    
    const numPoints = parseInt(points);
    if (isNaN(numPoints) || numPoints <= 0) {
      setError('Please enter a valid positive number');
      return;
    }
    
    try {
      await levelService.addPoints(userId, numPoints, 'admin_manual', 'Admin manually added points');
      setSuccess(`Added ${numPoints} points to user`);
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to add points');
    }
  };

  const handleDeductPoints = async (userId) => {
    const points = prompt('Enter points to deduct (positive number):');
    if (points === null) return;
    
    const numPoints = parseInt(points);
    if (isNaN(numPoints) || numPoints <= 0) {
      setError('Please enter a valid positive number');
      return;
    }
    
    try {
      await levelService.deductPoints(userId, numPoints, 'admin_manual', 'Admin manually deducted points');
      setSuccess(`Deducted ${numPoints} points from user`);
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to deduct points');
    }
  };

  const handleMarkVerified = async (userId) => {
    if (!confirm('Mark this user as verified?')) return;
    
    try {
      await adminService.updateUser(userId, { isVerified: true });
      setSuccess('User marked as verified');
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to mark user as verified');
    }
  };

  const handleUnmarkVerified = async (userId) => {
    if (!confirm('Remove verified status from this user?')) return;
    
    try {
      await adminService.updateUser(userId, { isVerified: false });
      setSuccess('User unverified');
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to remove verified status');
    }
  };

  const handleMarkWithdrawn = async (userId) => {
    if (!confirm('Mark this user as having withdrawn?')) return;
    
    try {
      await adminService.updateUser(userId, { hasWithdrawn: true });
      setSuccess('User marked as has withdrawn');
      await loadUsers();
      setSearchResult(null);
      setSearchUserId('');
    } catch (err) {
      setError(err.message || 'Failed to mark user as withdrawn');
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      Bronze: '#CD7F32',
      Silver: '#C0C0C0',
      Gold: '#FFD700',
      Platinum: '#E5E4E2',
      Diamond: '#B9F2FF',
    };
    return colors[level] || '#888';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#00B894',
      suspended: '#e74c3c',
      deactivated: '#888',
    };
    return colors[status] || '#888';
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading users...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>User Management</h4>
        <span style={styles.userCount}>{users.length} users</span>
      </div>

      {/* User ID Search */}
      <div style={styles.userIdSearch}>
        <span style={styles.userIdSearchLabel}>Search by User ID:</span>
        <input
          type="text"
          value={searchUserId}
          onChange={(e) => setSearchUserId(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="VIB-1001"
          style={styles.userIdInput}
        />
        <button onClick={handleSearchByUserId} style={styles.userIdSearchButton}>
          Search
        </button>
        <button 
          onClick={() => {
            setSearchUserId('');
            setSearchResult(null);
            setError(null);
          }} 
          style={styles.userIdClearButton}
        >
          Clear
        </button>
      </div>

      {/* Search Result */}
      {searchResult && (
        <div style={styles.searchResultCard}>
          <div style={styles.searchResultHeader}>
            <span style={styles.searchResultTitle}>User Found</span>
            <span style={styles.searchResultId}>{searchResult.userId}</span>
          </div>
          <div style={styles.searchResultDetails}>
            <span>Name: {searchResult.name}</span>
            <span>Phone: {searchResult.phone}</span>
            <span>Level: {searchResult.level}</span>
            <span>Points: {searchResult.points}</span>
            <span>Status: {searchResult.status}</span>
            <span>Verified: {searchResult.isVerified ? 'Yes' : 'No'}</span>
            <span>Withdrawn: {searchResult.hasWithdrawn ? 'Yes' : 'No'}</span>
          </div>
          <div style={styles.searchResultActions}>
            <select
              value={searchResult.level}
              onChange={(e) => handleChangeLevel(searchResult.id, e.target.value)}
              style={styles.actionSelect}
              disabled={searchResult.isFounder}
            >
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
            <button onClick={() => handleAddPoints(searchResult.id)} style={styles.pointsButton}>
              + Points
            </button>
            <button onClick={() => handleDeductPoints(searchResult.id)} style={styles.deductButton}>
              - Points
            </button>
            {searchResult.isVerified ? (
              <button onClick={() => handleUnmarkVerified(searchResult.id)} style={styles.unverifyButton}>
                Unverify
              </button>
            ) : (
              <button onClick={() => handleMarkVerified(searchResult.id)} style={styles.verifyButton}>
                Verify
              </button>
            )}
            {!searchResult.hasWithdrawn && (
              <button onClick={() => handleMarkWithdrawn(searchResult.id)} style={styles.withdrawButton}>
                Mark Withdrawn
              </button>
            )}
            {searchResult.status === 'active' ? (
              <button
                onClick={() => {
                  const reason = prompt('Reason for suspension:');
                  if (reason !== null) handleSuspend(searchResult.id, reason);
                }}
                style={styles.suspendButton}
                disabled={searchResult.isFounder}
              >
                Suspend
              </button>
            ) : (
              <button onClick={() => handleReactivate(searchResult.id)} style={styles.reactivateButton}>
                Reactivate
              </button>
            )}
          </div>
        </div>
      )}

      <div style={styles.filters}>
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name, phone, or location..."
          style={styles.searchInput}
        />
        <select
          name="level"
          value={filters.level}
          onChange={handleFilterChange}
          style={styles.filterSelect}
        >
          <option value="">All Levels</option>
          <option value="Bronze">Bronze</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
          <option value="Diamond">Diamond</option>
        </select>
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          style={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <select
          name="isVerified"
          value={filters.isVerified}
          onChange={handleFilterChange}
          style={styles.filterSelect}
        >
          <option value="">All Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
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

      <div style={styles.userList}>
        {users.length === 0 ? (
          <p style={styles.emptyText}>No users found</p>
        ) : (
          users.map((u) => (
            <div key={u.id} style={styles.userItem}>
              <div style={styles.userInfo}>
                <span style={styles.userName}>
                  <span style={styles.userIdTag}>{u.userId || 'N/A'}</span>
                  {u.name}
                  {u.isFounder && <span style={styles.founderBadge}>Founder</span>}
                  {u.isVIP && <span style={styles.vipBadge}>VIP</span>}
                  {u.isVerified && <span style={styles.verifiedBadge}>✓</span>}
                </span>
                <span style={styles.userDetails}>
                  {u.email || u.phone} | Level: 
                  <span style={{ color: getLevelColor(u.level), fontWeight: '600' }}>
                    {' '}{u.level}
                  </span>
                  {' '}| Status: 
                  <span style={{ color: getStatusColor(u.status), fontWeight: '600' }}>
                    {' '}{u.status}
                  </span>
                  {' '}| Points: {u.points}
                </span>
                <span style={styles.userMeta}>
                  Withdrawn: {u.hasWithdrawn ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div style={styles.userActions}>
                <select
                  value={u.level}
                  onChange={(e) => handleChangeLevel(u.id, e.target.value)}
                  style={styles.actionSelect}
                  disabled={u.isFounder}
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Diamond">Diamond</option>
                </select>
                <button
                  onClick={() => handleAddPoints(u.id)}
                  style={styles.pointsButton}
                  disabled={u.isFounder}
                >
                  + Points
                </button>
                <button
                  onClick={() => handleDeductPoints(u.id)}
                  style={styles.deductButton}
                  disabled={u.isFounder}
                >
                  - Points
                </button>
                {u.isVerified ? (
                  <button
                    onClick={() => handleUnmarkVerified(u.id)}
                    style={styles.unverifyButton}
                    disabled={u.isFounder}
                  >
                    Unverify
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkVerified(u.id)}
                    style={styles.verifyButton}
                    disabled={u.isFounder}
                  >
                    Verify
                  </button>
                )}
                {!u.hasWithdrawn && (
                  <button
                    onClick={() => handleMarkWithdrawn(u.id)}
                    style={styles.withdrawButton}
                    disabled={u.isFounder}
                  >
                    Mark Withdrawn
                  </button>
                )}
                {u.status === 'active' ? (
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for suspension:');
                      if (reason !== null) handleSuspend(u.id, reason);
                    }}
                    style={styles.suspendButton}
                    disabled={u.isFounder}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(u.id)}
                    style={styles.reactivateButton}
                    disabled={u.isFounder}
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p style={styles.credit}>
        Powered by LabelReach
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
  },
  userCount: {
    fontSize: '13px',
    color: '#888',
  },
  userIdSearch: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#f5f5f5',
    padding: '10px 14px',
    borderRadius: '10px',
  },
  userIdSearchLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#555',
  },
  userIdInput: {
    flex: 1,
    minWidth: '120px',
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'monospace',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    fontWeight: '600',
    letterSpacing: '1px',
  },
  userIdSearchButton: {
    padding: '8px 16px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  userIdClearButton: {
    padding: '8px 16px',
    backgroundColor: '#e0e0e0',
    color: '#555',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  searchResultCard: {
    backgroundColor: '#f0edff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    border: '2px solid #6C3CE1',
  },
  searchResultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  searchResultTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  searchResultId: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#6C3CE1',
    fontFamily: 'monospace',
  },
  searchResultDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 16px',
    fontSize: '13px',
    color: '#555',
    marginBottom: '10px',
  },
  searchResultActions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '150px',
    padding: '8px 12px',
    fontSize: '13px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  filterSelect: {
    padding: '8px 12px',
    fontSize: '13px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  userList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    marginBottom: '6px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  userInfo: {
    flex: 1,
    minWidth: '200px',
  },
  userName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  userIdTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#6C3CE1',
    backgroundColor: '#f0edff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  founderBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    backgroundColor: '#FFD700',
    color: '#1a1a1a',
    borderRadius: '4px',
    fontWeight: '700',
  },
  vipBadge: {
    fontSize: '10px',
    padding: '2px 8px',
    backgroundColor: '#B9F2FF',
    color: '#1a1a1a',
    borderRadius: '4px',
    fontWeight: '700',
  },
  verifiedBadge: {
    fontSize: '12px',
    color: '#00B894',
    fontWeight: '700',
  },
  userDetails: {
    display: 'block',
    fontSize: '13px',
    color: '#666',
  },
  userMeta: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
  },
  userActions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionSelect: {
    padding: '6px 10px',
    fontSize: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  pointsButton: {
    padding: '6px 12px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  deductButton: {
    padding: '6px 12px',
    backgroundColor: '#FF6B35',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  verifyButton: {
    padding: '6px 12px',
    backgroundColor: '#00B894',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  unverifyButton: {
    padding: '6px 12px',
    backgroundColor: '#888',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  withdrawButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  suspendButton: {
    padding: '6px 14px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  reactivateButton: {
    padding: '6px 14px',
    backgroundColor: '#00B894',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '10px',
    border: '1px solid #ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: '13px',
    margin: 0,
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '10px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '13px',
    margin: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '20px 0',
    fontStyle: 'italic',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '20px',
    fontSize: '14px',
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

export default UserManagement;