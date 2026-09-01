/**
 * VIBRA - Main App Component
 * Module: App Integration
 * 
 * Connects all 10 modules into a single application.
 * Uses React Router for navigation.
 * AuthProvider wraps everything for global auth state.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as eventService from './services/eventService';

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

// Navigation
import Navigation from './components/common/Navigation';

// Styles
import './App.css';

/**
 * Protected Route wrapper - redirects to login if not authenticated
 */
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

/**
 * Main App Layout with Navigation
 */
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // Get events where user is invited
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
      {/* Header with Notification Bell */}
      <div style={styles.headerBar}>
        <span style={styles.headerTitle}>VIBRA</span>
        <div style={styles.headerActions}>
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
 * Home Page - Feed/Discovery
 */
const HomePage = () => {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [showEventHost, setShowEventHost] = React.useState(false);

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
      <div style={styles.welcomeSection}>
        <h1 style={styles.welcomeTitle}>Welcome, {user?.name || 'User'}!</h1>
        <p style={styles.welcomeSubtitle}>Connect, Vibe, Love.</p>
      </div>

      {/* Quick Stats */}
      <div style={styles.quickStats}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{user?.level || 'Bronze'}</span>
          <span style={styles.statLabel}>Level</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{user?.points || 0}</span>
          <span style={styles.statLabel}>Points</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>
            {user?.isVerified ? 'Verified' : user?.isIdentityLocked ? 'Locked' : 'Pending'}
          </span>
          <span style={styles.statLabel}>
            {user?.isVerified ? 'Verified ✓' : user?.isIdentityLocked ? 'Identity Locked' : 'Pending Verification'}
          </span>
        </div>
      </div>

      {/* Events Feed */}
      <div style={styles.feedSection}>
        <EventList 
          onSelectEvent={(id) => setSelectedEvent(id)} 
          onHostEvent={() => setShowEventHost(true)} 
        />
      </div>
    </div>
  );
};

/**
 * Chat Page
 */
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

/**
 * Gifts Page
 */
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
          style={{...styles.giftActionButton, backgroundColor: '#FFD700', color: '#1a1a1a'}}
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
          style={{...styles.giftActionButton, backgroundColor: '#00B894'}}
        >
          Redeem Gift
        </button>
        {user?.level === 'Diamond' && (
          <button 
            onClick={() => setShowCodeGen(true)} 
            style={{...styles.giftActionButton, backgroundColor: '#6C3CE1'}}
          >
            Generate Codes
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Profile Page
 */
const ProfilePage = () => {
  const { user } = useAuth();
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
        const admin = await import('./services/adminService');
        const status = await admin.isAdmin(user?.id);
        setIsAdmin(status);
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      }
    };
    if (user) {
      checkAdmin();
    }
  }, [user]);

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
      <PointsHistory userId={user?.id} />
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
        userId={user?.id} 
        onSave={() => setIsEditing(false)} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div style={styles.profileContainer}>
      <Profile 
        userId={user?.id} 
        onEdit={() => setIsEditing(true)} 
      />
      
      <div style={styles.profileActions}>
        <button 
          onClick={() => setShowMyGifts(true)} 
          style={{...styles.profileActionButton, backgroundColor: '#00B894'}}
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
        {isAdmin && (
          <button 
            onClick={() => setShowAdmin(true)} 
            style={{...styles.profileActionButton, backgroundColor: '#FFD700', color: '#1a1a1a'}}
          >
            Admin Panel
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Main App Component
 */
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
    backgroundColor: '#f5f5f5',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#6C3CE1',
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
    backgroundColor: '#f0edff',
    color: '#6C3CE1',
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
  welcomeSection: {
    marginBottom: '20px',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  welcomeSubtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '14px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  statValue: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
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
    backgroundColor: '#6C3CE1',
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
    backgroundColor: '#6C3CE1',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'center',
  },
};

export default App;