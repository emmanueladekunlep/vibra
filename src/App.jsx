/**
 * VIBRA - Main App Component
 * Module: App Integration
 * 
 * Connects all 10 modules into a single application.
 * Uses React Router for navigation.
 * AuthProvider wraps everything for global auth state.
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

// Terms & Privacy Pages
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

// Settings Page
import Settings from './pages/Settings';

// Blocked Page
import Blocked from './pages/Blocked';

// Navigation
import Navigation from './components/common/Navigation';

// Styles
import './App.css';

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
    if (notif.eventId) {
      // Navigate to event details - handled by parent
    }
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setShowNotifications(false);
  };

  return (
    <div style={styles.layout}>
      <div style={styles.headerBar}>
        <span style={styles.headerTitle}>VIBRA</span>
        <div style={styles.headerActions}>
          {showInstall && (
            <button
              onClick={handleInstall}
              style={styles.installButton}
            >
              Install
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
                          ...(notif.read ? styles.notificationRead : {}),
                        }}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <span style={styles.notificationTitle}>{notif.title}</span>
                        <span style={styles.notificationMessage}>{notif.message}</span>
                        <span style={styles.notificationTime}>
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={clearAllNotifications}
                      style={styles.clearAllButton}
                    >
                      Mark all as read
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {children}
      </div>
      <Navigation />
    </div>
  );
};

/**
 * Home Page - with Pulsing Heartbeat Logo
 */
const HomePage = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [showEventHost, setShowEventHost] = React.useState(false);
  const [pulse, setPulse] = React.useState(false);

  // Heartbeat pulse every 1.5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  if (selectedEvent) {
    return (
      <EventDetails 
        eventId={selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    );
  }

  if (showEventHost) {
    return (
      <EventHost 
        onHosted={() => setShowEventHost(false)} 
        onClose={() => setShowEventHost(false)} 
      />
    );
  }

  return (
    <div style={styles.homeContainer}>
      {/* Hero Section - Pulsing Heartbeat Logo */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          {/* Logo with Pulse */}
          <div style={styles.logoContainer}>
            <div style={{
              ...styles.logoPulse,
              ...(pulse ? styles.logoPulseActive : {}),
            }}>
              <span style={styles.logoText}>VIBRA</span>
            </div>
            <div style={{
              ...styles.heartbeatLine,
              ...(pulse ? styles.heartbeatLineActive : {}),
            }}>
              <svg width="200" height="40" viewBox="0 0 200 40">
                <polyline
                  points="0,20 10,20 15,5 20,35 25,20 40,20 50,10 55,30 60,20 80,20 90,15 95,25 100,20 120,20 130,5 135,35 140,20 160,20 170,10 175,30 180,20 200,20"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    ...styles.heartbeatSvg,
                    ...(pulse ? styles.heartbeatSvgActive : {}),
                  }}
                />
                <circle
                  cx="200"
                  cy="20"
                  r="3"
                  fill="white"
                  style={{
                    ...styles.heartbeatDot,
                    ...(pulse ? styles.heartbeatDotActive : {}),
                  }}
                />
              </svg>
            </div>
          </div>
          {/* Tagline */}
          <p style={styles.heroTagline}>Connect. Vibe. Love.</p>
        </div>
      </div>

      <div style={styles.profileCard}>
        <div style={styles.profileCardHeader}>
          <div style={styles.profileCardAvatar}>
            {user?.photos && user.photos.length > 0 ? (
              <img src={user.photos[0].url} alt={user.name} style={styles.profileCardImg} />
            ) : (
              <div style={styles.profileCardPlaceholder}>{user?.name?.[0] || 'U'}</div>
            )}
          </div>
          <div style={styles.profileCardInfo}>
            <h2 style={styles.profileCardName}>{user?.name || 'User'}</h2>
            <p style={styles.profileCardLevel}>
              <span style={{ color: getLevelColor(user?.level) }}>●</span> {user?.level || 'Bronze'}
            </p>
            <p style={styles.profileCardPoints}>{user?.points || 0} points</p>
          </div>
          <div style={styles.profileCardBadge}>
            {user?.isVerified ? (
              <span style={styles.verifiedBadgeLarge}>Verified</span>
            ) : (
              <span style={styles.unverifiedBadge}>Get Verified</span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, background: 'linear-gradient(135deg, #721CBB, #8B5CF6)'}}>
          <span style={styles.statValue}>{user?.level || 'Bronze'}</span>
          <span style={styles.statLabel}>Level</span>
        </div>
        <div style={{...styles.statCard, background: 'linear-gradient(135deg, #10964D, #00D68F)'}}>
          <span style={styles.statValue}>{user?.points || 0}</span>
          <span style={styles.statLabel}>Points</span>
        </div>
        <div style={{...styles.statCard, background: 'linear-gradient(135deg, #721CBB, #10964D)'}}>
          <span style={styles.statValue}>
            {user?.isVerified ? '✓' : '⏳'}
          </span>
          <span style={styles.statLabel}>
            {user?.isVerified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Events Near You</h3>
        <button onClick={() => setShowEventHost(true)} style={styles.hostEventButton}>
          + Host
        </button>
      </div>

      <div style={styles.feedSection}>
        <EventList 
          onSelectEvent={(id) => setSelectedEvent(id)} 
          onHostEvent={() => setShowEventHost(true)} 
        />
      </div>
    </div>
  );
};

