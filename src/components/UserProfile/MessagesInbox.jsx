import React, { useEffect, useState, useRef } from 'react';
import Header from '../Header/Header';
import './MessagesInbox.css';
import config from '../../config';

const MessagesInbox = () => {
  const [messages, setMessages] = useState([]);
  const [groupedMessages, setGroupedMessages] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [hasPostedProperty, setHasPostedProperty] = useState(false);

  const messageRefs = useRef({});
  const messagesEndRef = useRef(null);
  
  // Suggested messages for tenants (users looking for properties)
  const tenantSuggestedMessages = [
    "Can you arrange a viewing?",
    "Is the rent negotiable?",
    "Is the property still available?",
    "How far is the nearest metro/bus stop?",
    "Can I schedule a call to discuss?",
    "Can you share more photos or a video tour?"
  ];
  
  // Suggested messages for landlords (users who posted properties)
  const landlordSuggestedMessages = [
    "Would you like to view the property?",
    "Can you send me your profile?",
    "What's your profession?",
    "Where are you from?",
    "When do you want to move in?",
    "Do you have any references?"
  ];

  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('currentUser');
    if (userId) {
      setCurrentUser(userId);
      setIsLoggedIn(true);
      fetchMessages(userId);
      checkIfUserHasProperties(userId);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [groupedMessages, selectedPartner]);

  const checkIfUserHasProperties = async (userId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/properties/user/${userId}`);
      if (response.ok) {
        const properties = await response.json();
        setHasPostedProperty(properties.length > 0);
      }
    } catch (err) {
      console.error('Error checking user properties:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (userId) => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        fetch(`${config.apiBaseUrl}/api/messages/received/${userId}`),
        fetch(`${config.apiBaseUrl}/api/messages/sent/${userId}`)
      ]);

      if (receivedRes.ok && sentRes.ok) {
        const received = await receivedRes.json();
        const sent = await sentRes.json();
        
        // Merge with existing messages to preserve read status
        setMessages(prevMessages => {
          const combined = [...received, ...sent];
          // Preserve read status from previous messages
          return combined.map(newMsg => {
            const existingMsg = prevMessages.find(m => m._id === newMsg._id);
            return existingMsg ? { ...newMsg, isRead: existingMsg.isRead } : newMsg;
          });
        });
        
        const grouped = groupByPartner([...received, ...sent], userId);
        setGroupedMessages(grouped);
        if (!selectedPartner && Object.keys(grouped).length > 0) {
          setSelectedPartner(Object.keys(grouped)[0]);
        }
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const groupByPartner = (msgs, currentUserId) => {
    const groups = {};
    msgs.forEach((msg) => {
      const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      if (!groups[partnerId]) groups[partnerId] = [];
      groups[partnerId].push(msg);
    });
    return groups;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setTyping(false);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser,
          receiverId: selectedPartner,
          listingAddress: 'Some Listing',
          content: newMessage,
          isRead: false,
          timestamp: new Date(),
          replyToMessageId: replyToMessageId || null,
        })
      });

      if (response.ok) {
        setNewMessage('');
        setReplyToMessageId(null);
        fetchMessages(currentUser);
      } else {
        console.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!typing) {
      setTyping(true);
      setIsTyping(true);
      setTimeout(() => {
        setTyping(false);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/messages/read/${messageId}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update messages array
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === messageId ? { ...msg, isRead: true } : msg
          )
        );
        
        // Update groupedMessages
        setGroupedMessages(prevGrouped => {
          const updated = { ...prevGrouped };
          for (const partnerId in updated) {
            updated[partnerId] = updated[partnerId].map(msg =>
              msg._id === messageId ? { ...msg, isRead: true } : msg
            );
          }
          return updated;
        });
      } else {
        console.error('Failed to mark as read');
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const scrollToMessage = (msgId) => {
    const element = messageRefs.current[msgId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 2000);
    }
  };

  const filteredGroupedMessages = Object.entries(groupedMessages)
    .map(([partnerId, msgs]) => [partnerId, msgs.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))])
    .filter(([_, msgs]) => msgs.length > 0);

  return (
    <div className="messages-inbox">
      <Header isLoggedIn={isLoggedIn} />
      <div className="inbox-container">
        <div className="conversation-list">
          <div className="conversation-header">
            <h2>Messages</h2>
            <div className="search-container">
              <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          {filteredGroupedMessages.length === 0 ? (
            <div className="empty-state">
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="conversation-items">
              {filteredGroupedMessages.map(([partnerId, msgs]) => {
                const latestMessage = msgs[msgs.length - 1];
                const unreadCount = msgs.reduce((count, msg) => 
                  (!msg.isRead && msg.receiverId === currentUser) ? count + 1 : count, 0);
                
                return (
                  <div
                    key={partnerId}
                    className={`conversation-item ${selectedPartner === partnerId ? 'active' : ''}`}
                    onClick={() => setSelectedPartner(partnerId)}
                  >
                    <div className="avatar">
                      {partnerId.charAt(0).toUpperCase()}
                    </div>
                    <div className="conversation-details">
                      <div className="conversation-header">
                        <span className="partner-name">{partnerId}</span>
                        <span className="message-time">
                          {new Date(latestMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <p className="message-preview">
                          {latestMessage.senderId === currentUser && 'You: '}
                          {latestMessage.content.slice(0, 30)}{latestMessage.content.length > 30 ? '...' : ''}
                        </p>
                        {unreadCount > 0 && (
                          <span className="unread-badge">{unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="message-view">
          {selectedPartner && groupedMessages[selectedPartner] ? (
            <>
              <div className="message-header">
                <div className="header-content">
                  <div className="partner-avatar">
                    {selectedPartner.charAt(0).toUpperCase()}
                  </div>
                  <div className="partner-info">
                    <h3>{selectedPartner}</h3>
                    {isTyping && <div className="typing-indicator">typing...</div>}
                  </div>
                </div>
              </div>
              
              <div className="message-scroll-container">
                <div className="messages">
                  {groupedMessages[selectedPartner].map((msg) => {
                    const repliedMsg = msg.replyToMessageId
                      ? messages.find(m => m._id === msg.replyToMessageId)
                      : null;

                    return (
                      <div
                        key={msg._id}
                        ref={(el) => (messageRefs.current[msg._id] = el)}
                        className={`message ${msg.senderId === currentUser ? 'sent' : 'received'}`}
                        onClick={() => !msg.isRead && handleMarkAsRead(msg._id)}
                      >
                        <div className="message-content">
                          {repliedMsg && (
                            <div 
                              className="reply-preview"
                              onClick={(e) => {
                                e.stopPropagation();
                                scrollToMessage(repliedMsg._id);
                              }}
                            >
                              <div className="reply-indicator">Replying to</div>
                              <div className="quoted-message">
                                {repliedMsg.content.slice(0, 60)}
                                {repliedMsg.content.length > 60 && '...'}
                              </div>
                            </div>
                          )}
                          
                          <div className="message-bubble">
                            <div className="bubble-content">
                              <p>{msg.content}</p>
                              <div className="message-meta">
                                <span className="timestamp">
                                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                {msg.senderId === currentUser && (
                                  <span className={`read-status ${msg.isRead ? 'read' : 'delivered'}`}>
                                    {msg.isRead ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="message-actions">
                              <button 
                                className="action-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenFor(prev => prev === msg._id ? null : msg._id);
                                }}
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                  <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                </svg>
                              </button>
                              
                              {menuOpenFor === msg._id && (
                                <div className="message-menu">
                                  <button 
                                    className="menu-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyToMessageId(msg._id);
                                      setMenuOpenFor(null);
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" width="16" height="16" style={{marginRight: '8px'}}>
                                      <path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                                    </svg>
                                    Reply
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              <div className="message-input-fixed">
                {replyToMessageId && (
                  <div className="reply-indicator">
                    <div className="indicator-content">
                      Replying to: {messages.find(m => m._id === replyToMessageId)?.content.slice(0, 60)}
                      {messages.find(m => m._id === replyToMessageId)?.content.length > 60 && '...'}
                    </div>
                    <button 
                      className="cancel-reply"
                      onClick={() => setReplyToMessageId(null)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="suggested-messages">
                  {(showAllSuggestions 
                    ? (hasPostedProperty ? landlordSuggestedMessages : tenantSuggestedMessages)
                    : (hasPostedProperty ? landlordSuggestedMessages : tenantSuggestedMessages).slice(0, 3)
                  ).map((msg, index) => (
                    <button
                      key={index}
                      className="suggestion"
                      onClick={() => setNewMessage(msg)}
                    >
                      {msg}
                    </button>
                  ))}
                  {(hasPostedProperty ? landlordSuggestedMessages : tenantSuggestedMessages).length > 3 && (
                    <button
                      className="show-more"
                      onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                    >
                      {showAllSuggestions ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
                
                <div className="input-wrapper">
                  <textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    rows="1"
                  />
                  <button 
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-conversation">
              <div className="empty-content">
                <svg viewBox="0 0 24 24" width="48" height="48">
                  <path fill="#0084ff" d="M12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8m0-2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 13l-4-4h8z"/>
                </svg>
                <h3>Select a conversation</h3>
                <p>Choose an existing conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesInbox;