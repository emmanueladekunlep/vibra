/**
 * VIBRA - Event List Component - FIXED
 * Brand: Vib #721CBB, ra #10964D, with pulsing pulse on empty state
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
      if (filter === 'all' || filter === 'private') {
        data = data.filter(event => {
          if (event.type !== 'private') return true;
          if (event.hostId === user?.id) return true;
          if (event.invitedUsers && event.invitedUsers.includes(user?.id)) return true;
          return false;
        });
      }
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getTypeLabel = (type) => {
    const labels = { open: 'Open', private: 'Private', verified: 'Verified' };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = { open: '#721CBB', private: '#EF4444', verified: '#10964D' };
    return colors[type] || '#666';
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrap}>
          <div style={styles.pulseLoader} />
          <p style={styles.loadingText}>Loading events...</p>
        </div>
        <style>{`@keyframes pulseLoad{0%{transform:scale(0.9);opacity:0.7}50%{transform:scale(1.1);opacity:0.3}100%{transform:scale(0.9);opacity:0.7}}`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Events Near You</h3>
          <button onClick={onHostEvent} style={styles.hostButton}>
            + Host
          </button>
        </div>

        <div style={styles.filterContainer}>
          {['all', 'open', 'private', 'verified'].map((type) => {
            const isActive = filter === type;
            return (
              <button
                key={type}
                style={{
                  ...styles.filterButton,
                  ...(isActive ? styles.filterActive : {}),
                  ...(type === 'verified' && isActive ? styles.filterVerifiedActive : {}),
                  ...(type === 'private' && isActive ? styles.filterPrivateActive : {}),
                }}
                onClick={() => setFilter(type)}
              >
                {type === 'all' ? 'all' : getTypeLabel(type)}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {events.length === 0 ? (
          <div style={styles.emptyState}>
            {/* Pulsing Vibra Heartbeat for empty state */}
            <div style={styles.emptyIconWrap}>
              <svg width="120" height="32" viewBox="0 0 120 30" style={{ overflow: 'visible' }}>
                <path d="M0 15 L30 15 L36 4 L42 26 L48 15 L72 15 L78 6 L84 24 L90 15 L120 15"
                  stroke="#721CBB" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="18 200" className="emptyPulse"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(114,28,187,0.3))' }}
                />
              </svg>
            </div>
            <p style={styles.emptyText}>No events found</p>
            <p style={styles.emptySubtext}>Be the first to host an event</p>
            <button onClick={onHostEvent} style={styles.emptyHostButton}>
              Host Event
            </button>
          </div>
        ) : (
          <div style={styles.eventList}>
            {events.map((event) => (
              <div key={event.id} style={styles.eventCard} onClick={() => onSelectEvent?.(event.id)}>
                <div style={styles.eventHeader}>
                  <span style={styles.eventTitle}>{event.title}</span>
                  <span style={{ ...styles.eventType, backgroundColor: getTypeColor(event.type) }}>
                    {getTypeLabel(event.type)}
                  </span>
                </div>
                <p style={styles.eventDescription}>{event.description || 'No description'}</p>
                <div style={styles.eventDetails}>
                  <span style={styles.eventDetail}>{formatDate(event.date)}</span>
                  <span style={styles.eventDetail}>{formatTime(event.time)}</span>
                  <span style={styles.eventDetail}>{event.location}</span>
                </div>
                <div style={styles.eventFooter}>
                  <span style={styles.eventAttendees}>{event.attendeeCount} / {event.maxGuests} attending</span>
                  {event.entryGift && <span style={styles.eventGift}>Entry Gift Required</span>}
                  {event.userRSVP && <span style={styles.eventRSVP}>RSVP'd</span>}
                  {event.type === 'private' && <span style={styles.inviteBadge}>Invite Only</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={styles.credit}>Powered by LabelReach</p>
      </div>

      <style>{`
        @keyframes emptyPulseAnim {0%{stroke-dashoffset:180}100%{stroke-dashoffset:-180}}
        .emptyPulse { animation: emptyPulseAnim 1.6s linear infinite; }
      `}</style>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '12px 0', fontFamily: 'Inter, Poppins, sans-serif' },
  card: {
    backgroundColor: 'white',
    borderRadius: '18px',
    padding: '16px',
    maxWidth: '550px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(114,28,187,0.06)',
    border: '1px solid #F3E8FF',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  title: { fontSize: '17px', fontWeight: '800', color: '#1a1a1a', margin: 0, letterSpacing: '-0.3px' },
  hostButton: {
    padding: '7px 16px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  filterContainer: { display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '2px' },
  filterButton: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1.5px solid #E9E3F3',
    backgroundColor: 'white',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6B7280',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  filterActive: { borderColor: '#721CBB', backgroundColor: '#F5F0FF', color: '#721CBB', fontWeight: '700' },
  filterVerifiedActive: { borderColor: '#10964D', backgroundColor: '#E8F8EF', color: '#10964D' },
  filterPrivateActive: { borderColor: '#EF4444', backgroundColor: '#FEF2F2', color: '#EF4444' },
  eventList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' },
  eventCard: {
    border: '1.5px solid #F3E8FF',
    borderRadius: '14px',
    padding: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#FFFDFF',
  },
  eventHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' },
  eventTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a1a', flex: 1 },
  eventType: { fontSize: '10px', padding: '3px 10px', borderRadius: '20px', color: 'white', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  eventDescription: { fontSize: '13px', color: '#6B7280', margin: '0 0 10px 0', lineHeight: '1.4' },
  eventDetails: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' },
  eventDetail: { backgroundColor: '#F8F7FB', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', color: '#6B7280', fontWeight: '500' },
  eventFooter: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  eventAttendees: { fontSize: '11px', fontWeight: '600', color: '#374151' },
  eventGift: { color: '#D97706', fontWeight: '600', fontSize: '11px' },
  eventRSVP: { color: '#10964D', fontWeight: '700', fontSize: '11px' },
  inviteBadge: { color: '#DC2626', fontWeight: '600', fontSize: '10px', backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: '10px' },
  emptyState: { padding: '36px 20px', textAlign: 'center', backgroundColor: '#FAF8FF', borderRadius: '14px', border: '1px dashed #E9D5FF' },
  emptyIconWrap: { marginBottom: '14px', display: 'flex', justifyContent: 'center' },
  emptyText: { fontSize: '16px', fontWeight: '700', color: '#1F2937', margin: '0 0 4px 0' },
  emptySubtext: { fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px 0' },
  emptyHostButton: {
    padding: '10px 24px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px' },
  pulseLoader: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(114,28,187,0.15)', animation: 'pulseLoad 1.5s infinite' },
  loadingText: { fontSize: '13px', color: '#721CBB', marginTop: '12px', fontWeight: '600' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', border: '1px solid #FECACA' },
  errorText: { color: '#DC2626', fontSize: '13px', margin: 0 },
  credit: { textAlign: 'center', fontSize: '10px', color: '#C4B5D6', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #F9F5FF', letterSpacing: '0.3px' },
};

export default EventList;
