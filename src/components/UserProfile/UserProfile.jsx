import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import axios from 'axios';
import {
  FaEdit, FaSave, FaSignOutAlt, FaUser, FaBirthdayCake, FaMapMarkerAlt, FaLanguage, FaBriefcase,
  FaPencilAlt, FaDog, FaUtensils, FaGlassCheers, FaSmoking, FaUsers, FaStar, FaHeart, FaEnvelope, FaPhone
} from 'react-icons/fa';
import Select from 'react-select';
import './UserProfile.css'; // ensure this is correctly linked

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
        <div className="profile-card">
          <div className="profile-header-buttons">
            {isEditing ? (
              <button onClick={handleSave}><FaSave /> Save</button>
            ) : (
              <button onClick={() => setIsEditing(true)}><FaEdit /> Edit</button>
            )}
            <button onClick={handleLogout} style={{ backgroundColor: '#f44336' }}>
              <FaSignOutAlt /> Logout
            </button>
          </div>

          <div className="profile-title"><FaUser /> Basic Info</div>
          <div className="profile-input-group">
            {isEditing ? (
              <>
                <input name="email" value={profile.email || ''} disabled style={{ backgroundColor: '#eee' }} />
                <input name="phone" value={profile.phone || ''} onChange={handleChange} placeholder="Phone Number" />
                <input name="fullName" value={profile.fullName || ''} onChange={handleChange} placeholder="Full Name" />
                <input name="gender" value={profile.gender || ''} onChange={handleChange} placeholder="Gender" />
                <input name="dob" value={profile.dob || ''} onChange={handleChange} placeholder="Date of Birth" />
                <input name="languages" value={profile.languages || ''} onChange={handleChange} placeholder="Languages" />
                <input name="location" value={profile.location || ''} onChange={handleChange} placeholder="Location" />
                <input name="profession" value={profile.profession || ''} onChange={handleChange} placeholder="Profession" />
                {profile.profession === 'Others' && (
                  <input name="customProfession" value={profile.customProfession || ''} onChange={handleChange} placeholder="Custom Profession" />
                )}
                <textarea name="bio" value={profile.bio || ''} onChange={handleChange} placeholder="Bio" />
              </>
            ) : (
              <>
                <p className="profile-info-line"><FaEnvelope /> <strong>Email:</strong> {profile.email}</p>
                <p className="profile-info-line"><FaPhone /> <strong>Phone:</strong> {profile.phone}</p>
                <p className="profile-info-line"><FaUser /> <strong>Gender:</strong> {profile.gender}</p>
                <p className="profile-info-line"><FaBirthdayCake /> <strong>DOB:</strong> {profile.dob}</p>
                <p className="profile-info-line"><FaLanguage /> <strong>Languages:</strong> {profile.languages}</p>
                <p className="profile-info-line"><FaMapMarkerAlt /> <strong>Location:</strong> {profile.location}</p>
                <p className="profile-info-line"><FaBriefcase /> <strong>Profession:</strong> {profile.profession === 'Others' ? profile.customProfession : profile.profession}</p>
                <p className="profile-info-line"><FaPencilAlt /> <strong>Bio:</strong> {profile.bio}</p>
              </>
            )}
          </div>

          <div className="profile-title"><FaUsers /> Living Habits</div>
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
                  {icons[key]} <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                  {isEditing ? (
                    <select name={`habits.${key}`} value={profile.habits?.[key] || ''} onChange={handleChange}>
                      <option value="">Select...</option>
                      {optionsMap[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    profile.habits?.[key] || 'N/A'
                  )}
                </li>
              );
            })}
          </ul>

          <div className="profile-title"><FaStar /> Extras</div>
          {isEditing ? (
            <div className="profile-input-group">
              <Select
                isMulti
                name="interests"
                options={interestOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                value={(profile.interests || '').split(',').map(i => ({ value: i, label: i }))}
                onChange={(selected) =>
                  setProfile(prev => ({
                    ...prev,
                    interests: selected.map(item => item.value).join(','),
                  }))
                }
              />
              <input name="traits" value={profile.traits || ''} onChange={handleChange} placeholder="Personality Traits" />
            </div>
          ) : (
            <>
              <p className="profile-info-line"><FaHeart /> <strong>Interests:</strong> {profile.interests?.split(',').join(', ') || 'None'}</p>
              <p className="profile-info-line"><FaStar /> <strong>Traits:</strong> {profile.traits}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
