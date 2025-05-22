import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiEdit2, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import './ProfileSettings.scss';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await getUserProfile();
        
        if (profile) {
          setProfileData({
            displayName: profile.displayName || user?.displayName || '',
            email: profile.email || user?.email || '',
            bio: profile.bio || ''
          });
        } else {
          // Use auth user data if no profile exists
          setProfileData({
            displayName: user?.displayName || '',
            email: user?.email || '',
            bio: ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setLoading(true);
    
    try {
      await updateUserProfile({
        displayName: profileData.displayName,
        bio: profileData.bio
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-settings">
      <div className="section-header">
        <h3>Profile Information</h3>
        {!isEditing && (
          <button 
            className="edit-button" 
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            <FiEdit2 /> Edit Profile
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <FiAlertCircle /> {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <FiCheckCircle /> {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <span className="field-icon"><FiUser /></span> Name
          </label>
          {isEditing ? (
            <input
              type="text"
              name="displayName"
              value={profileData.displayName}
              onChange={handleInputChange}
              placeholder="Your name"
            />
          ) : (
            <div className="field-value">
              {profileData.displayName || 'Not set'}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>
            <span className="field-icon"><FiMail /></span> Email
          </label>
          <div className="field-value">
            {profileData.email}
          </div>
        </div>
        
        <div className="form-group">
          <label>Bio</label>
          {isEditing ? (
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              placeholder="Tell us a bit about yourself..."
            />
          ) : (
            <div className={`field-value ${!profileData.bio ? 'bio-value' : ''}`}>
              {profileData.bio || 'No bio added yet.'}
            </div>
          )}
        </div>
        
        {isEditing && (
          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileSettings; 