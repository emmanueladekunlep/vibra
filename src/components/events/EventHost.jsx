/**
 * VIBRA - Event Host Component
 * Module: Events
 * 
 * Host an event with invite system for private events.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as eventService from '../../services/eventService';
import * as adminService from '../../services/adminService';

const EventHost = ({ onHosted, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxGuests: 50,
    type: 'open',
    entryGift: '',
    entryGiftPrice: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteSection, setShowInviteSection] = useState(false);

  // Load users when event type is private
  useEffect(() => {
    if (formData.type === 'private') {
      loadUsers();
      setShowInviteSection(true);
    } else {
      setShowInviteSection(false);
      setInvitedUsers([]);
    }
  }, [formData.type]);

  const loadUsers = async () => {
    try {
      const users = await adminService.getAllUsers();
      // Filter out current user
      const filtered = users.filter(u => u.id !== user?.id);
      setAllUsers(filtered);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleUser = (userId) => {
    setInvitedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (invitedUsers.length === allUsers.length) {
      setInvitedUsers([]);
    } else {
      setInvitedUsers(allUsers.map(u => u.id));
    }
  };

  const getFilteredUsers = () => {
    if (!searchQuery) return allUsers;
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('Please login to host an event');
      return;
    }

    // Validate invites for private events
    if (formData.type === 'private' && invitedUsers.length === 0) {
      setError('Please invite at least one person to a private event');
      return;
    }

    setIsLoading(true);
    try {
      const eventData = {
        ...formData,
        invitedUsers: formData.type === 'private' ? invitedUsers : [],
      };
      const event = await eventService.createEvent(user.id, eventData);
      
      // Store invited users in event metadata
      if (formData.type === 'private') {
        event.invitedUsers = invitedUsers;
      }
      
      setSuccess('Event created successfully!');
      
      if (onHosted) {
        onHosted(event);
      }
      
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Host an Event</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          Create an event for others to join
        </p>

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

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Event Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Friday Night Live"
              style={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Join us for a night of fun and connection..."
              style={{...styles.input, ...styles.textarea}}
              rows="3"
              disabled={isLoading}
            />
          </div>

          <div style={styles.row}>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={styles.input}
                min={getMinDate()}
                required
                disabled={isLoading}
              />
            </div>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                style={styles.input}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Yaba, Lagos"
              style={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          <div style={styles.row}>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Max Guests</label>
              <input
                type="number"
                name="maxGuests"
                value={formData.maxGuests}
                onChange={handleChange}
                style={styles.input}
                min="1"
                max="500"
                disabled={isLoading}
              />
            </div>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Event Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={styles.select}
                disabled={isLoading}
              >
                <option value="open">Open (Anyone can join)</option>
                <option value="private">Private (Invite only)</option>
                <option value="verified">Verified (Merchant/Brand)</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Entry Gift ID (optional)</label>
              <input
                type="text"
                name="entryGift"
                value={formData.entryGift}
                onChange={handleChange}
                placeholder="gift_123"
                style={styles.input}
                disabled={isLoading}
              />
            </div>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Entry Gift Price</label>
              <input
                type="number"
                name="entryGiftPrice"
                value={formData.entryGiftPrice}
                onChange={handleChange}
                placeholder="2000"
                style={styles.input}
                min="0"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Invite Section - Only shown for Private events */}
          {showInviteSection && (
            <div style={styles.inviteSection}>
              <div style={styles.inviteHeader}>
                <h4 style={styles.inviteTitle}>Invite People</h4>
                <span style={styles.inviteCount}>
                  {invitedUsers.length} invited
                </span>
              </div>
              
              <div style={styles.inviteActions}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  style={styles.searchInput}
                />
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={styles.selectAllButton}
                >
                  {invitedUsers.length === allUsers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={styles.userList}>
                {getFilteredUsers().length === 0 ? (
                  <p style={styles.emptyText}>No users found</p>
                ) : (
                  getFilteredUsers().map((u) => (
                    <div
                      key={u.id}
                      style={{
                        ...styles.userItem,
                        ...(invitedUsers.includes(u.id) ? styles.userItemSelected : {}),
                      }}
                      onClick={() => handleToggleUser(u.id)}
                    >
                      <span style={styles.userName}>{u.name || u.phone}</span>
                      <span style={styles.userPhone}>{u.phone}</span>
                      {invitedUsers.includes(u.id) && (
                        <span style={styles.invitedBadge}>✓</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Event'}
          </button>
        </form>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            Open events are visible to everyone. Private events require invitations.
            Verified events require merchant status and entry gifts.
            Vibra takes 20% commission on entry gifts.
          </p>
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
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
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
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '12px',
  },
  row: {
    display: 'flex',
    gap: '12px',
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
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '70px',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
    marginTop: '4px',
  },
  inviteSection: {
    borderTop: '2px solid #f0f0f0',
    paddingTop: '16px',
    marginTop: '8px',
    marginBottom: '16px',
  },
  inviteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  inviteTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
  },
  inviteCount: {
    fontSize: '13px',
    color: '#6C3CE1',
    fontWeight: '600',
  },
  inviteActions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  selectAllButton: {
    padding: '8px 14px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  userList: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    padding: '4px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  userItemSelected: {
    backgroundColor: '#f0edff',
    border: '1px solid #6C3CE1',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  userPhone: {
    fontSize: '12px',
    color: '#888',
  },
  invitedBadge: {
    fontSize: '14px',
    color: '#6C3CE1',
    fontWeight: '700',
    marginLeft: 'auto',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '20px 0',
    fontSize: '13px',
    margin: 0,
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
  infoBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f0edff',
    borderRadius: '10px',
  },
  infoText: {
    fontSize: '13px',
    color: '#555',
    margin: 0,
    lineHeight: '1.5',
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

export default EventHost;