const getLevelColor = (level) => {
  const colors = {
    Bronze: '#CD7F32',
    Silver: '#C0C0C0',
    Gold: '#FFD700',
    Platinum: '#E5E4E2',
    Diamond: '#B9F2FF',
  };
  return colors[level] || '#CD7F32';
};

const ChatPage = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = React.useState(null);

  if (selectedChat) {
    return (
      <ChatWindow 
        conversationId={selectedChat.convId}
        otherUser={selectedChat.otherUser}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <ChatList 
      onSelectChat={(convId, otherUser) => setSelectedChat({ convId, otherUser })}
    />
  );
};

const ChatWindowPage = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [otherUser, setOtherUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadChat = async () => {
      try {
        const conv = await import('./services/chatService').then(m => m.getConversations(user.id));
        const found = conv.find(c => c.id === conversationId);
        if (found) {
          setOtherUser(found.otherUser);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    };
    if (conversationId && user) {
      loadChat();
    }
  }, [conversationId, user]);

  if (loading) {
    return <div style={styles.loading}>Loading chat...</div>;
  }

  if (!otherUser) {
    return <div style={styles.loading}>Conversation not found</div>;
  }

  return (
    <ChatWindow 
      conversationId={conversationId}
      otherUser={otherUser}
      onBack={() => window.history.back()}
    />
  );
};

const GiftsPage = () => {
  const { user } = useAuth();
  const [showGiftStore, setShowGiftStore] = React.useState(true);
  const [showRedemption, setShowRedemption] = React.useState(false);
  const [showCodeGen, setShowCodeGen] = React.useState(false);
  const [showBuyPoints, setShowBuyPoints] = React.useState(false);
  const [recipientId, setRecipientId] = React.useState('');

  if (showBuyPoints) {
    return (
      <BuyPoints 
        onClose={() => setShowBuyPoints(false)}
        onPurchaseComplete={() => setShowBuyPoints(false)}
      />
    );
  }

  if (showCodeGen) {
    return (
      <CodeGenerator 
        onClose={() => setShowCodeGen(false)} 
      />
    );
  }

  if (showRedemption) {
    return (
      <GiftRedemption 
        type="cash"
        onRedeemed={() => setShowRedemption(false)}
        onClose={() => setShowRedemption(false)}
      />
    );
  }

  if (showGiftStore) {
    return (
      <GiftStore 
        recipientId={recipientId || user?.id}
        onPurchase={() => setShowGiftStore(false)}
        onClose={() => setShowGiftStore(false)}
      />
    );
  }

  return (
    <div style={styles.giftsContainer}>
      <h3 style={styles.giftsTitle}>Gifts</h3>
      <div style={styles.giftsActions}>
        <button 
          onClick={() => setShowBuyPoints(true)} 
          style={{...styles.giftActionButton, backgroundColor: '#10964D', color: 'white'}}
        >
          Buy Points
        </button>
        <button 
          onClick={() => setShowGiftStore(true)} 
          style={styles.giftActionButton}
        >
          Send Gift
        </button>
        <button 
          onClick={() => setShowRedemption(true)} 
          style={{...styles.giftActionButton, backgroundColor: '#10964D'}}
        >
          Redeem Gift
        </button>
        {user?.level === 'Diamond' && (
          <button 
            onClick={() => setShowCodeGen(true)} 
            style={styles.giftActionButton}
          >
            Generate Codes
          </button>
        )}
      </div>
    </div>
  );
};

