/**
 * VIBRA - Code Generator Component
 * Module: 6-Digit Code Generator
 * 
 * Admin/merchant interface for generating and managing codes.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as codeService from '../../services/codeGeneratorService';

const CodeGenerator = ({ onCodeGenerated, onClose }) => {
  const { user } = useAuth();
  const [codeType, setCodeType] = useState('gift');
  const [count, setCount] = useState(1);
  const [entityId, setEntityId] = useState('');
  const [metadata, setMetadata] = useState({});
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const statsData = codeService.getCodeStats();
    setStats(statsData);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const codes = await codeService.generateMultipleCodes(
        count,
        codeType,
        entityId || null,
        metadata
      );

      setGeneratedCodes(codes);
      loadStats();

      if (onCodeGenerated) {
        onCodeGenerated(codes);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAll = () => {
    const codes = generatedCodes.map(c => c.code).join('\n');
    navigator.clipboard.writeText(codes)
      .then(() => {
        alert('Codes copied to clipboard');
      })
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = codes;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Codes copied to clipboard');
      });
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

  if (!user || user.level !== 'Diamond') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.accessDenied}>Access denied. Diamond level required.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Code Generator</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        {stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{stats.total}</span>
              <span style={styles.statLabel}>Total</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{stats.active}</span>
              <span style={styles.statLabel}>Active</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{stats.used}</span>
              <span style={styles.statLabel}>Used</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{stats.expired}</span>
              <span style={styles.statLabel}>Expired</span>
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <form onSubmit={handleGenerate} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Code Type</label>
              <select
                value={codeType}
                onChange={(e) => setCodeType(e.target.value)}
                style={styles.select}
                disabled={isLoading}
              >
                <option value="gift">Gift Redemption</option>
                <option value="event">Event Entry</option>
                <option value="merchant">Merchant Code</option>
                <option value="referral">Referral Code</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Count</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                style={styles.input}
                min="1"
                max="100"
                disabled={isLoading}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Entity ID (optional)</label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="gift_123, event_456, etc."
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            style={styles.generateButton}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : `Generate ${count} Code${count > 1 ? 's' : ''}`}
          </button>
        </form>

        {generatedCodes.length > 0 && (
          <div style={styles.codesContainer}>
            <div style={styles.codesHeader}>
              <span style={styles.codesTitle}>Generated Codes</span>
              <button onClick={handleCopyAll} style={styles.copyAllButton}>
                Copy All
              </button>
            </div>
            <div style={styles.codesList}>
              {generatedCodes.map((codeData, index) => (
                <div key={index} style={styles.codeItem}>
                  <span style={styles.codeNumber}>#{index + 1}</span>
                  <span style={styles.codeValue}>{codeService.formatCode(codeData.code)}</span>
                  <span style={styles.codeType}>{getTypeLabel(codeData.type)}</span>
                </div>
              ))}
            </div>
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
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  statItem: {
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    padding: '8px',
    borderRadius: '8px',
  },
  statNumber: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: '11px',
    color: '#888',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  formGroup: {
    flex: 1,
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
    marginTop: '4px',
  },
  codesContainer: {
    marginTop: '16px',
    borderTop: '2px solid #f0f0f0',
    paddingTop: '16px',
  },
  codesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  codesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  copyAllButton: {
    padding: '4px 12px',
    backgroundColor: '#00B894',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  codesList: {
    maxHeight: '200px',
    overflowY: 'auto',
  },
  codeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    marginBottom: '6px',
  },
  codeNumber: {
    fontSize: '12px',
    color: '#888',
    width: '30px',
  },
  codeValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#6C3CE1',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    flex: 1,
  },
  codeType: {
    fontSize: '11px',
    color: '#888',
    backgroundColor: '#f0f0f0',
    padding: '2px 10px',
    borderRadius: '10px',
  },
  accessDenied: {
    textAlign: 'center',
    color: '#c62828',
    fontSize: '16px',
    padding: '20px',
    margin: 0,
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

export default CodeGenerator;