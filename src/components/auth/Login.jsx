/**
 * VIBRA - Login Component
 * Module: Authentication
 * 
 * Login screen - phone number entry with 4-digit PIN support.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const LoadingSpinner = () => (
  <div style={styles.spinnerContainer}>
    <div style={styles.spinner}></div>
    <p style={styles.loadingText}>Loading...</p>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const { loginWithOpay, setPin, completePinSetup, isLoading, error, isAuthenticated, requiresPin: authRequiresPin, pendingPhone, pendingUserData } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [pin, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [needsPinSetup, setNeedsPinSetup] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show PIN screen when auth context requires it
  useEffect(() => {
    if (authRequiresPin && pendingPhone) {
      setLoginPhone(pendingPhone);
      setShowPinScreen(true);
      setPhone(pendingPhone);
    }
  }, [authRequiresPin, pendingPhone]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setNeedsPinSetup(false);

    if (!phone || phone.length < 10) {
      setLoginError('Please enter a valid phone number');
      return;
    }

    const result = await loginWithOpay(phone, null);
    
    if (result.requiresPin) {
      setLoginPhone(phone);
      setShowPinScreen(true);
      return;
    }

    if (result.needsPinSetup) {
      setLoginPhone(phone);
      setNeedsPinSetup(true);
      setShowSetPin(true);
      return;
    }

    if (!result.success) {
      setLoginError(result.error || 'Login failed');
      return;
    }

    navigate('/', { replace: true });
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setLoginError('Please enter a valid 4-digit PIN');
      return;
    }

    const result = await loginWithOpay(loginPhone, pin);
    
    if (!result.success) {
      setLoginError(result.error || 'Invalid PIN');
      return;
    }

    setShowPinScreen(false);
    navigate('/', { replace: true });
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setLoginError('PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setLoginError('PINs do not match');
      return;
    }

    // Set PIN via API
    const result = await setPin(loginPhone, newPin);
    
    if (!result.success) {
      setLoginError(result.error || 'Failed to set PIN');
      return;
    }

    // Now login with the new PIN
    const loginResult = await loginWithOpay(loginPhone, newPin);
    if (loginResult.success) {
      setShowSetPin(false);
      navigate('/', { replace: true });
    } else {
      setLoginError(loginResult.error || 'Login failed after PIN setup');
    }
  };

  const handleForgotPin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (!resetPhone || resetPhone.length < 10) {
      setLoginError('Please enter a valid phone number');
      return;
    }

    if (!resetPin || resetPin.length !== 4 || !/^\d{4}$/.test(resetPin)) {
      setLoginError('PIN must be 4 digits');
      return;
    }

    if (resetPin !== resetConfirmPin) {
      setLoginError('PINs do not match');
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('https://api.vibra.ng/api/reset_pin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone, pin: resetPin })
      });
      const data = await response.json();
      
      if (data.success) {
        setLoginError(null);
        setShowForgotPin(false);
        setResetPhone('');
        setResetPin('');
        setResetConfirmPin('');
        alert('PIN reset successfully! Please login with your new PIN.');
      } else {
        setLoginError(data.message || 'Failed to reset PIN');
      }
    } catch (err) {
      setLoginError('Failed to reset PIN. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  // PIN Setup Screen
  if (showSetPin) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <h1 style={styles.logoText}>VIBRA</h1>
            <p style={styles.tagline}>Set Your 4-Digit PIN</p>
          </div>

          {(error || loginError) && (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error || loginError}</p>
            </div>
          )}

          <form onSubmit={handleSetPin} style={styles.form}>
            <p style={styles.subtitle}>Create a 4-digit PIN to secure your account</p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Create PIN</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                style={styles.input}
                maxLength="4"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm PIN</label>
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
              style={styles.button}
              disabled={isLoading || newPin.length !== 4 || confirmPin.length !== 4}
            >
              Set PIN & Continue
            </button>
          </form>

          <p style={styles.credit}>Powered by LabelReach</p>
        </div>
      </div>
    );
  }

  // Forgot PIN Screen
  if (showForgotPin) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <h1 style={styles.logoText}>VIBRA</h1>
            <p style={styles.tagline}>Reset Your PIN</p>
          </div>

          {(error || loginError) && (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error || loginError}</p>
            </div>
          )}

          <form onSubmit={handleForgotPin} style={styles.form}>
            <p style={styles.subtitle}>Enter your phone number and set a new PIN</p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                placeholder="08012345678"
                style={styles.input}
                disabled={isResetting}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>New PIN</label>
              <input
                type="password"
                value={resetPin}
                onChange={(e) => setResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                style={styles.input}
                maxLength="4"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isResetting}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm New PIN</label>
              <input
                type="password"
                value={resetConfirmPin}
                onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                style={styles.input}
                maxLength="4"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={isResetting}
              />
            </div>

            <button 
              type="submit" 
              style={styles.button}
              disabled={isResetting || resetPin.length !== 4 || resetConfirmPin.length !== 4}
            >
              {isResetting ? 'Resetting...' : 'Reset PIN'}
            </button>

            <button 
              type="button" 
              onClick={() => setShowForgotPin(false)}
              style={{...styles.button, ...styles.skipButton, marginTop: '10px'}}
            >
              Back to Login
            </button>
          </form>

          <p style={styles.credit}>Powered by LabelReach</p>
        </div>
      </div>
    );
  }

  // PIN Required Screen
  if (showPinScreen) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <h1 style={styles.logoText}>VIBRA</h1>
            <p style={styles.tagline}>Enter Your PIN</p>
          </div>

          {(error || loginError) && (
            <div style={styles.errorContainer}>
              <p style={styles.errorText}>{error || loginError}</p>
            </div>
          )}

          <form onSubmit={handlePinSubmit} style={styles.form}>
            <p style={styles.subtitle}>Enter your 4-digit PIN to continue</p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                style={styles.input}
                maxLength="4"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              style={styles.button}
              disabled={isLoading || pin.length !== 4}
            >
              {isLoading ? 'Verifying...' : 'Verify PIN'}
            </button>

            <button 
              type="button" 
              onClick={() => {
                setShowPinScreen(false);
                setPinInput('');
                setShowForgotPin(true);
              }}
              style={{...styles.button, ...styles.skipButton, marginTop: '10px'}}
            >
              Forgot PIN?
            </button>

            <button 
              type="button" 
              onClick={() => {
                setShowPinScreen(false);
                setPinInput('');
              }}
              style={{...styles.button, ...styles.skipButton, marginTop: '10px'}}
            >
              Back
            </button>
          </form>

          <p style={styles.credit}>Powered by LabelReach</p>
        </div>
      </div>
    );
  }

  // Main Login Screen
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img 
            src="/logo.png" 
            alt="VIBRA Logo" 
            style={styles.logo}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<h1 style={styles.logoText}>VIBRA</h1>';
            }}
          />
          <p style={styles.tagline}>Nigerian • Verified • Real Dates</p>
        </div>

        {(error || loginError) && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error || loginError}</p>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <h2 style={styles.title}>Welcome to VIBRA</h2>
          <p style={styles.subtitle}>Enter your phone number to get started</p>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Continue'}
          </button>
        </form>

        <p style={styles.footer}>
          By continuing, you agree to VIBRA's <a href="/terms" style={styles.link}>Terms</a> & <a href="/privacy" style={styles.link}>Privacy Policy</a>
        </p>
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
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    margin: '0 auto',
  },
  logoText: {
    fontSize: '42px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #6C3CE1, #00B894)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  tagline: {
    color: '#666',
    fontSize: '14px',
    marginTop: '4px',
    letterSpacing: '1px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 24px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    textAlign: 'center',
    letterSpacing: '8px',
  },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    marginTop: '8px',
    fontFamily: 'inherit',
  },
  skipButton: {
    backgroundColor: '#e0e0e0',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    border: '1px solid #ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: '14px',
    margin: 0,
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#999',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
  link: {
    color: '#6C3CE1',
    textDecoration: 'none',
    fontWeight: '500',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    marginTop: '8px',
  },
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #6C3CE1',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#666',
    marginTop: '12px',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Login;