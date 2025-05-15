import React, { useEffect, useState } from 'react';
import './ListingDetailsPage.css';
import Header from '../Header/Header';

const ListingDetailsPage = () => {
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);

    if (currentUserKey) {
      setIsLoggedIn(true);
      const userProfileStr = localStorage.getItem(`userProfile_${currentUserKey}`);
      if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        // Do something with userProfile if needed
      }
    }

    const stored = localStorage.getItem('selectedListing');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Normalize amenities and images as arrays to avoid errors
      setListing({
        ...parsed,
        amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
        images: Array.isArray(parsed.images) ? parsed.images : [],
      });
    }
  }, []);

  const handleSendMessage = async () => {
    
    if (!user || !listing || !listing.userKey || !messageText.trim()) return;
      
    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId: user,
          receiverId: listing.userKey,
          listingAddress: listing.propertyAddress,
          content: messageText.trim(),
          timestamp: new Date()
        })
      });
      if (response.ok) {
        
        setMessageText('');
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 3000);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      alert('Error sending message:'+error);
    }
  };

  if (!listing) {
    return <div className="listing-details-page">No listing data found.</div>;
  }

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
        {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
          <div>
            <strong>Amenities:</strong>
            <ul>
              {listing.amenities.map((amenity, idx) => (
                <li key={idx}>{amenity}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Render Listing Images */}
        {Array.isArray(listing.images) && listing.images.length > 0 && (
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
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="message-box"
              />
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
