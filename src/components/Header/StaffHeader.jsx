import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './StaffHeader.css';
import { FiHome, FiUsers, FiLogIn, FiUserPlus, FiUser, FiLogOut, FiChevronDown, FiSettings, FiMessageSquare } from 'react-icons/fi';

const StaffHeader = ({ onLogout = () => {} }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [username, setUsername] = useState("Staff");
  const [userRole, setUserRole] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleMenu = () => setShowMenu(prev => !prev);

  const handleLogout = () => {
    setShowMenu(false);
    onLogout();
    localStorage.removeItem('currentStaff');
    localStorage.removeItem('staffData');
    setIsLoggedIn(false);
    navigate('/staff/login');
  };

  const navigateToTickets = () => {
    navigate('/ticketManagement');
  };

  useEffect(() => {
    // Check if user is logged in
    const currentStaff = localStorage.getItem('currentStaff');
    setIsLoggedIn(!!currentStaff);

    const staffData = JSON.parse(localStorage.getItem('staffData'));
    if (staffData) {
      setUsername(staffData.name || "Staff");
      setUserRole(staffData.role || "Staff Member");
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`staff-header ${isScrolled ? 'scrolled' : ''}`}>
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
              <Link to="/staff/dashboard" className="nav-link">
                <FiHome className="nav-icon" />
                <span>Dashboard</span>
              </Link>
            </li>
            
            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <button 
                    onClick={navigateToTickets} 
                    className="nav-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <FiMessageSquare className="nav-icon" />
                    <span>Support Tickets</span>
                  </button>
                </li>
                <li className="nav-item">
                  <Link to="/adminpage" className="nav-link">
                    <FiUsers className="nav-icon" />
                    <span>Manage Staff</span>
                  </Link>
                </li>
              </>
            )}

            {!isLoggedIn ? (
              <>
                <li className="nav-item">
                  <Link to="/staff/login" className="nav-link">
                    <FiLogIn className="nav-icon" />
                    <span>Staff Login</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/staff/register" className="nav-link">
                    <FiUserPlus className="nav-icon" />
                    <span>Staff Register</span>
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button 
                  onClick={handleLogout} 
                  className="nav-link logout-button"
                >
                  <FiLogOut className="nav-icon" />
                  <span>Log Out</span>
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* User Widget */}
        {isLoggedIn && (
          <div className="user-widget">
            <div className="user-info-widget" onClick={toggleMenu}>
              <div className="user-avatar-widget">
                {username?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="user-details">
                <div className="user-name-widget">{username || 'Staff'}</div>
                <div className="user-role-widget">{userRole}</div>
              </div>
              <FiChevronDown className={`dropdown-arrow ${showMenu ? 'open' : ''}`} />
            </div>
            
            {showMenu && (
              <div className="user-dropdown-container">
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {username?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-username">{username || 'Staff'}</div>
                      <div className="dropdown-role">{userRole}</div>
                    </div>
                  </div>       
                  <div className="dropdown-divider"></div>
                  <Link to="/staff/profile" className="dropdown-item" onClick={() => setShowMenu(false)}>
                    <FiUser className="dropdown-icon" />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/staff/settings" className="dropdown-item" onClick={() => setShowMenu(false)}>
                    <FiSettings className="dropdown-icon" />
                    <span>Settings</span>
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
        )}
      </div>
    </header>
  );
};

export default StaffHeader;