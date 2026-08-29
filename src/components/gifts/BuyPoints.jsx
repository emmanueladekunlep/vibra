/**
 * VIBRA - Buy Points, Level & Verification Component
 * Module: Gift Store
 * 
 * Users can buy points, upgrade their level, or buy verification badge.
 * Manual mode: shows LabelReach bank details.
 * Admin adds points/level/verification manually after payment confirmation.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// LabelReach bank details
const LABELREACH_BANK = {
  name: 'LABELREACH ADVERTISING LTD',
  bank: 'O Pay',
  account: '611-049-9938',
  note: 'Licensed by CBN | Insured by NDIC'
};

const WHATSAPP_NUMBER = '07032977572';

const POINTS_PACKAGES = [
  { amount: 500, points: 1000, price: 500 },
  { amount: 1000, points: 2000, price: 1000 },
  { amount: 2500, points: 5000, price: 2500 },
  { amount: 5000, points: 10000, price: 5000 },
  { amount: 10000, points: 20000, price: 10000 },
];

const ALL_LEVELS = [
  { level: 'Silver', points: 10000, price: 5000, perks: '5 photos, 1 boost/week' },
  { level: 'Gold', points: 25000, price: 12000, perks: '10 photos, 3 boosts/week' },
  { level: 'Platinum', points: 50000, price: 25000, perks: 'Unlimited photos, free Premium' },
  { level: 'Diamond', points: 100000, price: 50000, perks: 'Exclusive badge, VIP events' },
];

const LEVEL_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

const BuyPoints = ({ onClose, onPurchaseComplete }) => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('points');

  const hasWithdrawn = user?.hasWithdrawn || false;
  const userID = user?.userId || 'N/A';

  const getAvailableLevels = () => {
    const currentLevel = user?.level || 'Bronze';
    const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
    
    if (currentLevel === 'Diamond') {
      return [];
    }
    
    const availableLevelNames = LEVEL_ORDER.slice(currentIndex + 1);
    return ALL_LEVELS.filter(lvl => availableLevelNames.includes(lvl.level));
  };

  const availableLevels = getAvailableLevels();
  const isMaxLevel = user?.level === 'Diamond';
  const isAlreadyVerified = user?.isVerified || false;

  const getVerificationPrice = () => {
    return hasWithdrawn ? 5000 : 10000;
  };

  const verificationPrice = getVerificationPrice();
  const verificationLabel = hasWithdrawn ? '₦5,000' : '₦10,000';

  // Generate WhatsApp message with User ID
  const getWhatsAppMessage = (item, price) => {
    let itemName = '';
    if (item.type === 'points') {
      itemName = `${item.points} points`;
    } else if (item.type === 'level') {
      itemName = `${item.level} Level`;
    } else if (item.type === 'verification') {
      itemName = 'Verified Badge';
    }
    return `Hello Vibra Support,%0A%0AUser ID: ${userID}%0AItem: ${itemName}%0AAmount: ₦${price.toLocaleString()}%0APayment made via transfer. Please confirm.%0A%0AThank you.`;
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setSelectedLevel(null);
    setError(null);
    setSuccess(null);
    setShowBankDetails(true);
  };

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    setSelectedPackage(null);
    setError(null);
    setSuccess(null);
    setShowBankDetails(true);
  };

  const handleSelectVerification = () => {
    if (isAlreadyVerified) {
      setError('You are already verified!');
      return;
    }
    setSelectedPackage(null);
    setSelectedLevel(null);
    setError(null);
    setSuccess(null);
    setShowBankDetails(true);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const getSelectedItem = () => {
    if (selectedPackage) {
      return {
        type: 'points',
        label: `${selectedPackage.points} points`,
        price: selectedPackage.price,
        points: selectedPackage.points,
      };
    }
    if (selectedLevel) {
      return {
        type: 'level',
        label: `${selectedLevel.level} Level`,
        price: selectedLevel.price,
        points: selectedLevel.points,
        level: selectedLevel.level,
      };
    }
    if (showBankDetails && !selectedPackage && !selectedLevel) {
      return {
        type: 'verification',
        label: 'Verified Badge',
        price: verificationPrice,
        points: 0,
      };
    }
    return null;
  };

  const selected = getSelectedItem();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Buy Points & Levels</h3>
          {onClose && (
            <button onClick={handleClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        {/* User ID Display */}
        <div style={styles.userIdBox}>
          <span style={styles.userIdLabel}>Your User ID:</span>
          <span style={styles.userIdValue}>{userID}</span>
          <span style={styles.userIdNote}>Use this ID when making payment</span>
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'points' ? styles.tabActive : {}),
            }}
            onClick={() => {
              setActiveTab('points');
              setSelectedPackage(null);
              setSelectedLevel(null);
              setShowBankDetails(false);
              setError(null);
              setSuccess(null);
            }}
          >
            Buy Points
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'level' ? styles.tabActive : {}),
            }}
            onClick={() => {
              setActiveTab('level');
              setSelectedPackage(null);
              setSelectedLevel(null);
              setShowBankDetails(false);
              setError(null);
              setSuccess(null);
            }}
          >
            Buy Level
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'verification' ? styles.tabActive : {}),
            }}
            onClick={() => {
              setActiveTab('verification');
              setSelectedPackage(null);
              setSelectedLevel(null);
              setShowBankDetails(false);
              setError(null);
              setSuccess(null);
            }}
          >
            Get Verified
          </button>
        </div>

        {activeTab === 'points' && (
          <>
            <p style={styles.subtitle}>
              ₦1 = 2 points. Select a package below.
            </p>
            <div style={styles.packageGrid}>
              {POINTS_PACKAGES.map((pkg) => (
                <div
                  key={pkg.amount}
                  style={{
                    ...styles.packageCard,
                    ...(selectedPackage?.amount === pkg.amount ? styles.packageCardSelected : {}),
                  }}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  <span style={styles.packagePoints}>{pkg.points.toLocaleString()} points</span>
                  <span style={styles.packagePrice}>₦{pkg.price.toLocaleString()}</span>
                  <span style={styles.packageRate}>₦{pkg.amount} = {pkg.points} pts</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'level' && (
          <>
            {isMaxLevel ? (
              <div style={styles.maxLevelContainer}>
                <p style={styles.maxLevelText}>🎉 You are already at the highest level!</p>
                <p style={styles.maxLevelSubtext}>You have reached Diamond level. Enjoy all perks.</p>
              </div>
            ) : availableLevels.length === 0 ? (
              <div style={styles.maxLevelContainer}>
                <p style={styles.maxLevelText}>No levels available to purchase</p>
                <p style={styles.maxLevelSubtext}>You are already at the highest level.</p>
              </div>
            ) : (
              <>
                <p style={styles.subtitle}>
                  Upgrade from <strong>{user?.level || 'Bronze'}</strong> to a higher level. Select below.
                </p>
                <div style={styles.packageGrid}>
                  {availableLevels.map((lvl) => (
                    <div
                      key={lvl.level}
                      style={{
                        ...styles.packageCard,
                        ...(selectedLevel?.level === lvl.level ? styles.packageCardSelected : {}),
                      }}
                      onClick={() => handleSelectLevel(lvl)}
                    >
                      <span style={styles.packagePoints}>{lvl.level}</span>
                      <span style={styles.packagePrice}>₦{lvl.price.toLocaleString()}</span>
                      <span style={styles.packageRate}>{lvl.points.toLocaleString()} points</span>
                      <span style={styles.packagePerks}>{lvl.perks}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'verification' && (
          <>
            {isAlreadyVerified ? (
              <div style={styles.maxLevelContainer}>
                <p style={styles.maxLevelText}>✅ You are already verified!</p>
                <p style={styles.maxLevelSubtext}>Your profile shows the Verified badge.</p>
              </div>
            ) : (
              <>
                <p style={styles.subtitle}>
                  Get the Verified badge on your profile.
                </p>
                <div style={styles.verificationCard}>
                  <div style={styles.verificationIcon}>✓</div>
                  <h4 style={styles.verificationTitle}>Verified Badge</h4>
                  <p style={styles.verificationDesc}>
                    A green checkmark next to your name shows others you are a trusted user.
                  </p>
                  <div style={styles.verificationPriceRow}>
                    <span style={styles.verificationPriceLabel}>Price:</span>
                    <span style={styles.verificationPriceValue}>{verificationLabel}</span>
                  </div>
                  {hasWithdrawn ? (
                    <p style={styles.verificationNote}>
                      ✅ You have withdrawn before → Discounted price: ₦5,000
                    </p>
                  ) : (
                    <p style={styles.verificationNote}>
                      ℹ️ You have not withdrawn yet → Standard price: ₦10,000
                    </p>
                  )}
                  <button
                    onClick={handleSelectVerification}
                    style={styles.verificationButton}
                  >
                    Get Verified - {verificationLabel}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {showBankDetails && selected && (
          <div style={styles.bankDetails}>
            <h4 style={styles.bankTitle}>Pay to this account</h4>
            <div style={styles.bankRow}>
              <span style={styles.bankLabel}>Bank:</span>
              <span style={styles.bankValue}>{LABELREACH_BANK.bank}</span>
            </div>
            <div style={styles.bankRow}>
              <span style={styles.bankLabel}>Account Number:</span>
              <span style={styles.bankValue}>{LABELREACH_BANK.account}</span>
            </div>
            <div style={styles.bankRow}>
              <span style={styles.bankLabel}>Account Name:</span>
              <span style={styles.bankValue}>{LABELREACH_BANK.name}</span>
            </div>
            <div style={styles.bankNote}>
              <p style={styles.bankNoteText}>
                <strong>Important:</strong> Use your User ID as payment reference
              </p>
              <p style={styles.bankNoteText}>
                Your User ID: <strong>{userID}</strong>
              </p>
              <p style={styles.bankNoteText}>
                Item: <strong>{selected.label}</strong>
              </p>
              <p style={styles.bankNoteText}>
                Amount: <strong>₦{selected.price.toLocaleString()}</strong>
              </p>
              {selected.type === 'level' && (
                <p style={styles.bankNoteText}>
                  Points: <strong>{selected.points.toLocaleString()} points</strong>
                </p>
              )}
              {selected.type === 'verification' && (
                <p style={styles.bankNoteText}>
                  After payment, your profile will show the Verified badge.
                </p>
              )}
              <p style={styles.bankNoteText}>
                After payment, click the button below to send payment confirmation via WhatsApp:
              </p>
            </div>
          </div>
        )}

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

        {showBankDetails && selected && !success && (
          <div style={styles.actionContainer}>
            <button
              onClick={() => {
                setShowBankDetails(false);
                setSelectedPackage(null);
                setSelectedLevel(null);
                setError(null);
              }}
              style={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${getWhatsAppMessage(selected, selected.price)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.whatsappButton}
            >
              Send Payment Confirmation
            </a>
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
  userIdBox: {
    backgroundColor: '#f0edff',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
    textAlign: 'center',
    border: '1px solid #d4c4f0',
  },
  userIdLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
  },
  userIdValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#6C3CE1',
    fontFamily: 'monospace',
    letterSpacing: '2px',
  },
  userIdNote: {
    display: 'block',
    fontSize: '11px',
    color: '#888',
    marginTop: '4px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid #e8e8e8',
    marginBottom: '16px',
    marginTop: '8px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#666',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#6C3CE1',
    borderBottomColor: '#6C3CE1',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
  },
  packageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '16px',
  },
  packageCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  packageCardSelected: {
    borderColor: '#6C3CE1',
    backgroundColor: '#f0edff',
  },
  packagePoints: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  packagePrice: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6C3CE1',
    marginTop: '4px',
  },
  packageRate: {
    display: 'block',
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  packagePerks: {
    display: 'block',
    fontSize: '11px',
    color: '#666',
    marginTop: '6px',
    fontStyle: 'italic',
  },
  maxLevelContainer: {
    textAlign: 'center',
    padding: '30px 20px',
    backgroundColor: '#f0edff',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  maxLevelText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#6C3CE1',
    margin: '0 0 8px 0',
  },
  maxLevelSubtext: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  verificationCard: {
    border: '2px solid #00B894',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    marginBottom: '16px',
  },
  verificationIcon: {
    fontSize: '48px',
    color: '#00B894',
    marginBottom: '8px',
  },
  verificationTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  verificationDesc: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  verificationPriceRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '16px',
    marginBottom: '8px',
  },
  verificationPriceLabel: {
    color: '#666',
  },
  verificationPriceValue: {
    fontWeight: '700',
    color: '#6C3CE1',
  },
  verificationNote: {
    fontSize: '13px',
    color: '#555',
    backgroundColor: '#fff3cd',
    padding: '8px 12px',
    borderRadius: '8px',
    margin: '0 0 16px 0',
  },
  verificationButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#00B894',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
  },
  bankDetails: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  bankTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 10px 0',
    textAlign: 'center',
  },
  bankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '14px',
  },
  bankLabel: {
    color: '#666',
  },
  bankValue: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  bankNote: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '1px solid #ffc107',
  },
  bankNoteText: {
    fontSize: '13px',
    color: '#856404',
    margin: '4px 0',
    textAlign: 'center',
  },
  actionContainer: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#555',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  whatsappButton: {
    flex: 2,
    padding: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#25D366',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'center',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '8px',
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
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '12px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
    whiteSpace: 'pre-line',
    textAlign: 'center',
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

export default BuyPoints;