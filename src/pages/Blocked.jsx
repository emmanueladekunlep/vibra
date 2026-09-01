/**
 * VIBRA - Blocked Users Page
 * Module: Settings
 * 
 * Displays list of blocked users with unblock option.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as profileService from '../services/profileService';
import * as chatService from '../services/chatService';

const Blocked = () => {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unblocking, setUnblocking] = useState(null);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const blockedIds = await profileService.getBlockedUsers();
      const blockedArray = Array.isArray(blockedIds) ? blockedIds : [];
      
      // Get user details for each blocked ID
      const users = [];
      for (const id of blockedArray) {
        try {
          const user = await profileService.getProfile(id);
          if (user) {
            users.push(user);
          }
        } catch (err) {
          console.warn('Failed to get user:', id);
        }
      }
      setBlockedUsers(users);
    } catch (err) {
      setError('Failed to load blocked users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    if (!confirm('Unblock this user?')) return;
    
    setUnblocking(userId);
    try {
      await profileService.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError('Failed to unblock user');
      console.error(err);
    } finally {
      setUnblocking(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate('/settings')} style={styles.backButton}>
            ← Back
          </button>
          <h2 style={styles.title}>Blocked Users</h2>
          <div style={styles.headerSpacer}></div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {blockedUsers.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No blocked users</p>
            <p style={styles.emptySubtext}>Users you block will appear here</p>
          </div>
        ) : (
          <div style={styles.list}>
            {blockedUsers.map((user) => (
              <div key={user.id} style={styles.userItem}>
                <div style={styles.userInfo}>
                  <div style={styles.avatar}>
                    {user.photos && user.photos.length > 0 ? (
                      <img src={user.photos[0].url} alt={user.name} style={styles.avatarImage} />
                    ) : (
                      <div style={styles.avatarPlaceholder}>{user.name?.[0] || '?'}</div>
                    )}
                  </div>
                  <div>
                    <span style={styles.userName}>{user.name}</span>
                    <span style={styles.userPhone}>{user.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(user.id)}
                  disabled={unblocking === user.id}
                  style={styles.unblockButton}
                >
                  {unblocking === user.id ? '...' : 'Unblock'}
                </button>
              </div>
            ))}
          </div>
        )}

        <p style={styles.credit}>Powered by LabelReach</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#6C3CE1',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  headerSpacer: {
    width: '50px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
    flex: 1,
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#6C3CE1',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
  },
  userName: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '500',
    color: '#1a1a1a',
  },
  userPhone: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
  },
  unblockButton: {
    padding: '6px 16px',
    backgroundColor: '#00B894',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#666',
    margin: 0,
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999',
    margin: '4px 0 0 0',
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
    marginBottom: '16px',
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

export default Blocked;