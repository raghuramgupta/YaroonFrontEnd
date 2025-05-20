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
      "Room(s) in an existing shareholder": "/room-in-shareholder",
      "Whole property for rent": "/whole-property",
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
            <div className="options-container">
              {[
                "Room(s) in an existing shareholder",
                "Whole property for rent",
                "Student accommodation",
                "Homestay"
              ].map((option) => (
                <div
                  key={option}
                  className={`option-item ${selectedOption === option ? 'selected' : ''}`}
                  onClick={() => handleOptionChange(option)}
                >
                  <input
                    type="radio"
                    id={option}
                    name="accommodationType"
                    value={option}
                    checked={selectedOption === option}
                    onChange={() => handleOptionChange(option)}
                    hidden
                  />
                  <label htmlFor={option}>{option}</label>
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
