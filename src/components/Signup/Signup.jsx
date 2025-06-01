import React, { useState, useEffect } from 'react';
import './SignUpFlow.css';
import Header from '../Header/Header';
import sha256 from 'crypto-js/sha256';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import config from '../../config';
const initialFormState = {
  mobile: '',
  email: '',
  userType: '',
  otp: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  gender: '',
  dob: '',
  languages: '',
  location: '',
  idType: '',
  idNumber: '',
  bio: '',
  profession: '',
  customProfession: '',
  habits: {
    smoking: '',
    alcohol: '',
    foodChoice: '',
    partying: '',
    guests: '',
    pets: ''
  },
  interests: '',
  traits: ''
};

const interestOptions = [
  { value: 'Gaming', label: 'Gaming' }, { value: 'Football', label: 'Football' },
  { value: 'Cricket', label: 'Cricket' }, { value: 'Tennis', label: 'Tennis' },
  { value: 'Cooking', label: 'Cooking' }, { value: 'Photography', label: 'Photography' },
  { value: 'Movies', label: 'Movies' }, { value: 'Music', label: 'Music' },
  { value: 'Art', label: 'Art' }, { value: 'Sports', label: 'Sports' },
  { value: 'Volunteering', label: 'Volunteering' }
];

const Signup = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('signup'); // 'signup' or 'login'
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showSelects, setShowSelects] = useState({
    smoking: false,
    alcohol: false,
    partying: false,
    foodChoice: false,
    guests: false,
    pets: false
  });

  const [formData, setFormData] = useState(initialFormState);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setIsLoggedIn(true);
      setIsVerified(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('habits.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        habits: { ...prev.habits, [key]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVerification = (e) => {
    e.preventDefault();
    const isMobileValid = formData.mobile && /^[6-9]\d{9}$/.test(formData.mobile);
    const isEmailValid = formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

    if (!otpSent) {
      if (!isMobileValid && !isEmailValid) {
        alert('Enter a valid mobile number or email address.');
        return;
      }
      setOtpSent(true);
      alert('OTP sent! Use 1234 for testing.');
    } else {
      if (formData.otp === '1234') {
        setIsVerified(true);
      } else {
        alert('Invalid OTP. Try again with 1234.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6 || formData.password !== formData.confirmPassword) {
      alert('Invalid password input');
      return;
    }

    const userData = {
      ...formData,
      confirmPassword: undefined
    };

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      const userKey = formData.email || formData.mobile;
      localStorage.setItem('currentUser', userKey);

      alert('Signup successful!');
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      alert(`Signup failed: ${err.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || 'Login failed');
        return;
      }

      localStorage.setItem('currentUser', result.userKey);
      localStorage.setItem('currentUserType', result.userType);
      setIsLoggedIn(true);
      alert('Login successful!');
      navigate('/');
    } catch (err) {
      alert(`Login error: ${err.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setFormData(initialFormState);
    setIsVerified(false);
    setIsLoggedIn(false);
    setActiveTab('signup');
    setOtpSent(false);
  };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: 'black',
      backgroundColor: state.isSelected ? '#e0e0e0' : 'white',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#f0f0f0',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'black',
    }),
    input: (provided) => ({
      ...provided,
      color: 'black',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'black',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'gray',
    }),
  };

  return (
    <div className="signup-form">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      {!isLoggedIn && (
        <div className="auth-tabs">
          <button 
            className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
        </div>
      )}

      {!isLoggedIn && activeTab === 'signup' && !isVerified && (
        <form onSubmit={handleVerification}>
          <fieldset>
            <legend>Verification</legend>
            <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} disabled={otpSent} />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} disabled={otpSent} />
            {otpSent && (
              <input type="text" name="otp" placeholder="Enter OTP" value={formData.otp} onChange={handleChange} required />
            )}
            <button 
              type="submit" 
              style={!otpSent ? {backgroundColor: '#2563eb'} : {}}
            >
              {otpSent ? 'Verify' : 'Send OTP'}
            </button>
          </fieldset>
        </form>
      )}

      {!isLoggedIn && activeTab === 'login' && (
        <form onSubmit={handleLogin}>
          <fieldset>
            <legend>Login</legend>
            <input type="text" name="username" placeholder="Email or Mobile number" value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} required />
            <input type="password" name="password" placeholder="Password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} required />
            <button type="submit">Login</button>
          </fieldset>
        </form>
      )}

      {isVerified && !isLoggedIn && activeTab === 'signup' && (
        <form onSubmit={handleSubmit}>
          <fieldset className='user-type-options'>
            <legend>User Type</legend>
            <label>
              <input
                type="radio"
                name="userType"
                value="Individual"
                checked={formData.userType === 'Individual'}
                onChange={handleChange}
                required
              />
              Individual
            </label>
            <label>
              <input
                type="radio"
                name="userType"
                value="Property Agent"
                checked={formData.userType === 'Property Agent'}
                onChange={handleChange}
              />
              Property Agent
            </label>
          </fieldset>

          <fieldset>
            <legend>Create Password</legend>
            <input type="password" name="password" placeholder="Create password" value={formData.password} onChange={handleChange} required />
            <input type="password" name="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required />
          </fieldset>

          <fieldset>
            <legend>Personal Details</legend>
            <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} />
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Others</option>
            </select>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            <input type="text" name="languages" placeholder="Languages Known" value={formData.languages} onChange={handleChange} />
          </fieldset>

          <fieldset>
            <legend>Location</legend>
            <input type="text" name="location" placeholder="Current City" value={formData.location} onChange={handleChange} />
          </fieldset>

          <fieldset>
            <legend>Identity Verification</legend>
            <select name="idType" value={formData.idType} onChange={handleChange}>
              <option value="">Select ID</option>
              <option>Aadhar</option>
              <option>Passport</option>
            </select>
            <input type="text" name="idNumber" placeholder="ID Number" value={formData.idNumber} onChange={handleChange} />
          </fieldset>

          <fieldset>
            <legend>Bio</legend>
            <textarea name="bio" placeholder="Write something about yourself..." value={formData.bio} onChange={handleChange}></textarea>
          </fieldset>

          <fieldset>
            <legend>Living Habits</legend>
            <select name="profession" value={formData.profession} onChange={handleChange}>
              <option value="">Select your Profession</option>
              <option value="Working Professional">Working Professional</option>
              <option value="Job Seeker">Job Seeker</option>
              <option value="Student">Student</option>
              <option value="Others">Others</option>
            </select>

            {formData.profession === 'Others' && (
              <input type="text" name="customProfession" placeholder="Please specify your profession" value={formData.customProfession} onChange={handleChange} />
            )}

            {['smoking', 'alcohol', 'partying', 'foodChoice', 'guests', 'pets'].map((habit) =>
              !showSelects[habit] ? (
                <button key={habit} type="button" onClick={() => setShowSelects(prev => ({ ...prev, [habit]: true }))}>
                  {habit.charAt(0).toUpperCase() + habit.slice(1)} Preference
                </button>
              ) : (
                <select key={habit} name={`habits.${habit}`} value={formData.habits[habit]} onChange={handleChange}>
                  <option value="">{`Select your ${habit} preference`}</option>
                  {habit === 'foodChoice' && <><option>Veg</option><option>Non-Veg</option><option>Egg</option></>}
                  {habit === 'guests' && <><option>Daily</option><option>Rare</option><option>Never</option></>}
                  {habit === 'pets' && <><option>Yes</option><option>No</option><option>May Have</option></>}
                  {(habit === 'smoking' || habit === 'alcohol') && <><option>Daily</option><option>Occasionally</option><option>Never</option></>}
                  {habit === 'partying' && <><option>Weekends</option><option>Occasionally</option><option>Never</option></>}
                </select>
              )
            )}
          </fieldset>
            
          <fieldset>
            <legend>Interests</legend>
            <Select
              isMulti
              name="interests"
              options={interestOptions}
              styles={customStyles}
              value={interestOptions.filter(option => formData.interests.includes(option.value))}
              onChange={(selectedOptions) =>
                setFormData({
                  ...formData,
                  interests: selectedOptions.map(option => option.value)
                })
              }
            />
          </fieldset>

          <fieldset>
            <legend>Personality Traits</legend>
            <input type="text" name="traits" placeholder="e.g., Calm, Friendly" value={formData.traits} onChange={handleChange} />
          </fieldset>

          <button type="submit">Submit</button>
        </form>
      )}
    </div>
  );
};

export default Signup;