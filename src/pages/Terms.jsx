import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.date}>Last Updated: September 1, 2026</p>

        <div style={styles.section}>
          <h2 style={styles.heading}>1. Acceptance of Terms</h2>
          <p style={styles.text}>
            By using VIBRA ("the Platform"), you agree to these Terms of Service. If you do not agree, please do not use the Platform.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>2. Eligibility</h2>
          <p style={styles.text}>
            You must be at least 18 years old to use VIBRA. By using the Platform, you confirm that you are 18 or older.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>3. User Accounts</h2>
          <p style={styles.text}>
            You are responsible for maintaining the confidentiality of your account. You agree to provide accurate information and update it as needed.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>4. Verification & Identity</h2>
          <p style={styles.text}>
            VIBRA uses Opay and NIN verification to confirm user identities. Your profile name will automatically match your verified legal name upon first transaction. This cannot be undone.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>5. Gifts & Payments</h2>
          <p style={styles.text}>
            All gifts are purchased using points (₦1 = 2 points). Service gifts have a 20% commission. Cash gifts have a 5% withdrawal fee. All payments are final.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>6. Prohibited Conduct</h2>
          <p style={styles.text}>
            You may not: (a) create fake profiles, (b) harass or abuse other users, (c) send spam, (d) engage in fraudulent activities, (e) share explicit content, or (f) use the Platform for illegal purposes.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>7. Termination</h2>
          <p style={styles.text}>
            We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason at our discretion.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>8. Limitation of Liability</h2>
          <p style={styles.text}>
            VIBRA is provided "as is". We are not liable for any damages arising from your use of the Platform. All dates and interactions are at your own risk.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>9. Changes to Terms</h2>
          <p style={styles.text}>
            We may update these Terms at any time. Continued use of the Platform constitutes acceptance of the updated Terms.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>10. Contact</h2>
          <p style={styles.text}>
            For questions, contact us at: support@vibra.ng
          </p>
        </div>

        <Link to="/" style={styles.backButton}>Back to Home</Link>

        <p style={styles.credit}>Powered by LabelReach</p>
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
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '700px',
    width: '100%',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 4px 0',
  },
  date: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 24px 0',
  },
  section: {
    marginBottom: '20px',
  },
  heading: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  text: {
    fontSize: '15px',
    color: '#444',
    lineHeight: '1.6',
    margin: 0,
  },
  backButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center',
    marginTop: '16px',
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

export default Terms;