import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';
import axios from 'axios';
import config from '../../config';
import { FiHome, FiUsers, FiUser, FiMail, FiHelpCircle, FiLogOut, FiChevronDown } from 'react-icons/fi';

const Header = ({ isLoggedIn = false, onLogout = () => {} }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUserName] = useState("Guest");
  const [isScrolled, setIsScrolled] = useState(false);

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
        const displayName = res.data.userType === 'Property Agent' 
          ? res.data.companyName 
          : res.data.fullName || "User";
        setUserName(displayName);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
      });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <Link to="/" className="logo-link">
            <div className="logo-container">
             <span className="logo-text">YAAR🏠OM</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="main-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/need-place" className="nav-link">
                <FiHome className="nav-icon" />
                <span>Find a Home</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/room-in-shareholder" className="nav-link">
                <FiUsers className="nav-icon" />
                <span>Find Roommates</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/agents" className="nav-link">
                <span>Agents</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Section */}
        <div className="user-section">
          {isLoggedIn ? (
            <div className="user-menu-wrapper">
              <div className="user-info" onClick={toggleMenu}>
                <div className="user-avatar">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-name">{username || 'User'}</div>
                <FiChevronDown className={`dropdown-arrow ${showMenu ? 'open' : ''}`} />
              </div>
              
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
                      <FiUser className="dropdown-icon" />
                      <span>My Profile</span>
                    </Link>
                    <Link to="/listings" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <FiHome className="dropdown-icon" />
                      <span>My Listings</span>
                    </Link>
                    <Link to="/inbox" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <FiMail className="dropdown-icon" />
                      <span>Messages</span>
                    </Link>
                    <Link to="/support" className="dropdown-item" onClick={() => setShowMenu(false)}>
                      <FiHelpCircle className="dropdown-icon" />
                      <span>Help & Support</span>
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <FiLogOut className="dropdown-icon" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                className="auth-button login-button"
                onClick={() => navigate('/login')}
              >
                Log In
              </button>
              <button 
                className="auth-button signup-button"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;