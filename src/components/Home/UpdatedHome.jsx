import React, { useState, useEffect, useContext } from 'react';
import Header from '../Header/Header';
import './UpdatedHome.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import loadGoogleMaps from '../Utils/loadGoogleMaps';
import MyListings from '../Listing/MyListings';
import { AuthContext } from '../../context/AuthContext';
import config from '../../config';

function UpdatedHome() {
  // -----------------------
  // STATE
  // -----------------------
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('flats');
  const { profile, loadingProfile } = useContext(AuthContext);
  const [myListings, setMyListings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const safeProfile = profile || { gender: null };
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [locationDetails, setLocationDetails] = useState({
    city: '',
    locality: '',
    landmark: ''
  });

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
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    setIsLoggedIn(!!currentUserKey);
  }, []);
  
  // Fetch listings whenever searchType changes
  useEffect(() => {
  const fetchListings = async () => {
    let endpoint;
    switch(searchType) {
      case 'roommates':
        endpoint = `${config.apiBaseUrl}/api/wanted-listings`;
        break;
      case 'pg':
        endpoint = `${config.apiBaseUrl}/api/accommodations?type=PG`;
        break;
      case 'co-living':
        endpoint = `${config.apiBaseUrl}/api/accommodations?type=Co-Living`;
        break;
      default: // 'flats'
        endpoint = `${config.apiBaseUrl}/api/listings`;
    }

    try {
      const res = await axios.get(endpoint);
      const data = res.data;
      
      // Normalize different response structures
      let listings = [];
      if (Array.isArray(data)) {
        listings = data;
      } else if (data && Array.isArray(data.listings)) {
        listings = data.listings;
      } else if (data && Array.isArray(data.accommodations)) {
        listings = data.accommodations;
      }

      setMyListings(listings);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setMyListings([]);
    }
  };

  fetchListings();
}, [searchType]);
    
  useEffect(() => {
    if (profile) {
      console.log("Bio is:", profile.gender);
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
  // IMPROVED CITY SEARCH LOGIC
  // -----------------------
  const normalizeCityName = (city) => {
  if (!city) return '';
  
  // Common city name variations in India
  const cityVariations = {
    'mumbai': ['bombay'],
    'bangalore': ['bengaluru'],
    'delhi': ['new delhi', 'ncr'],
    'hyderabad': ['secunderabad'],
    'chennai': ['madras'],
    'kolkata': ['calcutta'],
    'pune': ['poona']
  };
  
  const lowerCity = city.toLowerCase().trim();
  
  // Check if this is a variation of a known city
  for (const [mainCity, aliases] of Object.entries(cityVariations)) {
    if (aliases.includes(lowerCity) || lowerCity.includes(mainCity)) {
      return mainCity;
    }
  }
  
  // Remove special characters and return
  return lowerCity.replace(/[^a-z]/g, '');
};

  const extractCityFromSearch = () => {
  // If we have location details from Google Places, use that city
  if (locationDetails.city) return normalizeCityName(locationDetails.city);
  
  // Common Indian cities to check for (add more as needed)
  const indianCities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 
                       'chennai', 'kolkata', 'pune', 'ahmedabad', 'noida', 'gurugram'];
  
  const searchText = searchTerm.toLowerCase();
  
  // First try to find exact city matches in the search text
  for (const city of indianCities) {
    // Check if the city name appears as a whole word
    if (new RegExp(`\\b${city}\\b`).test(searchText)) {
      return city;
    }
  }
  
  // If no exact match found, try to extract city from address components
  // Handle different address formats:
  // 1. "Hyderabad, Telangana, India"
  // 2. "Madhapur, Hyderabad, Telangana"
  // 3. "Hyderabad"
  const parts = searchText.split(',');
  
  // Check each part for a city match
  for (const part of parts) {
    const trimmedPart = part.trim();
    // Check if this part matches a known city
    for (const city of indianCities) {
      if (new RegExp(`\\b${city}\\b`).test(trimmedPart)) {
        return city;
      }
    }
    
    // Check if this part is a variation of a known city
    const normalizedPart = normalizeCityName(trimmedPart);
    if (indianCities.includes(normalizedPart)) {
      return normalizedPart;
    }
  }
  
  // Fallback: normalize the entire search term
  return normalizeCityName(searchText);
};
  // -----------------------
  // GOOGLE MAPS AUTOCOMPLETE (IMPROVED)
  // -----------------------
  useEffect(() => {
    let autocompleteInstance = null;
    let mounted = true;

    const initAutocomplete = async () => {
      try {
        const google = await loadGoogleMaps('AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c');
        if (!mounted) return;

        const input = document.getElementById('searchInput');
        if (!input) return;

        await new Promise((r) => setTimeout(r, 100));

        autocompleteInstance = new google.maps.places.Autocomplete(input, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' },
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        });

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          if (!place) return;
          
          // Extract address components
          const addressComponents = place.address_components || [];
          const locationInfo = {
            city: '',
            locality: '',
            landmark: place.name || '',
            fullAddress: place.formatted_address || ''
          };

          addressComponents.forEach(component => {
            if (component.types.includes('locality')) {
              locationInfo.locality = component.long_name;
            }
            if (component.types.includes('administrative_area_level_2')) {
              locationInfo.city = component.long_name;
            }
            if (component.types.includes('sublocality')) {
              locationInfo.locality = component.long_name;
            }
          });

          setLocationDetails(locationInfo);
          setSearchTerm(locationInfo.fullAddress);
        });

        // Android-friendly input handling
        input.addEventListener('touchstart', (e) => {
          e.stopPropagation();
        }, { passive: true });

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
  // IMPROVED SEARCH HANDLERS
  // -----------------------
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    // Clear location details when user manually types
    if (e.target.value === '') {
      setLocationDetails({
        city: '',
        locality: '',
        landmark: ''
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchClick();
    }
  };

  const handleSearchClick = () => {
  if (!user) {
    setUser('Anonymous');
  }

  const searchCity = extractCityFromSearch();
  console.log('Searching for city:', searchCity);
  
  // First filter by search term and location
  
  let filtered = myListings.filter((listing) => {
    // Skip user's own listings
    if (user && listing.userKey === user) return false;
    
    // If no search term, return all (will be filtered by other filters)
    if (!searchTerm.trim()) return true;
    
    // Normalize listing location data
    const listingCity = normalizeCityName(listing.city);
    const listingLocality = normalizeCityName(listing.locality);
    const listingLandmark = normalizeCityName(listing.landmark);
    const listingAddress = (listing.propertyAddress || '').toLowerCase();
    
    // Check if any part of the listing matches the search city
    const isCityMatch = 
      listingCity.includes(searchCity) ||
      listingLocality.includes(searchCity) ||
      listingLandmark.includes(searchCity) ||
      listingAddress.includes(searchCity) ||
      searchCity.includes(listingCity); // Also check if search term includes listing city
    
    // Also check if the search term matches any part of the listing
    const isTermMatch = 
      (listing.title || '').toLowerCase().includes(searchCity) ||
      (listing.description || '').toLowerCase().includes(searchCity);
    
    return isCityMatch || isTermMatch;
  });
  
  // Rest of your filter logic remains the same...
  filtered = filtered.filter((listing) => {
    return Object.entries(appliedFilterValues).every(([filter, value]) => {
      const key = filter.toLowerCase().replace(/\s/g, '');
      const listingValue = listing[key];
      if (!listingValue) return false;
      return Array.isArray(listingValue)
        ? listingValue.includes(value)
        : listingValue === value;
    });
  });

  console.log('Filtered results:', filtered);
  setSearchResults(filtered);
  
  navigate('/search-results', { 
    state: { 
      results: filtered,
      searchTerm,
      locationDetails: {
        ...locationDetails,
        city: searchCity
      },
      searchType, // Make sure this is included
      appliedFilters: appliedFilterValues
    } 
  });
};  

  // -----------------------
  // FILTER HANDLERS
  // -----------------------
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

  // IMPROVED SEARCH FILTERING
  useEffect(() => {
    if (!searchTerm.trim()) {
      // If no search term, just show all listings (excluding user's own) with current filters
      const filtered = myListings.filter((l) => !user || l.userKey !== user)
        .filter((listing) => {
          return Object.entries(appliedFilterValues).every(([filter, value]) => {
            const key = filter.toLowerCase().replace(/\s/g, '');
            const listingValue = listing[key];
            if (!listingValue) return false;
            return Array.isArray(listingValue)
              ? listingValue.includes(value)
              : listingValue === value;
          });
        });
      setSearchResults(filtered);
    }
  }, [appliedFilterValues, myListings, user, searchTerm, locationDetails]);

  // -----------------------
  // RENDER (unchanged from your original)
  // -----------------------
  return (
    <div className="home-wrapper">
      <Header isLoggedIn={isLoggedIn} />  
      {/* HERO SECTION */}
      <div className="hero-section">
        <div className="hero-background" id="heroBackground" />
        <div className="overlay" />
          
        <div className="hero-content">
          <h1 className="hero-title">Find Compatible Flatmates</h1>

          {/* search type radio */}
          <div className="search-container">
            <div className="search-type-selector">
            <label className={`radio-option ${isMobile ? 'mobile' : ''}`}>
              <input
                type="radio"
                name="searchType"
                value="flats"
                checked={searchType === 'flats'}
                onChange={() => setSearchType('flats')}
              />
              <span>Flats</span>
            </label>
            <label className={`radio-option ${isMobile ? 'mobile' : ''}`}>
              <input
                type="radio"
                name="searchType"
                value="roommates"
                checked={searchType === 'roommates'}
                onChange={() => setSearchType('roommates')}
              />
              <span>Roommates</span>
            </label>
            <label className={`radio-option ${isMobile ? 'mobile' : ''}`}>
              <input
                type="radio"
                name="searchType"
                value="pg" // Changed from "PG/Co-Living" to "pg"
                checked={searchType === 'pg'} // Changed from "PGAccomodation" to "pg"
                onChange={() => setSearchType('pg')} // Changed from "PGAccomodation" to "pg"
              />
              <span>PG/Co-Living</span>
            </label>
          </div>
            
            {/* SEARCH BAR */}
            <div className="search-bar-wrapper">
              <div className="search-input-container">
                <input
                  id="searchInput"
                  type="text"
                  placeholder="Search by city, locality or landmark..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="search-input"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-haspopup="true"
                  inputMode="search"
                />

                <div className="search-icons-container">
                  <button 
                    className="search-icon-button"
                    onClick={handleSearchClick}
                    aria-label="Search"
                  >
                    <svg className="search-icon" viewBox="0 0 24 24">
                      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                  </button>
                  <button 
                    className="search-icon-button"
                    onClick={toggleFilters}
                    aria-label="Filters"
                  >
                    <svg className="filter-icon" viewBox="0 0 24 24">
                      <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Compatibility filter chips */}
          {filtersVisible && (
            <div className={`filters-container ${isMobile ? 'mobile' : ''}`}>
              {selectedFilters.map((filter, idx) => (
                <div key={idx} className="filter-button-container">
                  <div
                    className={`transparent-filter-button ${isMobile ? 'mobile' : ''}`}
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
                    <ul className={`filter-options-dropdown ${isMobile ? 'mobile' : ''}`}>
                      {filterOptions[filter].map((opt, i) => (
                        <li
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyFilter(filter, opt);
                          }}
                          className={`
                            ${appliedFilterValues[filter] === opt ? 'selected' : ''}
                            ${isMobile ? 'mobile' : ''}
                          `}
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
        <div className={`search-results ${isMobile ? 'mobile' : ''}`}>
          <div className="results-header">
            <h2>{searchResults.length} {searchResults.length === 1 ? 'Property' : 'Properties'} Found</h2>
            <div className="sort-options">
              <select className="sort-select">
                <option>Sort by: Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>
          </div>

          <div className={`results-grid ${isMobile ? 'mobile' : ''}`}>
            {searchResults.map((listing, idx) => (
              <div key={idx} className={`listing-card ${isMobile ? 'mobile' : ''}`}>
                {/* Image Section */}
                <div className="card-image">
                  {listing.images && listing.images.length > 0 ? (
                    <img 
                      src={`${config.apiBaseUrl}${listing.images[0]}`} 
                      alt={listing.title}
                      onClick={() => navigate('/listing-details', { state: { listing } })}
                    />
                  ) : (
                    <div className="image-placeholder">
                      <svg viewBox="0 0 24 24">
                        <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
                      </svg>
                    </div>
                  )}
                  <div className="card-badge">
                    {listing.propertyType || 'Apartment'}
                  </div>
                  <button className="favorite-button">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>

                {/* Content Section */}
                <div className="card-content">
                  <div className="card-header">
                    <h3 onClick={() => navigate('/listing-details', { state: { listing } })}>
                      {listing.title}
                    </h3>
                    <div className="price">₹{listing.rent?.toLocaleString()}/month</div>
                  </div>

                  <div className="card-location">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span>{listing.locality || listing.propertyAddress}</span>
                  </div>

                  <div className="card-features">
                    <div className="feature">
                      <svg viewBox="0 0 24 24">
                        <path d="M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
                      </svg>
                      <span>{listing.roomSize || '--'} sqft</span>
                    </div>
                    <div className="feature">
                      <svg viewBox="0 0 24 24">
                        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                      </svg>
                      <span>{listing.furnished ? 'Furnished' : 'Unfurnished'}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button 
                      className="view-details-button"
                      onClick={() => navigate('/listing-details', { state: { listing } })}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`no-results ${isMobile ? 'mobile' : ''}`}>
          <div className="no-results-content">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h3>No properties found</h3>
            <p>Try adjusting your search filters</p>
            <button 
              className="reset-filters-button"
              onClick={() => {
                setSearchTerm('');
                setAppliedFilterValues({});
                setLocationDetails({
                  city: '',
                  locality: '',
                  landmark: ''
                });
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdatedHome;