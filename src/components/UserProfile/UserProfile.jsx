import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import axios from 'axios';
import {
  FaEdit, FaSave, FaSignOutAlt, FaUser, FaBirthdayCake, FaMapMarkerAlt, FaLanguage, FaBriefcase,
  FaPencilAlt, FaDog, FaUtensils, FaGlassCheers, FaSmoking, FaUsers, FaStar, FaHeart, FaEnvelope, FaPhone
} from 'react-icons/fa';
import Select from 'react-select';
import './UserProfile.css';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const interestOptions = [
    { value: 'Gaming', label: 'Gaming' }, { value: 'Football', label: 'Football' },
    { value: 'Cricket', label: 'Cricket' }, { value: 'Tennis', label: 'Tennis' },
    { value: 'Cooking', label: 'Cooking' }, { value: 'Photography', label: 'Photography' },
    { value: 'Movies', label: 'Movies' }, { value: 'Music', label: 'Music' },
    { value: 'Art', label: 'Art' }, { value: 'Sports', label: 'Sports' },
    { value: 'Volunteering', label: 'Volunteering' }
  ];

  useEffect(() => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (currentUserEmail) {
      axios.get(`http://localhost:5000/api/users/profile/${currentUserEmail}`)
        .then(res => setProfile(res.data))
        .catch(err => console.error('Failed to load profile:', err));
    }
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

  const handleSave = () => {
    const currentUserEmail = localStorage.getItem('currentUser');
    if (currentUserEmail) {
      axios.put(`http://localhost:5000/api/users/profile/${currentUserEmail}`, profile)
        .then(res => {
          setProfile(res.data);
          setIsEditing(false);
        })
        .catch(err => console.error('Error updating profile:', err));
    }
  };

  if (!profile) {
    return (
      <div>
        <Header isLoggedIn={false} onLogout={handleLogout} />
        <div className="profile-container" style={{ textAlign: 'center' }}>
          <h2>No Profile Found</h2>
          <p>Please sign up or log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isLoggedIn={!!profile} onLogout={handleLogout} />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-radio-group">
            <label>
              <input
                type="radio"
                name="userType"
                value="Individual"
                checked={profile.userType === 'Individual'}
                onChange={handleChange}
              />
              Individual
            </label>
            <label>
              <input
                type="radio"
                name="userType"
                value="Property Agent"
                checked={profile.userType === 'Property Agent'}
                onChange={handleChange}
              />
              Property Agent
            </label>
          </div>
          <div className="profile-header-buttons">
            {isEditing ? (
              <button onClick={handleSave}><FaSave /> Save</button>
            ) : (
              <button onClick={() => setIsEditing(true)}><FaEdit /> Edit</button>
            )}
            <button onClick={handleLogout} className="logout-btn">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        <div className="profile-sections">
          {/* Basic Info Box */}
          <div className="profile-box">
            <div className="profile-box-header">
              <FaUser className="box-icon" />
              <h3>Basic Info</h3>
            </div>
            <div className="profile-box-content">
              {isEditing ? (
                <>
                  <div className="input-row">
                    <input name="email" value={profile.email || ''} disabled />
                    <input name="phone" value={profile.phone || ''} onChange={handleChange} placeholder="Phone Number" />
                  </div>
                  <div className="input-row">
                    <input name="fullName" value={profile.fullName || ''} onChange={handleChange} placeholder="Full Name" />
                    <input name="gender" value={profile.gender || ''} onChange={handleChange} placeholder="Gender" />
                  </div>
                  <div className="input-row">
                    <input name="dob" value={profile.dob || ''} onChange={handleChange} placeholder="Date of Birth" />
                    <input name="languages" value={profile.languages || ''} onChange={handleChange} placeholder="Languages" />
                  </div>
                  <div className="input-row">
                    <input name="location" value={profile.location || ''} onChange={handleChange} placeholder="Location" />
                    <input name="profession" value={profile.profession || ''} onChange={handleChange} placeholder="Profession" />
                  </div>
                  {profile.profession === 'Others' && (
                    <input name="customProfession" value={profile.customProfession || ''} onChange={handleChange} placeholder="Custom Profession" />
                  )}
                  <textarea name="bio" value={profile.bio || ''} onChange={handleChange} placeholder="Bio" />
                </>
              ) : (
                <>
                  <div className="info-row">
                    <FaEnvelope className="info-icon" />
                    <div>
                      <span className="info-label">Email:</span>
                      <span className="info-value">{profile.email}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaPhone className="info-icon" />
                    <div>
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{profile.phone}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaUser className="info-icon" />
                    <div>
                      <span className="info-label">Gender:</span>
                      <span className="info-value">{profile.gender}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaBirthdayCake className="info-icon" />
                    <div>
                      <span className="info-label">DOB:</span>
                      <span className="info-value">{profile.dob}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaLanguage className="info-icon" />
                    <div>
                      <span className="info-label">Languages:</span>
                      <span className="info-value">{profile.languages}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaMapMarkerAlt className="info-icon" />
                    <div>
                      <span className="info-label">Location:</span>
                      <span className="info-value">{profile.location}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaBriefcase className="info-icon" />
                    <div>
                      <span className="info-label">Profession:</span>
                      <span className="info-value">{profile.profession === 'Others' ? profile.customProfession : profile.profession}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaPencilAlt className="info-icon" />
                    <div>
                      <span className="info-label">Bio:</span>
                      <span className="info-value">{profile.bio}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Living Habits Box */}
          <div className="profile-box">
            <div className="profile-box-header">
              <FaUsers className="box-icon" />
              <h3>Living Habits</h3>
            </div>
            <div className="profile-box-content">
              <ul className="profile-habits-list">
                {['smoking', 'alcohol', 'foodChoice', 'partying', 'guests', 'pets'].map((key) => {
                  const icons = {
                    smoking: <FaSmoking />, alcohol: <FaGlassCheers />, foodChoice: <FaUtensils />,
                    partying: <FaUsers />, guests: <FaUser />, pets: <FaDog />
                  };

                  const optionsMap = {
                    foodChoice: ['Veg', 'Non-Veg', 'Egg'],
                    guests: ['Daily', 'Rare', 'Never'],
                    pets: ['Yes', 'No', 'May Have'],
                    smoking: ['Daily', 'Occasionally', 'Never'],
                    alcohol: ['Daily', 'Occasionally', 'Never'],
                    partying: ['Weekends', 'Occasionally', 'Never']
                  };

                  return (
                    <li key={key}>
                      <span className="habit-icon">{icons[key]}</span>
                      <span className="habit-label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                      {isEditing ? (
                        <select name={`habits.${key}`} value={profile.habits?.[key] || ''} onChange={handleChange}>
                          <option value="">Select...</option>
                          {optionsMap[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <span className="habit-value">{profile.habits?.[key] || 'N/A'}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Interests Box */}
          <div className="profile-box">
            <div className="profile-box-header">
              <FaHeart className="box-icon" />
              <h3>Interests</h3>
            </div>
            <div className="profile-box-content">
              {isEditing ? (
                <>
                  <Select
                    isMulti
                    name="interests"
                    options={interestOptions}
                    className="interests-select"
                    classNamePrefix="select"
                    value={(profile.interests || '').split(',').filter(i => i).map(i => ({ value: i, label: i }))}
                    onChange={(selected) =>
                      setProfile(prev => ({
                        ...prev,
                        interests: selected.map(item => item.value).join(','),
                      }))
                    }
                  />
                  <textarea 
                    name="traits" 
                    value={profile.traits || ''} 
                    onChange={handleChange} 
                    placeholder="Personality Traits"
                    className="traits-textarea"
                  />
                </>
              ) : (
                <>
                  <div className="info-row">
                    <FaHeart className="info-icon" />
                    <div>
                      <span className="info-label">Interests:</span>
                      <span className="info-value">{profile.interests?.split(',').filter(i => i).join(', ') || 'None'}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <FaStar className="info-icon" />
                    <div>
                      <span className="info-label">Traits:</span>
                      <span className="info-value">{profile.traits || 'None'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;