/**
 * VIBRA - Withdrawal Component
 * Module: Gift Store
 * 
 * User requests withdrawal of points to Naira.
 * Points deducted instantly. WhatsApp notification to admin.
 * 2 points = ₦1
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as giftService from '../../services/giftService';

const WHATSAPP_NUMBER = '07032977572';
const POINTS_PER_NAIRA = 2;

const GiftRedemption = ({ onRedeemed, onClose }) => {
  const { user, updateUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [withdrawalData, setWithdrawalData] = useState(null);

  const userPoints = user?.points || 0;
  const maxNaira = Math.floor(userPoints / POINTS_PER_NAIRA);
  const nairaAmount = parseFloat(amount) || 0;
  const pointsRequired = nairaAmount * POINTS_PER_NAIRA;
  const canWithdraw = nairaAmount > 0 && pointsRequired <= userPoints && bankName && accountNumber && accountName;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setWithdrawalData(null);

    if (nairaAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (nairaAmount < 100) {
      setError('Minimum withdrawal is ₦100');
      return;
    }

    if (pointsRequired > userPoints) {
      setError(`Insufficient points. You need ${pointsRequired.toLocaleString()} points, you have ${userPoints.toLocaleString()}`);
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      setError('Please fill in all bank details');
      return;
    }

    if (!confirm(`Withdraw ₦${nairaAmount.toLocaleString()}?\n\nThis will deduct ${pointsRequired.toLocaleString()} points from your account immediately.\n\nMoney will be sent to:\n${bankName}\n${accountNumber}\n${accountName}`)) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await giftService.requestWithdrawal(user.userId, nairaAmount);

      setWithdrawalData({
        amount: nairaAmount,
        pointsDeducted: result.points_deducted,
        withdrawalId: result.withdrawal_id,
        newBalance: result.new_points_balance,
      });

      // Update user's cached points
      if (result.new_points_balance !== undefined) {
        updateUser({ points: result.new_points_balance });
      }

      // Open WhatsApp with message TO ADMIN asking admin to send money to user
      const message = `🔔 *VIBRA WITHDRAWAL REQUEST*

👤 *User ID:* ${user.userId}
👤 *Name:* ${user.name || 'N/A'}
📱 *Phone:* ${user.phone || 'N/A'}

💵 *Amount to Send:* ₦${nairaAmount.toLocaleString()}
🪙 *Points Deducted:* ${result.points_deducted.toLocaleString()}
📝 *Reference:* #${result.withdrawal_id}
📅 *Date:* ${new Date().toLocaleString()}

🏦 *Please send the money to:*
Bank: ${bankName}
Account Number: ${accountNumber}
Account Name: ${accountName}

I have submitted this withdrawal request. Please process it within 24 hours.`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      setSuccess(`Withdrawal request submitted!\n\n₦${nairaAmount.toLocaleString()} will be sent to your bank account within 24 hours.`);
      setAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      if (onRedeemed) {
        onRedeemed(result);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit withdrawal request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleQuickAmount = (value) => {
    if (value <= maxNaira) {
      setAmount(value.toString());
    } else {
      setAmount(maxNaira.toString());
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Withdraw to Bank</h3>
          {onClose && (
            <button onClick={handleClose} style={styles.closeButton}>
              Close
            </button>
          )}
        </div>

        <div style={styles.balanceBox}>
          <span style={styles.balanceLabel}>Your Balance</span>
          <span style={styles.balancePoints}>{userPoints.toLocaleString()} points</span>
          <span style={styles.balanceNaira}>≈ ₦{maxNaira.toLocaleString()} withdrawable</span>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        {success && (
          <div style={styles.successBox}>
            <p style={styles.successText}>{success}</p>
            {withdrawalData && (
              <div style={styles.receiptBox}>
                <div style={styles.receiptRow}>
                  <span>Amount:</span>
                  <strong>₦{withdrawalData.amount.toLocaleString()}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span>Points deducted:</span>
                  <strong>{withdrawalData.pointsDeducted.toLocaleString()}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span>Reference:</span>
                  <strong>#{withdrawalData.withdrawalId}</strong>
                </div>
                <div style={styles.receiptRow}>
                  <span>New balance:</span>
                  <strong>{withdrawalData.newBalance.toLocaleString()} points</strong>
                </div>
              </div>
            )}
            <button onClick={handleClose} style={styles.doneButton}>
              Done
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Amount to Withdraw (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                style={styles.amountInput}
                min="100"
                max={maxNaira}
                step="50"
                disabled={isLoading}
                autoFocus
              />
              {nairaAmount > 0 && (
                <p style={styles.conversionText}>
                  = {pointsRequired.toLocaleString()} points will be deducted
                </p>
              )}
            </div>

            <div style={styles.quickAmounts}>
              {[500, 1000, 2000, 5000].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuickAmount(value)}
                  style={{
                    ...styles.quickButton,
                    ...(value > maxNaira ? styles.quickButtonDisabled : {}),
                  }}
                  disabled={value > maxNaira || isLoading}
                >
                  ₦{value.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleQuickAmount(maxNaira)}
                style={{
                  ...styles.quickButton,
                  ...styles.quickButtonMax,
                }}
                disabled={maxNaira < 100 || isLoading}
              >
                Max (₦{maxNaira.toLocaleString()})
              </button>
            </div>

            <div style={styles.bankSection}>
              <p style={styles.bankSectionTitle}>Bank Details (for receiving money)</p>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Opay, GTBank, Access Bank"
                  style={styles.input}
                  disabled={isLoading}
                  maxLength="50"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 digits"
                  style={styles.input}
                  disabled={isLoading}
                  maxLength="10"
                  inputMode="numeric"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name on bank account"
                  style={styles.input}
                  disabled={isLoading}
                  maxLength="100"
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(!canWithdraw ? styles.buttonDisabled : {}),
              }}
              disabled={!canWithdraw || isLoading}
            >
              {isLoading ? 'Processing...' : `Withdraw ₦${nairaAmount > 0 ? nairaAmount.toLocaleString() : '0'}`}
            </button>
          </form>
        )}

        {!success && (
          <div style={styles.infoBox}>
            <p style={styles.infoTitle}>How it works</p>
            <ul style={styles.infoList}>
              <li>2 points = ₦1</li>
              <li>Minimum withdrawal: ₦100</li>
              <li>Points deducted instantly</li>
              <li>Admin will send ₦ to your bank within 24 hours</li>
              <li>You'll receive a WhatsApp confirmation from admin</li>
            </ul>
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
  balanceBox: {
    backgroundColor: '#f0edff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'center',
    border: '1px solid #d4c4f0',
  },
  balanceLabel: {
    fontSize: '12px',
    color: '#666',
    display: 'block',
    marginBottom: '4px',
  },
  balancePoints: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#721CBB',
    display: 'block',
  },
  balanceNaira: {
    fontSize: '14px',
    color: '#10964D',
    fontWeight: '600',
    display: 'block',
    marginTop: '4px',
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
  amountInput: {
    width: '100%',
    padding: '14px',
    fontSize: '20px',
    fontWeight: '700',
    textAlign: 'center',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
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
  conversionText: {
    fontSize: '13px',
    color: '#721CBB',
    margin: '6px 0 0 0',
    textAlign: 'center',
    fontWeight: '600',
  },
  quickAmounts: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  quickButton: {
    flex: '1 0 auto',
    padding: '8px 12px',
    backgroundColor: 'white',
    border: '1.5px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#721CBB',
    cursor: 'pointer',
    fontFamily: 'inherit',
    minWidth: '70px',
  },
  quickButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  quickButtonMax: {
    backgroundColor: '#f0edff',
    borderColor: '#721CBB',
    flexBasis: '100%',
  },
  bankSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '16px',
    border: '1px solid #e8e8e8',
  },
  bankSectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 10px 0',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#10964D',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
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
    padding: '16px',
    border: '1px solid #c8e6c9',
    textAlign: 'center',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    whiteSpace: 'pre-line',
  },
  receiptBox: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    textAlign: 'left',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: '13px',
    color: '#555',
  },
  doneButton: {
    padding: '10px 24px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  infoBox: {
    marginTop: '20px',
    padding: '14px',
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 8px 0',
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '12px',
    color: '#666',
    lineHeight: '1.8',
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

export default GiftRedemption;