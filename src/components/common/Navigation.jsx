/**
 * VIBRA - Navigation Component
 * Module: App Integration
 * 
 * Bottom navigation bar for the main app.
 * Brand colors: Purple #721CBB, Green #10964D
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Professional SVG Icons with brand colors
const Icons = {
  Home: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#721CBB' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/>
    </svg>
  ),
  Search: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#721CBB' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  Chat: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#721CBB' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  Gifts: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#721CBB' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12v10H4V12"/>
      <path d="M2 7h20v5H2z"/>
      <path d="M12 22V7"/>
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  Profile: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#721CBB' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Logout: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Icons.Home },
    { path: '/search', label: 'Search', icon: Icons.Search },
    { path: '/chat', label: 'Chat', icon: Icons.Chat },
    { path: '/gifts', label: 'Gifts', icon: Icons.Gifts },
    { path: '/profile', label: 'Profile', icon: Icons.Profile },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={styles.container}>
      <div style={styles.navBar}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navButton,
                ...(active ? styles.navButtonActive : {}),
              }}
            >
              <Icon active={active} />
              <span style={{
                ...styles.navLabel,
                ...(active ? styles.navLabelActive : {}),
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          <Icons.Logout />
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTop: '1px solid #f0ebf8',
    padding: '8px 0 14px 0',
    boxShadow: '0 -4px 20px rgba(114, 28, 187, 0.06)',
    zIndex: 100,
  },
  navBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 6px',
  },
  navButton: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '4px 2px',
    cursor: 'pointer',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    minWidth: '44px',
  },
  navButtonActive: {
    backgroundColor: '#f0ebf8',
    borderRadius: '10px',
  },
  navLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#999',
    transition: 'color 0.2s ease',
    letterSpacing: '0.3px',
  },
  navLabelActive: {
    color: '#721CBB',
    fontWeight: '600',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    padding: '4px 2px',
    cursor: 'pointer',
    borderRadius: '10px',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    minWidth: '44px',
    opacity: 0.5,
    transition: 'opacity 0.2s ease',
  },
};

export default Navigation;