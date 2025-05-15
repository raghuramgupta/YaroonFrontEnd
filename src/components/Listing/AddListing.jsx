import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddListing.css';
import Header from '../Header/Header';
import MyListings from './MyListings'; // Adjust path if needed

const AddListing = ({ onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
          {/* Display user profile info here if needed */}
        </div>
      )}

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            My Listings
          </button>
          <button
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Add New Listing
          </button>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'listings' && <MyListings />}
        {activeTab === 'add' && (
          <div className="listing-form">
            <h1 className="form-title">Facts</h1>
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
      </div>
    </div>
  );
};

export default AddListing;
