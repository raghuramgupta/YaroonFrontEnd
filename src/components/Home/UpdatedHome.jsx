import React, { useState, useEffect,useContext  } from 'react';
import Header from '../Header/Header';
import './UpdatedHome.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import loadGoogleMaps from '../Utils/loadGoogleMaps';
import MyListings from '../Listing/MyListings';
import { AuthContext } from '../../context/AuthContext';
function UpdatedHome() {
  // -----------------------
  // STATE
  // -----------------------
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('flats'); // flats | roommates
  const { profile, loadingProfile } = useContext(AuthContext);
  const [myListings, setMyListings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const safeProfile = profile;            // or { gender: null, ... }
  console.log("Auth data is ",profile)
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([
    'Profession',
    'Food Options',
    'Parking',
    'Language',
  ]);
  const [filterOptions] = useState({
    Profession: ['Student', 'Working Professional', 'Freelancer'],
    'Food Options': ['Vegetarian', 'Eggetarian', 'Non-Vegetarian'],
    Parking: ['Two-Wheeler', 'Four-Wheeler', 'None'],
    Language: ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Other'],
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [appliedFilterValues, setAppliedFilterValues] = useState({});

  // hero background rotation
  const heroImages = [
    './Sample.jpg',
    './City.jpg',
    './Yaroon.jpg',
    './Bangalore.jpg',
    './Delhi.jpg',
  ];

  const navigate = useNavigate();

  // -----------------------
  // INITIALISATION
  // -----------------------
  useEffect(() => {
    
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    setIsLoggedIn(!!currentUserKey);
  }, []);
  
  // Fetch listings whenever searchType changes
  useEffect(() => {
    
    const fetchListings = async () => {
      const endpoint =
        searchType === 'roommates'
          ? 'http://localhost:5000/api/wanted-listings'
          : 'http://localhost:5000/api/listings';
      try {
        const res = await axios.get(endpoint);
        setMyListings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching listings:', err);
      }
    };

    fetchListings();
  }, [searchType]);
    useEffect(() => {
      if (profile) {
        console.log("Bio is:", profile.gender);     // will run once data is in
      }
    }, [profile]);

  // Rotate hero background images
  useEffect(() => {
    const el = document.getElementById('heroBackground');
    if (!el) return;
    let idx = 0;
    const changeBg = () => {
      el.style.backgroundImage = `url(${heroImages[idx]})`;
      idx = (idx + 1) % heroImages.length;
    };
    changeBg();
    const int = setInterval(changeBg, 5000);
    return () => clearInterval(int);
  }, []);

  // -----------------------
  // GOOGLE MAPS AUTOCOMPLETE
  // -----------------------
  useEffect(() => {
    let autocompleteInstance = null;
    let mounted = true;

    const initAutocomplete = async () => {
      try {
        // ⚠️  Replace with your own API key or use env variable
        const google = await loadGoogleMaps('AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c');
        if (!mounted) return;

        const input = document.getElementById('searchInput');
        if (!input) return;

        await new Promise((r) => setTimeout(r, 100)); // allow input to mount

        autocompleteInstance = new google.maps.places.Autocomplete(input, {
          types: ['geocode'],
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        });

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          if (!place) return;
          let address = '';
          if (place.formatted_address) address = place.formatted_address;
          else if (place.name) address = place.name;
          else if (place.address_components) {
            address = place.address_components
              .map((c) => c.long_name)
              .join(', ');
          }
          setSearchTerm(address);
        });

        // force drop‑down on focus when value present
        input.addEventListener('focus', () => {
          if (input.value) {
            const ev = new Event('input', { bubbles: true });
            input.dispatchEvent(ev);
          }
        });
      } catch (err) {
        console.error('Google Maps Autocomplete error:', err);
      }
    };

    initAutocomplete();

    return () => {
      mounted = false;
      if (
        autocompleteInstance &&
        window.google &&
        window.google.maps &&
        window.google.maps.event
      ) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, []);

  // -----------------------
  // HANDLERS
  // -----------------------
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchClick();
    }
  };

  const handleSearchClick = () => {
    if (!user) {
      // You could redirect to login instead of this dummy placeholder
      setUser('Anonymous');
    }

    const results = myListings.filter((listing) => {
      if (user && listing.userKey === user) return false;
      if (!searchTerm) return true;
      
      const term = searchTerm.toLowerCase();
      return (
        listing.propertyAddress?.toLowerCase().includes(term) ||
        listing.title?.toLowerCase().includes(term) ||
        listing.description?.toLowerCase().includes(term)
      );
    });

    // Navigate to dedicated results page – keeps behaviour identical to before
    navigate('/search-results', { state: { results } });
  };

  // Toggle and manage custom compatibility filters
  const toggleFilters = () => {
    setFiltersVisible((prev) => !prev);
    setActiveFilter(null);
  };

  const showFilterOptions = (filter) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  };

  const applyFilter = (filterCategory, option) => {
    setAppliedFilterValues((prev) => ({
      ...prev,
      [filterCategory]: option,
    }));
    setActiveFilter(null);
  };

  const removeFilter = (filterToRemove) => {
    setSelectedFilters((prev) => prev.filter((f) => f !== filterToRemove));
    setAppliedFilterValues((prev) => {
      const next = { ...prev };
      delete next[filterToRemove];
      return next;
    });
    setActiveFilter(null);
  };

  // Re‑filter locally when appliedFilterValues change or listings loaded
  useEffect(() => {
    let filtered = [...myListings];

    // search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.propertyAddress?.toLowerCase().includes(term) ||
          l.title?.toLowerCase().includes(term) ||
          l.description?.toLowerCase().includes(term)
      );
    }

    // compatibility chips
    Object.entries(appliedFilterValues).forEach(([filter, value]) => {
      const key = filter.toLowerCase().replace(/\s/g, ''); // e.g. "Food Options" -> "foodoptions"
      filtered = filtered.filter((listing) => {
        const listingValue = listing[key];
        if (!listingValue) return false;
        return Array.isArray(listingValue)
          ? listingValue.includes(value)
          : listingValue === value;
      });
    });

    if (user) filtered = filtered.filter((l) => l.userKey !== user);

    setSearchResults(filtered);
  }, [appliedFilterValues, myListings, user, searchTerm]);

  // -----------------------
  // RENDER
  // -----------------------
  return (
    <div className="home-wrapper">
      <Header isLoggedIn={isLoggedIn} />

      {/* HERO SECTION */}
      <div className="hero-section">
        <div className="hero-background" id="heroBackground" />
        <div className="overlay" />

        <div className="hero-content">
          <h1>Find Compatible Flatmates</h1>

          {/* search type radio */}
          <div className="search-container">
            <div className="search-type-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  name="searchType"
                  value="flats"
                  checked={searchType === 'flats'}
                  onChange={() => setSearchType('flats')}
                />
                <span>Flats</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="searchType"
                  value="roommates"
                  checked={searchType === 'roommates'}
                  onChange={() => setSearchType('roommates')}
                />
                <span>Roommates</span>
              </label>
            </div>

            {/* SEARCH BAR */}
            <div className="search-bar-wrapper">
              <div className="search-bar">
                <div className="search-input-container">
                  <input
                    id="searchInput"
                    type="text"
                    placeholder="Search Places..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-haspopup="true"
                  />

                  <div className="search-icons">
                    <button className="icon-button" onClick={handleSearchClick}>
                      <svg className="search-icon" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>
                    </button>
                    <button className="icon-button" onClick={toggleFilters}>
                      <svg className="compatible-icon" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compatibility filter chips */}
          {filtersVisible && (
            <div className="filters-container">
              {selectedFilters.map((filter, idx) => (
                <div key={idx} className="filter-button-container">
                  <div
                    className="transparent-filter-button"
                    onClick={() => showFilterOptions(filter)}
                  >
                    <span>
                      {filter}
                      {appliedFilterValues[filter] && `: ${appliedFilterValues[filter]}`}
                    </span>
                    <span
                      className="remove-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFilter(filter);
                      }}
                    >
                      ×
                    </span>
                  </div>

                  {activeFilter === filter && (
                    <ul className="filter-options-dropdown">
                      {filterOptions[filter].map((opt, i) => (
                        <li
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFilter(filter, opt);
                          }}
                          className={
                            appliedFilterValues[filter] === opt ? 'selected' : ''
                          }
                        >
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

      {/* SEARCH RESULTS / NO RESULTS */}
      {searchResults.length > 0 ? (
        <div className="search-results">
          <h2>Search Results:</h2>
          <div className="results-grid">
            {searchResults.map((listing, idx) => (
              <div key={idx} className="listing-card">
                <h3>{listing.title}</h3>
                <p>
                  <strong>Address:</strong> {listing.propertyAddress}
                </p>
                <p>
                  <strong>Rent:</strong> ₹{listing.rent}
                </p>
                <p>
                  <strong>Description:</strong> {listing.description}
                </p>
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
