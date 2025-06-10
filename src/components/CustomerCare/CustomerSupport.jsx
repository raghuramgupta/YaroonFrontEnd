// src/components/CustomerSupport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import './CustomerSupport.css';
import config from '../../config';

const CustomerSupport = () => {
  const [issueType, setIssueType] = useState('');
  const [user, setUser] = useState(null);
  const [listingId, setListingId] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'existing'
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingTicket, setEditingTicket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    setIsLoggedIn(!!currentUserKey);
    
    if (currentUserKey) {
      fetchTickets(currentUserKey);
    }
  }, []);

  const fetchTickets = async (userId) => {
    try {
      setIsLoading(true);
      let parsedUserId;
      try {
        const userObj = JSON.parse(userId);
        parsedUserId = userObj._id || userObj.id || userId;
      } catch {
        parsedUserId = userId;
      }

      const response = await axios.get(`${config.apiBaseUrl}/api/support/user/${parsedUserId}`);
      setTickets(response.data.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      alert('Failed to load existing tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const issueTypes = [
    'Problem with a listing',
    'Can\'t create a listing',
    'Account issues',
    'Payment problems',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUserString = localStorage.getItem('currentUser');
      let userId;
      
      try {
        const userObj = JSON.parse(currentUserString);
        userId = userObj._id || userObj.id || currentUserString;
      } catch {
        userId = currentUserString;
      }

      if (!userId) {
        alert('Please login to submit a support ticket');
        navigate('/login');
        return;
      }

      if (editingTicket) {
        // Update existing ticket
        const response = await axios.put(`${config.apiBaseUrl}/api/support/${editingTicket._id}`, {
          issueType,
          listingId: issueType === 'Problem with a listing' ? listingId : undefined,
          description,
          userId: userId.toString()
        });

        setSuccessMessage('Support ticket updated successfully!');
        setEditingTicket(null);
      } else {
        // Create new ticket
        const response = await axios.post(`${config.apiBaseUrl}/api/support`, {
          issueType,
          listingId: issueType === 'Problem with a listing' ? listingId : undefined,
          description,
          userId: userId.toString()
        });

        setSuccessMessage('Your support ticket has been submitted successfully!');
      }

      setIssueType('');
      setListingId('');
      setDescription('');
      
      // Refresh tickets list
      await fetchTickets(userId);
      setActiveTab('existing');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Detailed submit error:', {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      alert(`Failed to submit support ticket: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setIssueType(ticket.issueType);
    setListingId(ticket.listingId || '');
    setDescription(ticket.description);
    setActiveTab('new');
    window.scrollTo(0, 0);
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) {
      return;
    }

    try {
      await axios.delete(`${config.apiBaseUrl}/api/support/${ticketId}`);
      setSuccessMessage('Ticket deleted successfully!');
      
      const currentUserString = localStorage.getItem('currentUser');
      let userId;
      try {
        const userObj = JSON.parse(currentUserString);
        userId = userObj._id || userObj.id || currentUserString;
      } catch {
        userId = currentUserString;
      }
      
      await fetchTickets(userId);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket');
    }
  };

  const cancelEdit = () => {
    setEditingTicket(null);
    setIssueType('');
    setListingId('');
    setDescription('');
  };

  const renderNewTicketForm = () => (
    <div className="support-form">
      <h2>{editingTicket ? 'Edit Support Ticket' : 'Submit a New Support Request'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>What's the issue about?</label>
          <select 
            value={issueType} 
            onChange={(e) => setIssueType(e.target.value)}
            required
          >
            <option value="">Select an issue type</option>
            {issueTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {issueType === 'Problem with a listing' && (
          <div className="form-group">
            <label>Listing ID (if known)</label>
            <input
              type="text"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              placeholder="Enter listing ID or address"
            />
          </div>
        )}

        <div className="form-group">
          <label>Please describe your issue</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            required
            placeholder="Provide details about your issue..."
          />
        </div>
        <div className="form-actions">
          <button type="submit">{editingTicket ? 'Update Ticket' : 'Submit Request'}</button>
          {editingTicket && (
            <button type="button" onClick={cancelEdit} className="cancel-button">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );

  const renderExistingTickets = () => (
    <div className="existing-tickets">
      <h2>Your Support Tickets</h2>
      {isLoading ? (
        <p>Loading your tickets...</p>
      ) : tickets.length === 0 ? (
        <p>You don't have any support tickets yet.</p>
      ) : (
        <table className="tickets-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id}>
                <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                <td>{ticket.issueType}</td>
                <td className="description-cell">{ticket.description}</td>
                <td className={`status ${ticket.status.toLowerCase()}`}>
                  {ticket.status}
                </td>
                <td className="actions-cell">
                  {ticket.status === 'open' && (
                    <>
                      <button 
                        onClick={() => handleEditTicket(ticket)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTicket(ticket._id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="customer-support">
      <Header isLoggedIn={isLoggedIn} />
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      <div className="support-tabs">
        <button 
          className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          {editingTicket ? 'Editing Ticket' : 'New Ticket'}
        </button>
        <button 
          className={`tab-button ${activeTab === 'existing' ? 'active' : ''}`}
          onClick={() => {
            setEditingTicket(null);
            setActiveTab('existing');
          }}
        >
          Existing Tickets
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'new' ? renderNewTicketForm() : renderExistingTickets()}
      </div>  
    </div>
  );
};

export default CustomerSupport;