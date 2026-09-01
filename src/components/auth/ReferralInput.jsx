/**
 * VIBRA - Referral Input Component
 * Module: Referral System
 * 
 * Prompts new users to enter a referral code during signup.
 * Professional design - no emojis.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as referralService from '../../services/referralService';

const ReferralInput = ({ userId, onRedeemed, onSkip }) => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showInput, setShowInput] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedCode = code.trim().replace(/\s/g, '');
    if (!trimmedCode) {
      setError('Please enter a referral code');
      return;
    }

    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('Please enter a 6-digit referral code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await referralService.redeemReferralCode(trimmedCode, userId);
      setSuccess(result.message);
      setShowInput(false);
      
      if (onRedeemed) {
        onRedeemed(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to redeem code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setShowInput(false);
    if (onSkip) {
      onSkip();
    } else {
      navigate('/');
    }
  };

  if (!showInput) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>VIBRA</div>
        <h3 style={styles.title}>Do you have a referral code?</h3>
        <p style={styles.subtitle}>
          Enter a code to get bonus points and level up instantly
        </p>

        {success ? (
          <div style={styles.successBox}>
            <p style={styles.successText}>{success}</p>
            <button onClick={handleSkip} style={styles.continueButton}>
              Continue to App
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                style={styles.input}
                disabled={isLoading}
                maxLength="6"
                autoFocus
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            <div style={styles.buttonRow}>
              <button
                type="button"
                onClick={handleSkip}
                style={{...styles.button, ...styles.skipButton}}
                disabled={isLoading}
              >
                Skip
              </button>
              <button
                type="submit"
                style={styles.button}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? 'Checking...' : 'Redeem Code'}
              </button>
            </div>
          </form>
        )}

        {!success && (
          <div style={styles.vipInfo}>
            <p style={styles.vipText}>
              Have a VIP code? Enter it here to get instant Silver, Gold, Platinum, or Diamond level
            </p>
          </div>
        )}

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
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '40px 32px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  icon: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#6C3CE1',
    marginBottom: '16px',
    letterSpacing: '2px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px 0',
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
    marginBottom: '12px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: 'monospace',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    textAlign: 'center',
    letterSpacing: '4px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  skipButton: {
    backgroundColor: '#e0e0e0',
    color: '#555',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: '14px',
    margin: 0,
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2e7d32',
    margin: '0 0 12px 0',
  },
  continueButton: {
    padding: '10px 24px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  vipInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f0edff',
    borderRadius: '10px',
  },
  vipText: {
    fontSize: '13px',
    color: '#6C3CE1',
    margin: 0,
    lineHeight: '1.5',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
};

export default ReferralInput;