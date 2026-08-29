/**
 * VIBRA - VIP Code Generator Component
 * Module: Admin Panel
 * 
 * Generate VIP codes for founders, friends, and partners.
 * Professional design - no emojis.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as adminService from '../../services/adminService';

const VIPCodeGenerator = () => {
  const { user } = useAuth();
  const [level, setLevel] = useState('Silver');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [codes, setCodes] = useState([]);

  const handleGenerate = async () => {
    setError(null);
    setSuccess(null);
    setGeneratedCode(null);

    setIsLoading(true);

    try {
      const code = await adminService.generateVIPCode(level, recipientPhone || null, user.id);
      setGeneratedCode(code);
      setSuccess('VIP code generated successfully!');
      setCodes([code, ...codes]);
    } catch (err) {
      setError(err.message || 'Failed to generate VIP code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Code copied to clipboard');
      })
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Code copied to clipboard');
      });
  };

  const getPointsForLevel = (lvl) => {
    const map = {
      Silver: 10000,
      Gold: 25000,
      Platinum: 50000,
      Diamond: 100000,
    };
    return map[lvl] || 0;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>VIP Code Generator</h4>
        <span style={styles.subtitle}>Generate one-time VIP codes for friends and partners</span>
      </div>

      <div style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>VIP Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={styles.select}
              disabled={isLoading}
            >
              <option value="Silver">Silver (10,000 points)</option>
              <option value="Gold">Gold (25,000 points)</option>
              <option value="Platinum">Platinum (50,000 points)</option>
              <option value="Diamond">Diamond (100,000 points)</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Recipient Phone (optional)</label>
            <input
              type="text"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="08012345678"
              style={styles.input}
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          style={styles.generateButton}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : `Generate ${level} VIP Code`}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}
      {success && (
        <div style={styles.successBox}>
          <p style={styles.successText}>{success}</p>
        </div>
      )}

      {generatedCode && (
        <div style={styles.codeResult}>
          <div style={styles.codeHeader}>
            <span style={styles.codeLabel}>Generated VIP Code</span>
            <button
              onClick={() => handleCopy(generatedCode.code)}
              style={styles.copyButton}
            >
              Copy
            </button>
          </div>
          <div style={styles.codeDisplay}>
            <span style={styles.codeValue}>{generatedCode.code}</span>
          </div>
          <div style={styles.codeDetails}>
            <span>Level: {generatedCode.level}</span>
            <span>Points: {generatedCode.points.toLocaleString()}</span>
            <span>Status: {generatedCode.used ? 'Used' : 'Available'}</span>
          </div>
          <div style={styles.codeNote}>
            <p style={styles.codeNoteText}>
              This code gives the recipient {generatedCode.level} level with {generatedCode.points.toLocaleString()} points.
              VIP points are locked and cannot be cashed out.
            </p>
          </div>
        </div>
      )}

      {codes.length > 0 && (
        <div style={styles.historyContainer}>
          <h5 style={styles.historyTitle}>Recent Codes</h5>
          <div style={styles.historyList}>
            {codes.map((code, index) => (
              <div key={index} style={styles.historyItem}>
                <span style={styles.historyCode}>{code.code}</span>
                <span style={styles.historyLevel}>{code.level}</span>
                <span style={code.used ? styles.historyUsed : styles.historyAvailable}>
                  {code.used ? 'Used' : 'Available'}
                </span>
                <span style={styles.historyDate}>
                  {new Date(code.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={styles.credit}>
        Powered by LabelReach
      </p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 2px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    margin: 0,
  },
  form: {
    backgroundColor: '#f8f8f8',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  formGroup: {
    flex: 1,
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
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  generateButton: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6C3CE1',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '10px',
    border: '1px solid #ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: '13px',
    margin: 0,
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '10px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '13px',
    margin: 0,
  },
  codeResult: {
    border: '2px solid #6C3CE1',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#f8f8f8',
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  codeLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  copyButton: {
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
  codeDisplay: {
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '8px',
    border: '1px solid #e0e0e0',
  },
  codeValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#6C3CE1',
    fontFamily: 'monospace',
    letterSpacing: '2px',
  },
  codeDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  codeNote: {
    backgroundColor: '#fff3e0',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #ffcc80',
  },
  codeNoteText: {
    fontSize: '12px',
    color: '#e65100',
    margin: 0,
    lineHeight: '1.4',
  },
  historyContainer: {
    borderTop: '2px solid #f0f0f0',
    paddingTop: '12px',
    marginTop: '4px',
  },
  historyTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  historyList: {
    maxHeight: '150px',
    overflowY: 'auto',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 10px',
    backgroundColor: '#f8f8f8',
    borderRadius: '6px',
    marginBottom: '4px',
    fontSize: '13px',
    flexWrap: 'wrap',
  },
  historyCode: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#6C3CE1',
  },
  historyLevel: {
    color: '#666',
  },
  historyAvailable: {
    color: '#00B894',
    fontWeight: '500',
  },
  historyUsed: {
    color: '#888',
    fontWeight: '500',
  },
  historyDate: {
    color: '#aaa',
    fontSize: '11px',
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

export default VIPCodeGenerator;