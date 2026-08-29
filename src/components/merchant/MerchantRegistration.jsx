/**
 * VIBRA - Merchant Registration Component
 * Module: Merchant Portal
 * 
 * Register merchant with BVN verification.
 * Professional design - no emojis.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as merchantService from '../../services/merchantService';

const MerchantRegistration = ({ onRegistered, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    category: 'restaurant',
    bvn: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bvnStatus, setBvnStatus] = useState(null);

  const categories = [
    'restaurant',
    'bar',
    'cinema',
    'shopping',
    'telecom',
    'cafe',
    'entertainment',
    'other',
  ];

  const getCategoryLabel = (cat) => {
    const labels = {
      restaurant: 'Restaurant',
      bar: 'Bar/Lounge',
      cinema: 'Cinema',
      shopping: 'Shopping',
      telecom: 'Telecom',
      cafe: 'Cafe',
      entertainment: 'Entertainment',
      other: 'Other',
    };
    return labels[cat] || cat;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'bvn') {
      setBvnStatus(null);
      setError(null);
    }
  };

  const handleVerifyBVN = async () => {
    setError(null);
    setBvnStatus(null);

    if (!formData.bvn || formData.bvn.length !== 11) {
      setError('Please enter a valid 11-digit BVN');
      return;
    }

    setIsLoading(true);
    try {
      const result = await merchantService.validateBVN(
        formData.bvn,
        formData.name || undefined
      );
      setBvnStatus(result);
      if (!result.valid) {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify BVN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!bvnStatus || !bvnStatus.valid) {
      setError('Please verify your BVN first');
      return;
    }

    if (!user) {
      setError('Please login to register');
      return;
    }

    setIsLoading(true);
    try {
      const merchant = await merchantService.registerMerchant(
        formData.name,
        formData.phone,
        formData.location,
        formData.category,
        formData.bvn,
        user.id
      );

      if (onRegistered) {
        onRegistered(merchant);
      }
    } catch (err) {
      setError(err.message || 'Failed to register merchant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Merchant Registration</h3>
          {onClose && (
            <button onClick={onClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          Register your business to accept Vibra gifts
        </p>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {bvnStatus && bvnStatus.valid && (
          <div style={styles.successBox}>
            <p style={styles.successText}>BVN verified successfully!</p>
            <p style={styles.successDetail}>Name: {bvnStatus.data?.name || 'Verified'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Business Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your business name"
              style={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08012345678"
              style={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Yaba, Lagos"
              style={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={styles.select}
              disabled={isLoading}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.bvnGroup}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>BVN (11 digits)</label>
              <input
                type="text"
                name="bvn"
                value={formData.bvn}
                onChange={handleChange}
                placeholder="12345678901"
                style={styles.input}
                maxLength="11"
                required
                disabled={isLoading || bvnStatus?.valid}
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyBVN}
              style={{
                ...styles.verifyButton,
                ...(bvnStatus?.valid ? styles.verifyButtonSuccess : {}),
              }}
              disabled={isLoading || !formData.bvn || formData.bvn.length !== 11 || bvnStatus?.valid}
            >
              {bvnStatus?.valid ? 'Verified' : 'Verify BVN'}
            </button>
          </div>

          <button
            type="submit"
            style={styles.registerButton}
            disabled={isLoading || !bvnStatus?.valid}
          >
            {isLoading ? 'Registering...' : 'Register Merchant'}
          </button>
        </form>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            After registration, you will receive instant payouts for all gift redemptions.
            First-time merchants require BVN verification. After 5 redemptions, you become a Trusted Partner.
          </p>
        </div>

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
  bvnGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
    alignItems: 'flex-end',
  },
  verifyButton: {
    padding: '10px 20px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    height: '42px',
    marginBottom: '0',
  },
  verifyButtonSuccess: {
    backgroundColor: '#00B894',
  },
  registerButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#00B894',
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
  successBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '12px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 2px 0',
  },
  successDetail: {
    color: '#2e7d32',
    fontSize: '13px',
    margin: 0,
  },
  infoBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f0edff',
    borderRadius: '10px',
  },
  infoText: {
    fontSize: '13px',
    color: '#555',
    margin: 0,
    lineHeight: '1.5',
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

export default MerchantRegistration;