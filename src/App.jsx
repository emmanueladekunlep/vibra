jsx
/**
 * VIBRA - Main App Component - FIXED with Pulsing Logo
 * Brand: Vib #721CBB purple, ra #10964D green, pulse always
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as eventService from './services/eventService';
import { connectWebSocket, disconnectWebSocket } from './services/chatService';

// Page Components
import Login from './components/auth/Login';
import ReferralInput from './components/auth/ReferralInput';
import Profile from './components/profile/Profile';
import EditProfile from './components/profile/EditProfile';
import ReferralSection from './components/profile/ReferralSection';
import LevelBadge from './components/profile/LevelBadge';
import PointsHistory from './components/profile/PointsHistory';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import GiftStore from './components/gifts/GiftStore';
import GiftRedemption from './components/gifts/GiftRedemption';
import CodeGenerator from './components/gifts/CodeGenerator';
import CodeVerification from './components/gifts/CodeVerification';
import MerchantRegistration from './components/merchant/MerchantRegistration';
import MerchantDashboard from './components/merchant/MerchantDashboard';
import EventList from './components/events/EventList';
import EventHost from './components/events/EventHost';
import EventDetails from './components/events/EventDetails';
import AdminPanel from './components/admin/AdminPanel';
import UserManagement from './components/admin/UserManagement';
import VIPCodeGenerator from './components/admin/VIPCodeGenerator';
import MyGifts from './components/gifts/MyGifts';
import BuyPoints from './components/gifts/BuyPoints';
import SearchPage from './components/search/SearchPage';

import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Settings from './pages/Settings';
import Blocked from './pages/Blocked';
import Navigation from './components/common/Navigation';
import './App.css';

// ===== VIBRA PULSING LOGO COMPONENT =====
const VibraLogo = ({ size = 'medium', showTagline = true, pulse = true }) => {
  const sizes = {
    small: { fontSize: 20, pulseW: 52, pulseH: 16, tagline: 7 },
    medium: { fontSize: 32, pulseW: 78, pulseH: 20, tagline: 8.5 },
    large: { fontSize: 44, pulseW: 110, pulseH: 26, tagline: 10 },
  };
  const s = sizes[size] || sizes.medium;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
        {/* VIB - Purple #721CBB */}
        <span style={{
          color: '#721CBB',
          fontWeight: 900,
          fontSize: s.fontSize,
          letterSpacing: '-1.8px',
          fontFamily: 'Poppins, Inter, sans-serif',
          textShadow: '0 1px 0 rgba(114,28,187,0.15)'
        }}>
          VIB
        </span>

        {/* Always Pulsing Heartbeat Line */}
        <div style={{
          width: s.pulseW,
          height: s.pulseH,
          margin: '0 -3px',
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg width="100%" height="100%" viewBox="0 0 80 20" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            {/* Base faint line */}
            <path
              d="M0 10 L20 10 L24 2 L28 18 L32 10 L40 10 L48 10 L52 3 L56 17 L60 10 L80 10"
              stroke="rgba(114,28,187,0.18)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* White pulsing line - always moving */}
            <path
              d="M0 10 L20 10 L24 2 L28 18 L32 10 L40 10 L48 10 L52 3 L56 17 L60 10 L80 10"
              stroke="white"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="16 180"
              className={pulse ? "vibra-pulse-line" : ""}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(114,28,187,0.7)) drop-shadow(0 0 2px white)',
              }}
            />
          </svg>
        </div>

        {/* RA - Green #10964D */}
        <span style={{
          color: '#10964D',
          fontWeight: 900,
          fontSize: s.fontSize,
          letterSpacing: '-1.8px',
          fontFamily: 'Poppins, Inter, sans-serif',
          position: 'relative',
          textShadow: '0 1px 0 rgba(16,150,77,0.15)'
        }}>
          RA
          {/* Heart inside A */}
          <span style={{
            position: 'absolute',
            top: '18%',
            right: '22%',
            fontSize: s.fontSize * 0.22,
            color: 'white',
            lineHeight: 1,
            textShadow: '0 0 2px rgba(16,150,77,0.8)'
          }}>♥</span>
        </span>
      </div>

      {showTagline && (
        <div style={{
          marginTop: 5,
          fontSize: s.tagline,
          letterSpacing: '3.8px',
          color: 'rgba(255,255,255,0.85)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase'
        }}>
          <span style={{ color: '#E9D5FF', fontSize: s.tagline * 0.8 }}>♥</span>
          CONNECT. VIBE. LOVE.
          <span style={{ color: '#BBF7D0', fontSize: s.tagline * 0.8 }}>♥</span>
        </div>
      )}

      <style>{`
        @keyframes vibraPulseTravel {
          0% { stroke-dashoffset: 140; }
          100% { stroke-dashoffset: -140; }
        }
        .vibra-pulse-line {
          animation: vibraPulseTravel 1.35s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Dark version for header (on white background)
const VibraLogoDark = ({ size = 'small' }) => {
  const sizes = {
    small: { fontSize: 20, pulseW: 52, pulseH: 16 },
    medium: { fontSize: 32, pulseW: 78, pulseH: 20 },
  };
  const s = sizes[size] || sizes.small;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}>
        <span style={{
          color: '#721CBB',
          fontWeight: 900,
          fontSize: s.fontSize,
          letterSpacing: '-1.5px',
          fontFamily: 'Poppins, Inter, sans-serif'
        }}>VIB</span>

        <div style={{ width: s.pulseW, height: s.pulseH, margin: '0 -3px', display: 'flex', alignItems: 'center' }}>
          <svg width="100%" height="100%" viewBox="0 0 80 20" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <path
              d="M0 10 L20 10 L24 2 L28 18 L32 10 L40 10 L48 10 L52 3 L56 17 L60 10 L80 10"
              stroke="#721CBB"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="16 180"
              className="vibra-pulse-line-dark"
            />
          </svg>
        </div>

        <span style={{
          color: '#10964D',
          fontWeight: 900,
          fontSize: s.fontSize,
          letterSpacing: '-1.5px',
          fontFamily: 'Poppins, Inter, sans-serif',
          position: 'relative'
        }}>
          RA
          <span style={{
            position: 'absolute',
            top: '18%',
            right: '22%',
            fontSize: s.fontSize * 0.22,
            color: 'white',
            lineHeight: 1
          }}>♥</span>
        </span>
      </div>
      <style>{`
        @keyframes vibraPulseTravelDark {
          0% { stroke-dashoffset: 140; }
          100% { stroke-dashoffset: -140; }
        }
        .vibra-pulse-line-dark {
          animation: vibraPulseTravelDark 1.35s linear infinite;
        }
      `}</style>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div style={styles.loading}>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    });
    window.addEventListener('appinstalled', () => {
      setShowInstall(false);
    });
  }, []);

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((result) => {
        if (result.outcome === 'accepted') {
          setShowInstall(false);
        }
      });
    }
  };

  useEffect(() => {
    if (user) {
      connectWebSocket(user.id);
      return () => {
        disconnectWebSocket();
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const events = await eventService.getEvents(user.id, { type: 'private' });
      const invites = events.filter(e => 
        e.invitedUsers?.includes(user.id) && e.hostId !== user.id
      );
      const notifs = invites.map(e => ({
        id: `invite_${e.id}`,
        type: 'event_invite',
        title: 'Event Invite',
        message: `${e.hostId} invited you to "${e.title}"`,
        eventId: e.id,
        read: false,
        createdAt: e.createdAt,
      }));
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif) => {
    setNotifications(prev => 
      prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
    );
    setShowNotifications(false);
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setShowNotifications(false);
  };

  return (
    <div style={styles.layout}>
      {/* HEADER WITH PULSING LOGO */}
      <div style={styles.headerBar}>
        <VibraLogoDark size="small" />
        <div style={styles.headerActions}>
          {showInstall && (
            <button onClick={handleInstall} style={styles.installButton}>
              📱 Install
            </button>
          )}
          <div style={styles.notificationContainer}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={styles.notificationBell}
            >
              🔔
              {unreadCount > 0 && (
                <span style={styles.notificationBadge}>{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div style={styles.notificationDropdown}>
                {notifications.length === 0 ? (
                  <p style={styles.noNotifications}>No notifications</p>
                ) : (
                  <>
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        style={{
                          ...styles.notificationItem,
                          ...(notif.read ? styles.notificationRead : {})
                        }}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <span style={styles.notificationTitle}>{notif.title}</span>
                        <span style={styles.notificationMessage}>{notif.message}</span>
                        <span style={styles.notificationTime}>
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <button onClick={clearAllNotifications} style={styles.clearAllButton}>
                      Clear all
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.content}>{children}</div>
      <Navigation />
    </div>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isFounder = user?.isFounder === true || user?.isFounder === 1;

  return (
    <div style={styles.homeContainer}>
      {/* HERO WITH PULSING LOGO + TAGLINE */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <VibraLogo size="large" showTagline={true} pulse={true} />
        </div>
      </div>

      {/* PROFILE CARD - As requested */}
      <div style={styles.profileCard}>
        <div style={styles.profileCardHeader}>
          <div style={styles.profileCardAvatar}>
            {user?.photos && user.photos.length > 0 ? (
              <img src={user.photos[0].url} alt={user.name} style={styles.profileCardImg} />
            ) : (
              <div style={styles.profileCardPlaceholder}>
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div style={styles.profileCardInfo}>
            <p style={styles.profileCardName}>{user?.name || 'User'}</p>
            <p style={styles.profileCardLevel}>{user?.level || 'Bronze'}</p>
            <p style={styles.profileCardPoints}>● {user?.points || 0} points</p>
          </div>
          <div style={styles.profileCardBadge}>
            {user?.isVerified ? (
              <span style={styles.verifiedBadgeLarge}>Verified</span>
            ) : isFounder ? (
              <span style={{...styles.verifiedBadgeLarge, backgroundColor: '#FFD700', color: '#1a1a1a'}}>👑</span>
            ) : null}
          </div>
        </div>

        {/* Stats from your screenshot */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><span style={{ color: '#721CBB' }}>◆</span></div>
            <span style={styles.statValue}>{user?.level || 'Bronze'}</span>
            <span style={styles.statLabel}>Level</span>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><span style={{ color: '#10964D' }}>◉</span></div>
            <span style={styles.statValue}>{user?.points || 0}</span>
            <span style={styles.statLabel}>Points</span>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}><span style={{ color: '#10964D' }}>✓</span></div>
            <span style={styles.statValue}>{user?.isVerified ? 'Verified' : 'Unverified'}</span>
            <span style={styles.statLabel}>Status</span>
          </div>
        </div>
      </div>

      {/* EVENTS NEAR YOU */}
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Events Near You</h3>
        <button style={styles.hostEventButton} onClick={() => navigate('/events/host')}>
          + Host
        </button>
      </div>

      <div style={styles.feedSection}>
        <EventList />
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 16 }}>
        <p style={{ fontSize: 11, color: '#999', letterSpacing: '0.5px' }}>Powered by LabelReach</p>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/referral" element={<ReferralInput />} />
          <Route path="/blocked" element={<Blocked />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><HomePage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout><Profile /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <AppLayout><EditProfile /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <AppLayout><ChatList /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <AppLayout><ChatWindow /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/gifts" element={
            <ProtectedRoute>
              <AppLayout><GiftStore /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/gifts/my" element={
            <ProtectedRoute>
              <AppLayout><MyGifts /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/gifts/buy" element={
            <ProtectedRoute>
              <AppLayout><BuyPoints /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/gifts/redeem" element={
            <ProtectedRoute>
              <AppLayout><GiftRedemption /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/gifts/code" element={
            <ProtectedRoute>
              <AppLayout><CodeGenerator /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/gifts/verify" element={
            <ProtectedRoute>
              <AppLayout><CodeVerification /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/merchant/register" element={
            <ProtectedRoute>
              <AppLayout><MerchantRegistration /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/merchant/dashboard" element={
            <ProtectedRoute>
              <AppLayout><MerchantDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <AppLayout><EventList /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/events/host" element={
            <ProtectedRoute>
              <AppLayout><EventHost /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/events/:eventId" element={
            <ProtectedRoute>
              <AppLayout><EventDetails /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <AppLayout><SearchPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout><Settings /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AppLayout><AdminPanel /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AppLayout><UserManagement /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/vip" element={
            <ProtectedRoute>
              <AppLayout><VIPCodeGenerator /></AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#721CBB',
  },
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f8f7fb',
    fontFamily: 'Inter, Poppins, sans-serif',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: 'white',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  installButton: {
    padding: '6px 12px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBell: {
    position: 'relative',
    backgroundColor: '#f8f7fb',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#FF3B30',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '46px',
    right: 0,
    width: '320px',
    maxHeight: '400px',
    overflowY: 'auto',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
    padding: '12px',
    zIndex: 200,
    border: '1px solid #f0f0f0',
  },
  notificationItem: {
    padding: '10px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #f8f7fb',
  },
  notificationRead: { opacity: 0.6 },
  notificationTitle: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#1a1a1a' },
  notificationMessage: { display: 'block', fontSize: '12px', color: '#666', marginTop: '2px' },
  notificationTime: { display: 'block', fontSize: '10px', color: '#999', marginTop: '4px' },
  noNotifications: { textAlign: 'center', color: '#999', padding: '20px 0', fontSize: '13px', margin: 0 },
  clearAllButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f5f0f8',
    color: '#721CBB',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  content: { flex: 1, overflowY: 'auto', paddingBottom: '70px' },
  homeContainer: { padding: '14px', maxWidth: '600px', margin: '0 auto', width: '100%' },
  heroSection: {
    background: 'linear-gradient(135deg, #721CBB 0%, #5B1FA8 40%, #10964D 100%)',
    borderRadius: '20px',
    padding: '28px 16px',
    marginBottom: '16px',
    color: 'white',
    textAlign: 'center',
    minHeight: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '14px 16px',
    marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    border: '1px solid #f5f0f8'
  },
  profileCardHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  profileCardAvatar: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    border: '2.5px solid #721CBB',
  },
  profileCardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  profileCardPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '800',
    color: 'white',
    backgroundColor: '#721CBB',
  },
  profileCardInfo: { flex: 1 },
  profileCardName: { fontSize: '16px', fontWeight: '800', margin: 0, color: '#1a1a1a' },
  profileCardLevel: { fontSize: '12px', margin: '1px 0', color: '#777' },
  profileCardPoints: { fontSize: '12px', margin: 0, color: '#721CBB', fontWeight: '700' },
  profileCardBadge: { flexShrink: 0 },
  verifiedBadgeLarge: {
    backgroundColor: '#10964D',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' },
  statCard: {
    backgroundColor: '#faf8ff',
    padding: '12px 8px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #f0e6ff'
  },
  statIcon: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 5px auto',
    fontSize: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  },
  statValue: { display: 'block', fontSize: '16px', fontWeight: '800', color: '#1a1a1a' },
  statLabel: { fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: '4px' },
  sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#1a1a1a', margin: 0 },
  hostEventButton: {
    padding: '6px 16px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  feedSection: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    minHeight: '200px',
    border: '1px solid #f5f0f8'
  },
};
export default App; 
