import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SearchResultsPage.css';
import Header from '../Header/Header';
import axios from 'axios';
import loadGoogleMaps from '../Utils/loadGoogleMaps';
import { AuthContext } from '../../context/AuthContext';
import config from '../../config';

// Utility function to normalize listing data
const normalizeListing = (listing) => {
  return {
    ...listing,
    _id: listing._id || '',
    title: listing.title || '',
    propertyAddress: listing.propertyAddress || '',
    rent: Number(listing.rent) || 0,
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    images: Array.isArray(listing.images) ? listing.images : [],
    propertyStructure: listing.propertyStructure || '',
    roomSize: listing.roomSize || '',
    gender: listing.gender || '',
    foodchoices: listing.foodchoices || '',
    userKey: listing.userKey || '',
    availability: listing.availability || '',
    propertyType: listing.propertyType || '',
    locality: listing.locality || '',pets: listing.pets || '',
    hobbies: Array.isArray(listing.hobbies) ? listing.hobbies : [],
    // Added postedBy field for agent listings
    postedBy: listing.postedBy || '', 
  };
};

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { results: initialResults = [] } = location.state || {};
  const [autocomplete, setAutocomplete] = useState(null);
  const [user, setUser] = useState(null);
  const { profile, loadingProfile } = useContext(AuthContext);
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
  const [favorites, setFavorites] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [searchResults, setSearchResults] = useState(initialResults.map(normalizeListing));
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
  const [filteredListings, setFilteredListings] = useState({
    all: [],
    cuisine: [],
    gender: [],
    hobbies: [],
    // Added state for property agent listings
    propertyAgent: [], pets: [],
  });

  useEffect(() => {
    let autocompleteInstance = null;
    let isMounted = true;

    const initAutocomplete = async () => {
      try {
        const google = await loadGoogleMaps('AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c');
        if (!isMounted) return;

        const input = document.getElementById('searchInput');
        if (!input) return;

        await new Promise(resolve => setTimeout(resolve, 100));

        autocompleteInstance = new google.maps.places.Autocomplete(input, {
          types: ['geocode'],
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        });

        autocompleteInstance.addListener('place_changed', () => {
          const place = autocompleteInstance.getPlace();
          if (!place) return;

          let address = place.formatted_address || place.name || 
            place.address_components.map(component => component.long_name).join(', ');
          setSearchTerm(address);
        });

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
      if (autocompleteInstance && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance);
      }
    };
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${config.apiBaseUrl}/api/favorites/${user}`);
        setFavorites(Array.isArray(response.data?.favorites) ? response.data.favorites : []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (listingId) => {
    if (!user) {
      alert("Please login to save favorites");
      return;
    }
    try {
      const isCurrentlyFavorite = favorites.includes(listingId);
      if (isCurrentlyFavorite) {
        await axios.delete(`${config.apiBaseUrl}/api/favorites/${user}/${listingId}`);
        setFavorites(prev => prev.filter(id => id !== listingId));
      } else {
        await axios.post(`${config.apiBaseUrl}/api/favorites`, { userId: user, listingId });
        setFavorites(prev => [...prev, listingId]);
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
  };

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    if (currentUserKey) setIsLoggedIn(true);
    fetchListings();
  }, [searchType]);
 
  const fetchListings = async () => {
    const endpoint = searchType === 'roommates' 
      ? `${config.apiBaseUrl}/api/wanted-listings` 
      : `${config.apiBaseUrl}/api/listings`;
    try {
      const res = await axios.get(endpoint);
      const listings = Array.isArray(res.data) ? res.data.map(normalizeListing) : [];
      setMyListings(listings);
      updateFilteredListings(listings);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setMyListings([]);
      updateFilteredListings([]);
    }
  };

  const updateFilteredListings = (listings) => {
    if (!listings) {
        setFilteredListings({
            all: [],
            cuisine: [],
            gender: [],
            hobbies: [],
            propertyAgent: [],pets:[]
        });
        return;
    }
    const petFriendlyMatches = listings.filter(listing => listing.pets);
    const cuisineMatches = profile ? listings.filter(listing => {
    const userFoodChoice = profile.habits?.foodChoice;
    if (userFoodChoice === "Veg") {
        return listing.foodchoices === "Veg";
    }
    return listing.foodchoices === userFoodChoice;
}) : [];

   
    const genderMatches = profile ? listings.filter(listing => 
  listing.gender === profile.gender
) : [];
    const femaleOnlyListings = listings.filter(listing => listing.gender === 'Female');
   
    const hobbyMatches = profile ? listings.filter(listing => 
        profile.hobbies?.some(hobby => 
            listing.hobbies?.includes("Football")
        )
    ) : [];

    // Filter for property agent listings
    const propertyAgentMatches = listings.filter(listing => listing.postedBy === 'Agent');

    setFilteredListings({
        all: listings,
        cuisine: cuisineMatches,
        gender: genderMatches,
        hobbies: hobbyMatches,
        propertyAgent: propertyAgentMatches,pets: petFriendlyMatches, 
    });
  };

  useEffect(() => {
    if (profile && myListings.length > 0) {
      updateFilteredListings(myListings);
    }
  }, [profile, myListings]);

  const handleSuggestionClick = (place) => {
    setSearchTerm(place);
    setFilteredPlaces([]);
    setActiveIndex(-1);
  };

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
      setUser("Dummy");
      return;
    }
    const results = myListings.filter(listing =>
      listing.userKey !== user &&
      (searchTerm === '' || listing.propertyAddress?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    updateFilteredListings(results);
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

  const applyFiltersToResults = (listings) => {
  let filtered = [...listings];

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
      filtered = filtered.filter(listing => {
        const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
        return sidebarFilters.amenities.every(amenity => 
          listingAmenities.includes(amenity)
        );
      });
    }

    if (user) {
      filtered = filtered.filter(listing => listing.userKey !== user);
    }

    // Sort: Listings with images first
    filtered.sort((a, b) => {
      const hasImageA = a.images && Array.isArray(a.images) && a.images.length > 0;
      const hasImageB = b.images && Array.isArray(b.images) && b.images.length > 0;

      // If both have or don't have images, maintain current order
      if (hasImageA === hasImageB) return 0;

      // If only A has image, move it before B
      if (hasImageA) return -1;

      // If only B has image, move B before A
      return 1;
    });

    return filtered;
  };

  useEffect(() => {
    let resultsToShow = [];
   
    switch (activeTab) {
      case 'All':
        resultsToShow = applyFiltersToResults(filteredListings.all);
        break;
      case 'Cuisine':
        resultsToShow = applyFiltersToResults(filteredListings.cuisine);
        break;
      case 'Gender':
        resultsToShow = applyFiltersToResults(filteredListings.gender);
        break;
      case 'Hobbies':
        resultsToShow = applyFiltersToResults(filteredListings.hobbies);
        break;
      case 'Gated Community':
        resultsToShow = applyFiltersToResults(filteredListings.all.filter(
          listing => listing.propertyStructure === 'Gated community'
        ));
        break; case 'Pets':
    resultsToShow = applyFiltersToResults(filteredListings.pets);
    break;
      // Added case for Property Agent
      case 'Property Agent':
        resultsToShow = applyFiltersToResults(filteredListings.propertyAgent);
        break;
      default:
        resultsToShow = applyFiltersToResults(filteredListings.all);
    }

    setSearchResults(resultsToShow);
  }, [activeTab, sidebarFilters, filteredListings, user]);

  const openListingDetails = (listing) => {
    localStorage.setItem('selectedListing', JSON.stringify(listing));
    const detailsUrl = `${window.location.origin}/listing-details/${listing._id}`;
    window.open(detailsUrl, '_blank');
  };

  const TabButton = ({ tabName, displayName }) => {
    const isActive = activeTab === tabName;
   
    return (
      <button
        className={`tab ${isActive ? 'active' : ''}`}
        onClick={() => setActiveTab(tabName)}
      >
        {displayName}
      </button>
    );
  };

  return (
    <div className="search-results-page">
      <Header isLoggedIn={isLoggedIn} />
     
      <div className="search-results-container">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="clear-all" onClick={() => {
              setSidebarFilters({
                budget: { min: 0, max: 50000 },
                propertyType: '',
                availability: '',
                amenities: []
              });
              setAppliedFilterValues({});
            }}>
              Clear all
            </button>
          </div>

          <div className="filter-section">
            <h4>Budget Range (₹)</h4>
            <div className="range-slider">
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
              <div className="range-values">
                <span>₹0</span>
                <span>₹{sidebarFilters.budget.max.toLocaleString()}</span>
              </div>
            </div>
          </div>
         
          <div className="filter-section">
            <h4>Property Type</h4>
            <div className="filter-options">
              {['Standalone apartment', 'Building', 'Gated community'].map(type => (
                <label key={type} className="filter-option">
                  <input
                    type="radio"
                    name="propertyType"
                    checked={sidebarFilters.propertyType === type}
                    onChange={() => handleSidebarFilterChange('propertyType', type)}
                  />
                  <span className="checkmark"></span>
                  {type}
                </label>
              ))}
            </div>
          </div>
         
          <div className="filter-section">
            <h4>Availability</h4>
            <div className="filter-options">
              {['Ready to Move', 'Available Soon'].map(option => (
                <label key={option} className="filter-option">
                  <input
                    type="radio"
                    name="availability"
                    checked={sidebarFilters.availability === option}
                    onChange={() => handleSidebarFilterChange('availability', option)}
                  />
                  <span className="checkmark"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>
         
          <div className="filter-section">
            <h4>Amenities</h4>
            <div className="filter-options">
              {['Furnished', 'Parking', 'Gym', 'Swimming Pool', 'Security'].map(amenity => (
                <label key={amenity} className="filter-option">
                  <input
                    type="checkbox"
                    checked={sidebarFilters.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <span className="checkmark checkbox"></span>
                  {amenity}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="results-main-content">
          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-bar">
              <input
                id="searchInput"
                type="text"
                placeholder="Search by location..."
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <button className="search-button" onClick={handleSearchClick}>
                <svg viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
            </div>
           
            <div className="view-toggle">
              <button 
                className={`view-option ${searchType === 'flats' ? 'active' : ''}`}
                onClick={() => setSearchType('flats')}
              >
                Flats
              </button>
              <button 
                className={`view-option ${searchType === 'roommates' ? 'active' : ''}`}
                onClick={() => setSearchType('roommates')}
              >
                Roommates
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="quick-filters">
            <div className="tabs">
              <TabButton tabName="All" displayName="All" />
             
              {/* Conditionally render Cuisine tab */}
              {profile?.habits?.foodChoice && filteredListings.cuisine.length > 0 && (
                <TabButton 
                  tabName="Cuisine" 
                  displayName={`${profile.habits.foodChoice}`} 
                />
              )}
             {/* Add Pets tab - only show if there are pet-friendly listings */}
              {filteredListings.pets.length > 0 && (
                <TabButton 
                  tabName="Pets" 
                  displayName="Pet Friendly" 
                />
              )}
              {/* Conditionally render Gender tab */}
              {profile?.gender && filteredListings.gender.length > 0 &&profile.gender === 'Female'&&(
                <TabButton 
                  tabName="Gender" 
                  displayName={`${profile.gender}`} 
                />
              )}
             
              {/* Conditionally render Hobbies tab */}
              {profile?.hobbies?.length > 0 && filteredListings.hobbies.length > 0 && (
                <TabButton 
                  tabName="Hobbies" 
                  displayName="Gamers" 
                />
              )}

              {/* Conditionally render Property Agent tab */}
              {filteredListings.propertyAgent.length > 0 && (
                <TabButton
                  tabName="Property Agent"
                  displayName="Property Agent"
                />
              )}
             
              <TabButton 
                tabName="Gated Community" 
                displayName="Gated Community"
              />
            </div>
           
            <button className="filter-toggle" onClick={toggleFilters}>
              <svg viewBox="0 0 24 24">
                <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"/>
              </svg>
              Filters
            </button>
          </div>

          {/* Results Count */}
          <div className="results-header">
            <h2>{searchResults.length} {searchResults.length === 1 ? 'Property' : 'Properties'} Found</h2>
            <div className="sort-options">
              <span>Sort by:</span>
              <select>
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {searchResults.length > 0 ? (
            <div className="results-grid">
              {searchResults.map((listing, idx) => {
                const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
                const isFurnished = listingAmenities.includes('Furnished');
               
                return (
                  <div key={idx} className="property-card">
                    <div className="property-image">
                    {listing.images && listing.images.length > 0 ? (
                      (() => {
                        // Find the first valid image index
                        const validIndex = listing.validPics
                          ? listing.validPics.findIndex(valid => valid === true)
                          : -1;

                        // If there is a valid image, use it; otherwise, use the first image (blurred)
                        const imageSrc = validIndex !== -1
                          ? `${config.apiBaseUrl}${listing.images[validIndex]}`
                          : `${config.apiBaseUrl}${listing.images[0]}`;

                        return (
                          <img
                            src={imageSrc}
                            alt="property"
                            style={{
                              filter: validIndex !== -1 ? 'none' : 'blur(5px)',
                              cursor: validIndex !== -1 ? 'pointer' : 'not-allowed'
                            }}
                          />
                        );
                      })()
                    ) : (
                      <div className="image-placeholder">No image</div>
                    )}
                    {/* Favorite button and property type remain unchanged */}
                  </div>
                   
                    <div className="property-details">
                      <h3 onClick={() => openListingDetails(listing)}>{listing.locality || 'Property'}</h3>
                      <p className="location">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {listing.propertyAddress || 'Address not specified'}
                      </p>
                     
                      <div className="property-features">
                        <span>
                          <svg viewBox="0 0 24 24">
                            <path d="M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
                          </svg>
                          {listing.roomSize || '--'} sqft
                        </span>
                        <span>
                          <svg viewBox="0 0 24 24">
                            <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                          </svg>
                          {isFurnished ? 'Furnished' : 'Unfurnished'}
                        </span>
                      </div>
                     
                      <div className="property-footer">
                        <div className="price">
                          ₹{listing.rent?.toLocaleString() || '0'}
                          <span>/month</span>
                        </div>
                        <button 
                          className="view-details"
                          onClick={() => openListingDetails(listing)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-results">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <h3>No properties found</h3>
              <p>Try adjusting your filters or search criteria</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;