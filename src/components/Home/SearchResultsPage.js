import React, { useState, useEffect,useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SearchResultsPage.css';
import Header from '../Header/Header';
import axios from 'axios';
import loadGoogleMaps from '../Utils/loadGoogleMaps'; // adjust path as needed
import { AuthContext } from '../../context/AuthContext';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { results: initialResults = [] } = location.state || {};
  const [autocomplete, setAutocomplete] = useState(null);
  const [user, setUser] = useState(null);const { profile, loadingProfile } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(['Profession', 'Food Options', 'Parking', 'Language']);
  const [filterOptions, setFilterOptions] = useState({
    'Profession': ['Student', 'Working Professional', 'Job Seeker'],
    'Food Options': ['Vegetarian', 'No Preference', 'Non-Vegetarian'],
    'Parking': ['Bike Parking', 'Car Parking', 'None'],
    'Language': ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Other']
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [searchResults, setSearchResults] = useState(initialResults);
  const [appliedFilterValues, setAppliedFilterValues] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchType, setSearchType] = useState('flats');
  const [activeTab, setActiveTab] = useState('All');
  const [sidebarFilters, setSidebarFilters] = useState({
    budget: { min: 0, max: 50000 },
    propertyType: '',
    availability: '',
    amenities: []
  });
   useEffect(() => {
    if (profile) {
      //alert(profile.gender)
    }
  }, [profile]);const normalize = str => (str || '').toLowerCase().trim();
  
  const propertyTypes = ['Standalone apartment', 'building', 'Gated community'];
  const availabilityOptions = ['Ready to Move', 'Available Soon'];
  const amenitiesOptions = ['Furnished', 'Parking', 'Gym', 'Swimming Pool', 'Security'];
  useEffect(() => {
  let autocompleteInstance = null;
  let isMounted = true;

  const initAutocomplete = async () => {
    try {
      const google = await loadGoogleMaps('AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c');
      if (!isMounted) return;

      const input = document.getElementById('searchInput');
      if (!input) return;

      // Add small delay to ensure input is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      autocompleteInstance = new google.maps.places.Autocomplete(input, {
        types: ['geocode'], // Search for all addresses
        componentRestrictions: { country: 'in' },
        fields: ['address_components', 'formatted_address', 'geometry', 'name']
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (!place) return;

        let address = '';
        if (place.formatted_address) {
          address = place.formatted_address;
        } else if (place.name) {
          address = place.name;
        } else if (place.address_components) {
          address = place.address_components
            .map(component => component.long_name)
            .join(', ');
        }

        setSearchTerm(address);
      });

      // Force the autocomplete dropdown to show on focus
      input.addEventListener('focus', () => {
        if (input.value) {
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
      });

    } catch (error) {
      console.error('Error initializing Google Maps Autocomplete:', error);
    }
  };

  initAutocomplete();

  return () => {
    isMounted = false;
    if (autocompleteInstance) {
      if (window.google && window.google.maps && window.google.maps.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    }
  };
}, []);
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

  const handleSuggestionClick = (place) => {
    setSearchTerm(place);
    setFilteredPlaces([]);
    setActiveIndex(-1);
  };

  const handleInputChange = (e) => {
  const value = e.target.value;
  setSearchTerm(value);
  // Don't interfere with Google's autocomplete
};

const handleKeyDown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission
    handleSearchClick();
  }
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

    setSearchResults(results);
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
  const handleFilterChange = (filterKey, selectedValues) => {
    setAppliedFilterValues(prevValues => ({
      ...prevValues,
      [filterKey]: selectedValues
    }));
  };

  const renderTabs = () => {
    const tabs = ['All', 'Gated Community'];
    if (profile?.gender?.toLowerCase() === 'female') {
      tabs.push('Female');
    }
    
    if (profile?.habits.foodChoice?.toLowerCase() === 'Veg') {
      tabs.push('Veg');
    }

    return (
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
    );
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

  const handleSidebarFilterChange = (filterName, value) => {
    setSidebarFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setSidebarFilters(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  useEffect(() => {
    let filtered = [...myListings];
    

    // Apply sidebar filters
    filtered = filtered.filter(listing => 
      listing.rent >= sidebarFilters.budget.min && 
      listing.rent <= sidebarFilters.budget.max
    );

    if (sidebarFilters.propertyType) {
      filtered = filtered.filter(listing => 
        listing.propertyType === sidebarFilters.propertyType
      );
    }

    if (sidebarFilters.availability) {
      filtered = filtered.filter(listing => 
        listing.availability === sidebarFilters.availability
      );
    }

    if (sidebarFilters.amenities.length > 0) {
      filtered = filtered.filter(listing => 
        sidebarFilters.amenities.every(amenity => listing.amenities?.includes(amenity))
      );
    }
    if (user) {
      filtered = filtered.filter(listing => listing.userKey !== user);
    }
    
    // Apply tab filters
    
    // Apply existing filters
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

      const tabFiltered = filtered.filter(listing => {
      if (activeTab === 'Gated Community') {
        return listing.propertyStructure === 'Gated community';
      }
      if (activeTab === 'Female' && profile?.gender === 'Female') {
        return listing.gender === 'Female'; // or adapt to your listing field
      }
      if (activeTab === 'Veg' && profile?.habits.foodChoice === 'Veg') {
        return listing.foodchoices === 'Veg'; // or adapt
      }
      return true; // All tab
    });

    setSearchResults(tabFiltered);

  }, [
  sidebarFilters,
  appliedFilterValues,
  myListings,
  user,
  activeTab,
  profile
]);

  const openListingDetails = (listing) => {
    localStorage.setItem('selectedListing', JSON.stringify(listing));
    const detailsUrl = `${window.location.origin}/listing-details/${listing._id}`;
    window.open(detailsUrl, '_blank');
  };

  return (
    <div className="search-results-page">
      <Header isLoggedIn={isLoggedIn} />
      <div className="main-content-container">
        {/* Left Sidebar Filters */}
        <div className="filters-sidebar">
          <h3>Filters</h3>
          <div className="filter-section">
            <h4>Budget (₹)</h4>
            <div className="budget-range">
              <span>0</span>
              <input 
                type="range" 
                min="0" 
                max="50000" 
                step="1000"
                value={sidebarFilters.budget.max}
                onChange={(e) => handleSidebarFilterChange('budget', { 
                  ...sidebarFilters.budget, 
                  max: parseInt(e.target.value) 
                })}
              />
              <span>50,000+</span>
            </div>
            <div className="budget-values">
              <span>₹{sidebarFilters.budget.min.toLocaleString()}</span>
              <span>₹{sidebarFilters.budget.max.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="filter-section">
            <h4>Property Type</h4>
            {propertyTypes.map(type => (
              <div key={type} className="filter-option">
                <div>
                  <input
                    type="radio"
                    id={`propertyType-${type}`}
                    name="propertyType"
                    checked={sidebarFilters.propertyType === type}
                    onChange={() => handleSidebarFilterChange('propertyType', type)}
                  />
                </div>
                <div>
                  <label htmlFor={`propertyType-${type}`}>{type}</label>
                </div>
              </div>
            ))}
          </div>
          
          <div className="filter-section">
            <h4>Availability</h4>
            {availabilityOptions.map(option => (
              <div key={option} className="filter-option">
                <div>
                  <input
                    type="radio"
                    id={`availability-${option}`}
                    name="availability"
                    checked={sidebarFilters.availability === option}
                    onChange={() => handleSidebarFilterChange('availability', option)}
                  />
                </div>
                <div>
                  <label htmlFor={`availability-${option}`}>{option}</label>
                </div>
              </div>
            ))}
          </div>
         
          <div className="filter-section">
            <h4>Amenities</h4>
            {amenitiesOptions.map(amenity => (
              <div key={amenity} className="filter-option"><div>
                <input
                  type="checkbox"
                  id={amenity}
                  checked={sidebarFilters.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                /></div><div>
                <label htmlFor={amenity}>{amenity}</label>
              </div></div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="search-results-content" style={{
    backgroundImage: 'url(./SearchResults.jpg) ', // First image as background
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}>
          <div className="search-container">
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
                        <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                    </button>
                    <button className="icon-button" onClick={toggleFilters}>
                      <svg className="compatible-icon" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
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
          <div className="tabs-container">
  {['All', 'Gated Community',
    ...(profile?.gender === 'Female' ? ['Female'] : []),
    ...(profile?.habits.foodChoice === 'Veg' ? ['Veg'] : [])
  ].map(tab => (
    <button
      key={tab}
      className={`tab-button ${activeTab === tab ? 'active' : ''}`}
      onClick={() => setActiveTab(tab)}
    >
      {tab}
    </button>
  ))}
</div>
          {searchResults.length > 0 ? (
            <div className="results-grid">
              {searchResults.map((listing, idx) => (
                <div
                  key={idx}
                  className="listing-card"
                  onClick={() => openListingDetails(listing)}
                >
                  <div className="listing-header">
                    <h3>{listing.locality || 'Property Name'}</h3>
                    <span className="property-type">{listing.userType || 'Gated Community'}</span>
                    <span className="property-type">{listing.propertyType || 'Gated Community'}</span>
                  </div>
                  <p className="listing-location">
                    {listing.parkingType || 'Parking type not specified'}, 
                   Cooking- {listing.cookingType || ' not specified'}
                  </p>
                  <div className="listing-details">
                    <span className="rent">Rent: ₹{listing.rent?.toLocaleString() || '0'}</span>
                    {listing.roomSize && <span className="area">{listing.roomSize} sqft</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-results">No matching listings found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;