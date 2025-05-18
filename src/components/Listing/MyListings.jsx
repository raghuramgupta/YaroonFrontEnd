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

  useEffect(() => {
    const fetchListings = async () => {
      const currentUserKey = localStorage.getItem('currentUser');
      if (!currentUserKey) return;

      try {
        const res = await fetch(`http://localhost:5000/api/listings/user/${encodeURIComponent(currentUserKey)}`);
        if (!res.ok) {
          console.error('Server error:', await res.text());
          return;
        }

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setListings(data);
        } else {
          console.log('No listings found.');
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
      }
    };

    fetchListings();
  }, []);
  const handleArchive = async (listingId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/listings/${listingId}/archive`, {
      method: 'PATCH',
    });

    const data = await res.json();

    if (res.ok) {
      // Remove archived listing from active list
      setListings((prev) => prev.filter((l) => l._id !== listingId));
    } else {
      alert(data.message || 'Archive failed');
    }
  } catch (err) {
    console.error('Archive failed:', err);
  }
};

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
      // Instagram doesn't support direct sharing via URL
      return;
    }

    window.open(shareUrl, '_blank');
  };

  return (
    <div className="my-listings-container">
      {listings.length === 0 ? (
        <p>No listings yet.</p>
      ) : (
        <table className="listings-table">
          <thead>
            <tr>
              <th>Type</th>
              <th className="address-column">Address</th>
              <th>Rent (₹)</th>
              <th>Available From</th>
              <th>Actions</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing, index) => (
              <tr key={listing._id}>
                <td>{index + 1}</td>
                <td className="address-column">{listing.propertyAddress || 'N/A'}</td>
                <td>{listing.rent || 'N/A'}</td>
                <td>{listing.availableFrom || 'N/A'}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(listing._id)} className="action-btn edit-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button onClick={() => handleDelete(listing._id)} className="action-btn delete-btn">
                      <FontAwesomeIcon icon={faTrash} />
                    </button> <button onClick={() => handleArchive(listing._id)} className="action-btn archive-btn">
      Archive
    </button></div>
                </td><td>
                  <div className="action-buttons">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyListings;
