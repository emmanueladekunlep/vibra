/**
 * VIBRA - Navigation Component
 * Module: App Integration
 * 
 * Bottom navigation bar for the main app.
 * Professional design - no emojis.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/chat', label: 'Chat' },
    { path: '/gifts', label: 'Gifts' },
    { path: '/profile', label: 'Profile' },
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
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              ...styles.navButton,
              ...(isActive(item.path) ? styles.navButtonActive : {}),
            }}
          >
            <span style={styles.navLabel}>{item.label}</span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          <span style={styles.navLabel}>Logout</span>
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
    borderTop: '1px solid #e8e8e8',
    padding: '8px 0',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    zIndex: 100,
  },
  navBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 8px',
  },
  navButton: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '8px 4px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  navButtonActive: {
    backgroundColor: '#f0edff',
  },
  navLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    padding: '8px 4px',
    cursor: 'pointer',
    borderRadius: '8px',
    fontFamily: 'inherit',
  },
};

export default Navigation;