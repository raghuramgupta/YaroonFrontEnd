import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import axios from 'axios';
import {
  FaEdit, FaSave, FaSignOutAlt, FaUser, FaBirthdayCake, FaMapMarkerAlt, 
  FaLanguage, FaBriefcase, FaPencilAlt, FaDog, FaUtensils, 
  FaGlassCheers, FaSmoking, FaUsers, FaStar, FaHeart, FaEnvelope, 
  FaPhone, FaHome, FaUserTie
} from 'react-icons/fa';
import Select from 'react-select';
import './UserProfile.css';
import config from '../../config';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const interestOptions = [
    { value: 'Gaming', label: '🎮 Gaming' },
    { value: 'Football', label: '⚽ Football' },
    { value: 'Cricket', label: '🏏 Cricket' },
    { value: 'Tennis', label: '🎾 Tennis' },
    { value: 'Cooking', label: '🍳 Cooking' },
    { value: 'Photography', label: '📷 Photography' },
    { value: 'Movies', label: '🎬 Movies' },
    { value: 'Music', label: '🎵 Music' },
    { value: 'Art', label: '🎨 Art' },
    { value: 'Sports', label: '🏅 Sports' },
    { value: 'Volunteering', label: '🤝 Volunteering' }
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUserEmail = localStorage.getItem('currentUser');
        if (!currentUserEmail) {
          setError('No user logged in');
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`${config.apiBaseUrl}/api/users/profile/${currentUserEmail}`);
        setProfile({
          ...response.data,
          habits: response.data.habits || {
            smoking: '',
            alcohol: '',
            foodChoice: '',
            partying: '',
            guests: '',
            pets: ''
          }
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/signup';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('habits.')) {
      const habitKey = name.split('.')[1];
      setProfile(prev => ({
        ...prev,
        habits: { ...prev.habits, [habitKey]: value }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const currentUserEmail = localStorage.getItem('currentUser');
      if (!currentUserEmail) {
        setError('No user logged in');
        return;
      }

      const response = await axios.put(
        `${config.apiBaseUrl}/api/users/profile/${currentUserEmail}`,
        profile
      );
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <Header isLoggedIn={false} onLogout={handleLogout} />
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header isLoggedIn={false} onLogout={handleLogout} />
        <div className="profile-error">
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Header isLoggedIn={false} onLogout={handleLogout} />
        <div className="profile-not-found">
          <h2>No Profile Found</h2>
          <p>Please sign up or log in to view your profile.</p>
          <a href="/signup" className="signup-link">Sign Up Now</a>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <Header isLoggedIn={!!profile} onLogout={handleLogout} />
      
      <div className="profile-header-container">
        <div className="profile-header-content">
          <div className="user-type-selector">
            <div className={`user-type-card ${profile.userType === 'Individual' ? 'active' : ''}`}
                 onClick={() => setProfile({...profile, userType: 'Individual'})}>
              <FaUser className="user-type-icon" />
              <span>Individual</span>
            </div>
            <div className={`user-type-card ${profile.userType === 'Property Agent' ? 'active' : ''}`}
                 onClick={() => setProfile({...profile, userType: 'Property Agent'})}>
              <FaUserTie className="user-type-icon" />
              <span>Property Agent</span>
            </div>
          </div>
          
          <div className="profile-actions">
            {isEditing ? (
              <button className="save-btn" onClick={handleSave} disabled={isLoading}>
                <FaSave /> {isLoading ? 'Saving...' : 'Save Profile'}
              </button>
            ) : (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <FaEdit /> Edit Profile
              </button>
            )}
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content-container">
        {/* Basic Information Section */}
        <div className="profile-section">
          <div className="section-header">
            <FaUser className="section-icon" />
            <h2>Basic Information</h2>
          </div>
          
          <div className="section-content">
            {isEditing ? (
              <div className="edit-form-grid">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={profile.email || ''} disabled />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={profile.phone || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={profile.fullName || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={profile.gender || ''} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="dob" value={profile.dob || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Languages (comma separated)</label>
                  <input type="text" name="languages" value={profile.languages || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={profile.location || ''} onChange={handleChange} />
                </div>
                
                <div className="form-group">
                  <label>Profession</label>
                  <select name="profession" value={profile.profession || ''} onChange={handleChange}>
                    <option value="">Select Profession</option>
                    <option value="Student">Student</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Freelancer">Freelancer</option>
                    <option value="Business Owner">Business Owner</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                
                {profile.profession === 'Others' && (
                  <div className="form-group">
                    <label>Custom Profession</label>
                    <input type="text" name="customProfession" value={profile.customProfession || ''} onChange={handleChange} />
                  </div>
                )}
                
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea name="bio" value={profile.bio || ''} onChange={handleChange} rows="4" />
                </div>
              </div>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <FaEnvelope className="info-icon" />
                  <div>
                    <h4>Email</h4>
                    <p>{profile.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaPhone className="info-icon" />
                  <div>
                    <h4>Phone</h4>
                    <p>{profile.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div>
                    <h4>Full Name</h4>
                    <p>{profile.fullName || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaUser className="info-icon" />
                  <div>
                    <h4>Gender</h4>
                    <p>{profile.gender || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaBirthdayCake className="info-icon" />
                  <div>
                    <h4>Date of Birth</h4>
                    <p>{profile.dob || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaLanguage className="info-icon" />
                  <div>
                    <h4>Languages</h4>
                    <p>{profile.languages || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <div>
                    <h4>Location</h4>
                    <p>{profile.location || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <FaBriefcase className="info-icon" />
                  <div>
                    <h4>Profession</h4>
                    <p>{profile.profession === 'Others' ? profile.customProfession : (profile.profession || 'Not specified')}</p>
                  </div>
                </div>
                
                <div className="info-item full-width">
                  <FaPencilAlt className="info-icon" />
                  <div>
                    <h4>Bio</h4>
                    <p>{profile.bio || 'No bio provided'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Living Habits Section */}
        <div className="profile-section">
          <div className="section-header">
            <FaHome className="section-icon" />
            <h2>Living Habits</h2>
          </div>
          
          <div className="section-content">
            <div className="habits-grid">
              {[
                { key: 'smoking', icon: <FaSmoking />, label: 'Smoking', options: ['Never', 'Occasionally', 'Daily'] },
                { key: 'alcohol', icon: <FaGlassCheers />, label: 'Alcohol', options: ['Never', 'Occasionally', 'Daily'] },
                { key: 'foodChoice', icon: <FaUtensils />, label: 'Food Preference', options: ['Veg', 'Non-Veg', 'Egg'] },
                { key: 'partying', icon: <FaUsers />, label: 'Partying', options: ['Never', 'Occasionally', 'Weekends'] },
                { key: 'guests', icon: <FaUser />, label: 'Guests', options: ['Never', 'Rare', 'Daily'] },
                { key: 'pets', icon: <FaDog />, label: 'Pets', options: ['No', 'May Have', 'Yes'] }
              ].map(({ key, icon, label, options }) => (
                <div className="habit-item" key={key}>
                  <div className="habit-icon">{icon}</div>
                  <div className="habit-content">
                    <h4>{label}</h4>
                    {isEditing ? (
                      <select 
                        name={`habits.${key}`} 
                        value={profile.habits?.[key] || ''} 
                        onChange={handleChange}
                        className="habit-select"
                      >
                        <option value="">Select preference</option>
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="habit-value">{profile.habits?.[key] || 'Not specified'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div className="profile-section">
          <div className="section-header">
            <FaHeart className="section-icon" />
            <h2>Interests & Personality</h2>
          </div>
          
          <div className="section-content">
            {isEditing ? (
              <>
                <div className="form-group">
                  <label>Interests</label>
                  <Select
                    isMulti
                    name="interests"
                    options={interestOptions}
                    className="interests-select"
                    classNamePrefix="select"
                    value={(profile.interests || '').split(',').filter(i => i).map(i => ({ 
                      value: i, 
                      label: interestOptions.find(opt => opt.value === i)?.label || i 
                    }))}
                    onChange={(selected) =>
                      setProfile(prev => ({
                        ...prev,
                        interests: selected.map(item => item.value).join(','),
                      }))
                    }
                    placeholder="Select your interests..."
                  />
                </div>
                
                <div className="form-group">
                  <label>Personality Traits</label>
                  <textarea 
                    name="traits" 
                    value={profile.traits || ''} 
                    onChange={handleChange} 
                    placeholder="Describe your personality traits..."
                    rows="4"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="info-item">
                  <FaHeart className="info-icon" />
                  <div>
                    <h4>Interests</h4>
                    {profile.interests ? (
                      <div className="interests-list">
                        {profile.interests.split(',').filter(i => i).map(interest => (
                          <span key={interest} className="interest-tag">
                            {interestOptions.find(opt => opt.value === interest)?.label || interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>No interests specified</p>
                    )}
                  </div>
                </div>
                
                <div className="info-item">
                  <FaStar className="info-icon" />
                  <div>
                    <h4>Personality Traits</h4>
                    <p>{profile.traits || 'No traits specified'}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;