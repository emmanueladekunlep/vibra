/**
 * VIBRA - Edit Profile Component
 * Module: User Profile
 * 
 * Edit profile form with photo upload, bio, interests, and location.
 * Self-contained - does not affect other modules.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as profileService from '../../services/profileService';

const EditProfile = ({ userId, onSave, onCancel }) => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    age: '',
    gender: '',
    location: '',
    interests: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await profileService.getProfile(userId);
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          age: data.age || '',
          gender: data.gender || '',
          location: data.location || '',
          interests: (data.interests || []).join(', '),
        });
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
      const result = await profileService.uploadPhoto(userId, file);
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

    try {
      await profileService.removePhoto(userId, photoId);
      const updated = await profileService.getProfile(userId);
      setProfile(updated);
      if (user?.id === userId) {
        updateUser(updated);
      }
    } catch (err) {
      setError('Failed to remove photo');
    }
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
                <button
                  onClick={() => handleRemovePhoto(photo.id)}
                  style={styles.removePhotoBtn}
                >
                  ✕
                </button>
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
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '2px solid #f0f0f0',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  textarea: {
    resize: 'vertical',
    minHeight: '80px',
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