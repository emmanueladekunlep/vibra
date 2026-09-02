/**
 * VIBRA - Settings Page
 * Module: Settings
 * 
 * User settings with PIN change, privacy, notifications, etc.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!currentPin || currentPin.length !== 4) {
      setError('Please enter your current 4-digit PIN');
      return;
    }

    if (!newPin || newPin.length !== 4) {
      setError('Please enter a new 4-digit PIN');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      // First verify current PIN via login
      const verifyRes = await fetch('https://api.vibra.ng/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, pin: currentPin })
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        setError('Current PIN is incorrect');
        setIsLoading(false);
        return;
      }

      // Update PIN
      const updateRes = await fetch('https://api.vibra.ng/api/reset_pin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, pin: newPin })
      });
      const updateData = await updateRes.json();

      if (updateData.success) {
        setMessage('PIN changed successfully!');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setShowPinChange(false);
        // Update local user
        updateUser({ pinEnabled: true });
      } else {
        setError(updateData.message || 'Failed to change PIN');
      }
    } catch (err) {
      setError('Failed to change PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!confirm('All your data including messages, gifts, and events will be permanently deleted.')) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('https://api.vibra.ng/api/delete_account.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await response.json();

      if (data.success) {
        alert('Account deleted successfully');
        logout();
        navigate('/login');
      } else {
        setError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button onClick={() => navigate('/profile')} style={styles.backButton}>
            ← Back
          </button>
          <h2 style={styles.title}>Settings</h2>
          <div style={styles.headerSpacer}></div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
        {message && (
          <div style={styles.successBox}>
            <p style={styles.successText}>{message}</p>
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Account</h3>
          
          <div style={styles.settingItem}>
            <div style={styles.settingInfo}>
              <span style={styles.settingLabel}>Phone Number</span>
              <span style={styles.settingValue}>{user?.phone}</span>
            </div>
          </div>

          <div style={styles.settingItem}>
            <div style={styles.settingInfo}>
              <span style={styles.settingLabel}>User ID</span>
              <span style={styles.settingValue}>{user?.userId}</span>
            </div>
          </div>

          <div style={styles.settingItem}>
            <div style={styles.settingInfo}>
              <span style={styles.settingLabel}>Level</span>
              <span style={styles.settingValue}>{user?.level}</span>
            </div>
          </div>

          <div style={styles.settingItem}>
            <div style={styles.settingInfo}>
              <span style={styles.settingLabel}>PIN Enabled</span>
              <span style={styles.settingValue}>{user?.pinEnabled ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Security</h3>
          
          <div style={styles.settingItem} onClick={() => setShowPinChange(!showPinChange)}>
            <div style={styles.settingInfo}>
              <span style={styles.settingLabel}>Change PIN</span>
              <span style={styles.settingArrow}>›</span>
            </div>
          </div>

          {showPinChange && (
            <form onSubmit={handleChangePin} style={styles.pinForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current PIN</label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  style={styles.input}
                  maxLength="4"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>New PIN</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  style={styles.input}
                  maxLength="4"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New PIN</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  style={styles.input}
                  maxLength="4"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              <button
                type="submit"
                style={styles.pinButton}
                disabled={isLoading}
              >
                {isLoading ? 'Changing...' : 'Change PIN'}
              </button>
            </form>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Privacy</h3>
          
          <div style={styles.settingItem}>
            <div style={styles.settingInfo}>
              <span style={styles.settingLabel}>Blocked Users</span>
              <button 
                onClick={() => navigate('/blocked')}
                style={styles.smallButton}
              >
                View
              </button>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Account Actions</h3>

          <div style={styles.settingItem} onClick={handleLogout}>
            <div style={styles.settingInfo}>
              <span style={{...styles.settingLabel, color: '#e74c3c'}}>Logout</span>
            </div>
          </div>

          <div style={styles.settingItem} onClick={handleDeleteAccount}>
            <div style={styles.settingInfo}>
              <span style={{...styles.settingLabel, color: '#c62828', fontWeight: '600'}}>Delete Account</span>
            </div>
          </div>
        </div>

        <p style={styles.version}>VIBRA v1.0.0</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#6C3CE1',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  headerSpacer: {
    width: '50px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
    flex: 1,
    textAlign: 'center',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  settingItem: {
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
  },
  settingInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: '15px',
    color: '#1a1a1a',
  },
  settingValue: {
    fontSize: '14px',
    color: '#666',
  },
  settingArrow: {
    fontSize: '20px',
    color: '#ccc',
  },
  pinForm: {
    paddingTop: '12px',
    paddingBottom: '8px',
  },
  formGroup: {
    marginBottom: '12px',
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
    padding: '12px',
    fontSize: '18px',
    textAlign: 'center',
    letterSpacing: '8px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  },
  pinButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '4px',
  },
  smallButton: {
    padding: '4px 14px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '16px',
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
    marginBottom: '16px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
  },
  version: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#ccc',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
};

export default Settings;