const ProfileDetailPage = () => {
  const { userId } = useParams();
  return (
    <div style={styles.profileContainer}>
      <Profile userId={userId} />
    </div>
  );
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showReferral, setShowReferral] = React.useState(false);
  const [showPoints, setShowPoints] = React.useState(false);
  const [showMerchant, setShowMerchant] = React.useState(false);
  const [showAdmin, setShowAdmin] = React.useState(false);
  const [showMyGifts, setShowMyGifts] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (user && user.isFounder === true) {
          setIsAdmin(true);
          return;
        }
        if (user && user.id) {
          const admin = await import('./services/adminService');
          const status = await admin.isAdmin(user.id);
          setIsAdmin(status);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      }
    };
    if (user && user.id) {
      checkAdmin();
    }
  }, [user]);

  if (!user || !user.id) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  if (showMyGifts) {
    return <MyGifts onClose={() => setShowMyGifts(false)} />;
  }

  if (showAdmin) {
    return (
      <AdminPanel onClose={() => setShowAdmin(false)} />
    );
  }

  if (showMerchant) {
    return (
      <MerchantDashboard onClose={() => setShowMerchant(false)} />
    );
  }

  if (showPoints) {
    return (
      <PointsHistory userId={user.id} />
    );
  }

  if (showReferral) {
    return (
      <ReferralSection />
    );
  }

  if (isEditing) {
    return (
      <EditProfile 
        userId={user.id} 
        onSave={() => setIsEditing(false)} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div style={styles.profileContainer}>
      <Profile 
        userId={user.id} 
        onEdit={() => setIsEditing(true)} 
      />
      
      <div style={styles.profileActions}>
        <button 
          onClick={() => setShowMyGifts(true)} 
          style={{...styles.profileActionButton, backgroundColor: '#10964D'}}
        >
          My Gifts
        </button>
        <button 
          onClick={() => setShowReferral(true)} 
          style={styles.profileActionButton}
        >
          Referral Code
        </button>
        <button 
          onClick={() => setShowPoints(true)} 
          style={styles.profileActionButton}
        >
          Points History
        </button>
        <button 
          onClick={() => setShowMerchant(true)} 
          style={styles.profileActionButton}
        >
          Merchant Dashboard
        </button>
        <button 
          onClick={() => navigate('/settings')} 
          style={styles.profileActionButton}
        >
          Settings
        </button>
        {isAdmin && (
          <button 
            onClick={() => setShowAdmin(true)} 
            style={{...styles.profileActionButton, backgroundColor: '#721CBB', color: 'white'}}
          >
            Admin Panel
          </button>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/referral" element={
            <ProtectedRoute>
              <ReferralInput />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <AppLayout>
                <SearchPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <AppLayout>
                <ChatPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat/:conversationId" element={
            <ProtectedRoute>
              <AppLayout>
                <ChatWindowPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/gifts" element={
            <ProtectedRoute>
              <AppLayout>
                <GiftsPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <AppLayout>
                <ProfileDetailPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/blocked" element={
            <ProtectedRoute>
              <AppLayout>
                <Blocked />
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

// ========== STYLES ==========
const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#888',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8f6fc',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#721CBB',
    color: 'white',
    flexShrink: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  installButton: {
    background: '#10964D',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBell: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '22px',
    cursor: 'pointer',
    position: 'relative',
    fontFamily: 'inherit',
    padding: '4px',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#FF6B35',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    minWidth: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '40px',
    right: '0',
    backgroundColor: 'white',
    color: '#1a1a1a',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    width: '320px',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '12px',
    zIndex: 100,
  },
  notificationItem: {
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.15s',
  },
  notificationRead: {
    opacity: 0.6,
  },
  notificationTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notificationMessage: {
    display: 'block',
    fontSize: '13px',
    color: '#666',
    marginTop: '2px',
  },
  notificationTime: {
    display: 'block',
    fontSize: '11px',
    color: '#999',
    marginTop: '4px',
  },
  noNotifications: {
    textAlign: 'center',
    color: '#999',
    padding: '20px 0',
    fontSize: '14px',
    margin: 0,
  },
  clearAllButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f0ebf8',
    color: '#721CBB',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '8px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '70px',
  },
  homeContainer: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
  },
  heroSection: {
    background: 'linear-gradient(135deg, #721CBB, #10964D)',
    borderRadius: '20px',
    padding: '30px 24px',
    marginBottom: '20px',
    color: 'white',
    textAlign: 'center',
    minHeight: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '8px',
  },
  logoText: {
    fontSize: '42px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  logoPulse: {
    transition: 'transform 0.1s ease',
    display: 'inline-block',
  },
  logoPulseActive: {
    transform: 'scale(1.05)',
  },
  heartbeatLine: {
    marginTop: '4px',
    opacity: 0.8,
  },
  heartbeatLineActive: {
    opacity: 1,
  },
  heartbeatSvg: {
    strokeDasharray: '400',
    strokeDashoffset: '400',
    transition: 'stroke-dashoffset 0.3s ease',
  },
  heartbeatSvgActive: {
    strokeDashoffset: '0',
  },
  heartbeatDot: {
    transition: 'all 0.3s ease',
    opacity: 0.3,
  },
  heartbeatDotActive: {
    opacity: 1,
    r: '4',
  },
  heroTagline: {
    fontSize: '14px',
    opacity: 0.9,
    letterSpacing: '4px',
    margin: 0,
    fontWeight: '300',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '20px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  profileCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  profileCardAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    border: '3px solid #721CBB',
  },
  profileCardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  profileCardPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    backgroundColor: '#721CBB',
  },
  profileCardInfo: {
    flex: 1,
  },
  profileCardName: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#1a1a1a',
  },
  profileCardLevel: {
    fontSize: '13px',
    margin: '2px 0',
    color: '#666',
  },
  profileCardPoints: {
    fontSize: '13px',
    margin: '0',
    color: '#888',
  },
  profileCardBadge: {
    flexShrink: 0,
  },
  verifiedBadgeLarge: {
    backgroundColor: '#10964D',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  unverifiedBadge: {
    backgroundColor: '#FF6B35',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '20px',
  },
  statCard: {
    padding: '14px',
    borderRadius: '14px',
    textAlign: 'center',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  statValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '700',
  },
  statLabel: {
    fontSize: '12px',
    opacity: 0.9,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
  },
  hostEventButton: {
    padding: '6px 16px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  feedSection: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  giftsContainer: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
  },
  giftsTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  giftsActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  giftActionButton: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#721CBB',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'center',
  },
  profileContainer: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
  },
  profileActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '16px',
  },
  profileActionButton: {
    padding: '12px',
    fontSize: '15px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#721CBB',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'center',
  },
};

export default App;