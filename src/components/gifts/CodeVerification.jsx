/**
 * VIBRA - Code Verification Component
 * Module: 6-Digit Code Generator
 * 
 * Verify and redeem codes.
 * Professional design - no emojis.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as codeService from '../../services/codeGeneratorService';

const CodeVerification = ({ onVerified, onClose }) => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [codeData, setCodeData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setCodeData(null);
    setVerificationResult(null);

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await codeService.validateCode(code);
      if (result.valid) {
        setCodeData(result.codeData);
        setVerificationResult('valid');
      } else {
        setError(result.error);
        setVerificationResult('invalid');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!codeData || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await codeService.useCode(code, user.id);
      setCodeData(result);
      setVerificationResult('redeemed');

      if (onVerified) {
        onVerified(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to redeem code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setCodeData(null);
    setVerificationResult(null);
    setError(null);
  };

  const getTypeLabel = (type) => {
    const labels = {
      gift: 'Gift Redemption',
      event: 'Event Entry',
      merchant: 'Merchant Code',
      referral: 'Referral Code',
    };
    return labels[type] || type;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Verify Code</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          Enter a 6-digit code to verify and redeem
        </p>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {codeData && (
          <div style={styles.codeInfo}>
            <div style={styles.codeInfoHeader}>
              <span style={styles.codeInfoType}>{getTypeLabel(codeData.type)}</span>
              <span style={codeData.used ? styles.codeInfoUsed : styles.codeInfoActive}>
                {codeData.used ? 'Used' : 'Active'}
              </span>
            </div>
            <p style={styles.codeInfoCode}>{codeService.formatCode(codeData.code)}</p>
            <p style={styles.codeInfoDetails}>
              Created: {new Date(codeData.createdAt).toLocaleDateString()}
            </p>
            {codeData.entityId && (
              <p style={styles.codeInfoDetails}>Entity: {codeData.entityId}</p>
            )}
            {codeData.usedAt && (
              <p style={styles.codeInfoDetails}>
                Used: {new Date(codeData.usedAt).toLocaleString()}
              </p>
            )}
            {codeData.usedBy && (
              <p style={styles.codeInfoDetails}>Used by: {codeData.usedBy}</p>
            )}
            {codeData.expiresAt && (
              <p style={styles.codeInfoDetails}>
                Expires: {new Date(codeData.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {!codeData && (
          <form onSubmit={handleVerify} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>6-Digit Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                placeholder="123456"
                style={styles.codeInput}
                maxLength="6"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              style={styles.verifyButton}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {codeData && verificationResult === 'valid' && !codeData.used && (
          <div style={styles.actionContainer}>
            <button
              onClick={handleRedeem}
              style={styles.redeemButton}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Redeem Code'}
            </button>
            <button
              onClick={handleReset}
              style={styles.resetButton}
              disabled={isLoading}
            >
              Check Another
            </button>
          </div>
        )}

        {codeData && verificationResult === 'redeemed' && (
          <div style={styles.redeemSuccess}>
            <p style={styles.redeemSuccessText}>Code redeemed successfully!</p>
            <button onClick={handleReset} style={styles.resetButton}>
              Check Another
            </button>
          </div>
        )}

        {codeData && verificationResult === 'valid' && codeData.used && (
          <div style={styles.usedInfo}>
            <p style={styles.usedInfoText}>This code has already been used.</p>
            <button onClick={handleReset} style={styles.resetButton}>
              Check Another
            </button>
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
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '28px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 20px 0',
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
  codeInput: {
    width: '100%',
    padding: '16px',
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
    letterSpacing: '8px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  verifyButton: {
    width: '100%',
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
  codeInfo: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  codeInfoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  codeInfoType: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  codeInfoActive: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#00B894',
    backgroundColor: '#e8f5e9',
    padding: '2px 10px',
    borderRadius: '10px',
  },
  codeInfoUsed: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#c62828',
    backgroundColor: '#ffebee',
    padding: '2px 10px',
    borderRadius: '10px',
  },
  codeInfoCode: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#6C3CE1',
    fontFamily: 'monospace',
    letterSpacing: '4px',
    margin: '8px 0',
    textAlign: 'center',
  },
  codeInfoDetails: {
    fontSize: '13px',
    color: '#666',
    margin: '2px 0',
  },
  actionContainer: {
    display: 'flex',
    gap: '10px',
  },
  redeemButton: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#00B894',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  resetButton: {
    padding: '12px 20px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#555',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  redeemSuccess: {
    backgroundColor: '#e8f5e9',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  redeemSuccessText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2e7d32',
    margin: '0 0 10px 0',
  },
  usedInfo: {
    backgroundColor: '#fff3e0',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  },
  usedInfoText: {
    fontSize: '16px',
    color: '#e65100',
    margin: '0 0 10px 0',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
};

export default CodeVerification;