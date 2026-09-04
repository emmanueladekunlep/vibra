/**
 * VIBRA - Navigation Component
 * Module: App Integration
 * 
 * Bottom navigation bar for the main app.
 * Colorful design with brand colors.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: '🏠 Home' },
    { path: '/search', label: '🔍 Search' },
    { path: '/chat', label: '💬 Chat' },
    { path: '/gifts', label: '🎁 Gifts' },
    { path: '/profile', label: '👤 Profile' },
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
            <span style={styles.navIcon}>{item.label.split(' ')[0]}</span>
            <span style={{
              ...styles.navLabel,
              ...(isActive(item.path) ? styles.navLabelActive : {}),
            }}>
              {item.label.split(' ').slice(1).join(' ') || item.label}
            </span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          <span style={styles.navLabel}>🚪</span>
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
    borderTop: '2px solid #f0edff',
    padding: '6px 0 12px 0',
    boxShadow: '0 -4px 20px rgba(108, 60, 225, 0.08)',
    zIndex: 100,
  },
  navBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 4px',
  },
  navButton: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '4px 2px',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  navButtonActive: {
    backgroundColor: '#f0edff',
    transform: 'scale(1.05)',
  },
  navIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },
  navLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: '#999',
    transition: 'color 0.3s ease',
  },
  navLabelActive: {
    color: '#6C3CE1',
    fontWeight: '700',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    padding: '4px 2px',
    cursor: 'pointer',
    borderRadius: '12px',
    fontFamily: 'inherit',
    fontSize: '20px',
    opacity: 0.6,
    transition: 'opacity 0.3s ease',
  },
};

export default Navigation;