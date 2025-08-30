import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StaffHeader from '../Header/StaffHeader';
import './TicketManagement.css';
import TicketDetailModal from './TicketDetailModal';

const TicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [selectedAssignments, setSelectedAssignments] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const currentUser = JSON.parse(localStorage.getItem('currentStaff'));
        if (currentUser) {
          setCurrentUserId(currentUser._id || currentUser.email);
        } else {
          throw new Error('No user logged in');
        }

        const [ticketsRes, staffRes] = await Promise.all([
          axios.get('http://localhost:5000/api/support/all', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }),
          axios.get('http://localhost:5000/api/staff/staff', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            params: {
              fields: '_id,name,email,role'
            }
          })
        ]);
        
        setTickets(ticketsRes.data);
        setStaffMembers(staffRes.data);

        const initialAssignments = {};
        ticketsRes.data.forEach(ticket => {
          initialAssignments[ticket._id] = 
            ticket.assignedTo?._id?.toString() ||
            ticket.assignedTo?.toString() || 
            '';
        });
        setSelectedAssignments(initialAssignments);
      } catch (err) {
        console.error('API Error:', err);
        setError(err.response?.data?.message || 
                err.message || 
                'Error fetching data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter]);

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const handleUpdateTicket = async (updatedData) => {
  try {
    const formData = new FormData();
    
    formData.append('status', updatedData.status || '');
    formData.append('assignedTo', updatedData.assignedTo || '');
    formData.append('notes', updatedData.assignmentNotes || '');
    formData.append('messageContent', updatedData.newMessage || '');

    if (updatedData.attachments) {
      updatedData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await axios.put(
      `http://localhost:5000/api/support/${selectedTicket._id}`,
      formData
    );

    // Handle success...
  } catch (err) {
    let errorMessage = err.response?.data?.error || err.message;
    
    // Handle validation errors
    if (err.response?.data?.details) {
      const validationErrors = Object.values(err.response.data.details)
        .map(e => e.message)
        .join(', ');
      errorMessage = `Validation errors: ${validationErrors}`;
    }
    
    setError(errorMessage || 'Error updating ticket');
    throw err;
  }
};
  const handleSelectionChange = (ticketId, staffId) => {
    setSelectedAssignments(prev => ({
      ...prev,
      [ticketId]: staffId
    }));
  };

  const handleUpdateAssignment = async (ticketId) => {
    try {
      setIsAssigning(true);
      const staffId = selectedAssignments[ticketId];
      
      if (!staffId) {
        setError('Please select a staff member to assign');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/support/${ticketId}/assign`, 
        { staffId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === ticketId 
            ? response.data.ticket
            : ticket
        )
      );

      setError('');
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err.response?.data?.error || 'Failed to assign ticket');
      
      setSelectedAssignments(prev => ({
        ...prev,
        [ticketId]: tickets.find(t => t._id === ticketId)?.assignedTo?._id || ''
      }));
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    
    const subject = ticket.subject ? ticket.subject.toLowerCase() : '';
    const ticketId = ticket.ticketId ? ticket.ticketId.toLowerCase() : '';
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = subject.includes(searchTermLower) || 
                         ticketId.includes(searchTermLower);
    
    const isAssignedToMe = ticket.assignedTo && 
      (ticket.assignedTo._id?.toString() === currentUserId?.toString() || 
       ticket.assignedTo.toString() === currentUserId?.toString() ||
       ticket.assignedTo.email === currentUserId);
    
    const matchesAssignment = activeTab !== 'assigned' || isAssignedToMe;
    
    return matchesStatus && matchesSearch && matchesAssignment;
  });

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      setLoading(true);
      await axios.put(
        `http://localhost:5000/api/support/${ticketId}/status`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === ticketId 
            ? { ...ticket, status: newStatus }
            : ticket
        )
      );
      
      setError('');
    } catch (err) {
      console.error('Status update error:', err);
      setError(err.response?.data?.message || 'Error updating ticket status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="ticket-management-container">
      <StaffHeader />
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading tickets...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="ticket-management-container">
      <StaffHeader />
      <div className="alert alert-danger my-4">{error}</div>
      <button 
        className="btn btn-primary"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="ticket-management-container">
      <StaffHeader />
      <div className="ticket-management-header">
        <h1>Support Ticket Management</h1>
        <p className="subtitle">Manage and assign support tickets to your team members</p>
      </div>

      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Tickets
        </button>
        <button 
          className={`tab-button ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          My Assigned Tickets
        </button>
      </div>

      <div className="ticket-controls">
        <div className="search-filter-container">
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search tickets by subject or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control search-input"
            />
          </div>
          
          <div className="filter-dropdown">
            <label>Filter by Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ticket-stats">
        <div className="stat-card total">
          <h3>{filteredTickets.length}</h3>
          <p>{activeTab === 'assigned' ? 'My Tickets' : 'Total Tickets'}</p>
        </div>
        <div className="stat-card open">
          <h3>{filteredTickets.filter(t => t.status === 'open').length}</h3>
          <p>Open</p>
        </div>
        <div className="stat-card in-progress">
          <h3>{filteredTickets.filter(t => t.status === 'in-progress').length}</h3>
          <p>In Progress</p>
        </div>
        <div className="stat-card resolved">
          <h3>{filteredTickets.filter(t => t.status === 'resolved').length}</h3>
          <p>Resolved</p>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="no-tickets">
          <i className="bi bi-inbox"></i>
          <h4>No tickets found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="ticket-table-container">
          {error && (
            <div className="alert alert-danger mb-3">
              {error}
              <button 
                type="button" 
                className="btn-close float-end" 
                onClick={() => setError('')}
              />
            </div>
          )}
          
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => {
                const isAssignedToCurrentUser = ticket.assignedTo && 
                  (ticket.assignedTo._id?.toString() === currentUserId?.toString() || 
                   ticket.assignedTo.toString() === currentUserId?.toString() ||
                   ticket.assignedTo.email === currentUserId);
                
                return (
                  <tr key={ticket._id}>
                    <td className="ticket-id">#{ticket.ticketId || 'N/A'}</td>
                    <td className="ticket-subject">
                      {ticket.issueType || 'No subject'}
                      {activeTab === 'all' && isAssignedToCurrentUser && (
                        <span className="assigned-to-me-badge">Assigned to me</span>
                      )}
                      {ticket.description && (
                        <span className="ticket-description-tooltip" data-tooltip={ticket.description}>
                          <i className="bi bi-info-circle"></i>
                        </span>
                      )}
                    </td>
                    <td>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                        className={`status-select ${ticket.status}`}
                        disabled={isAssigning}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}</td>
                    <td>
                      <div className="assignment-container">
                        <select
                          value={selectedAssignments[ticket._id] || ''}
                          onChange={(e) => handleSelectionChange(ticket._id, e.target.value)}
                          className="assign-select"
                          disabled={isAssigning}
                        >
                          <option value="">Unassigned</option>
                          {staffMembers.map(staff => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name} ({staff.role})
                            </option>
                          ))}
                        </select>
                        <button 
                          className={`assign-btn ${selectedAssignments[ticket._id] === (ticket.assignedTo?._id || ticket.assignedTo || '') ? 'disabled' : ''}`}
                          onClick={() => handleUpdateAssignment(ticket._id)}
                          disabled={
                            selectedAssignments[ticket._id] === (ticket.assignedTo?._id || ticket.assignedTo || '') ||
                            isAssigning
                          }
                        >
                          Assign
                          {isAssigning ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <i className="bi bi-check-lg"></i>
                          )}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal should be outside the table */}
      {showModal && selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          staffMembers={staffMembers}
          onClose={() => setShowModal(false)}
          onUpdate={handleUpdateTicket}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default TicketManagement;