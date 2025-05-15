import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyListings.css';
import Header from '../Header/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {const fetchListings = async () => {
      const currentUserKey = localStorage.getItem('currentUser');
      if (!currentUserKey) return;

      try {
        const res = await fetch(`http://localhost:5000/api/listings/user/${encodeURIComponent(currentUserKey)}`);
        if (!res.ok) {
          console.error('Server error:', await res.text());
          return;
        }

        const data = await res.json();
        console.log('Fetched listings:', data);  // Log the response data
        
        if (Array.isArray(data) && data.length > 0) {
          setListings(data);  // Only set if it's a valid array with listings
        } else {
          console.log('No listings found.');
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
      }
    };


    fetchListings();
  }, []);

  const handleDelete = async (listingId) => {
  
    try {
      const res = await fetch(`http://localhost:5000/api/listings/${listingId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setListings((prev) => prev.filter((l) => l._id !== listingId));
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEdit = (listingId) => {
    navigate(`/edit-listing/${listingId}`);
  };

  const share = (platform, listing) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this ${listing.accommodationType} for rent.`);

    let shareUrl = '';
    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    } else if (platform === 'instagram') {
      // Instagram doesn't support direct URL sharing like this
      return;
    }

    window.open(shareUrl, '_blank');
  };

  useEffect(() => {
  if (listings.length > 0) {
    listings.forEach(listing => console.log(`Rent: ₹${listing.rent}`));
  }
}, [listings]);

  return (
   
    <div className="my-listings-container">
      <h1>My Listings</h1>
      {listings.length === 0 ? (
        <p>No listings yet.</p>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => (
            
            <div key={listing._id} className="listing-card">
              <div className="listing-details">
                <h3>{listing.accommodationType}</h3>
                <p><strong>Address:</strong> {listing.propertyAddress || 'N/A'}</p>
                <p><strong>Rent:</strong> ₹{listing.rent || 'N/A'}</p>
                <p><strong>Available From:</strong> {listing.availableFrom || 'N/A'}</p>
              </div>
              <div className="listing-actions">
                <button onClick={() => handleEdit(listing._id)} className="action-btn edit-btn">
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button onClick={() => handleDelete(listing._id)} className="action-btn delete-btn">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <div className="share-buttons">
                  <button onClick={() => share('facebook', listing)} className="share-btn facebook-btn">
                    <FontAwesomeIcon icon={faFacebookF} />
                  </button>
                  <button onClick={() => share('twitter', listing)} className="share-btn twitter-btn">
                    <FontAwesomeIcon icon={faTwitter} />
                  </button>
                  <button onClick={() => share('instagram', listing)} className="share-btn instagram-btn">
                    <FontAwesomeIcon icon={faInstagram} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
