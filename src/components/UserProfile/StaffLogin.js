import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StaffLogin.css';import StaffHeader from '../Header/StaffHeader';

const StaffLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/staff/login', formData);
      if (response.data.success) {
        localStorage.setItem('staffToken', response.data.token);
        localStorage.setItem('currentStaff', JSON.stringify({
          email: formData.email
          // Add any other relevant staff data you need
        }));
        navigate('/staff/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    navigate('/staff/forgot-password');
  };

  return (
    <div className="staff-login-container"><StaffHeader></StaffHeader>
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Staff Login</h1>
          <p className="login-subtitle">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="error-alert">
            <svg className="error-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="error-text">{error}</p>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
              required
            />
            <div className="forgot-password">
              <a href="/staff/forgot-password" onClick={handleForgotPassword} className="forgot-password-link">
                Forgot password?
              </a>
            </div>
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        <div className="login-footer">
          Don't have an account?{' '}
          <a href="/staff/register" className="login-footer-link">
            Register here
          </a>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;