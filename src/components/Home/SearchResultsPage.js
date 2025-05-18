import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './SearchResultsPage.css';
import Header from '../Header/Header';

const SearchResultsPage = () => {
  const location = useLocation();
  const { results } = location.state || { results: [] };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (currentUserKey) {
      setIsLoggedIn(true);
    }
  }, []);

  const openListingDetails = (listing) => {
  // Save selected listing if needed, optional now
  localStorage.setItem('selectedListing', JSON.stringify(listing));

  // Open details page with listing ID in the route
  const detailsUrl = `${window.location.origin}/listing-details/${listing._id}`;
  window.open(detailsUrl, '_blank');
};


  return (
    <div className="search-results-page">
      <Header isLoggedIn={isLoggedIn} />
      <div className="search-results-content">
        <h2>Search Results</h2>
        {results.length > 0 ? (
          <div className="results-grid">
            {results.map((listing, idx) => (
              <div
                key={idx}
                className="listing-card"
                onClick={() => openListingDetails(listing)}
                style={{ cursor: 'pointer' }}
              >
                <h3>{listing.title}</h3>
                <p><strong>Address:</strong> {listing.propertyAddress}</p>
                <p><strong>Rent:</strong> ₹{listing.rent}</p>
                <p><strong>Description:</strong> {listing.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No matching listings found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;

