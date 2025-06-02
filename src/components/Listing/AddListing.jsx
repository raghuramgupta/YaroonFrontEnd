import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddListing.css';
import Header from '../Header/Header';
import MyListings from './MyListings';
import Dashboard from './Dashboard';

const AddListing = ({ onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');
  const [profile, setProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (currentUserKey) {
      setIsLoggedIn(true);
    } else {
      alert('Current user not found in localStorage');
    }
  }, []);

  const handleOptionChange = (option) => setSelectedOption(option);

  const handleNext = () => {
    if (!selectedOption) return;
    const routeMap = {
      "List Room in your Property": "/room-in-shareholder",
      "I need a room": "/need-place",
      "Student accommodation": "/student-accommodation",
      "Homestay": "/homestay"
    };
    const route = routeMap[selectedOption];
    if (route) {
      navigate(route, { state: { accommodationType: selectedOption } });
    }
  };

  return (
    <div className="accommodation-form">
      <Header isLoggedIn={isLoggedIn} />

      {profile && (
        <div className="current-user">
          {/* Optional: Display user profile info here */}
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')} style={{ fontSize: '12px',justifyContent:'center' }}
          >
            My Listings
          </button>
          <button
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`} style={{ fontSize: '12px',justifyContent:'center' }}
            onClick={() => setActiveTab('add')}
          >
            Add New Listing
          </button>
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ fontSize: '12px',justifyContent:'center' }}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="tab-content" style={{ fontSize: '12px',padding: '0px' }}>
        {activeTab === 'listings' && <MyListings />}

        {activeTab === 'add' && (
          <div className="listing-form" >
            <h2 className="form-subtitle">What type of accommodation are you offering?</h2>
            <div className="options-container" style={{ display: 'flex', gap: '2rem' }}>
                {[
                  { text: "List Room in your Property", icon: "🏠" },
                  { text: "I need a room", icon: "🔍" }
                ].map((option) => (
                  <div
                    key={option.text}
                    className={`card option-item ${selectedOption === option.text ? 'selected' : ''}`}
                    onClick={() => handleOptionChange(option.text)}
                    style={{
                      padding: '2rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      flex: 1,
                      minHeight: '180px', // Increased card height
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: selectedOption === option.text ? '#f5f9ff' : '#ffffff',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)'
                      }
                    }}
                  >
                    <input
                      type="radio"
                      id={option.text}
                      name="accommodationType"
                      value={option.text}
                      checked={selectedOption === option.text}
                      onChange={() => handleOptionChange(option.text)}
                      hidden
                    />
                    <div style={{ 
                      fontSize: '2.5rem',
                      marginBottom: '1rem'
                    }}>
                      {option.icon}
                    </div>
                    <label 
                      htmlFor={option.text} 
                      style={{
                        display: 'block',
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#000000', // Black text
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {option.text}
                    </label>
                  </div>
                ))}
              </div>

            <div className="form-footer">
              <button type="button" className="back-button" onClick={onBack}>
                Back
              </button>
              {selectedOption && (
                <button
                  type="button"
                  className="next-button"
                  onClick={handleNext}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && <Dashboard />}
      </div>
    </div>
  );
};

export default AddListing;
