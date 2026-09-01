import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.date}>Last Updated: September 1, 2026</p>

        <div style={styles.section}>
          <h2 style={styles.heading}>1. Information We Collect</h2>
          <p style={styles.text}>
            We collect information you provide: name, phone number, email, location, profile photos, interests, and payment information. We also collect usage data and device information.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>2. How We Use Your Information</h2>
          <p style={styles.text}>
            We use your information to: provide and improve our services, verify your identity, facilitate gifts and payments, communicate with you, and ensure platform safety.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>3. Verification & Identity</h2>
          <p style={styles.text}>
            We use Opay and NIN verification to confirm identities. Your legal name from verification will be used on your profile and cannot be changed.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>4. Data Sharing</h2>
          <p style={styles.text}>
            We do not sell your personal data. We may share information with: (a) service providers (payment processing, hosting), (b) law enforcement when required, or (c) with your consent.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>5. Data Security</h2>
          <p style={styles.text}>
            We implement security measures to protect your data. However, no method of transmission over the internet is 100% secure.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>6. Your Rights</h2>
          <p style={styles.text}>
            You have the right to: access your data, correct inaccurate data, delete your account, and withdraw consent. Contact us to exercise these rights.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>7. Data Retention</h2>
          <p style={styles.text}>
            We retain your data as long as your account is active. After deletion, we retain anonymized data for analytics and legal compliance.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>8. Cookies</h2>
          <p style={styles.text}>
            We use cookies for authentication, preferences, and analytics. You can manage cookie preferences in your browser settings.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>9. Third-Party Services</h2>
          <p style={styles.text}>
            We use third-party services: Opay (verification), Paystack (payments), and Vercel (hosting). These services have their own privacy policies.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>10. Updates to This Policy</h2>
          <p style={styles.text}>
            We may update this Privacy Policy. Continued use of the Platform constitutes acceptance of the updated policy.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.heading}>11. Contact Us</h2>
          <p style={styles.text}>
            For privacy questions, contact: support@vibra.ng
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

export default Privacy;