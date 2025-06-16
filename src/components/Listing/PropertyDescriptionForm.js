import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PropertyDescriptionForm.css';
import Header from '../Header/Header';
import {
  FaHome, FaBed, FaBath, FaMap, FaParking, FaRulerCombined,
  FaMoneyBillWave, FaCalendarAlt, FaLock, FaTv, FaBlender,
  FaUtensils, FaMapMarkerAlt, FaCamera, FaVideo, FaCar, FaMotorcycle, FaTrash
} from 'react-icons/fa';
import { GiWashingMachine } from 'react-icons/gi';
import axios from 'axios';
import config from '../../config';
  
const todayDate = new Date().toISOString().split('T')[0];
const todayDateTime = new Date().toISOString().slice(0, 16);
const metroCities = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Pune', 'Gurugram', 'Noida', 'New Delhi'];

const PropertyDescriptionForm = () => {
  const [formData, setFormData] = useState({
    userKey: '',
    propertyAddress: '', locality: '', city: '', state: '', country: '', pinCode: '',
    propertyStructure: '', roomType: '', washroomType: '', parkingType: '',
    roomSize: '', apartmentSize: '', rent: '', availableFrom: todayDate, openDate: '',
    securityDepositOption: '', customSecurityDeposit: '', userType: '',
    amenities: { TV: false, Fridge: false, WashingMachine: false, kitchen: false },
    cookingType: '', images: [], videos: [], mapLocation: '', userinterests:'', pets:'',
    gender:'', languages:'', foodchoices:'', validPics: [], AIGenpics: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const { listingId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isListingCreated, setIsListingCreated] = useState(false);
  const [currentListingId, setCurrentListingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract address parts from Google Place object
  const extractAddressParts = (components) => {
    const parts = { locality: '', city: '', state: '', country: '', pinCode: '' };
    components.forEach((c) => {
      const types = c.types;
      if (types.includes('sublocality_level_1')) parts.locality = c.long_name;
      if (types.includes('locality')) parts.city = c.long_name;
      if (types.includes('administrative_area_level_1')) parts.state = c.long_name;
      if (types.includes('country')) parts.country = c.long_name;
      if (types.includes('postal_code')) parts.pinCode = c.long_name;
    });
    if (parts.locality === '' && parts.city && metroCities.some(mc => mc.toLowerCase() === parts.city.toLowerCase())) {
      const first = components[0]?.long_name;
      if (first && first !== parts.city) parts.locality = first;
    }
    return parts;
  };

  const renderMap = (latLng) => {
    const mapInstance = new window.google.maps.Map(mapRef.current, { center: latLng, zoom: 15 });
    setMap(mapInstance);
    const mapMarker = new window.google.maps.Marker({ position: latLng, map: mapInstance, draggable: true });
    setMarker(mapMarker);
    mapMarker.addListener('dragend', () => updateAddressFromCoords(mapMarker.getPosition()));
  };

  const updateAddressFromCoords = (latLng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const p = extractAddressParts(results[0].address_components);
        setFormData(prev => ({
          ...prev,
          propertyAddress: results[0].formatted_address,
          mapLocation: `${latLng.lat()},${latLng.lng()}`,
          locality: p.locality, city: p.city, state: p.state, country: p.country, pinCode: p.pinCode
        }));
      }
    });
  };

  const initAutocomplete = () => {
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, { types: ['geocode'] });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      const location = place.geometry.location;
      const parts = extractAddressParts(place.address_components);
      setFormData(prev => ({
        ...prev,
        propertyAddress: place.formatted_address,
        mapLocation: `${location.lat()},${location.lng()}`,
        ...parts
      }));
      setSelectedLatLng(location);
      setShowMap(true);
    });
  };

  useEffect(() => {
    if (showMap && selectedLatLng && mapRef.current) {
      renderMap(selectedLatLng);
    }
  }, [showMap, selectedLatLng]);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c&libraries=places';
      script.async = true;
      script.onload = () => {
        const interval = setInterval(() => {
          if (inputRef.current) { initAutocomplete(); clearInterval(interval); }
        }, 100);
      };
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, []);

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (currentUserKey) {
      setIsLoggedIn(true);
      axios.get(`${config.apiBaseUrl}/api/users/profile/${currentUserKey}`)
        .then(res => {
          setProfile(res.data);
          setFormData(prev => ({
            ...prev,
            userKey: currentUserKey,
            userType: res.data.userType,
            userinterests: res.data.interests,
            gender: res.data.gender,
            languages: res.data.languages,
            pets: res.data.habits?.pets || '',
            foodchoices: res.data.habits?.foodChoice || ''
          }));
        })
        .catch(err => {
          setFormData(prev => ({ ...prev, userKey: currentUserKey }));
          console.error('Failed to load profile:', err);
        });
    }
  }, []);

  useEffect(() => {
    if (listingId) {
      const fetchListing = async () => {
        try {
          const res = await fetch(`${config.apiBaseUrl}/api/listings/${listingId}`);
          const data = await res.json();
          if (res.ok) {
            const parsedAmenities = typeof data.amenities === 'string'
              ? JSON.parse(data.amenities)
              : data.amenities;

            setFormData(prev => ({
              ...prev,
              ...data,
              amenities: parsedAmenities
            }));
            setIsListingCreated(true);
            setCurrentListingId(listingId);

            if (window.google && data.mapLocation) {
              const [lat, lng] = data.mapLocation.split(',').map(Number);
              const latLng = new window.google.maps.LatLng(lat, lng);
              setTimeout(() => renderMap(latLng), 500);
            }
          }
        } catch (err) {
          console.error('Error loading listing:', err);
        }
      };
      fetchListing();
    }
  }, [listingId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        amenities: { ...prev.amenities, [name]: checked }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Array.from(files)
    }));
  };

  const handleDeleteImage = (index) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const newValidPics = [...prev.validPics];
      const newAIGenpics = [...prev.AIGenpics];
      
      newImages.splice(index, 1);
      newValidPics.splice(index, 1);
      newAIGenpics.splice(index, 1);
      
      return {
        ...prev,
        images: newImages,
        validPics: newValidPics,
        AIGenpics: newAIGenpics
      };
    });
  };

  const handleDeleteVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsLoading(true);

    if (!formData.propertyAddress?.trim()) {
      alert('Property address is required.');
      setIsSubmitting(false);
      setIsLoading(false);
      return;
    }

    const finalDeposit = formData.securityDepositOption === 'Other'
      ? formData.customSecurityDeposit
      : formData.securityDepositOption;

    const filteredFormData = {
      ...formData,
      securityDepositOption: finalDeposit,
      amenities: JSON.stringify(formData.amenities),
      accommodationType: 'Room',
      title: formData.title?.trim() || `Flatmate required in ${formData.locality || formData.city || 'your city'}`
    };

    const { images, videos, ...otherFields } = filteredFormData;
    const formDataToSend = new FormData();

    Object.keys(otherFields).forEach(key => {
      formDataToSend.append(key, otherFields[key]);
    });

    if (images && Array.isArray(images)) {
      images.forEach(img => {
        if (img instanceof File) {
          formDataToSend.append('images', img);
        }
      });
    }

    if (videos && Array.isArray(videos)) {
      videos.forEach(vid => {
        if (vid instanceof File) {
          formDataToSend.append('videos', vid);
        }
      });
    }

    formDataToSend.append('updatedImages', JSON.stringify(
      images.filter(img => typeof img === 'string')
    ));
    formDataToSend.append('updatedVideos', JSON.stringify(
      videos.filter(vid => typeof vid === 'string')
    ));

    try {
      const endpoint = listingId
        ? `${config.apiBaseUrl}/api/listings/${listingId}`
        : `${config.apiBaseUrl}/api/listings/create`;
      const method = listingId ? 'put' : 'post';

      const response = await axios[method](endpoint, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(`Listing successfully ${listingId ? 'updated' : 'created'}!`);
      
      if (!listingId) {
        const newListing = await axios.get(`${config.apiBaseUrl}/api/listings/${response.data.listing._id}`);
        setFormData(prev => ({
          ...prev,
          validPics: newListing.data.validPics || [],
          AIGenpics: newListing.data.AIGenpics || []
        }));
        setCurrentListingId(response.data.listing._id);
      }
      
      setIsListingCreated(true);
      navigate('/listings');
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('Failed to save listing. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="compact-form-container">
      {isLoading && (
        <div className="loading-overlay">
          
            <div className="spinner"></div>
            
          <p>Saving your listing...</p>
        </div>
      )}

      <Header isLoggedIn={isLoggedIn} />
      <div className="compact-form-card">
        <h2>{listingId ? 'Edit Listing' : 'Create New Listing'}</h2>
        <form onSubmit={handleSubmit} className="compact-form">

          {/* Address Section */}
          <div className="form-section compact-section">
            <div className="section-header">
              <FaMapMarkerAlt className="section-icon" />
              <h3>Property Details</h3>
              <button type="button" onClick={() => setShowMap(!showMap)} className="map-toggle">
                <FaMap /> {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
            <input
              type="text"
              name="propertyAddress"
              ref={inputRef}
              value={formData.propertyAddress}
              onChange={handleChange}
              placeholder="Full property address"
              required
              className="compact-input"
            />
            <div className="compact-grid">
              <input type="text" name="locality" value={formData.locality} onChange={handleChange} placeholder="Locality*" required />
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City*" required />
              <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State*" required />
              <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country*" required />
              <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} placeholder="Pin Code*" required />
            </div>
            {showMap && formData.propertyAddress && (
              <div ref={mapRef} className={`compact-map ${showMap ? '' : 'hidden'}`} />
            )}
          </div>

          {/* Property Features */}
          <div className="form-section compact-section">
            <div className="section-header">
              <FaHome className="section-icon" />
              <h3>Property Features</h3>
            </div>
            <div className="compact-feature-grid">
              <div className="feature-group">
                <label><FaHome /> Type*</label>
                <select name="propertyStructure" value={formData.propertyStructure} onChange={handleChange} required>
                  <option value="">Select property type</option>
                  <option value="Standalone apartment">Standalone apartment</option>
                  <option value="Standalone building">Standalone building</option>
                  <option value="Gated community">Gated community</option>
                </select>
              </div>
              <div className="feature-group">
                <label><FaBed /> Room Type</label>
                <select name="roomType" value={formData.roomType} onChange={handleChange}>
                  <option value="">Select room type</option>
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="Studio">Studio</option>
                </select>
              </div>
              <div className="feature-group">
                <label><FaBath /> Washroom*</label>
                <select name="washroomType" value={formData.washroomType} onChange={handleChange} required>
                  <option value="">Select type</option>
                  <option value="Attached">Attached</option>
                  <option value="Private">Private</option>
                  <option value="Sharing">Sharing</option>
                </select>
              </div>
              <div className="feature-group">
                <label><FaParking /> Parking*</label>
                <select name="parkingType" value={formData.parkingType} onChange={handleChange} required>
                  <option value="">Select parking</option>
                  <option value="Car parking">Car parking</option>
                  <option value="Bike parking">Bike parking</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
            <div className="compact-size-group">
              <div className="size-input">
                <label><FaRulerCombined /> Room Size (sq ft)*</label>
                <input type="number" name="roomSize" value={formData.roomSize} onChange={handleChange} required min="1" />
              </div>
              <div className="size-input">
                <label><FaRulerCombined /> Apartment Size (sq ft)</label>
                <input type="number" name="apartmentSize" value={formData.apartmentSize} onChange={handleChange} min="1" />
              </div>
            </div>
          </div>

          {/* Pricing & Availability */}
          <div className="form-section compact-section">
            <div className="section-header">
              <FaMoneyBillWave className="section-icon" />
              <h3>Pricing & Availability</h3>
            </div>
            <div className="compact-price-grid">
              <div className="price-group">
                <label>Monthly Rent*</label>
                <input type="number" name="rent" value={formData.rent} onChange={handleChange} required />
              </div>
              <div className="price-group">
                <label><FaLock /> Security Deposit</label>
                {formData.securityDepositOption !== 'Other' ? (
                  <select name="securityDepositOption" value={formData.securityDepositOption} onChange={handleChange}>
                    <option value="">Select deposit</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input type="text" name="customSecurityDeposit" value={formData.customSecurityDeposit} onChange={handleChange} placeholder="Enter amount" />
                )}
              </div>
              <div className="price-group">
                <label><FaCalendarAlt /> Available From</label>
                <input type="date" name="availableFrom" value={formData.availableFrom} onChange={handleChange} min={todayDate} />
              </div>
              <div className="price-group">
                <label><FaCalendarAlt /> Open House</label>
                <input type="datetime-local" name="openDate" value={formData.openDate} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="form-section compact-section">
            <div className="section-header">
              <FaUtensils className="section-icon" />
              <h3>Amenities & Preferences</h3>
            </div>
            <div className="compact-amenities">
              <label className="amenity-option">
                <input type="checkbox" name="TV" checked={formData.amenities.TV} onChange={handleChange} />
                <FaTv /> TV
              </label>
              <label className="amenity-option">
                <input type="checkbox" name="Fridge" checked={formData.amenities.Fridge} onChange={handleChange} />
                <FaBlender /> Fridge
              </label>
              <label className="amenity-option">
                <input type="checkbox" name="WashingMachine" checked={formData.amenities.WashingMachine} onChange={handleChange} />
                <GiWashingMachine /> Washing Machine
              </label>
              <label className="amenity-option">
                <input type="checkbox" name="kitchen" checked={formData.amenities.kitchen} onChange={handleChange} />
                <FaUtensils /> Kitchen
              </label>
            </div>
            <div className="cooking-preference">
              <label><FaUtensils /> Cooking Preference*</label>
              <div className="preference-options">
                <label>
                  <input type="radio" name="cookingType" value="Individual" checked={formData.cookingType === 'Individual'} onChange={handleChange} required />
                  Individual
                </label>
                <label>
                  <input type="radio" name="cookingType" value="Shared" checked={formData.cookingType === 'Shared'} onChange={handleChange} required />
                  Shared
                </label>
                <label>
                  <input type="radio" name="cookingType" value="NotAllowed" checked={formData.cookingType === 'NotAllowed'} onChange={handleChange} required />
                  Not Allowed
                </label>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="form-section compact-section">
            <div className="section-header">
              <FaCamera className="section-icon" />
              <h3>Media Upload</h3>
            </div>
            <div className="media-upload">
              <div className="upload-group">
                <label><FaCamera /> Photos</label>
                <input type="file" name="images" multiple accept="image/*" onChange={handleFileChange} />
                {formData.images && formData.images.length > 0 && (
                  <div className="image-preview">
                    {formData.images.map((imgPath, index) => (
                      <div key={index} className="image-preview-item">
                        {typeof imgPath === 'string' ? (
                          <img
                            src={`${config.apiBaseUrl}${imgPath}`}
                            alt="preview"
                            className="preview-image"
                          />
                        ) : (
                          <span className="file-icon">📷</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(index)}
                          className="delete-image-btn"
                        >
                          ✖
                        </button>
                        {isListingCreated && formData.validPics[index] === false && (
                          <div className="image-warning">
                            ⚠️ Not clearly a property image, might impact your listing credibility
                          </div>
                        )}
                        {isListingCreated && formData.AIGenpics[index] === true && (
                          <div className="image-warning ai-warning">
                            ⚠️ AI-generated image detected, might impact your listing credibility
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="upload-group">
                <label><FaVideo /> Videos</label>
                <input type="file" name="videos" multiple accept="video/*" onChange={handleFileChange} />
                {formData.videos && formData.videos.length > 0 && (
                  <ul className="video-list">
                    {formData.videos.map((vidPath, index) => (
                      <li key={index} className="video-list-item">
                        <a href={`${config.apiBaseUrl}${vidPath}`} target="_blank" rel="noopener noreferrer">
                          View Video {index + 1}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(index)}
                          className="delete-video-btn"
                        >
                          <FaTrash />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="compact-submit-btn"
            disabled={isSubmitting}
          > 
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                {listingId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              listingId ? 'Update Listing' : 'Create Listing'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyDescriptionForm;