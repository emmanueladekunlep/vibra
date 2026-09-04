/**
 * VIBRA - Profile Component
 * Module: User Profile
 * 
 * Displays user profile with photos, bio, interests, level badge, and zodiac.
 * Professional design - no emojis.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import * as profileService from '../../services/profileService';
import * as chatService from '../../services/chatService';

// Zodiac sign calculator
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

// Lucky number calculator
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

// Zodiac emoji
const getZodiacEmoji = (sign) => {
  const map = {
    'Aries': '♈',
    'Taurus': '♉',
    'Gemini': '♊',
    'Cancer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Scorpio': '♏',
    'Sagittarius': '♐',
    'Capricorn': '♑',
    'Aquarius': '♒',
    'Pisces': '♓',
  };
  return map[sign] || '♈';
};

const LoadingSpinner = () => (
  <div style={styles.spinnerContainer}>
    <div style={styles.spinner}></div>
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
  const isFounder = user?.isFounder === true || user?.isFounder === 1;

  useEffect(() => {
    const loadProfile = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const userIdStr = String(targetUserId);
        const data = await profileService.getProfile(userIdStr);
        setProfile(data);
        
        const blockedUsers = await profileService.getBlockedUsers();
        const blockedArray = Array.isArray(blockedUsers) ? blockedUsers : [];
        setBlocked(blockedArray.includes(userIdStr));
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId]);

  const handleBlock = async () => {
    if (!confirm(`Block ${profile?.name}? They will not be able to message you or view your profile.`)) return;
    
    try {
      await profileService.blockUser(targetUserId);
      setBlocked(true);
      alert(`${profile?.name} has been blocked.`);
    } catch (err) {
      setError('Failed to block user');
      console.error(err);
    }
  };

  const handleUnblock = async () => {
    if (!confirm(`Unblock ${profile?.name}?`)) return;
    
    try {
      await profileService.unblockUser(targetUserId);
      setBlocked(false);
      alert(`${profile?.name} has been unblocked.`);
    } catch (err) {
      setError('Failed to unblock user');
      console.error(err);
    }
  };

  const handleReport = async () => {
    const reason = prompt(
      'Report this user. Please select a reason:\n\n' +
      '1. Fake profile / Catfish\n' +
      '2. Harassment / Abuse\n' +
      '3. Scam / Fraud\n' +
      '4. Inappropriate content\n' +
      '5. Other\n\n' +
      'Enter the number (1-5) or describe the issue:'
    );
    
    if (!reason) return;
    
    setReporting(true);
    try {
      await profileService.reportUser(targetUserId, reason);
      alert(`Thank you for reporting ${profile?.name}. Our team will review this.`);
    } catch (err) {
      setError('Failed to report user');
      console.error(err);
    } finally {
      setReporting(false);
    }
  };

  const handleChat = async () => {
    if (!user || !profile) return;
    
    setStartingChat(true);
    try {
      const conversation = await chatService.getOrCreateConversation(user.id, profile.id);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert('Failed to start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      Bronze: '#CD7F32',
      Silver: '#C0C0C0',
      Gold: '#FFD700',
      Platinum: '#E5E4E2',
      Diamond: '#B9F2FF',
    };
    return colors[level] || '#CD7F32';
  };

  const getLevelEmoji = (level) => {
    const emojis = {
      Bronze: '🥉',
      Silver: '🥈',
      Gold: '🥇',
      Platinum: '💎',
      Diamond: '💎',
    };
    return emojis[level] || '🥉';
  };

  const zodiacSign = profile?.dateOfBirth ? getZodiacSign(profile.dateOfBirth) : null;
  const luckyNumber = profile?.dateOfBirth ? getLuckyNumber(profile.dateOfBirth) : null;

  // Get display label for dating pace
  const getDatingPaceLabel = (pace) => {
    const map = {
      'fast': 'Fast Tracker',
      'medium': 'Vetter',
      'slow': 'Pen Pal'
    };
    return map[pace] || pace;
  };

  // Get display label for lifestyle
  const getLifestyleLabel = (style) => {
    const map = {
      'homebody': 'Homebody & Budget-Conscious',
      'luxury': 'Fine Dining & High Luxury',
      'adventurer': 'Outdoor Adventurer & Backpacking',
      'social': 'Social Butterfly',
      'balanced': 'Balanced',
      'fitness': 'Fitness Enthusiast'
    };
    return map[style] || style;
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <p style={styles.errorText}>{error || 'Profile not found'}</p>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatarContainer}>
            {profile.photos && profile.photos.length > 0 ? (
              <img 
                src={profile.photos[0].url} 
                alt={profile.name}
                style={styles.avatar}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span style="${styles.avatarPlaceholder}">${profile.name?.[0] || '?'}</span>`;
                }}
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                {profile.name?.[0] || '?'}
              </div>
            )}
            
            <div style={{
              ...styles.levelBadge,
              backgroundColor: getLevelColor(profile.level),
            }}>
              {getLevelEmoji(profile.level)} {profile.level}
            </div>
          </div>

          <div style={styles.userInfo}>
            <div style={styles.nameRow}>
              <h2 style={styles.name}>
                {profile.name}
              </h2>
              {profile.isVerified && (
                <span style={styles.verifiedBadge}>Verified</span>
              )}
              {isFounder && (
                <span style={{...styles.verifiedBadge, backgroundColor: '#FFD700', color: '#1a1a1a'}}>
                  👑 Founder
                </span>
              )}
            </div>
            <p style={styles.location}>{profile.location || 'Location not set'}</p>
            {zodiacSign && (
              <p style={styles.zodiacText}>
                {getZodiacEmoji(zodiacSign)} {zodiacSign} • Lucky #{luckyNumber}
              </p>
            )}
            <div style={styles.stats}>
              <span style={styles.stat}>Score: {profile.vibraScore || 3.5}</span>
              <span style={styles.stat}>Photos: {profile.photos?.length || 0}</span>
              <span style={styles.stat}>Points: {profile.points || 0}</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>About</h3>
          <p style={styles.bio}>{profile.bio || 'No bio yet. Tell us about yourself!'}</p>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Interests</h3>
          <div style={styles.interestsContainer}>
            {profile.interests && profile.interests.length > 0 ? (
              profile.interests.map((interest, index) => (
                <span key={index} style={styles.interestTag}>
                  {interest}
                </span>
              ))
            ) : (
              <p style={styles.emptyText}>No interests added yet</p>
            )}
          </div>
        </div>

        {/* ===== MATCHING PREFERENCES ===== */}
        {!isOwner && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Matching Preferences</h3>
            <div style={styles.preferenceGrid}>
              {profile.lifeGoals && (
                <div style={styles.preferenceItem}>
                  <span style={styles.preferenceLabel}>Life Goals</span>
                  <span style={styles.preferenceValue}>{profile.lifeGoals}</span>
                </div>
              )}
              {profile.dealbreakers && (
                <div style={styles.preferenceItem}>
                  <span style={styles.preferenceLabel}>Dealbreaker</span>
                  <span style={styles.preferenceValue}>{profile.dealbreakers}</span>
                </div>
              )}
              {profile.datingPace && (
                <div style={styles.preferenceItem}>
                  <span style={styles.preferenceLabel}>Dating Pace</span>
                  <span style={styles.preferenceValue}>{getDatingPaceLabel(profile.datingPace)}</span>
                </div>
              )}
              {profile.lifestyle && (
                <div style={styles.preferenceItem}>
                  <span style={styles.preferenceLabel}>Lifestyle</span>
                  <span style={styles.preferenceValue}>{getLifestyleLabel(profile.lifestyle)}</span>
                </div>
              )}
              {!profile.lifeGoals && !profile.dealbreakers && !profile.datingPace && !profile.lifestyle && (
                <p style={styles.emptyText}>No preferences set yet</p>
              )}
            </div>
          </div>
        )}

        {profile.photos && profile.photos.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Photos</h3>
            <div style={styles.photoGrid}>
              {profile.photos.slice(0, 10).map((photo, index) => (
                <img 
                  key={photo.id || index}
                  src={photo.url} 
                  alt={`Photo ${index + 1}`}
                  style={styles.photoThumb}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {isOwner && onEdit && (
          <button 
            onClick={onEdit} 
            style={styles.editButton}
          >
            Edit Profile
          </button>
        )}

        {isOwner && isFounder && (
          <button 
            onClick={() => navigate('/admin')} 
            style={{...styles.editButton, backgroundColor: '#FFD700', color: '#1a1a1a'}}
          >
            👑 Admin Panel
          </button>
        )}

        {!isOwner && (
          <div style={styles.actionRow}>
            <button
              onClick={handleChat}
              disabled={startingChat}
              style={{...styles.actionButton, backgroundColor: '#6C3CE1'}}
            >
              {startingChat ? 'Starting...' : '💬 Chat'}
            </button>
            {blocked ? (
              <button
                onClick={handleUnblock}
                style={{...styles.actionButton, backgroundColor: '#00B894'}}
              >
                Unblock
              </button>
            ) : (
              <button
                onClick={handleBlock}
                style={{...styles.actionButton, backgroundColor: '#e74c3c'}}
              >
                Block
              </button>
            )}
            <button
              onClick={handleReport}
              disabled={reporting}
              style={{...styles.actionButton, backgroundColor: '#f39c12'}}
            >
              {reporting ? 'Reporting...' : 'Report'}
            </button>
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
    alignItems: 'flex-start',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #f0f0f0',
  },
  avatarPlaceholder: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#6C3CE1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    fontWeight: '600',
    border: '4px solid #f0f0f0',
  },
  levelBadge: {
    position: 'absolute',
    bottom: '-4px',
    right: '-4px',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#1a1a1a',
    border: '3px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  userInfo: {
    flex: 1,
    minWidth: '180px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '4px',
  },
  name: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
    color: '#1a1a1a',
    wordBreak: 'break-word',
  },
  verifiedBadge: {
    display: 'inline-block',
    backgroundColor: '#00B894',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    padding: '2px 12px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
  location: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 4px 0',
  },
  zodiacText: {
    fontSize: '13px',
    color: '#6C3CE1',
    fontWeight: '500',
    margin: '0 0 6px 0',
  },
  stats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  stat: {
    fontSize: '13px',
    color: '#555',
    backgroundColor: '#f5f5f5',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  bio: {
    fontSize: '14px',
    color: '#444',
    lineHeight: '1.6',
    margin: 0,
  },
  interestsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  interestTag: {
    backgroundColor: '#f0edff',
    color: '#6C3CE1',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
  },
  photoThumb: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '2px solid #f0f0f0',
  },
  preferenceGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  preferenceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 14px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    fontSize: '13px',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px',
  },
  preferenceLabel: {
    color: '#888',
    fontWeight: '500',
    fontSize: '12px',
  },
  preferenceValue: {
    color: '#1a1a1a',
    fontWeight: '500',
    textAlign: 'right',
  },
  editButton: {
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
    marginTop: '8px',
    fontFamily: 'inherit',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
    minWidth: '80px',
  },
  errorCard: {
    padding: '40px',
    textAlign: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: '16px',
  },
  backButton: {
    padding: '10px 24px',
    backgroundColor: '#6C3CE1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '12px',
  },
  credit: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f0f0f0',
  },
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #6C3CE1',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Profile;