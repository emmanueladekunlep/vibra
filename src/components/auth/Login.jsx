/**
 * VIBRA - Login Component
 * Module: Authentication
 * 
 * Login screen - simple phone number entry.
 * No Opay verification at login. Opay check happens only at withdrawal.
 */

import React, { useState } from 'react';
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
  const { loginWithOpay, isLoading, error, isAuthenticated } = useAuth();
  
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (!phone || phone.length < 10) {
      setLoginError('Please enter a valid phone number');
      return;
    }

    const result = await loginWithOpay(phone);
    if (!result.success) {
      setLoginError(result.error || 'Login failed. Please try again.');
    } else {
      navigate('/', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

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
          By continuing, you agree to VIBRA's Terms & Privacy Policy
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