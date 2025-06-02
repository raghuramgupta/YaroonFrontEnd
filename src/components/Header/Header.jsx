import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';
import axios from 'axios';
import config from '../../config';

const Header = ({ isLoggedIn = false, onLogout = () => {} }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUserName] = useState(null);

  const toggleMenu = () => setShowMenu(prev => !prev);

  const handleLogout = () => {
    setShowMenu(false);
    onLogout();
    navigate('/logout-thank-you');
  };

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (currentUserKey) {
      const userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUserKey}`));
      if (userProfile) setUser(userProfile);
    }
    axios.get(`${config.apiBaseUrl}/api/users/profile/${currentUserKey}`)
      .then(res => {
        setUserName(res.data.fullName);
      }).catch(err => {
        console.error('Failed to load profile:', err);
        setUserName("Guest");
      });
  }, []);

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <Link to="/" className="logo-link">
            <div className="logo-container">
              <span className="logo-text">YAAR🏠OM</span>
              <div className="logo-underline"></div>
            </div>
          </Link>
          {user && (
            <div className="welcome-msg">
              <span className="welcome-icon">👋</span>
              Welcome back, <strong>{username || 'User'}</strong>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}<div className="nav-buttons"></div>
        <div className="nav-buttons">
          <button 
            className="nav-button"
            onClick={() => navigate('/need-place')}
          >
            <span className="button-icon">🏠</span>
            Need a Place
          </button></div><div className="nav-buttons">
          <button 
            className="nav-button"
            onClick={() => navigate('/room-in-shareholder')}
          >
            <span className="button-icon">👥</span>
            Find Roommates
          </button>
        </div>

        {/* User Menu */}
        <div className="user-section">
          {isLoggedIn ? (
            <div className="user-menu-wrapper">
              <button 
                className="user-menu-button"
                onClick={toggleMenu}
                aria-label="User menu"
              >
                <div className="user-avatar">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="menu-icon">▾</span>
              </button>
              
              {showMenu && (
                <div className="user-dropdown-container">
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-username">{username || 'User'}</div>
                        <div className="dropdown-email">{user?.email || ''}</div>
                      </div>
                    </div>       
                    <div className="dropdown-divider"></div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <span className="dropdown-icon">👤</span>
                      My Profile
                    </Link>
                    <Link to="/listings" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <span className="dropdown-icon">🏘️</span>
                      My Listings
                    </Link>
                    <Link to="/inbox" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <span className="dropdown-icon">✉️</span>
                      Messages
                    </Link>
                    <Link to="/support" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <span className="dropdown-icon">🛟</span>
                      Help & Support
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <span className="dropdown-icon">🚪</span>
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="auth-button"
              onClick={() => navigate('/signup')}
            >
              Login / Signup
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;