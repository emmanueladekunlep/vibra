/**
 * VIBRA - Edit Profile Component
 * Module: User Profile
 * 
 * Edit profile form with photo upload, bio, interests, location, DOB,
 * and advanced matching features (life goals, dealbreakers, dating pace, lifestyle).
 * Self-contained - does not affect other modules.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as profileService from '../../services/profileService';

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

// Options for matching fields
const LIFE_GOALS_OPTIONS = [
  'Ready to settle down & buy a home',
  'Focusing heavily on career/building wealth',
  'Looking to travel extensively before settling',
  'Open to anything, going with the flow',
  'Building a family and raising children',
  'Focusing on personal growth and self-improvement',
  'Ready for marriage within 1-2 years',
];

const DEALBREAKERS_OPTIONS = [
  'Must want children',
  'Must not want children',
  'Must be non-smoker',
  'Must be Christian',
  'Must be Muslim',
  'Must be financially stable',
  'Must be ambitious',
  'Must be family-oriented',
  'Must have a degree',
  'Must be fit/active',
  'Must not have children',
  'No dealbreakers - open to anyone',
];

const DATING_PACE_OPTIONS = [
  { value: 'fast', label: 'Fast Tracker - Meet within 2-3 days' },
  { value: 'medium', label: 'Vetter - Text for a week, then video call' },
  { value: 'slow', label: 'Pen Pal - Take it slow, text for weeks' },
];

const LIFESTYLE_OPTIONS = [
  { value: 'homebody', label: 'Homebody & Budget-Conscious' },
  { value: 'luxury', label: 'Fine Dining & High Luxury' },
  { value: 'adventurer', label: 'Outdoor Adventurer & Backpacking' },
  { value: 'social', label: 'Social Butterfly - Always out' },
  { value: 'balanced', label: 'Balanced - A mix of everything' },
  { value: 'fitness', label: 'Fitness Enthusiast - Gym & Wellness' },
];

const EditProfile = ({ userId, onSave, onCancel }) => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    age: '',
    gender: '',
    location: '',
    interests: '',
    dateOfBirth: '',
    lifeGoals: '',
    dealbreakers: '',
    datingPace: '',
    lifestyle: '',
  });

  const [zodiacSign, setZodiacSign] = useState(null);
  const [luckyNumber, setLuckyNumber] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await profileService.getProfile(userId);
        setProfile(data);
        const dob = data.dateOfBirth || '';
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          age: data.age || '',
          gender: data.gender || '',
          location: data.location || '',
          interests: (data.interests || []).join(', '),
          dateOfBirth: dob,
          lifeGoals: data.lifeGoals || '',
          dealbreakers: data.dealbreakers || '',
          datingPace: data.datingPace || '',
          lifestyle: data.lifestyle || '',
        });
        if (dob) {
          setZodiacSign(getZodiacSign(dob));
          setLuckyNumber(getLuckyNumber(dob));
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'dateOfBirth' && value) {
      setZodiacSign(getZodiacSign(value));
      setLuckyNumber(getLuckyNumber(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const interests = formData.interests
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const updates = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        location: formData.location.trim(),
        interests: interests,
        dateOfBirth: formData.dateOfBirth || null,
        lifeGoals: formData.lifeGoals || null,
        dealbreakers: formData.dealbreakers || null,
        datingPace: formData.datingPace || null,
        lifestyle: formData.lifestyle || null,
      };

      Object.keys(updates).forEach((key) => {
        if (updates[key] === '' || updates[key] === null || updates[key] === undefined) {
          delete updates[key];
        }
        if (key === 'age' && isNaN(updates[key])) {
          delete updates[key];
        }
      });

      const updated = await profileService.updateProfile(userId, updates);
      setProfile(updated);
      
      if (user?.id === userId) {
        updateUser(updated);
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSave) onSave(updated);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      await profileService.uploadPhoto(userId, file);
      const updated = await profileService.getProfile(userId);
      setProfile(updated);
      if (user?.id === userId) {
        updateUser(updated);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (photoId) => {
    if (!confirm('Remove this photo?')) return;

    setDeletingPhoto(true);
    setError(null);

    try {
      await profileService.removePhoto(userId, photoId);
      const updated = await profileService.getProfile(userId);
      setProfile(updated);
      if (user?.id === userId) {
        updateUser(updated);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to remove photo');
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleReplacePhoto = async (photoId, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      // First remove old photo, then upload new one
      await profileService.removePhoto(userId, photoId);
      await profileService.uploadPhoto(userId, file);
      const updated = await profileService.getProfile(userId);
      setProfile(updated);
      if (user?.id === userId) {
        updateUser(updated);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to replace photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelectForReplace = (photoId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleReplacePhoto(photoId, file);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Edit Profile</h2>
        <p style={styles.subtitle}>Tell us more about yourself</p>

        {/* Photo Section */}
        <div style={styles.photoSection}>
          <div style={styles.photoGrid}>
            {profile?.photos?.map((photo) => (
              <div key={photo.id} style={styles.photoItem}>
                <img src={photo.url} alt="Profile" style={styles.photoPreview} />
                <div style={styles.photoActions}>
                  <button
                    onClick={() => handleFileSelectForReplace(photo.id)}
                    style={{...styles.photoActionBtn, ...styles.replaceBtn}}
                    title="Replace photo"
                  >
                    ↻
                  </button>
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    style={{...styles.photoActionBtn, ...styles.removeBtn}}
                    title="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {(profile?.photos?.length || 0) < 10 && (
              <div style={styles.addPhotoBox}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={styles.hiddenInput}
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" style={styles.addPhotoLabel}>
                  {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
                </label>
                <p style={styles.photoLimit}>
                  {profile?.photos?.length || 0}/10 photos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Zodiac & Lucky Number Preview */}
        {zodiacSign && luckyNumber && (
          <div style={styles.zodiacBox}>
            <span style={styles.zodiacText}>♈ Zodiac: {zodiacSign}</span>
            <span style={styles.zodiacText}>🍀 Lucky Number: {luckyNumber}</span>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
        {success && (
          <div style={styles.successBox}>
            <p style={styles.successText}>Profile updated successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Basic Info */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              placeholder="Your full name"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              style={{...styles.input, ...styles.textarea}}
              placeholder="Tell us about yourself..."
              rows="3"
            />
          </div>

          <div style={styles.row}>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                style={styles.input}
              />
              {zodiacSign && (
                <span style={styles.helperText}>Zodiac: {zodiacSign}</span>
              )}
            </div>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                style={styles.input}
                placeholder="25"
                min="18"
                max="99"
              />
            </div>
            <div style={{...styles.formGroup, flex: 1}}>
              <label style={styles.label}>Lucky Number</label>
              <input
                type="text"
                value={luckyNumber || ''}
                style={{...styles.input, backgroundColor: '#f5f5f5'}}
                disabled
                placeholder="Auto-calculated"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={styles.input}
              placeholder="Yaba, Lagos"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Interests (comma separated)</label>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              style={styles.input}
              placeholder="Tech, Music, Food, Travel"
            />
          </div>

          {/* ===== ADVANCED MATCHING ===== */}
          <div style={styles.divider}>
            <span style={styles.dividerText}>Matching Preferences</span>
          </div>

          {/* Life Goals */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Life Goals (1-3 years)</label>
            <select
              name="lifeGoals"
              value={formData.lifeGoals}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">Select your life goals</option>
              {LIFE_GOALS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Dealbreakers */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Top Dealbreaker</label>
            <select
              name="dealbreakers"
              value={formData.dealbreakers}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">Select your top dealbreaker</option>
              {DEALBREAKERS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Dating Pace */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Dating Pace</label>
            <select
              name="datingPace"
              value={formData.datingPace}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">Select your dating pace</option>
              {DATING_PACE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Lifestyle */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Lifestyle</label>
            <select
              name="lifestyle"
              value={formData.lifestyle}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">Select your lifestyle</option>
              {LIFESTYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.buttonRow}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{...styles.button, ...styles.cancelButton}}
                disabled={isSaving}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              style={styles.button}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

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
  title: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 24px 0',
  },
  photoSection: {
    marginBottom: '20px',
  },
  photoGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  photoItem: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #f0f0f0',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoActions: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    display: 'flex',
    gap: '4px',
  },
  photoActionBtn: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: 'none',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: '700',
  },
  replaceBtn: {
    backgroundColor: '#6C3CE1',
  },
  removeBtn: {
    backgroundColor: '#ff4444',
  },
  addPhotoBox: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    border: '2px dashed #ccc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  hiddenInput: {
    display: 'none',
  },
  addPhotoLabel: {
    fontSize: '12px',
    color: '#666',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '4px',
  },
  photoLimit: {
    fontSize: '10px',
    color: '#999',
    margin: '2px 0 0 0',
  },
  zodiacBox: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#f0edff',
    borderRadius: '10px',
    marginBottom: '16px',
    border: '1px solid #d4c4f0',
  },
  zodiacText: {
    fontSize: '13px',
    color: '#6C3CE1',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '16px',
  },
  row: {
    display: 'flex',
    gap: '12px',
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
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  textarea: {
    resize: 'vertical',
    minHeight: '80px',
  },
  helperText: {
    fontSize: '12px',
    color: '#6C3CE1',
    marginTop: '4px',
    display: 'block',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '8px 0 16px 0',
  },
  dividerText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6C3CE1',
    backgroundColor: '#f0edff',
    padding: '4px 14px',
    borderRadius: '12px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  button: {
    flex: 1,
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
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    color: '#333',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
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
    padding: '12px 16px',
    marginBottom: '16px',
    border: '1px solid #c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: '14px',
    margin: 0,
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
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

export default EditProfile;