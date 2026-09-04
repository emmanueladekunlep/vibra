/**
 * VIBRA - VIP Code Generator Component - FIXED
 * Brand: #721CBB purple, #10964D green
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
    setError(null); setSuccess(null); setGeneratedCode(null);
    setIsLoading(true);
    try {
      const code = await adminService.generateVIPCode(level, recipientPhone || null, user.id);
      setGeneratedCode(code); setSuccess('VIP code generated successfully!'); setCodes([code, ...codes]);
    } catch (err) { setError(err.message || 'Failed to generate VIP code'); }
    finally { setIsLoading(false); }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => alert('Code copied')).catch(() => {
      const textarea = document.createElement('textarea'); textarea.value = code; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); document.body.removeChild(textarea); alert('Code copied');
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h4 style={styles.title}>VIP Code Generator</h4>
        <span style={styles.subtitle}>Generate one-time VIP codes • Vibra pulse active</span>
      </div>

      <div style={styles.noteBox}>
        <p style={styles.noteText}>💎 Make a user VIP directly from <strong>User Management</strong> tab — select Diamond level.</p>
      </div>

      <div style={styles.form}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>VIP Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={styles.select} disabled={isLoading}>
              <option value="Silver">Silver (10,000 points)</option>
              <option value="Gold">Gold (25,000 points)</option>
              <option value="Platinum">Platinum (50,000 points)</option>
              <option value="Diamond">Diamond (100,000 points)</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Recipient Phone (optional)</label>
            <input type="text" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="08012345678" style={styles.input} disabled={isLoading} />
          </div>
        </div>
        <button onClick={handleGenerate} style={styles.generateButton} disabled={isLoading}>
          {isLoading ? 'Generating...' : `Generate ${level} VIP Code`}
        </button>
      </div>

      {error && <div style={styles.errorBox}><p style={styles.errorText}>{error}</p></div>}
      {success && <div style={styles.successBox}><p style={styles.successText}>{success}</p></div>}

      {generatedCode && (
        <div style={styles.codeResult}>
          <div style={styles.codeHeader}>
            <span style={styles.codeLabel}>Generated VIP Code</span>
            <button onClick={() => handleCopy(generatedCode.code)} style={styles.copyButton}>Copy</button>
          </div>
          <div style={styles.codeDisplay}><span style={styles.codeValue}>{generatedCode.code}</span></div>
          <div style={styles.codeDetails}>
            <span style={styles.codeDetailPill}>Level: {generatedCode.level}</span>
            <span style={styles.codeDetailPillGreen}>Points: {generatedCode.points.toLocaleString()}</span>
            <span style={generatedCode.used ? styles.codeUsed : styles.codeAvailable}>{generatedCode.used ? 'Used' : 'Available'}</span>
          </div>
          <div style={styles.codeNote}>
            <p style={styles.codeNoteText}>This code gives {generatedCode.level} with {generatedCode.points.toLocaleString()} points. VIP points are locked and cannot be cashed out.</p>
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
                <span style={code.used ? styles.historyUsed : styles.historyAvailableTag}>{code.used ? 'Used' : 'Available'}</span>
                <span style={styles.historyDate}>{new Date(code.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p style={styles.credit}>Powered by LabelReach</p>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', fontFamily: 'Inter, Poppins, sans-serif' },
  header: { marginBottom: '14px' },
  title: { fontSize: '15px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 2px 0' },
  subtitle: { fontSize: '12px', color: '#6B7280', margin: 0 },
  noteBox: { backgroundColor: '#F5F0FF', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #E9D5FF' },
  noteText: { fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: '1.5' },
  form: { backgroundColor: '#FAF8FF', padding: '16px', borderRadius: '14px', marginBottom: '14px', border: '1px solid #F3E8FF' },
  formRow: { display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' },
  formGroup: { flex: 1, minWidth: '160px' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid #E9E3F3', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' },
  select: { width: '100%', padding: '10px 14px', fontSize: '13px', border: '1.5px solid #E9E3F3', borderRadius: '10px', outline: 'none', backgroundColor: 'white' },
  generateButton: { width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700', color: 'white', backgroundColor: '#721CBB', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px', border: '1px solid #FECACA' },
  errorText: { color: '#DC2626', fontSize: '12px', margin: 0 },
  successBox: { backgroundColor: '#ECFDF5', borderRadius: '10px', padding: '8px 12px', marginBottom: '10px', border: '1px solid #A7F3D0' },
  successText: { color: '#065F46', fontSize: '12px', margin: 0, fontWeight: '600' },
  codeResult: { border: '2px solid #721CBB', borderRadius: '14px', padding: '14px', marginBottom: '14px', backgroundColor: '#FAF8FF' },
  codeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  codeLabel: { fontSize: '13px', fontWeight: '700', color: '#1a1a1a' },
  copyButton: { padding: '5px 14px', backgroundColor: '#721CBB', color: 'white', border: 'none', borderRadius: '20px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  codeDisplay: { backgroundColor: 'white', padding: '14px', borderRadius: '10px', textAlign: 'center', marginBottom: '10px', border: '1.5px solid #F3E8FF' },
  codeValue: { fontSize: '22px', fontWeight: '800', color: '#721CBB', fontFamily: 'monospace', letterSpacing: '2px' },
  codeDetails: { display: 'flex', gap: '8px', fontSize: '11px', marginBottom: '10px', flexWrap: 'wrap' },
  codeDetailPill: { backgroundColor: '#F5F0FF', color: '#721CBB', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
  codeDetailPillGreen: { backgroundColor: '#ECFDF5', color: '#10964D', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' },
  codeAvailable: { backgroundColor: '#ECFDF5', color: '#10964D', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '11px' },
  codeUsed: { backgroundColor: '#F3F4F6', color: '#6B7280', padding: '4px 10px', borderRadius: '20px', fontWeight: '600', fontSize: '11px' },
  codeNote: { backgroundColor: '#FFFBEB', padding: '8px 12px', borderRadius: '8px', border: '1px solid #FDE68A' },
  codeNoteText: { fontSize: '11px', color: '#92400E', margin: 0, lineHeight: '1.4' },
  historyContainer: { borderTop: '1.5px solid #F3E8FF', paddingTop: '12px', marginTop: '4px' },
  historyTitle: { fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' },
  historyList: { maxHeight: '150px', overflowY: 'auto' },
  historyItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', backgroundColor: '#FAF8FF', borderRadius: '8px', marginBottom: '4px', fontSize: '12px', flexWrap: 'wrap', border: '1px solid #F9F5FF' },
  historyCode: { fontFamily: 'monospace', fontWeight: '700', color: '#721CBB' },
  historyLevel: { color: '#6B7280', fontSize: '11px' },
  historyAvailableTag: { color: '#10964D', fontWeight: '700', fontSize: '11px', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '10px' },
  historyUsed: { color: '#9CA3AF', fontWeight: '600', fontSize: '11px' },
  historyDate: { color: '#9CA3AF', fontSize: '10px', marginLeft: 'auto' },
  credit: { textAlign: 'center', fontSize: '10px', color: '#C4B5D6', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F9F5FF' },
};

export default VIPCodeGenerator;
