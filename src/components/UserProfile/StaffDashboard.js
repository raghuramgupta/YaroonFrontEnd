import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiLogOut, 
  FiUser, 
  FiMail, 
  FiShield, 
  FiCalendar, 
  FiHome 
} from 'react-icons/fi';
import PropTypes from 'prop-types';
import './StaffDashboard.css';
import config from '../../config';

const StaffDashboard = () => {
  const [staff, setStaff] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem('staffToken');
        
        if (!token) {
          navigate('/staff/login');
          return;
        }

        const res = await axios.get(`${config.apiBaseUrl}/api/staff/me`, {
          headers: {
            'x-auth-token': token
          },
          signal: controller.signal,
          timeout: 10000 // 10 second timeout
        });
       
        if (isMounted) {
          setStaff(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching staff data:', err);
          setError(err.response?.data?.message || err.message);
          
          if (err.response?.status === 401) {
            localStorage.removeItem('staffToken');
            navigate('/staff/login');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStaff();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('staffToken');
    navigate('/staff/login');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" aria-label="Loading..."></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="error-container">
        <h2>No Staff Data Found</h2>
        <p>Please try logging in again</p>
        <button 
          onClick={logout}
          className="logout-button"
        >
          <FiLogOut className="button-icon" /> Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Yaroon Staff Portal</h1>
          <button
            onClick={logout}
            className="logout-button"
            aria-label="Logout"
          >
            <FiLogOut className="button-icon" /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="profile-card">
          {/* Profile Section */}
          <div className="profile-section">
            <div className="profile-info">
              <div className="profile-avatar" aria-label="Profile picture">
                <FiUser className="avatar-icon" />
              </div>
              <div className="profile-details">
                <h2>{staff.name}</h2>
                <p>{staff.email}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-container">
                  <FiShield className="stat-icon" aria-hidden="true" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Role</p>
                  <p className="stat-value">{staff.role}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-container">
                  <FiCalendar className="stat-icon" aria-hidden="true" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Member Since</p>
                  <p className="stat-value">
                    {new Date(staff.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-container">
                  <FiHome className="stat-icon" aria-hidden="true" />
                </div>
                <div className="stat-content">
                  <p className="stat-label">Properties</p>
                  <p className="stat-value">
                    {staff.propertyCount || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="actions-section">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <Link
                to="/staff/properties"
                className="action-card"
                aria-label="Manage Properties"
              >
                <div className="action-icon">
                  <FiHome aria-hidden="true" />
                </div>
                <h4>Manage Properties</h4>
                <p>View and edit properties</p>
              </Link>
              <Link
                to="/staff/tenants"
                className="action-card"
                aria-label="Tenant Management"
              >
                <div className="action-icon">
                  <FiUser aria-hidden="true" />
                </div>
                <h4>Tenant Management</h4>
                <p>Manage tenant accounts</p>
              </Link>
              <Link
                to="/staff/reports"
                className="action-card"
                aria-label="Reports"
              >
                <div className="action-icon">
                  <FiShield aria-hidden="true" />
                </div>
                <h4>Reports</h4>
                <p>Generate financial reports</p>
              </Link>
              <Link
                to="/staff/settings"
                className="action-card"
                aria-label="Settings"
              >
                <div className="action-icon">
                  <FiMail aria-hidden="true" />
                </div>
                <h4>Settings</h4>
                <p>Account preferences</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

StaffDashboard.propTypes = {
  // Add prop types if this component receives any props
};

export default StaffDashboard;