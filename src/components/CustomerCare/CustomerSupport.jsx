import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Header/Header';
import './CustomerSupport.css';
import config from '../../config'

const CustomerSupport = () => {
  const [title, setTitle] = useState('');
  const [issueType, setIssueType] = useState('');
  const [user, setUser] = useState(null);
  const [listingId, setListingId] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingTicket, setEditingTicket] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [isFetchingListings, setIsFetchingListings] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUserKey = localStorage.getItem('currentUser');
    setUser(currentUserKey);
    setIsLoggedIn(!!currentUserKey);
    
    if (currentUserKey) {
      fetchTickets(currentUserKey);
    }
  }, []);

  useEffect(() => {
    const fetchUserListings = async () => {
      if (issueType === 'Problem with a listing' && user) {
        try {
          setIsFetchingListings(true);
          let parsedUserId;
          try {
            const userObj = JSON.parse(user);
            parsedUserId = userObj._id || userObj.id || user;
          } catch {
            parsedUserId = user;
          }

          const response = await axios.get(`${config.apiBaseUrl}/api/listings/user/${encodeURIComponent(parsedUserId)}`);
          setUserListings(response.data);
        } catch (error) {
          console.error('Error fetching user listings:', error);
          alert('Failed to load your listings');
        } finally {
          setIsFetchingListings(false);
        }
      }
    };

    fetchUserListings();
  }, [issueType, user]);

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

  const fetchTicketDetails = async (ticketId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${config.apiBaseUrl}/api/support/${ticketId}`, {
        params: { userId: user }
      });
      setSelectedTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      alert('Failed to load ticket details');
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
    
    // Create preview URLs for images
    const urls = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviewUrls(urls);
  };

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

      const formData = new FormData();
      formData.append('title', title);
      formData.append('issueType', issueType);
      formData.append('description', description);
      formData.append('userId', userId);
      
      if (issueType === 'Problem with a listing') {
        formData.append('listingId', listingId);
      }

      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const axiosConfig = {  // Changed from 'config' to 'axiosConfig'
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      if (editingTicket) {
        const response = await axios.put(`http://localhost:5000/api/support/${editingTicket._id}`, formData, axiosConfig);
        setSuccessMessage('Support ticket updated successfully!');
        setEditingTicket(null);
      } else {
        const response = await axios.post("http://localhost:5000/api/support", formData, axiosConfig);
        setSuccessMessage('Your support ticket has been submitted successfully!');
      }

      resetForm();
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('senderType', 'user');
      formData.append('senderId', user);
      formData.append('content', newMessage);
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await axios.post(
        `${config.apiBaseUrl}/api/support/${selectedTicket._id}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSelectedTicket(response.data.ticket);
      setNewMessage('');
      setAttachments([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const resetForm = () => {
    setTitle('');
    setIssueType('');
    setListingId('');
    setDescription('');
    setAttachments([]);
    setPreviewUrls([]);
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setTitle(ticket.title);
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
      const currentUserString = localStorage.getItem('currentUser');
      let userId;
      
      try {
        const userObj = JSON.parse(currentUserString);
        userId = userObj._id || userObj.id || currentUserString;
      } catch {
        userId = currentUserString;
      }

      await axios.delete("http://localhost:5000/api/support/${ticketId}", {
        params: { userId }
      });

      setSuccessMessage('Ticket deleted successfully!');
      await fetchTickets(userId);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      alert(`Failed to delete ticket: ${error.response?.data?.message || error.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingTicket(null);
    resetForm();
  };

  const renderAttachmentPreview = (attachment) => {
  switch (attachment.type) {
    case 'image':
      return <img src={attachment.url} alt={attachment.originalName} className="attachment-preview" />;
    case 'video':
      return (
        <video controls className="attachment-preview">
          <source src={attachment.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    default:
      return (
        <div className="file-attachment">
          <a href={attachment.url} download>
            {attachment.originalName}
          </a>
        </div>
      );
    }
  };

  const renderNewTicketForm = () => (
    <div className="support-form">
      <h2>{editingTicket ? 'Edit Support Ticket' : 'Submit a New Support Request'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Brief description of your issue"
          />
        </div>

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
            <label>Select Listing</label>
            {isFetchingListings ? (
              <p>Loading your listings...</p>
            ) : userListings.length > 0 ? (
              <select
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                required
              >
                <option value="">Select a listing</option>
                {userListings.map((listing) => (
                  <option key={listing._id} value={listing._id}>
                    {listing.title} - {listing.propertyAddress} (${listing.rent})
                  </option>
                ))}
              </select>
            ) : (
              <div className="no-listings-message">
                <p>You don't have any listings yet.</p>
                <input
                  type="text"
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  placeholder="Enter listing ID manually"
                  required
                />
              </div>
            )}
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

        <div className="form-group">
          <label>Attachments (optional)</label>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*, video/*, .pdf, .doc, .docx"
          />
          <div className="attachment-previews">
            {previewUrls.map((url, index) => (
              url && <img key={index} src={url} alt="Preview" className="attachment-preview" />
            ))}
            {attachments.map((file, index) => (
              !file.type.startsWith('image/') && (
                <div key={index} className="file-attachment">
                  {file.name}
                </div>
              )
            ))}
          </div>
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
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id}>
                <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                <td>{ticket.title}</td>
                <td>{ticket.issueType}</td>
                <td className={`status ${ticket.status.toLowerCase()}`}>
                  {ticket.status}
                </td>
                <td className="actions-cell">
                  <button 
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setActiveTab('conversation');
                    }}
                    className="view-button"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => handleEditTicket(ticket)}
                    className="edit-button"
                    disabled={ticket.status !== 'open'}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTicket(ticket._id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderConversation = () => {
    if (!selectedTicket) return <div>No ticket selected</div>;

    return (
      <div className="conversation-view">
        <button 
          className="back-button"
          onClick={() => setActiveTab('existing')}
        >
          &larr; Back to Tickets
        </button>

        <div className="ticket-header">
          <h2>{selectedTicket.title}</h2>
          <div className="ticket-meta">
            <span className={`status ${selectedTicket.status.toLowerCase()}`}>
              {selectedTicket.status}
            </span>
            <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="messages-container">
          {selectedTicket.messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.senderType === 'user' ? 'user-message' : 'staff-message'}`}
            >
              <div className="message-header">
                <span className="sender">
                  {message.senderType === 'user' ? 'You' : 'Support Agent'}
                </span>
                <span className="timestamp">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="message-content">
                {message.content}
              </div>
              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map((attachment, idx) => (
                    <div key={idx} className="attachment">
                      {renderAttachmentPreview(attachment)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="message-composer">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            rows="3"
          />
          <div className="composer-controls">
            <div className="file-upload">
              <label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*, video/*, .pdf, .doc, .docx"
                />
                Attach Files
              </label>
              {attachments.length > 0 && (
                <span className="file-count">{attachments.length} file(s) selected</span>
              )}
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && attachments.length === 0}
            >
              Send
            </button>
          </div>
          <div className="attachment-previews">
            {previewUrls.map((url, index) => (
              url && <img key={index} src={url} alt="Preview" className="attachment-preview" />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="customer-support">
      <Header isLoggedIn={isLoggedIn} />
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      {activeTab !== 'conversation' && (
        <div className="support-tabs">
          <button 
            className={`tab-button ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => {
              setEditingTicket(null);
              setActiveTab('new');
            }}
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
      )}
      
      <div className="tab-content">
        {activeTab === 'new' && renderNewTicketForm()}
        {activeTab === 'existing' && renderExistingTickets()}
        {activeTab === 'conversation' && renderConversation()}
      </div>  
    </div>
  );
};

export default CustomerSupport;