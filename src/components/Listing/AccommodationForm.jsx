import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GoogleMap, LoadScript, Autocomplete, Marker } from '@react-google-maps/api';
import { FaPlus, FaMinus, FaUpload, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';
import './AccommodationForm.css';
import Header from '../Header/Header';
import config from "../../config";

const AccommodationForm = ({ editMode = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PG',
    address: {
      street: '',
      locality: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: [0, 0]
    },
    totalFloors: 1,
    roomTypes: [
      {
        type: 'Single',
        facilities: [
          { name: 'Air Conditioner', available: false },
          { name: 'Attached Bathroom', available: false },
          { name: 'Wardrobe', available: false },
          { name: 'TV', available: false }
        ],
        totalRooms: 1,
        vacantRooms: 1,
        price: 0
      }
    ],
    commonFacilities: [
      { name: 'WiFi', available: false },
      { name: 'Game Room', available: false },
      { name: 'Lounge', available: false },
      { name: 'Laundry', available: false }
    ],
    meals: {
      breakfast: false,
      lunch: false,
      dinner: false,
      packedLunch: false,
      cuisines: []
    },
    rules: [],
    contactNumber: '',
    images: [],
    videos: []
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newFacility, setNewFacility] = useState('');
  const [newRule, setNewRule] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [indianCities] = useState([
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 
    'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Surat'
  ]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (currentUserKey) {
      setIsLoggedIn(true);
      if (editMode && id) {
        fetchExistingListing();
      }
    } else {
      alert('Please log in to access this feature');
      navigate('/login');
    }
  }, [editMode, id]);

  const fetchExistingListing = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${config.apiBaseUrl}/api/accommodations/${id}`);
      const data = response.data;
      
      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'PG',
        address: {
          street: data.address?.street || '',
          locality: data.address?.locality || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          pincode: data.address?.pincode || '',
          coordinates: data.address?.coordinates?.coordinates || [0, 0]
        },
        totalFloors: data.totalFloors || 1,
        roomTypes: data.roomTypes || [{
          type: 'Single',
          facilities: [
            { name: 'Air Conditioner', available: false },
            { name: 'Attached Bathroom', available: false },
            { name: 'Wardrobe', available: false },
            { name: 'TV', available: false }
          ],
          totalRooms: 1,
          vacantRooms: 1,
          price: 0
        }],
        commonFacilities: data.commonFacilities || [
          { name: 'WiFi', available: false },
          { name: 'Game Room', available: false },
          { name: 'Lounge', available: false },
          { name: 'Laundry', available: false }
        ],
        meals: data.meals || {
          breakfast: false,
          lunch: false,
          dinner: false,
          packedLunch: false,
          cuisines: []
        },
        rules: data.rules || [],
        contactNumber: data.contactNumber || '',
        images: data.images || [],
        videos: data.videos || []
      });
      
      setSelectedCity(data.address?.city || '');
      setExistingImages(data.images || []);
    } catch (error) {
      console.error('Error fetching listing:', error.response?.data || error.message);
      alert(`Failed to load listing data: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const addressComponents = place.address_components;
      const geometry = place.geometry.location;

      const newAddress = {
        street: place.name || '',
        locality: getAddressComponent(addressComponents, 'sublocality') || '',
        city: getAddressComponent(addressComponents, 'locality') || '',
        state: getAddressComponent(addressComponents, 'administrative_area_level_1') || '',
        pincode: getAddressComponent(addressComponents, 'postal_code') || '',
        coordinates: [geometry.lng(), geometry.lat()]
      };

      setFormData(prev => ({
        ...prev,
        address: newAddress
      }));
      setSelectedCity(newAddress.city);
    }
  };

  const getAddressComponent = (components, type) => {
    const component = components.find(c => c.types.includes(type));
    return component ? component.long_name : '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleRoomTypeChange = (index, field, value) => {
    const updatedRoomTypes = [...formData.roomTypes];
    updatedRoomTypes[index][field] = value;
    setFormData(prev => ({
      ...prev,
      roomTypes: updatedRoomTypes
    }));
  };

  const toggleRoomFacility = (roomIndex, facilityIndex) => {
    const updatedRoomTypes = [...formData.roomTypes];
    updatedRoomTypes[roomIndex].facilities[facilityIndex].available = 
      !updatedRoomTypes[roomIndex].facilities[facilityIndex].available;
    setFormData(prev => ({
      ...prev,
      roomTypes: updatedRoomTypes
    }));
  };

  const toggleCommonFacility = (index) => {
    const updatedFacilities = [...formData.commonFacilities];
    updatedFacilities[index].available = !updatedFacilities[index].available;
    setFormData(prev => ({
      ...prev,
      commonFacilities: updatedFacilities
    }));
  };

  const addCommonFacility = () => {
    if (newFacility.trim()) {
      setFormData(prev => ({
        ...prev,
        commonFacilities: [
          ...prev.commonFacilities,
          { name: newFacility.trim(), available: true }
        ]
      }));
      setNewFacility('');
    }
  };

  const removeCommonFacility = (index) => {
    const updatedFacilities = [...formData.commonFacilities];
    updatedFacilities.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      commonFacilities: updatedFacilities
    }));
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index) => {
    const updatedRules = [...formData.rules];
    updatedRules.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      rules: updatedRules
    }));
  };

  const handleCuisineChange = (cuisine) => {
    const updatedCuisines = formData.meals.cuisines.includes(cuisine)
      ? formData.meals.cuisines.filter(c => c !== cuisine)
      : [...formData.meals.cuisines, cuisine];
    
    setFormData(prev => ({
      ...prev,
      meals: {
        ...prev.meals,
        cuisines: updatedCuisines
      }
    }));
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(prev => [...prev, ...files]);
  };

  const removeMediaFile = (index) => {
    const updatedFiles = [...mediaFiles];
    updatedFiles.splice(index, 1);
    setMediaFiles(updatedFiles);
  };

  const removeExistingImage = (index) => {
    const updatedImages = [...existingImages];
    updatedImages.splice(index, 1);
    setExistingImages(updatedImages);
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      roomTypes: [
        ...prev.roomTypes,
        {
          type: 'Single',
          facilities: [
            { name: 'Air Conditioner', available: false },
            { name: 'Attached Bathroom', available: false },
            { name: 'Wardrobe', available: false },
            { name: 'TV', available: false }
          ],
          totalRooms: 1,
          vacantRooms: 1,
          price: 0
        }
      ]
    }));
  };

  const removeRoomType = (index) => {
    if (formData.roomTypes.length > 1) {
      const updatedRoomTypes = [...formData.roomTypes];
      updatedRoomTypes.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        roomTypes: updatedRoomTypes
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.address.coordinates || formData.address.coordinates[0] === 0) {
        throw new Error('Please select a location on the map');
      }

      const currentUser = localStorage.getItem('currentUser');

      const submissionData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        address: {
          street: formData.address.street,
          locality: formData.address.locality,
          city: formData.address.city,
          state: formData.address.state,
          pincode: formData.address.pincode,
          coordinates: {
            type: "Point",
            coordinates: formData.address.coordinates
          }
        },
        totalFloors: String(formData.totalFloors),
        roomTypes: formData.roomTypes,
        commonFacilities: formData.commonFacilities,
        meals: formData.meals,
        rules: formData.rules,
        contactNumber: formData.contactNumber,
        owner: currentUser,
        existingImages: existingImages.map(img => img._id),
        deletedImages: formData.images
          .filter(img => !existingImages.some(ei => ei._id === img._id))
          .map(img => img._id)
      };

      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify({
        ...submissionData,
        ...(editMode && { _id: id }) // Include ID for edit mode
      }));
      
      mediaFiles.forEach(file => {
        formDataToSend.append('media', file);
      });

      let response;
      if (editMode) {
        
        response = await axios.put(
          `${config.apiBaseUrl}/api/accommodations/${id}`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',timeout: 10000
            }
          }
        );
      } else {
        response = await axios.post(
          `${config.apiBaseUrl}/api/accommodations`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',timeout: 10000
            }
          }
        );
      }

      navigate(`/`);
    } catch (error) {
      console.error('Full error:', error);
      console.error('Response data:', error.response?.data);
      alert(`Submission failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="accommodation-form-container">
        <Header isLoggedIn={isLoggedIn} />
        <div className="loading-container">
          <p>Loading listing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accommodation-form-container">
      <Header isLoggedIn={isLoggedIn} />
      <div className="form-content">
        <h1 className="form-title">
          {editMode ? 'Edit Your PG Listing' : 'List Your PG / Co-living Space'}
        </h1>
        
        <form onSubmit={handleSubmit} className="accommodation-form">
          {/* Basic Information Section */}
          <section className="form-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label>Title*</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Premium Co-living Space in Bangalore"
              />
            </div>
            
            <div className="form-group">
              <label>Description*</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Describe your accommodation in detail..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Type*</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="PG">PG Accommodation</option>
                  <option value="Co-Living">Co-Living Space</option>
                </select>
              </div>
              <div className="form-group">
                <label>Total Floors*</label>
                <input
                  type="number"
                  name="totalFloors"
                  value={formData.totalFloors}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className="form-section">
            <h2>Location Details</h2>
            
            <div className="form-group">
              <label>Search Location on Map*</label>
              <LoadScript googleMapsApiKey="AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c" libraries={['places']}>
                <Autocomplete
                  onLoad={autocomplete => setAutocomplete(autocomplete)}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    type="text"
                    placeholder="Enter complete address"
                    className="map-search-input"
                  />
                </Autocomplete>
              </LoadScript>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City*</label>
                <select
                  name="address.city"
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    handleChange(e);
                  }}
                  required
                >
                  <option value="">Select City</option>
                  {indianCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>State*</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Street Address*</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Locality/Area*</label>
                <input
                  type="text"
                  name="address.locality"
                  value={formData.address.locality}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            {formData.address.coordinates[0] !== 0 && (
              <div className="map-preview">
                <LoadScript googleMapsApiKey="AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c">
                  <GoogleMap
                    mapContainerStyle={{ height: '250px', width: '100%' }}
                    center={{ 
                      lat: formData.address.coordinates[1], 
                      lng: formData.address.coordinates[0] 
                    }}
                    zoom={15}
                  >
                    <Marker position={{ 
                      lat: formData.address.coordinates[1], 
                      lng: formData.address.coordinates[0] 
                    }} />
                  </GoogleMap>
                </LoadScript>
              </div>
            )}
          </section>

          {/* Room Types Section */}
          <section className="form-section">
            <h2>Room Types & Pricing</h2>
            
            {formData.roomTypes.map((roomType, roomIndex) => (
              <div key={roomIndex} className="room-type-card">
                <div className="room-type-header">
                  <h3>Room Type #{roomIndex + 1}</h3>
                  <button 
                    type="button" 
                    className="remove-button"
                    onClick={() => removeRoomType(roomIndex)}
                    disabled={formData.roomTypes.length <= 1}
                  >
                    <FaMinus />
                  </button>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Type*</label>
                    <select
                      value={roomType.type}
                      onChange={(e) => handleRoomTypeChange(roomIndex, 'type', e.target.value)}
                      required
                    >
                      <option value="Single">Single</option>
                      <option value="Double Sharing">Double Sharing</option>
                      <option value="Multi Sharing">Multi Sharing</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Total Rooms*</label>
                    <input
                      type="number"
                      value={roomType.totalRooms}
                      onChange={(e) => handleRoomTypeChange(roomIndex, 'totalRooms', parseInt(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Vacant Rooms*</label>
                    <input
                      type="number"
                      value={roomType.vacantRooms}
                      onChange={(e) => handleRoomTypeChange(roomIndex, 'vacantRooms', parseInt(e.target.value))}
                      min="0"
                      max={roomType.totalRooms}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Price (₹)*</label>
                    <input
                      type="number"
                      value={roomType.price}
                      onChange={(e) => handleRoomTypeChange(roomIndex, 'price', parseInt(e.target.value))}
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Room Facilities</label>
                  <div className="facilities-grid">
                    {roomType.facilities.map((facility, facilityIndex) => (
                      <div key={facilityIndex} className="facility-item">
                        <input
                          type="checkbox"
                          id={`room-${roomIndex}-facility-${facilityIndex}`}
                          checked={facility.available}
                          onChange={() => toggleRoomFacility(roomIndex, facilityIndex)}
                        />
                        <label htmlFor={`room-${roomIndex}-facility-${facilityIndex}`}>
                          {facility.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              className="add-button"
              onClick={addRoomType}
            >
              <FaPlus /> Add Room Type
            </button>
          </section>

          {/* Common Facilities Section */}
          <section className="form-section">
            <h2>Common Facilities</h2>
            
            <div className="facilities-grid">
              {formData.commonFacilities.map((facility, index) => (
                <div key={index} className="facility-item">
                  <input
                    type="checkbox"
                    id={`common-facility-${index}`}
                    checked={facility.available}
                    onChange={() => toggleCommonFacility(index)}
                  />
                  <label htmlFor={`common-facility-${index}`}>
                    {facility.name}
                  </label>
                  <button 
                    type="button" 
                    className="remove-icon-button"
                    onClick={() => removeCommonFacility(index)}
                  >
                    <FaMinus />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="add-facility-container">
              <input
                type="text"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                placeholder="Enter new facility"
              />
              <button 
                type="button" 
                className="add-button"
                onClick={addCommonFacility}
              >
                <FaPlus />
              </button>
            </div>
          </section>

          {/* Meals Section */}
          <section className="form-section">
            <h2>Meal Options</h2>
            
            <div className="form-group">
              <label>Meals Provided</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="meals.breakfast"
                    checked={formData.meals.breakfast}
                    onChange={handleChange}
                  />
                  Breakfast
                </label>
                
                <label>
                  <input
                    type="checkbox"
                    name="meals.lunch"
                    checked={formData.meals.lunch}
                    onChange={handleChange}
                  />
                  Lunch
                </label>
                
                <label>
                  <input
                    type="checkbox"
                    name="meals.dinner"
                    checked={formData.meals.dinner}
                    onChange={handleChange}
                  />
                  Dinner
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Cuisines</label>
              <div className="checkbox-group">
                {['South Indian', 'North Indian', 'Continental', 'Chinese', 'Veg', 'Non-Veg'].map(cuisine => (
                  <label key={cuisine}>
                    <input
                      type="checkbox"
                      checked={formData.meals.cuisines.includes(cuisine)}
                      onChange={() => handleCuisineChange(cuisine)}
                    />
                    {cuisine}
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* House Rules Section */}
          <section className="form-section">
            <h2>House Rules</h2>
            
            <ul className="rules-list">
              {formData.rules.map((rule, index) => (
                <li key={index}>
                  {rule}
                  <button 
                    type="button" 
                    className="remove-icon-button"
                    onClick={() => removeRule(index)}
                  >
                    <FaMinus />
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="add-rule-container">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Enter new rule"
              />
              <button 
                type="button" 
                className="add-button"
                onClick={addRule}
              >
                <FaPlus />
              </button>
            </div>
          </section>

          {/* Media Upload Section */}
          <section className="form-section">
            <h2>Photos & Videos</h2>
            
            <div className="form-group">
              <label>Upload Media* (Min 3 photos)</label>
              <div className="file-upload-container">
                <label className="file-upload-button">
                  <FaUpload /> Choose Files
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                <span>{mediaFiles.length + existingImages.length} files selected</span>
              </div>
              
              {(mediaFiles.length > 0 || existingImages.length > 0) && (
                <div className="media-preview">
                  {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="media-thumbnail">
                      <img 
                        src={`${config.apiBaseUrl}/${image.path}`}
                        alt={`Existing ${index}`} 
                      />
                      <button 
                        type="button" 
                        className="remove-media-button"
                        onClick={() => removeExistingImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {mediaFiles.map((file, index) => (
                    <div key={`new-${index}`} className="media-thumbnail">
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`Preview ${index}`} 
                        />
                      ) : (
                        <video>
                          <source src={URL.createObjectURL(file)} type={file.type} />
                        </video>
                      )}
                      <button 
                        type="button" 
                        className="remove-media-button"
                        onClick={() => removeMediaFile(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Contact Information */}
          <section className="form-section">
            <h2>Contact Information</h2>
            
            <div className="form-group">
              <label>Contact Number*</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
          </section>

          {/* Form Submission */}
          <div className="form-actions">
            <button 
              type="button" 
              className="secondary-button"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-button"
              disabled={isSubmitting || (mediaFiles.length + existingImages.length) < 3}
            >
              {isSubmitting ? 'Submitting...' : (editMode ? 'Update Listing' : 'Submit Listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccommodationForm;