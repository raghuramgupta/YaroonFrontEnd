import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddListing.css';
import Header from '../Header/Header';
import MyListings from './MyListings';
import Dashboard from './Dashboard';
import AccommodationForm from './AccommodationForm'

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
      alert('Please log in to access this feature');
      navigate('/login');
    }
  }, [navigate]);

  const handleOptionChange = (option) => setSelectedOption(option);

  const handleNext = () => {
    if (!selectedOption) return;
    const routeMap = {
      "List Room in your Property": "/room-in-shareholder",
      "I need a room": "/need-place",
      "PG /Co-Living": "/AccommodationForm"
    };
    const route = routeMap[selectedOption];
    if (route) {
      navigate(route, { state: { accommodationType: selectedOption } });
    }
  };

  const accommodationOptions = [
    { text: "List Room in your Property", icon: "🏠", description: "Rent out a room in your existing property" },
    { text: "I need a room", icon: "🔍", description: "Find available rooms that match your needs" },
    { text: "PG /Co-Living", icon: "🎓", description: "Find PGs and Co living spaces" }
  ];

  return (
    <div className="professional-accommodation-container">
      <Header isLoggedIn={isLoggedIn} />

      <div className="content-container">
        <div className="navigation-tabs">
          <button
            className={`nav-tab ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-label">My Listings</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <span className="tab-icon">➕</span>
            <span className="tab-label">Add Listing</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Dashboard</span>
          </button>
        </div>

        <div className="main-content">
          {activeTab === 'listings' && <MyListings />}

          {activeTab === 'add' && (
            <div className="professional-listing-form">
              <div className="form-header">
                <h2 className="form-title">Create New Listing</h2>
                <p className="form-subtitle">Select the type of accommodation you want to list or find</p>
              </div>
              
              <div className="options-grid">
                {accommodationOptions.map((option) => (
                  <div
                    key={option.text}
                    className={`option-card ${selectedOption === option.text ? 'selected' : ''}`}
                    onClick={() => handleOptionChange(option.text)}
                  >
                    <div className="option-icon">{option.icon}</div>
                    <h3 className="option-title">{option.text}</h3>
                    <p className="option-description">{option.description}</p>
                    
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={onBack}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleNext}
                  disabled={!selectedOption}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard />}
        </div>
      </div>
    </div>
  );
};

export default AddListing;