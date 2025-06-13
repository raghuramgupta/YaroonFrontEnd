import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header/Header';
import config from '../../config';
import './ListingDetailsPage.css';

const ListingDetailsPage = () => {
  const { id: listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const suggestedMessages = [
    "Can you arrange a viewing?",
    "Is the rent negotiable?",
    "Is the property still available?",
    "How far is the nearest metro/bus stop?",
    "Can I schedule a call to discuss?",
    "Can you share more photos or a video tour?"
  ];

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    setIsLoggedIn(!!currentUserKey);

    const fetchListing = async () => {
      try {
        const res = await fetch(
          `${config.apiBaseUrl}/api/listings/${listingId}?viewer=${currentUserKey || ''}`
        );
        if (!res.ok) {
          console.error('Failed to fetch listing:', res.status);
          return;
        }
        const data = await res.json();

        setListing({
          ...data,
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          images: Array.isArray(data.images) ? data.images : [],
        });
      } catch (err) {
        console.error('Error fetching listing:', err);
      }
    };

    if (listingId) fetchListing();
  }, [listingId]);

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!typing) {
      setTyping(true);
      setIsTyping(true);
      setTimeout(() => {
        setTyping(false);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !listing || !listing.userKey || !messageText.trim()) return;

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user,
          receiverId: listing.userKey,
          listingAddress: listing.propertyAddress,
          content: messageText.trim(),
          timestamp: new Date(),
        }),
      });
      if (response.ok) {
        setMessageText('');
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 3000);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      alert('Error sending message: ' + error.message);
    }
  };

  const handlePrevImage = () => {
    setActiveImageIndex(prev => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  if (!listing) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading property details...</p>
    </div>
  );

  return (
    <div className="listing-page-container">
      <Header isLoggedIn={isLoggedIn} />
      
      <main className="listing-content">
        {/* Image Gallery */}
        {listing.images.length > 0 && (
          <div className="image-gallery">
            <div className="main-image-container">
              {listing.images.length > 0 && (
                <img 
                  src={`${config.apiBaseUrl}${listing.images[activeImageIndex]}`} 
                  alt="property" 
                  className="main-image"
                />
              )}
              {listing.images.length > 1 && (
                <>
                  <button className="nav-button prev" onClick={handlePrevImage}>
                    &lt;
                  </button>
                  <button className="nav-button next" onClick={handleNextImage}>
                    &gt;
                  </button>
                </>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="thumbnail-container">
                {listing.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`thumbnail ${idx === activeImageIndex ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Property Details */}
        <div className="property-details">
          <div className="property-header">
            <h1>{listing.title}</h1>
            <div className="price-badge">₹{listing.rent}/month</div>
          </div>

          <div className="property-address">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>{listing.propertyAddress}</span>
          </div>

          <div className="property-meta">
            <div className="meta-item">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/>
              </svg>
              <span>{listing.propertyStructure}</span>
            </div>
            <div className="meta-item">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z"/>
                <path d="M11 7h2v2h-2zM11 11h2v6h-2z"/>
              </svg>
              <span>{listing.roomSize} sq.ft.</span>
            </div>
            <div className="meta-item">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/>
              </svg>
              <span>{listing.washroomType}</span>
            </div>
            <div className="meta-item">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
                <circle cx="7.5" cy="14.5" r="1.5"/>
                <circle cx="16.5" cy="14.5" r="1.5"/>
              </svg>
              <span>{listing.parkingType}</span>
            </div>
          </div>

          <div className="property-section">
            <h3>Description</h3>
            <p className="description">{listing.description}</p>
          </div>

          {listing.amenities.length > 0 && (
            <div className="property-section">
              <h3>Amenities</h3>
              <div className="amenities-grid">
                {listing.amenities.map((amenity, idx) => (
                  <div key={idx} className="amenity-item">
                    <span className="amenity-icon">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="property-section">
            <h3>Availability</h3>
            <div className="availability-details">
              <div className="availability-item">
                <span className="label">Available From:</span>
                <span className="value">{listing.availableFrom}</span>
              </div>
              <div className="availability-item">
                <span className="label">Deposit:</span>
                <span className="value">{listing.securityDepositOption}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-section">
          <div className="contact-card">
            <h3>Contact Property Owner</h3>
            
            {isLoggedIn ? (
              <>
                <div className="message-container">
                  <textarea
                    value={messageText}
                    onChange={handleTyping}
                    placeholder="Type your message here..."
                    rows={4}
                    className="message-input"
                  />
                  
                  <div className="suggested-messages">
                    <p className="suggestion-title">Quick suggestions:</p>
                    <div className="suggestion-buttons">
                      {(showAllSuggestions ? suggestedMessages : suggestedMessages.slice(0, 3)).map((msg, index) => (
                        <button
                          key={index}
                          className="suggestion-btn"
                          onClick={() => setMessageText(msg)}
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                    {suggestedMessages.length > 3 && (
                      <button
                        className="toggle-suggestions"
                        onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                      >
                        {showAllSuggestions ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                </div>
                
                <button 
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  Send Message
                </button>
                
                {messageSent && (
                  <div className="success-message">
                    <svg viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span>Message sent successfully!</span>
                  </div>
                )}
              </>
            ) : (
              <div className="login-prompt">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <p>Please log in to message the property owner</p>
                <a href="/login" className="login-link">Log In</a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ListingDetailsPage;