import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';
import { useEffect } from 'react'; // if not already imported


const Header = ({ isLoggedIn = false, onLogout = () => {} }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => setShowMenu(prev => !prev);
const [user, setUser] = useState(null);
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
}, []);

  return (
    <header className="App-header">
      <div className="logo">
        <Link to="/" className="logo-link">
        <div className="logo-container">
          <span className="logo-text">YAAR🏠OM</span>
          <div className="logo-underline"></div>
        </div>
      </Link>
      </div>
       {user && (
        <div className="welcome-msg" style={{ color: 'black' }}>
          👋 Welcome back, <strong>{user.fullName || 'User'}</strong>!
        </div>
      )}
      <div className="header-buttons"><button
  style={{
    backgroundColor: 'transparent',
    border: '2px solid #3c434f',
    color: 'black',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
  }}
  onClick={() => navigate('/need-place')}
>
  Need a place
</button>

<button
  style={{
    backgroundColor: 'transparent',
    border: '2px solid #3c434f',
    color: 'black',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginLeft: '10px', // optional for spacing
  }}
  onClick={() => navigate('/room-in-shareholder')}
>
  Flatmate Needed
</button>

        {isLoggedIn ? (
          <div className="user-menu-wrapper">
            <button className="user-menu-button" onClick={toggleMenu}>☰ Menu</button>
            {showMenu && (
              <ul className="user-dropdown">
                <li><Link to="/profile" onClick={() => setShowMenu(false)} className="dropdown-item">Edit/View Profile</Link></li>
                <li><Link to="/listings" onClick={() => setShowMenu(false)} className="dropdown-item">My Listings</Link></li>
                <li><Link to="/support" onClick={() => setShowMenu(false)} className="dropdown-item">Customer Service</Link></li>
                <li><Link to="/inbox" onClick={() => setShowMenu(false)} className="dropdown-item">Messages</Link></li>
                <li><button onClick={handleLogout} className="dropdown-item logout-btn">Logout</button></li>
              </ul>
            )}
          </div>
        ) : (
          <button className="login-register" onClick={() => navigate('/signup')}>Login / Signup</button>
        )}
      </div>
    </header>
  );
};

export default Header;
