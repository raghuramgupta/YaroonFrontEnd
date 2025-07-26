import React, { useState } from 'react';
import './TicketManagement.css'; // Reuse your existing CSS

const TicketDetailModal = ({ ticket, staffMembers, onClose, onUpdate, currentUserId }) => {
  const [formData, setFormData] = useState({
    status: ticket.status,
    assignedTo: ticket.assignedTo?._id || ticket.assignedTo || '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setIsSubmitting(true);
    setError('');
    await onUpdate({
      status: formData.status,
      assignedTo: formData.assignedTo,
      assignmentNotes: formData.notes
    });
  } catch (err) {
    setError(err.message || 'Failed to update ticket');
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="modal-overlay">
      <div className="ticket-detail-modal">
        <div className="modal-header">
          <h3>Ticket #{ticket.ticketId || ticket._id.slice(-6).toUpperCase()}</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="ticket-info">
            <div className="info-row">
              <span className="info-label">Issue Type:</span>
              <span className="info-value">{ticket.issueType}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Description:</span>
              <p className="info-value">{ticket.description}</p>
            </div>
            <div className="info-row">
              <span className="info-label">Created At:</span>
              <span className="info-value">
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Current Status:</span>
              <span className={`status-badge ${ticket.status}`}>
                {ticket.status}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Update Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-control"
                disabled={isSubmitting}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="form-group">
              <label>Assign To</label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="form-control"
                disabled={isSubmitting}
              >
                <option value="">Unassigned</option>
                {staffMembers.map(staff => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Update Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Add update notes..."
                disabled={isSubmitting}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;