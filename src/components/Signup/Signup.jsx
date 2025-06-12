import React, { useState, useEffect } from 'react';
import './SignUpFlow.css';
import Header from '../Header/Header';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import config from '../../config';

const initialFormState = {
  mobile: '',
  email: '',
  userType: 'Individual',
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
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Football', label: 'Football' },
  { value: 'Cricket', label: 'Cricket' },
  { value: 'Tennis', label: 'Tennis' },
  { value: 'Cooking', label: 'Cooking' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Movies', label: 'Movies' },
  { value: 'Music', label: 'Music' },
  { value: 'Art', label: 'Art' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Volunteering', label: 'Volunteering' }
];

const Signup = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [formData, setFormData] = useState(initialFormState);
  
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Punjabi', label: 'Punjabi' },
  { value: 'Odia', label: 'Odia' },
  { value: 'Assamese', label: 'Assamese' },
  { value: 'Maithili', label: 'Maithili' },
  { value: 'Sanskrit', label: 'Sanskrit' },
  { value: 'French', label: 'French' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Swedish', label: 'Swedish' },
  { value: 'Norwegian', label: 'Norwegian' },
  { value: 'Danish', label: 'Danish' },
  { value: 'Finnish', label: 'Finnish' },
  { value: 'Polish', label: 'Polish' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Hebrew', label: 'Hebrew' },
  { value: 'Greek', label: 'Greek' },
  { value: 'Thai', label: 'Thai' },
  { value: 'Vietnamese', label: 'Vietnamese' },
  { value: 'Indonesian', label: 'Indonesian' },
  { value: 'Malay', label: 'Malay' },
  { value: 'Tagalog', label: 'Tagalog' }
];
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
        setCurrentStep(1); // Reset to step 1 (which will now show password setup)
      } else {
        alert('Invalid OTP. Try again with 1234.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6 || formData.password !== formData.confirmPassword) {
      alert('Password must be at least 6 characters and match confirmation');
      return;
    }

    const userData = {
      ...formData,
      confirmPassword: undefined,
      interests: Array.isArray(formData.interests) 
      ? formData.interests.join(', ') 
      : formData.interestshandleSubmit
    };
    
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      alert('Verification email sent! Please check your inbox.');
      const userKey = formData.email || formData.mobile;
      localStorage.setItem('currentUser', userKey);
      localStorage.setItem('currentUserType', formData.userType);

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
    localStorage.removeItem('currentUserType');
    setFormData(initialFormState);
    setIsVerified(false);
    setIsLoggedIn(false);
    setActiveTab('signup');
    setOtpSent(false);
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '44px',
      borderColor: '#e2e8f0',
      '&:hover': {
        borderColor: '#cbd5e0'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#2563eb' : 'white',
      color: state.isSelected ? 'white' : '#1a202c',
      '&:hover': {
        backgroundColor: '#ebf4ff'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#ebf4ff',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1a202c',
    }),
  };

  return (
    <div className="auth-container">
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      {!isLoggedIn && (
        <div className="auth-wrapper">
          <div className="auth-card">
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

            {activeTab === 'login' && (
              <form className="auth-form" onSubmit={handleLogin}>
                <h2>Welcome back</h2>
                <p className="auth-subtitle">Enter your credentials to access your account</p>
                
                <div className="form-group">
                  <label>Email or Mobile number</label>
                  <input 
                    type="text" 
                    name="username" 
                    value={loginData.username} 
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} 
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={loginData.password} 
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} 
                    required 
                  />
                </div>
                
                <button type="submit" className="primary-button">Login</button>
                
                <div className="auth-footer">
                  <p>Don't have an account? <button type="button" className="text-button" onClick={() => setActiveTab('signup')}>Sign up</button></p>
                </div>
              </form>
            )}

            {activeTab === 'signup' && !isVerified && (
              <form className="auth-form" onSubmit={handleVerification}>
                <h2>Create your account</h2>
                <p className="auth-subtitle">Start your journey with us</p>
                
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input 
                    type="tel" 
                    name="mobile" 
                    placeholder="Enter mobile number" 
                    value={formData.mobile} 
                    onChange={handleChange} 
                    disabled={otpSent} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Enter email address" 
                    value={formData.email} 
                    onChange={handleChange} 
                    disabled={otpSent} 
                  />
                </div>
                
                {otpSent && (
                  <div className="form-group">
                    <label>OTP Verification</label>
                    <input 
                      type="text" 
                      name="otp" 
                      placeholder="Enter OTP (use 1234)" 
                      value={formData.otp} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                )}
                
                <button type="submit" className="primary-button">
                  {otpSent ? 'Verify' : 'Send OTP'}
                </button>
                
                <div className="auth-footer">
                  <p>Already have an account? <button type="button" className="text-button" onClick={() => setActiveTab('login')}>Login</button></p>
                </div>
              </form>
            )}

            {activeTab === 'signup' && isVerified && (
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-progress">
                  <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
                    <span>1</span>
                    <p>Account</p>
                  </div>
                  <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
                    <span>2</span>
                    <p>Personal</p>
                  </div>
                  <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
                    <span>3</span>
                    <p>Habits</p>
                  </div>
                  <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
                    <span>4</span>
                    <p>Review</p>
                  </div>
                </div>

                {currentStep === 1 && (
                  <div className="form-step">
                    <h2>Account Information</h2>
                    
                    <div className="form-group">
                      <label>User Type</label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="userType"
                            value="Individual"
                            checked={formData.userType === 'Individual'}
                            onChange={handleChange}
                            required
                          />
                          <span className="radio-label">Individual</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="userType"
                            value="Property Agent"
                            checked={formData.userType === 'Property Agent'}
                            onChange={handleChange}
                          />
                          <span className="radio-label">Property Agent</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Create Password</label>
                      <input 
                        type="password" 
                        name="password" 
                        placeholder="At least 6 characters" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input 
                        type="password" 
                        name="confirmPassword" 
                        placeholder="Re-enter your password" 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="secondary-button" onClick={() => setIsVerified(false)}>
                        Back
                      </button>
                      <button type="button" className="primary-button" onClick={nextStep}>
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
  <div className="form-step">
    <h2>Personal Details</h2>
    
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            name="fullName" 
            placeholder="Your full name" 
            value={formData.fullName} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Date of Birth</label>
            <input 
              type="date" 
              name="dob" 
              value={formData.dob} 
              onChange={handleChange} 
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Languages Known</label>
          <Select
            isMulti
            name="languages"
            options={languageOptions}
            value={languageOptions.filter(option => 
              formData.languages.split(',').map(lang => lang.trim()).includes(option.value))
            }
            onChange={(selectedOptions) => {
              setFormData({
                ...formData,
                languages: selectedOptions.map(option => option.value).join(', ')
              });
            }}
            placeholder="Select languages you know..."
            className="select-input"
            styles={customStyles}
          />
        </div>
        
        <div className="form-group">
          <label>Current City</label>
          <input 
            type="text" 
            name="location" 
            placeholder="Where do you live?" 
            value={formData.location} 
            onChange={handleChange} 
          />
        </div>
        
        <div className="form-group">
          <label>ID Verification</label>
          <div className="form-row">
            <select name="idType" value={formData.idType} onChange={handleChange} style={{flex: 1}}>
              <option value="">Select ID type</option>
              <option value="Aadhar">Aadhar</option>
              <option value="Passport">Passport</option>
            </select>
            <input 
              type="text" 
              name="idNumber" 
              placeholder="ID number" 
              value={formData.idNumber} 
              onChange={handleChange} 
              style={{flex: 2, marginLeft: '10px'}}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>About You</label>
          <textarea 
            name="bio" 
            placeholder="Tell us about yourself..." 
            value={formData.bio} 
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>
        
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={prevStep}>
            Back
          </button>
          <button type="button" className="primary-button" onClick={nextStep}>
            Continue
          </button>
        </div>
      </div>
    )}
                {currentStep === 3 && (
                  <div className="form-step">
                    <h2>Living Preferences</h2>
                    
                    <div className="form-group">
                      <label>Profession</label>
                      <select name="profession" value={formData.profession} onChange={handleChange}>
                        <option value="">Select your profession</option>
                        <option value="Working Professional">Working Professional</option>
                        <option value="Job Seeker">Job Seeker</option>
                        <option value="Student">Student</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    
                    {formData.profession === 'Others' && (
                      <div className="form-group">
                        <label>Specify Profession</label>
                        <input 
                          type="text" 
                          name="customProfession" 
                          placeholder="Your profession" 
                          value={formData.customProfession} 
                          onChange={handleChange} 
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label>Food Preference</label>
                      <select name="habits.foodChoice" value={formData.habits.foodChoice} onChange={handleChange}>
                        <option value="">Select food preference</option>
                        <option value="Veg">Vegetarian</option>
                        <option value="Non-Veg">Non-Vegetarian</option>
                        <option value="Egg">Eggetarian</option>
                      </select>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Smoking</label>
                        <select name="habits.smoking" value={formData.habits.smoking} onChange={handleChange}>
                          <option value="">Select preference</option>
                          <option value="Daily">Daily</option>
                          <option value="Occasionally">Occasionally</option>
                          <option value="Never">Never</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Alcohol</label>
                        <select name="habits.alcohol" value={formData.habits.alcohol} onChange={handleChange}>
                          <option value="">Select preference</option>
                          <option value="Daily">Daily</option>
                          <option value="Occasionally">Occasionally</option>
                          <option value="Never">Never</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Partying</label>
                        <select name="habits.partying" value={formData.habits.partying} onChange={handleChange}>
                          <option value="">Select preference</option>
                          <option value="Weekends">Weekends</option>
                          <option value="Occasionally">Occasionally</option>
                          <option value="Never">Never</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Guests</label>
                        <select name="habits.guests" value={formData.habits.guests} onChange={handleChange}>
                          <option value="">Select preference</option>
                          <option value="Daily">Frequently</option>
                          <option value="Rare">Rarely</option>
                          <option value="Never">Never</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Pets</label>
                      <select name="habits.pets" value={formData.habits.pets} onChange={handleChange}>
                        <option value="">Select preference</option>
                        <option value="Yes">Have pets</option>
                        <option value="May Have">May have pets</option>
                        <option value="No">No pets</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Interests</label>
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
                        placeholder="Select your interests..."
                        className="select-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Personality Traits</label>
                      <input 
                        type="text" 
                        name="traits" 
                        placeholder="e.g., Calm, Friendly, Organized" 
                        value={formData.traits} 
                        onChange={handleChange} 
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="secondary-button" onClick={prevStep}>
                        Back
                      </button>
                      <button type="button" className="primary-button" onClick={nextStep}>
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="form-step">
                    <h2>Review Your Information</h2>
                    
                    <div className="review-section">
                      <h3>Account Information</h3>
                      <div className="review-item">
                        <span>User Type:</span>
                        <span>{formData.userType || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div className="review-section">
                      <h3>Personal Details</h3>
                      <div className="review-item">
                        <span>Full Name:</span>
                        <span>{formData.fullName || 'Not specified'}</span>
                      </div>
                      <div className="review-item">
                        <span>Gender:</span>
                        <span>{formData.gender || 'Not specified'}</span>
                      </div>
                      <div className="review-item">
                        <span>Date of Birth:</span>
                        <span>{formData.dob || 'Not specified'}</span>
                      </div>
                      <div className="review-item">
                        <span>Location:</span>
                        <span>{formData.location || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div className="review-section">
                      <h3>Living Preferences</h3>
                      <div className="review-item">
                        <span>Profession:</span>
                        <span>{formData.profession === 'Others' ? formData.customProfession : formData.profession || 'Not specified'}</span>
                      </div>
                      <div className="review-item">
                        <span>Food Preference:</span>
                        <span>{formData.habits.foodChoice || 'Not specified'}</span>
                      </div>
                      <div className="review-item">
                        <span>Smoking:</span>
                        <span>{formData.habits.smoking || 'Not specified'}</span>
                      </div>
                      <div className="review-item">
                        <span>Alcohol:</span>
                        <span>{formData.habits.alcohol || 'Not specified'}</span>
                      </div>
                      <div className="review-item">
                        <span>Interests:</span>
                        <span>{formData.interests.join(', ') || 'Not specified'}</span>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="secondary-button" onClick={prevStep}>
                        Back
                      </button>
                      <button type="submit" className="primary-button">
                        Complete Registration
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;