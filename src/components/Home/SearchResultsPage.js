import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SearchResultsPage.css';
import Header from '../Header/Header';
import axios from 'axios';
import loadGoogleMaps from '../Utils/loadGoogleMaps';
import { AuthContext } from '../../context/AuthContext';
import config from '../../config';
// Utility function to normalize listing data
const normalizeListing = (listing, listingType) => {
  let languages = [];
  if (Array.isArray(listing.languages)) {
    languages = listing.languages;
  } else if (typeof listing.languages === 'string') {
    languages = listing.languages.split(',').map(lang => lang.trim());
  }
  
  let propertyType = '';
  if (listing.propertyType) {
    propertyType = listing.propertyType;
  } else if (listing.propertyStructure) {
    propertyType = listing.propertyStructure;
  } else if (listing.listingType) {
    propertyType = listing.listingType;
  }

  // Common fields for all listing types
  const baseFields = {
    _id: listing._id || listing.id || '',
    title: listing.title || '',
    propertyAddress: listing.propertyAddress || listing.address?.street || listing.preferredLocation || '',
    rent: Number(listing.rent) || Number(listing.budget) || 0,
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    images: Array.isArray(listing.images) ? listing.images : [],
    propertyType: propertyType,
    locality: listing.locality || listing.address?.locality || '',
    city: listing.city || '', // Added city field which was missing
    postedBy: listing.postedBy || listing.owner || listing.user || '',
    languages: languages,
    userKey: listing.userKey || listing.user || '',
    listingType: listingType || 'flat',
    validPics: listing.validPics || []
  };
  
  // Type-specific fields
  if (listingType === 'roommate') {
    return {
      ...baseFields,
      gender: listing.gender || '',
      profession: listing.profession || '',
      hobbies: Array.isArray(listing.hobbies) ? listing.hobbies : [],
      lookingFor: listing.lookingFor || '',
      age: listing.age || '',
      about: listing.about || ''
    };
  } else if (listingType === 'pg') {
    return {
      ...baseFields,
      foodIncluded: listing.foodIncluded || false,
      sharingType: listing.sharingType || '',
      pgType: listing.pgType || '',
      rules: listing.rules || '',
      meals: listing.meals || ''
    };
  } else {
    // Default to flat listing
    return {
      ...baseFields,
      roomSize: listing.roomSize || '',
      gender: listing.gender || '',
      foodchoices: listing.foodchoices || '',
      availability: listing.availableFrom || '',
      pets: listing.pets || '',
      hobbies: Array.isArray(listing.hobbies) ? listing.hobbies : []
    };
  }
};

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    results: initialResults = [], 
    searchTerm: initialSearchTerm = '',
    locationDetails: initialLocationDetails = {},
    searchType: initialSearchType = 'flats',
    appliedFilters: initialAppliedFilters = {}
  } = location.state || {};

  console.log('Initial results received:', initialResults);

  const [autocompleteInstance, setAutocompleteInstance] = useState(null);
  const [user, setUser] = useState(null);
  const { profile, loadingProfile } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(['Profession', 'Food Options', 'Parking', 'Language']);
  const [filterOptions, setFilterOptions] = useState({
    'Profession': ['Student', 'Working Professional', 'Job Seeker'],
    'Food Options': ['Vegetarian', 'No Preference', 'Non-Vegetarian'],
    'Parking': ['Bike Parking', 'Car Parking', 'None'],
    'Language': ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Other']
  });const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [appliedFilterValues, setAppliedFilterValues] = useState(initialAppliedFilters);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchType, setSearchType] = useState(initialSearchType);
  const [activeTab, setActiveTab] = useState('All');
  const [locationDetails, setLocationDetails] = useState(initialLocationDetails);
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
    coding: [],
    language: [],
    propertyAgent: [], 
    pets: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Debug effect to track searchResults changes
  useEffect(() => {
    console.log('searchResults updated:', searchResults);
  }, [searchResults]);

  const normalizeCityName = (city) => {
    if (!city) return '';
    
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
    
    for (const [mainCity, aliases] of Object.entries(cityVariations)) {
      if (aliases.includes(lowerCity) || lowerCity.includes(mainCity)) {
        return mainCity;
      }
    }
    
    return lowerCity.replace(/[^a-z]/g, '');
  };

  const extractCityFromSearch = (searchText) => {
    const indianCities = ['mumbai', 'delhi', 'bangalore', 'hyderabad', 
                         'chennai', 'kolkata', 'pune', 'ahmedabad', 'noida', 'gurugram'];
    
    const lowerSearch = searchText.toLowerCase();
    
    const parts = lowerSearch.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      for (const city of indianCities) {
        if (new RegExp(`\\b${city}\\b`).test(trimmed)) {
          return city;
        }
      }
      const normalized = normalizeCityName(trimmed);
      if (indianCities.includes(normalized)) {
        return normalized;
      }
    }
    
    return normalizeCityName(lowerSearch);
  };

  useEffect(() => {
    let isMounted = true;
    let instance = null;

    const initAutocomplete = async () => {
      try {
        const google = await loadGoogleMaps('AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c');
        if (!isMounted) return;

        const input = document.getElementById('searchInput');
        if (!input) return;

        await new Promise(resolve => setTimeout(resolve, 100));

        instance = new google.maps.places.Autocomplete(input, {
          types: ['geocode'],
          componentRestrictions: { country: 'in' },
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        });

        instance.addListener('place_changed', () => {
          const place = instance.getPlace();
          if (!place) return;

          const locationInfo = {
            city: '',
            locality: '',
            landmark: place.name || '',
            fullAddress: place.formatted_address || ''
          };

          place.address_components?.forEach(component => {
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

        setAutocompleteInstance(instance);

      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
      }
    };

    initAutocomplete();

    return () => {
      isMounted = false;
      if (instance && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(instance);
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
    
    // Initialize searchResults after normalization
    if (initialResults.length > 0) {
      const normalizedResults = initialResults.map(listing => 
        normalizeListing(listing, initialSearchType === 'roommates' ? 'roommate' : 
        initialSearchType === 'pg' ? 'pg' : 'flat')
      );
      setSearchResults(normalizedResults);
      updateFilteredListings(normalizedResults);
    } else {
      fetchListings();
    }
  }, [searchType, initialResults.length, initialSearchType]);

  const fetchListings = async () => {
    setIsLoading(true);
    let endpoint;
    let listingType;
    
    switch(searchType) {
      case 'roommates':
        endpoint = `${config.apiBaseUrl}/api/wanted-listings`;
        listingType = 'roommate';
        break;
      case 'pg':
        endpoint = `${config.apiBaseUrl}/api/accommodations`;
        listingType = 'pg';
        break;
      case 'co-living':
        endpoint = `${config.apiBaseUrl}/api/accommodations`;
        listingType = 'pg';
        break;
      default: // 'flats'
        endpoint = `${config.apiBaseUrl}/api/listings`;
        listingType = 'flat';
    }
    
    try {
      const res = await axios.get(endpoint);
      const listings = Array.isArray(res.data) ? 
        res.data.map(listing => normalizeListing(listing, listingType)) : [];
      setMyListings(listings);
      updateFilteredListings(listings);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setMyListings([]);
      updateFilteredListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilteredListings = (listings) => {
    console.log('Updating filtered listings with:', listings);
    
    if (!listings || listings.length === 0) {
      console.log('No listings to filter');
      setFilteredListings({
        all: [],
        cuisine: [],
        gender: [],
        hobbies: [],
        coding: [],
        language: [],
        propertyAgent: [], 
        pets: [],
      });
      return;
    }

    // Apply initial filters first
    let filtered = [...listings];
    if (Object.keys(appliedFilterValues).length > 0) {
      filtered = filtered.filter((listing) => {
        return Object.entries(appliedFilterValues).every(([filter, value]) => {
          const key = filter.toLowerCase().replace(/\s/g, '');
          const listingValue = listing[key];
          if (!listingValue) {
            console.log(`Filter ${key} not found in listing`, listing);
            return false;
          }
          const matches = Array.isArray(listingValue)
            ? listingValue.includes(value)
            : listingValue === value;
          if (!matches) {
            console.log(`Listing failed filter ${key}=${value}`, listing);
          }
          return matches;
        });
      });
    }

    // Apply search term filter if it exists
    if (searchTerm.trim()) {
      const searchCity = extractCityFromSearch(searchTerm);
      console.log('Filtering by city:', searchCity);
      filtered = filtered.filter(listing => {
        const listingCity = normalizeCityName(listing.city);
        const listingLocality = normalizeCityName(listing.locality);
        const listingAddress = (listing.propertyAddress || '').toLowerCase();
        
        const matches = (
          listingCity.includes(searchCity) ||
          listingLocality.includes(searchCity) ||
          listingAddress.includes(searchCity) ||
          searchCity.includes(listingCity)
        );
        
        if (!matches) {
          console.log('Location filter excluded listing:', {
            searchCity,
            listingCity,
            listingLocality,
            listingAddress
          });
        }
        return matches;
      });
    }

    console.log('Listings after filters:', filtered);

    // Type-specific filtering
    const petFriendlyMatches = filtered.filter(listing => listing.pets);
    const cuisineMatches = profile ? filtered.filter(listing => {
      const userFoodChoice = profile.habits?.foodChoice;
      if (!userFoodChoice) return false;
      if (userFoodChoice === "Veg") {
          return listing.foodchoices === "Veg" || listing.foodIncluded === "Vegetarian";
      }
      return listing.foodchoices === userFoodChoice || listing.foodIncluded === userFoodChoice;
    }) : [];
   
    const genderMatches = profile ? filtered.filter(listing => 
      listing.gender === profile.gender
    ) : [];
    
    const hobbyMatches = profile ? filtered.filter(listing => 
      profile.hobbies?.some(hobby => 
          listing.hobbies?.includes(hobby))
    ) : [];

    const codingMatches = profile ? filtered.filter(listing => 
      listing.hobbies?.includes("Coding") || listing.profession?.includes("Developer")
    ) : [];
    
    const languageMatches = profile?.languages ? filtered.filter(listing => {
      const userLanguages = typeof profile.languages === 'string' 
        ? profile.languages.split(',').map(lang => lang.trim().toLowerCase())
        : Array.isArray(profile.languages)
          ? profile.languages.map(lang => 
              typeof lang === 'string' ? lang.trim().toLowerCase() : String(lang).toLowerCase()
            )
          : [];

      const listingLangs = Array.isArray(listing.languages) 
        ? listing.languages.map(lang => 
            typeof lang === 'string' ? lang.trim().toLowerCase() : String(lang).toLowerCase()
          )
        : typeof listing.languages === 'string' 
          ? listing.languages.split(',').map(lang => lang.trim().toLowerCase())
          : [];
          
      return userLanguages.length > 0 && listingLangs.some(lang => 
        userLanguages.some(userLang => 
          userLang.toLowerCase() === lang.toLowerCase() || 
          userLang.includes(lang) || 
          lang.includes(userLang)
        )
      );
    }) : [];
    
    const propertyAgentMatches = filtered.filter(listing => listing.postedBy === 'Agent');

    const updatedFilteredListings = {
      all: filtered,
      cuisine: cuisineMatches,
      gender: genderMatches,
      hobbies: hobbyMatches,
      coding: codingMatches,
      language: languageMatches,
      propertyAgent: propertyAgentMatches,
      pets: petFriendlyMatches, 
    };

    console.log('Updated filtered listings:', updatedFilteredListings);
    setFilteredListings(updatedFilteredListings);
  };
  
  useEffect(() => {
    if (profile && (myListings.length > 0 || initialResults.length > 0)) {
      const listingsToFilter = initialResults.length > 0 ? 
        initialResults.map(listing => 
          normalizeListing(listing, initialSearchType === 'roommates' ? 'roommate' : 
          initialSearchType === 'pg' ? 'pg' : 'flat')
        ) : 
        myListings;
      updateFilteredListings(listingsToFilter);
    }
  }, [profile, myListings, initialResults]);

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

    const searchCity = extractCityFromSearch(searchTerm);
    console.log('Searching for city:', searchCity);

    const listingsToSearch = initialResults.length > 0 ? initialResults : myListings;
    if (!searchTerm.trim()) {
      updateFilteredListings(listingsToSearch);
      return;
    }

    const results = listingsToSearch.filter(listing => {
      if (listing.userKey === user) return false;
      
      const listingCity = normalizeCityName(listing.city);
      const listingLocality = normalizeCityName(listing.locality);
      const listingLandmark = normalizeCityName(listing.landmark);
      const listingAddress = (listing.propertyAddress || '').toLowerCase();
      const listingFullLocation = `${listingCity} ${listingLocality} ${listingAddress}`.toLowerCase();

      console.log('Comparing:', {
        searchCity,
        listingCity,
        listingLocality,
        listingAddress,
        listingFullLocation
      });

      return (
        listingCity.includes(searchCity) ||
        listingLocality.includes(searchCity) ||
        listingLandmark.includes(searchCity) ||
        listingAddress.includes(searchCity) ||
        searchCity.includes(listingCity)
      );
    });
    console.log('Filtered results:', results);
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
    updateFilteredListings(initialResults.length > 0 ? initialResults : myListings);
  };

  const applyFilter = (filterCategory, option) => {
    const newFilters = {
      ...appliedFilterValues,
      [filterCategory]: option
    };
    setAppliedFilterValues(newFilters);
    setActiveFilter(null);
    
    const listingsToFilter = initialResults.length > 0 ? initialResults : myListings;
    updateFilteredListings(listingsToFilter);
  };

  const handleSidebarFilterChange = (filterName, value) => {
    setSidebarFilters(prev => {
      if ((filterName === 'propertyType' || filterName === 'availability') && 
          prev[filterName] === value) {
        return { ...prev, [filterName]: '' };
      }
      return { ...prev, [filterName]: value };
    });
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
    console.log('Applying sidebar filters to:', listings);
    
    if (!listings || listings.length === 0) return [];

    let filtered = [...listings];

    // Apply budget filter
    filtered = filtered.filter(listing => {
      const rent = listing.rent || 0;
      const pass = rent >= sidebarFilters.budget.min && rent <= sidebarFilters.budget.max;
      if (!pass) console.log('Budget filter excluded listing:', listing.rent);
      return pass;
    });

    // Apply property type filter
    if (sidebarFilters.propertyType) {
      filtered = filtered.filter(listing => {
        const pass = listing.propertyType === sidebarFilters.propertyType;
        if (!pass) console.log('Property type filter excluded listing:', listing.propertyType);
        return pass;
      });
    }

    // Apply availability filter
    if (sidebarFilters.availability) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(listing => {
        if (!listing.availability) {
          console.log('Availability filter excluded listing (no availability date)');
          return false;
        }
        
        try {
          const availableDate = new Date(listing.availability);
          availableDate.setHours(0, 0, 0, 0);
          
          if (sidebarFilters.availability === 'Ready to Move') {
            return availableDate <= today;
          } else if (sidebarFilters.availability === 'Available Soon') {
            return availableDate > today;
          }
          return true;
        } catch (e) {
          console.log('Invalid availability date:', listing.availability);
          return false;
        }
      });
    }

    // Apply amenities filter
    if (sidebarFilters.amenities.length > 0) {
      filtered = filtered.filter(listing => {
        const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
        const pass = sidebarFilters.amenities.every(amenity => 
          listingAmenities.includes(amenity)
        );
        if (!pass) console.log('Amenities filter excluded listing:', listingAmenities);
        return pass;
      });
    }

    // Exclude user's own listings
    if (user) {
      filtered = filtered.filter(listing => {
        const pass = listing.userKey !== user;
        if (!pass) console.log('User filter excluded own listing');
        return pass;
      });
    }

    // Sort listings with valid images first
    filtered.sort((a, b) => {
      const aHasValidPic = Array.isArray(a.validPics) && a.validPics.some(valid => valid === true);
      const bHasValidPic = Array.isArray(b.validPics) && b.validPics.some(valid => valid === true);

      if (aHasValidPic && bHasValidPic) return 0;
      if (aHasValidPic) return -1;
      if (bHasValidPic) return 1;

      const aHasImages = a.images?.length > 0;
      const bHasImages = b.images?.length > 0;
      
      if (aHasImages && !bHasImages) return -1;
      if (!aHasImages && bHasImages) return 1;
      
      return 0;
    });

    console.log('After sidebar filters:', filtered);
    return filtered;
  };

  useEffect(() => {
    let resultsToShow = [];
    
    console.log('Applying filteclassName="quick-filters"rs to:', activeTab, filteredListings[activeTab]);
    
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
      case 'Coding':
        resultsToShow = applyFiltersToResults(filteredListings.coding);
        break;
      case 'Language':
        resultsToShow = applyFiltersToResults(filteredListings.language);
        break;
      case 'Gated Community':
        resultsToShow = applyFiltersToResults(filteredListings.all.filter(
          listing => listing.propertyStructure === 'Gated community'
        ));
        break;
      case 'Pets':
        resultsToShow = applyFiltersToResults(filteredListings.pets);
        break;
      case 'Property Agent':
        resultsToShow = applyFiltersToResults(filteredListings.propertyAgent);
        break;
      default:
        resultsToShow = applyFiltersToResults(filteredListings.all);
    }
    
    console.log('Final results to show:', resultsToShow);
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
              updateFilteredListings(initialResults.length > 0 ? initialResults : myListings);
            }}>
              Clear all
            </button>
          </div>

          {Object.keys(appliedFilterValues).length > 0 && (
            <div className="filter-section">
              <h4>Applied Filters</h4>
              <div className="applied-filters">
                {Object.entries(appliedFilterValues).map(([filter, value]) => (
                  <div key={filter} className="applied-filter">
                    <span>{filter}: {value}</span>
                    <button 
                      className="remove-filter"
                      onClick={() => removeFilter(filter)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {['Standalone apartment', 'Standalone building', 'Gated community'].map(type => (
                <label key={type} className="filter-option">
                  <input
                    type="radio"
                    name="propertyType"
                    checked={sidebarFilters.propertyType === type}
                    onChange={() => {
                      if (sidebarFilters.propertyType === type) {
                        handleSidebarFilterChange('propertyType', '');
                      } else {
                        handleSidebarFilterChange('propertyType', type);
                      }
                    }}
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
              {['Ready to Move', 'Available Soon'].map(option => {
                const count = myListings.filter(listing => {
                  if (!listing.availability) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  try {
                    const availableDate = new Date(listing.availability);
                    availableDate.setHours(0, 0, 0, 0);
                    if (option === 'Ready to Move') {
                      return availableDate <= today;
                    } else {
                      return availableDate > today;
                    }
                  } catch (e) {
                    return false;
                  }
                }).length;

                return (
                  <label key={option} className="filter-option">
                    <input
                      type="radio"
                      name="availability"
                      checked={sidebarFilters.availability === option}
                      onChange={() => {
                        if (sidebarFilters.availability === option) {
                          handleSidebarFilterChange('availability', '');
                        } else {
                          handleSidebarFilterChange('availability', option);
                        }
                      }}
                    />
                    <span className="checkmark"></span>
                    {option} 
                  </label>
                );
              })}
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
                onClick={() => {
                  setSearchType('flats');
                  fetchListings();
                }}
              >
                Flats
              </button>
              <button 
                className={`view-option ${searchType === 'roommates' ? 'active' : ''}`}
                onClick={() => {
                  setSearchType('roommates');
                  fetchListings();
                }}
              >
                Roommates
              </button>
              <button 
                className={`view-option ${searchType === 'pg' ? 'active' : ''}`}
                onClick={() => {
                  setSearchType('pg');
                  fetchListings();
                }}
              >
                PG/Co-Living
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="quick-filters">
  {/* Tabs Section */}
  <div className="tabs-container">
    <div 
      className={`tab-item ${activeTab === 'All' ? 'active' : ''}`} 
      onClick={() => setActiveTab('All')}
    >
      All
    </div>

    {appliedFilterValues['Food Options'] ? (
      <div 
        className={`tab-item ${activeTab === 'Cuisine' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Cuisine')}
      >
        {appliedFilterValues['Food Options']}
      </div>
    ) : profile?.habits?.foodChoice && filteredListings.cuisine.length > 0 && (
      <div 
        className={`tab-item ${activeTab === 'Cuisine' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Cuisine')}
      >
        {profile.habits.foodChoice}
      </div>
    )}

    {filteredListings.pets.length > 0 && (
      <div 
        className={`tab-item ${activeTab === 'Pets' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Pets')}
      >
        Pet Friendly
      </div>
    )}

    {appliedFilterValues.Profession ? (
      <div 
        className={`tab-item ${activeTab === 'Profession' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Profession')}
      >
        {appliedFilterValues.Profession}
      </div>
    ) : profile?.gender && filteredListings.gender.length > 0 && profile.gender === 'Female' && (
      <div 
        className={`tab-item ${activeTab === 'Gender' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Gender')}
      >
        {profile.gender}
      </div>
    )}

    {profile?.hobbies?.length > 0 && filteredListings.hobbies.length > 0 && (
      <div 
        className={`tab-item ${activeTab === 'Hobbies' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Hobbies')}
      >
        Gamers
      </div>
    )}

    {filteredListings.coding.length > 0 && (
      <div 
        className={`tab-item ${activeTab === 'Coding' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Coding')}
      >
        Coders
      </div>
    )}

    {appliedFilterValues.Language ? (
      <div 
        className={`tab-item ${activeTab === 'Language' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Language')}
      >
        {appliedFilterValues.Language}
      </div>
    ) : profile?.languages?.length > 0 && filteredListings.language.length > 0 && (
      <div 
        className={`tab-item ${activeTab === 'Language' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Language')}
      >
        Language Match
      </div>
    )}

    {filteredListings.propertyAgent.length > 0 && (
      <div 
        className={`tab-item ${activeTab === 'Property Agent' ? 'active' : ''}`} 
        onClick={() => setActiveTab('Property Agent')}
      >
        Property Agent
      </div>
    )}

    <div 
      className={`tab-item ${activeTab === 'Gated Community' ? 'active' : ''}`} 
      onClick={() => setActiveTab('Gated Community')}
    >
      Gated Community
    </div>
  </div>

  {/* Mobile Filter Button */}
  <button className="filter-toggle" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>
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
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading {searchType} listings...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="results-grid">
              {searchResults.map((listing, idx) => {
                const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
                const isFurnished = listingAmenities.includes('Furnished');
                const isRoommate = listing.listingType === 'roommate';
                const isPG = listing.listingType === 'pg';
               
                return (
                  <div key={idx} className="property-card">
                    <div className="property-image">
                      {listing.images && listing.images.length > 0 ? (
                        (() => {
                          const validIndex = listing.validPics
                            ? listing.validPics.findIndex(valid => valid === true)
                            : -1;

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
                              onClick={() => validIndex !== -1 && openListingDetails(listing)}
                            />
                          );
                        })()
                      ) : (
                        <div className="image-placeholder">
                          {isRoommate ? 'Roommate' : isPG ? 'PG' : 'Property'}
                        </div>
                      )}
                      <button 
                        className={`favorite-button ${favorites.includes(listing._id) ? 'active' : ''}`}
                        onClick={() => toggleFavorite(listing._id)}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                      <div className="property-badge">
                        {isRoommate ? 'Roommate' : 
                         isPG ? 'PG/Co-Living' : 
                         listing.propertyType || 'Property'}
                      </div>
                    </div>
                   
                    <div className="property-details">
                      <h3 onClick={() => openListingDetails(listing)}>
                        {isRoommate ? 
                          `${listing.title || 'Roommate'} (${listing.age || '--'})` : 
                          listing.locality || 'Property'}
                      </h3>
                      <p className="location">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {listing.propertyAddress || 'Address not specified'}
                      </p>
                     
                      <div className="property-features">
                        {isRoommate ? (
                          <>
                            <span>
                              <svg viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                              </svg>
                              {listing.profession || '--'}
                            </span>
                            <span>
                              <svg viewBox="0 0 24 24">
                                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z"/>
                              </svg>
                              {listing.hobbies?.join(', ') || '--'}
                            </span>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
              <h3>No {searchType} found</h3>
              <p>Try adjusting your filters or search criteria</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchResultsPage;