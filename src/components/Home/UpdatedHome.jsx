import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import './UpdatedHome.css';
import { useNavigate } from 'react-router-dom';
import places from '../../places';
import axios from 'axios';

function UpdatedHome() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(['Profession', 'Food Options', 'Parking', 'Language']);
  const [filterOptions, setFilterOptions] = useState({
    'Profession': ['Student', 'Working Professional', 'Freelancer'],
    'Food Options': ['Vegetarian', 'Eggetarian', 'Non-Vegetarian'],
    'Parking': ['Two-Wheeler', 'Four-Wheeler', 'None'],
    'Language': ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Other']
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [appliedFilterValues, setAppliedFilterValues] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchType, setSearchType] = useState('flats');
  const navigate = useNavigate();

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    if (currentUserKey) setIsLoggedIn(true);

    fetchListings();
  }, [searchType]);

  const fetchListings = async () => {
    
    const endpoint = searchType === 'roommates'
      ? 'http://localhost:5000/api/wanted-listings'
      : 'http://localhost:5000/api/listings';

    try {
      const res = await axios.get(endpoint);
      setMyListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching listings:", err);
    }
  };

  useEffect(() => {
    const images = [
      './Sample.jpg',
      './City.jpg',
      './Yaroon.jpg',
      './Bangalore.jpg',
      './Delhi.jpg'
    ];
    let index = 0;
    const heroBackground = document.getElementById('heroBackground');
    if (!heroBackground) return;

    const updateBackground = () => {
      heroBackground.style.backgroundImage = `url(${images[index]})`;
      index = (index + 1) % images.length;
    };

    updateBackground();
    const interval = setInterval(updateBackground, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSuggestionClick = (place) => {
    setSearchTerm(place);
    setFilteredPlaces([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      setFilteredPlaces([]);
    } else if (e.key === 'ArrowDown') {
      setActiveIndex((prev) => (prev < filteredPlaces.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      handleSuggestionClick(filteredPlaces[activeIndex]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setActiveIndex(-1);
    const results = places.filter(place => place.toLowerCase().includes(value.toLowerCase()));
    setFilteredPlaces(value ? results : []);
  };

  const handleSearchClick = () => {
    if (!user) {
      setUser("Dummy");
      return;
    }

    const results = myListings.filter(listing =>
      listing.userKey !== user &&
      (searchTerm === '' || listing.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    navigate('/search-results', { state: { results } });
  };

  const toggleFilters = () => {
    setFiltersVisible(prev => !prev);
    setActiveFilter(null);
  };

  const removeFilter = (filterToRemove) => {
    setSelectedFilters(prev => prev.filter(filter => filter !== filterToRemove));
    setAppliedFilterValues(prev => {
      const newValues = { ...prev };
      delete newValues[filterToRemove];
      return newValues;
    });
    setActiveFilter(null);
  };

  const showFilterOptions = (filter) => {
    setActiveFilter(prev => (prev === filter ? null : filter));
  };

  const applyFilter = (filterCategory, option) => {
    setAppliedFilterValues(prev => ({
      ...prev,
      [filterCategory]: option
    }));
    setActiveFilter(null);
  };

useEffect(() => {
  let filtered = [...myListings];

  Object.entries(appliedFilterValues).forEach(([filter, value]) => {
    const key = filter.toLowerCase().replace(/\s/g, '');
    filtered = filtered.filter(listing => {
      const listingValue = listing[key];
      if (!listingValue) return false;
      return Array.isArray(listingValue)
        ? listingValue.includes(value)
        : listingValue === value;
    });
  });

  if (user) {
    filtered = filtered.filter(listing => listing.userKey !== user);
  }

  setSearchResults(filtered);
}, [appliedFilterValues, myListings, user]);


  return (
    <div className="home-wrapper">
      <Header isLoggedIn={isLoggedIn} />
      <div className="hero-section">
        <div className="hero-background" id="heroBackground"></div>
        <div className="overlay"></div>
        <div className="hero-content">
          <h1>Find Compatible Flatmates</h1>
          <div className="search-container">
            <div className="search-type-selector">
              <label className="radio-option">
                <input type="radio" name="searchType" value="flats" checked={searchType === 'flats'} onChange={() => setSearchType('flats')} />
                <span>Flats</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="searchType" value="roommates" checked={searchType === 'roommates'} onChange={() => setSearchType('roommates')} />
                <span>Roommates</span>
              </label>
            </div>
            <div className="search-bar-wrapper">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search Places..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="search-input"
                  autoComplete="off"
                />
                {filteredPlaces.length > 0 && (
                  <div className="search-results-dropdown">
                    <ul className="dropdown-list">
                      {filteredPlaces.map((place, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(place)}
                          className={index === activeIndex ? 'active' : ''}
                        >
                          {place}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="search-buttons">
                  <button className="search-button" onClick={handleSearchClick}>Search</button>
                  <button className="compatible-search-button" onClick={toggleFilters}>Compatible Search</button>
                </div>
              </div>
            </div>
          </div>

          {filtersVisible && (
            <div className="filters-container">
              {selectedFilters.map((filter, index) => (
                <div key={index} className="filter-button-container">
                  <div className="transparent-filter-button" onClick={() => showFilterOptions(filter)}>
                    <span>{filter}{appliedFilterValues[filter] && `: ${appliedFilterValues[filter]}`}</span>
                    <span className="remove-icon" onClick={(e) => { e.stopPropagation(); removeFilter(filter); }}>×</span>
                  </div>

                  {activeFilter === filter && (
                    <ul className="filter-options-dropdown">
                      {filterOptions[filter].map((opt, i) => (
                        <li key={i} onClick={(e) => { e.stopPropagation(); applyFilter(filter, opt); }}
                            className={appliedFilterValues[filter] === opt ? 'selected' : ''}>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {searchResults.length > 0 ? (
        <div className="search-results">
          <h2>Search Results:</h2>
          <div className="results-grid">
            {searchResults.map((listing, index) => (
              <div key={index} className="listing-card">
                <h3>{listing.title}</h3>
                <p><strong>Address:</strong> {listing.propertyAddress}</p>
                <p><strong>Rent:</strong> ₹{listing.rent}</p>
                <p><strong>Description:</strong> {listing.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-results">
          <p>No matching listings found.</p>
        </div>
      )}
    </div>
  );
}

export default UpdatedHome;
