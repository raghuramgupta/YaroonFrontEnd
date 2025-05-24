import React, { useEffect, useState,useRef } from 'react';
import { useParams } from 'react-router-dom';
import './ListingDetailsPage.css';
import Header from '../Header/Header';

const ListingDetailsPage = () => {
  const { id: listingId } = useParams(); // 👈 get ID from URL
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typing, setTyping] = useState(false);
  const messageRefs = useRef({});
        const suggestedMessages = [
      "Can you arrange a viewing?",
      "Is the rent negotiable?",
      "Is the property still available?",
      "How far is the nearest metro/bus stop?",
      "Can I schedule a call to discuss?",
      "Can you share more photos or a video tour?"
    ];const [showAllSuggestions, setShowAllSuggestions] = useState(false);
    const [newMessage, setNewMessage] = useState('');
  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    setIsLoggedIn(!!currentUserKey);

    const fetchListing = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/listings/${listingId}?viewer=${currentUserKey || ''}`
        );
        if (!res.ok) {
          console.error('Failed to fetch listing:', res.status);
          return;
        }
        const data = await res.json();

        // Normalize arrays
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
      const response = await fetch('http://localhost:5000/api/messages', {
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

  if (!listing) return <div className="listing-details-page">Loading…</div>;

  return (
    <div className="listing-details-page">
      <Header isLoggedIn={isLoggedIn} />
      <div className="details-container">
        <h2>{listing.title}</h2>
        <p><strong>Address:</strong> {listing.propertyAddress}</p>
        <p><strong>Rent:</strong> ₹{listing.rent}</p>
        <p><strong>Description:</strong> {listing.description}</p>
        <p><strong>Available From:</strong> {listing.availableFrom}</p>
        <p><strong>Deposit:</strong> {listing.securityDepositOption}</p>
        <p><strong>Washroom type:</strong> {listing.washroomType}</p>
        <p><strong>Parking type:</strong> {listing.parkingType}</p>
        <p><strong>Room Size:</strong> {listing.roomSize}</p>
        <p><strong>Property Type:</strong> {listing.propertyStructure}</p>

        {/* Render Amenities */}
        {listing.amenities.length > 0 && (
          <div>
            <strong>Amenities:</strong>
            <ul>
              {listing.amenities.map((amenity, idx) => (
                <li key={idx}>{amenity}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Render Images */}
        {listing.images.length > 0 && (
          <div className="listing-images">
            {listing.images.map((img, idx) => (
              <img key={idx} src={img} alt={`Listing image ${idx + 1}`} />
            ))}
          </div>
        )}

        {/* Message Owner Section */}
        <div className="message-section">
          <h3>Contact Owner</h3>
          {isLoggedIn ? (
            <>
              <textarea
                value={messageText}
                onChange={handleTyping}
                placeholder="Type your message here..."
                rows={4}
                className="message-box"
              />
              <div className="suggested-messages">
                {(showAllSuggestions ? suggestedMessages : suggestedMessages.slice(0, 3)).map((msg, index) => (
                  <button
                    key={index}
                    className="suggested-message-btn"
                    onClick={() => setMessageText(msg)}
                  >
                    {msg}
                  </button>
                ))}
                {suggestedMessages.length > 3 && (
                  <button
                    className="suggested-message-btn"
                    onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                  >
                    {showAllSuggestions ? 'Less' : 'More'}
                  </button>
                )}
              </div>
              <button onClick={handleSendMessage}>Send Message</button>
              {messageSent && <p className="success-msg">Message sent!</p>}
            </>
          ) : (
            <p>Please log in to message the property owner.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetailsPage;
