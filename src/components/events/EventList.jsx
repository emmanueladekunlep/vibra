/**
 * VIBRA - Event List Component
 * Module: Events
 * 
 * Browse and discover events.
 * Private events are only visible to invited users.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as eventService from '../../services/eventService';

const EventList = ({ onSelectEvent, onHostEvent }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const filters = {};
      if (filter === 'open') filters.type = 'open';
      else if (filter === 'private') filters.type = 'private';
      else if (filter === 'verified') filters.type = 'verified';
      
      let data = await eventService.getEvents(user.id, filters);
      
      // Filter private events: only show if user is invited or is the host
      if (filter === 'all' || filter === 'private') {
        data = data.filter(event => {
          // Show if event is not private
          if (event.type !== 'private') return true;
          // Show if user is the host
          if (event.hostId === user?.id) return true;
          // Show if user is invited
          if (event.invitedUsers && event.invitedUsers.includes(user?.id)) return true;
          // Hide private events if not invited
          return false;
        });
      }
      
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-NG', { 
      month: 'short', 
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
      open: 'Open',
      private: 'Private',
      verified: 'Verified',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      open: '#6C3CE1',
      private: '#e74c3c',
      verified: '#00B894',
    };
    return colors[type] || '#666';
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading events...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Events</h3>
          <button
            onClick={onHostEvent}
            style={styles.hostButton}
          >
            Host Event
          </button>
        </div>

        <div style={styles.filterContainer}>
          {['all', 'open', 'private', 'verified'].map((type) => (
            <button
              key={type}
              style={{
                ...styles.filterButton,
                ...(filter === type ? styles.filterActive : {}),
                ...(type === 'verified' ? { borderColor: '#00B894' } : {}),
              }}
              onClick={() => setFilter(type)}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No events found</p>
            <p style={styles.emptySubtext}>Be the first to host an event</p>
          </div>
        ) : (
          <div style={styles.eventList}>
            {events.map((event) => (
              <div
                key={event.id}
                style={styles.eventCard}
                onClick={() => onSelectEvent?.(event.id)}
              >
                <div style={styles.eventHeader}>
                  <span style={styles.eventTitle}>{event.title}</span>
                  <span
                    style={{
                      ...styles.eventType,
                      backgroundColor: getTypeColor(event.type),
                    }}
                  >
                    {getTypeLabel(event.type)}
                  </span>
                </div>
                
                <p style={styles.eventDescription}>
                  {event.description || 'No description'}
                </p>
                
                <div style={styles.eventDetails}>
                  <span style={styles.eventDetail}>
                    {formatDate(event.date)}
                  </span>
                  <span style={styles.eventDetail}>
                    {formatTime(event.time)}
                  </span>
                  <span style={styles.eventDetail}>
                    {event.location}
                  </span>
                </div>
                
                <div style={styles.eventFooter}>
                  <span style={styles.eventAttendees}>
                    {event.attendeeCount} / {event.maxGuests} attending
                  </span>
                  {event.entryGift && (
                    <span style={styles.eventGift}>
                      Entry Gift Required
                    </span>
                  )}
                  {event.userRSVP && (
                    <span style={styles.eventRSVP}>
                      RSVP'd
                    </span>
                  )}
                  {event.type === 'private' && event.invitedUsers && (
                    <span style={styles.inviteBadge}>
                      Invite Only
                    </span>
                  )}
                </div>
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
    maxWidth: '550px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
  },
  hostButton: {
    padding: '10px 16px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  filterContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px',
  },
  filterButton: {
    padding: '10px 16px',
    borderRadius: '20px',
    border: '2px solid #e0e0e0',
    backgroundColor: 'white',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    flex: '1 0 auto',
    minWidth: '60px',
    textAlign: 'center',
  },
  filterActive: {
    borderColor: '#6C3CE1',
    backgroundColor: '#f0edff',
    color: '#6C3CE1',
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  eventCard: {
    border: '2px solid #e8e8e8',
    borderRadius: '14px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },
  eventTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  eventType: {
    fontSize: '11px',
    padding: '2px 10px',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
    flexShrink: 0,
    marginLeft: '8px',
  },
  eventDescription: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 10px 0',
    lineHeight: '1.4',
  },
  eventDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    fontSize: '13px',
    color: '#555',
    marginBottom: '10px',
  },
  eventDetail: {
    backgroundColor: '#f5f5f5',
    padding: '2px 10px',
    borderRadius: '6px',
  },
  eventFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#888',
    flexWrap: 'wrap',
    gap: '4px',
  },
  eventAttendees: {
    fontWeight: '500',
  },
  eventGift: {
    color: '#e65100',
    fontWeight: '500',
    fontSize: '12px',
  },
  eventRSVP: {
    color: '#00B894',
    fontWeight: '600',
  },
  inviteBadge: {
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: '11px',
    backgroundColor: '#fde8e8',
    padding: '2px 10px',
    borderRadius: '10px',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
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
    marginBottom: '12px',
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

export default EventList;