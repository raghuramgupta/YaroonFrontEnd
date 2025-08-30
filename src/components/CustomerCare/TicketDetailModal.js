import React, { useState } from 'react';
import './TicketManagement.css';

const TicketDetailModal = ({ ticket, staffMembers, onClose, onUpdate, currentUserId,setSelectedTicket }) => {
  const [formData, setFormData] = useState({
    status: ticket.status,
    assignedTo: ticket.assignedTo?._id || ticket.assignedTo || '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
    
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
    setIsSubmitting(true);
    setError('');
    
    const updatedTicket = await onUpdate({
      status: formData.status,
      assignedTo: formData.assignedTo,
      assignmentNotes: formData.notes,
      newMessage,  // This contains the new comment/message
      attachments  // Any files being attached
    });
    
    // Clear the form after successful submission
    setNewMessage('');
    setAttachments([]);
    setPreviewUrls([]);
  } catch (err) {
    setError(err.message || 'Failed to update ticket');
  } finally {
    setIsSubmitting(false);
  }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="ticket-conversation-modal">
        <div className="modal-header">
          <div className="ticket-header-info">
            <h3>Ticket #{ticket.ticketId || ticket._id.slice(-6).toUpperCase()}</h3>
            <div className="ticket-meta">
              <span className={`status-badge ${ticket.status}`}>
                {ticket.status}
              </span>
              {ticket.assignedTo && (
                <span className="assigned-to">
                  Assigned to: {ticket.assignedTo.name || 'Unassigned'}
                </span>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="conversation-container">
            <div className="messages-list">
              {/* Initial ticket information */}
              <div className="message-bubble system-message">
                <div className="message-header">
                  <span className="message-sender">Ticket Created</span>
                  <span className="message-time">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
                <div className="message-text">
                  <strong>Issue Type:</strong> {ticket.issueType}<br />
                  <strong>Description:</strong> {ticket.description}
                </div>
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="message-attachments">
                    {ticket.attachments.map((attachment, idx) => (
                      <div key={idx} className="attachment-item">
                        {renderAttachmentPreview(attachment)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticket history/messages */}
              {ticket.messages && ticket.messages.length > 0 ? (
                ticket.messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message-bubble ${
                      message.senderType === 'user' ? 'user-message' : 
                      message.senderType === 'staff' ? 'staff-message' : 'system-message'
                    }`}
                  >
                    <div className="message-header">
                      <span className="message-sender">
                        {message.senderType === 'user' ? 
                          (message.senderName || 'User ') : 
                          message.senderType === 'staff' ? 
                          (message.senderName || 'Support Agent') : 
                          'System'}
                      </span>
                      <span className="message-time">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <div className="message-text">
                      {message.content}
                    </div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="message-attachments">
                        {message.attachments.map((attachment, idx) => (
                          <div key={idx} className="attachment-item">
                            {renderAttachmentPreview(attachment)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-messages">
                  No messages yet. Start the conversation.
                </div>
              )}
            </div>

            <div className="message-composer">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows="3"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="composer-actions">
                  <div className="file-upload">
                    <label className="file-upload-label">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        accept="image/*, video/*, .pdf, .doc, .docx"
                        disabled={isSubmitting}
                      />
                      <span className="attach-icon">📎 Attach</span>
                    </label>
                    {attachments.length > 0 && (
                      <span className="files-count">{attachments.length} file(s)</span>
                    )}
                  </div>

                  <div className="ticket-update-fields">
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Assign To</label>
                      <select
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleChange}
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
                  </div>

                  <button
                    type="submit"
                    className="send-button"
                    disabled={isSubmitting || (!newMessage.trim() && attachments.length === 0)}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : 'Send Message'}
                  </button>
                </div>

                {previewUrls.length > 0 && (
                  <div className="attachment-previews">
                    {previewUrls.map((url, index) => (
                      url && (
                        <div key={index} className="preview-item">
                          <img src={url} alt="Preview" className="preview-image" />
                          <button 
                            type="button"
                            onClick={() => {
                              const newAttachments = [...attachments];
                              const newPreviewUrls = [...previewUrls];
                              newAttachments.splice(index, 1);
                              newPreviewUrls.splice(index, 1);
                              setAttachments(newAttachments);
                              setPreviewUrls(newPreviewUrls);
                            }}
                            className="remove-preview"
                          >
                            ×
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;