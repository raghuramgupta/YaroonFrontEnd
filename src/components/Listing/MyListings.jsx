import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyListings.css';
import Header from '../Header/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSort, faSortUp, faSortDown, faFilter } from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';
import config from '../../config';

/**
 * MyListings – shows two tabbed views:
 * 1. "Roommate Needed" – the current user's active listings
 * 2. "Rooms Needed" – wanted‑room listings posted by any user
 */
const MyListings = () => {
  const navigate = useNavigate();
const [wantedFilters, setWantedFilters] = useState({
  preferredLocation: '',
  budget: '',
  postedOn: ''
});
  // state
  const [listings, setListings] = useState([]);            // active property listings that belong to the current user
  const [wantedListings, setWantedListings] = useState([]); // people looking for rooms
  const [activeTab, setActiveTab] = useState('roommate');   // "roommate" | "rooms"
  const [filters, setFilters] = useState({
    propertyAddress: '',
    rent: '',
    availableFrom: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });
  const [showFilters, setShowFilters] = useState(false);
  const currentUserId = localStorage.getItem('currentUser');
  const [showWantedFilters, setShowWantedFilters] = useState(false);
  /* ---------------------------------------------------------------------- */
  /* Fetch data once on mount                                               */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchUserListings(), fetchWantedListings()]);
    };
    fetchData();
  }, []);

  // fetch the current user's listings (roommate needed)
  const fetchUserListings = async () => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (!currentUserKey) return;

    try {
      const res = await fetch(
        `${config.apiBaseUrl}/api/listings/user/${encodeURIComponent(currentUserKey)}`
      );

      if (!res.ok) {
        console.error('Server error:', await res.text());
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) setListings(data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  };
  
  // fetch wanted‑room listings (rooms needed)
  const fetchWantedListings = async () => {
    const currentUserKey = localStorage.getItem('currentUser');
    if (!currentUserKey) return;

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/wanted-listings/user/${encodeURIComponent(currentUserKey)}`);

      if (!res.ok) {
        console.error('Server error:', await res.text());
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) setWantedListings(data);
    } catch (err) {
      console.error('Error fetching wanted listings:', err);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Sorting and Filtering                                                  */
  /* ---------------------------------------------------------------------- */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return faSort;
    return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
  };

  const filteredAndSortedListings = () => {
    let filteredListings = [...listings];
    
    // Apply filters
    filteredListings = filteredListings.filter(listing => {
      return (
        (listing.propertyAddress || '').toLowerCase().includes(filters.propertyAddress.toLowerCase()) &&
        (listing.rent || '').toString().includes(filters.rent) &&
        (listing.availableFrom || '').toLowerCase().includes(filters.availableFrom.toLowerCase())
      );
    });
    
    // Apply sorting
    if (sortConfig.key) {
      filteredListings.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'rent') {
          // Numeric comparison for rent
          return sortConfig.direction === 'ascending' 
            ? (parseFloat(aValue) - parseFloat(bValue))
            : (parseFloat(bValue) - parseFloat(aValue));
        } else {
          // String comparison for other fields
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    
    return filteredListings;
  };

  /* ---------------------------------------------------------------------- */
  /* Actions – edit / delete / archive / share (only for own listings)      */
  /* ---------------------------------------------------------------------- */
  const handleArchive = async (listingId) => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/listings/${listingId}/archive`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
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
      const res = await fetch(`${config.apiBaseUrl}/api/listings/${listingId}`, {
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

  const handleEdit = (listingId) => navigate(`/edit-listing/${listingId}`);;

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
  const handleWantedEdit = (listingId) => navigate(`/edit-wanted-listing/${listingId}`);

  const handleWantedDelete = async (id) => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/wanted-listings/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setWantedListings((prev) => prev.filter((l) => l._id !== id));
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Wanted listing delete failed:', err);
    }
  };

  const shareWanted = (platform, listing) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Looking for a room in ${listing.preferredLocation} (₹${listing.budget})`);
    let shareUrl = '';
    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    } else if (platform === 'instagram') {
      return; // no direct share support
    }
    window.open(shareUrl, '_blank');
  };
  const filteredAndSortedWantedListings = () => {
  return [...wantedListings].filter(listing => {
    const matchesLocation = (listing.preferredLocation || '')
      .toLowerCase()
      .includes(wantedFilters.preferredLocation.toLowerCase());
      
    const matchesBudget = (listing.budget || '')
      .toString()
      .includes(wantedFilters.budget);
      
    const matchesDate = new Date(listing.createdAt)
      .toLocaleDateString()
      .includes(wantedFilters.postedOn);
      
    return matchesLocation && matchesBudget && matchesDate;
  });
};
  /* ---------------------------------------------------------------------- */
  /* Render helpers                                                         */
  /* ---------------------------------------------------------------------- */
  const renderRoommateNeeded = () => {
    const displayListings = filteredAndSortedListings();
    
    return displayListings.length === 0 ? (
      <div>
        <table className="listings-table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th>#</th>
              <th className="address-column">
                <div className="header-with-sort">
                  <div className="sortable-header" onClick={() => requestSort('propertyAddress')}>
                    Address
                    <FontAwesomeIcon icon={getSortIcon('propertyAddress')} className="sort-icon" />
                  </div>
                </div>
              </th>
              <th>
                <div className="header-with-sort">
                  <div className="sortable-header" onClick={() => requestSort('rent')}>
                    Rent (₹)
                    <FontAwesomeIcon icon={getSortIcon('rent')} className="sort-icon" />
                  </div>
                </div>
              </th>
              <th>
                <div className="header-with-sort">
                  <div className="sortable-header" onClick={() => requestSort('availableFrom')}>
                    Available From
                    <FontAwesomeIcon icon={getSortIcon('availableFrom')} className="sort-icon" />
                  </div>
                </div>
              </th>
              <th colSpan={2}>Actions</th>
            </tr>
            {showFilters && (
              <tr className="filter-row">
                <th></th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter address..."
                    value={filters.propertyAddress}
                    onChange={(e) => handleFilterChange('propertyAddress', e.target.value)}
                    className="filter-input"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter rent..."
                    value={filters.rent}
                    onChange={(e) => handleFilterChange('rent', e.target.value)}
                    className="filter-input"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter date..."
                    value={filters.availableFrom}
                    onChange={(e) => handleFilterChange('availableFrom', e.target.value)}
                    className="filter-input"
                  />
                </th>
                <th colSpan={2}>
                                  </th>
              </tr>
            )}
          </thead>
          <tbody >
            <tr>
              <td colSpan="6" className="no-results">No listings found matching your filters</td>
            </tr>
          </tbody>
        </table>
      </div>
    ) : (
      <div>
        <table className="listings-table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th>#</th>
              <th className="address-column">
                <div className="header-with-sort">
                  <div className="sortable-header" onClick={() => requestSort('propertyAddress')}>
                    <button 
                    onClick={() => setShowFilters(!showFilters)} 
                    className="filter-toggle-btn"
                    title="Toggle filters"
                  >
                    <FontAwesomeIcon icon={faFilter} />
                  </button>Address
                    <FontAwesomeIcon icon={getSortIcon('propertyAddress')} className="sort-icon" />
                  </div>
                </div>
              </th>
              <th>
                <div className="header-with-sort">
                  <div className="sortable-header" onClick={() => requestSort('rent')}>
                    Rent (₹)
                    <FontAwesomeIcon icon={getSortIcon('rent')} className="sort-icon" />
                  </div>
                </div>
              </th>
              <th>
                <div className="header-with-sort">
                  <div className="sortable-header" onClick={() => requestSort('availableFrom')}>
                    Available From
                    <FontAwesomeIcon icon={getSortIcon('availableFrom')} className="sort-icon" />
                  </div>
                </div>
              </th>
              <th colSpan={1}>
                <div className="actions-header">
                  Actions
                  
                </div>
              </th>
              <th>Share</th>
            </tr>
            {showFilters && (
              <tr className="filter-row">
                <th></th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter address..."
                    value={filters.propertyAddress}
                    onChange={(e) => handleFilterChange('propertyAddress', e.target.value)}
                    className="filter-input"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter rent..."
                    value={filters.rent}
                    onChange={(e) => handleFilterChange('rent', e.target.value)}
                    className="filter-input"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    placeholder="Filter date..."
                    value={filters.availableFrom}
                    onChange={(e) => handleFilterChange('availableFrom', e.target.value)}
                    className="filter-input"
                  />
                </th>
                <th colSpan={2}>
                  
                </th>
              </tr>
            )}
          </thead>
          <tbody>
            {displayListings.map((listing, idx) => (
              <tr key={listing._id}>
                <td>{idx + 1}</td>
                <td className="address-column">{listing.propertyAddress || 'N/A'}</td>
                <td>{listing.rent || 'N/A'}</td>
                <td>{listing.availableFrom || 'N/A'}</td>
                {/* Manage listing */}
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(listing._id)} className="action-btn edit-btn">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button onClick={() => handleDelete(listing._id)} className="action-btn delete-btn">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button onClick={() => handleArchive(listing._id)} className="action-btn archive-btn">
                      Archive
                    </button>
                  </div>
                </td>
                {/* Social share */}
                <td>
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
      </div>
    );
  };

  const renderRoomsNeeded = () => {
  const displayListings = filteredAndSortedWantedListings();
  
  return displayListings.length === 0 ? (
    <div>
      <table className="listings-table" style={{ fontSize: '12px' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>
              <div className="header-with-sort">
                Preferred Location
              </div>
            </th>
            <th>
              <div className="header-with-sort">
                Budget (₹)
              </div>
            </th>
            <th>
              <div className="header-with-sort">
                Posted On
              </div>
            </th>
            <th>
              <div className="actions-header">
                Actions
                <button 
                  onClick={() => setShowWantedFilters(!showWantedFilters)} 
                  className="filter-toggle-btn"
                  title="Toggle filters"
                >
                  <FontAwesomeIcon icon={faFilter} />
                </button>
              </div>
            </th>
            <th>Share</th>
          </tr>
          {showWantedFilters && (
            <tr className="filter-row">
              <th></th>
              <th>
                <input
                  type="text"
                  placeholder="Filter location..."
                  value={wantedFilters.preferredLocation}
                  onChange={(e) => setWantedFilters({...wantedFilters, preferredLocation: e.target.value})}
                  className="filter-input"
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="Filter budget..."
                  value={wantedFilters.budget}
                  onChange={(e) => setWantedFilters({...wantedFilters, budget: e.target.value})}
                  className="filter-input"
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="Filter date..."
                  value={wantedFilters.postedOn}
                  onChange={(e) => setWantedFilters({...wantedFilters, postedOn: e.target.value})}
                  className="filter-input"
                />
              </th>
              <th colSpan={1}>
                
              </th>
            </tr>
          )}
        </thead>
        <tbody>
          <tr>
            <td colSpan="6" className="no-results">No wanted listings found matching your filters</td>
          </tr>
        </tbody>
      </table>
    </div>
  ) : (
    <table className="listings-table" style={{ fontSize: '12px' }}>
      <thead>
        <tr>
          <th>#</th>
          <th>
            <div className="header-with-sort">
              Preferred Location
            </div>
          </th>
          <th>
            <div className="header-with-sort">
              Budget (₹)
            </div>
          </th>
          <th>
            <div className="header-with-sort">
              Posted On
            </div>
          </th>
          <th>
            <div className="actions-header">
              Actions
              <button 
                onClick={() => setShowWantedFilters(!showWantedFilters)} 
                className="filter-toggle-btn"
                title="Toggle filters"
              >
                <FontAwesomeIcon icon={faFilter} />
              </button>
            </div>
          </th>
          <th>Share</th>
        </tr>
        {showWantedFilters && (
          <tr className="filter-row">
            <th></th>
            <th>
              <input
                type="text"
                placeholder="Filter location..."
                value={wantedFilters.preferredLocation}
                onChange={(e) => setWantedFilters({...wantedFilters, preferredLocation: e.target.value})}
                className="filter-input"
              />
            </th>
            <th>
              <input
                type="text"
                placeholder="Filter budget..."
                value={wantedFilters.budget}
                onChange={(e) => setWantedFilters({...wantedFilters, budget: e.target.value})}
                className="filter-input"
              />
            </th>
            <th>
              <input
                type="text"
                placeholder="Filter date..."
                value={wantedFilters.postedOn}
                onChange={(e) => setWantedFilters({...wantedFilters, postedOn: e.target.value})}
                className="filter-input"
              />
            </th>
            <th colSpan={1}>
              
            </th>
          </tr>
        )}
      </thead>
      <tbody>
        {displayListings.map((wl, idx) => (
          <tr key={wl._id}>
            <td>{idx + 1}</td>
            <td>{wl.preferredLocation || 'N/A'}</td>
            <td>{wl.budget || 'N/A'}</td>
            <td>{new Date(wl.createdAt).toLocaleDateString()}</td>
            <td>
              <div className="action-buttons">
                <button
                  onClick={() => handleWantedEdit(wl._id)}
                  className="action-btn edit-btn"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleWantedDelete(wl._id)}
                  className="action-btn delete-btn"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </td>
            <td>
              <div className="action-buttons">
                <button
                  onClick={() => shareWanted('facebook', wl)}
                  className="share-btn facebook-btn"
                >
                  <FontAwesomeIcon icon={faFacebookF} />
                </button>
                <button
                  onClick={() => shareWanted('twitter', wl)}
                  className="share-btn twitter-btn"
                >
                  <FontAwesomeIcon icon={faTwitter} />
                </button>
                <button
                  onClick={() => shareWanted('instagram', wl)}
                  className="share-btn instagram-btn"
                >
                  <FontAwesomeIcon icon={faInstagram} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

  /* ---------------------------------------------------------------------- */
  /* JSX                                                                    */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="my-listings-container">
      {/* Tab controls */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'roommate' ? 'active' : ''}`}
          onClick={() => setActiveTab('roommate')}
        >
          Roommate Needed
        </button>
        <button
          className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          Rooms Needed
        </button>
      </div>

      {/* Tab panels */}
      <div className="tab-panel">
        {activeTab === 'roommate' ? renderRoommateNeeded() : renderRoomsNeeded()}
      </div>
    </div>
  );
};

export default MyListings;