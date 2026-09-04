/**
 * VIBRA - Profile Component - FIXED
 * Brand: Vib #721CBB purple, ra #10964D green, pulse
 * Matches screenshot: Peace / Diamond / 51000 points
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import * as profileService from '../../services/profileService';
import * as chatService from '../../services/chatService';

const getZodiacSign = (dob) => {
  if (!dob) return null;
  const date = new Date(dob);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const signs = [
    { sign: 'Capricorn', start: { month: 1, day: 1 }, end: { month: 1, day: 19 } },
    { sign: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { sign: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
    { sign: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { sign: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { sign: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { sign: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { sign: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { sign: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { sign: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { sign: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { sign: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
    { sign: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 12, day: 31 } },
  ];
  for (const s of signs) {
    if (month === s.start.month && day >= s.start.day) return s.sign;
    if (month === s.end.month && day <= s.end.day) return s.sign;
  }
  return 'Capricorn';
};

const getLuckyNumber = (dob) => {
  if (!dob) return null;
  const date = new Date(dob);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let sum = day + month + year;
  while (sum > 9) {
    sum = String(sum).split('').reduce((a, b) => a + Number(b), 0);
  }
  return sum;
};

const getZodiacEmoji = (sign) => {
  const map = {
    'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
    'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
    'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓',
  };
  return map[sign] || '♈';
};

const LoadingSpinner = () => (
  <div style={styles.spinnerContainer}>
    <div style={styles.spinner}></div>
  </div>
);

// Pulsing Logo Mini for profile header
const VibraLogoMini = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    <span style={{ color: '#721CBB', fontWeight: 900, fontSize: 18, letterSpacing: '-1px' }}>VIB</span>
    <div style={{ width: 44, height: 14, margin: '0 -2px', display: 'flex', alignItems: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 80 20" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <path d="M0 10 L20 10 L24 2 L28 18 L32 10 L40 10 L48 10 L52 3 L56 17 L60 10 L80 10"
          stroke="#721CBB" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="14 160" className="vibra-pulse-mini"
        />
      </svg>
    </div>
    <span style={{ color: '#10964D', fontWeight: 900, fontSize: 18, letterSpacing: '-1px', position: 'relative' }}>
      RA
      <span style={{ position: 'absolute', top: '18%', right: '22%', fontSize: 5, color: 'white' }}>♥</span>
    </span>
    <style>{`@keyframes pulseMini {0%{stroke-dashoffset:120}100%{stroke-dashoffset:-120}} .vibra-pulse-mini{animation:pulseMini 1.3s linear infinite}`}</style>
  </div>
);

const Profile = ({ userId: propUserId, onEdit }) => {
  const { user } = useAuth();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const targetUserId = propUserId || paramUserId || user?.id;
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const isOwner = user?.id === targetUserId || user?.userId === targetUserId;

  useEffect(() => {
    const loadProfile = async () => {
      if (!targetUserId) { setIsLoading(false); return; }
      setIsLoading(true); setError(null);
      try {
        const userIdStr = String(targetUserId);
        const data = await profileService.getProfile(userIdStr);
        setProfile(data);
        const blockedUsers = await profileService.getBlockedUsers();
        const blockedArray = Array.isArray(blockedUsers) ? blockedUsers : [];
        setBlocked(blockedArray.includes(userIdStr));
      } catch (err) {
        setError('Failed to load profile');
      } finally { setIsLoading(false); }
    };
    loadProfile();
  }, [targetUserId]);

  const handleBlock = async () => {
    if (!confirm(`Block ${profile?.name}?`)) return;
    try { await profileService.blockUser(targetUserId); setBlocked(true); alert(`${profile?.name} has been blocked.`); }
    catch (err) { setError('Failed to block user'); }
  };
  const handleUnblock = async () => {
    if (!confirm(`Unblock ${profile?.name}?`)) return;
    try { await profileService.unblockUser(targetUserId); setBlocked(false); alert(`${profile?.name} has been unblocked.`); }
    catch (err) { setError('Failed to unblock user'); }
  };
  const handleReport = async () => {
    const reason = prompt('Report reason (1-5):\n1. Fake profile\n2. Harassment\n3. Scam\n4. Inappropriate\n5. Other');
    if (!reason) return;
    setReporting(true);
    try { await profileService.reportUser(targetUserId, reason); alert(`Thank you for reporting ${profile?.name}.`); }
    catch (err) { setError('Failed to report'); } finally { setReporting(false); }
  };
  const handleChat = async () => {
    if (!user || !profile) return;
    setStartingChat(true);
    try {
      const conversation = await chatService.getOrCreateConversation(user.id, profile.id);
      navigate(`/chat/${conversation.id}`);
    } catch (err) { alert('Failed to start chat.'); } finally { setStartingChat(false); }
  };

  const getLevelColor = (level) => {
    const colors = {
      'Bronze': '#CD7F32', 'Silver': '#C0C0C0', 'Gold': '#FFD700',
      'Platinum': '#E5E4E2', 'Diamond': '#721CBB', 'VIP': '#10964D'
    };
    return colors[level] || '#721CBB';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorCard}>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.backButton} onClick={() => navigate(-1)}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const displayProfile = profile || user;
  const zodiac = getZodiacSign(displayProfile?.dob || displayProfile?.dateOfBirth);
  const lucky = getLuckyNumber(displayProfile?.dob || displayProfile?.dateOfBirth);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header with Avatar - NEW DESIGN matches screenshot */}
        <div style={styles.header}>
          <div style={styles.avatarContainer}>
            {displayProfile?.avatar || displayProfile?.photoURL ? (
              <img src={displayProfile.avatar || displayProfile.photoURL} alt={displayProfile.name} style={styles.avatar} />
            ) : (
              <div style={styles.avatarPlaceholder}>{displayProfile?.name?.charAt(0) || 'P'}</div>
            )}
            {/* Level Badge on avatar */}
            <div style={{ ...styles.levelBadge, backgroundColor: getLevelColor(displayProfile?.level || 'Diamond') }}>
              {displayProfile?.level || 'Diamond'}
            </div>
            {/* Pulsing ring */}
            <div style={styles.avatarPulseRing} />
          </div>

          <div style={styles.userInfo}>
            <div style={styles.nameRow}>
              <h2 style={styles.name}>{displayProfile?.name || 'Peace'}</h2>
              {displayProfile?.isVerified && <span style={styles.verifiedBadge}>✓ Verified</span>}
            </div>
            <p style={styles.subName}>{displayProfile?.name || 'Peace'}</p>
            <p style={styles.diamondText}>● {displayProfile?.level || 'Diamond'}</p>
            
            <div style={styles.statsPillRow}>
              <span style={styles.statPillPurple}>◆ {displayProfile?.level || 'Diamond'} Level</span>
              <span style={styles.statPillGreen}>{displayProfile?.points || '51000'} Points</span>
              {displayProfile?.isVerified && <span style={styles.statPillVerified}>✓ Verified</span>}
            </div>

            {zodiac && <p style={styles.zodiacText}>{getZodiacEmoji(zodiac)} {zodiac} • Lucky {lucky}</p>}
            {displayProfile?.location && <p style={styles.location}>📍 {displayProfile.location}</p>}
          </div>
        </div>

        {/* Points Banner - as in screenshot */}
        <div style={styles.pointsBanner}>
          <div>
            <p style={styles.pointsLabel}>Vibra Points</p>
            <p style={styles.pointsValue}>{displayProfile?.points || 51000}</p>
          </div>
          <div style={styles.pointsIcon}>⚡</div>
        </div>

        {displayProfile?.bio && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>About</h3>
            <p style={styles.bio}>{displayProfile.bio}</p>
          </div>
        )}

        {displayProfile?.interests && displayProfile.interests.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Interests</h3>
            <div style={styles.interestsContainer}>
              {displayProfile.interests.map((interest, idx) => (
                <span key={idx} style={styles.interestTag}>{interest}</span>
              ))}
            </div>
          </div>
        )}

        {displayProfile?.photos && displayProfile.photos.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Photos</h3>
            <div style={styles.photoGrid}>
              {displayProfile.photos.map((photo, idx) => (
                <img key={idx} src={photo} alt={`Photo ${idx+1}`} style={styles.photoThumb} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isOwner ? (
          <button style={styles.editButton} onClick={() => onEdit ? onEdit() : navigate('/edit-profile')}>
            Edit Profile
          </button>
        ) : (
          <div style={styles.actionRow}>
            <button style={{ ...styles.actionButton, backgroundColor: '#721CBB' }} onClick={handleChat} disabled={startingChat}>
              {startingChat ? 'Starting...' : 'Chat'}
            </button>
            <button style={{ ...styles.actionButton, backgroundColor: blocked ? '#10964D' : '#FF6B35' }} onClick={blocked ? handleUnblock : handleBlock}>
              {blocked ? 'Unblock' : 'Block'}
            </button>
            <button style={{ ...styles.actionButton, backgroundColor: '#f5f0f8', color: '#721CBB' }} onClick={handleReport} disabled={reporting}>
              {reporting ? '...' : 'Report'}
            </button>
          </div>
        )}

        <div style={styles.credit}>
          <VibraLogoMini />
          <p style={{ marginTop: 6, fontSize: 10, letterSpacing: '2px', color: '#aaa' }}>CONNECT. VIBE. LOVE.</p>
          <p style={{ fontSize: 10, color: '#ccc', marginTop: 8 }}>Powered by LabelReach</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    backgroundColor: '#f8f7fb',
    padding: '16px',
    fontFamily: 'Inter, Poppins, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '20px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(114,28,187,0.08)',
    border: '1px solid #F3E8FF',
  },
  header: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
    width: '86px',
    height: '86px',
  },
  avatar: {
    width: '86px',
    height: '86px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #721CBB',
    position: 'relative',
    zIndex: 2,
  },
  avatarPlaceholder: {
    width: '86px',
    height: '86px',
    borderRadius: '50%',
    backgroundColor: '#721CBB',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '34px',
    fontWeight: '800',
    border: '3px solid #721CBB',
    position: 'relative',
    zIndex: 2,
  },
  avatarPulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: '94px',
    height: '94px',
    borderRadius: '50%',
    border: '2px solid rgba(114,28,187,0.2)',
    animation: 'avatarPulse 2s infinite',
    zIndex: 1,
  },
  levelBadge: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '3px 12px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '800',
    color: 'white',
    border: '2.5px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 3,
    letterSpacing: '0.5px',
  },
  userInfo: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' },
  name: { fontSize: '20px', fontWeight: '800', margin: 0, color: '#1a1a1a', letterSpacing: '-0.3px' },
  subName: { fontSize: '13px', color: '#888', margin: '0 0 2px 0' },
  diamondText: { fontSize: '12px', color: '#721CBB', fontWeight: '700', margin: '0 0 8px 0' },
  verifiedBadge: {
    backgroundColor: '#10964D',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '20px',
    letterSpacing: '0.3px',
  },
  statsPillRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' },
  statPillPurple: { fontSize: '11px', color: '#721CBB', backgroundColor: '#F5F0FF', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
  statPillGreen: { fontSize: '11px', color: '#10964D', backgroundColor: '#E8F8EF', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' },
  statPillVerified: { fontSize: '11px', color: '#10964D', backgroundColor: '#E8F8EF', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
  location: { fontSize: '13px', color: '#666', margin: '0 0 4px 0' },
  zodiacText: { fontSize: '12px', color: '#721CBB', fontWeight: '600', margin: '0' },
  pointsBanner: {
    background: 'linear-gradient(135deg, #721CBB 0%, #10964D 100%)',
    borderRadius: '16px',
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    marginBottom: '18px',
  },
  pointsLabel: { fontSize: '11px', margin: 0, opacity: 0.85, letterSpacing: '0.8px', textTransform: 'uppercase' },
  pointsValue: { fontSize: '22px', fontWeight: '800', margin: '2px 0 0 0' },
  pointsIcon: { fontSize: '28px', opacity: 0.9 },
  section: { marginBottom: '18px' },
  sectionTitle: { fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0', letterSpacing: '-0.2px' },
  bio: { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: 0 },
  interestsContainer: { display: 'flex', flexWrap: 'wrap', gap: '7px' },
  interestTag: { backgroundColor: '#F5F0FF', color: '#721CBB', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #EDE5FF' },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' },
  photoThumb: { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '12px', border: '2px solid #F3E8FF' },
  editButton: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    color: 'white',
    backgroundColor: '#721CBB',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '8px',
    fontFamily: 'inherit',
  },
  actionRow: { display: 'flex', gap: '8px', marginTop: '12px' },
  actionButton: {
    flex: 1,
    padding: '11px',
    fontSize: '14px',
    fontWeight: '700',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  errorCard: { padding: '40px', textAlign: 'center' },
  errorText: { color: '#c62828', fontSize: '15px' },
  backButton: {
    padding: '10px 24px',
    backgroundColor: '#721CBB',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
  },
  credit: { textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3E8FF' },
  spinnerContainer: { display: 'flex', justifyContent: 'center', padding: '40px' },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #721CBB',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes avatarPulse { 0% { transform: scale(0.92); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 0; } 100% { transform: scale(1.08); opacity: 0; } }
  `;
  if (!document.head.querySelector('style[data-vibra]')) {
    styleSheet.setAttribute('data-vibra', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default Profile;
