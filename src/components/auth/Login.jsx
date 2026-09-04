/**
 * VIBRA - Login Component - FIXED with Pulsing Logo
 * Brand: Vib #721CBB, ra #10964D, always pulsing
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

// VIBRA PULSING LOGO - Large for Login
const Logo = () => {
  return (
    <div style={styles.logoContainer}>
      <div style={styles.logoRow}>
        <span style={styles.vibText}>VIB</span>
        <div style={styles.pulseWrap}>
          <svg width="100%" height="100%" viewBox="0 0 60 18" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <path d="M0 9 L15 9 L18 2 L22 16 L25 9 L32 9 L38 9 L41 3 L45 15 L48 9 L60 9"
              stroke="#721CBB" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="14 150" className="loginPulse"
              style={{ filter: 'drop-shadow(0 0 3px rgba(114,28,187,0.4))' }}
            />
          </svg>
        </div>
        <span style={styles.raText}>₦RA
          <span style={styles.heartInA}>♥</span>
        </span>
      </div>
      <div style={styles.taglineRow}>
        <span style={styles.taglinePurple}>CONNECT.</span>
        <span style={styles.taglineGreen}>VIBE.</span>
        <span style={styles.taglinePurple}>LOVE.</span>
      </div>
      <style>{`
        @keyframes loginPulseAnim {0%{stroke-dashoffset:130}100%{stroke-dashoffset:-130}}
        .loginPulse { animation: loginPulseAnim 1.4s linear infinite; }
      `}</style>
    </div>
  );
};

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

  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [selectedQuestion1, setSelectedQuestion1] = useState('');
  const [selectedQuestion2, setSelectedQuestion2] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [securityError, setSecurityError] = useState(null);
  const [isVerifyingSecurity, setIsVerifyingSecurity] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    const result = await setPin(loginPhone, newPin);
    if (!result.success) {
      setLoginError(result.error || 'Failed to set PIN');
      return;
    }
    const loginResult = await loginWithOpay(loginPhone, newPin);
    if (loginResult.success) {
      setShowSetPin(false);
      navigate('/', { replace: true });
    } else {
      setLoginError(loginResult.error || 'Login failed after PIN setup');
    }
  };

  const handleForgotPinStep1 = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setSecurityError(null);
    if (!resetPhone || resetPhone.length < 10) {
      setLoginError('Please enter a valid phone number');
      return;
    }
    setIsResetting(true);
    try {
      const response = await fetch('https://api.vibra.ng/api/get_security_questions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone })
      });
      const data = await response.json();
      if (data.success && data.questions && data.questions.length > 0) {
        setSecurityQuestions(data.questions);
        setSelectedQuestion1(data.questions[0]?.question || '');
        setSelectedQuestion2(data.questions[1]?.question || '');
        setShowSecurityQuestions(true);
        setLoginError(null);
      } else {
        setLoginError(data.message || 'No security questions found for this user');
      }
    } catch (err) {
      setLoginError('Failed to load security questions. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleForgotPinStep2 = async (e) => {
    e.preventDefault();
    setSecurityError(null);
    if (!resetPin || resetPin.length !== 4 || !/^\d{4}$/.test(resetPin)) {
      setSecurityError('PIN must be 4 digits');
      return;
    }
    if (resetPin !== resetConfirmPin) {
      setSecurityError('PINs do not match');
      return;
    }
    if (!selectedQuestion1 || !answer1.trim()) {
      setSecurityError('Please answer question 1');
      return;
    }
    if (!selectedQuestion2 || !answer2.trim()) {
      setSecurityError('Please answer question 2');
      return;
    }
    setIsVerifyingSecurity(true);
    try {
      const response = await fetch('https://api.vibra.ng/api/verify_security_answers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: resetPhone,
          question1: selectedQuestion1,
          answer1: answer1.trim(),
          question2: selectedQuestion2,
          answer2: answer2.trim(),
          newPin: resetPin
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('PIN reset successfully! Please login with your new PIN.');
        setShowForgotPin(false);
        setShowSecurityQuestions(false);
        setResetPhone('');
        setResetPin('');
        setResetConfirmPin('');
        setAnswer1('');
        setAnswer2('');
      } else {
        setSecurityError(data.message || 'Failed to verify answers');
      }
    } catch (err) {
      setSecurityError('Failed to reset PIN. Please try again.');
    } finally {
      setIsVerifyingSecurity(false);
    }
  };

  if (showForgotPin) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <Logo />
          {!showSecurityQuestions ? (
            <>
              <h2 style={styles.setupTitle}>Reset Your PIN</h2>
              {(error || loginError) && (
                <div style={styles.errorContainer}><p style={styles.errorText}>{error || loginError}</p></div>
              )}
              <form onSubmit={handleForgotPinStep1} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input type="tel" value={resetPhone} onChange={(e) => setResetPhone(e.target.value)} placeholder="08012345678" style={{...styles.input, letterSpacing: '1px', textAlign: 'left'}} disabled={isResetting} />
                </div>
                <button type="submit" style={styles.button} disabled={isResetting}>{isResetting ? 'Loading...' : 'Continue'}</button>
                <button type="button" onClick={() => setShowForgotPin(false)} style={{...styles.button, ...styles.skipButton}}>Back to Login</button>
              </form>
            </>
          ) : (
            <>
              <h2 style={styles.setupTitle}>Security Questions</h2>
              {securityError && <div style={styles.errorContainer}><p style={styles.errorText}>{securityError}</p></div>}
              <form onSubmit={handleForgotPinStep2} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{selectedQuestion1}</label>
                  <input type="text" value={answer1} onChange={(e) => setAnswer1(e.target.value)} placeholder="Your answer" style={{...styles.input, letterSpacing: '1px', textAlign: 'left'}} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{selectedQuestion2}</label>
                  <input type="text" value={answer2} onChange={(e) => setAnswer2(e.target.value)} placeholder="Your answer" style={{...styles.input, letterSpacing: '1px', textAlign: 'left'}} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>New PIN (4 digits)</label>
                  <input type="password" value={resetPin} onChange={(e) => setResetPin(e.target.value)} placeholder="••••" maxLength="4" style={styles.input} inputMode="numeric" pattern="[0-9]*" />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm New PIN</label>
                  <input type="password" value={resetConfirmPin} onChange={(e) => setResetConfirmPin(e.target.value)} placeholder="••••" maxLength="4" style={styles.input} inputMode="numeric" pattern="[0-9]*" />
                </div>
                <button type="submit" style={styles.button} disabled={isVerifyingSecurity}>{isVerifyingSecurity ? 'Verifying...' : 'Reset PIN'}</button>
                <button type="button" onClick={() => { setShowSecurityQuestions(false); setSecurityError(null); }} style={{...styles.button, ...styles.skipButton}}>Back</button>
              </form>
            </>
          )}
          <p style={styles.credit}>Powered by LabelReach</p>
        </div>
      </div>
    );
  }

  if (showSetPin) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <Logo />
          <h2 style={styles.setupTitle}>Set Your 4-Digit PIN</h2>
          {(error || loginError) && <div style={styles.errorContainer}><p style={styles.errorText}>{error || loginError}</p></div>}
          <form onSubmit={handleSetPin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New PIN</label>
              <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="••••" maxLength="4" style={styles.input} disabled={isLoading} inputMode="numeric" pattern="[0-9]*" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm PIN</label>
              <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="••••" maxLength="4" style={styles.input} disabled={isLoading} inputMode="numeric" pattern="[0-9]*" />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Setting...' : 'Set PIN & Continue'}</button>
          </form>
          <p style={styles.credit}>Powered by LabelReach</p>
        </div>
      </div>
    );
  }

  if (showPinScreen) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <Logo />
          <h2 style={styles.setupTitle}>Enter Your PIN</h2>
          <p style={styles.subtitle}>Welcome back, {loginPhone}</p>
          {(error || loginError) && <div style={styles.errorContainer}><p style={styles.errorText}>{error || loginError}</p></div>}
          <form onSubmit={handlePinSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <input type="password" value={pin} onChange={(e) => setPinInput(e.target.value)} placeholder="••••" maxLength="4" style={styles.input} disabled={isLoading} autoFocus inputMode="numeric" pattern="[0-9]*" />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Verifying...' : 'Continue'}</button>
            <button type="button" onClick={() => setShowForgotPin(true)} style={{...styles.button, backgroundColor: 'transparent', color: '#721CBB', border: '1.5px solid #F3E8FF'}}>Forgot PIN?</button>
            <button type="button" onClick={() => { setShowPinScreen(false); setPinInput(''); }} style={{...styles.button, ...styles.skipButton, marginTop: '10px'}}>Back</button>
          </form>
          <p style={styles.credit}>Powered by LabelReach</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Logo />
        {(error || loginError) && <div style={styles.errorContainer}><p style={styles.errorText}>{error || loginError}</p></div>}
        <form onSubmit={handleLogin} style={styles.form}>
          <h2 style={styles.title}>Welcome to VIBRA</h2>
          <p style={styles.subtitle}>Enter your phone number to get started</p>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" style={{...styles.input, letterSpacing: '1px', textAlign: 'left'}} disabled={isLoading} />
          </div>
          <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Logging in...' : 'Continue'}</button>
        </form>
        <p style={styles.footer}>By continuing, you agree to VIBRA's <a href="/terms" style={styles.link}>Terms</a> & <a href="/privacy" style={styles.link}>Privacy Policy</a></p>
        <p style={styles.credit}>Powered by LabelReach</p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'Inter, Poppins, sans-serif', padding: '20px' },
  card: { backgroundColor: 'white', borderRadius: '24px', padding: '32px 28px', maxWidth: '420px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' },
  logoContainer: { textAlign: 'center', marginBottom: '20px' },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 },
  vibText: { color: '#721CBB', fontWeight: 900, fontSize: 36, letterSpacing: '-1.5px', fontFamily: 'Poppins, sans-serif' },
  pulseWrap: { width: 60, height: 18, margin: '0 -2px', display: 'flex', alignItems: 'center' },
  raText: { color: '#10964D', fontWeight: 900, fontSize: 36, letterSpacing: '-1.5px', fontFamily: 'Poppins, sans-serif', position: 'relative' },
  heartInA: { position: 'absolute', top: '18%', right: '22%', fontSize: 9, color: 'white', lineHeight: 1 },
  taglineRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 },
  taglinePurple: { color: '#721CBB', fontSize: '9px', letterSpacing: '3px', fontWeight: 700 },
  taglineGreen: { color: '#10964D', fontSize: '9px', letterSpacing: '3px', fontWeight: 700 },
  setupTitle: { fontSize: '18px', fontWeight: '700', textAlign: 'center', color: '#1a1a1a', margin: '0 0 18px 0' },
  title: { fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#1a1a1a', textAlign: 'center', letterSpacing: '-0.3px' },
  subtitle: { fontSize: '13px', color: '#6B7280', margin: '0 0 20px 0', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column' },
  inputGroup: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', letterSpacing: '0.2px' },
  input: { width: '100%', padding: '14px 16px', fontSize: '16px', border: '1.5px solid #E9E3F3', borderRadius: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'center', letterSpacing: '8px', transition: 'border-color 0.2s', backgroundColor: '#FAFAFF' },
  button: { width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', color: 'white', backgroundColor: '#721CBB', border: 'none', borderRadius: '12px', cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit', letterSpacing: '0.2px' },
  skipButton: { backgroundColor: '#F3F0FF', color: '#6B7280' },
  errorContainer: { backgroundColor: '#FEF2F2', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #FECACA' },
  errorText: { color: '#DC2626', fontSize: '13px', margin: 0 },
  footer: { textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #F9F5FF' },
  link: { color: '#721CBB', textDecoration: 'none', fontWeight: '600' },
  credit: { textAlign: 'center', fontSize: '10px', color: '#C4B5D6', marginTop: '10px', letterSpacing: '0.3px' },
  spinnerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  spinner: { border: '4px solid #F3E8FF', borderTop: '4px solid #721CBB', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite' },
  loadingText: { color: '#6B7280', marginTop: '12px', fontSize: '13px' },
};

if (typeof document !== 'undefined' && !document.querySelector('style[data-vibra-login]')) {
  const styleSheet = document.createElement('style');
  styleSheet.setAttribute('data-vibra-login', 'true');
  styleSheet.textContent = `@keyframes spin {0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;
  document.head.appendChild(styleSheet);
}

export default Login;