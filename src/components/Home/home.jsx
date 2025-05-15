import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import places from '../../places'; // List of places
import Header from '../Header/Header';

function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState([
    'Profession',
    'Food Options',
    'Parking',
    'Language',
  ]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableFilters] = useState([
    'Pets',
    'Partying',
    'Interests',
    'Alcohol',
    'Smoking',
  ]);
  const [user, setUser] = useState(null);
  const [myListings, setMyListings] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (currentUserKey) {
      const userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUserKey}`));
      if (userProfile) {
        setUser(userProfile);
        const userListings = JSON.parse(localStorage.getItem(`listings_${userProfile.email}`)) || [];
        setMyListings(userListings);
        setSearchResults(userListings); // Show all listings by default
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setActiveIndex(-1);

    const results = places.filter(place =>
      place.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(value ? results : []);
  };

  const handleSearchClick = () => {
    if (!searchTerm.trim()) {
      setSearchResults(myListings); // Show all if empty
      return;
    }

    const results = myListings.filter(listing =>
      listing.propertyAddress &&
      listing.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );

    console.log('All Listings:', myListings);
    console.log('Search Term:', searchTerm);
    console.log('Filtered Results:', results);

    setSearchResults(results);
  };

  const handleSuggestionClick = (place) => {
    setSearchTerm(place);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      setSuggestions([]);
    } else if (e.key === 'ArrowDown') {
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        handleSuggestionClick(suggestions[activeIndex]);
      } else {
        handleSearchClick();
      }
    }
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const handleDeleteFilter = (index) => {
    const updatedFilters = [...filters];
    updatedFilters.splice(index, 1);
    setFilters(updatedFilters);
  };

  const handleAddNewFilter = () => {
    setShowDropdown(!showDropdown);
  };

  const handleFilterSelect = (filter) => {
    if (!filters.includes(filter)) {
      setFilters([...filters, filter]);
    }
    setShowDropdown(false);
  };

  return (
    <div className="App">
      <Header isLoggedIn={!!user} />

      <main className="content">
        <div className="content">Trusted partner to find a flat mate</div>

        {user && (
          <div style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>
            👋 Welcome back, <strong>{user.fullName || 'User'}</strong>!
          </div>
        )}

        <h1>Find compatible flatmates</h1>

        <div className="search-bar" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search Places..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="search-input"
            autoComplete="off"
          />
          <button className="search-button" onClick={handleSearchClick}>Search</button>
          <button className="compatible-search-button" onClick={toggleFilters}>
            Compatible Search
          </button>

          {suggestions.length > 0 && (
            <ul className="dropdown-list">
              {suggestions.map((place, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(place)}
                  className={index === activeIndex ? 'active' : ''}
                >
                  {place}
                </li>
              ))}
            </ul>
          )}
        </div>

        {showFilters && (
          <div className="filter-options" style={{ marginTop: '1rem', color: 'white' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.2rem' }}>Selected Filters: </span>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {filters.map((filter, index) => (
                  <div
                    key={index}
                    style={{
                      margin: '5px',
                      padding: '5px 10px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {filter}
                    <span
                      onClick={() => handleDeleteFilter(index)}
                      style={{
                        marginLeft: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: 'red',
                      }}
                    >
                      X
                    </span>
                  </div>
                ))}
                <button
                  onClick={handleAddNewFilter}
                  style={{
                    padding: '6px 12px',
                    margin: '5px',
                    cursor: 'pointer',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '1rem',
                  }}
                >
                  Add New
                </button>
              </div>
            </div>

            {showDropdown && (
              <div style={{ position: 'absolute', backgroundColor: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' }}>
                <h4>Select More Filters</h4>
                {availableFilters.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleFilterSelect(option)}
                    style={{
                      padding: '8px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {searchResults.length > 0 ? (
  <div className="listings-grid">
      {searchResults.map((listing, idx) => (
        <div key={idx} className="listing-card">
          <h3>{listing.propertyTitle || listing.propertyType}</h3>
          <p><strong>Address:</strong> {listing.propertyAddress}</p>
          <p><strong>Rent:</strong> ₹{listing.rent}</p>
          <p><strong>Available From:</strong> {listing.availableFrom}</p>
        </div>
      ))}
    </div>
  ) : (
    searchTerm && (
      <div style={{ color: 'white', marginTop: '2rem' }}>
        No listings found for "<strong>{searchTerm}</strong>"
      </div>
    )
  )}

      </main>
    </div>
  );
}

export default Home;
