/**
 * VIBRA - Referral Section Component
 * Module: Referral System
 * 
 * Displays user's referral code, stats, and share functionality.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as referralService from '../../services/referralService';

const ReferralSection = () => {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReferral = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        let data = await referralService.getReferralCode(user.id);
        if (!data) {
          data = await referralService.generateReferralCode(user.id);
        }
        setReferralData(data);
      } catch (error) {
        console.error('Failed to load referral:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferral();
  }, [user]);

  const handleCopy = () => {
    if (!referralData?.code) return;
    navigator.clipboard.writeText(referralData.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {
        const input = document.createElement('input');
        input.value = referralData.code;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
  };

  const handleShare = async () => {
    if (!referralData?.code) return;
    const shareText = referralService.getShareText(referralData.code, user?.name || 'User');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join VIBRA',
          text: shareText,
          url: 'https://vibra.ng/download',
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 5000);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        })
        .catch(() => {
          const textarea = document.createElement('textarea');
          textarea.value = shareText;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        });
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading referral code...</div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>Unable to generate referral code</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Refer and Earn</h3>
        <p style={styles.subtitle}>
          Share your code. Earn {referralService.POINTS.STANDARD_REFERRER} points per referral!
        </p>

        <div style={styles.codeContainer}>
          <span style={styles.codeLabel}>Your Referral Code</span>
          <div style={styles.codeBox}>
            <span style={styles.code}>{referralData.code}</span>
            <button onClick={handleCopy} style={styles.copyButton}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <button onClick={handleShare} style={styles.shareButton}>
          Share with Friends
        </button>

        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{referralData.totalReferrals || 0}</span>
            <span style={styles.statLabel}>Referrals</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{referralData.totalPoints || 0}</span>
            <span style={styles.statLabel}>Points Earned</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{user?.level || 'Bronze'}</span>
            <span style={styles.statLabel}>Your Level</span>
          </div>
        </div>

        <div style={styles.howItWorks}>
          <p style={styles.howTitle}>How it works</p>
          <ul style={styles.howList}>
            <li>Share your unique code with friends</li>
            <li>They get {referralService.POINTS.STANDARD_NEW_USER} points when they join</li>
            <li>You get {referralService.POINTS.STANDARD_REFERRER} points per referral</li>
            <li>More points = higher levels and better perks</li>
          </ul>
        </div>

        {shareSuccess && (
          <div style={styles.successBox}>
            Shared successfully!
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
  title: {
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 20px 0',
  },
  codeContainer: {
    marginBottom: '16px',
  },
  codeLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '6px',
  },
  codeBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '2px solid #e8e8e8',
  },
  code: {
    flex: 1,
    fontSize: '18px',
    fontWeight: '700',
    color: '#6C3CE1',
    letterSpacing: '1px',
    fontFamily: 'monospace',
  },
  copyButton: {
    background: '#6C3CE1',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'inherit',
  },
  shareButton: {
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
    marginBottom: '20px',
    fontFamily: 'inherit',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '20px',
  },
  statItem: {
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    padding: '12px',
    borderRadius: '12px',
  },
  statNumber: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
  },
  howItWorks: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  },
  howTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px 0',
  },
  howList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#555',
    lineHeight: '1.8',
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    padding: '12px',
    borderRadius: '10px',
    textAlign: 'center',
    color: '#2e7d32',
    fontSize: '14px',
    marginTop: '12px',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '20px',
  },
  error: {
    textAlign: 'center',
    color: '#c62828',
    padding: '20px',
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

export default ReferralSection;