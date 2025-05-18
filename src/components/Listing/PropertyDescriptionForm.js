import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PropertyDescriptionForm.css';
import Header from '../Header/Header';
import {
  FaHome,
  FaBed,
  FaBath,
  FaParking,
  FaRulerCombined,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaLock,
  FaTv,
  FaBlender,
  FaUtensils,
  FaMapMarkerAlt,
  FaCamera,
  FaVideo,
  FaCar,
  FaMotorcycle
} from 'react-icons/fa';
import { GiWashingMachine } from 'react-icons/gi';
import axios from 'axios';

// ----- Helpers ----- //
const todayDate = new Date().toISOString().split('T')[0];
const todayDateTime = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

const metroCities = [
  'Hyderabad',
  'Bengaluru',
  'Chennai',
  'Mumbai',
  'Pune',
  'Gurugram',
  'Noida',
  'New Delhi'
];

// ----- Component ----- //
const PropertyDescriptionForm = () => {
  /* -------------------------------------------------------------------------- */
  /*                                    State                                   */
  /* -------------------------------------------------------------------------- */
  const [formData, setFormData] = useState({
    userKey: '',
    // Address fields
    propertyAddress: '',
    locality: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    // Property details
    propertyStructure: '',
    roomType: '',
    washroomType: '',
    parkingType: '',
    roomSize: '',
    apartmentSize: '',
    rent: '',
    availableFrom: todayDate,
    openDate: '',
    // Deposit & amenities
    securityDepositOption: '',
    customSecurityDeposit: '',
    amenities: {
      TV: false,
      Fridge: false,
      WashingMachine: false,
      kitchen: false
    },
    cookingType: '',
    // Media
    images: [],
    videos: [],
    // Map
    mapLocation: ''
  });

  const suggestedMessages = [
    'Can you arrange a viewing?',
    'Is the rent negotiable?',
    'Is the property still available?',
    'Can I move in with a friend?',
    "What's included in the rent?",
    'How far is the nearest metro/bus stop?',
    'Are pets allowed?',
    'Is there any security deposit?',
    'Can I schedule a call to discuss?',
    'Can you share more photos or a video tour?'
  ];

  const { listingId } = useParams();
  const navigate = useNavigate();

  // Refs & map
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // User profile & auth
  const [profile, setProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                              Address autocomplete                           */
  /* -------------------------------------------------------------------------- */
  const renderMap = (latLng) => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: latLng,
      zoom: 15
    });
    setMap(mapInstance);

    const mapMarker = new window.google.maps.Marker({
      position: latLng,
      map: mapInstance,
      draggable: true
    });

    setMarker(mapMarker);

    mapMarker.addListener('dragend', () => {
      updateAddressFromCoords(mapMarker.getPosition());
    });
  };
  const parts = {
      locality: '',
      city: '',
      state: '',
      country: '',
      pinCode: ''
    };
  const extractAddressParts = (components) => {
    const parts = {
      locality: '',
      city: '',
      state: '',
      country: '',
      pinCode: ''
    };

    components.forEach((c) => {
      const types = c.types;

      if (types.includes('sublocality_level_1')) parts.locality = c.long_name;
      if (types.includes('locality'))             parts.city     = c.long_name;
      if (types.includes('administrative_area_level_1')) parts.state   = c.long_name;
      if (types.includes('country'))              parts.country  = c.long_name;
      if (types.includes('postal_code'))          parts.pinCode  = c.long_name;
    });

    // Fallback: infer locality from formatted address if blank
    if (
      parts.locality === '' &&
      parts.city &&
      metroCities.some((mc) => mc.toLowerCase() === parts.city.toLowerCase())
    ) {
      // Take first component if it's not the city itself
      const first = components[0]?.long_name;
      if (first && first !== parts.city) parts.locality = first;
    }

    return parts;
  };;

  const updateAddressFromCoords = (latLng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const p = extractAddressParts(results[0].address_components);
        setFormData((prev) => ({
          ...prev,
          propertyAddress: results[0].formatted_address,
          mapLocation: `${latLng.lat()},${latLng.lng()}`,
        locality: p.locality,
        city: p.city,
        state: p.state,
        country: p.country,
        pinCode: p.pinCode
        }));
      }
    });
  };

  const initAutocomplete = () => {
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const location = place.geometry.location;
      const p = extractAddressParts(place.address_components);

      renderMap(location);

      setFormData((prev) => ({
        ...prev,
        propertyAddress: place.formatted_address,
        mapLocation: `${location.lat()},${location.lng()}`,
        locality: p.locality,
        city: p.city,
        state: p.state,
        country: p.country,
        pinCode: p.pinCode
      }));
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                              Initial effects                                */
  /* -------------------------------------------------------------------------- */
  // Load Google Maps script & init autocomplete
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c&libraries=places';
      script.async = true;
      script.onload = () => {
        const interval = setInterval(() => {
          if (inputRef.current) {
            initAutocomplete();
            clearInterval(interval);
          }
        }, 100);
      };
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, []);

  // Check login & profile
  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (currentUserKey) {
      setIsLoggedIn(true);
      const userProfile = JSON.parse(localStorage.getItem(`userProfile_${currentUserKey}`));
      if (userProfile) setProfile(userProfile);
      setFormData((prev) => ({
        ...prev,
        userKey: currentUserKey
      }));
    }
  }, []);

  // Fetch existing listing if editing
  useEffect(() => {
    if (listingId) {
      const fetchListing = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/listings/${listingId}`);
          const data = await res.json();
          if (res.ok) {
            setFormData((prev) => ({ ...prev, ...data }));
            if (window.google && data.mapLocation) {
              const [lat, lng] = data.mapLocation.split(',').map(Number);
              const latLng = new window.google.maps.LatLng(lat, lng);
              setTimeout(() => renderMap(latLng), 500);
            }
          } else {
            console.error('Error fetching listing:', data.message);
          }
        } catch (err) {
          console.error('Error loading listing:', err);
        }
      };

      fetchListing();
    }
  }, [listingId]);

  /* -------------------------------------------------------------------------- */
  /*                             Handlers & helpers                             */
  /* -------------------------------------------------------------------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        amenities: {
          ...prev.amenities,
          [name]: checked
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Array.from(files)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.propertyAddress || formData.propertyAddress.trim() === '') {
      alert('Property address is required.');
      return;
    }

    const finalDeposit =
      formData.securityDepositOption === 'Other'
        ? formData.customSecurityDeposit
        : formData.securityDepositOption;

    const listingData = {
      ...formData,
      securityDeposit: finalDeposit,
      userId: localStorage.getItem('currentUser'),
      amenities: JSON.stringify(formData.amenities),
      accommodationType: 'Room', // or formData.accommodationType
      title:
        formData.title?.trim() ||
        `Flatmate required in ${formData.locality || formData.city || 'your city'}`
    };

    try {
      let response;

      if (listingId) {
        // PUT for updating
        response = await axios.put(
          `http://localhost:5000/api/listings/${listingId}`,
          listingData,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        alert('Listing successfully updated!');
      } else {
        // POST for creating
        response = await axios.post('http://localhost:5000/api/listings/create', listingData, {
          headers: { 'Content-Type': 'application/json' }
        });
        alert('Listing successfully created!');
      }

      navigate('/listings');
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('Failed to save listing. Check console for details.');
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   JSX                                      */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="room-listing-container">
      <Header isLoggedIn={isLoggedIn} />
      <div className="room-listing-card">
        <h1>{listingId ? 'Edit Room Listing' : 'List Your Room'}</h1>
        <form onSubmit={handleSubmit}>
          {/* Address + Map */}
          <div className="form-section bordered-section with-map">
            <label>
              <FaMapMarkerAlt /> Property Address*
            </label>
            <input
              type="text"
              name="propertyAddress"
              ref={inputRef}
              value={formData.propertyAddress}
              onChange={handleChange}
              placeholder="Start typing address..."
              required
            />
            {/* Address breakdown */}
            <div className="address-grid">
              <div>
                <label>Locality*</label>
                <input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>City*</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>State*</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Country*</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Pin Code*</label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {formData.propertyAddress && (
              <div
                ref={mapRef}
                style={{ width: '100%', height: '300px', marginTop: '10px' }}
              />
            )}
          </div>

          {/* Property Structure */}
          <div className="form-section bordered-section">
            <label>
              <FaHome /> Property Type*
            </label>
            <div className="radio-group">
              {['Standalone apartment', 'Standalone building', 'Gated community'].map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="propertyStructure"
                    value={type}
                    checked={formData.propertyStructure === type}
                    onChange={handleChange}
                    required
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Room Type */}
          <div className="form-section bordered-section">
            <label>
              <FaBed /> Room Type
            </label>
            <select name="roomType" value={formData.roomType} onChange={handleChange}>
              <option value="">Select</option>
              <option value="1BHK">1BHK</option>
              <option value="2BHK">2BHK</option>
              <option value="3BHK">3BHK</option>
              <option value="Studio">Studio</option>
            </select>
          </div>

          {/* Washroom */}
          <div className="form-section bordered-section">
            <label>
              <FaBath /> Washroom Type*
            </label>
            <select
              name="washroomType"
              value={formData.washroomType}
              onChange={handleChange}
              required
            >
              <option value="">Select washroom type</option>
              <option value="Attached">Attached</option>
              <option value="Private">Private</option>
              <option value="Sharing">Sharing</option>
            </select>
          </div>

          {/* Parking */}
          <div className="form-section bordered-section">
            <label>
              <FaParking /> Parking Available*
            </label>
            <div className="radio-group">
              {['Car parking', 'Bike parking', 'None'].map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="parkingType"
                    value={type}
                    checked={formData.parkingType === type}
                    onChange={handleChange}
                    required
                  />
                  {type === 'Car parking' && <FaCar />} {type === 'Bike parking' && <FaMotorcycle />}{' '}
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="form-section bordered-section size-group">
            <div className="form-group">
              <label>
                <FaRulerCombined /> Room Size (sq ft)*
              </label>
              <input
                type="number"
                name="roomSize"
                value={formData.roomSize}
                onChange={handleChange}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label>
                <FaRulerCombined /> Apartment Size (sq ft)
              </label>
              <input
                type="number"
                name="apartmentSize"
                value={formData.apartmentSize}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          {/* Rent & Dates */}
          <div className="form-section bordered-section">
            <label>
              <FaMoneyBillWave /> Rent*
            </label>
            <input type="number" name="rent" value={formData.rent} onChange={handleChange} required />
          </div>
          <div className="form-section bordered-section">
            <label>
              <FaCalendarAlt /> Available From
            </label>
            <input
              type="date"
              name="availableFrom"
              value={formData.availableFrom}
              onChange={handleChange}
              min={todayDate}
            />
          </div>
          <div className="form-section bordered-section">
            <label>
              <FaCalendarAlt /> Open Date (with time)
            </label>
            <input
              type="datetime-local"
              name="openDate"
              value={formData.openDate}
              onChange={handleChange}
              min={todayDateTime}
            />
          </div>

          {/* Security Deposit */}
          <div className="form-section bordered-section">
            <label>
              <FaLock /> Security Deposit
            </label>
            <select
              name="securityDepositOption"
              value={formData.securityDepositOption}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="1 month">1 month</option>
              <option value="2 months">2 months</option>
              <option value="Other">Other</option>
            </select>
            {formData.securityDepositOption === 'Other' && (
              <input
                type="text"
                name="customSecurityDeposit"
                value={formData.customSecurityDeposit}
                onChange={handleChange}
                placeholder="Enter deposit amount"
              />
            )}
          </div>

          {/* Amenities */}
          <div className="form-section bordered-section">
            <label>Amenities</label>
            <div className="checkbox-group">
              {[
                { label: 'TV', icon: <FaTv /> },
                { label: 'Fridge', icon: <FaBlender /> },
                { label: 'WashingMachine', icon: <GiWashingMachine /> },
                { label: 'kitchen', icon: <FaUtensils /> }
              ].map(({ label, icon }) => (
                <label key={label}>
                  <input
                    type="checkbox"
                    name={label}
                    checked={formData.amenities[label]}
                    onChange={handleChange}
                  />
                  {icon} {label}
                </label>
              ))}
            </div>
          </div>

          {/* Cooking */}
          <div className="form-section bordered-section">
            <label>
              <FaUtensils /> Cooking Preference*
            </label>
            <div className="radio-group">
              {['Individual', 'Shared'].map((type) => (
                <label key={type}>
                  <input
                    type="radio"
                    name="cookingType"
                    value={type}
                    checked={formData.cookingType === type}
                    onChange={handleChange}
                    required
                  />
                  {type} cooking
                </label>
              ))}
            </div>
          </div>

          {/* Media Uploads */}
          <div className="form-section bordered-section">
            <label>
              <FaCamera /> Upload Images
            </label>
            <input type="file" name="images" multiple accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="form-section bordered-section">
            <label>
              <FaVideo /> Upload Videos
            </label>
            <input type="file" name="videos" multiple accept="video/*" onChange={handleFileChange} />
          </div>

          <button type="submit" className="submit-btn">
            {listingId ? 'Edit My Listing' : 'List My Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyDescriptionForm;
