import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';import StaffHeader from '../Header/StaffHeader';
import './StaffRegister.css'; // Import the CSS file
const StaffRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    department: ''
  });
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();
const departmentOptions = [
    { value: '', label: 'Select Department', disabled: true },
    { value: 'IT', label: 'IT' },
    { value: 'Customer Service', label: 'Customer Service' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Management', label: 'Management' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.department.trim()) errors.department = 'Department is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const response = await axios.post('http://localhost:5000/api/staff/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department
      });
      
      if (response.data.success) {
        navigate('/staff/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="staff-register-container"><StaffHeader></StaffHeader>
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Staff Registration</h1>
          <p className="register-subtitle">Create your staff account to access the dashboard</p>
        </div>

        {error && (
          <div className="error-alert">
            <svg className="error-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="error-text">{error}</p>
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${formErrors.name ? 'error' : ''}`}
              required
            />
            {formErrors.name && <span className="error-message">{formErrors.name}</span>}
          </div>

          {/* Repeat similar structure for other fields */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${formErrors.email ? 'error' : ''}`}
              required
            />
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${formErrors.password ? 'error' : ''}`}
              required
            />
            {formErrors.password && <span className="error-message">{formErrors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
              required
            />
            {formErrors.confirmPassword && <span className="error-message">{formErrors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="department" className="form-label">Department</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`form-input ${formErrors.department ? 'error' : ''}`}
              required
            >
              {departmentOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled || false}
                >
                  {option.label}
                </option>
              ))}
            </select>
            {formErrors.department && (
              <span className="error-message">{formErrors.department}</span>
            )}
          </div>

          <button type="submit" className="submit-button">
            Register
          </button>
        </form>

        <div className="divider">
          <span className="divider-text">Already have an account?</span>
        </div>

        <a href="/staff/login" className="login-link">
          Sign in to existing account
        </a>
      </div>
    </div>
  );
};

export default StaffRegister; 