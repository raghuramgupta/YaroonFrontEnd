import React, { useState } from 'react';
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import './StaffAuth.css';
import axios from 'axios';
import config from '../../config';

const StaffRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { name, email, password, password2 } = formData;
  
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const onSubmit = async (e) => {
  e.preventDefault();
  
  // Reset errors
  setErrors({});

  // Validate passwords match
  if (password !== password2) {
    setErrors({ ...errors, password2: 'Passwords do not match' });
    return;
  }

  setIsLoading(true);

  try {
    // Replace with actual API call
    const response = await axios.post(`${config.apiBaseUrl}/api/staff/register`, formData);
    console.log('Registration successful:', response.data);
    // Redirect or show success message
  } catch (err) {
    setErrors({ ...errors, msg: err.response?.data?.message || 'Registration failed' });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="staff-auth-container">
      <div className="staff-auth-card">
        <div className="staff-auth-header">
          <h1>Join Yaroon Staff</h1>
          <p>Create your staff account</p>
        </div>
        
        <form onSubmit={onSubmit} className="staff-auth-form">
          {errors.msg && (
            <div className="auth-error-message">
              {errors.msg}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">
              Full Name
            </label>
            <div className="input-with-icon">
              <FiUser className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="John Doe"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="••••••••"
                minLength="6"
                required
              />
            </div>
            <p className="input-hint">Minimum 6 characters</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="password2">
              Confirm Password
            </label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                type="password"
                id="password2"
                name="password2"
                value={password2}
                onChange={onChange}
                placeholder="••••••••"
                minLength="6"
                required
              />
            </div>
            {errors.password2 && (
              <p className="input-error">{errors.password2}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`auth-submit-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              'Creating account...'
            ) : (
              <>
                Register <FiArrowRight className="button-icon" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffRegister;