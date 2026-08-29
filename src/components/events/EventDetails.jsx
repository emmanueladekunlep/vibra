/**
 * VIBRA - Event Details Component
 * Module: Events
 * 
 * Event details with RSVP functionality and private event support.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as eventService from '../../services/eventService';
import * as adminService from '../../services/adminService';

const EventDetails = ({ eventId, onClose }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRSVPing, setIsRSVPing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [entryGiftCode, setEntryGiftCode] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [showInviteManager, setShowInviteManager] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await eventService.getEvent(eventId);
      setEvent(data);
      
      // Load invited users for private events
      if (data.type === 'private') {
        setInvitedUsers(data.invitedUsers || []);
      }
      
      const rsvps = await eventService.getEventRSVPs(eventId);
      setAttendees(rsvps);
    } catch (err) {
      setError('Failed to load event details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await adminService.getAllUsers();
      const filtered = users.filter(u => u.id !== user?.id);
      setAllUsers(filtered);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleToggleInvite = (userId) => {
    setInvitedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSaveInvites = async () => {
    setError(null);
    setSuccess(null);
    try {
      // Update event with new invited users
      await eventService.updateEvent(eventId, { invitedUsers });
      setSuccess('Invites updated successfully!');
      await loadEventDetails();
      setShowInviteManager(false);
    } catch (err) {
      setError(err.message || 'Failed to update invites');
    }
  };

  const handleRSVP = async () => {
    if (!user) {
      setError('Please login to RSVP');
      return;
    }

    setIsRSVPing(true);
    setError(null);
    setSuccess(null);

    try {
      const code = event.type === 'verified' ? entryGiftCode : null;
      const result = await eventService.rsvpEvent(eventId, user.id, code);
      setSuccess('RSVP confirmed!');
      await loadEventDetails();
    } catch (err) {
      setError(err.message || 'Failed to RSVP');
    } finally {
      setIsRSVPing(false);
    }
  };

  const handleCancelRSVP = async () => {
    if (!confirm('Cancel your RSVP?')) return;

    setIsRSVPing(true);
    setError(null);

    try {
      await eventService.cancelRSVP(eventId, user.id);
      setSuccess('RSVP cancelled');
      await loadEventDetails();
    } catch (err) {
      setError(err.message || 'Failed to cancel RSVP');
    } finally {
      setIsRSVPing(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-NG', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getTypeLabel = (type) => {
    const labels = {
      open: 'Open Event',
      private: 'Private Event',
      verified: 'Verified Event',
    };
    return labels[type] || type;
  };

  const isHost = user?.id === event?.hostId;
  const hasRSVP = attendees.some(a => a.userId === user?.id);
  const isInvited = event?.invitedUsers?.includes(user?.id);

  // Check if user can view this private event
  if (event?.type === 'private' && !isHost && !isInvited) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.accessDeniedText}>This is a private event. You have not been invited.</p>
          <button onClick={onClose} style={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.errorText}>{error || 'Event not found'}</p>
          <button onClick={onClose} style={styles.closeButton}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>{event.title}</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <div style={styles.typeBadge}>
          <span style={styles.typeText}>{getTypeLabel(event.type)}</span>
          {event.type === 'private' && (
            <span style={styles.privateBadge}>Invite Only</span>
          )}
        </div>

        <div style={styles.details}>
          <p style={styles.description}>{event.description || 'No description'}</p>
          
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Date:</span>
            <span style={styles.detailValue}>{formatDate(event.date)}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Time:</span>
            <span style={styles.detailValue}>{formatTime(event.time)}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Location:</span>
            <span style={styles.detailValue}>{event.location}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Attendees:</span>
            <span style={styles.detailValue}>
              {event.attendeeCount} / {event.maxGuests}
            </span>
          </div>
          {event.entryGift && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Entry Gift:</span>
              <span style={styles.detailValue}>Required (₦{event.entryGiftPrice?.toLocaleString() || '0'})</span>
            </div>
          )}
        </div>

        {/* Host Actions - Manage Invites */}
        {isHost && event.type === 'private' && (
          <div style={styles.hostInviteSection}>
            {!showInviteManager ? (
              <button
                onClick={() => {
                  setShowInviteManager(true);
                  loadAllUsers();
                }}
                style={styles.manageInviteButton}
              >
                Manage Invites ({invitedUsers.length})
              </button>
            ) : (
              <div style={styles.inviteManager}>
                <h4 style={styles.inviteManagerTitle}>Manage Invites</h4>
                <div style={styles.inviteActions}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    style={styles.searchInput}
                  />
                </div>
                <div style={styles.userList}>
                  {allUsers.filter(u => 
                    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.phone?.includes(searchQuery)
                  ).map((u) => (
                    <div
                      key={u.id}
                      style={{
                        ...styles.userItem,
                        ...(invitedUsers.includes(u.id) ? styles.userItemSelected : {}),
                      }}
                      onClick={() => handleToggleInvite(u.id)}
                    >
                      <span style={styles.userName}>{u.name || u.phone}</span>
                      <span style={styles.userPhone}>{u.phone}</span>
                      {invitedUsers.includes(u.id) && (
                        <span style={styles.invitedBadge}>✓</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={styles.inviteActionsRow}>
                  <button
                    onClick={() => setShowInviteManager(false)}
                    style={styles.cancelInviteButton}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInvites}
                    style={styles.saveInviteButton}
                  >
                    Save Invites
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {event.type === 'verified' && !hasRSVP && !isHost && (
          <div style={styles.giftInput}>
            <label style={styles.label}>Entry Gift Code</label>
            <input
              type="text"
              value={entryGiftCode}
              onChange={(e) => setEntryGiftCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              style={styles.codeInput}
              maxLength="6"
            />
          </div>
        )}

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

        {isHost ? (
          <div style={styles.hostActions}>
            <p style={styles.hostText}>You are the host of this event</p>
            <button
              onClick={handleCancelRSVP}
              style={styles.cancelButton}
              disabled={isRSVPing}
            >
              Cancel Event
            </button>
          </div>
        ) : hasRSVP ? (
          <button
            onClick={handleCancelRSVP}
            style={styles.cancelButton}
            disabled={isRSVPing}
          >
            Cancel RSVP
          </button>
        ) : event.attendeeCount >= event.maxGuests ? (
          <p style={styles.fullText}>Event is full</p>
        ) : (
          <button
            onClick={handleRSVP}
            style={styles.rsvpButton}
            disabled={isRSVPing || (event.type === 'verified' && !entryGiftCode)}
          >
            {isRSVPing ? 'Processing...' : 'RSVP'}
          </button>
        )}

        <div style={styles.attendeesSection}>
          <h4 style={styles.attendeesTitle}>Attendees ({attendees.length})</h4>
          {attendees.length === 0 ? (
            <p style={styles.emptyText}>No attendees yet</p>
          ) : (
            <div style={styles.attendeesList}>
              {attendees.slice(0, 20).map((rsvp) => (
                <span key={rsvp.id} style={styles.attendee}>
                  {rsvp.userId}
                </span>
              ))}
              {attendees.length > 20 && (
                <span style={styles.moreAttendees}>
                  +{attendees.length - 20} more
                </span>
              )}
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
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
    flex: 1,
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
  typeBadge: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  typeText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6C3CE1',
    backgroundColor: '#f0edff',
    padding: '4px 14px',
    borderRadius: '12px',
  },
  privateBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#e74c3c',
    backgroundColor: '#fde8e8',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  details: {
    marginBottom: '16px',
  },
  description: {
    fontSize: '15px',
    color: '#444',
    lineHeight: '1.6',
    margin: '0 0 12px 0',
  },
  detailRow: {
    display: 'flex',
    padding: '4px 0',
    fontSize: '14px',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#666',
    width: '90px',
    flexShrink: 0,
  },
  detailValue: {
    color: '#1a1a1a',
  },
  giftInput: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px',
  },
  codeInput: {
    width: '100%',
    padding: '12px',
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: '6px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  rsvpButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#00B894',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
    marginBottom: '12px',
  },
  cancelButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
    marginBottom: '12px',
  },
  hostActions: {
    textAlign: 'center',
    marginBottom: '12px',
  },
  hostText: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 8px 0',
  },
  fullText: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#e65100',
    fontWeight: '600',
    margin: '0 0 12px 0',
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
  attendeesSection: {
    borderTop: '2px solid #f0f0f0',
    paddingTop: '12px',
    marginTop: '4px',
  },
  attendeesTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  attendeesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  attendee: {
    fontSize: '13px',
    color: '#555',
    backgroundColor: '#f5f5f5',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  moreAttendees: {
    fontSize: '13px',
    color: '#888',
    fontStyle: 'italic',
    padding: '4px 8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
    textAlign: 'center',
    padding: '10px 0',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '40px',
    fontSize: '14px',
  },
  accessDeniedText: {
    textAlign: 'center',
    color: '#c62828',
    fontSize: '16px',
    padding: '20px',
    margin: 0,
  },
  hostInviteSection: {
    marginBottom: '12px',
  },
  manageInviteButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  inviteManager: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e0e0e0',
  },
  inviteManagerTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
  },
  inviteActions: {
    marginBottom: '10px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  userList: {
    maxHeight: '150px',
    overflowY: 'auto',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    padding: '4px',
    backgroundColor: 'white',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  userItemSelected: {
    backgroundColor: '#f0edff',
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
  },
  inviteActionsRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  cancelInviteButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  saveInviteButton: {
    flex: 2,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#00B894',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
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

export default EventDetails;