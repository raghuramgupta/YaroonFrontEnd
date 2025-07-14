import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiLogIn, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import './StaffAuth.css';
import config from '../../config';

const StaffLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
    const axiosConfig = {  // Renamed to avoid conflict
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const body = JSON.stringify({ email, password });
      const res = await axios.post(`${config.apiBaseUrl}/api/staff/login`, body, axiosConfig);

      
      localStorage.setItem('staffToken', res.data.token);
      navigate('/staff/dashboard');
    } catch (err) {
      setErrors(err.response?.data?.errors || { msg: err.response?.data?.msg || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="staff-auth-container">
      <div className="staff-auth-card">
        <div className="staff-auth-header">
          <h1>Yaroon Staff Portal</h1>
          <p>Sign in to your staff account</p>
        </div>
        
        <form onSubmit={onSubmit} className="staff-auth-form">
          {errors.msg && (
            <div className="auth-error-message">
              {errors.msg}
            </div>
          )}
          
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
                required
              />
            </div>
            <div className="forgot-password-link">
              <Link to="/staff/forgot-password">
                Forgot password?
              </Link>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`auth-submit-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                Sign In <FiArrowRight className="button-icon" />
              </>
            )}
          </button>
          
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/staff/register">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffLogin;