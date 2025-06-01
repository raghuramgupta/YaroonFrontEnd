import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './WantedRoomForm.css';
import Header from '../Header/Header';
import {
  FaHome,
  FaBed,
  FaBath,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import axios from 'axios';
import config from '../../config';
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

const WantedRoomForm = () => {
  const { id: listingId } = useParams();
  const isEdit = Boolean(listingId); // This will be true if listingId exists

  /* ---------------------------------------------------------------------- */
  /*                                state                                   */
  /* ---------------------------------------------------------------------- */
  const [formData, setFormData] = useState({
    userKey: '',
    preferredLocation: '',
    locality: '',
    city: '',
    state: '',
    country: '',
    pinCode: '',
    propertyType: '',
    roomType: '',
    furnished: '',
    budget: '',
    FoodChoice: '',
    washroomType: '',
    profession: '',
    moveInDate: new Date().toISOString().split('T')[0],
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
    mapLocation: ''
  });

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------------------------------------------------------------------- */
  /*                     Google Places address helper                       */
  /* ---------------------------------------------------------------------- */
  const extractAddressParts = (components) => {
    const parts = { locality: '', city: '', state: '', country: '', pinCode: '' };
    components.forEach((c) => {
      const t = c.types;
      if (t.includes('sublocality_level_1')) parts.locality = c.long_name;
      if (t.includes('locality')) parts.city = c.long_name;
      if (t.includes('administrative_area_level_1')) parts.state = c.long_name;
      if (t.includes('country')) parts.country = c.long_name;
      if (t.includes('postal_code')) parts.pinCode = c.long_name;
    });
    // fallback for metro cities
    if (!parts.locality && parts.city && metroCities.some((mc) => mc.toLowerCase() === parts.city.toLowerCase())) {
      const first = components[0]?.long_name;
      if (first && first !== parts.city) parts.locality = first;
    }
    return parts;
  };

  const initAutocomplete = () => {
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, { types: ['geocode'] });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      const loc = place.geometry.location;
      const p = extractAddressParts(place.address_components);
      setFormData((prev) => ({
        ...prev,
        preferredLocation: place.formatted_address,
        mapLocation: `${loc.lat()},${loc.lng()}`,
        ...p
      }));
    });
  };

  /* ---------------------------------------------------------------------- */
  /*                            Load scripts once                           */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB6MA27FGtx8g83oF57MAxLAOdcs1rsu7c&libraries=places';
      script.async = true;
      script.onload = () => {
        if (inputRef.current) initAutocomplete();
      };
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                Load profile + listing data (if editing)                */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) setIsLoggedIn(true);

        // Fetch user profile first
        if (currentUser) {
          const { data: userProfile } = await axios.get(`${config.apiBaseUrl}/api/users/profile/${currentUser}`);
          setFormData(prev => ({
            ...prev,
            userKey: currentUser,
            contactName: userProfile.name || '',
            contactPhone: userProfile.phone || '',
            contactEmail: userProfile.email || '',
            FoodChoice: userProfile.foodPreference || '',
            profession: userProfile.profession || ''
          }));
        }
        
        // Then fetch listing data if in edit mode
        if (isEdit) {
        const { data: listing } = await axios.get(
          `${config.apiBaseUrl}/api/wanted-listings/${listingId}`
        );

        setFormData(prev => ({
          ...prev,
          ...listing,
          userKey   : listing.user || prev.userKey,
          moveInDate: listing.moveInDate
                        ? listing.moveInDate.split('T')[0]   // YYYY‑MM‑DD for <input type="date">
                        : prev.moveInDate
        }));
      }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isEdit, listingId]); // Add all dependencies here

  /* ---------------------------------------------------------------------- */
  /*                               Handlers                                 */
  /* ---------------------------------------------------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.preferredLocation.trim()) {
      alert('Preferred location is required.');
      return;
    }

    try {
      if (isEdit) {
        await axios.put(`${config.apiBaseUrl}/api/wanted-listings/${listingId}`, formData, {
          headers: { 'Content-Type': 'application/json' }
        });
        alert('Room request updated successfully!');
      } else {
        await axios.post('${config.apiBaseUrl}/api/wanted-listings/create', { ...formData, user: formData.userKey }, {
          headers: { 'Content-Type': 'application/json' }
        });
        alert('Your room request has been posted successfully!');
      }
      navigate('/');
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                                    JSX                                 */
  /* ---------------------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="wanted-room-container">
        <Header isLoggedIn={isLoggedIn} />
        <div className="wanted-room-card"><h1>Loading...</h1></div>
      </div>
    );
  }

  return (
    <div className="wanted-room-container">
      <Header isLoggedIn={isLoggedIn} />
      <div className="wanted-room-card">
        <h1>{isEdit ? 'Edit Your Room Request' : 'Post Your Room Request'}</h1>
        <p className="subtitle">Fill in your preferences to {isEdit ? 'update' : 'find'} the perfect room</p>

        <form onSubmit={handleSubmit}>
          {/* Preferred location */}
          <div className="form-section bordered-section">
            <label><FaMapMarkerAlt /> Preferred Location*</label>
            <input
              type="text"
              name="preferredLocation"
              ref={inputRef}
              value={formData.preferredLocation}
              onChange={handleChange}
              placeholder="Enter neighborhood, city, or address"
              required
            />
            {/* locality/city/etc grid */}
            <div className="address-grid">
              <div><label>Locality</label><input name="locality" value={formData.locality} onChange={handleChange} /></div>
              <div><label>City*</label><input name="city" value={formData.city} onChange={handleChange} required /></div>
              <div><label>State*</label><input name="state" value={formData.state} onChange={handleChange} required /></div>
              <div><label>Pin Code</label><input name="pinCode" value={formData.pinCode} onChange={handleChange} /></div>
            </div>
          </div>

          {/* Property type radio */}
          <div className="form-section bordered-section">
            <label><FaHome /> Property Type*</label>
            <div className="radio-group">
              {['Apartment', 'Independent House', 'PG/Hostel', 'No Preference'].map((t) => (
                <label key={t}><input type="radio" name="propertyType" value={t} checked={formData.propertyType === t} onChange={handleChange} required />{t}</label>
              ))}
            </div>
          </div>

          {/* Room type select */}
          <div className="form-section bordered-section">
            <label><FaBed /> Room Type*</label>
            <select name="roomType" value={formData.roomType} onChange={handleChange} required>
              <option value="">Select your preference</option>
              <option value="Single Room">Single Room</option>
              <option value="Shared Room">Shared Room</option>
            </select>
          </div>

          {/* Washroom type */}
          <div className="form-section bordered-section">
            <label><FaBath /> Washroom Type*</label>
            <select name="washroomType" value={formData.washroomType} onChange={handleChange} required>
              <option value="">Select washroom type</option>
              {['Attached', 'Private', 'Sharing'].map((w) => (<option key={w} value={w}>{w}</option>))}
            </select>
          </div>

          {/* Food choice */}
          <div className="form-section bordered-section">
            <label><FaBed /> Food Choice*</label>
            <select name="FoodChoice" value={formData.FoodChoice} onChange={handleChange} required>
              <option value="">Select your preference</option>
              {['Vegan', 'Vegetarian', 'No Preference'].map((f) => (<option key={f} value={f}>{f}</option>))}
            </select>
          </div>

          {/* Profession */}
          <div className="form-section bordered-section">
            <label><FaBed /> Profession*</label>
            <select name="profession" value={formData.profession} onChange={handleChange} required>
              <option value="">Select your preference</option>
              {['Working Professional', 'Student', 'Job Seeker', 'Others'].map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>

          {/* Furnished */}
          <div className="form-section bordered-section">
            <label><FaHome /> Furnishing*</label>
            <div className="radio-group">
              {['Furnished', 'Semi-Furnished', 'Unfurnished', 'No Preference'].map((f) => (
                <label key={f}><input type="radio" name="furnished" value={f} checked={formData.furnished === f} onChange={handleChange} required />{f}</label>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="form-section bordered-section">
            <label><FaMoneyBillWave /> Maximum Budget (per month)*</label>
            <input type="number" name="budget" value={formData.budget} onChange={handleChange} required />
          </div>

          {/* Move-in date */}
          <div className="form-section bordered-section">
            <label><FaCalendarAlt /> Preferred Move-in Date</label>
            <input type="date" name="moveInDate" value={formData.moveInDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
          </div>

          {/* Additional prefs */}
          <div className="form-section bordered-section">
            <label>Additional Preferences</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Any specific requirements..." />
          </div>

          {/* Contact info */}
          <div className="form-section bordered-section">
            <h3>Contact Information</h3>
            <div className="form-group"><label><FaUser /> Name*</label><input name="contactName" value={formData.contactName} onChange={handleChange} required /></div>
            <div className="form-group"><label><FaPhone /> Phone*</label><input name="contactPhone" value={formData.contactPhone} onChange={handleChange} required /></div>
            <div className="form-group"><label><FaEnvelope /> Email*</label><input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} required /></div>
          </div>

          <button type="submit" className="submit-btn">{isEdit ? 'Update Request' : 'Post My Room Request'}</button>
        </form>
      </div>
    </div>
  );
};

export default WantedRoomForm;